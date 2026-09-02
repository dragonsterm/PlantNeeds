/**
 * routes/auth.js — register / login / me / google oauth
 * -------------------------------------------------------
 * Thin validators that delegate to server/logic/auth.js (C4).
 * POST /register + /login + /google are public; GET /me requires valid JWT.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { registerUser, loginUser, getCurrentUser, loginWithGoogle } from '../logic/auth.js';

const router = Router();

// POST /api/auth/register — create account
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    const result = await registerUser({ username, password });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// POST /api/auth/login — verify creds → { token }
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    const result = await loginUser({ username, password });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// POST /api/auth/google — authenticate with Google OAuth / One-Tap
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId } = req.body ?? {};
    const result = await loginWithGoogle({ email, name, googleId });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// GET /api/auth/google — web redirect handler
router.get('/google', async (req, res) => {
  try {
    const result = await loginWithGoogle();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${result.token}&username=${result.user.username}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — current user (requires valid JWT)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await getCurrentUser(req.userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

export default router;
