/**
 * client/src/ui/components/render-dark-schedule.js
 * Care Activity Tree & Schedule View (Dark Mode Schedule).
 * 100% IDENTICAL NAVBAR, GLASSMORPHISM, AND PADDING AS DARK DASHBOARD.
 */
import { logCareActivity, computePlantSchedule } from '../../logic/plants.js';
import { clearToken } from '../../api/client.js';
import { renderAddPlantModal } from './add-plant-form.js';
import { toggleAppTheme } from '../render.js';

export function renderDarkSchedule(container, { plants = [], onUpdate = () => {} } = {}) {
  const scheduleItems = computePlantSchedule(plants, { days_ahead: 14 });

  const dueItems = scheduleItems.filter(i => i.overdue || i.days_remaining === 0);
  const upcomingItems = scheduleItems.filter(i => !i.overdue && i.days_remaining > 0 && !i.rain_skipped);

  container.innerHTML = `
    <!-- Dark Dashboard Background (Dark Moody Foliage with Raindrops) -->
    <div class="bg-layer"></div>

    <!-- TopNavBar Dark (Exact 1:1 clone of Dark Dashboard) -->
    <div class="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
      <nav class="glass-panel rounded-full px-6 py-2.5 shadow-sm transition-all duration-300">
        <div class="flex justify-between items-center w-full">
          <!-- Logo Area -->
          <a href="#dashboard" class="flex items-center gap-3 cursor-pointer" style="text-decoration: none;">
            <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds Logo" style="height: 34px; width: auto; object-fit: contain;" />
            <span class="font-headline-lg text-headline-lg font-bold text-white">PlantNeeds</span>
          </a>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center gap-8">
            <a class="text-white/70 hover:text-white transition-colors hover:bg-white/10 px-3 py-1 rounded-md duration-300" href="#dashboard" style="text-decoration: none;">My Garden</a>
            <a class="text-white font-semibold border-b-2 border-white pb-1 transition-all duration-150 ease-in-out scale-95" href="#schedule" style="text-decoration: none;">Care Schedule</a>
            <a class="text-white/70 hover:text-white transition-colors hover:bg-white/10 px-3 py-1 rounded-md duration-300" href="#diagnose" style="text-decoration: none;">Diagnosis</a>
            <button id="dark-sched-theme-toggle-btn" class="text-primary-fixed hover:underline text-xs" style="background: none; border: none; cursor: pointer; font-weight: 600;">[Switch to Light Theme]</button>
          </div>

          <!-- Trailing Actions -->
          <div class="flex items-center gap-4">
            <button id="dark-sched-add-plant-btn" class="bg-primary text-white px-5 py-2 rounded-full font-body-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm border border-white/10" style="background: #154212; cursor: pointer;">
              <span class="material-symbols-outlined text-sm">add</span> Add Plant
            </button>
            <div class="flex items-center gap-2 text-white">
              <button class="p-2 rounded-full hover:bg-white/20 transition-colors bg-white/10" style="border: none; cursor: pointer;">
                <span class="material-symbols-outlined">notifications</span>
              </button>
              <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed/30 shadow-sm ml-2 cursor-pointer hover:border-primary-fixed transition-colors">
                <img class="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmX1gzteICusJWAL6o8TBIgj2aEee9UDdvGv6jrJbIKNbZAazY-YqO-IzcOOAN3rTeV7Y-YQ7bLoaXpDW90AIvceHzpVtw_OMpR58pkcZTULK5kL9f5uSdUShAUdorMz1oqpQMUPVUaakMa80pIX8-4nXAjqdeOfMMgRmDTVq2VvPSR-Chyq383zmwaJpVEaEOzhXDp8H7OeeF2QHULS_0Zk6zCCEmoBVeWXE-pzMI2x5Dpphl2Bp_sw"/>
              </div>
              <button id="dark-sched-logout-btn" title="Sign Out" class="text-white/60 text-xs hover:text-white underline ml-2" style="background: none; border: none; cursor: pointer;">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <!-- Main Content Grid -->
    <main class="pt-[120px] pb-12 px-container-margin max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Activity Tree (8 cols) -->
        <div class="lg:col-span-8 flex flex-col gap-4">
          <div class="flex justify-between items-end mb-1">
            <h1 class="font-headline-xl text-headline-xl text-white drop-shadow-sm" style="font-family: 'Plus Jakarta Sans', sans-serif;">Care Activity Tree &amp; Schedule</h1>
            <span class="text-xs font-semibold px-3 py-1 rounded-full border border-white/20 text-white/90 bg-white/10 shadow-sm">
              ${scheduleItems.length} Total Care Nodes
            </span>
          </div>

          <!-- Top Weather Alert Banner (Dark Emerald Glass) -->
          <div class="glass-panel rounded-2xl p-4 mb-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden" style="background: rgba(0, 0, 0, 0.35); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15);">
            <div class="flex items-center gap-3 relative z-10">
              <div class="w-10 h-10 rounded-full bg-status-water/20 flex items-center justify-center text-status-water border border-status-water/30 shrink-0">
                <span class="material-symbols-outlined">rainy</span>
              </div>
              <p class="font-body-sm text-white/90" style="margin: 0;">
                <strong class="text-white font-semibold">Open-Meteo Rain Delay Active:</strong> 53.4 mm rainfall received this week. 2 outdoor tasks automatically shifted to prevent overwatering.
              </p>
            </div>
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full relative z-10 border shrink-0" style="background: rgba(188, 240, 174, 0.2); border-color: rgba(188, 240, 174, 0.35);">
              <span class="w-2 h-2 rounded-full bg-primary-fixed"></span>
              <span class="font-label-caps text-primary-fixed" style="font-weight: 700; font-size: 11px;">Live Weather</span>
            </div>
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

  // Bind Navbar and Component Actions
  container.querySelector('#dark-sched-theme-toggle-btn')?.addEventListener('click', () => {
    toggleAppTheme();
  });

  container.querySelector('#dark-sched-add-plant-btn')?.addEventListener('click', () => {
    renderAddPlantModal(container, { onClose: () => onUpdate() });
  });

  container.querySelector('#dark-sched-logout-btn')?.addEventListener('click', () => {
    clearToken();
    window.location.hash = '';
    onUpdate();
  });

  container.querySelectorAll('.dark-sched-water-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.textContent = 'Watering...';
      btn.disabled = true;
      try {
        await logCareActivity({ plant_id: id, activity: 'watered', source: 'human' });
        onUpdate();
      } catch {
        btn.textContent = 'Watered ✓';
      }
    });
  });
}
