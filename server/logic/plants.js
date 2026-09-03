/**
 * server/logic/plants.js — BUSINESS LOGIC (single source of truth, C4)
 * ---------------------------------------------------------------------
 * Pure functions over the DB. No req/res.
 */
import { db } from '../db/pool.js';
import speciesData from '../data/plants-db.json' with { type: 'json' };

/** addPlant(input, userId) → resolves species, inserts plant, returns {plant, care_tips}. Day 4. */
export async function addPlant({ name, species, location, light_exposure, pot_has_drainage, acquired_date, image_url }, userId) {
  // Resolve species profile (match or custom fallback)
  const profile = getSpeciesProfile(species);
  
  // Determine water frequency (user override or species default)
  const water_frequency_days = profile.default_water_frequency_days ?? 7;
  const resolvedLight = light_exposure || profile.light || 'bright_indirect';
  const resolvedDrainage = pot_has_drainage !== undefined ? Boolean(pot_has_drainage) : true;
  
  // Insert plant
  let result;
  try {
    result = await db.query(
      `INSERT INTO plants (name, species, location, light_exposure, pot_has_drainage, acquired_date, water_frequency_days, user_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, species, location, light_exposure, pot_has_drainage, water_frequency_days, image_url`,
      [name, species, location, resolvedLight, resolvedDrainage ? 1 : 0, acquired_date || null, water_frequency_days, userId, image_url || null]
    );
  } catch (insertErr) {
    if (insertErr.code === '42703' || insertErr.message?.includes('image_url')) {
      try {
        await db.query('ALTER TABLE plants ADD COLUMN IF NOT EXISTS image_url TEXT');
        result = await db.query(
          `INSERT INTO plants (name, species, location, light_exposure, pot_has_drainage, acquired_date, water_frequency_days, user_id, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, name, species, location, light_exposure, pot_has_drainage, water_frequency_days, image_url`,
          [name, species, location, resolvedLight, resolvedDrainage ? 1 : 0, acquired_date || null, water_frequency_days, userId, image_url || null]
        );
      } catch {
        result = await db.query(
          `INSERT INTO plants (name, species, location, light_exposure, pot_has_drainage, acquired_date, water_frequency_days, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, name, species, location, light_exposure, pot_has_drainage, water_frequency_days`,
          [name, species, location, resolvedLight, resolvedDrainage ? 1 : 0, acquired_date || null, water_frequency_days, userId]
        );
      }
    } else {
      throw insertErr;
    }
  }
  
  const plantId = result.rows[0].id;
  
  // Generate care tips from species profile
  const careTips = generateCareTips(profile);
  
  return { 
    plantId, 
    species, 
    name, 
    location, 
    light_exposure: resolvedLight,
    pot_has_drainage: resolvedDrainage,
    careTips 
  };
}

/** getCareSchedule(userId, {plant_id?, days_ahead?}) → ScheduleItem[] sorted by next_watering. Day 4. */
export async function getCareSchedule(userId, { plant_id = null, days_ahead = 7 } = {}) {
  // Fetch all user's plants with last_watered info (cross-engine SQL: works on Postgres & SQLite)
  let query = `
    SELECT p.id, p.name, p.species, p.location, p.water_frequency_days, p.last_watered
    FROM plants p
    WHERE p.user_id = $1
  `;
  const queryParams = [userId];
  
  if (plant_id) {
    query += ` AND p.id = $2`;
    queryParams.push(plant_id);
  }
  
  query += ` ORDER BY p.last_watered ASC NULLS FIRST LIMIT 20`;
  
  const result = await db.query(query, queryParams);
  
  // Compute schedule items
  const today = new Date().toISOString().split('T')[0];
  const schedule = result.rows.map(row => {
    const nextWatering = row.last_watered ? addDays(row.last_watered, row.water_frequency_days) : today;
    const daysSinceWatered = row.last_watered ? daysBetween(row.last_watered, today) : -1;
    const overdue = row.last_watered && new Date(nextWatering) < new Date(today);
    
    return {
      plant_id: row.id,
      plant_name: row.name,
      species: row.species,
      location: row.location,
      next_watering: nextWatering,
      days_since_watered: daysSinceWatered,
      overdue: overdue,
      needs_attention: row.needs_attention
    };
  });
  
  // Sort by next_watering (most urgent first)
  schedule.sort((a, b) => new Date(a.next_watering) - new Date(b.next_watering));
  
  return schedule;
}

/** logCareActivity(plantId, {activity, date?, notes?, source}) → inserts care_log, updates last_watered. Day 4. */
export async function logCareActivity(plantId, { activity, date, notes, source = 'human' }, userId) {
  // Verify plant belongs to user
  const plantCheck = await db.query('SELECT user_id FROM plants WHERE id = $1', [plantId]);
  if (plantCheck.rows.length === 0 || plantCheck.rows[0].user_id !== userId) {
    throw new Error('Plant not found');
  }
  
  // Insert care log entry
  await db.query(
    `INSERT INTO care_log (plant_id, activity, date, notes, source)
     VALUES ($1, $2, $3, $4, $5)`,
    [plantId, activity, date || new Date().toISOString().split('T')[0], notes || null, source]
  );
  
  // If watered, update last_watered on plant
  if (activity === 'watered') {
    await db.query(
      `UPDATE plants SET last_watered = $1 WHERE id = $2`,
      [date || new Date().toISOString().split('T')[0], plantId]
    );
  }
  
  // Get updated schedule for this plant
  const schedule = await getCareSchedule(userId, { plant_id: plantId, days_ahead: 30 });
  const nextWatering = schedule[0]?.next_watering || null;
  
  return { success: true, next_watering_due: nextWatering };
}

// Helper: Get species profile from database
function getSpeciesProfile(speciesKey) {
  if (!speciesKey || speciesKey === 'custom') {
    return {
      common_name: 'Custom Plant',
      scientific_name: null,
      water_frequency_days: 7,
      default_water_frequency_days: 7,
      watering: 'Water when top inch of soil is dry.',
      light: 'Bright indirect light.'
    };
  }
  
  const profile = speciesData[speciesKey];
  if (profile) {
    return {
      ...profile,
      default_water_frequency_days: profile.water_frequency_days
    };
  }
  
  // Fallback for unknown species
  return {
    common_name: speciesKey,
    scientific_name: null,
    water_frequency_days: 7,
    default_water_frequency_days: 7,
    watering: 'Water regularly, adjusting for conditions.',
    light: 'Medium light exposure.'
  };
}

// Helper: Generate care tips from species profile
function generateCareTips(profile) {
  const tips = [];
  if (profile.watering) tips.push(`💧 ${profile.watering}`);
  if (profile.light) tips.push(`☀️ ${profile.light}`);
  if (profile.humidity) tips.push(`💦 ${profile.humidity}`);
  if (profile.fertilizing) tips.push(`🌱 ${profile.fertilizing}`);
  return tips.length > 0 ? tips : ['General care tips will appear here.'];
}

// Helper: Add days to a date string
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Helper: Calculate days between two dates
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}
