/**
 * routes/auth.js — register / login / me / google oauth
 * -------------------------------------------------------
 * Thin validators that delegate to server/logic/auth.js (C4).
 * POST /register + /login are public; GET /me requires valid JWT.
 * GET /auth/google redirects to Google OAuth flow.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { registerUser, loginUser, getCurrentUser, handleGoogleCallback } from '../logic/auth.js';

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

// GET /api/auth/me — current user (requires valid JWT)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await getCurrentUser(req.userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// GET /api/auth/google — initiate Google OAuth flow
router.get('/google', async (req, res) => {
  // In production, this would redirect to Google OAuth consent screen
  // For now, return a message that OAuth is not configured
  res.json({ 
    success: false, 
    message: 'Google OAuth not configured. Please use username/password authentication.' 
  });
});

// GET /api/auth/google/callback — Google OAuth callback endpoint
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    const result = await handleGoogleCallback(code);
    
    // Redirect frontend with token in URL (simplified for hackathon)
    // In production, use secure HTTP-only cookie
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success?token=${result.token}&username=${result.user.username}`);
  } catch (err) {
    console.error('[google-oidc] callback error:', err);
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

export default router;
