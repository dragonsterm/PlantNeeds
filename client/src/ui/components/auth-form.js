/**
 * client/src/ui/components/auth-form.js
 * Auth UI: Login & Register pages identical to Google Stitch Reference.
 * Independent styling via auth.css (isolated from Dashboard style.css).
 */
import './auth.css';
import { api, setToken } from '../../api/client.js';
import { emit } from '../../state/store.js';

export function renderAuthForm(container, { initialMode = 'login' } = {}) {
  let mode = initialMode; // 'login' or 'register'
  let errorMessage = '';

  function update() {
    container.innerHTML = `
      <div class="auth-page-root">
        <!-- Marble & Leaf Shadow Background for Auth Page -->
        <div class="auth-bg-layer"></div>
        <div class="auth-bg-overlay"></div>

        <div class="auth-modal-card">
          <!-- Brand / Logo Area -->
          <div class="auth-brand-row">
            <span class="material-symbols-outlined auth-brand-icon">potted_plant</span>
            <h1 class="auth-brand-title">${mode === 'login' ? 'PlantNeeds' : 'Join PlantNeeds'}</h1>
          </div>
          <p class="auth-subtext">
            ${mode === 'login' ? 'Welcome back, Plant Parent.' : 'Start your journey as a plant parent.'}
          </p>

          ${errorMessage ? `<div class="error-alert" role="alert">${escapeHtml(errorMessage)}</div>` : ''}

          <!-- Form -->
          <form id="auth-form" autocomplete="off">
            ${mode === 'register' ? `
              <div class="auth-input-group">
                <span class="material-symbols-outlined auth-input-icon">person</span>
                <input id="auth-fullname" class="auth-input-field" type="text" name="fullname" placeholder="Full Name (optional)" />
              </div>
            ` : ''}

            <div class="auth-input-group">
              <span class="material-symbols-outlined auth-input-icon">mail</span>
              <input id="auth-username" class="auth-input-field" type="text" name="username" required minlength="3" maxlength="32" placeholder="Username or Email" />
            </div>

            <div class="auth-input-group">
              <span class="material-symbols-outlined auth-input-icon">lock</span>
              <input id="auth-password" class="auth-input-field" type="password" name="password" required minlength="8" placeholder="Password" />
            </div>

            ${mode === 'register' ? `
              <div class="auth-input-group">
                <span class="material-symbols-outlined auth-input-icon">lock</span>
                <input id="auth-confirm-password" class="auth-input-field" type="password" name="confirm_password" required minlength="8" placeholder="Confirm Password" />
              </div>
            ` : `
              <div class="auth-options">
                <label class="auth-remember-label" for="auth-remember">
                  <input id="auth-remember" type="checkbox" style="accent-color: #154212;" />
                  <span>Remember me</span>
                </label>
                <button type="button" id="forgot-pw-btn" class="auth-forgot-link">
                  Forgot Password?
                </button>
              </div>
            `}

            <button type="submit" class="auth-btn-primary" id="auth-submit">
              ${mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <!-- Divider -->
          <div class="auth-divider">
            <div class="auth-divider-line"></div>
            <span class="auth-divider-text">Or continue with</span>
            <div class="auth-divider-line"></div>
          </div>

          <!-- Social Buttons -->
          <div class="auth-social-row">
            <button type="button" class="auth-btn-social" id="social-google">
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" class="auth-btn-social" id="social-apple">
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05 1.72-3.21 1.72-1.13 0-1.5-.69-2.84-.69-1.34 0-1.76.67-2.84.69-1.11.02-2.23-.82-3.21-1.72-2.01-1.84-3.54-5.2-3.54-8.36 0-5.1 3.31-7.8 6.45-7.8 1.65 0 3.21.58 4.21.58 1 0 2.87-.7 4.82-.7 2.04 0 3.88 1.07 5.01 2.82-4.08 1.7-3.42 7.16.66 8.83-.81 2.04-1.81 4.07-3.51 5.63zM12.03 5.07c-.11-2.39 1.88-4.44 4.23-4.57.22 2.48-2.14 4.71-4.23 4.57z"></path>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          <!-- Footer Switch -->
          <div class="auth-switch-footer">
            <span>${mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
            <button type="button" id="auth-mode-toggle" class="auth-switch-btn">
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
