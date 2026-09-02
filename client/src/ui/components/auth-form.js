/**
 * client/src/ui/components/auth-form.js
 * Auth UI: Login & Register pages 100% IDENTICAL to Google Stitch Export with new tested logo.
 */
import { api, setToken } from '../../api/client.js';
import { emit } from '../../state/store.js';

const GOOGLE_CLIENT_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '737088584080-2jstr8naric3ue0m8d3jr1useaf7321i.apps.googleusercontent.com';

export function renderAuthForm(container, { initialMode = 'login' } = {}) {
  let mode = initialMode; // 'login' or 'register'
  let errorMessage = '';

  function update() {
    container.innerHTML = `
      <div class="h-screen w-full font-body-md text-on-surface antialiased flex items-center justify-center relative overflow-hidden font-['Plus_Jakarta_Sans']">
        <!-- Background Layer from Stitch -->
        <div class="absolute inset-0 z-0">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/auth-background-marble-leaves.jpg');"></div>
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Auth Modal Card from Stitch -->
        <main class="relative z-10 w-[90%] max-w-md mx-auto">
          <div class="glass-panel rounded-[32px] p-8 sm:p-10 flex flex-col items-center shadow-lg" style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.4);">
            <!-- Brand / Logo Area -->
            <div class="mb-6 text-center">
              <div class="flex items-center justify-center gap-2 mb-2">
                <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds Logo" style="height: 36px; width: auto; object-fit: contain;" />
                <h1 class="font-headline-lg text-headline-lg font-bold text-forest-deep tracking-tight" style="color: #1B3022;">
                  ${mode === 'login' ? 'PlantNeeds' : 'Join PlantNeeds'}
                </h1>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant" style="color: #42493e;">
                ${mode === 'login' ? 'Welcome back, Plant Parent.' : 'Start your journey as a plant parent.'}
              </p>
            </div>

            ${errorMessage ? `<div class="w-full mb-4 p-3 bg-red-100/80 border border-red-300 rounded-xl text-red-800 text-xs text-left" role="alert">${escapeHtml(errorMessage)}</div>` : ''}

            <!-- Form Stack -->
            <form id="auth-form" class="w-full space-y-4" autocomplete="off">
              ${mode === 'register' ? `
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-outline" style="color: #72796e; font-size: 20px;">person</span>
                  </div>
                  <input class="glass-input block w-full pl-11 pr-4 py-3 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-inner" style="background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.5); color: #191c18;" id="auth-fullname" name="fullname" placeholder="Full Name (optional)" type="text">
                </div>
              ` : ''}

              <div class="relative w-full">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-outline" style="color: #72796e; font-size: 20px;">mail</span>
                </div>
                <input class="glass-input block w-full pl-11 pr-4 py-3 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-inner" style="background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.5); color: #191c18;" id="auth-username" name="username" placeholder="Username or Email" required type="text">
              </div>

              <div class="relative w-full">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-outline" style="color: #72796e; font-size: 20px;">lock</span>
                </div>
                <input class="glass-input block w-full pl-11 pr-4 py-3 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-inner" style="background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.5); color: #191c18;" id="auth-password" name="password" placeholder="Password" required minlength="8" type="password">
              </div>

              ${mode === 'register' ? `
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-outline" style="color: #72796e; font-size: 20px;">lock</span>
                  </div>
                  <input class="glass-input block w-full pl-11 pr-4 py-3 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-inner" style="background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.5); color: #191c18;" id="auth-confirm-password" name="confirm_password" placeholder="Confirm Password" required minlength="8" type="password">
                </div>
              ` : `
                <div class="flex items-center justify-between py-1 w-full text-xs">
                  <div class="flex items-center">
                    <input class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary-container bg-white/70" id="remember-me" name="remember-me" type="checkbox" style="accent-color: #154212;">
                    <label class="ml-2 block font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none" for="remember-me" style="color: #42493e;">
                      Remember me
                    </label>
                  </div>
                  <div>
                    <a class="font-body-sm text-body-sm font-semibold text-primary hover:text-forest-deep transition-colors cursor-pointer" id="forgot-pw-btn" style="color: #154212;">
                      Forgot Password?
                    </a>
                  </div>
                </div>
              `}

              <div class="pt-2 w-full">
                <button class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-md font-label-caps text-label-caps text-white bg-forest-deep hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-colors duration-300 font-bold cursor-pointer" style="background: #1B3022;" type="submit" id="auth-submit">
                  ${mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>

            <!-- Divider -->
            <div class="mt-6 w-full flex items-center justify-between">
              <span class="border-b border-black/15 w-1/4"></span>
              <span class="font-body-sm text-body-sm text-on-surface-variant/80 uppercase tracking-widest text-[11px]" style="color: #72796e;">Or continue with</span>
              <span class="border-b border-black/15 w-1/4"></span>
            </div>

            <!-- Social Logins (Google Only) -->
            <div class="mt-5 w-full">
              <button type="button" class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/40 bg-white/60 hover:bg-white/80 backdrop-blur-sm transition-all duration-200 font-body-sm text-body-sm text-on-surface font-semibold shadow-sm cursor-pointer" id="social-google" style="color: #191c18;">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </button>
            </div>

            <!-- Footer -->
            <div class="text-center mt-6 w-full">
              <p class="font-body-sm text-body-sm text-on-surface-variant" style="color: #42493e;">
                ${mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button type="button" class="text-primary font-semibold hover:underline ml-1 cursor-pointer" id="auth-mode-toggle" style="color: #154212; background: none; border: none;">
                  ${mode === 'login' ? 'Create Account' : 'Sign In'}
                </button>
              </p>

              <div class="mt-4 pt-4 border-t border-black/10 flex items-center justify-center gap-3 text-[11px] text-[#72796e]">
                <a href="/privacy-policy.html" target="_blank" class="hover:underline hover:text-[#1B3022] transition-colors" style="text-decoration: none; color: inherit;">Privacy Policy</a>
                <span>•</span>
                <a href="/terms-of-service.html" target="_blank" class="hover:underline hover:text-[#1B3022] transition-colors" style="text-decoration: none; color: inherit;">Terms of Service</a>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    // Event listeners
    const form = container.querySelector('#auth-form');
    const toggleBtn = container.querySelector('#auth-mode-toggle');
    const googleBtn = container.querySelector('#social-google');

    toggleBtn?.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login';
      errorMessage = '';
      update();
    });

    googleBtn?.addEventListener('click', () => {
      googleBtn.disabled = true;
      googleBtn.style.opacity = '0.7';

      // Standard Authorization Code flow via backend callback to guarantee valid redirect_uri
      const backendUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'https://plantneeds-api.onrender.com';
      const redirectUri = `${backendUrl}/api/auth/google/callback`;
      
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

      window.location.href = oauthUrl;
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

        if (result && result.token) {
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
