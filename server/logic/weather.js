/**
 * server/logic/weather.js — Open-Meteo proxy + 30-min cache
 * ----------------------------------------------------------
 */
import { db } from '../db/pool.js';

const MM_PER_INCH = 25.4;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** getWateringForecast(lat, lon) → rain stats + recommendations for outdoor plants. */
export async function getWateringForecast(latitude, longitude) {
  // Validate coordinates type and range
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Invalid coordinates: both must be numbers');
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid coordinates: values cannot be NaN');
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Coordinates out of range: lat[-90,90] long[-180,180]');
  }
  
  // Try to get cached result first
  const cachedKey = `weather:${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  let cached = null;
  
  try {
    const cachedResult = await db.query(
      "SELECT payload FROM weather_cache WHERE key = $1 AND expires_at > datetime('now')",
      [cachedKey]
    );
    
    if (cachedResult.rows.length > 0) {
      cached = JSON.parse(cachedResult.rows[0].payload);
      return {
        ...cached,
        data_source: 'cache',
        source_key: cachedKey
      };
    }
  } catch (err) {
    // Cache table might not exist yet, continue without it
  }
  
  // Fetch live data from Open-Meteo
  let liveData = null;
  try {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,temperature_2m_max&past_days=7&forecast_days=7&timezone=auto`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Open-Meteo responded with ${response.status}`);
    }
    
    liveData = await response.json();
    
    // Process the forecast
    const processingResult = processWeatherForecast(liveData);
    
    // Cache the result
    try {
      const expiresAtIso = new Date(Date.now() + CACHE_TTL_MS).toISOString();
      await db.query(
        `INSERT INTO weather_cache (key, payload, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET payload = $2, expires_at = $3`,
        [cachedKey, JSON.stringify(processingResult), expiresAtIso]
      );
    } catch (cacheErr) {
      // Ignore cache errors if table doesn't exist
    }
    
    return {
      ...processingResult,
      data_source: 'live',
      source_key: cachedKey
    };
  } catch (error) {
    console.error('Open-Meteo fetch failed:', error.message);
    
    // Return fallback if no cache available
    if (!cached) {
      const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return {
        recent_rain_mm: 0,
        forecast_rain_mm: 0,
        daily_history: dayNames.map(d => ({ date: '', day: d, rain_mm: 0 })),
        recommendations: [],
        data_source: 'unavailable',
        error: error.message
      };
    }
    
    // Return stale cache
    return {
      ...cached,
      data_source: 'cache',
      source_key: cachedKey
    };
  }
}

/** Process raw Open-Meteo response into care recommendations */
function processWeatherForecast(data) {
  if (!data.daily || !data.daily.time || !data.daily.precipitation_sum) {
    throw new Error('Invalid Open-Meteo response format');
  }
  
  const times = data.daily.time;
  const precipitation = data.daily.precipitation_sum;
  
  // Sum past 7 days and forecast 7 days
  const recentRainMm = precipitation.slice(0, 7).reduce((sum, val) => sum + (val || 0), 0);
  const forecastRainMm = precipitation.slice(7, 14).reduce((sum, val) => sum + (val || 0), 0);
  
  const dailyHistory = times.slice(0, 7).map((t, idx) => {
    const val = Number(precipitation[idx]) || 0;
    const dateObj = new Date(t);
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dayLetter = dayNames[dateObj.getUTCDay()] || 'D';
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

/** generateOutdoorRecommendations(outdoorPlants) → [{ plant_id, recommendation, reason }] */
export function generateOutdoorRecommendations(outdoorPlants, recentRainMm, forecastRainMm) {
  const recommendations = [];
  
  for (const plant of outdoorPlants) {
    // Get water needs in inches/week (default 1.0 if not specified)
    const waterNeedsInches = plant.water_needs_inches_weekly ?? 1.0;
    const waterNeedsMm = waterNeedsInches * MM_PER_INCH;
    
    // Skip if we got significant recent rain (>= needed)
    if (recentRainMm >= waterNeedsMm) {
      recommendations.push({
        plant_id: plant.id,
        plant_name: plant.name,
        species: plant.species,
        recommendation: 'SKIP — rain covered it',
        rain_received_mm: Math.round(recentRainMm * 100) / 100,
        rain_received_inches: Math.round((recentRainMm / MM_PER_INCH) * 100) / 100,
        needs_inches: waterNeedsInches,
        reason: `Received ${(recentRainMm / MM_PER_INCH).toFixed(1)}" rain this week, needs ~${waterNeedsInches}"`
      });
    } else {
      recommendations.push({
        plant_id: plant.id,
        plant_name: plant.name,
        species: plant.species,
        recommendation: 'WATER — rain insufficient',
        rain_received_mm: Math.round(recentRainMm * 100) / 100,
        rain_received_inches: Math.round((recentRainMm / MM_PER_INCH) * 100) / 100,
        needs_inches: waterNeedsInches,
        deficit_inches: Math.round(((waterNeedsInches - (recentRainMm / MM_PER_INCH)) * 100) / 100),
        reason: `Received ${(recentRainMm / MM_PER_INCH).toFixed(1)}" rain this week, needs ~${waterNeedsInches}" (${waterNeedsInches - (recentRainMm / MM_PER_INCH)}." short)`
      });
    }
  }
  
  return recommendations;
}
