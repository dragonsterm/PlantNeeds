/**
 * routes/diagnose.js — history-aware symptom diagnosis (T-13, C4)
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { diagnoseProblem } from '../logic/diagnose.js';

const router = Router();
router.use(requireAuth);

// POST /api/diagnose { plant_id, symptoms[], plant? }
router.post('/', async (req, res, next) => {
  try {
    const { plant_id, symptoms, plant } = req.body;
    const result = await diagnoseProblem(req.userId, { plant_id, symptoms, plant });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
