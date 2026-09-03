/**
 * routes/auth.js — register / login / me / google oauth / reset
 * ---------------------------------------------------------------
 * Thin validators that delegate to server/logic/auth.js (C4).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { registerUser, loginUser, getCurrentUser, loginWithGoogle, deleteUserAccount } from '../logic/auth.js';

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

// POST /api/auth/google — authenticate with Google ID Token or account info
router.post('/google', async (req, res) => {
  try {
    const { credential, email, name, googleId, avatarUrl } = req.body ?? {};
    const result = await loginWithGoogle({ credential, email, name, googleId, avatarUrl });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// GET /api/auth/google — initiate Google OAuth flow
router.get('/google', async (req, res) => {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const backendUrl = process.env.BACKEND_URL || 'https://plantneeds-api.onrender.com';

    if (googleClientId) {
      const redirectUri = `${backendUrl}/api/auth/google/callback`;
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account%20consent`;
      return res.redirect(googleAuthUrl);
    }

    res.status(500).json({ error: 'Google OAuth Client ID is not configured on server' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google/callback — Google OAuth callback endpoint
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'https://plantneeds-web.onrender.com';

    if (error) {
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}?error=missing_code`);
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const backendUrl = process.env.BACKEND_URL || 'https://plantneeds-api.onrender.com';
    const redirectUri = `${backendUrl}/api/auth/google/callback`;

    let userInfo = null;

    if (googleClientId && googleClientSecret) {
      // Exchange code for tokens with Google
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.id_token) {
        // Fetch user info using access token or id_token
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        userInfo = await userRes.json();
      }
    }

    // Authenticate & isolate the specific Google account in DB
    const result = await loginWithGoogle({
      email: userInfo?.email || `google_user_${Date.now()}@gmail.com`,
      name: userInfo?.name || userInfo?.given_name || 'Google Gardener',
      googleId: userInfo?.sub || `gid_${Date.now()}`,
      avatarUrl: userInfo?.picture || null
    });

    res.redirect(`${frontendUrl}?token=${result.token}&username=${encodeURIComponent(result.user.username)}`);
  } catch (err) {
    console.error('[google-callback] error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'https://plantneeds-web.onrender.com';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(err.message)}`);
  }
});

// GET /api/auth/me — current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await getCurrentUser(req.userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// DELETE /api/auth/account — reset/clear account data by email or username
router.delete('/account', async (req, res) => {
  try {
    const email = req.query.email || req.body?.email;
    const username = req.query.username || req.body?.username;
    const result = await deleteUserAccount({ email, username });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});

// POST /api/auth/verify-username — check if username exists for password reset
router.post('/verify-username', async (req, res) => {
  try {
    const { username } = req.body ?? {};
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    const { rows } = await import('../db/pool.js').then(m => m.query(
      'SELECT id, username FROM users WHERE username = $1 OR email = $1',
      [username.trim()]
    ));
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that username or email.' });
    }
    res.status(200).json({ success: true, username: rows[0].username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password — update password after verified username
router.post('/reset-password', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const bcrypt = (await import('bcryptjs')).default;
    const pool = await import('../db/pool.js');
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 OR email = $2 RETURNING id, username, email',
      [passwordHash, username.trim()]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { signToken } = await import('../middleware/auth.js');
    const token = signToken(rows[0].id);
    res.status(200).json({ success: true, message: 'Password updated successfully', token, user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
