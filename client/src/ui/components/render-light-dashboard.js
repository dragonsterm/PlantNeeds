/**
 * client/src/ui/components/render-light-dashboard.js
 * Dedicated Light Mode Dashboard (Summer Vibes Theme from Google Stitch Export 2).
 * Background: /assets/summer-vibes-bg.jpg
 * Translucent white glass cards, dark forest green text (#1B3022), high contrast.
 */
import { clearToken } from '../../api/client.js';
import { renderAddPlantModal } from './add-plant-form.js';
import { renderScheduleModal } from './schedule-modal.js';
import { logCareActivity } from '../../logic/plants.js';

export function renderLightDashboard(container, { userPlants = [], onUpdate = () => {} } = {}) {
  container.innerHTML = `
    <!-- Summer Vibes Background Layer -->
    <div style="position: fixed; inset: 0; z-index: -1; background-image: url('/assets/summer-vibes-bg.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>

    <!-- TopNavBar Light -->
    <div style="position: fixed; top: 16px; left: 16px; right: 16px; z-index: 50; max-width: var(--max-width, 80rem); margin: 0 auto;">
      <nav class="glass-panel" style="border-radius: 9999px; padding: 10px 24px; background: rgba(255, 255, 255, 0.70); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 4px 24px rgba(27, 48, 34, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <!-- Logo Area -->
          <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds Logo" style="height: 32px; width: auto; object-fit: contain;" />
            <span class="font-headline-lg" style="color: #1B3022; font-size: 22px; font-weight: 700;">PlantNeeds</span>
          </div>

          <!-- Navigation Links -->
          <div style="display: flex; align-items: center; gap: 32px;" class="hidden md:flex">
            <a class="nav-link" href="#light-dashboard" style="color: #1B3022; font-weight: 700; border-bottom: 2px solid #1B3022; padding-bottom: 2px; text-decoration: none;">My Garden</a>
            <a class="nav-link" href="#schedule" style="color: #556353; font-weight: 500; text-decoration: none;">Care Schedule</a>
            <a class="nav-link" href="#diagnose" style="color: #556353; font-weight: 500; text-decoration: none;">Diagnosis</a>
            <a class="nav-link" href="#dark-dashboard" style="color: #154212; font-weight: 600; text-decoration: underline; font-size: 13px;">[Switch to Dark Theme]</a>
          </div>

          <!-- Trailing Actions -->
          <div style="display: flex; align-items: center; gap: 14px;">
            <button id="light-add-plant-btn" class="bg-forest-deep text-white px-5 py-2 rounded-full font-body-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm border border-transparent" style="background: #1B3022;">
              <span class="material-symbols-outlined text-sm">add</span> Add Plant
            </button>
            <div style="display: flex; align-items: center; gap: 8px; color: #1B3022;">
              <button style="padding: 8px; border-radius: 50%; background: rgba(0,0,0,0.05); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined" style="font-size: 20px; color: #1B3022;">notifications</span>
              </button>
              <div style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(27, 48, 34, 0.2); cursor: pointer;">
                <img style="width: 100%; height: 100%; object-fit: cover;" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmX1gzteICusJWAL6o8TBIgj2aEee9UDdvGv6jrJbIKNbZAazY-YqO-IzcOOAN3rTeV7Y-YQ7bLoaXpDW90AIvceHzpVtw_OMpR58pkcZTULK5kL9f5uSdUShAUdorMz1oqpQMUPVUaakMa80pIX8-4nXAjqdeOfMMgRmDTVq2VvPSR-Chyq383zmwaJpVEaEOzhXDp8H7OeeF2QHULS_0Zk6zCCEmoBVeWXE-pzMI2x5Dpphl2Bp_sw"/>
              </div>
              <button id="light-logout-btn" title="Sign Out" style="background: none; border: none; color: #556353; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: underline; margin-left: 4px;">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <!-- Main Content -->
    <main style="padding-top: 110px; padding-bottom: 48px; max-width: var(--max-width, 80rem); margin: 0 auto; width: 100%; padding-left: 24px; padding-right: 24px;">
      <!-- Weather Banner Light -->
      <div class="glass-panel rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.8);">
        <div style="display: flex; align-items: center; gap: 14px; position: relative; z-index: 2;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(74, 144, 226, 0.2); border: 1px solid rgba(74, 144, 226, 0.3); display: flex; align-items: center; justify-content: center; color: #4A90E2;">
            <span class="material-symbols-outlined">rainy</span>
          </div>
          <p class="font-body-sm" style="color: #1B3022; margin: 0; font-size: 14px;">
            Rain covered <strong style="font-weight: 700;">3 outdoor garden crops</strong> (53.4 mm rain this week). <strong style="font-weight: 700;">2 indoor houseplants</strong> due today.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; background: rgba(188, 240, 174, 0.4); border: 1px solid rgba(45, 90, 39, 0.25); padding: 6px 14px; border-radius: 9999px; position: relative; z-index: 2;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #154212;"></span>
          <span class="font-label-caps" style="color: #1B3022; font-weight: 700;">Live Weather</span>
        </div>
      </div>

      <!-- 2-Column Split -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left 2/3: Plant Grid -->
        <div class="lg:col-span-8">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
            <h2 class="font-headline-xl" style="color: #1B3022; font-size: 32px; font-weight: 700;">My Plants</h2>
            <div style="display: flex; gap: 8px;">
              <button style="padding: 8px; border-radius: 50%; background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.9); color: #1B3022; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined" style="font-size: 18px;">grid_view</span>
              </button>
              <button style="padding: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6); color: #556353; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined" style="font-size: 18px;">format_list_bulleted</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${userPlants.map(plant => `
              <div class="glass-card rounded-3xl p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                <div class="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-inner">
                  <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="${plant.name}" src="${plant.image_url}"/>
                  <div class="absolute top-3 right-3 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/60">
                    <div class="w-2 h-2 rounded-full ${plant.badge_bg}"></div>
                    <span class="font-label-caps" style="color: #1B3022; font-weight: 700;">${plant.status_label}</span>
                  </div>
                </div>
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-headline-lg-mobile text-headline-lg-mobile text-forest-deep mb-1 font-bold" style="color: #1B3022; font-size: 20px;">${plant.name}</h3>
                    <p class="font-body-sm" style="color: #556353; font-size: 13px;">${plant.subtitle}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-auto pt-4 border-t border-black/10">
                  <div class="flex items-center gap-3">
                    <div class="relative w-12 h-12 flex items-center justify-center">
                      <svg class="w-full h-full transform -rotate-90" viewbox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="4"></path>
                        <path class="${plant.ring_color} progress-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="100, 100" stroke-dashoffset="${plant.ring_dashoffset}" stroke-linecap="round" stroke-width="4"></path>
                      </svg>
                      <div class="absolute flex flex-col items-center">
                        <span class="font-body-sm font-bold text-forest-deep leading-none" style="color: #1B3022; font-family: 'JetBrains Mono', monospace;">${plant.days_remaining}d</span>
                      </div>
                    </div>
                    <span class="font-body-sm text-forest-deep font-semibold" style="color: #1B3022;">${plant.status_label}</span>
                  </div>
                  <button class="light-water-btn bg-forest-deep text-white px-6 py-2.5 rounded-full font-body-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-md border border-transparent" data-id="${plant.id}" style="background: #1B3022;">
                    <span class="material-symbols-outlined text-sm">water_drop</span> Water
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right 1/3: Sidebar -->
        <div class="lg:col-span-4 flex flex-col gap-6 pt-2 lg:pt-14">
          <!-- Due for Care Card Light -->
          <div class="glass-card rounded-3xl p-6 relative overflow-hidden" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <div class="absolute -right-10 -top-10 text-primary-container/10 transform rotate-12 pointer-events-none">
              <span class="material-symbols-outlined text-[150px]" style="font-variation-settings: 'FILL' 1; color: #1B3022; opacity: 0.08;">water_drop</span>
            </div>
            <div class="relative z-10">
              <h3 class="font-body-md font-semibold text-forest-deep mb-2" style="color: #1B3022;">Due for Care</h3>
              <div class="flex flex-col gap-2 mb-6">
                <div class="flex items-end gap-4">
                  <span class="font-headline-xl text-[64px] leading-none text-forest-deep font-mono tracking-tighter drop-shadow-sm font-bold" style="color: #1B3022;">3</span>
                  <div class="mb-2 bg-status-warning/20 border border-status-warning/40 px-3 py-1 rounded-md">
                    <span class="font-label-caps text-label-caps text-status-warning font-bold" style="color: #D97706;">1 OVERDUE</span>
                  </div>
                </div>
                <p class="font-body-sm text-sage-soft font-medium" style="color: #556353;">Monstera, Basil, and 1 more</p>
              </div>
              <button id="light-sidebar-sched-btn" class="w-full bg-forest-deep text-white py-3 rounded-xl font-body-sm font-semibold hover:bg-primary-container transition-colors shadow-md border border-transparent" style="background: #1B3022;">
                View Schedule
              </button>
            </div>
          </div>

          <!-- Smart Care Insights Widget Light -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-forest-deep" style="font-variation-settings: 'FILL' 1; color: #1B3022;">lightbulb</span>
              <h3 class="font-headline-lg-mobile text-headline-lg-mobile text-forest-deep font-bold" style="color: #1B3022; font-size: 18px;">Smart Insights</h3>
            </div>
            <div class="flex flex-col gap-4">
              <div class="bg-white/60 border border-white/80 p-4 rounded-2xl flex gap-3 shadow-sm">
                <span class="material-symbols-outlined text-status-warning mt-0.5" style="color: #D97706; font-size: 22px;">water_drop</span>
                <div>
                  <h4 class="font-body-sm font-semibold text-forest-deep" style="color: #1B3022;">Monstera Humidity</h4>
                  <p class="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed" style="color: #556353;">Indoor heating is drying the air. Mist leaves today to maintain ~60% humidity.</p>
                </div>
              </div>
              <div class="bg-white/60 border border-white/80 p-4 rounded-2xl flex gap-3 shadow-sm">
                <span class="material-symbols-outlined mt-0.5" style="color: #2D5A27; font-size: 22px;">water_drop</span>
                <div>
                  <h4 class="font-body-sm font-semibold text-forest-deep" style="color: #1B3022;">Outdoor Watering</h4>
                  <p class="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed" style="color: #556353;">Sufficient rain recorded. Skip garden watering today to avoid root rot.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  // Bindings for Light Dashboard
  container.querySelector('#light-logout-btn')?.addEventListener('click', () => {
    clearToken();
    window.location.hash = '';
    onUpdate();
  });

  const openAddPlant = () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  };

  const openSchedule = () => {
    renderScheduleModal(container, { plants: userPlants, onClose: () => onUpdate() });
  };

  container.querySelector('#light-add-plant-btn')?.addEventListener('click', openAddPlant);
  container.querySelector('#light-sidebar-sched-btn')?.addEventListener('click', openSchedule);

  container.querySelectorAll('.light-water-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const plantId = btn.getAttribute('data-id');
      btn.textContent = 'Watering...';
      btn.disabled = true;
      try {
        await logCareActivity({ plant_id: plantId, activity: 'watered', source: 'human' });
      } catch {
        const plant = userPlants.find(p => p.id === plantId);
        if (plant) {
          plant.days_remaining = 7;
          plant.status_label = 'Healthy';
          plant.is_overdue = false;
          plant.badge_bg = 'bg-primary-fixed';
          plant.ring_color = 'text-primary-fixed';
          plant.ring_dashoffset = '60';
        }
        onUpdate();
      }
    });
  });
}
