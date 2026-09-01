/**
 * routes/auth.js — register / login / me
 * ---------------------------------------
 * Day 1: route stubs wired to the router. Full bcrypt+JWT credential logic
 * lands on Day 2 (T-05, docs/backend-api.md §Authentication).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register — create account (bcrypt hash → INSERT user)
router.post('/register', async (_req, res) => {
  res.status(501).json({ error: 'Not implemented — lands on Day 2 (T-05)' });
});

// POST /api/auth/login — verify creds → { token }
router.post('/login', async (_req, res) => {
  res.status(501).json({ error: 'Not implemented — lands on Day 2 (T-05)' });
});

// GET /api/auth/me — current user (requires valid JWT)
router.get('/me', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented — lands on Day 2 (T-05)' });
});

export default router;
