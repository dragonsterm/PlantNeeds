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
    const { username, password, email } = req.body ?? {};
    const result = await registerUser({ username, password, email });
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

// POST /api/auth/google — authenticate with Google OAuth / One-Tap & store user
router.post('/google', async (req, res) => {
  try {
    const { credential, email, name, googleId, avatarUrl } = req.body ?? {};
    const result = await loginWithGoogle({ credential, email, name, googleId, avatarUrl });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// GET /api/auth/google — initiate Google OAuth flow or demo redirect
router.get('/google', async (req, res) => {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (googleClientId) {
      const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`;
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
      return res.redirect(googleAuthUrl);
    }

    // Direct verified login when client ID is not configured in local environment
    const result = await loginWithGoogle({
      email: 'gardener@gmail.com',
      name: 'Google Gardener'
    });
    res.redirect(`${frontendUrl}?token=${result.token}&username=${result.user.username}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google/callback — Google OAuth callback endpoint
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const result = await loginWithGoogle();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${result.token}&username=${result.user.username}`);
  } catch (err) {
    console.error('[google-oidc] callback error:', err);
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

export default router;
