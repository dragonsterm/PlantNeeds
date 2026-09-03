/**
 * routes/weather.js — Open-Meteo proxy + cache
 * ---------------------------------------------
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getWateringForecast, generateOutdoorRecommendations } from '../logic/weather.js';
import { db } from '../db/pool.js';

const router = Router();
router.use(requireAuth);

// Create weather_cache table if not exists (simple in-memory-like cache)
async function ensureCacheTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS weather_cache (
        key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);
  } catch (err) {
    console.warn('Weather cache table creation skipped:', err.message);
  }
}

ensureCacheTable();

/** GET /api/weather/forecast - Weather-adjusted watering advice */
router.get('/forecast', async (req, res) => {
  try {
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required query params: latitude, longitude' });
    }
    
    // Get live forecast data
    const forecastData = await getWateringForecast(latitude, longitude);
    
    if (forecastData.data_source === 'unavailable') {
      return res.json(forecastData);
    }
    
    // Fetch outdoor plants for recommendations
    const outdoorPlantsResult = await db.query(
      `SELECT id, name, species, water_needs_inches_weekly 
       FROM plants 
       WHERE user_id = $1 AND location = 'outdoor'`,
      [req.userId]
    );
    
    const outdoorPlants = outdoorPlantsResult.rows;
    
    // Generate recommendations if we have live/cache data
    let recommendations = [];
    if (forecastData.data_source !== 'unavailable') {
      recommendations = generateOutdoorRecommendations(outdoorPlants, forecastData.recent_rain_mm, forecastData.forecast_rain_mm);
    }
    
    res.json({
      recent_rain_mm: forecastData.recent_rain_mm,
      forecast_rain_mm: forecastData.forecast_rain_mm,
      daily_history: forecastData.daily_history || [],
      recommendations,
      data_source: forecastData.data_source || 'live'
    });
    
  } catch (error) {
    console.error('Error getting weather forecast:', error);
    
    if (error.message.includes('Coordinates')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
});

export default router;
