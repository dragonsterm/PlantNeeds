/**
 * client/src/ui/render.js
 * Central UI render controller & unified routing with persistent Theme State (Light / Dark).
 * Routes:
 * - #dashboard / #garden / "" -> My Garden (uses active theme)
 * - #schedule -> Care Schedule (uses active theme)
 * - #diagnose -> Diagnosis Panel
 */
import { on, clearCache } from '../state/store.js';
import { hasToken, clearToken, setToken } from '../api/client.js';
import { renderAuthForm } from './components/auth-form.js';
import { renderLightDashboard } from './components/render-light-dashboard.js';
import { renderLightSchedule } from './components/render-light-schedule.js';
import { renderDarkSchedule } from './components/render-dark-schedule.js';
import { renderAddPlantModal } from './components/add-plant-form.js';
import { renderScheduleModal } from './components/schedule-modal.js';
import { renderDiagnosisModal } from './components/diagnosis-panel.js';
import { renderGrowthJournalModal } from './components/growth-journal-modal.js';
import { renderSeasonalPlannerModal } from './components/seasonal-planner-modal.js';
import { showToast } from './components/toast-notification.js';
import { listPlants, logCareActivity } from '../logic/plants.js';
import { api } from '../api/client.js';
import { setCache } from '../state/store.js';

import { getNavbarHtml, getWeatherBannerHtml } from './components/navbar.js';

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

