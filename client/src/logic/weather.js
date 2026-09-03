/**
 * client/src/logic/weather.js — watering forecast via direct Open-Meteo or server proxy.
 */
import { api } from '../api/client.js';
import { emit, setCache, getCache } from '../state/store.js';

const WEATHER_CACHE_KEY = 'plantneeds_weather_data';

/** Reverse-geocoded friendly city name detector for global hackathon */
export function getFriendlyCityName(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return 'Local Garden';
  // Global hubs
  if (lat >= 40.4 && lat <= 41.0 && lon >= -74.3 && lon <= -73.6) return 'New York City, NY';
  if (lat >= 47.4 && lat <= 47.8 && lon >= -122.5 && lon <= -122.1) return 'Seattle, WA';
  if (lat >= 37.6 && lat <= 37.9 && lon >= -122.6 && lon <= -122.3) return 'San Francisco, CA';
  if (lat >= 33.7 && lat <= 34.3 && lon >= -118.6 && lon <= -118.1) return 'Los Angeles, CA';
  if (lat >= 51.3 && lat <= 51.7 && lon >= -0.5 && lon <= 0.3) return 'London, UK';
  if (lat >= 35.5 && lat <= 35.8 && lon >= 139.5 && lon <= 140.0) return 'Tokyo, Japan';

  // Standard global coordinates format
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
  const savedLat = typeof localStorage !== 'undefined' ? localStorage.getItem('plantneeds_weather_lat') : null;
  const savedLon = typeof localStorage !== 'undefined' ? localStorage.getItem('plantneeds_weather_lon') : null;

  // 1. If explicit prompt requested, trigger browser GPS
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
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('plantneeds_weather_lat', lat.toFixed(4));
          localStorage.setItem('plantneeds_weather_lon', lon.toFixed(4));
        }
        return { latitude: lat, longitude: lon, source: 'gps' };
      }
    } catch (err) {
      console.warn('[weather] GPS prompt error:', err?.message || err);
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

  // 3. Fallback to IP-based approximate geolocation (works in headless/GPT browsers without GPS permission)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('plantneeds_weather_lat', ipData.latitude.toFixed(4));
          localStorage.setItem('plantneeds_weather_lon', ipData.longitude.toFixed(4));
        }
        return {
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          source: 'ip'
        };
      }
    }
  } catch (ipErr) {
    console.warn('[weather] IP-based geolocation fallback failed:', ipErr?.message || ipErr);
  }

  // 4. Default fallback: Jakarta (hackathon context)
  return {
    latitude: -6.2088,
    longitude: 106.8456,
    source: 'default'
  };
}

/** Process raw Open-Meteo daily response into standardized client weather object */
export function formatOpenMeteoPayload(data) {
  if (!data?.daily?.time || !data?.daily?.precipitation_sum) {
    throw new Error('Invalid Open-Meteo daily payload');
  }
  const times = data.daily.time;
  const precipitation = data.daily.precipitation_sum;

  // Past 7 days slice (0..7)
  const recentRainMm = precipitation.slice(0, 7).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const forecastRainMm = precipitation.slice(7, 14).reduce((sum, val) => sum + (Number(val) || 0), 0);

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dailyHistory = times.slice(0, 7).map((t, idx) => {
    const val = Number(precipitation[idx]) || 0;
    const dateObj = new Date(t + 'T00:00:00');
    const dayLetter = dayNames[dateObj.getDay()] || 'D';
    return {
      date: t,
      day: dayLetter,
      rain_mm: Math.round(val * 10) / 10
    };
  });

  return {
    recent_rain_mm: Math.round(recentRainMm * 100) / 100,
    forecast_rain_mm: Math.round(forecastRainMm * 100) / 100,
    daily_history: dailyHistory,
    recommendations: [],
    data_source: 'live'
  };
}

/**
 * Fetch weather from direct client Open-Meteo or backend proxy fallback.
 * Ensures zero-failure live rainfall & 7-day distribution even if Render backend is sleeping.
 */
export async function getWateringForecast(coords = {}) {
  let { latitude, longitude } = coords;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    const resolved = await resolveUserCoordinates();
    latitude = resolved.latitude;
    longitude = resolved.longitude;
  }

  let result = null;

  // 1. Direct browser fetch to Open-Meteo (keyless, instant, resilient on Render)
  try {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,temperature_2m_max&past_days=7&forecast_days=7&timezone=auto`;
    const openRes = await fetch(apiUrl);
    if (openRes.ok) {
      const liveJson = await openRes.json();
      result = formatOpenMeteoPayload(liveJson);
    }
  } catch (directErr) {
    console.warn('[weather] Direct Open-Meteo fetch failed, attempting server proxy:', directErr.message);
  }

  // 2. Server API fallback if direct failed
  if (!result) {
    try {
      const params = new URLSearchParams({ latitude, longitude });
      result = await api(`/api/weather/forecast?${params}`);
    } catch (apiErr) {
      console.warn('[weather] Server proxy also failed:', apiErr.message);
    }
  }

  // 3. Update reactive state & cache
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


