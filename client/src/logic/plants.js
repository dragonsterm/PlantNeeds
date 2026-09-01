/**
 * client/src/logic/plants.js — client-side plant & schedule domain service (C4)
 * ----------------------------------------------------------------------------
 * Single source of truth for both UI components and WebMCP tool handlers.
 * Emits events via client/src/state/store.js for live-sync (C5).
 */
import { api } from '../api/client.js';
import { emit, getCache, setCache } from '../state/store.js';

/**
 * Pure helper to compute schedule items from plant records.
 * Used identically by both Schedule UI and WebMCP get_care_schedule tool.
 */
export function computePlantSchedule(plants = [], { plant_id = null, days_ahead = 7 } = {}) {
  const targetDays = Number(days_ahead) || 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filtered = plants;
  if (plant_id) {
    filtered = plants.filter(p => String(p.id) === String(plant_id));
  }

  const schedule = filtered.map(plant => {
    const freq = Number(plant.water_frequency_days) || 7;
    let daysSinceWatered = 0;
    let nextWateringDate = new Date(today);

    if (plant.last_watered) {
      const lastWateredDate = new Date(plant.last_watered);
      lastWateredDate.setHours(0, 0, 0, 0);
      daysSinceWatered = Math.max(0, Math.floor((today - lastWateredDate) / (1000 * 60 * 60 * 24)));
      nextWateringDate = new Date(lastWateredDate);
      nextWateringDate.setDate(nextWateringDate.getDate() + freq);
    }

    const daysRemaining = Math.ceil((nextWateringDate - today) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining <= 0;

    return {
      plant_id: plant.id,
      plant_name: plant.name || 'Unnamed Plant',
      species: plant.species || plant.scientific_name || plant.common_name || 'Houseplant',
      location: plant.location || 'indoor',
      next_watering: nextWateringDate.toISOString().split('T')[0],
      days_remaining: daysRemaining,
      days_since_watered: daysSinceWatered,
      overdue: isOverdue,
      status: isOverdue ? 'overdue' : (daysRemaining === 0 ? 'due_today' : 'upcoming'),
      rain_skipped: Boolean(plant.rain_skipped)
    };
  });

  // Filter within days_ahead window & sort by urgency (lowest days_remaining first)
  return schedule
    .filter(item => item.overdue || item.days_remaining <= targetDays)
    .sort((a, b) => a.days_remaining - b.days_remaining);
}

/** listPlants() → GET /api/plants */
export async function listPlants(filter = {}) {
  const query = new URLSearchParams(filter).toString();
  const url = query ? `/api/plants?${query}` : '/api/plants';
  return api(url);
}

/** addPlant(input) → POST /api/plants → emits plant-added + plants-changed. Day 4. */
export async function addPlant(body) {
  const result = await api('/api/plants', { method: 'POST', body });
  emit('plant-added', result.plant);
  emit('plants-changed');
  return result;
}

/** logCareActivity(input) → POST /api/plants/:id/care → emits care-logged + plants-changed. Day 4. */
export async function logCareActivity({ plant_id, ...body }) {
  const result = await api(`/api/plants/${plant_id}/care`, { method: 'POST', body });
  emit('care-logged', { plant_id, ...body });
  emit('plants-changed');
  return result;
}

/** getCareSchedule(opts?) → Single Source of Truth for Schedule UI & WebMCP tool */
export async function getCareSchedule({ plant_id, days_ahead = 7 } = {}) {
  // 1. Try fetching from live store cache first
  const livePlants = getCache('plants') || [];

  if (livePlants.length > 0) {
    return computePlantSchedule(livePlants, { plant_id, days_ahead });
  }

  // 2. Fallback to API endpoint
  try {
    const params = new URLSearchParams();
    if (plant_id) params.set('plant_id', plant_id);
    if (days_ahead != null) params.set('days_ahead', days_ahead);
    const result = await api(`/api/plants/schedule?${params}`);
    if (result && Array.isArray(result.schedule)) {
      return result.schedule;
    }
    return computePlantSchedule(livePlants, { plant_id, days_ahead });
  } catch (err) {
    return computePlantSchedule(livePlants, { plant_id, days_ahead });
  }
}
