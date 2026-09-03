/**
 * client/src/ui/render.js
 * Central UI render controller & unified routing with per-user persistent state.
 */
import { on, clearCache, setCache } from '../state/store.js';
import { hasToken, clearToken, readStoredToken } from '../api/client.js';
import { renderAuthForm } from './components/auth-form.js';
import { renderLightDashboard } from './components/render-light-dashboard.js';
import { renderLightSchedule } from './components/render-light-schedule.js';
import { renderDarkSchedule } from './components/render-dark-schedule.js';
import { renderLightDiagnosis } from './components/render-light-diagnosis.js';
import { renderDarkDiagnosis } from './components/render-dark-diagnosis.js';
import { renderAddPlantModal } from './components/add-plant-form.js';
import { renderGrowthJournalModal } from './components/growth-journal-modal.js';
import { renderSeasonalPlannerModal } from './components/seasonal-planner-modal.js';
import { showToast } from './components/toast-notification.js';
import { listPlants, logCareActivity } from '../logic/plants.js';
import { getWateringForecast, getCachedWeather, resolveUserCoordinates } from '../logic/weather.js';
import { getNavbarHtml, getWeatherBannerHtml } from './components/navbar.js';
import { getSmartInsightsHtml } from './components/smart-insights.js';

export function getAppTheme() {
  return localStorage.getItem('plantneeds_theme') || 'light';
}

export function setAppTheme(theme) {
  localStorage.setItem('plantneeds_theme', theme);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
}

export function toggleAppTheme() {
  const nextTheme = getAppTheme() === 'dark' ? 'light' : 'dark';
  setAppTheme(nextTheme);
}

// Compute plant dynamic care status from last_watered (Timezone-Proof YYYY-MM-DD)
export function computePlantStatus(p) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const freq = Number(p.water_frequency_days) || 7;
  const lastWateredStr = p.last_watered || null;

  let daysSinceWatered = freq;
  if (lastWateredStr) {
    const [y1, m1, d1] = todayStr.split('-').map(Number);
    const [y2, m2, d2] = lastWateredStr.split('-').map(Number);
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    daysSinceWatered = Math.max(0, Math.round((date1 - date2) / (1000 * 60 * 60 * 24)));
  }

  const daysRemaining = Math.max(0, freq - daysSinceWatered);
  const isOverdue = daysSinceWatered >= freq;

  return {
    ...p,
    last_watered: lastWateredStr,
    days_since_watered: daysSinceWatered,
    days_remaining: daysRemaining,
    status_label: isOverdue ? 'Due Today' : `${daysRemaining}d Left`,
    is_overdue: isOverdue,
    badge_bg: isOverdue ? 'bg-status-warning' : 'bg-primary-fixed',
    ring_color: isOverdue ? 'text-status-warning' : 'text-primary-fixed',
    ring_dashoffset: isOverdue ? '10' : '60',
    btn_class: isOverdue ? 'bg-primary text-white hover:bg-primary-container' : 'bg-white/10 text-white hover:bg-white/20'
  };
}

export const DEFAULT_BOTANICAL_PLANTS = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    species: 'Monstera deliciosa',
    location: 'indoor',
    water_frequency_days: 7,
    last_watered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtitle: 'Houseplant • Indoor',
    pot_has_drainage: false,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw'
  },
  {
    id: '2',
    name: 'Golden Pothos',
    species: 'Epipremnum aureum',
    location: 'indoor',
    water_frequency_days: 7,
    last_watered: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtitle: 'Houseplant • Indoor',
    pot_has_drainage: true,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxW8RBbT4YPXuDPqRLeQZQr-aXgWG48D8hE_oQLERilCYbEBCHF2gjHmR1fXjqucqbGnduvacZ3V3g9I5boK1H0Wtb9UrOfNj05whoLSdKDEHpmh_LZtbGOeTl7TTIe_pI_C1U_1uqhs1yM7MsHa4T4pH6JQHnNX1VaNeigoC04P3z_su3uuKq5TS9-ANEBa3ebnz18U0PhkUAnYdUN1Rmu1yFC4VeIGeD2DNb5FKvVNQnwEcchk8Yig'
  }
];

