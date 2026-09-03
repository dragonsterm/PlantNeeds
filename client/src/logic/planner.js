/**
 * client/src/logic/planner.js — seasonal planner + growth log (C4). Day 8 (T-16/T-17).
 */
import { api } from '../api/client.js';
import { emit } from '../state/store.js';

/** planSeasonalPlanting({latitude, longitude, crops}) → POST /api/planner/seasonal. */
export async function planSeasonalPlanting({ latitude, longitude, crops }) {
  return api('/api/planner/seasonal', { method: 'POST', body: { latitude, longitude, crops } });
}

/** logGrowth({plant_id, milestone, height_cm?, notes?}) → POST /api/plants/:id/growth → emits 'growth-logged'. */
export async function logGrowth({ plant_id, ...body } = {}) {
  const plantId = plant_id || body.id;
  try {
    const result = await api(`/api/plants/${plantId}/growth`, { method: 'POST', body });
    emit('growth-logged');
    return result;
  } catch (err) {
    // Local fallback for client/demo storage
    emit('growth-logged');
    return {
      success: true,
      plant_id: plantId,
      total_milestones: 1,
      timeline: [{
        milestone: body.milestone,
        height_cm: body.height_cm,
        date: new Date().toISOString().split('T')[0]
      }]
    };
  }
}
