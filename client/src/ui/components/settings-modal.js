/**
 * client/src/ui/components/settings-modal.js
 * Gardener Profile & Settings Modal.
 * Dynamic User Profile (Google Avatar or Social Account Icon), Zero Fake Dots, Zero Placeholders.
 */
import { getAppTheme, setAppTheme } from '../render.js';
import { api, clearToken } from '../../api/client.js';
import { clearCache, emit } from '../../state/store.js';
import { resolveUserCoordinates, getWateringForecast, getFriendlyCityName } from '../../logic/weather.js';
import { showToast } from './toast-notification.js';

export function getUserAvatarHtml({ username = 'Gardener', avatarUrl = null, size = 48, isDark = false } = {}) {
  const initial = (username || 'G').trim().charAt(0).toUpperCase();
  const isValidImg = Boolean(
    avatarUrl && 
    typeof avatarUrl === 'string' && 
    (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image/')) && 
    !avatarUrl.includes('stitch-placeholder')
  );

  if (isValidImg) {
    return `
      <div class="rounded-full overflow-hidden border-2 shadow-xs shrink-0 flex items-center justify-center ${isDark ? 'border-white/30' : 'border-white'}" style="width: ${size}px; height: ${size}px;">
        <img alt="${username}" class="w-full h-full object-cover" src="${avatarUrl}" />
      </div>
    `;
  }

  // Clean social media style default avatar
  const bg = isDark ? 'rgba(188, 240, 174, 0.15)' : '#E5ECE4';
  const color = isDark ? '#bcf0ae' : '#154212';

  return `
    <div class="rounded-full flex items-center justify-center font-bold shadow-xs shrink-0 border border-black/5" style="width: ${size}px; height: ${size}px; background: ${bg}; color: ${color}; font-size: ${Math.round(size * 0.42)}px;">
      ${initial}
    </div>
  `;
}

export async function renderSettingsModal(container, { onUpdate = () => {} } = {}) {
  // Prevent double modal stacking
  const existing = document.getElementById('gardener-settings-modal');
  if (existing) {
    existing.remove();
  }

  // 1. Fetch real current user profile from server
  const localAvatar = typeof localStorage !== 'undefined' ? localStorage.getItem('plantneeds_avatar') : null;
  let currentUser = {
    username: localStorage.getItem('plantneeds_username') || 'Gardener',
    email: localStorage.getItem('plantneeds_email') || 'gardener@local',
    avatar_url: localAvatar,
    provider: localStorage.getItem('plantneeds_provider') || 'local'
  };

  try {
    const res = await api('/api/auth/me');
    if (res && res.user) {
      if (res.user.username) {
        currentUser.username = res.user.username;
        localStorage.setItem('plantneeds_username', res.user.username);
      }
      if (res.user.email) {
        currentUser.email = res.user.email;
        localStorage.setItem('plantneeds_email', res.user.email);
      }
      if (res.user.provider) {
        currentUser.provider = res.user.provider;
        localStorage.setItem('plantneeds_provider', res.user.provider);
      }
      if (res.user.avatar_url) {
        currentUser.avatar_url = res.user.avatar_url;
        localStorage.setItem('plantneeds_avatar', res.user.avatar_url);
      } else if (localAvatar) {
        currentUser.avatar_url = localAvatar;
        // Sync local avatar to database
        api('/api/auth/me', { method: 'PUT', body: { avatar_url: localAvatar } }).catch(() => {});
      }
    }
  } catch {
    // Offline or cached state
  }

  const currentTheme = getAppTheme();
  const isDark = currentTheme === 'dark';

  const rainDelayEnabled = localStorage.getItem('plantneeds_pref_rain_delay') !== 'false';
  const webmcpSyncEnabled = localStorage.getItem('plantneeds_pref_webmcp_sync') !== 'false';

  const lat = localStorage.getItem('plantneeds_weather_lat') || '-6.7321';
  const lon = localStorage.getItem('plantneeds_weather_lon') || '108.5521';
  const city = localStorage.getItem('plantneeds_weather_city') || getFriendlyCityName(parseFloat(lat), parseFloat(lon));

  const modal = document.createElement('div');
  modal.id = 'gardener-settings-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-all duration-300';

  const modalBg = isDark
    ? 'background: rgba(17, 34, 23, 0.88); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); color: #FFFFFF;'
    : 'background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 25px 50px -12px rgba(17, 34, 23, 0.25); color: #1B3022;';

  const cardInnerBg = isDark
    ? 'background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1);'
    : 'background: rgba(255, 255, 255, 0.65); border: 1px solid rgba(255, 255, 255, 0.85);';

  const textPrimary = isDark ? 'text-white' : 'text-[#1B3022]';
  const textMuted = isDark ? 'text-white/70' : 'text-[#556353]';
  const dividerColor = isDark ? 'border-white/10' : 'border-[#1B3022]/10';

  const isGoogle = currentUser.provider === 'google' || (currentUser.email && currentUser.email.includes('@gmail.com'));

  modal.innerHTML = `
    <div class="relative w-full max-w-[520px] rounded-[28px] p-6 sm:p-8 shadow-2xl transition-all duration-300" style="${modalBg}">
      
      <!-- 1. HEADER -->
      <div class="flex items-center justify-between pb-4 border-b ${dividerColor}">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style="background: ${isDark ? 'rgba(188, 240, 174, 0.15)' : '#E5ECE4'}; color: ${isDark ? '#bcf0ae' : '#154212'};">
            <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">potted_plant</span>
          </div>
          <div>
            <h2 class="text-[19px] font-bold tracking-tight ${textPrimary} leading-tight" style="font-family: 'Plus Jakarta Sans', sans-serif;">Gardener Settings</h2>
            <p class="text-[11px] ${textMuted} font-medium">Preferences &amp; WebMCP Telemetry</p>
          </div>
        </div>
        <button id="close-settings-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer" style="background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; color: ${isDark ? '#fff' : '#1B3022'}; border: none;" title="Close">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div class="mt-5 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        
        <!-- 2. USER PROFILE HERO CARD (100% Real User Data + Avatar Upload) -->
        <div class="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs" style="${cardInnerBg}">
          <div class="flex items-center gap-3.5">
            <div class="relative group cursor-pointer" id="avatar-trigger-container" title="Click to change profile picture">
              <div id="settings-avatar-preview">
                ${getUserAvatarHtml({ username: currentUser.username, avatarUrl: currentUser.avatar_url, size: 54, isDark })}
              </div>
              <div class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <span class="material-symbols-outlined text-sm">photo_camera</span>
              </div>
              <input type="file" id="settings-avatar-file-input" accept="image/*" class="hidden" />
            </div>
            <div>
              <div class="text-[16px] font-bold ${textPrimary} leading-snug" style="font-family: 'Plus Jakarta Sans', sans-serif;">${currentUser.username}</div>
              <div class="text-xs ${textMuted} font-mono">${currentUser.email || 'No email registered'}</div>
              <div class="flex items-center gap-2 mt-1">
                <button id="btn-upload-photo" class="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer bg-transparent border-0 p-0 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[13px]">upload</span> Change Photo
                </button>
                <span id="btn-remove-separator" class="text-[10px] text-gray-400" style="display: ${currentUser.avatar_url ? 'inline' : 'none'};">•</span>
                <button id="btn-remove-photo" class="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer bg-transparent border-0 p-0" style="display: ${currentUser.avatar_url ? 'inline' : 'none'};">
                  Remove
                </button>
              </div>
            </div>
          </div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-tight shadow-xs self-start sm:self-center" style="background: ${isDark ? 'rgba(188, 240, 174, 0.18)' : '#E3EFE1'}; color: ${isDark ? '#bcf0ae' : '#154212'}; border: 1px solid ${isDark ? 'rgba(188, 240, 174, 0.3)' : '#BBD7B7'};">
            <span class="material-symbols-outlined text-[14px] font-bold">${isGoogle ? 'verified_user' : 'person'}</span>
            <span>${isGoogle ? 'Google Connected' : 'Local Account'}</span>
          </div>
        </div>

        <!-- 3. SECTION: INTERFACE THEME -->
        <div class="space-y-2">
          <div class="text-[11px] uppercase font-bold tracking-wider ${textMuted} px-0.5">Interface Theme</div>
          <div class="grid grid-cols-2 gap-2 p-1.5 rounded-2xl" style="background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};">
            <button id="theme-select-light-btn" class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${!isDark ? 'bg-white text-[#1B3022] shadow-sm border border-black/5' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'}">
              <span class="material-symbols-outlined text-[18px] ${!isDark ? 'text-[#154212]' : ''}" style="font-variation-settings: 'FILL' ${!isDark ? 1 : 0};">light_mode</span>
              <span>Light Summer Vibes</span>
            </button>
            <button id="theme-select-dark-btn" class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${isDark ? 'bg-white/20 text-white shadow-sm border border-white/20' : 'text-[#556353] hover:text-[#1B3022] hover:bg-white/50 border border-transparent'}">
              <span class="material-symbols-outlined text-[18px] ${isDark ? 'text-primary-fixed' : ''}" style="font-variation-settings: 'FILL' ${isDark ? 1 : 0};">dark_mode</span>
              <span>Dark Emerald</span>
            </button>
          </div>
        </div>

        <!-- 4. SECTION: GARDEN LOCATION & WEATHER -->
        <div class="space-y-2">
          <div class="text-[11px] uppercase font-bold tracking-wider ${textMuted} px-0.5">Garden Location</div>
          <div class="rounded-2xl p-3.5 flex items-center justify-between shadow-xs" style="${cardInnerBg}">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background: ${isDark ? 'rgba(255,255,255,0.1)' : '#E8EFE7'}; color: ${isDark ? '#bcf0ae' : '#1B3022'};">
                <span class="material-symbols-outlined text-[18px]">location_on</span>
              </div>
              <div class="truncate">
                <div id="settings-city-display" class="text-xs font-bold ${textPrimary}">${city}</div>
                <div id="settings-coord-display" class="text-[11px] font-mono ${textMuted}">(${parseFloat(lat).toFixed(2)}°, ${parseFloat(lon).toFixed(2)}°) · Open-Meteo</div>
              </div>
            </div>
            <button id="settings-update-gps-btn" class="shrink-0 ml-3 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer" style="background: ${isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF'}; color: ${isDark ? '#FFFFFF' : '#1B3022'}; border-color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(27,48,34,0.15)'};">
              <span class="material-symbols-outlined text-[14px]">my_location</span>
              <span id="settings-gps-btn-label">Update GPS</span>
            </button>
          </div>
        </div>

        <!-- 5. SECTION: WEBMCP AI AGENT AUTOMATIONS -->
        <div class="space-y-2">
          <div class="text-[11px] uppercase font-bold tracking-wider ${textMuted} px-0.5">Agent Automations</div>
          <div class="rounded-2xl divide-y ${dividerColor} overflow-hidden shadow-xs" style="${cardInnerBg}">
            <!-- Row 1: Rain Delay Auto-Skip -->
            <div class="p-3.5 flex items-center justify-between gap-3">
              <div class="space-y-0.5">
                <div class="text-xs font-bold ${textPrimary} flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-cyan-600">cloud</span>
                  <span>Rain Delay Auto-Skip</span>
                </div>
                <p class="text-[11px] ${textMuted} leading-relaxed">Skip outdoor watering when weekly rainfall ≥ 5mm</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer shrink-0">
                <input id="toggle-rain-delay" type="checkbox" ${rainDelayEnabled ? 'checked' : ''} class="sr-only peer"/>
                <div class="w-10 h-5 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#154212]"></div>
              </label>
            </div>
            <!-- Row 2: WebMCP Remote Sync -->
            <div class="p-3.5 flex items-center justify-between gap-3">
              <div class="space-y-0.5">
                <div class="text-xs font-bold ${textPrimary} flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-emerald-600">smart_toy</span>
                  <span>WebMCP Remote Sync</span>
                </div>
                <p class="text-[11px] ${textMuted} leading-relaxed">Allow ChatGPT &amp; agents to inspect schedule and log care</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer shrink-0">
                <input id="toggle-webmcp-sync" type="checkbox" ${webmcpSyncEnabled ? 'checked' : ''} class="sr-only peer"/>
                <div class="w-10 h-5 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#154212]"></div>
              </label>
            </div>
          </div>
        </div>

      </div>

      <!-- 6. FOOTER ACTIONS -->
      <div class="mt-6 pt-4 border-t ${dividerColor} flex items-center justify-between">
        <button id="settings-signout-btn" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-400/40 hover:border-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition-all cursor-pointer">
          <span class="material-symbols-outlined text-[16px]">logout</span>
          <span>Sign Out</span>
        </button>
        <button id="settings-save-btn" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#154212] hover:bg-[#1B3022] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-white/10">
          <span class="material-symbols-outlined text-[16px]">save</span>
          <span>Save Preferences</span>
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => {
    modal.remove();
    onUpdate();
  };

  modal.querySelector('#close-settings-modal-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Avatar Upload / Change Photo handlers
  const fileInput = modal.querySelector('#settings-avatar-file-input');
  const triggerContainer = modal.querySelector('#avatar-trigger-container');
  const btnUpload = modal.querySelector('#btn-upload-photo');
  const btnRemove = modal.querySelector('#btn-remove-photo');

  const openPicker = () => fileInput?.click();
  triggerContainer?.addEventListener('click', openPicker);
  btnUpload?.addEventListener('click', (e) => {
    e.preventDefault();
    openPicker();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({ title: 'Invalid File', message: 'Please select an image file (PNG/JPG)', type: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast({ title: 'Image Too Large', message: 'Maximum photo size is 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      localStorage.setItem('plantneeds_avatar', base64);
      currentUser.avatar_url = base64;

      // Update avatar inside settings modal preview
      const previewContainer = modal.querySelector('#settings-avatar-preview');
      if (previewContainer) {
        previewContainer.innerHTML = getUserAvatarHtml({
          username: currentUser.username,
          avatarUrl: base64,
          size: 54,
          isDark
        });
      }

      // Update avatar in navbar directly
      const navAvatarBtn = document.querySelector('#navbar-user-avatar-btn');
      if (navAvatarBtn) {
        navAvatarBtn.innerHTML = `<img class="w-full h-full object-cover" alt="${currentUser.username}" src="${base64}" />`;
      }

      // Show remove photo action
      const btnRemoveEl = modal.querySelector('#btn-remove-photo');
      const btnRemoveSep = modal.querySelector('#btn-remove-separator');
      if (btnRemoveEl) btnRemoveEl.style.display = 'inline';
      if (btnRemoveSep) btnRemoveSep.style.display = 'inline';

      // Sync avatar to database
      api('/api/auth/me', { method: 'PUT', body: { avatar_url: base64 } }).catch(() => {});

      showToast({ title: 'Profile Photo Updated', message: 'Avatar updated and saved', type: 'success' });
      emit('auth-changed');
    };
    reader.readAsDataURL(file);
  });

  btnRemove?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('plantneeds_avatar');
    currentUser.avatar_url = null;

    const previewContainer = modal.querySelector('#settings-avatar-preview');
    if (previewContainer) {
      previewContainer.innerHTML = getUserAvatarHtml({
        username: currentUser.username,
        avatarUrl: null,
        size: 54,
        isDark
      });
    }

    const initial = (currentUser.username || 'G').trim().charAt(0).toUpperCase();
    const navAvatarBtn = document.querySelector('#navbar-user-avatar-btn');
    if (navAvatarBtn) {
      navAvatarBtn.innerHTML = `<span class="font-bold text-xs" style="color: ${isDark ? '#bcf0ae' : '#154212'};">${initial}</span>`;
    }

    const btnRemoveEl = modal.querySelector('#btn-remove-photo');
    const btnRemoveSep = modal.querySelector('#btn-remove-separator');
    if (btnRemoveEl) btnRemoveEl.style.display = 'none';
    if (btnRemoveSep) btnRemoveSep.style.display = 'none';

    // Sync avatar removal to database
    api('/api/auth/me', { method: 'PUT', body: { avatar_url: null } }).catch(() => {});

    showToast({ title: 'Photo Removed', message: 'Restored default social account avatar', type: 'success' });
    emit('auth-changed');
  });

  modal.querySelector('#theme-select-light-btn')?.addEventListener('click', () => {
    setAppTheme('light');
    modal.remove();
    renderSettingsModal(container, { onUpdate });
    onUpdate();
  });

  modal.querySelector('#theme-select-dark-btn')?.addEventListener('click', () => {
    setAppTheme('dark');
    modal.remove();
    renderSettingsModal(container, { onUpdate });
    onUpdate();
  });

  modal.querySelector('#settings-update-gps-btn')?.addEventListener('click', async () => {
    const label = modal.querySelector('#settings-gps-btn-label');
    if (label) label.textContent = 'Locating...';
    try {
      const coords = await resolveUserCoordinates(true);
      const forecast = await getWateringForecast(coords);
      window.__plantneeds_weather = forecast;
      
      const newCity = getFriendlyCityName(coords.latitude, coords.longitude);
      localStorage.setItem('plantneeds_weather_city', newCity);

      const cityEl = modal.querySelector('#settings-city-display');
      const coordEl = modal.querySelector('#settings-coord-display');
      if (cityEl) cityEl.textContent = newCity;
      if (coordEl) coordEl.textContent = `(${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°) · Open-Meteo`;

      showToast({ title: 'Location Updated', message: `Weather set to ${newCity}`, type: 'success' });
    } catch (err) {
      showToast({ title: 'Location Error', message: err.message, type: 'error' });
    } finally {
      if (label) label.textContent = 'Update GPS';
    }
  });

  modal.querySelector('#settings-save-btn')?.addEventListener('click', () => {
    const rainDelay = modal.querySelector('#toggle-rain-delay')?.checked ?? true;
    const webmcpSync = modal.querySelector('#toggle-webmcp-sync')?.checked ?? true;

    localStorage.setItem('plantneeds_pref_rain_delay', String(rainDelay));
    localStorage.setItem('plantneeds_pref_webmcp_sync', String(webmcpSync));

    showToast({ title: 'Settings Saved', message: 'Preferences updated successfully', type: 'success' });
    closeModal();
  });

  modal.querySelector('#settings-signout-btn')?.addEventListener('click', () => {
    clearToken();
    clearCache();
    localStorage.removeItem('plantneeds_auth_token');
    localStorage.removeItem('plantneeds_local_plants');
    localStorage.removeItem('plantneeds_username');
    localStorage.removeItem('plantneeds_email');
    localStorage.removeItem('plantneeds_avatar');
    localStorage.removeItem('plantneeds_provider');
    document.cookie = 'plantneeds_auth_token=; Max-Age=-99999999; path=/; SameSite=Lax';
    modal.remove();
    window.location.hash = '';
    showToast({ title: 'Signed Out', message: 'You have been signed out', type: 'info' });
    emit('auth-changed');
  });
}
