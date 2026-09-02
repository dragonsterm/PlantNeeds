/**
 * client/src/ui/components/auth-form.js — Register/Login forms with JWT error handling
 */
import { api, setToken, clearToken, hasToken } from '../../api/client.js';
import { emit } from '../../state/store.js';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

export function renderAuthForm(container, { mode = 'login', onSuccess = () => {} } = {}) {
  const isLogin = mode === 'login';
  
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  modalOverlay.innerHTML = `
    <div class="glass-panel" style="width: 100%; max-width: 480px; padding: 32px; border-radius: 24px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #FFFFFF;">${isLogin ? 'Sign In to PlantNeeds' : 'Create Your Account'}</h3>
        <button id="close-btn" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 24px;">&times;</button>
      </div>

      <div id="auth-error" class="error-alert" style="display: none; background: rgba(220, 38, 38, 0.3); border: 1px solid #dc2626; border-radius: 12px; padding: 12px; margin-bottom: 16px; color: #fecaca;"></div>

      <form id="auth-form" class="form-stack" style="gap: 16px;">
        ${!isLogin ? `
          <div>
            <label class="form-label" style="color: #fff; margin-bottom: 6px; display: block;">Username</label>
            <input id="username" class="glass-input" type="text" required minlength="3" maxlength="32" placeholder="Choose a username" pattern="[a-zA-Z0-9_]+" />
            <small style="color: #aaa; font-size: 11px;">3-32 characters, letters/numbers/underscores only</small>
          </div>
        ` : ''}
        
        <div>
          <label class="form-label" style="color: #fff; margin-bottom: 6px; display: block;">Password</label>
          <input id="password" class="glass-input" type="password" required minlength="8" placeholder="Minimum 8 characters" />
        </div>

        <button type="submit" class="btn-primary-stitch" style="padding: 14px; width: 100%;">
          ${isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <!-- Google OAuth Section -->
      <div style="margin-top: 24px; text-align: center;">
        <div style="border-top: 1px solid rgba(255,255,255,0.15); margin-bottom: 16px; padding: 8px 0;">
          <span style="color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">or continue with</span>
        </div>
        
        <button id="google-login-btn" style="
          display: flex; 
          align-items: center; 
          gap: 12px;
          padding: 12px 20px;
          background: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          transition: all 0.2s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p style="margin-top: 16px; font-size: 11px; color: #888; line-height: 1.5;">
          By signing up, you agree to our<br/>
          <a href="/privacy-policy" style="color: #A3D94E; text-decoration: none;">Privacy Policy</a> · 
          <a href="/terms-of-service" style="color: #A3D94E; text-decoration: none;">Terms of Service</a>
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const closeBtn = modalOverlay.querySelector('#close-btn');
  const googleBtn = modalOverlay.querySelector('#google-login-btn');
  const form = modalOverlay.querySelector('#auth-form');
  const errorBox = modalOverlay.querySelector('#auth-error');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    setTimeout(() => { errorBox.style.display = 'none'; }, 5000);
  }

  async function handleAuth(e) {
    e.preventDefault();
    const usernameInput = modalOverlay.querySelector('#username');
    const password = modalOverlay.querySelector('#password').value;
    const username = usernameInput ? usernameInput.value.trim() : null;

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin ? { username, password } : { username, password };
      
      const result = await api(endpoint, { method: 'POST', body });
      
      if (result.token) {
        setToken(result.token);
        emit('auth-changed');
        modalOverlay.remove();
        onSuccess(result);
      }
    } catch (err) {
      console.error('[auth] error:', err);
      const errorMsg = err.status === 401 
        ? 'Invalid credentials' 
        : err.status === 409 
        ? 'Username already taken' 
        : err.message || 'Authentication failed';
      showError(errorMsg);
    }
  }

  // Google OAuth handler
  googleBtn?.addEventListener('click', async () => {
    try {
      // Check if backend supports Google OAuth
      const response = await fetch(`${BASE_URL}/api/auth/google`, { method: 'GET' });
      
      if (response.ok) {
        // Backend supports OAuth - redirect to Google auth URL
        window.location.href = `${BASE_URL}/api/auth/google`;
      } else {
        showGoogleError('Google Login not configured on server. Please use username/password.');
      }
    } catch (err) {
      showGoogleError('Could not connect to authentication server.');
    }
  });

  function showGoogleError(message) {
    showError(message + ' Using local authentication instead.');
    console.warn('[auth] Google OAuth unavailable:', message);
  }

  closeBtn?.addEventListener('click', () => modalOverlay.remove());
  form?.addEventListener('submit', handleAuth);
}

// Auto-open auth modal if not logged in
if (!hasToken()) {
  const container = document.getElementById('app') || document.body;
  setTimeout(() => {
    renderAuthForm(container, { mode: 'login' });
  }, 500);
}
