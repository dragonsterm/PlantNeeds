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

  if (savedLat && savedLon && !promptPermission) {
    return {
      latitude: parseFloat(savedLat),
      longitude: parseFloat(savedLon),
      source: 'stored'
    };
  }

  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10 * 60 * 1000
        });
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      localStorage.setItem('plantneeds_weather_lat', lat.toFixed(4));
      localStorage.setItem('plantneeds_weather_lon', lon.toFixed(4));
      return { latitude: lat, longitude: lon, source: 'gps' };
    } catch (err) {
      console.info('[weather] GPS geolocation denied or timed out, using fallback coordinates');
    }
  }

  // If previous coords stored, use them
  if (savedLat && savedLon) {
    return {
      latitude: parseFloat(savedLat),
      longitude: parseFloat(savedLon),
      source: 'stored'
    };
  }

  // Default coordinate: Seattle, WA (Demo location with rain)
  return {
    latitude: 47.6062,
    longitude: -122.3321,
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

