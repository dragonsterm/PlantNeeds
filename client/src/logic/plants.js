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
  try {
    const query = new URLSearchParams(filter).toString();
    const url = query ? `/api/plants?${query}` : '/api/plants';
    const res = await api(url);
    if (res && Array.isArray(res.plants)) {
      return res.plants;
    }
    return getCache('plants') || [];
  } catch (err) {
    return getCache('plants') || [];
  }
}

/** Helper to add a plant to local storage */
function addPlantLocally(body) {
  const saved = localStorage.getItem('plantneeds_local_plants');
  let plants = [];
  try {
    if (saved) plants = JSON.parse(saved);
  } catch {}

  const newPlant = {
    id: 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    name: body.name,
    species: body.species || 'Houseplant',
    location: body.location || 'indoor',
    light_exposure: body.light_exposure || 'bright_indirect',
    pot_has_drainage: body.pot_has_drainage !== false,
    water_frequency_days: 7,
    last_watered: new Date().toISOString().split('T')[0],
    subtitle: `${body.species || 'Houseplant'} • ${body.location === 'outdoor' ? 'Outdoor Bed' : 'Indoor'}`,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw'
  };

  plants.push(newPlant);
  localStorage.setItem('plantneeds_local_plants', JSON.stringify(plants));
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
    console.warn('[plants] Backend add failed or offline, saving to persistent local storage:', err.message);
  }

  // Graceful fallback: save locally and notify store
  const localPlant = addPlantLocally(body);
  emit('plant-added', localPlant);
  emit('plants-changed');
  return { success: true, plant: localPlant, care_tips: ['Water when top inch of soil is dry', 'Ensure adequate light'] };
}

/** logCareActivity(input) → POST /api/plants/:id/care → emits care-logged + plants-changed. Day 4. */
export async function logCareActivity({ plant_id, ...body }) {
  try {
    const result = await api(`/api/plants/${plant_id}/care`, { method: 'POST', body });
    emit('care-logged', { plant_id, ...body });
    emit('plants-changed');
    return result;
  } catch (err) {
    // Local state fallback
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
