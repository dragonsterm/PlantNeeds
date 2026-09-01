/**
 * client/src/logic/diagnose.js — problem diagnosis via server (C4). Day 6 (T-13).
 */
import { api } from '../api/client.js';

/** diagnoseProblem({plant_id, symptoms}) → POST /api/diagnose → ranked causes + evidence. */
export async function diagnoseProblem({ plant_id, symptoms }) {
  return api('/api/diagnose', { method: 'POST', body: { plant_id, symptoms } });
}
