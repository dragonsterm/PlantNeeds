/**
 * routes/diagnose.js — history-aware symptom diagnosis
 * -----------------------------------------------------
 * Day 1: stub. Scoring engine lands Day 6 (T-13, docs/diagnosis-engine.md).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// POST /api/diagnose  { plant_id, symptoms[] }
router.post('/', (_req, res) =>
  res.status(501).json({ error: 'Not implemented — lands on Day 6 (T-13)' }));

export default router;
