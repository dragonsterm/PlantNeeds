/**
 * client/src/ui/components/auth-form.js
 * Auth UI: Login, Register, and Forgot Password flows matching botanical glassmorphic styling 1:1.
 */
import { api, setToken } from '../../api/client.js';
import { emit } from '../../state/store.js';

const GOOGLE_CLIENT_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '737088584080-2jstr8naric3ue0m8d3jr1useaf7321i.apps.googleusercontent.com';

export function renderAuthForm(container, { initialMode = 'login' } = {}) {
  let mode = initialMode; // 'login', 'register', or 'forgot'
  let errorMessage = '';
  let successMessage = '';
  let showPassword = false;
  let showConfirmPassword = false;

  // Forgot password two-step state
  let forgotStep = 1; // 1: input username, 2: set new password
  let verifiedUsername = '';

  function update() {
    let cardTitle = 'PlantNeeds';
    let cardSubtitle = 'Welcome back, Plant Parent.';
    if (mode === 'register') {
      cardTitle = 'Join PlantNeeds';
      cardSubtitle = 'Start your journey as a plant parent.';
    } else if (mode === 'forgot') {
      cardTitle = 'Reset Password';
      cardSubtitle = forgotStep === 1 
        ? 'Enter your username to locate your account.' 
        : `Enter a new password for @${verifiedUsername}`;
    }

    container.innerHTML = `
      <div class="h-screen w-full font-body-md text-on-surface antialiased flex items-center justify-center relative overflow-hidden font-['Plus_Jakarta_Sans']">
        <!-- Background Layer -->
        <div class="absolute inset-0 z-0">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/auth-background-marble-leaves.jpg');"></div>
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Auth Modal Card -->
        <main class="relative z-10 w-[90%] max-w-md mx-auto">
          <div class="glass-panel rounded-[32px] p-8 sm:p-10 flex flex-col items-center shadow-lg transition-all" style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.4);">
            <!-- Brand / Logo Area -->
            <div class="mb-6 text-center">
              <div class="flex items-center justify-center gap-2 mb-2">
                <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds Logo" style="height: 36px; width: auto; object-fit: contain;" />
                <h1 class="font-headline-lg text-headline-lg font-bold text-forest-deep tracking-tight" style="color: #1B3022;">
                  ${cardTitle}
                </h1>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant" style="color: #42493e;">
                ${cardSubtitle}
              </p>
            </div>

            ${errorMessage ? `
              <div class="w-full mb-4 p-3 bg-red-100/90 border border-red-300 rounded-xl text-red-800 text-xs text-left flex items-start gap-2 shadow-xs" role="alert">
                <span class="material-symbols-outlined text-sm shrink-0 text-red-600 mt-0.5">error</span>
                <span>${escapeHtml(errorMessage)}</span>
              </div>
            ` : ''}

            ${successMessage ? `
              <div class="w-full mb-4 p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl text-emerald-900 text-xs text-left flex items-start gap-2 shadow-xs" role="status">
                <span class="material-symbols-outlined text-sm shrink-0 text-emerald-700 mt-0.5">check_circle</span>
                <span>${escapeHtml(successMessage)}</span>
              </div>
            ` : ''}

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

              ${mode !== 'forgot' || (mode === 'forgot' && forgotStep === 1) ? `
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-outline" style="color: #72796e; font-size: 20px;">mail</span>
                  </div>
                  <input class="glass-input block w-full pl-11 pr-4 py-3 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-inner" style="background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.5); color: #191c18;" id="auth-username" name="username" placeholder="${mode === 'forgot' ? 'Username or Email' : 'Username or Email'}" type="text" value="${escapeHtml(verifiedUsername)}">
                </div>
              ` : ''}

              ${mode !== 'forgot' || (mode === 'forgot' && forgotStep === 2) ? `
                <!-- Password Field with View/Hide toggle -->
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-outline" style="color: #72796e; font-size: 20px;">lock</span>
                  </div>
                  <input class="glass-input block w-full pl-11 pr-11 py-3 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-inner" style="background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.5); color: #191c18;" id="auth-password" name="password" placeholder="${mode === 'forgot' ? 'New Password' : 'Password'}" minlength="8" type="${showPassword ? 'text' : 'password'}">
                  <button type="button" id="toggle-password-btn" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#72796e] hover:text-[#1B3022] cursor-pointer transition-colors" title="${showPassword ? 'Hide password' : 'Show password'}">
                    <span class="material-symbols-outlined" style="font-size: 20px;">${showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              ` : ''}

              ${(mode === 'register' || (mode === 'forgot' && forgotStep === 2)) ? `
                <!-- Confirm Password Field with View/Hide toggle -->
                <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-outline" style="color: #72796e; font-size: 20px;">lock_reset</span>
                  </div>
                  <input class="glass-input block w-full pl-11 pr-11 py-3 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-inner" style="background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.5); color: #191c18;" id="auth-confirm-password" name="confirm_password" placeholder="${mode === 'forgot' ? 'Confirm New Password' : 'Confirm Password'}" minlength="8" type="${showConfirmPassword ? 'text' : 'password'}">
                  <button type="button" id="toggle-confirm-password-btn" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#72796e] hover:text-[#1B3022] cursor-pointer transition-colors" title="${showConfirmPassword ? 'Hide password' : 'Show password'}">
                    <span class="material-symbols-outlined" style="font-size: 20px;">${showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              ` : ''}

              ${mode === 'login' ? `
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
              ` : ''}

              <div class="pt-2 w-full">
                <button class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-md font-label-caps text-label-caps text-white bg-forest-deep hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-colors duration-300 font-bold cursor-pointer" style="background: #1B3022;" type="submit" id="auth-submit">
                  ${mode === 'login' ? 'Sign In' : (mode === 'register' ? 'Create Account' : (forgotStep === 1 ? 'Verify Username' : 'Reset Password'))}
                </button>
              </div>
            </form>

            ${mode !== 'forgot' ? `
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
            ` : ''}

            <!-- Footer Section -->
            <div class="text-center mt-6 w-full">
              ${mode === 'forgot' ? `
                <button type="button" class="text-primary font-semibold hover:underline cursor-pointer text-xs" id="back-to-login-btn" style="color: #154212; background: none; border: none;">
                  ← Back to Sign In
                </button>
              ` : `
                <p class="font-body-sm text-body-sm text-on-surface-variant" style="color: #42493e;">
                  ${mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button type="button" class="text-primary font-semibold hover:underline ml-1 cursor-pointer" id="auth-mode-toggle" style="color: #154212; background: none; border: none;">
                    ${mode === 'login' ? 'Create Account' : 'Sign In'}
                  </button>
                </p>
              `}

              <!-- Legal Consent Notice & Links -->
              <div class="mt-4 pt-4 border-t border-black/10 flex flex-col items-center gap-2">
                <p class="text-[11px] leading-relaxed text-[#72796e]">
                  By ${mode === 'login' ? 'signing in' : (mode === 'register' ? 'creating an account' : 'resetting your password')}, you agree to our
                </p>
                <div class="flex items-center justify-center gap-3 text-[11px] font-medium text-[#556353]">
                  <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-[#1B3022] transition-colors" style="text-decoration: none; color: inherit;">Privacy Policy</a>
                  <span class="opacity-40">•</span>
                  <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-[#1B3022] transition-colors" style="text-decoration: none; color: inherit;">Terms of Service</a>
                </div>
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
    const forgotBtn = container.querySelector('#forgot-pw-btn');
    const backBtn = container.querySelector('#back-to-login-btn');
    const togglePwBtn = container.querySelector('#toggle-password-btn');
    const toggleConfirmPwBtn = container.querySelector('#toggle-confirm-password-btn');

    togglePwBtn?.addEventListener('click', () => {
      showPassword = !showPassword;
      update();
    });

    toggleConfirmPwBtn?.addEventListener('click', () => {
      showConfirmPassword = !showConfirmPassword;
      update();
    });

    toggleBtn?.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login';
      errorMessage = '';
      successMessage = '';
      update();
    });

    forgotBtn?.addEventListener('click', () => {
      mode = 'forgot';
      forgotStep = 1;
      errorMessage = '';
      successMessage = '';
      verifiedUsername = '';
      update();
    });

    backBtn?.addEventListener('click', () => {
      mode = 'login';
      forgotStep = 1;
      errorMessage = '';
      successMessage = '';
      update();
    });

    googleBtn?.addEventListener('click', () => {
      googleBtn.disabled = true;
      googleBtn.style.opacity = '0.7';

      const backendUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'https://plantneeds-api.onrender.com';
      const redirectUri = `${backendUrl}/api/auth/google/callback`;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
      window.location.href = oauthUrl;
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = container.querySelector('#auth-submit');
      const formData = new FormData(form);

      // Custom validation messages matching app components
      if (mode === 'forgot') {
        if (forgotStep === 1) {
          const uInput = formData.get('username')?.toString().trim();
          if (!uInput) {
            errorMessage = 'Please fill out this field: Username or Email is required.';
            update();
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Verifying Account...';
          errorMessage = '';

          try {
            const res = await api('/api/auth/verify-username', {
              method: 'POST',
              body: { username: uInput }
            });
            if (res && res.success) {
              verifiedUsername = res.username || uInput;
              forgotStep = 2;
              successMessage = `Account confirmed! Set a new password for @${verifiedUsername}.`;
              errorMessage = '';
              update();
            }
          } catch (err) {
            errorMessage = err.message || 'No account found with that username or email.';
            update();
          }
          return;
        } else if (forgotStep === 2) {
          const newPassword = formData.get('password')?.toString();
          const confirmNewPassword = formData.get('confirm_password')?.toString();

          if (!newPassword) {
            errorMessage = 'Please fill out this field: New password is required.';
            update();
            return;
          }
          if (newPassword.length < 8) {
            errorMessage = 'Password needs at least 8 characters to secure your plant collection.';
            update();
            return;
          }
          if (newPassword !== confirmNewPassword) {
            errorMessage = 'Passwords do not match. Please confirm your new password.';
            update();
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Updating Password...';
          errorMessage = '';

          try {
            const res = await api('/api/auth/reset-password', {
              method: 'POST',
              body: { username: verifiedUsername, password: newPassword }
            });
            if (res && res.token) {
              setToken(res.token);
              emit('auth-changed');
            }
          } catch (err) {
            errorMessage = err.message || 'Failed to reset password. Please try again.';
            update();
          }
          return;
        }
      }

      const username = formData.get('username')?.toString().trim();
      const password = formData.get('password')?.toString();

      if (!username) {
        errorMessage = 'Please fill out this field: Username or Email is required.';
        update();
        return;
      }
      if (!password) {
        errorMessage = 'Please fill out this field: Password is required.';
        update();
        return;
      }
      if (mode === 'register') {
        if (password.length < 8) {
          errorMessage = 'Password needs at least 8 characters to secure your plant collection.';
          update();
          return;
        }
        const confirmPassword = formData.get('confirm_password')?.toString();
        if (password !== confirmPassword) {
          errorMessage = 'Passwords do not match. Please confirm your password.';
          update();
          return;
        }
      }

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
  return String(str).replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
