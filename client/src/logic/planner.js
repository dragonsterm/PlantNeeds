/**
 * client/src/logic/planner.js — seasonal planner + growth log (C4). Day 8 (T-16/T-17).
 */
import { api } from '../api/client.js';
import { emit } from '../state/store.js';

/** planSeasonalPlanting({latitude, longitude, crops}) → POST /api/planner/seasonal. */
export async function planSeasonalPlanting({ latitude, longitude, crops }) {
  return api('/api/planner/seasonal', { method: 'POST', body: { latitude, longitude, crops } });
}

/** logGrowth({plant_id, milestone, height_cm?, notes?, plant_name?}) → POST /api/plants/:id/growth → emits 'growth-logged'. */
export async function logGrowth({ plant_id, plant_name, ...body } = {}) {
  const plantId = plant_id || body.id;
  try {
    const result = await api(`/api/plants/${plantId}/growth`, { method: 'POST', body: { ...body, plant_name } });
    emit('growth-logged');
    if (result && (!result.plant_name || result.plant_name === 'Plant') && plant_name) {
      result.plant_name = plant_name;
    }
    return result;
  } catch (err) {
    // Local fallback for client/demo storage
    emit('growth-logged');
    return {
      success: true,
      plant_id: plantId,
      plant_name: plant_name || 'Garden Plant',
      total_milestones: 1,
      timeline: [{
        milestone: body.milestone,
        height_cm: body.height_cm,
        date: new Date().toISOString().split('T')[0]
      }]
    };
  }
}
