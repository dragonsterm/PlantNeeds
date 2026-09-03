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
      // Normalize timestamp format
      const isoDate = String(plant.last_watered).split('T')[0].trim();
      const lastWateredDate = new Date(isoDate + 'T00:00:00');
      if (!isNaN(lastWateredDate.getTime())) {
        daysSinceWatered = Math.max(0, Math.floor((today - lastWateredDate) / (1000 * 60 * 60 * 24)));
        nextWateringDate = new Date(lastWateredDate);
        nextWateringDate.setDate(nextWateringDate.getDate() + freq);
      }
    }

    const rawRemaining = Math.ceil((nextWateringDate - today) / (1000 * 60 * 60 * 24));
    const daysRemaining = isNaN(rawRemaining) ? freq : rawRemaining;
    const isOverdue = daysRemaining <= 0;

    const isRainDelayEnabled = typeof localStorage === 'undefined' || localStorage.getItem('plantneeds_pref_rain_delay') !== 'false';
    const isOutdoor = (plant.location || 'indoor') === 'outdoor';
    const isRainSkipped = isRainDelayEnabled && isOutdoor && Boolean(plant.rain_skipped);

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
      rain_skipped: isRainSkipped
    };
  });

  // Filter within days_ahead window & sort by urgency (lowest days_remaining first)
  return schedule
    .filter(item => item.overdue || item.days_remaining <= targetDays)
    .sort((a, b) => a.days_remaining - b.days_remaining);
}

/** listPlants() → GET /api/plants (Strictly User Scoped) */
export async function listPlants(filter = {}) {
  try {
    const query = new URLSearchParams(filter).toString();
    const url = query ? `/api/plants?${query}` : '/api/plants';
    const res = await api(url);
    if (res && Array.isArray(res.plants)) {
      return res.plants;
    }
    return [];
  } catch (err) {
    const cached = getCache('plants');
    return Array.isArray(cached) ? cached : [];
  }
}

/** Helper to generate standard UUID v4 for plants (compatible with Postgres & WebMCP) */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Helper to add a plant to local storage */
function addPlantLocally(body) {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('plantneeds_local_plants') : null;
  let plants = [];
  try {
    if (saved) plants = JSON.parse(saved);
  } catch {}

  const newPlant = {
    id: body.id || generateUUID(),
    name: body.name,
    species: body.species || 'Houseplant',
    location: body.location || 'indoor',
    light_exposure: body.light_exposure || 'bright_indirect',
    pot_has_drainage: body.pot_has_drainage !== false,
    water_frequency_days: Number(body.water_frequency_days) || 7,
    last_watered: body.last_watered || new Date().toISOString().split('T')[0],
    subtitle: `${body.species || 'Houseplant'} • ${body.location === 'outdoor' ? 'Outdoor Bed' : 'Indoor'}`,
    image_url: body.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw'
  };

  plants.push(newPlant);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('plantneeds_local_plants', JSON.stringify(plants));
  }
  setCache('plants', plants);
  return newPlant;
}

/** addPlant(input) → POST /api/plants → emits plant-added + plants-changed. Day 4. */
export async function addPlant(body) {
  try {
    const result = await api('/api/plants', { method: 'POST', body });
    if (result && result.plant) {
      addPlantLocally(result.plant);
      emit('plant-added', result.plant);
      emit('plants-changed');
      return result;
    }
  } catch (err) {
    console.warn('[plants] Backend add failed, saving to local storage:', err.message);
  }

  const localPlant = addPlantLocally(body);
  emit('plant-added', localPlant);
  emit('plants-changed');
  return { 
    success: true, 
    plant: localPlant,
    id: localPlant.id,
    care_tips: ['Water when top inch of soil is dry', 'Ensure adequate light'] 
  };
}

/** deletePlant(id) → DELETE /api/plants/:id → emits plant-deleted + plants-changed. */
export async function deletePlant(plantId) {
  try {
    await api(`/api/plants/${plantId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[plants] Backend delete failed, removing locally:', err.message);
  }

  const saved = localStorage.getItem('plantneeds_local_plants');
  if (saved) {
    try {
      const plants = JSON.parse(saved);
      const filtered = plants.filter(p => String(p.id) !== String(plantId));
      localStorage.setItem('plantneeds_local_plants', JSON.stringify(filtered));
    } catch {}
  }

  emit('plant-deleted', { id: plantId });
  emit('plants-changed');
  return { success: true };
}

/** logCareActivity(input) → POST /api/plants/:id/care → emits care-logged + plants-changed. Day 4. */
export async function logCareActivity(inputOrId, maybeBody = {}) {
  let plant_id, body;
  if (typeof inputOrId === 'object' && inputOrId !== null) {
    plant_id = inputOrId.plant_id;
    body = { ...inputOrId };
  } else {
    plant_id = inputOrId;
    body = { plant_id, ...maybeBody };
  }

  try {
    const result = await api(`/api/plants/${plant_id}/care`, { method: 'POST', body });
    emit('care-logged', { plant_id, ...body });
    emit('plants-changed');
    return result;
  } catch (err) {
    const saved = localStorage.getItem('plantneeds_local_plants');
    if (saved) {
      try {
        const plants = JSON.parse(saved);
        const p = plants.find(item => String(item.id) === String(plant_id));
        if (p) {
          p.last_watered = body.date || new Date().toISOString().split('T')[0];
          localStorage.setItem('plantneeds_local_plants', JSON.stringify(plants));
        }
      } catch {}
    }
    emit('care-logged', { plant_id, ...body });
    emit('plants-changed');
    return { success: true, next_watering_due: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] };
  }
}

/** getCareSchedule(opts?) → Single Source of Truth for Schedule UI & WebMCP tool */
export async function getCareSchedule({ plant_id, days_ahead = 7 } = {}) {
  // Read latest plants from cache or localStorage first
  let livePlants = getCache('plants');
  if (!livePlants || !livePlants.length) {
    const saved = localStorage.getItem('plantneeds_local_plants');
    if (saved) {
      try {
        livePlants = JSON.parse(saved);
      } catch {}
    }
  }

  if (livePlants && livePlants.length > 0) {
    return computePlantSchedule(livePlants, { plant_id, days_ahead });
  }

  try {
    const params = new URLSearchParams();
    if (plant_id) params.set('plant_id', plant_id);
    if (days_ahead != null) params.set('days_ahead', days_ahead);
    const result = await api(`/api/plants/schedule?${params}`);
    if (result && Array.isArray(result.schedule) && result.schedule.length > 0) {
      return result.schedule;
    }
    return computePlantSchedule(livePlants || [], { plant_id, days_ahead });
  } catch (err) {
    return computePlantSchedule(livePlants || [], { plant_id, days_ahead });
  }
}
