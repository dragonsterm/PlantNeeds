/**
 * client/src/ui/components/render-light-dashboard.js
 * Dedicated Light Mode Dashboard (Summer Vibes Theme from Google Stitch Export 2).
 * Uses shared getNavbarHtml & getWeatherBannerHtml for 100% position & dimension parity.
 */
import { clearToken } from '../../api/client.js';
import { renderAddPlantModal } from './add-plant-form.js';
import { renderDiagnosisModal } from './diagnosis-panel.js';
import { renderGrowthJournalModal } from './growth-journal-modal.js';
import { renderSeasonalPlannerModal } from './seasonal-planner-modal.js';
import { toggleAppTheme } from '../render.js';
import { logCareActivity } from '../../logic/plants.js';
import { getNavbarHtml, getWeatherBannerHtml } from './navbar.js';

export function renderLightDashboard(container, { userPlants = [], onUpdate = () => {} } = {}) {
  container.innerHTML = `
    <!-- Summer Vibes Background Layer -->
    <div class="fixed inset-0 z-[-1] pointer-events-none">
      <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg');"></div>
    </div>

    <!-- Top Floating Navbar -->
    ${getNavbarHtml({ activeRoute: 'dashboard', theme: 'light' })}

    <!-- Main Content (Exact padding & layout matching Dark Dashboard) -->
    <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
      <!-- Top Weather Banner -->
      ${getWeatherBannerHtml({ theme: 'light' })}

      <!-- 2-Column Split (Exact 12-col grid) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left 2/3: Plant Grid -->
        <div class="lg:col-span-8">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
            <div>
              <h2 class="font-headline-xl text-headline-xl drop-shadow-sm" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">My Plants</h2>
              <div class="flex items-center gap-2 mt-2">
                <button class="light-loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/70 text-[#1B3022] border border-black/10 cursor-pointer" data-filter="all">All Plants (${userPlants.length})</button>
                <button class="light-loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/30 text-[#556353] border border-black/5 hover:bg-white/50 cursor-pointer" data-filter="indoor">Indoor (${userPlants.filter(p => p.location !== 'outdoor').length})</button>
                <button class="light-loc-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-white/30 text-[#556353] border border-black/5 hover:bg-white/50 cursor-pointer" data-filter="outdoor">Outdoor (${userPlants.filter(p => p.location === 'outdoor').length})</button>
              </div>
            </div>
            <div class="flex gap-2">
              <button id="light-open-seasonal-planner-btn" class="px-3.5 py-1.5 rounded-full bg-white/70 text-[#1B3022] border border-black/10 hover:bg-white transition flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-sm" style="color: #10B981;">calendar_month</span> Seasonal Planner
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${userPlants.map(plant => `
              <div class="glass-card rounded-3xl p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                <div class="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-inner">
                  <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="${plant.name}" src="${plant.image_url}"/>
                  <div class="absolute top-3 right-3 bg-white/75 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/60">
                    <div class="w-2 h-2 rounded-full ${plant.badge_bg}"></div>
                    <span class="font-label-caps text-label-caps font-bold" style="color: #1B3022;">${plant.status_label}</span>
                  </div>
                  <div class="absolute bottom-3 left-3 text-white">
                    <p class="font-label-caps text-xs text-white/90 uppercase tracking-widest drop-shadow-sm">${plant.subtitle}</p>
                  </div>
                </div>
                <h3 class="font-headline-lg-mobile text-headline-lg-mobile mb-1 font-bold" style="color: #1B3022;">${plant.name}</h3>
                <p class="font-body-sm text-xs mb-4" style="color: #556353;">${plant.subtitle}</p>
                <div class="mt-auto pt-4 border-t border-black/10 flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <div class="relative w-12 h-12 flex items-center justify-center">
                      <svg class="w-full h-full transform -rotate-90" viewbox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="4"></path>
                        <path class="${plant.ring_color} progress-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="100, 100" stroke-dashoffset="${plant.ring_dashoffset}" stroke-linecap="round" stroke-width="4"></path>
                      </svg>
                      <div class="absolute flex flex-col items-center">
                        <span class="font-body-sm font-bold leading-none" style="color: #1B3022; font-family: 'JetBrains Mono', monospace;">${plant.days_remaining}d</span>
                      </div>
                    </div>
                    <span class="font-body-sm font-semibold" style="color: #1B3022;">${plant.status_label}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="light-open-journal-btn p-2 rounded-full bg-white/70 hover:bg-white text-[#1B3022] transition border border-black/10 shadow-sm cursor-pointer" data-id="${plant.id}" title="View Growth Journal">
                      <span class="material-symbols-outlined text-sm">psychiatry</span>
                    </button>
                    <button class="light-water-btn bg-forest-deep text-white px-5 py-2.5 rounded-full font-body-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-md border border-transparent cursor-pointer" data-id="${plant.id}" style="background: #1B3022;">
                      <span class="material-symbols-outlined text-sm">water_drop</span> Water
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right 1/3: Sidebar -->
        <div class="lg:col-span-4 flex flex-col gap-6 pt-2 lg:pt-14">
          <!-- Due for Care Card -->
          <div class="glass-card rounded-3xl p-6 relative overflow-hidden" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <div class="absolute -right-10 -top-10 text-primary-fixed/10 transform rotate-12 pointer-events-none">
              <span class="material-symbols-outlined text-[150px]" style="font-variation-settings: 'FILL' 1; color: #1B3022; opacity: 0.08;">water_drop</span>
            </div>
            <div class="relative z-10">
              <h3 class="font-body-md font-semibold mb-2" style="color: #1B3022;">Due for Care</h3>
              <div class="flex flex-col gap-2 mb-6">
                <div class="flex items-end gap-4">
                  <span class="font-headline-xl text-[64px] leading-none font-mono tracking-tighter drop-shadow-sm font-bold" style="color: #1B3022;">3</span>
                  <div class="mb-2 bg-status-warning/20 border border-status-warning/40 px-3 py-1 rounded-md">
                    <span class="font-label-caps font-bold" style="color: #D97706;">1 OVERDUE</span>
                  </div>
                </div>
                <p class="font-body-sm font-medium" style="color: #556353;">Monstera, Basil, and 1 more</p>
              </div>
              <a href="#schedule" class="w-full bg-forest-deep text-white py-3 rounded-xl font-body-sm font-semibold hover:bg-primary-container transition-colors shadow-md border border-transparent block text-center cursor-pointer" style="background: #1B3022; text-decoration: none;">
                View Schedule
              </a>
            </div>
          </div>

          <!-- Smart Care Insights Widget -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; color: #1B3022;">lightbulb</span>
              <h3 class="font-headline-lg-mobile text-headline-lg-mobile font-bold" style="color: #1B3022; font-size: 18px;">Smart Insights</h3>
            </div>
            <div class="flex flex-col gap-4">
              <div class="bg-white/60 border border-white/80 p-4 rounded-2xl flex gap-3 shadow-sm">
                <span class="material-symbols-outlined text-status-warning mt-0.5" style="color: #D97706; font-size: 22px;">water_drop</span>
                <div>
                  <h4 class="font-body-sm font-semibold" style="color: #1B3022;">Monstera Humidity</h4>
                  <p class="font-body-sm text-xs mt-1 leading-relaxed" style="color: #556353;">Indoor heating is drying the air. Mist leaves today to maintain ~60% humidity.</p>
                </div>
              </div>
              <div class="bg-white/60 border border-white/80 p-4 rounded-2xl flex gap-3 shadow-sm">
                <span class="material-symbols-outlined mt-0.5" style="color: #2D5A27; font-size: 22px;">water_drop</span>
                <div>
                  <h4 class="font-body-sm font-semibold" style="color: #1B3022;">Outdoor Watering</h4>
                  <p class="font-body-sm text-xs mt-1 leading-relaxed" style="color: #556353;">Sufficient rain recorded. Skip garden watering today to avoid root rot.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  // Bindings for Light Dashboard
  container.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
    toggleAppTheme();
  });

  container.querySelector('#global-logout-btn')?.addEventListener('click', () => {
    clearToken();
    window.location.hash = '';
    onUpdate();
  });

  container.querySelector('#global-add-plant-btn')?.addEventListener('click', () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  });

  container.querySelector('#light-open-seasonal-planner-btn')?.addEventListener('click', () => {
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

  container.querySelectorAll('a[href="#diagnose"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderDiagnosisModal(() => onUpdate());
    });
  });

  container.querySelectorAll('.light-water-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const plantId = btn.getAttribute('data-id');
      btn.textContent = 'Watering...';
      btn.disabled = true;
      try {
        await logCareActivity({ plant_id: plantId, activity: 'watered', source: 'human' });
        onUpdate();
      } catch {
        const plant = userPlants.find(p => p.id === plantId);
        if (plant) {
          plant.days_remaining = 7;
          plant.status_label = 'Healthy';
          plant.is_overdue = false;
        }
        onUpdate();
      }
    });
  });
}
