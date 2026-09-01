/**
 * client/src/logic/plants.js — client orchestration for plants (C4)
 * ------------------------------------------------------------------
 * Thin async wrappers that call the API and update the store. BOTH the human
 * UI handlers and the WebMCP tool execute() wrappers call THESE functions —
 * never raw fetch (single path, two callers). Business rules live server-side.
 */
import { api } from '../api/client.js';
import { emit, setCache } from '../state/store.js';

/** addPlant(input) → POST /api/plants → emits 'plants-changed'. Day 4. */
export async function addPlant(input) {
  const result = await api('/api/plants', { method: 'POST', body: input });
  emit('plants-changed');
  return result;
}

/** listPlants(filter?) → GET /api/plants → updates store cache. Day 4. */
export async function listPlants(filter) {
  const q = filter?.location ? `?location=${encodeURIComponent(filter.location)}` : '';
  const result = await api(`/api/plants${q}`);
  setCache('plants', result.plants);
  return result.plants;
}

/** logCareActivity(input) → POST /api/plants/:id/care → emits care-logged + plants-changed. Day 4. */
export async function logCareActivity({ plant_id, ...body }) {
  const result = await api(`/api/plants/${plant_id}/care`, { method: 'POST', body });
  emit('care-logged');
  emit('plants-changed');
  return result;
}

/** getCareSchedule(opts?) → GET /api/plants/schedule. Day 4. */
export async function getCareSchedule({ plant_id, days_ahead = 7 } = {}) {
  const params = new URLSearchParams();
  if (plant_id) params.set('plant_id', plant_id);
  if (days_ahead != null) params.set('days_ahead', days_ahead);
  const result = await api(`/api/plants/schedule?${params}`);
  return result.schedule;
}
