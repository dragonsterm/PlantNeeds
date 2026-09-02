/**
 * client/src/ui/components/render-light-schedule.js
 * Care Activity Tree & Schedule View (Light Mode Schedule).
 * 100% Shared Navbar & Weather Banner for exact parity with Dashboard.
 */
import { logCareActivity, computePlantSchedule } from '../../logic/plants.js';
import { clearCache, emit } from "../../state/store.js";
import { clearToken } from '../../api/client.js';
import { renderAddPlantModal } from './add-plant-form.js';
import { renderDiagnosisModal } from './diagnosis-panel.js';
import { toggleAppTheme, savePlantsLocally, getSavedPlants } from '../render.js';
import { showToast } from './toast-notification.js';
import { getNavbarHtml, getWeatherBannerHtml } from './navbar.js';

export function renderLightSchedule(container, { plants = [], onUpdate = () => {} } = {}) {
  const scheduleItems = computePlantSchedule(plants, { days_ahead: 14 });

  const dueItems = scheduleItems.filter(i => i.overdue || i.days_remaining === 0);
  const upcomingItems = scheduleItems.filter(i => !i.overdue && i.days_remaining > 0 && !i.rain_skipped);

  container.innerHTML = `
    <!-- Background Image with Overlay (Identical to Light Dashboard) -->
    <div class="fixed inset-0 z-[-1] pointer-events-none">
      <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg');"></div>
    </div>

    <!-- Top Floating Navbar -->
    ${getNavbarHtml({ activeRoute: 'schedule', theme: 'light' })}

    <!-- Main Content (Exact offset & grid alignment with Light Dashboard) -->
    <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
      <!-- Top Weather Banner -->
      ${getWeatherBannerHtml({ theme: 'light' })}

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Activity Tree (8 cols) -->
        <div class="lg:col-span-8 flex flex-col gap-4">
          <div class="flex justify-between items-end mb-1">
            <h1 class="font-headline-xl text-headline-xl text-forest-deep" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">Care Activity Tree &amp; Schedule</h1>
            <span class="text-xs font-semibold px-3 py-1 rounded-full border shadow-sm" style="background: rgba(255, 255, 255, 0.65); color: #1B3022; border-color: rgba(255, 255, 255, 0.85);">
              ${scheduleItems.length} Total Care Nodes
            </span>
          </div>

          <!-- Git-Style Visual Activity Tree Container -->
          <div class="relative pl-3 py-2">
            <!-- Continuous Vertical Connecting Line -->
            <div style="position: absolute; top: 28px; bottom: 28px; left: 29px; width: 3px; background-color: #52B788; z-index: 0; border-radius: 2px;"></div>

            <!-- Dynamic Urgent Task Nodes -->
            ${dueItems.map(item => `
              <div class="relative z-10 flex gap-6 mb-6 items-start group">
                <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg border-4 border-white text-white" style="background: #10B981;">
                  <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">water_drop</span>
                </div>
                <div class="glass-card rounded-3xl p-6 w-full flex flex-col group hover:-translate-y-0.5 transition-transform duration-300" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                  <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xl font-bold tracking-tight" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">${item.plant_name} — Watering Due (250ml)</h3>
                    <button class="text-forest-deep/50 hover:text-forest-deep" style="background: none; border: none; cursor: pointer;"><span class="material-symbols-outlined">more_horiz</span></button>
                  </div>
                  <p class="text-xs mb-3" style="color: #556353;">${item.species || 'Houseplant'} • Last watered ${item.days_since_watered >= 0 ? item.days_since_watered + 'd ago' : 'Never'}</p>
                  
                  <!-- Tag Badges in One Clean Row with Small Consistent Font -->
                  <div class="flex flex-wrap items-center gap-2 mb-4">
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">Indoor Pot</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">250ml Volume</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">Interval: ${item.water_frequency_days || 7}d</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border" style="background: rgba(217, 119, 6, 0.18); color: #D97706; border-color: rgba(217, 119, 6, 0.35);">
                      ${item.overdue ? 'Overdue 2d' : 'Due Today'}
                    </span>
                  </div>

                  <div>
                    <button class="sched-water-action-btn text-white px-6 py-2 rounded-full font-semibold text-xs transition-colors inline-flex items-center gap-2 shadow-sm hover:opacity-90 cursor-pointer" data-id="${item.plant_id}" style="background: #1B3022;">
                      Water Now <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}

            <!-- Node 2: Upcoming Scheduled -->
            ${upcomingItems.slice(0, 1).map(item => `
              <div class="relative z-10 flex gap-6 mb-6 items-start group">
                <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border-4" style="border-color: #A7F3D0; color: #10B981;">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">eco</span>
                </div>
                <div class="glass-card rounded-3xl p-6 w-full flex flex-col group hover:-translate-y-0.5 transition-transform duration-300" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                  <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xl font-bold tracking-tight" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">${item.plant_name} — Foliage Misting</h3>
                  </div>
                  <p class="text-xs mb-3" style="color: #556353;">${item.species} • Hydration on track</p>
                  
                  <div class="flex flex-wrap items-center gap-2 mb-4">
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">Indoor Hanging</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">Light Mist</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-bold border" style="background: rgba(82, 183, 136, 0.2); color: #2D6A4F; border-color: rgba(82, 183, 136, 0.35);">
                      Due Tomorrow
                    </span>
                  </div>

                  <div>
                    <button class="sched-water-action-btn border px-6 py-2 rounded-full font-semibold text-xs transition-colors inline-flex items-center gap-2 bg-white/70 hover:bg-forest-deep hover:text-white cursor-pointer" data-id="${item.plant_id}" style="color: #1B3022; border-color: #1B3022;">
                      Mark Done
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}

            <!-- Node 3: Rain-Shifted Branch -->
            <div class="relative z-10 flex gap-6 mb-6 items-start group">
              <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white text-white" style="background: #06B6D4;">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">cloud</span>
              </div>
              <div class="glass-card rounded-3xl p-6 w-full flex flex-col group hover:-translate-y-0.5 transition-transform duration-300" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="text-xl font-bold tracking-tight" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">Garden Tomato &amp; Sweet Basil — Watering Deferred</h3>
                </div>
                <p class="text-xs mb-3" style="color: #556353;">Outdoor Raised Bed • Soil moisture replenished by 14mm natural rainfall</p>
                
                <div class="flex flex-wrap items-center gap-2 mb-4">
                  <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">Outdoor Bed</span>
                  <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(6, 182, 212, 0.12); color: #0891B2; border-color: rgba(6, 182, 212, 0.3);">Rain Skipped · 14mm natural rain</span>
                  <span class="px-3 py-0.5 rounded-full text-xs font-bold border" style="background: rgba(6, 182, 212, 0.18); color: #0E7490; border-color: rgba(6, 182, 212, 0.35);">
                    Shifted (+3 Days)
                  </span>
                </div>

                <div>
                  <a class="text-xs font-semibold underline underline-offset-4 transition-colors cursor-pointer" style="color: #1B3022; opacity: 0.85;">
                    Water Anyway (Manual Override)
                  </a>
                </div>
              </div>
            </div>

            <!-- Node 4: Past Activity Logged by WebMCP Agent -->
            <div class="relative z-10 flex gap-6 items-start group">
              <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white text-white" style="background: #52B788;">
                <span class="material-symbols-outlined text-white font-bold">check</span>
              </div>
              <div class="glass-card rounded-3xl p-5 w-full flex flex-col" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                <div class="flex justify-between items-center mb-1">
                  <h3 class="text-lg font-bold" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">Boston Fern — Care Logged &amp; Verified</h3>
                  <span class="text-xs font-medium" style="color: #556353;">Logged 2h ago</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                  <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">Indoor Hanging</span>
                  <span class="px-3 py-0.5 rounded-full text-xs font-bold border" style="background: rgba(82, 183, 136, 0.25); color: #1B3022; border-color: rgba(82, 183, 136, 0.4);">
                    via WebMCP Agent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Metrics (4 cols - Flush Top Alignment with Left Heading) -->
        <div class="lg:col-span-4 flex flex-col gap-6">
          <!-- Card 1: Moisture Chart -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <h3 class="font-bold mb-4 flex items-center gap-2 text-base" style="color: #1B3022;">
              <span class="material-symbols-outlined" style="color: #52B788;">bar_chart</span>
              Weekly Precipitation Distribution
            </h3>
            <p class="text-xs mb-4" style="color: #556353;">7-day rainfall history synced live from Open-Meteo API.</p>

            <!-- 7-Day Mini Bar Chart -->
            <div class="flex items-end justify-between h-32 mb-4 px-2 border-b pb-2" style="border-color: rgba(27, 48, 34, 0.12);">
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-gray-500">14</span>
                <div class="w-8 rounded-t-md transition-all" style="height: 48px; background: rgba(82, 183, 136, 0.65);"></div>
                <span class="text-xs font-mono font-bold" style="color: #1B3022;">M</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-gray-500">6</span>
                <div class="w-8 rounded-t-md transition-all" style="height: 24px; background: rgba(82, 183, 136, 0.45);"></div>
                <span class="text-xs font-mono font-bold" style="color: #1B3022;">T</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-gray-400">0</span>
                <div class="w-8 rounded-t-md" style="height: 8px; background: rgba(0,0,0,0.08);"></div>
                <span class="text-xs font-mono font-bold" style="color: #1B3022;">W</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-gray-500">18</span>
                <div class="w-8 rounded-t-md transition-all" style="height: 72px; background: #2D6A4F;"></div>
                <span class="text-xs font-mono font-bold" style="color: #1B3022;">T</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-gray-400">0</span>
                <div class="w-8 rounded-t-md" style="height: 8px; background: rgba(0,0,0,0.08);"></div>
                <span class="text-xs font-mono font-bold" style="color: #1B3022;">F</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-gray-500">15</span>
                <div class="w-8 rounded-t-md transition-all" style="height: 60px; background: rgba(82, 183, 136, 0.75);"></div>
                <span class="text-xs font-mono font-bold" style="color: #1B3022;">S</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-gray-400">0</span>
                <div class="w-8 rounded-t-md" style="height: 8px; background: rgba(0,0,0,0.08);"></div>
                <span class="text-xs font-mono font-bold" style="color: #1B3022;">S</span>
              </div>
            </div>

            <div class="font-mono text-xs font-bold text-center py-2.5 rounded-xl border" style="background: rgba(255, 255, 255, 0.6); color: #1B3022; border-color: rgba(0,0,0,0.08);">
              53.4 mm Total Rainfall · Open-Meteo Synced
            </div>
          </div>

          <!-- Card 2: Agent Actions -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <h3 class="font-bold mb-4 flex items-center gap-2 text-base" style="color: #1B3022;">
              <span class="material-symbols-outlined" style="color: #1B3022;">history</span>
              Recent Agent Actions (WebMCP)
            </h3>
            <ul class="space-y-3">
              <li class="flex gap-3 items-start border-b pb-3" style="border-color: rgba(27,48,34,0.08);">
                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style="background: rgba(27, 48, 34, 0.06);">
                  <span class="material-symbols-outlined text-sm" style="color: #1B3022;">sync</span>
                </div>
                <div>
                  <p class="text-xs font-semibold" style="color: #1B3022;">Checked Open-Meteo precipitation</p>
                  <p class="text-[11px]" style="color: #556353;">10m ago · Tool: get_watering_forecast</p>
                </div>
              </li>
              <li class="flex gap-3 items-start">
                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style="background: rgba(27, 48, 34, 0.06);">
                  <span class="material-symbols-outlined text-sm" style="color: #1B3022;">bolt</span>
                </div>
                <div>
                  <p class="text-xs font-semibold" style="color: #1B3022;">Updated intervals via get_care_schedule</p>
                  <p class="text-[11px]" style="color: #556353;">1h ago · Single source of truth</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  `;

  // Bindings
  container.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
    toggleAppTheme();
  });

  container.querySelector('#global-logout-btn')?.addEventListener('click', () => {
    clearToken(); clearCache(); emit("auth-changed");
    window.location.hash = '';
    onUpdate();
  });

  container.querySelector('#global-add-plant-btn')?.addEventListener('click', () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  });

  container.querySelectorAll('a[href="#diagnose"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderDiagnosisModal(() => onUpdate());
    });
  });

  container.querySelectorAll('.sched-water-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.textContent = 'Watering...';
      btn.disabled = true;

      const currentPlants = getSavedPlants();
      const plant = currentPlants.find(p => p.id === id);
      if (plant) {
        plant.last_watered = new Date().toISOString().split('T')[0];
        plant.days_remaining = plant.water_frequency_days || 7;
        plant.status_label = 'Healthy';
        plant.is_overdue = false;
        plant.badge_bg = 'bg-primary-fixed';
        plant.ring_color = 'text-primary-fixed';
        plant.ring_dashoffset = '60';
        savePlantsLocally(currentPlants);
      }

      try {
        await logCareActivity({ plant_id: id, activity: 'watered', source: 'human' });
      } catch {
        /* saved locally */
      }
      showToast({ title: `${plant?.name || 'Plant'} Watered`, message: 'Schedule updated to 7 days ahead', source: 'human' });
      onUpdate();
    });
  });
}
