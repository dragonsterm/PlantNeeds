/**
 * server/logic/planner.js — seasonal calendar + growth log business logic (C4)
 * ----------------------------------------------------------------------------
 * Pure functions over PostgreSQL and plants-db.json. No req/res.
 * Handles Task T-16 (Growth Journal) and Task T-17 (Seasonal Planting Planner).
 */
import { query } from '../db/pool.js';
import { loadPlantsDb } from '../db/seed.js';

/**
 * Log a growth milestone for a plant (Task T-16, FR-5.1).
 * @param {string} plantId
 * @param {string} userId - for ownership scoping
 * @param {{ milestone: string, height_cm?: number, notes?: string, date?: string, source?: 'human'|'agent' }} input
 * @returns {Promise<{ success: boolean, total_milestones: number, timeline: Array }>}
 */
export async function logGrowth(plantId, userId, { milestone, height_cm = null, notes = null, date = null, source = 'human' } = {}) {
  if (!milestone || typeof milestone !== 'string') {
    throw Object.assign(new Error('Milestone description is required'), { status: 400 });
  }

  // 1. Verify plant exists and belongs to user
  const plantCheck = await query(
    'SELECT id, name, species FROM plants WHERE id = $1 AND user_id = $2',
    [plantId, userId]
  );
  if (plantCheck.rows.length === 0) {
    throw Object.assign(new Error('Plant not found or access denied'), { status: 404 });
  }

  const plant = plantCheck.rows[0];
  const logDate = date || new Date().toISOString().split('T')[0];
  const logSource = source === 'agent' ? 'agent' : 'human';
  const numericHeight = height_cm != null ? Number(height_cm) : null;

  // 2. Insert growth log entry
  await query(
    `INSERT INTO growth_log (plant_id, milestone, height_cm, notes, date, source)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [plantId, milestone.trim(), numericHeight, notes ? notes.trim() : null, logDate, logSource]
  );

  // 3. Return full timeline history
  const history = await query(
    `SELECT id, plant_id, milestone, height_cm, notes, date, source, created_at
     FROM growth_log
     WHERE plant_id = $1
     ORDER BY date DESC, created_at DESC`,
    [plantId]
  );

  return {
    success: true,
    plant_id: plantId,
    plant_name: plant.name,
    total_milestones: history.rows.length,
    timeline: history.rows
  };
}

/**
 * Get growth history for a plant (Task T-16, FR-5.2).
 * @param {string} plantId
 * @param {string} userId
 * @returns {Promise<{ plant_id: string, plant_name: string, timeline: Array }>}
 */
export async function getGrowthHistory(plantId, userId) {
  const plantCheck = await query(
    'SELECT id, name FROM plants WHERE id = $1 AND user_id = $2',
    [plantId, userId]
  );
  if (plantCheck.rows.length === 0) {
    throw Object.assign(new Error('Plant not found or access denied'), { status: 404 });
  }

  const history = await query(
    `SELECT id, plant_id, milestone, height_cm, notes, date, source, created_at
     FROM growth_log
     WHERE plant_id = $1
     ORDER BY date DESC, created_at DESC`,
    [plantId]
  );

  return {
    plant_id: plantId,
    plant_name: plantCheck.rows[0].name,
    timeline: history.rows
  };
}

/**
 * Plan seasonal outdoor planting schedule and companion matrix (Task T-17, FR-6.1, FR-6.2).
 * @param {{ latitude: number, longitude: number, crops: string[] }} input
 * @returns {Promise<{ location: { latitude: number, longitude: number }, planting_plan: Array }>}
 */
export async function planSeasonalPlanting({ latitude, longitude, crops = [] } = {}) {
  if (latitude == null || longitude == null) {
    throw Object.assign(new Error('Latitude and longitude are required'), { status: 400 });
  }
  if (!Array.isArray(crops) || crops.length === 0) {
    throw Object.assign(new Error('At least one crop name must be provided in crops array'), { status: 400 });
  }

  const db = await loadPlantsDb();
  const plan = [];

  // Approximate frost calculation baseline:
  // In northern hemisphere (> 0 lat), last spring frost is around March-April (Day of year ~80-110).
  // In southern hemisphere (< 0 lat), last frost is around Sept-Oct.
  // In tropical zones (-15 to 15 lat), outdoor planting is year-round with dry/rainy season considerations.
  const isTropical = Math.abs(latitude) <= 15;
  const isNorthern = latitude > 15;

  const currentYear = new Date().getFullYear();

  for (const cropName of crops) {
    const queryName = String(cropName || '').toLowerCase().trim();
    if (!queryName) continue;

    // Match crop in database
    let matchedProfile = null;
    let matchedKey = null;

    for (const [key, profile] of Object.entries(db)) {
      if (
        key.toLowerCase() === queryName ||
        profile.common_name?.toLowerCase() === queryName ||
        profile.aliases?.some(a => a.toLowerCase() === queryName)
      ) {
        matchedProfile = profile;
        matchedKey = key;
        break;
      }
    }

    // Default crop metrics if not in database
    const daysToHarvest = matchedProfile?.days_to_harvest || 60;
    const weeksBeforeFrost = matchedProfile?.weeks_before_last_frost || 4;
    const companions = matchedProfile?.companions || ['Marigold', 'Basil'];
    const enemies = matchedProfile?.enemies || [];

    let startIndoorsDate;
    let transplantDate;
    let expectedHarvestDate;

    if (isTropical) {
      // Year-round tropical timeline starting from current month
      const base = new Date();
      startIndoorsDate = 'Direct sowing or indoor start: Year-round (Optimal during rainy season start)';
      base.setDate(base.getDate() + 14);
      transplantDate = `${base.toISOString().split('T')[0]} (2 weeks after sowing)`;
      base.setDate(base.getDate() + daysToHarvest);
      expectedHarvestDate = `${base.toISOString().split('T')[0]} (~${daysToHarvest} days)`;
    } else if (isNorthern) {
      // Spring sowing timeline
      startIndoorsDate = `${currentYear}-03-15 (${weeksBeforeFrost} weeks before last frost)`;
      transplantDate = `${currentYear}-05-01 (After last spring frost)`;
      const harvestTarget = new Date(`${currentYear}-05-01`);
      harvestTarget.setDate(harvestTarget.getDate() + daysToHarvest);
      expectedHarvestDate = `${harvestTarget.toISOString().split('T')[0]} (~${daysToHarvest} days from transplant)`;
    } else {
      // Southern hemisphere spring timeline (Sept-Oct)
      startIndoorsDate = `${currentYear}-08-15 (${weeksBeforeFrost} weeks before last frost)`;
      transplantDate = `${currentYear}-10-01 (After last spring frost)`;
      const harvestTarget = new Date(`${currentYear}-10-01`);
      harvestTarget.setDate(harvestTarget.getDate() + daysToHarvest);
      expectedHarvestDate = `${harvestTarget.toISOString().split('T')[0]} (~${daysToHarvest} days from transplant)`;
    }

    plan.push({
      crop: matchedProfile?.common_name || cropName,
      species_key: matchedKey || 'custom',
      type: matchedProfile?.type || 'outdoor_crop',
      start_indoors: startIndoorsDate,
      transplant_after: transplantDate,
      days_to_harvest: daysToHarvest,
      expected_harvest: expectedHarvestDate,
      companion_plants: companions,
      avoid_planting_near: enemies,
      care_tips: matchedProfile?.tips || 'Provide full sun and consistent soil moisture.'
    });
  }

  return {
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
      zone: isTropical ? 'Tropical (Year-round planting)' : isNorthern ? 'Northern Temperate' : 'Southern Temperate'
    },
    total_crops_planned: plan.length,
    planting_plan: plan
  };
}
