/**
 * client/src/ui/components/render-light-dashboard.js
 * Dedicated Light Theme Botanical Ether Dashboard view matching Google Stitch 1:1.
 */
import { clearToken } from '../../api/client.js';
import { clearCache, emit } from '../../state/store.js';
import { getAppTheme, toggleAppTheme, getSavedPlants, savePlantsLocally } from '../render.js';
import { renderAddPlantModal } from './add-plant-form.js';
import { renderGrowthJournalModal } from './growth-journal-modal.js';
import { renderSeasonalPlannerModal } from './seasonal-planner-modal.js';
import { showToast } from './toast-notification.js';
import { logCareActivity } from '../../logic/plants.js';
import { getNavbarHtml, getWeatherBannerHtml } from './navbar.js';
import { getSmartInsightsHtml } from './smart-insights.js';
import { resolveUserCoordinates, getWateringForecast, getFriendlyCityName } from '../../logic/weather.js';

export function renderLightDashboard(container, { userPlants = [], weatherData = null, onUpdate = () => {} } = {}) {
  container.innerHTML = `
    <!-- Summer Vibes Background Layer -->
    <div class="fixed inset-0 z-[-1] pointer-events-none">
      <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg');"></div>
    </div>

    <!-- Top Floating Navbar -->
    ${getNavbarHtml({ activeRoute: 'dashboard', theme: 'light' })}

    <!-- Main Content -->
    <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
      <!-- Top Weather Banner -->
      ${getWeatherBannerHtml({
        theme: 'light',
        plants: userPlants,
        weather: window.__plantneeds_weather || weatherData || null,
        outdoorCount: userPlants.filter(p => p.location === 'outdoor').length,
        indoorDueCount: userPlants.filter(p => p.location !== 'outdoor' && (p.is_overdue || p.days_remaining === 0)).length
      })}

      <!-- Main Layout: Grid + Sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left 2/3: Plant Grid -->
        <div class="lg:col-span-8">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
            <div>
              <h2 class="font-headline-xl text-headline-xl text-[#1B3022] drop-shadow-sm font-bold" style="font-family: 'Plus Jakarta Sans', sans-serif;">My Plants</h2>
              <div class="flex items-center gap-2 mt-2">
                <button class="loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-[#1B3022]/15 text-[#1B3022] border border-[#1B3022]/30 cursor-pointer" data-filter="all">All Plants (${userPlants.length})</button>
                <button class="loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/40 text-[#42493e] border border-[#1B3022]/10 hover:bg-white/60 cursor-pointer" data-filter="indoor">Indoor (${userPlants.filter(p => p.location !== 'outdoor').length})</button>
                <button class="loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/40 text-[#42493e] border border-[#1B3022]/10 hover:bg-white/60 cursor-pointer" data-filter="outdoor">Outdoor (${userPlants.filter(p => p.location === 'outdoor').length})</button>
              </div>
            </div>
            <div class="flex gap-2">
              <button id="light-seasonal-planner-btn" class="px-3.5 py-1.5 rounded-full bg-emerald-900/10 text-[#154212] border border-[#154212]/30 hover:bg-emerald-900/20 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <span class="material-symbols-outlined text-sm">calendar_month</span> Seasonal Planner
              </button>
            </div>
          </div>

          <!-- Cards Grid -->
          ${userPlants.length === 0 ? `
            <div class="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-[#1B3022]/10" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
              <span class="material-symbols-outlined text-5xl mb-3 text-[#154212]">potted_plant</span>
              <h3 class="font-headline-lg text-[#1B3022] font-bold mb-1">Your Garden is Empty</h3>
              <p class="font-body-sm text-[#556353] max-w-sm mb-6">Start by adding your first plant to track watering schedules and receive live weather recommendations.</p>
              <button id="light-empty-add-plant-btn" class="bg-[#154212] text-white px-6 py-3 rounded-full font-body-sm font-semibold hover:bg-[#1B3022] transition flex items-center gap-2 cursor-pointer shadow-md">
                <span class="material-symbols-outlined text-sm">add</span> Add Your First Plant
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${userPlants.map(plant => `
                <div class="glass-card rounded-3xl p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
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
                      <h3 class="font-headline-lg-mobile text-headline-lg-mobile text-[#1B3022] mb-1 font-bold">${plant.name}</h3>
                      <p class="font-body-sm text-[#556353] font-medium">${plant.species || 'Houseplant'} • ${plant.location === 'outdoor' ? 'Outdoor' : 'Indoor'}</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between mt-auto pt-4 border-t border-[#1B3022]/10">
                    <div class="flex items-center gap-3">
                      <div class="relative w-12 h-12 flex items-center justify-center">
                        <svg class="w-full h-full transform -rotate-90" viewbox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E1E8E0" stroke-width="4"></path>
                          <path class="${plant.ring_color} progress-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="100, 100" stroke-dashoffset="${plant.ring_dashoffset}" stroke-linecap="round" stroke-width="4"></path>
                      </svg>
                      <div class="absolute flex flex-col items-center">
                        <span class="font-body-sm font-bold text-[#1B3022] leading-none font-mono">${plant.days_remaining}d</span>
                      </div>
                    </div>
                    <span class="font-body-sm text-[#1B3022] font-semibold">${plant.status_label}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="light-open-journal-btn p-2 rounded-full bg-black/5 hover:bg-black/10 text-[#1B3022] transition border border-black/10 cursor-pointer" data-id="${plant.id}" title="View Growth Journal">
                      <span class="material-symbols-outlined text-sm">psychiatry</span>
                    </button>
                    <button class="app-water-btn ${plant.is_overdue ? 'bg-[#154212] text-white hover:bg-[#1B3022]' : 'bg-[#1B3022]/10 text-[#1B3022] hover:bg-[#1B3022]/20'} px-5 py-2.5 rounded-full font-body-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer" data-id="${plant.id}">
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
          <div class="glass-card rounded-3xl p-6 relative overflow-hidden" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <div class="absolute -right-10 -top-10 text-[#1B3022]/10 transform rotate-12 pointer-events-none">
              <span class="material-symbols-outlined text-[150px]" style="font-variation-settings: 'FILL' 1; color: #1B3022; opacity: 0.05;">water_drop</span>
            </div>
            <div class="relative z-10">
              <h3 class="font-body-md font-semibold text-[#1B3022] mb-2">Due for Care</h3>
              <div class="flex flex-col gap-2 mb-6">
                <div class="flex items-end gap-4">
                  <span class="font-headline-xl text-[64px] leading-none font-mono tracking-tighter drop-shadow-sm font-bold text-[#1B3022]">${userPlants.filter(p => p.is_overdue || p.days_remaining === 0).length}</span>
                  <div class="mb-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-md">
                    <span class="font-label-caps font-bold text-amber-700">${userPlants.filter(p => p.is_overdue).length} OVERDUE</span>
                  </div>
                </div>
                <p class="font-body-sm text-[#556353] font-medium">
                  ${userPlants.filter(p => p.is_overdue || p.days_remaining === 0).length > 0 
                    ? userPlants.filter(p => p.is_overdue || p.days_remaining === 0).map(p => p.name).join(', ')
                    : 'All plants are hydrated & happy'}
                </p>
              </div>
              <a href="#schedule" class="w-full bg-[#154212] text-white py-3 rounded-xl font-body-sm font-semibold hover:bg-[#1B3022] transition-colors shadow-md border border-white/10 block text-center cursor-pointer" style="text-decoration: none;">
                View Schedule
              </a>
            </div>
          </div>

          <!-- Smart Care Insights Widget -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-[#1B3022]" style="font-variation-settings: 'FILL' 1;">lightbulb</span>
              <h3 class="font-headline-lg-mobile text-headline-lg-mobile text-[#1B3022] font-bold" style="font-size: 18px;">Smart Insights</h3>
            </div>
            ${getSmartInsightsHtml({ plants: userPlants, weatherData, theme: 'light' })}
          </div>
        </div>
      </div>
    </main>
  `;

  // Bindings for Light Dashboard
  container.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
    toggleAppTheme();
  });

  // Location request in weather banner
  container.querySelector('#banner-request-location-btn')?.addEventListener('click', async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const text = container.querySelector('#banner-location-city');
    if (text) text.textContent = 'Locating...';
    try {
      const coords = await resolveUserCoordinates(true);
      const forecast = await getWateringForecast(coords);
      window.__plantneeds_weather = forecast;
      const cityName = getFriendlyCityName(coords.latitude, coords.longitude);
      showToast({ 
        title: 'Location Confirmed', 
        message: `Location set to ${cityName}. Real-time weather and rainfall synced.`, 
        source: 'human' 
      });
    } catch (err) {
      console.warn('[location] button error:', err?.message || err);
      showToast({
        title: 'Location Unavailable',
        message: 'Could not access GPS. Using default location.',
        source: 'human'
      });
    }
    onUpdate();
  });

  container.querySelectorAll('.loc-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      container.querySelectorAll('.loc-filter-btn').forEach(b => {
        b.classList.remove('bg-[#1B3022]/15', 'text-[#1B3022]');
        b.classList.add('bg-white/40', 'text-[#42493e]');
      });
      btn.classList.remove('bg-white/40', 'text-[#42493e]');
      btn.classList.add('bg-[#1B3022]/15', 'text-[#1B3022]');

      container.querySelectorAll('.grid > div.glass-card').forEach(card => {
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

  container.querySelector('#global-logout-btn')?.addEventListener('click', () => {
    clearToken();
    clearCache();
    localStorage.removeItem('plantneeds_local_plants');
    window.location.hash = '';
    emit('auth-changed');
  });

  container.querySelector('#global-add-plant-btn')?.addEventListener('click', () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  });

  container.querySelector('#light-empty-add-plant-btn')?.addEventListener('click', () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  });

  container.querySelector('#light-seasonal-planner-btn')?.addEventListener('click', () => {
    renderSeasonalPlannerModal(container, { onClose: () => onUpdate() });
  });

  container.querySelectorAll('.light-open-journal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const plant = userPlants.find(p => p.id === id);
      if (plant) {
        renderGrowthJournalModal(container, { plant, onClose: () => onUpdate() });
      }
    });
  });

  container.querySelectorAll('.app-water-btn').forEach(btn => {
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
      onUpdate();
    });
  });
}
