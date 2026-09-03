/**
 * client/src/logic/weather.js — watering forecast via server proxy (C4). Day 4 (T-09).
 */
import { api } from '../api/client.js';
import { emit, setCache, getCache } from '../state/store.js';

const WEATHER_CACHE_KEY = 'plantneeds_weather_data';

/** Read current cached weather or fallback */
export function getCachedWeather() {
  const mem = getCache(WEATHER_CACHE_KEY);
  if (mem) return mem;
  try {
    const local = localStorage.getItem(WEATHER_CACHE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      setCache(WEATHER_CACHE_KEY, parsed);
      return parsed;
    }
  } catch {}
  return null;
}

/** Get user's active or detected coordinates, requesting permission if needed. */
export async function resolveUserCoordinates(promptPermission = false) {
  const savedLat = localStorage.getItem('plantneeds_weather_lat');
  const savedLon = localStorage.getItem('plantneeds_weather_lon');

  // 1. If explicit promptGps requested, try browser GPS first
  if (promptPermission && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      if (pos && pos.coords && typeof pos.coords.latitude === 'number' && typeof pos.coords.longitude === 'number') {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        localStorage.setItem('plantneeds_weather_lat', lat.toFixed(4));
        localStorage.setItem('plantneeds_weather_lon', lon.toFixed(4));
        return { latitude: lat, longitude: lon, source: 'gps' };
      }
    } catch (err) {
      console.warn('[weather] GPS prompt rejected or timed out:', err?.message || err);
    }
  }

  // 2. If stored valid coordinates exist, use them
  if (savedLat && savedLon) {
    const pLat = parseFloat(savedLat);
    const pLon = parseFloat(savedLon);
    if (!isNaN(pLat) && !isNaN(pLon)) {
      return {
        latitude: pLat,
        longitude: pLon,
        source: 'stored'
      };
    }
  }

  // 3. Fallback to Depok, Sleman, DI Yogyakarta (-7.77, 110.39)
  return {
    latitude: -7.77,
    longitude: 110.39,
    source: 'default'
  };
}

/** getWateringForecast({latitude, longitude}) → GET /api/weather/forecast → emits 'weather-updated'. */
export async function getWateringForecast(coords = {}) {
  let { latitude, longitude } = coords;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    const resolved = await resolveUserCoordinates();
    latitude = resolved.latitude;
    longitude = resolved.longitude;
  }

  const params = new URLSearchParams({ latitude, longitude });
  const result = await api(`/api/weather/forecast?${params}`);
  
  if (result) {
    const weatherData = {
      ...result,
      latitude,
      longitude,
      timestamp: Date.now()
    };
    setCache(WEATHER_CACHE_KEY, weatherData);
    try {
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData));
    } catch {}
  }

  emit('weather-updated');
  return result;
}

