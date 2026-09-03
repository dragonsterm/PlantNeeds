/**
 * client/src/ui/components/render-light-schedule.js
 * Care Activity Tree & Schedule View (Light Mode Schedule).
 * 100% Dynamic data binding — Zero hardcoded mock nodes.
 */
import { logCareActivity, computePlantSchedule } from '../../logic/plants.js';
import { clearCache, emit } from "../../state/store.js";
import { clearToken } from '../../api/client.js';
import { renderAddPlantModal } from './add-plant-form.js';
import { renderSettingsModal } from './settings-modal.js';
import { toggleAppTheme, savePlantsLocally, getSavedPlants } from '../render.js';
import { showToast } from './toast-notification.js';
import { getNavbarHtml, getWeatherBannerHtml } from './navbar.js';
import { getFooterHtml } from './footer.js';

export function renderLightSchedule(container, { plants = [], weatherData = null, onUpdate = () => {} } = {}) {
  // Use saved plants fallback if none passed
  const activePlants = plants.length > 0 ? plants : getSavedPlants();
  const scheduleItems = computePlantSchedule(activePlants, { days_ahead: 14 });

  const dueItems = scheduleItems.filter(i => i.overdue || i.days_remaining === 0);
  const upcomingItems = scheduleItems.filter(i => !i.overdue && i.days_remaining > 0);

  // All active tree nodes are derived 100% dynamically from user plants
  const allNodes = [...dueItems, ...upcomingItems];

  const w = weatherData || window.__plantneeds_weather || null;
  const dailyHistory = (Array.isArray(w?.daily_history) && w.daily_history.length === 7)
    ? w.daily_history
    : [
        { day: 'M', rain_mm: 0 },
        { day: 'T', rain_mm: 0 },
        { day: 'W', rain_mm: 0 },
        { day: 'T', rain_mm: 0 },
        { day: 'F', rain_mm: 0 },
        { day: 'S', rain_mm: 0 },
        { day: 'S', rain_mm: 0 }
      ];

  const totalRain = typeof w?.recent_rain_mm === 'number'
    ? w.recent_rain_mm
    : dailyHistory.reduce((acc, d) => acc + (Number(d.rain_mm) || 0), 0);

  container.innerHTML = `
    <!-- Background Image with Overlay (Identical to Light Dashboard) -->
    <div class="fixed inset-0 z-[-1] pointer-events-none">
      <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg');"></div>
    </div>

    <!-- Top Floating Navbar -->
    ${getNavbarHtml({ activeRoute: 'schedule', theme: 'light' })}

    <!-- Main Content -->
    <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
      <!-- Top Weather Banner -->
      ${getWeatherBannerHtml({
        theme: 'light',
        plants: activePlants,
        weather: window.__plantneeds_weather || weatherData || null,
        outdoorCount: activePlants.filter(p => p.location === 'outdoor').length,
        indoorDueCount: dueItems.filter(i => i.location !== 'outdoor').length
      })}

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Activity Tree (8 cols) -->
        <div class="lg:col-span-8 flex flex-col gap-4">
          <div class="flex justify-between items-end mb-1">
            <h1 class="font-headline-xl text-headline-xl text-forest-deep" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">Care Activity Tree &amp; Schedule</h1>
            <span class="text-xs font-semibold px-3 py-1 rounded-full border shadow-sm" style="background: rgba(255, 255, 255, 0.65); color: #1B3022; border-color: rgba(255, 255, 255, 0.85);">
              ${allNodes.length} Care ${allNodes.length === 1 ? 'Node' : 'Nodes'} Scheduled
            </span>
          </div>

          <!-- Git-Style Visual Activity Tree Container -->
          <div class="relative pl-3 py-2">
            <!-- Continuous Vertical Connecting Line -->
            ${allNodes.length > 1 ? `
              <div style="position: absolute; top: 28px; bottom: 28px; left: 29px; width: 3px; background-color: #52B788; z-index: 0; border-radius: 2px;"></div>
            ` : ''}

            ${allNodes.length === 0 ? `
              <div class="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-[#1B3022]/10" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                <span class="material-symbols-outlined text-5xl mb-3 text-[#52B788]">task_alt</span>
                <h3 class="font-headline-lg text-[#1B3022] font-bold mb-1">All Plants Are Hydrated &amp; Happy</h3>
                <p class="font-body-sm text-[#556353] max-w-sm mb-6">No care tasks are due today. Check back tomorrow or add a new plant to your collection.</p>
                <button id="sched-empty-add-btn" class="bg-[#154212] text-white px-6 py-2.5 rounded-full font-body-sm font-semibold hover:bg-[#1B3022] transition flex items-center gap-2 cursor-pointer shadow-md text-xs">
                  <span class="material-symbols-outlined text-sm">add</span> Add New Plant
                </button>
              </div>
            ` : `
              <!-- Dynamic Nodes List -->
              ${allNodes.map(item => {
                const isOverdue = item.overdue || item.days_remaining === 0;
                const isOutdoor = item.location === 'outdoor';
                const isRainDeferred = isOutdoor && item.rain_skipped;
                
                let icon = 'water_drop';
                let iconBg = '#10B981';
                let statusBadgeText = isOverdue ? (item.overdue ? `Overdue ${Math.abs(item.days_remaining)}d` : 'Due Today') : `Due in ${item.days_remaining}d`;
                let statusBadgeBg = isOverdue ? 'rgba(217, 119, 6, 0.18)' : 'rgba(82, 183, 136, 0.2)';
                let statusBadgeColor = isOverdue ? '#D97706' : '#2D6A4F';

                if (isRainDeferred) {
                  icon = 'cloud';
                  iconBg = '#06B6D4';
                  statusBadgeText = 'Rain Skipped (+3d)';
                  statusBadgeBg = 'rgba(6, 182, 212, 0.18)';
                  statusBadgeColor = '#0E7490';
                }

                return `
                  <div class="relative z-10 flex gap-6 mb-6 items-start group">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg border-4 border-white text-white" style="background: ${iconBg};">
                      <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                    </div>
                    <div class="glass-card rounded-3xl p-6 w-full flex flex-col group hover:-translate-y-0.5 transition-transform duration-300" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
                      <div class="flex justify-between items-start mb-1">
                        <h3 class="text-xl font-bold tracking-tight" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">
                          ${item.plant_name} — ${isRainDeferred ? 'Watering Deferred by Rain' : 'Watering Due'}
                        </h3>
                      </div>
                      <p class="text-xs mb-3" style="color: #556353;">
                        ${item.species || 'Houseplant'} • ${isOutdoor ? 'Outdoor Garden Bed' : 'Indoor Container'} • Last watered ${item.days_since_watered >= 0 ? item.days_since_watered + 'd ago' : 'Never'}
                      </p>
                      
                      <!-- Tag Badges Row -->
                      <div class="flex flex-wrap items-center gap-2 mb-4">
                        <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">
                          ${isOutdoor ? 'Outdoor Bed' : 'Indoor Pot'}
                        </span>
                        <span class="px-3 py-0.5 rounded-full text-xs font-semibold border" style="background: rgba(255, 255, 255, 0.7); color: #1B3022; border-color: rgba(27, 48, 34, 0.1);">
                          Interval: ${item.water_frequency_days || 7}d
                        </span>
                        <span class="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border" style="background: ${statusBadgeBg}; color: ${statusBadgeColor}; border-color: ${statusBadgeColor}40;">
                          ${statusBadgeText}
                        </span>
                      </div>

                      <div class="flex items-center gap-3">
                        <button class="sched-water-action-btn text-white px-6 py-2 rounded-full font-semibold text-xs transition-colors inline-flex items-center gap-2 shadow-sm hover:opacity-90 cursor-pointer" data-id="${item.plant_id}" style="background: #1B3022;">
                          Water Now <span class="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            `}
          </div>
        </div>

        <!-- Right Column: Metrics (4 cols) -->
        <div class="lg:col-span-4 flex flex-col gap-6">
          <!-- Card 1: Moisture Chart -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <h3 class="font-bold mb-4 flex items-center gap-2 text-base" style="color: #1B3022;">
              <span class="material-symbols-outlined" style="color: #52B788;">bar_chart</span>
              Weekly Precipitation Distribution
            </h3>
            <p class="text-xs mb-4" style="color: #556353;">7-day rainfall history synced live from Open-Meteo API.</p>

            <div class="flex items-end justify-between h-32 mb-4 px-2 border-b pb-2" style="border-color: rgba(27, 48, 34, 0.12);">
              ${dailyHistory.map(d => {
                const val = Number(d.rain_mm) || 0;
                const barHeight = val > 0 ? Math.max(14, Math.min(86, Math.round(val * 5))) : 4;
                const barBg = val >= 5 
                  ? '#2D6A4F' 
                  : (val > 0 ? '#52B788' : 'rgba(0,0,0,0.08)');
                return `
                  <div class="flex flex-col items-center gap-1.5" style="flex: 1;">
                    <span class="text-[10px] font-mono ${val > 0 ? 'text-[#1B3022] font-semibold' : 'text-gray-400'}">${val.toFixed(1)}</span>
                    <div class="w-7 rounded-t-md transition-all" style="height: ${barHeight}px; background: ${barBg};"></div>
                    <span class="text-xs font-mono font-bold" style="color: #1B3022;">${d.day}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Rainfall Summary Box -->
            <div class="rounded-2xl p-4 flex items-center justify-between border shadow-sm" style="background: rgba(255, 255, 255, 0.7); border-color: rgba(27, 48, 34, 0.1);">
              <div>
                <span class="text-xs font-medium block" style="color: #556353;">7-Day Cumulative</span>
                <span class="text-xl font-bold tracking-tight" style="color: #1B3022;">${totalRain.toFixed(1)} mm</span>
              </div>
              <span class="text-xs px-3 py-1 rounded-full font-semibold border" style="background: rgba(82, 183, 136, 0.2); color: #2D6A4F; border-color: rgba(82, 183, 136, 0.35);">
                ${totalRain >= 5 ? 'Rain Active' : 'Normal Conditions'}
              </span>
            </div>
          </div>

          <!-- Card 2: WebMCP Live Agent Status -->
          <div class="glass-card rounded-3xl p-6" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold flex items-center gap-2 text-base" style="color: #1B3022;">
                <span class="material-symbols-outlined" style="color: #52B788;">smart_toy</span>
                WebMCP Autonomous Sync
              </h3>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Active
              </span>
            </div>
            
            <p class="text-xs leading-relaxed mb-4" style="color: #556353;">
              The 7 page-exposed WebMCP tools allow AI agents in ChatGPT and Chrome to inspect schedules, defer watering, and log care autonomously.
            </p>

            <div class="space-y-3">
              <div class="p-3 rounded-2xl bg-white/60 border border-black/5 flex items-start gap-3">
                <span class="material-symbols-outlined text-sm text-[#52B788] mt-0.5">check_circle</span>
                <div>
                  <div class="text-xs font-bold text-[#1B3022]">Tool #2: get_care_schedule</div>
                  <div class="text-[11px] text-[#556353]">Single source of truth between agent and UI view.</div>
                </div>
              </div>
              <div class="p-3 rounded-2xl bg-white/60 border border-black/5 flex items-start gap-3">
                <span class="material-symbols-outlined text-sm text-[#52B788] mt-0.5">check_circle</span>
                <div>
                  <div class="text-xs font-bold text-[#1B3022]">Tool #3: get_watering_forecast</div>
                  <div class="text-[11px] text-[#556353]">Live Open-Meteo telemetry for rain delay evaluations.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Universal Footer -->
    ${getFooterHtml({ theme: 'light' })}
  `;

  // Bindings for Theme & Actions
  container.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
    toggleAppTheme();
    onUpdate();
  });

  container.querySelector('#global-logout-btn')?.addEventListener('click', () => {
    clearToken(); clearCache(); emit("auth-changed");
    window.location.hash = '';
    onUpdate();
  });

  container.querySelector('#global-add-plant-btn')?.addEventListener('click', () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  });

  container.querySelector('#sched-empty-add-btn')?.addEventListener('click', () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  });

  container.querySelectorAll('.sched-water-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.textContent = 'Watering...';
      btn.disabled = true;

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        await logCareActivity(id, { activity: 'watered', date: todayStr });

        const currentPlants = getSavedPlants();
        const plant = currentPlants.find(p => p.id === id);
        if (plant) {
          plant.last_watered = todayStr;
          savePlantsLocally(currentPlants);
        }

        showToast({
          title: "Care Activity Logged",
          message: `${plant ? plant.name : 'Plant'} was watered. Schedule updated.`,
          type: "success"
        });

        onUpdate();
      } catch (err) {
        showToast({ title: "Watering Failed", message: err.message, type: "error" });
        btn.textContent = 'Water Now';
        btn.disabled = false;
      }
    });
  });
}
