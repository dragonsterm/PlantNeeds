/**
 * client/src/ui/components/navbar.js
 * Unified, 100% Shared Reusable Top Navigation Bar for all pages & themes.
 * Zero layout-shift: fixed box-model with absolute active underline indicator.
 */
export function getNavbarHtml({ activeRoute = 'dashboard', theme = 'light' } = {}) {
  const isDark = theme === 'dark';
  const isGardenActive = activeRoute === 'dashboard' || activeRoute === 'garden';
  const isScheduleActive = activeRoute === 'schedule';
  const isDiagnoseActive = activeRoute === 'diagnose';

  const navGlassStyle = isDark
    ? `background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);`
    : `background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 4px 24px rgba(27, 48, 34, 0.08);`;

  const logoTextColor = isDark ? '#FFFFFF' : '#1B3022';
  const activeColor = isDark ? '#FFFFFF' : '#1B3022';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#556353';
  const themeToggleHtml = isDark
    ? `<button id="global-theme-toggle-btn" class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold hover:opacity-90 transition border cursor-pointer" style="background: rgba(255,255,255,0.1); color: #bcf0ae; border-color: rgba(255,255,255,0.15);">
        <span class="material-symbols-outlined text-sm">light_mode</span> Light
      </button>`
    : `<button id="global-theme-toggle-btn" class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold hover:opacity-90 transition border cursor-pointer" style="background: rgba(27,48,34,0.06); color: #154212; border-color: rgba(27,48,34,0.12);">
        <span class="material-symbols-outlined text-sm">dark_mode</span> Dark
      </button>`;
  const addBtnBg = isDark ? '#154212' : '#1B3022';
  const notifBtnBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const notifIconColor = isDark ? '#FFFFFF' : '#1B3022';
  const avatarBorder = isDark ? 'border-white/50' : 'border-[#1B3022]/20';
  const signOutColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#556353';

  return `
    <div class="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
      <nav class="glass-panel rounded-full px-6 py-2.5 shadow-sm transition-all duration-300" style="${navGlassStyle}">
        <div class="flex justify-between items-center w-full">
          <!-- Logo Area -->
          <a href="#dashboard" class="flex items-center gap-3 cursor-pointer" style="text-decoration: none;">
            <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds Logo" style="height: 34px; width: auto; object-fit: contain;" />
            <span class="font-headline-lg text-headline-lg font-bold" style="color: ${logoTextColor};">PlantNeeds</span>
          </a>

          <!-- Navigation Links (Zero-Shift Fixed Box Model) -->
          <div class="flex items-center gap-3 sm:gap-6">
            <!-- My Garden -->
            <a href="#dashboard" class="relative px-3 py-1.5 font-medium text-sm transition-colors cursor-pointer" style="color: ${isGardenActive ? activeColor : inactiveColor}; text-decoration: none;">
              <span class="${isGardenActive ? 'font-bold' : 'font-medium'}">My Garden</span>
              ${isGardenActive ? `<span class="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style="background-color: ${activeColor};"></span>` : ''}
            </a>

            <!-- Care Schedule -->
            <a href="#schedule" class="relative px-3 py-1.5 font-medium text-sm transition-colors cursor-pointer" style="color: ${isScheduleActive ? activeColor : inactiveColor}; text-decoration: none;">
              <span class="${isScheduleActive ? 'font-bold' : 'font-medium'}">Care Schedule</span>
              ${isScheduleActive ? `<span class="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style="background-color: ${activeColor};"></span>` : ''}
            </a>

            <!-- Diagnosis -->
            <a href="#diagnose" class="relative px-3 py-1.5 font-medium text-sm transition-colors cursor-pointer" style="color: ${isDiagnoseActive ? activeColor : inactiveColor}; text-decoration: none;">
              <span class="${isDiagnoseActive ? 'font-bold' : 'font-medium'}">Diagnosis</span>
              ${isDiagnoseActive ? `<span class="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style="background-color: ${activeColor};"></span>` : ''}
            </a>

            <!-- Theme Switcher -->
            ${themeToggleHtml}
          </div>

          <!-- Trailing Actions -->
          <div class="flex items-center gap-4">
            <button id="global-add-plant-btn" class="text-white px-5 py-2 rounded-full font-body-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm border border-transparent cursor-pointer" style="background: ${addBtnBg};">
              <span class="material-symbols-outlined text-sm">add</span> Add Plant
            </button>
            <div class="flex items-center gap-2">
              <button class="p-2 rounded-full hover:opacity-80 transition-opacity" style="background: ${notifBtnBg}; border: none; cursor: pointer; color: ${notifIconColor};">
                <span class="material-symbols-outlined">notifications</span>
              </button>
              <div class="w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm ml-2 cursor-pointer transition-colors ${avatarBorder}">
                <img class="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmX1gzteICusJWAL6o8TBIgj2aEee9UDdvGv6jrJbIKNbZAazY-YqO-IzcOOAN3rTeV7Y-YQ7bLoaXpDW90AIvceHzpVtw_OMpR58pkcZTULK5kL9f5uSdUShAUdorMz1oqpQMUPVUaakMa80pIX8-4nXAjqdeOfMMgRmDTVq2VvPSR-Chyq383zmwaJpVEaEOzhXDp8H7OeeF2QHULS_0Zk6zCCEmoBVeWXE-pzMI2x5Dpphl2Bp_sw"/>
              </div>
              <button id="global-logout-btn" title="Sign Out" class="text-xs underline hover:opacity-100 ml-2" style="color: ${signOutColor}; background: none; border: none; cursor: pointer;">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  `;
}

/**
 * Reusable Weather Alert Banner component matching exact dimensions across all pages.
 */
export function getWeatherBannerHtml({ theme = 'light', weather = null, outdoorCount = 0, indoorDueCount = 0 } = {}) {
  const isDark = theme === 'dark';
  const bannerGlass = isDark
    ? `background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);`
    : `background: #E9ECE2; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 4px 18px rgba(27, 48, 34, 0.06);`;

  const textColor = isDark ? '#FFFFFF' : '#22302A';
  const badgeBg = isDark ? 'rgba(188, 240, 174, 0.2)' : '#CEE8C3';
  const badgeBorder = isDark ? 'rgba(188, 240, 174, 0.35)' : '#A8D799';
  const badgeText = isDark ? '#bcf0ae' : '#1B4D24';
  const dotColor = isDark ? '#bcf0ae' : '#1B4D24';
  const iconBg = isDark ? 'rgba(74, 144, 226, 0.2)' : '#D4E4F0';
  const iconColor = isDark ? '#93C5FD' : '#2B6CB0';

  const rainMm = weather?.recent_rain_mm ?? 53.4;
  const isLive = weather?.data_source === 'live' || weather?.data_source === 'cache';
  const badgeLabel = isLive ? 'LIVE WEATHER' : 'WEATHER';

  return `
    <div id="weather-top-banner" class="rounded-2xl p-3.5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden transition-all duration-300" style="${bannerGlass}">
      <div class="flex items-center gap-3.5 relative z-10">
        <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style="background: ${iconBg}; color: ${iconColor};">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M16 14v6"></path>
            <path d="M8 14v6"></path>
            <path d="M12 16v6"></path>
          </svg>
        </div>
        <p class="font-body-sm" style="color: ${textColor}; margin: 0; font-size: 14px; line-height: 1.4;">
          Rain covered <strong style="font-weight: 700;">${outdoorCount} outdoor garden crops</strong> (${rainMm} mm rain this week). <strong style="font-weight: 700;">${indoorDueCount} indoor houseplants</strong> due today.
        </p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button id="banner-request-location-btn" class="px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition hover:opacity-80 flex items-center gap-1" style="background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; color: ${textColor}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};" title="Update or allow current GPS location">
          <span class="material-symbols-outlined" style="font-size: 14px;">location_on</span>
          <span id="banner-location-city">Locate</span>
        </button>
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full relative z-10 shrink-0" style="background: ${badgeBg}; border: 1px solid ${badgeBorder};">
          <span class="w-1.5 h-1.5 rounded-full" style="background: ${dotColor};"></span>
          <span class="text-[11px] font-bold tracking-wide" style="color: ${badgeText};">${badgeLabel}</span>
        </div>
      </div>
    </div>
  `;
}
