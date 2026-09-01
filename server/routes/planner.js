/**
 * routes/planner.js — seasonal planting planner
 * ----------------------------------------------
 * Day 1: stub. Seasonal calendar lands Day 8 (T-17,
 * docs/api-integrations.md §Seasonal Planner Use).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// POST /api/planner/seasonal  { latitude, longitude, crops[] }
router.post('/seasonal', (_req, res) =>
  res.status(501).json({ error: 'Not implemented — lands on Day 8 (T-17)' }));

export default router;