export function getSavedPlants() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('plantneeds_local_plants') : null;
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(computePlantStatus);
      }
    } catch {}
  }
  
  // Only inject default demo plants if user is NOT logged in (preview mode)
  const isAuth = Boolean(hasToken() || readStoredToken());
  if (!isAuth) {
    return DEFAULT_BOTANICAL_PLANTS.map(computePlantStatus);
  }

  return [];
}

export function savePlantsLocally(plants) {
  localStorage.setItem('plantneeds_local_plants', JSON.stringify(plants));
  setCache('plants', plants.map(computePlantStatus));
}

export function mountUi() {
  const root = document.getElementById('app');
  if (!root) return;

  let userPlants = getSavedPlants();
  let liveWeather = null;
  let isFetchingLive = false;
  let isFetchingWeather = false;

  async function syncWeather(promptGps = false) {
    if (isFetchingWeather) return;
    isFetchingWeather = true;
    try {
      const coords = await resolveUserCoordinates(promptGps);
      const forecast = await getWateringForecast(coords);
      window.__plantneeds_weather = forecast;
      const city = coords.source === 'gps' ? 'Local GPS' : (coords.source === 'stored' ? 'Saved' : 'Auto');
      const labelEl = document.getElementById('banner-location-city');
      if (labelEl) labelEl.textContent = city;
    } catch (err) {
      console.warn('[weather] Sync weather warning:', err.message);
    } finally {
      isFetchingWeather = false;
    }
  }

  async function syncLivePlants() {
    if (isFetchingLive || !hasToken()) return;
    isFetchingLive = true;
    try {
      // 1. Fetch plants from DB
      const livePlants = await listPlants();
      if (Array.isArray(livePlants)) {
        userPlants = livePlants.map((p, idx) => ({
          id: p.id,
          name: p.name,
          species: p.species || 'Houseplant',
          location: p.location || 'indoor',
          water_frequency_days: p.water_frequency_days || 7,
          last_watered: p.last_watered || null,
          subtitle: `${p.species || 'Houseplant'} • ${p.location === 'outdoor' ? 'Outdoor Bed' : 'Indoor'}`,
          image_url: p.image_url || (idx % 2 === 0 
            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw'
            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxW8RBbT4YPXuDPqRLeQZQr-aXgWG48D8hE_oQLERilCYbEBCHF2gjHmR1fXjqucqbGnduvacZ3V3g9I5boK1H0Wtb9UrOfNj05whoLSdKDEHpmh_LZtbGOeTl7TTIe_pI_C1U_1uqhs1yM7MsHa4T4pH6JQHnNX1VaNeigoC04P3z_su3uuKq5TS9-ANEBa3ebnz18U0PhkUAnYdUN1Rmu1yFC4VeIGeD2DNb5FKvVNQnwEcchk8Yig')
        }));
        savePlantsLocally(userPlants);
      }

      // 2. Fetch live weather from Open-Meteo API
      const lat = localStorage.getItem('plantneeds_weather_lat') || '-6.73';
      const lon = localStorage.getItem('plantneeds_weather_lon') || '108.55';
      const wRes = await getWateringForecast({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
      if (wRes && typeof wRes.recent_rain_mm === 'number') {
        liveWeather = wRes;
      }
      render();
    } catch {
      // Offline fallback
    } finally {
      isFetchingLive = false;
    }
  }

  function handleSignOut() {
    clearToken();
    clearCache();
    localStorage.removeItem('plantneeds_local_plants');
    window.location.hash = '';
    render();
  }

  function render() {
    const activeToken = hasToken() || readStoredToken();
    if (!activeToken) {
      clearCache();
      localStorage.removeItem('plantneeds_local_plants');
      renderAuthForm(root);
      return;
    }

    userPlants = getSavedPlants();
    const rawHash = (window.location.hash || '').toLowerCase();
    
    if (rawHash.includes('dark')) {
      localStorage.setItem('plantneeds_theme', 'dark');
    } else if (rawHash.includes('light')) {
      localStorage.setItem('plantneeds_theme', 'light');
    }

    const currentTheme = getAppTheme();
    const isScheduleView = rawHash.includes('schedule');
    const isDiagnoseView = rawHash.includes('diagnose');

    setCache('plants', userPlants);
    syncLivePlants();
    if (!window.__plantneeds_weather) {
      window.__plantneeds_weather = getCachedWeather();
      syncWeather(false);
    }

    // 1. Single Route for Care Schedule (#schedule)
    if (isScheduleView) {
      if (currentTheme === 'dark') {
        renderDarkSchedule(root, { plants: userPlants, weatherData: liveWeather, onUpdate: () => render() });
      } else {
        renderLightSchedule(root, { plants: userPlants, weatherData: liveWeather, onUpdate: () => render() });
      }
      return;
    }

    // 2. Single Route for Diagnosis Page (#diagnose)
    if (isDiagnoseView) {
      if (currentTheme === 'dark') {
        renderDarkDiagnosis(root, { onUpdate: () => render() });
      } else {
        renderLightDiagnosis(root, { onUpdate: () => render() });
      }
      return;
    }

    // 2. Single Route for My Garden (#dashboard / #garden / "")
    if (currentTheme === 'light') {
      renderLightDashboard(root, { userPlants, weatherData: liveWeather, onUpdate: () => render() });
      return;
    }

    // Render Dark Dashboard
    root.innerHTML = `
      <div class="bg-layer"></div>

      <!-- TopNavBar Dark -->
      ${getNavbarHtml({ activeRoute: 'dashboard', theme: 'dark' })}

      <!-- Main Content -->
      <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
        <!-- Top Banner -->
        ${getWeatherBannerHtml({
          theme: 'dark',
          plants: userPlants,
          weather: window.__plantneeds_weather || liveWeather || null,
          outdoorCount: userPlants.filter(p => p.location === 'outdoor').length,
          indoorDueCount: userPlants.filter(p => p.location !== 'outdoor' && (p.is_overdue || p.days_remaining === 0)).length
        })}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Left 2/3: Plant Grid -->
          <div class="lg:col-span-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
              <div>
                <h2 class="font-headline-xl text-headline-xl text-white drop-shadow-sm font-bold">My Plants</h2>
                <div class="flex items-center gap-2 mt-2">
                  <button class="loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 cursor-pointer" data-filter="all">All Plants (${userPlants.length})</button>
                  <button class="loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 cursor-pointer" data-filter="indoor">Indoor (${userPlants.filter(p => p.location !== 'outdoor').length})</button>
                  <button class="loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 cursor-pointer" data-filter="outdoor">Outdoor (${userPlants.filter(p => p.location === 'outdoor').length})</button>
                </div>
              </div>
              <div class="flex gap-2">
                <button id="open-seasonal-planner-btn" class="px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-primary-fixed border border-primary-fixed/30 hover:bg-emerald-900 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <span class="material-symbols-outlined text-sm">calendar_month</span> Seasonal Planner
                </button>
              </div>
            </div>

            ${userPlants.length === 0 ? `
              <div class="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-white/10">
                <span class="material-symbols-outlined text-5xl mb-3 text-emerald-400">potted_plant</span>
                <h3 class="font-headline-lg text-white font-bold mb-1">Your Garden is Empty</h3>
                <p class="font-body-sm text-sage-soft max-w-sm mb-6">Start by adding your first plant to track watering schedules and receive live weather recommendations.</p>
                <button id="empty-add-plant-btn" class="bg-primary text-white px-6 py-3 rounded-full font-body-sm font-semibold hover:bg-primary-container transition flex items-center gap-2 cursor-pointer shadow-md">
                  <span class="material-symbols-outlined text-sm">add</span> Add Your First Plant
                </button>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${userPlants.map(plant => `
                  <div class="glass-card rounded-3xl p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
                    <div class="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-inner">
                      <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="${plant.name}" src="${plant.image_url}" />
                      <div class="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/20">
                        <div class="w-2 h-2 rounded-full ${plant.badge_bg}"></div>
                        <span class="font-label-caps text-label-caps text-white font-semibold">${plant.status_label}</span>
                      </div>
                      <div class="absolute bottom-3 left-3 text-white">
                        <p class="font-label-caps text-xs text-white/90 uppercase tracking-widest drop-shadow-sm">${plant.subtitle}</p>
                      </div>
                    </div>
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <h3 class="font-headline-lg-mobile text-headline-lg-mobile text-white mb-1 font-bold">${plant.name}</h3>
                        <p class="font-body-sm text-sage-soft">${plant.species || 'Houseplant'} • ${plant.location === 'outdoor' ? 'Outdoor' : 'Indoor'}</p>
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                      <div class="flex items-center gap-3">
                        <div class="relative w-12 h-12 flex items-center justify-center">
                          <svg class="w-full h-full transform -rotate-90" viewbox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4"></path>
                            <path class="${plant.ring_color} progress-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="100, 100" stroke-dashoffset="${plant.ring_dashoffset}" stroke-linecap="round" stroke-width="4"></path>
                          </svg>
                          <div class="absolute flex flex-col items-center">
                            <span class="font-body-sm font-bold text-white leading-none font-mono">${plant.days_remaining}d</span>
                          </div>
                        </div>
                        <span class="font-body-sm text-white font-semibold">${plant.status_label}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <button class="open-journal-btn p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition border border-white/10 cursor-pointer" data-id="${plant.id}" title="View Growth Journal">
                          <span class="material-symbols-outlined text-sm">psychiatry</span>
                        </button>
                        <button class="app-water-btn ${plant.btn_class} px-5 py-2.5 rounded-full font-body-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer" data-id="${plant.id}">
                          <span class="material-symbols-outlined text-sm">water_drop</span> Water
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Right 1/3: Sidebar -->
          <div class="lg:col-span-4 flex flex-col gap-6 pt-2 lg:pt-14">
            <!-- Due for Care Card -->
            <div class="glass-card rounded-3xl p-6 relative overflow-hidden">
              <div class="absolute -right-10 -top-10 text-primary-fixed/10 transform rotate-12 pointer-events-none">
                <span class="material-symbols-outlined text-[150px]" style="font-variation-settings: 'FILL' 1; color: #FFFFFF; opacity: 0.08;">water_drop</span>
              </div>
              <div class="relative z-10">
                <h3 class="font-body-md font-semibold text-white mb-2">Due for Care</h3>
                <div class="flex flex-col gap-2 mb-6">
                  <div class="flex items-end gap-4">
                    <span class="font-headline-xl text-[64px] leading-none font-mono tracking-tighter drop-shadow-sm font-bold text-white">${userPlants.filter(p => p.is_overdue || p.days_remaining === 0).length}</span>
                    <div class="mb-2 bg-status-warning/20 border border-status-warning/40 px-3 py-1 rounded-md">
                      <span class="font-label-caps font-bold" style="color: #D97706;">${userPlants.filter(p => p.is_overdue).length} OVERDUE</span>
                    </div>
                  </div>
                  <p class="font-body-sm text-sage-soft font-medium">
                    ${userPlants.filter(p => p.is_overdue || p.days_remaining === 0).length > 0 
                      ? userPlants.filter(p => p.is_overdue || p.days_remaining === 0).map(p => p.name).join(', ')
                      : 'All plants are hydrated & happy'}
                  </p>
                </div>
                <a href="#schedule" id="sidebar-view-schedule-btn" class="w-full bg-primary text-white py-3 rounded-xl font-body-sm font-semibold hover:bg-primary-container transition-colors shadow-md border border-white/10 block text-center cursor-pointer" style="background: #154212; text-decoration: none;">
                  View Schedule
                </a>
              </div>
            </div>

            <!-- Smart Care Insights Widget -->
            <div class="glass-card rounded-3xl p-6">
              <div class="flex items-center gap-3 mb-6">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">lightbulb</span>
                <h3 class="font-headline-lg-mobile text-headline-lg-mobile text-white font-bold" style="font-size: 18px;">Smart Insights</h3>
              </div>
              ${getSmartInsightsHtml({ plants: userPlants, weatherData: liveWeather, theme: 'dark' })}
            </div>
          </div>
        </div>
      </main>
    `;

    root.querySelectorAll('.loc-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        root.querySelectorAll('.loc-filter-btn').forEach(b => {
          b.classList.remove('bg-[#1B3022]/15', 'text-[#1B3022]', 'bg-white/20', 'text-white');
          b.classList.add('bg-white/40', 'text-[#42493e]');
        });
        btn.classList.remove('bg-white/40', 'text-[#42493e]');
        btn.classList.add(getAppTheme() === 'dark' ? 'bg-white/20' : 'bg-[#1B3022]/15', getAppTheme() === 'dark' ? 'text-white' : 'text-[#1B3022]');

        root.querySelectorAll('.grid > div.glass-card').forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            const locText = card.querySelector('p')?.textContent?.toLowerCase() || '';
            const matches = filter === 'outdoor' ? locText.includes('outdoor') : !locText.includes('outdoor');
            card.style.display = matches ? '' : 'none';
          }
        });
      });
    });

    // Request GPS location on button click in weather banner
    root.querySelector('#banner-request-location-btn')?.addEventListener('click', async () => {
      const btn = root.querySelector('#banner-request-location-btn');
      const text = root.querySelector('#banner-location-city');
      if (text) text.textContent = 'Locating...';
      await syncWeather(true);
      showToast({ title: 'Location Updated', message: 'Weather and rain delay updated with local data', source: 'human' });
      render();
    });

    // Modal Helpers
    const openAddPlantModal = () => renderAddPlantModal(root, { onClose: () => render() });
    const openDiagnosisModal = () => renderDiagnosisModal(() => render());

    // Universal Global Bindings
    root.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
      toggleAppTheme();
    });

    root.querySelector('#global-add-plant-btn')?.addEventListener('click', openAddPlantModal);
    root.querySelector('#empty-add-plant-btn')?.addEventListener('click', openAddPlantModal);
    root.querySelector('#open-seasonal-planner-btn')?.addEventListener('click', () => {
      renderSeasonalPlannerModal(root, { onClose: () => render() });
    });

    root.querySelector('#global-logout-btn')?.addEventListener('click', handleSignOut);

    root.querySelectorAll('.open-journal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plant = userPlants.find(p => p.id === id);
        if (plant) {
          renderGrowthJournalModal(root, { plant, onClose: () => render() });
        }
      });
    });

    root.querySelectorAll('.app-water-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const plantId = btn.getAttribute('data-id');
        btn.textContent = 'Watering...';
        btn.disabled = true;

        const currentPlants = getSavedPlants();
        const plant = currentPlants.find(p => p.id === plantId);
        if (plant) {
          plant.last_watered = new Date().toISOString().split('T')[0];
          savePlantsLocally(currentPlants);
        }

        try {
          await logCareActivity({ plant_id: plantId, activity: 'watered', source: 'human' });
        } catch {
          /* saved locally */
        }
        showToast({ title: `${plant?.name || 'Plant'} Watered`, message: 'Schedule updated to 7 days ahead', source: 'human' });
        render();
      });
    });
  }

  // Reactive Event Bus & Navigation Subscriptions
  on('plants-changed', () => render());
  on('care-logged', () => render());
  on('auth-changed', () => render());
  on('weather-updated', () => render());
  window.addEventListener('hashchange', () => render());
  window.addEventListener('theme-changed', () => render());

  render();
}
