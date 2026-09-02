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
import { listPlants, logCareActivity } from '../logic/plants.js';
import { setCache } from '../state/store.js';

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

  async function render() {
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
      }
    } catch {
      // Fallback
    }

    // Keep store cache synchronized for WebMCP tools (Single Source of Truth)
    setCache('plants', userPlants);

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

    // Render Dark Dashboard (When currentTheme === 'dark') — 100% exact from Stitch code.html
    root.innerHTML = `
      <!-- Dashboard Background (Dark Moody Foliage with Raindrops) -->
      <div class="bg-layer"></div>

      <!-- TopNavBar Dark (Exact 1:1 from Stitch code.html) -->
      <div class="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
        <nav class="glass-panel rounded-full px-6 py-3 shadow-sm transition-all duration-300">
          <div class="flex justify-between items-center w-full">
            <!-- Logo Area -->
            <div class="flex items-center gap-3 cursor-pointer">
              <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds Logo" style="height: 34px; width: auto; object-fit: contain;" />
              <span class="font-headline-lg text-headline-lg font-bold text-white">PlantNeeds</span>
            </div>
            <!-- Navigation Links (Web) -->
            <div class="hidden md:flex items-center gap-8">
              <a class="text-white font-semibold border-b-2 border-white pb-1 transition-all duration-150 ease-in-out scale-95" href="#dashboard">My Garden</a>
              <a class="text-white/70 hover:text-white transition-colors hover:bg-white/10 px-3 py-1 rounded-md duration-300" href="#schedule">Care Schedule</a>
              <a class="text-white/70 hover:text-white transition-colors hover:bg-white/10 px-3 py-1 rounded-md duration-300" href="#diagnose">Diagnosis</a>
              <button id="theme-toggle-btn" class="text-primary-fixed hover:underline text-xs" style="background: none; border: none; cursor: pointer; font-weight: 600;">[Switch to Light Theme]</button>
            </div>
            <!-- Trailing Actions -->
            <div class="flex items-center gap-4">
              <button id="nav-add-plant-btn" class="bg-primary text-white px-5 py-2 rounded-full font-body-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm border border-white/10 cursor-pointer">
                <span class="material-symbols-outlined text-sm">add</span> Add Plant
              </button>
              <div class="flex items-center gap-2 text-white">
                <button class="p-2 rounded-full hover:bg-white/20 transition-colors bg-white/10" style="border: none; cursor: pointer;"><span class="material-symbols-outlined">notifications</span></button>
                <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-sm ml-2 cursor-pointer hover:border-white transition-colors">
                  <img class="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmX1gzteICusJWAL6o8TBIgj2aEee9UDdvGv6jrJbIKNbZAazY-YqO-IzcOOAN3rTeV7Y-YQ7bLoaXpDW90AIvceHzpVtw_OMpR58pkcZTULK5kL9f5uSdUShAUdorMz1oqpQMUPVUaakMa80pIX8-4nXAjqdeOfMMgRmDTVq2VvPSR-Chyq383zmwaJpVEaEOzhXDp8H7OeeF2QHULS_0Zk6zCCEmoBVeWXE-pzMI2x5Dpphl2Bp_sw"/>
                </div>
                <button id="logout-btn" title="Sign Out" class="text-white/60 text-xs hover:text-white underline ml-2" style="background: none; border: none; cursor: pointer;">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <!-- Main Content (Exact 1:1 from Stitch code.html) -->
      <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
        <!-- Top Banner -->
        <div class="glass-panel rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
          <div class="flex items-center gap-3 relative z-10">
            <div class="w-10 h-10 rounded-full bg-status-water/20 flex items-center justify-center text-status-water border border-status-water/30">
              <span class="material-symbols-outlined">rainy</span>
            </div>
            <p class="font-body-sm text-white" style="margin: 0;">Rain covered <strong class="font-semibold">3 outdoor garden crops</strong> (53.4 mm rain this week). <strong class="font-semibold text-primary-fixed">2 indoor houseplants</strong> due today.</p>
          </div>
          <div class="flex items-center gap-2 bg-primary/30 px-3 py-1.5 rounded-full relative z-10 border border-primary/40">
            <span class="w-2 h-2 rounded-full bg-primary-fixed"></span>
            <span class="font-label-caps text-label-caps text-white">Live Weather</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Left 2/3: Plant Grid -->
          <div class="lg:col-span-8">
            <div class="flex justify-between items-end mb-6">
              <h2 class="font-headline-xl text-headline-xl text-white drop-shadow-sm">My Plants</h2>
              <div class="flex gap-2">
                <button class="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white border border-white/20 cursor-pointer"><span class="material-symbols-outlined">grid_view</span></button>
                <button class="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white border border-white/10 cursor-pointer"><span class="material-symbols-outlined">format_list_bulleted</span></button>
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
                    <button class="water-btn ${plant.is_overdue ? 'bg-primary text-white hover:bg-primary-container shadow-md border border-white/10' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-sm'} px-6 py-2.5 rounded-full font-body-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer" data-id="${plant.id}">
                      <span class="material-symbols-outlined text-sm">water_drop</span> Water
                    </button>
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
    const openScheduleModal = () => renderScheduleModal(root, { plants: userPlants, onClose: () => render() });
    const openDiagnosisModal = () => renderDiagnosisModal(() => render());

    // Bindings
    root.querySelector('#theme-toggle-btn')?.addEventListener('click', () => {
      toggleAppTheme();
      render();
    });

    root.querySelector('#nav-add-plant-btn')?.addEventListener('click', openAddPlantModal);
    root.querySelector('#logout-btn')?.addEventListener('click', () => {
      clearToken();
      window.location.hash = '';
      render();
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
