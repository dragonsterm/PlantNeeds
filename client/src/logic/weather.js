/**
 * client/src/logic/weather.js — watering forecast via server proxy (C4). Day 4 (T-09).
 */
import { api } from '../api/client.js';
import { emit, setCache, getCache } from '../state/store.js';

const WEATHER_CACHE_KEY = 'plantneeds_weather_data';

/** Approximate city name from coordinates for confirmation feedback */
export function getFriendlyCityName(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return 'Your Location';
  // Indonesia / Yogyakarta / Sleman / Depok
  if (lat >= -8.2 && lat <= -7.4 && lon >= 110.1 && lon <= 110.8) {
    if (lat >= -7.85 && lat <= -7.70 && lon >= 110.35 && lon <= 110.45) return 'Depok, Sleman (DI Yogyakarta)';
    return 'Yogyakarta, Indonesia';
  }
  // Jakarta / Depok Jabar
  if (lat >= -6.5 && lat <= -6.1 && lon >= 106.6 && lon <= 107.0) {
    if (lat <= -6.35) return 'Depok, West Java';
    return 'Jakarta, Indonesia';
  }
  // New York City
  if (lat >= 40.5 && lat <= 40.95 && lon >= -74.3 && lon <= -73.7) return 'New York City, NY';
  // Seattle
  if (lat >= 47.4 && lat <= 47.8 && lon >= -122.5 && lon <= -122.1) return 'Seattle, WA';
  // Los Angeles
  if (lat >= 33.7 && lat <= 34.3 && lon >= -118.6 && lon <= -118.1) return 'Los Angeles, CA';
  // London
  if (lat >= 51.3 && lat <= 51.7 && lon >= -0.5 && lon <= 0.3) return 'London, UK';
  // Tokyo
  if (lat >= 35.5 && lat <= 35.8 && lon >= 139.5 && lon <= 140.0) return 'Tokyo, Japan';

  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

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

  // 3. Fallback to New York City (40.7128, -74.0060)
  return {
    latitude: 40.7128,
    longitude: -74.0060,
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

