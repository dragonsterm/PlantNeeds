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

export function getBotanicalPlantPhoto(speciesOrName = '') {
  const s = String(speciesOrName).toLowerCase();
  if (s.includes('monstera') || s.includes('swiss cheese') || s.includes('deliciosa')) {
    return 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('pothos') || s.includes('epipremnum') || s.includes('devil') || s.includes('sirih')) {
    return 'https://images.unsplash.com/photo-1596724803714-38b4ef262295?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('snake') || s.includes('sansevieria') || s.includes('mertua')) {
    return 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('basil') || s.includes('kemangi') || s.includes('ocimum')) {
    return 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('fiddle') || s.includes('ficus') || s.includes('lyrata')) {
    return 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('peace') || s.includes('lily') || s.includes('spathiphyllum')) {
    return 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('aloe') || s.includes('buaya')) {
    return 'https://images.unsplash.com/photo-1567689265664-1c48de61db0b?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('tomato') || s.includes('tomat') || s.includes('lycopersicum')) {
    return 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('lavender')) {
    return 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('rosemary')) {
    return 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('pepper') || s.includes('chili') || s.includes('cabai') || s.includes('cabe') || s.includes('capsicum')) {
    return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('succulent') || s.includes('cactus') || s.includes('kaktus')) {
    return 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('fern') || s.includes('pakis')) {
    return 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('calathea')) {
    return 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('zz') || s.includes('zamioculcas')) {
    return 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('mint') || s.includes('peppermint')) {
    return 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&auto=format&fit=crop&q=80';
  }
  if (s.includes('spider') || s.includes('chlorophytum')) {
    return 'https://images.unsplash.com/photo-1572688484437-25826eb66e7b?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80';
}

/** Helper to add a plant to local storage */
function addPlantLocally(body) {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('plantneeds_local_plants') : null;
  let plants = [];
  try {
    if (saved) plants = JSON.parse(saved);
  } catch {}

  const photo = (body.image_url && !body.image_url.includes('lh3.googleusercontent.com/aida-public'))
    ? body.image_url
    : getBotanicalPlantPhoto(body.species || body.name);

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
    image_url: photo
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
      const mergedPlant = {
        ...body,
        ...result.plant,
        light_exposure: result.plant.light_exposure || body.light_exposure || 'bright_indirect',
        pot_has_drainage: result.plant.pot_has_drainage !== undefined ? Boolean(result.plant.pot_has_drainage) : (body.pot_has_drainage !== false)
      };
      addPlantLocally(mergedPlant);
      emit('plant-added', mergedPlant);
      emit('plants-changed');
      return {
        ...result,
        plant: mergedPlant,
        id: mergedPlant.id,
        light_exposure: mergedPlant.light_exposure,
        pot_has_drainage: mergedPlant.pot_has_drainage
      };
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
    light_exposure: localPlant.light_exposure,
    pot_has_drainage: localPlant.pot_has_drainage,
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
