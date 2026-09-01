/**
 * client/src/ui/components/auth-form.js
 * Auth UI: Login & Register pages identical to Google Stitch Reference.
 */
import { api, setToken } from '../../api/client.js';
import { emit } from '../../state/store.js';

export function renderAuthForm(container, { initialMode = 'login' } = {}) {
  let mode = initialMode; // 'login' or 'register'
  let errorMessage = '';

  function update() {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="glass-panel auth-card rounded-3xl" style="padding: 36px 32px;">
          <!-- Brand / Logo Area -->
          <div style="margin-bottom: 28px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px;">
              <span class="material-symbols-outlined" style="color: var(--primary-fixed, #bcf0ae); font-size: 32px; font-variation-settings: 'FILL' 1;">potted_plant</span>
              <h1 class="font-headline-lg" style="color: #FFFFFF;">${mode === 'login' ? 'PlantNeeds' : 'Join PlantNeeds'}</h1>
            </div>
            <p class="font-body-sm" style="color: var(--sage-soft, #E1E8E0);">
              ${mode === 'login' ? 'Welcome back, Plant Parent.' : 'Start your journey as a plant parent.'}
            </p>
          </div>

          ${errorMessage ? `<div class="error-alert" role="alert">${escapeHtml(errorMessage)}</div>` : ''}

          <!-- Form -->
          <form id="auth-form" autocomplete="off" style="display: flex; flex-direction: column; gap: 14px;">
            ${mode === 'register' ? `
              <div style="position: relative;">
                <span class="material-symbols-outlined" style="position: absolute; top: 50%; left: 14px; transform: translateY(-50%); color: var(--outline-variant, #c2c9bb); font-size: 20px;">person</span>
                <input id="auth-fullname" class="glass-input" type="text" name="fullname" placeholder="Full Name (optional)" style="width: 100%; padding: 12px 16px 12px 44px; border-radius: 12px; font-size: 14px;" />
              </div>
            ` : ''}

            <div style="position: relative;">
              <span class="material-symbols-outlined" style="position: absolute; top: 50%; left: 14px; transform: translateY(-50%); color: var(--outline-variant, #c2c9bb); font-size: 20px;">mail</span>
              <input id="auth-username" class="glass-input" type="text" name="username" required minlength="3" maxlength="32" placeholder="Username or Email" style="width: 100%; padding: 12px 16px 12px 44px; border-radius: 12px; font-size: 14px;" />
            </div>

            <div style="position: relative;">
              <span class="material-symbols-outlined" style="position: absolute; top: 50%; left: 14px; transform: translateY(-50%); color: var(--outline-variant, #c2c9bb); font-size: 20px;">lock</span>
              <input id="auth-password" class="glass-input" type="password" name="password" required minlength="8" placeholder="Password" style="width: 100%; padding: 12px 16px 12px 44px; border-radius: 12px; font-size: 14px;" />
            </div>

            ${mode === 'register' ? `
              <div style="position: relative;">
                <span class="material-symbols-outlined" style="position: absolute; top: 50%; left: 14px; transform: translateY(-50%); color: var(--outline-variant, #c2c9bb); font-size: 20px;">lock</span>
                <input id="auth-confirm-password" class="glass-input" type="password" name="confirm_password" required minlength="8" placeholder="Confirm Password" style="width: 100%; padding: 12px 16px 12px 44px; border-radius: 12px; font-size: 14px;" />
              </div>
            ` : `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sage-soft, #E1E8E0); cursor: pointer;">
                  <input id="auth-remember" type="checkbox" style="accent-color: var(--primary-container, #2d5a27);" />
                  <span>Remember me</span>
                </label>
                <button type="button" id="forgot-pw-btn" style="background: none; border: none; color: var(--primary-fixed, #bcf0ae); font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline;">
                  Forgot Password?
                </button>
              </div>
            `}

            <button type="submit" class="btn-primary-stitch" id="auth-submit" style="width: 100%; padding: 14px; margin-top: 8px; font-size: 14px;">
              ${mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <!-- Divider -->
          <div style="display: flex; align-items: center; gap: 12px; margin: 20px 0;">
            <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.2);"></div>
            <span class="font-label-caps" style="color: var(--sage-soft, #E1E8E0); font-size: 11px;">Or continue with</span>
            <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.2);"></div>
          </div>

          <!-- Social Buttons -->
          <div style="display: flex; gap: 12px;">
            <button type="button" class="glass-card" id="social-google" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; border-radius: 12px; color: #fff; cursor: pointer; border: 1px solid rgba(255,255,255,0.2);">
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
              </svg>
              <span style="font-size: 13px; font-weight: 600;">Google</span>
            </button>
            <button type="button" class="glass-card" id="social-apple" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; border-radius: 12px; color: #fff; cursor: pointer; border: 1px solid rgba(255,255,255,0.2);">
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05 1.72-3.21 1.72-1.13 0-1.5-.69-2.84-.69-1.34 0-1.76.67-2.84.69-1.11.02-2.23-.82-3.21-1.72-2.01-1.84-3.54-5.2-3.54-8.36 0-5.1 3.31-7.8 6.45-7.8 1.65 0 3.21.58 4.21.58 1 0 2.87-.7 4.82-.7 2.04 0 3.88 1.07 5.01 2.82-4.08 1.7-3.42 7.16.66 8.83-.81 2.04-1.81 4.07-3.51 5.63zM12.03 5.07c-.11-2.39 1.88-4.44 4.23-4.57.22 2.48-2.14 4.71-4.23 4.57z"></path>
              </svg>
              <span style="font-size: 13px; font-weight: 600;">Apple</span>
            </button>
          </div>

          <!-- Footer Switch -->
          <div style="text-align: center; margin-top: 22px; font-size: 13px; color: var(--sage-soft, #E1E8E0);">
            <span>${mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
            <button type="button" id="auth-mode-toggle" style="background: none; border: none; color: var(--primary-fixed, #bcf0ae); font-weight: 600; cursor: pointer; text-decoration: underline; margin-left: 4px;">
              ${mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const form = container.querySelector('#auth-form');
    const toggleBtn = container.querySelector('#auth-mode-toggle');

    toggleBtn?.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login';
      errorMessage = '';
      update();
    });

    container.querySelector('#forgot-pw-btn')?.addEventListener('click', () => {
      alert('Use your test credentials or register a new user for this hackathon.');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = container.querySelector('#auth-submit');
      const formData = new FormData(form);
      const username = formData.get('username')?.toString().trim();
      const password = formData.get('password')?.toString();

      if (mode === 'register') {
        const confirmPassword = formData.get('confirm_password')?.toString();
        if (password !== confirmPassword) {
          errorMessage = 'Passwords do not match.';
          update();
          return;
        }
      }

      if (!username || !password) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';
      errorMessage = '';

      try {
        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const result = await api(endpoint, {
          method: 'POST',
          body: { username, password }
        });

        if (result.token) {
          setToken(result.token);
          emit('auth-changed');
        }
      } catch (err) {
        errorMessage = err.message || 'Authentication failed. Please try again.';
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
        update();
      }
    });
  }

  update();
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