export function mountUi() {
  const root = document.getElementById('app');
  if (!root) return;

  // Fallback initial plants
  let userPlants = [
    {
      id: '1',
      name: 'Monstera Deliciosa',
      species: 'Monstera deliciosa',
      location: 'indoor',
      water_frequency_days: 7,
      last_watered: new Date().toISOString().split('T')[0],
      subtitle: 'Houseplant • Indoor',
      days_remaining: 0,
      status_label: 'Due Today',
      is_overdue: true,
      badge_bg: 'bg-status-warning',
      ring_color: 'text-status-warning',
      ring_dashoffset: '10',
      btn_class: 'bg-primary text-white hover:bg-primary-container',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw'
    },
    {
      id: '2',
      name: 'Golden Pothos',
      species: 'Epipremnum aureum',
      location: 'indoor',
      water_frequency_days: 7,
      last_watered: new Date().toISOString().split('T')[0],
      subtitle: 'Houseplant • Indoor',
      days_remaining: 3,
      status_label: 'Healthy',
      is_overdue: false,
      badge_bg: 'bg-primary-fixed',
      ring_color: 'text-primary-fixed',
      ring_dashoffset: '60',
      btn_class: 'bg-white/10 text-white hover:bg-white/20',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxW8RBbT4YPXuDPqRLeQZQr-aXgWG48D8hE_oQLERilCYbEBCHF2gjHmR1fXjqucqbGnduvacZ3V3g9I5boK1H0Wtb9UrOfNj05whoLSdKDEHpmh_LZtbGOeTl7TTIe_pI_C1U_1uqhs1yM7MsHa4T4pH6JQHnNX1VaNeigoC04P3z_su3uuKq5TS9-ANEBa3ebnz18U0PhkUAnYdUN1Rmu1yFC4VeIGeD2DNb5FKvVNQnwEcchk8Yig'
    }
  ];

  let isFetchingLive = false;

  async function syncLivePlants() {
    if (isFetchingLive) return;
    isFetchingLive = true;
    try {
      const livePlants = await listPlants();
      if (livePlants && livePlants.length > 0) {
        userPlants = livePlants.map((p, idx) => ({
          id: p.id,
          name: p.name,
          species: p.species || 'Houseplant',
          location: p.location || 'indoor',
          water_frequency_days: p.water_frequency_days || 7,
          last_watered: p.last_watered || null,
          subtitle: `${p.species || 'Houseplant'} • ${p.location === 'outdoor' ? 'Outdoor Bed' : 'Indoor'}`,
          days_remaining: p.days_remaining ?? idx * 3,
          status_label: (p.days_remaining ?? idx * 3) <= 0 ? 'Due Today' : 'Healthy',
          is_overdue: (p.days_remaining ?? idx * 3) <= 0,
          badge_bg: (p.days_remaining ?? idx * 3) <= 0 ? 'bg-status-warning' : 'bg-primary-fixed',
          ring_color: (p.days_remaining ?? idx * 3) <= 0 ? 'text-status-warning' : 'text-primary-fixed',
          ring_dashoffset: (p.days_remaining ?? idx * 3) <= 0 ? '10' : '60',
          btn_class: (p.days_remaining ?? idx * 3) <= 0 ? 'bg-primary text-white hover:bg-primary-container' : 'bg-white/10 text-white hover:bg-white/20',
          image_url: p.image_url || (idx % 2 === 0 
            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw'
            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxW8RBbT4YPXuDPqRLeQZQr-aXgWG48D8hE_oQLERilCYbEBCHF2gjHmR1fXjqucqbGnduvacZ3V3g9I5boK1H0Wtb9UrOfNj05whoLSdKDEHpmh_LZtbGOeTl7TTIe_pI_C1U_1uqhs1yM7MsHa4T4pH6JQHnNX1VaNeigoC04P3z_su3uuKq5TS9-ANEBa3ebnz18U0PhkUAnYdUN1Rmu1yFC4VeIGeD2DNb5FKvVNQnwEcchk8Yig')
        }));
        setCache('plants', userPlants);
      }
    } catch {
      // Offline-first graceful fallback
    } finally {
      isFetchingLive = false;
    }
  }

  // Preload background assets into memory
  const preloadBg = new Image();
  preloadBg.src = '/assets/summer-vibes-bg.jpg';

  function render() {
    const rawHash = (window.location.hash || '').toLowerCase();
    
    // Check if user explicitly navigated to a legacy themed hash
    if (rawHash.includes('dark')) {
      localStorage.setItem('plantneeds_theme', 'dark');
    } else if (rawHash.includes('light')) {
      localStorage.setItem('plantneeds_theme', 'light');
    }

    const currentTheme = getAppTheme();
    const isScheduleView = rawHash.includes('schedule');
    const isDashboardActive = rawHash.includes('dashboard') || rawHash.includes('garden') || isScheduleView || rawHash === '';
    
    if (!hasToken() && !isDashboardActive) {
      clearCache();
      renderAuthForm(root);
      return;
    }

    if (!hasToken() && isDashboardActive) {
      setToken('demo-token');
    }

    // Keep store cache synchronized for WebMCP tools (Single Source of Truth)
    setCache('plants', userPlants);

    // Non-blocking background revalidation
    syncLivePlants();

    // 1. Single Route for Care Schedule (#schedule)
    if (isScheduleView) {
      if (currentTheme === 'dark') {
        renderDarkSchedule(root, { plants: userPlants, onUpdate: () => render() });
      } else {
        renderLightSchedule(root, { plants: userPlants, onUpdate: () => render() });
      }
      return;
    }

    // 2. Single Route for My Garden (#dashboard / #garden / "")
    if (currentTheme === 'light') {
      renderLightDashboard(root, { userPlants, onUpdate: () => render() });
      return;
    }

    // Render Dark Dashboard (When currentTheme === 'dark') — 100% exact shared layout
    root.innerHTML = `
      <!-- Dashboard Background (Dark Moody Foliage with Raindrops) -->
      <div class="bg-layer"></div>

      <!-- TopNavBar Dark -->
      ${getNavbarHtml({ activeRoute: 'dashboard', theme: 'dark' })}

      <!-- Main Content -->
      <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
        <!-- Top Banner -->
        ${getWeatherBannerHtml({ theme: 'dark' })}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Left 2/3: Plant Grid -->
          <div class="lg:col-span-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
              <div>
                <h2 class="font-headline-xl text-headline-xl text-white drop-shadow-sm">My Plants</h2>
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${userPlants.map((plant, idx) => `
                <div class="glass-card rounded-3xl p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
                  <div class="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-inner">
                    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="${plant.name}" src="${plant.image_url}" />
                    <div class="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/20">
                      <div class="w-2 h-2 rounded-full ${plant.is_overdue ? 'bg-status-warning' : 'bg-primary-fixed'}"></div>
                      <span class="font-label-caps text-label-caps text-white font-semibold">${plant.status_label}</span>
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
                          <path class="text-white/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4"></path>
                          <path class="${plant.is_overdue ? 'text-status-warning' : 'text-primary-fixed'} progress-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="100, 100" stroke-dashoffset="${plant.is_overdue ? '10' : '60'}" stroke-linecap="round" stroke-width="4"></path>
                        </svg>
                        <div class="absolute flex flex-col items-center">
                          <span class="font-body-sm font-bold text-white leading-none font-mono">${plant.days_remaining}d</span>
                        </div>
                      </div>
                      <span class="font-body-sm text-white font-semibold">${plant.is_overdue ? 'Due Today' : `${plant.days_remaining} Days Left`}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button class="open-journal-btn p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition border border-white/10 cursor-pointer" data-id="${plant.id}" title="View Growth Journal">
                        <span class="material-symbols-outlined text-sm">psychiatry</span>
                      </button>
                      <button class="water-btn ${plant.is_overdue ? 'bg-primary text-white hover:bg-primary-container shadow-md border border-white/10' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-sm'} px-5 py-2.5 rounded-full font-body-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer" data-id="${plant.id}">
                        <span class="material-symbols-outlined text-sm">water_drop</span> Water
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right 1/3: Sidebar (Exact 1:1 match with Light Dashboard structure) -->
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
                    <span class="font-headline-xl text-[64px] leading-none text-white font-mono tracking-tighter drop-shadow-sm font-bold">3</span>
                    <div class="mb-2 bg-status-warning/20 border border-status-warning/40 px-3 py-1 rounded-md">
                      <span class="font-label-caps font-bold" style="color: #D97706;">1 OVERDUE</span>
                    </div>
                  </div>
                  <p class="font-body-sm text-sage-soft font-medium">Monstera, Basil, and 1 more</p>
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
              <div class="flex flex-col gap-4">
                <div class="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3 shadow-sm">
                  <span class="material-symbols-outlined text-status-warning mt-0.5" style="color: #D97706; font-size: 22px;">water_drop</span>
                  <div>
                    <h4 class="font-body-sm font-semibold text-white">Monstera Humidity</h4>
                    <p class="font-body-sm text-sage-soft text-xs mt-1 leading-relaxed">Indoor heating is drying the air. Mist leaves today to maintain ~60% humidity.</p>
                  </div>
                </div>
                <div class="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3 shadow-sm">
                  <span class="material-symbols-outlined mt-0.5" style="color: #A1D494; font-size: 22px;">water_drop</span>
                  <div>
                    <h4 class="font-body-sm font-semibold text-white">Outdoor Watering</h4>
                    <p class="font-body-sm text-sage-soft text-xs mt-1 leading-relaxed">Sufficient rain recorded. Skip garden watering today to avoid root rot.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    // Modal Helpers
    const openAddPlantModal = () => renderAddPlantModal(root, { onClose: () => render() });
    const openDiagnosisModal = () => renderDiagnosisModal(() => render());

    // Universal Global Bindings
    root.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
      toggleAppTheme();
    });

    root.querySelector('#global-add-plant-btn')?.addEventListener('click', openAddPlantModal);
    root.querySelector('#open-seasonal-planner-btn')?.addEventListener('click', () => {
      renderSeasonalPlannerModal(root, { onClose: () => render() });
    });

    root.querySelector('#global-logout-btn')?.addEventListener('click', () => {
      clearToken();
      window.location.hash = '';
      render();
    });

    root.querySelectorAll('.open-journal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plant = userPlants.find(p => p.id === id);
        if (plant) {
          renderGrowthJournalModal(root, { plant, onClose: () => render() });
        }
      });
    });

    root.querySelectorAll('a[href="#diagnose"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openDiagnosisModal();
      });
    });

    root.querySelectorAll('.water-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const plantId = btn.getAttribute('data-id');
        btn.textContent = 'Watering...';
        btn.disabled = true;
        try {
          await logCareActivity({ plant_id: plantId, activity: 'watered', source: 'human' });
          render();
        } catch {
          const plant = userPlants.find(p => p.id === plantId);
          if (plant) {
            plant.days_remaining = 7;
            plant.status_label = 'Healthy';
            plant.is_overdue = false;
            plant.badge_bg = 'bg-primary-fixed';
            plant.ring_color = 'text-primary-fixed';
            plant.ring_dashoffset = '60';
            plant.btn_class = 'bg-white/10 text-white hover:bg-white/20';
          }
          render();
        }
      });
    });
  }

  // Reactive Event Bus & Navigation Subscriptions
  on('plants-changed', () => render());
  on('care-logged', () => render());
  on('auth-changed', () => render());
  window.addEventListener('hashchange', () => render());
  window.addEventListener('theme-changed', () => render());

  render();
}
