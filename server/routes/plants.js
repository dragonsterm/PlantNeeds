/**
 * routes/plants.js — collection CRUD + schedule + care log
 * ---------------------------------------------------------
 * Day 1: stubs only. Real handlers land Day 4 (T-08). All routes are
 * JWT-guarded and scope by req.userId (C2, ADR-010). Business logic will
 * delegate to server/logic/plants.js (C4).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../db/pool.js';
import { addPlant as addPlantLogic, getCareSchedule as getScheduleLogic, logCareActivity as logCareLogic } from '../logic/plants.js';
import { logGrowth, getGrowthHistory } from '../logic/planner.js';

const router = Router();
router.use(requireAuth);

/** GET /api/plants - List all user's plants */
router.get('/', async (req, res) => {
  try {
    const location = req.query.location?.toString();
    
    let query = `SELECT id, name, species, location, light_exposure, pot_has_drainage, acquired_date, water_frequency_days, last_watered, image_url FROM plants WHERE user_id = $1`;
    const queryParams = [req.userId];
    
    if (location) {
      query += ` AND location = $2`;
      queryParams.push(location);
    }
    
    query += ` ORDER BY created_at ASC`;
    
    const result = await db.query(query, queryParams);
    
    res.json({ plants: result.rows });
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

/** POST /api/plants - Add new plant */
router.post('/', async (req, res) => {
  try {
    const { name, species, location, light_exposure, pot_has_drainage, acquired_date, image_url } = req.body;
    
    if (!name || !species || !location) {
      return res.status(400).json({ error: 'Missing required fields: name, species, location' });
    }
    
    const validLocations = ['indoor', 'outdoor'];
    if (!validLocations.includes(location)) {
      return res.status(400).json({ error: 'Invalid location. Must be "indoor" or "outdoor"' });
    }
    
    const result = await addPlantLogic(
      { name, species, location, light_exposure, pot_has_drainage, acquired_date, image_url },
      req.userId
    );
    
    // Fetch full plant object
    const plantResult = await db.query('SELECT * FROM plants WHERE id = $1', [result.plantId]);
    
    res.status(201).json({
      success: true,
      plant: plantResult.rows[0],
      care_tips: result.careTips
    });
  } catch (error) {
    console.error('Error adding plant:', error);
    res.status(500).json({ error: 'Failed to add plant' });
  }
});

/** GET /api/plants/schedule - Care schedule */
router.get('/schedule', async (req, res) => {
  try {
    const plant_id = req.query.plant_id?.toString() || null;
    const rawDays = req.query.days_ahead?.toString();
    let days_ahead = 7;
    
    if (rawDays !== undefined && rawDays !== null && rawDays !== '') {
      days_ahead = Number(rawDays);
      if (isNaN(days_ahead) || !Number.isInteger(days_ahead) || days_ahead < 1 || days_ahead > 365) {
        return res.status(400).json({ error: 'Invalid days_ahead parameter. Must be an integer between 1 and 365.' });
      }
    }
    
    const schedule = await getScheduleLogic(req.userId, { plant_id, days_ahead });
    
    res.json({ schedule });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({ error: 'Failed to fetch care schedule' });
  }
});

/** GET /api/plants/:id - Get single plant */
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, species, location, light_exposure, pot_has_drainage, acquired_date, water_frequency_days, last_watered FROM plants WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json({ plant: result.rows[0] });
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

/** PATCH /api/plants/:id - Update plant */
router.patch('/:id', async (req, res) => {
  try {
    const { name, species, location, light_exposure, pot_has_drainage, acquired_date } = req.body;
    
    const fields = [];
    const values = [];
    let idx = 1;
    
    if (name !== undefined) { fields.push(`name = $${idx}`); values.push(name); idx++; }
    if (species !== undefined) { fields.push(`species = $${idx}`); values.push(species); idx++; }
    if (location !== undefined) { fields.push(`location = $${idx}`); values.push(location); idx++; }
    if (light_exposure !== undefined) { fields.push(`light_exposure = $${idx}`); values.push(light_exposure); idx++; }
    if (pot_has_drainage !== undefined) { fields.push(`pot_has_drainage = $${idx}`); values.push(pot_has_drainage); idx++; }
    if (acquired_date !== undefined) { fields.push(`acquired_date = $${idx}`); values.push(acquired_date); idx++; }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    values.push(req.userId);
    
    const query = `UPDATE plants SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json({ plant: result.rows[0] });
  } catch (error) {
    console.error('Error updating plant:', error);
    res.status(500).json({ error: 'Failed to update plant' });
  }
});

/** DELETE /api/plants/:id - Delete plant */
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM plants WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json({ success: true, deleted_id: req.params.id });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});


/** POST /api/plants/:id/care - Log care activity */
router.post('/:id/care', async (req, res) => {
  try {
    const { activity, date, notes, source = 'human' } = req.body;
    
    if (!activity || !['watered', 'fertilized', 'repotted', 'pruned', 'misted', 'rotated'].includes(activity)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }
    
    const result = await logCareLogic(req.params.id, { activity, date, notes, source }, req.userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error logging care activity:', error);
    if (error.message === 'Plant not found') {
      return res.status(404).json({ error: 'Plant not found' });
    }
    res.status(500).json({ error: 'Failed to log care activity' });
  }
});

/** POST /api/plants/:id/growth - Log growth milestone (T-16) */
router.post('/:id/growth', async (req, res) => {
  try {
    const { milestone, height_cm, notes, date, source, plant_name } = req.body || {};
    const result = await logGrowth(req.params.id, req.userId, { milestone, height_cm, notes, date, source, plant_name });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to log growth milestone' });
  }
});

/** GET /api/plants/:id/growth - Get plant growth history (T-16) */
router.get('/:id/growth', async (req, res) => {
  try {
    const result = await getGrowthHistory(req.params.id, req.userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch growth history' });
  }
});

export default router;
