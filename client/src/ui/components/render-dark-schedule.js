/**
 * client/src/ui/components/render-dark-schedule.js
 * Care Activity Tree & Schedule View (Dark Mode Schedule).
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

export function renderDarkSchedule(container, { plants = [], onUpdate = () => {} } = {}) {
  const scheduleItems = computePlantSchedule(plants, { days_ahead: 14 });

  const dueItems = scheduleItems.filter(i => i.overdue || i.days_remaining === 0);
  const upcomingItems = scheduleItems.filter(i => !i.overdue && i.days_remaining > 0 && !i.rain_skipped);

  container.innerHTML = `
    <!-- Dark Dashboard Background (Dark Moody Foliage with Raindrops) -->
    <div class="bg-layer"></div>

    <!-- TopNavBar Dark -->
    ${getNavbarHtml({ activeRoute: 'schedule', theme: 'dark' })}

    <!-- Main Content Grid -->
    <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
      <!-- Top Weather Banner -->
      ${getWeatherBannerHtml({ theme: 'dark' })}

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Activity Tree (8 cols) -->
        <div class="lg:col-span-8 flex flex-col gap-4">
          <div class="flex justify-between items-end mb-1">
            <h1 class="font-headline-xl text-headline-xl text-white drop-shadow-sm" style="font-family: 'Plus Jakarta Sans', sans-serif;">Care Activity Tree &amp; Schedule</h1>
            <span class="text-xs font-semibold px-3 py-1 rounded-full border border-white/20 text-white/90 bg-white/10 shadow-sm">
              ${scheduleItems.length} Total Care Nodes
            </span>
          </div>

          <!-- Git-Style Visual Activity Tree Container -->
          <div class="relative pl-3 py-2">
            <!-- Continuous Vertical Connecting Rail Line -->
            <div style="position: absolute; top: 28px; bottom: 28px; left: 29px; width: 3px; background-color: #52B788; z-index: 0; border-radius: 2px;"></div>

            <!-- Dynamic Urgent Task Nodes -->
            ${dueItems.map(item => `
              <div class="relative z-10 flex gap-6 mb-6 items-start group">
                <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg border-4 border-slate-900 text-white" style="background: #10B981;">
                  <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">water_drop</span>
                </div>
                <div class="glass-card rounded-3xl p-6 w-full flex flex-col group hover:-translate-y-0.5 transition-transform duration-300" style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                  <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xl font-bold tracking-tight text-white" style="font-family: 'Plus Jakarta Sans', sans-serif;">${item.plant_name} — Watering Due (250ml)</h3>
                    <button class="text-white/50 hover:text-white" style="background: none; border: none; cursor: pointer;"><span class="material-symbols-outlined">more_horiz</span></button>
                  </div>
                  <p class="text-xs mb-3 text-white/70">${item.species || 'Houseplant'} • Last watered ${item.days_since_watered >= 0 ? item.days_since_watered + 'd ago' : 'Never'}</p>
                  
                  <!-- Tag Badges in One Clean Row -->
                  <div class="flex flex-wrap items-center gap-2 mb-4">
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">Indoor Pot</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">250ml Volume</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">Interval: ${item.water_frequency_days || 7}d</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border" style="background: rgba(217, 119, 6, 0.25); color: #FBBF24; border-color: rgba(245, 158, 11, 0.4);">
                      ${item.overdue ? 'Overdue 2d' : 'Due Today'}
                    </span>
                  </div>

                  <div>
                    <button class="dark-sched-water-action-btn text-white px-6 py-2 rounded-full font-semibold text-xs transition-colors inline-flex items-center gap-2 shadow-md hover:bg-primary-container cursor-pointer" data-id="${item.plant_id}" style="background: #154212; border: 1px solid rgba(255,255,255,0.15);">
                      Water Now <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}

            <!-- Node 2: Upcoming Scheduled -->
            ${upcomingItems.slice(0, 1).map(item => `
              <div class="relative z-10 flex gap-6 mb-6 items-start group">
                <div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0 shadow-sm border-4" style="border-color: #A7F3D0; color: #10B981;">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">eco</span>
                </div>
                <div class="glass-card rounded-3xl p-6 w-full flex flex-col group hover:-translate-y-0.5 transition-transform duration-300" style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                  <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xl font-bold tracking-tight text-white" style="font-family: 'Plus Jakarta Sans', sans-serif;">${item.plant_name} — Foliage Misting</h3>
                  </div>
                  <p class="text-xs mb-3 text-white/70">${item.species} • Hydration on track</p>
                  
                  <div class="flex flex-wrap items-center gap-2 mb-4">
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">Indoor Hanging</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">Light Mist</span>
                    <span class="px-3 py-0.5 rounded-full text-xs font-bold border" style="background: rgba(82, 183, 136, 0.25); color: #A7F3D0; border-color: rgba(82, 183, 136, 0.4);">
                      Due Tomorrow
                    </span>
                  </div>

                  <div>
                    <button class="dark-sched-water-action-btn border border-white/20 px-6 py-2 rounded-full font-semibold text-xs transition-colors inline-flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 cursor-pointer" data-id="${item.plant_id}">
                      Mark Done
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}

            <!-- Node 3: Rain-Shifted Branch -->
            <div class="relative z-10 flex gap-6 mb-6 items-start group">
              <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-slate-900 text-white" style="background: #06B6D4;">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">cloud</span>
              </div>
              <div class="glass-card rounded-3xl p-6 w-full flex flex-col group hover:-translate-y-0.5 transition-transform duration-300" style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="text-xl font-bold tracking-tight text-white" style="font-family: 'Plus Jakarta Sans', sans-serif;">Garden Tomato &amp; Sweet Basil — Watering Deferred</h3>
                </div>
                <p class="text-xs mb-3 text-white/70">Outdoor Raised Bed • Soil moisture replenished by 14mm natural rainfall</p>
                
                <div class="flex flex-wrap items-center gap-2 mb-4">
                  <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">Outdoor Bed</span>
                  <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(6, 182, 212, 0.15); color: #67E8F9; border-color: rgba(6, 182, 212, 0.35);">Rain Skipped · 14mm natural rain</span>
                  <span class="px-3 py-0.5 rounded-full text-xs font-bold border" style="background: rgba(6, 182, 212, 0.25); color: #A5F3FC; border-color: rgba(6, 182, 212, 0.45);">
                    Shifted (+3 Days)
                  </span>
                </div>

                <div>
                  <a class="text-xs font-semibold underline underline-offset-4 transition-colors cursor-pointer text-cyan-300 hover:text-cyan-200">
                    Water Anyway (Manual Override)
                  </a>
                </div>
              </div>
            </div>

            <!-- Node 4: Past Activity Logged by WebMCP Agent -->
            <div class="relative z-10 flex gap-6 items-start group">
              <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-slate-900 text-white" style="background: #52B788;">
                <span class="material-symbols-outlined text-white font-bold">check</span>
              </div>
              <div class="glass-card rounded-3xl p-5 w-full flex flex-col" style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div class="flex justify-between items-center mb-1">
                  <h3 class="text-lg font-bold text-white" style="font-family: 'Plus Jakarta Sans', sans-serif;">Boston Fern — Care Logged &amp; Verified</h3>
                  <span class="text-xs text-white/60 font-medium">Logged 2h ago</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                  <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">Indoor Hanging</span>
                  <span class="px-3 py-0.5 rounded-full text-xs font-bold border" style="background: rgba(82, 183, 136, 0.25); color: #A7F3D0; border-color: rgba(82, 183, 136, 0.4);">
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
          <div class="glass-card rounded-3xl p-6" style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <h3 class="font-bold mb-4 flex items-center gap-2 text-base text-white">
              <span class="material-symbols-outlined text-primary-fixed">bar_chart</span>
              Weekly Precipitation Distribution
            </h3>
            <p class="text-xs mb-4 text-white/70">7-day rainfall history synced live from Open-Meteo API.</p>

            <!-- 7-Day Mini Bar Chart -->
            <div class="flex items-end justify-between h-32 mb-4 px-2 border-b border-white/10 pb-2">
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-white/60">14</span>
                <div class="w-8 rounded-t-md transition-all" style="height: 48px; background: rgba(82, 183, 136, 0.75);"></div>
                <span class="text-xs font-mono font-bold text-white">M</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-white/60">6</span>
                <div class="w-8 rounded-t-md transition-all" style="height: 24px; background: rgba(82, 183, 136, 0.5);"></div>
                <span class="text-xs font-mono font-bold text-white">T</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-white/40">0</span>
                <div class="w-8 rounded-t-md bg-white/10" style="height: 8px;"></div>
                <span class="text-xs font-mono font-bold text-white">W</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-white/60">18</span>
                <div class="w-8 rounded-t-md transition-all bg-emerald-400" style="height: 72px;"></div>
                <span class="text-xs font-mono font-bold text-white">T</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-white/40">0</span>
                <div class="w-8 rounded-t-md bg-white/10" style="height: 8px;"></div>
                <span class="text-xs font-mono font-bold text-white">F</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-white/60">15</span>
                <div class="w-8 rounded-t-md transition-all" style="height: 60px; background: rgba(82, 183, 136, 0.85);"></div>
                <span class="text-xs font-mono font-bold text-white">S</span>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <span class="text-[10px] font-mono text-white/40">0</span>
                <div class="w-8 rounded-t-md bg-white/10" style="height: 8px;"></div>
                <span class="text-xs font-mono font-bold text-white">S</span>
              </div>
            </div>

            <div class="font-mono text-xs font-bold text-center py-2.5 rounded-xl border border-white/10 bg-white/5 text-primary-fixed">
              53.4 mm Total Rainfall · Open-Meteo Synced
            </div>
          </div>

          <!-- Card 2: Agent Actions -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <h3 class="font-bold mb-4 flex items-center gap-2 text-base text-white">
              <span class="material-symbols-outlined text-white">history</span>
              Recent Agent Actions (WebMCP)
            </h3>
            <ul class="space-y-3">
              <li class="flex gap-3 items-start border-b border-white/10 pb-3">
                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white/10 text-white">
                  <span class="material-symbols-outlined text-sm">sync</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">Checked Open-Meteo precipitation</p>
                  <p class="text-[11px] text-white/60">10m ago · Tool: get_watering_forecast</p>
                </div>
              </li>
              <li class="flex gap-3 items-start">
                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white/10 text-white">
                  <span class="material-symbols-outlined text-sm">bolt</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">Updated intervals via get_care_schedule</p>
                  <p class="text-[11px] text-white/60">1h ago · Single source of truth</p>
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

  container.querySelectorAll('.dark-sched-water-action-btn').forEach(btn => {
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
