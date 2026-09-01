/**
 * server/logic/plants.js — BUSINESS LOGIC (single source of truth, C4)
 * ---------------------------------------------------------------------
 * Pure functions over the DB. No req/res. Real implementations land on their
 * scheduled days; Day 1 ships the module contract so routes/tools can import.
 */

/** addPlant(input, userId) → resolves species, inserts plant, returns {plant, care_tips}. Day 4. */
export async function addPlant() {
  throw new Error('addPlant not implemented — Day 4 (T-08)');
}

/** getCareSchedule(userId, {plant_id?, days_ahead?}) → ScheduleItem[] sorted by next_watering. Day 4. */
export async function getCareSchedule() {
  throw new Error('getCareSchedule not implemented — Day 4 (T-08)');
}

/** logCareActivity(plantId, {activity, date?, notes?, source}) → inserts care_log, updates last_watered. Day 4. */
export async function logCareActivity() {
  throw new Error('logCareActivity not implemented — Day 4 (T-08)');
}
