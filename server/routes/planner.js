/**
 * server/routes/planner.js — seasonal planting planner REST API
 * -------------------------------------------------------------
 * POST /api/planner/seasonal  { latitude, longitude, crops[] }
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { planSeasonalPlanting } from '../logic/planner.js';

const router = Router();
router.use(requireAuth);

// POST /api/planner/seasonal — compute seasonal outdoor calendar and companion guidance
router.post('/seasonal', async (req, res) => {
  try {
    const { latitude, longitude, crops } = req.body || {};
    const result = await planSeasonalPlanting({ latitude, longitude, crops });
    res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Failed to compute seasonal planting plan' });
  }
});

export default router;
