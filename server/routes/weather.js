/**
 * routes/weather.js — Open-Meteo proxy + watering forecast
 * ---------------------------------------------------------
 * Day 1: stub. Real proxy + cache + SKIP/WATER logic lands Day 4 (T-09,
 * docs/api-integrations.md). JWT-guarded; only anonymous lat/long leaves
 * our infrastructure (NFR-3).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/weather/forecast?latitude=&longitude=
router.get('/forecast', (_req, res) =>
  res.status(501).json({ error: 'Not implemented — lands on Day 4 (T-09)' }));

export default router;
