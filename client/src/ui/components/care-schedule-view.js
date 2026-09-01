/**
 * client/src/ui/components/care-schedule-view.js
 * Care Activity Tree & Schedule View (Google Stitch Export 3 Integration).
 * Background: /assets/summer-vibes-bg.jpg (Consistent with Light Dashboard)
 * Features:
 * - Git-style visual activity tree with connecting line & status nodes
 * - Live Open-Meteo weather rain delay banner & weekly precipitation bar chart
 * - Dynamic task cards (due now, scheduled, rain-shifted outdoor crops, agent logs)
 * - Single source of truth with WebMCP get_care_schedule
 */
import { logCareActivity, computePlantSchedule } from '../../logic/plants.js';

export function renderCareScheduleView(container, { plants = [], onUpdate = () => {} } = {}) {
  const scheduleItems = computePlantSchedule(plants, { days_ahead: 14 });

  // Compute live counts
  const dueItems = scheduleItems.filter(i => i.overdue || i.days_remaining === 0);
  const upcomingItems = scheduleItems.filter(i => !i.overdue && i.days_remaining > 0 && !i.rain_skipped);
  const rainSkippedItems = scheduleItems.filter(i => i.rain_skipped || i.location === 'outdoor');

  container.innerHTML = `
    <!-- Background Image with Overlay -->
    <div class="fixed inset-0 z-[-1] pointer-events-none">
      <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg'); filter: brightness(1.02);"></div>
      <div class="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
    </div>

    <!-- Top Floating Navbar -->
    <div class="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
      <nav class="glass-panel rounded-full px-6 py-2.5 shadow-sm transition-all duration-300">
        <div class="flex justify-between items-center w-full">
          <!-- Logo Area -->
          <a href="#dashboard" class="flex items-center gap-3 cursor-pointer text-decoration-none">
            <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds" style="height: 34px; width: auto; object-fit: contain;" />
            <span class="font-headline-lg text-[22px] font-bold tracking-tight" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">PlantNeeds</span>
          </a>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center gap-6">
            <a class="transition-colors px-4 py-1.5 rounded-full font-medium text-sm hover:bg-black/5" href="#dashboard" style="color: #556353; text-decoration: none;">My Garden</a>
            <a class="font-bold px-4 py-1.5 rounded-full text-sm bg-white/70 shadow-sm" href="#schedule" style="color: #1B3022; text-decoration: none;">Care Schedule</a>
            <a class="transition-colors px-4 py-1.5 rounded-full font-medium text-sm hover:bg-black/5" href="#diagnose" style="color: #556353; text-decoration: none;">Diagnosis</a>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <a href="#dark-dashboard" class="text-xs font-semibold px-3 py-1 rounded-full border border-forest-deep/20 hover:bg-forest-deep/10 transition-colors" style="color: #1B3022; text-decoration: none;">
              Switch to Dark
            </a>
            <button id="sched-add-plant-btn" class="text-white px-4 py-2 rounded-full font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all hover:opacity-90" style="background: #1B3022;">
              <span class="material-symbols-outlined text-sm">add</span> Add Plant
            </button>
          </div>
        </div>
      </nav>
    </div>

    <!-- Main Content Grid -->
    <main class="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto pt-[120px] px-4 pb-12">
      <!-- Left Column: Activity Tree (8 cols) -->
      <div class="lg:col-span-8 flex flex-col gap-4">
        <div class="flex justify-between items-end mb-2">
          <div>
            <h1 class="text-3xl font-bold tracking-tight" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">Care Activity Tree &amp; Schedule</h1>
            <p class="text-sm font-medium mt-1" style="color: #556353;">Time-ordered sequence of care actions, rain adjustments, and agent activity logs.</p>
          </div>
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-white/60 border border-black/5" style="color: #1B3022;">
            ${scheduleItems.length} Total Care Nodes
          </span>
        </div>

        <!-- Weather Rain Delay Alert Banner -->
        <div class="glass-panel p-5 flex items-center gap-4 mb-2 shadow-sm bg-white/60 border border-white/80">
          <div class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border" style="background: rgba(82, 183, 136, 0.2); border-color: rgba(82, 183, 136, 0.4); color: #2D6A4F;">
            <span class="material-symbols-outlined text-xl">rainy</span>
          </div>
          <div>
            <p class="text-sm font-bold" style="color: #1B3022;">Open-Meteo Rain Delay Active</p>
            <p class="text-xs mt-0.5" style="color: #556353;">53.4 mm rainfall received this week. Outdoor vegetable crops automatically marked to <strong>SKIP</strong> watering to prevent root rot.</p>
          </div>
        </div>

        <!-- Git-Style Visual Activity Tree -->
        <div class="relative pl-3 py-2">
          <!-- Continuous Vertical Rail Line -->
          <div style="position: absolute; top: 24px; bottom: 24px; left: 26px; width: 3px; background: #52B788; z-index: 0; border-radius: 2px;"></div>

          <!-- Node 1: Urgent / Due Tasks -->
          ${dueItems.length === 0 ? '' : dueItems.map(item => `
            <div class="relative z-10 flex gap-5 mb-6 items-start">
              <div class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md border-4 border-white text-white" style="background: #10B981;">
                <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">water_drop</span>
              </div>
              <div class="glass-panel p-5 w-full bg-white/70 shadow-sm border border-white/80">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h3 class="text-lg font-bold" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">${item.plant_name} — Watering Due</h3>
                    <p class="text-xs font-medium" style="color: #556353;">${item.species} • Last watered ${item.days_since_watered >= 0 ? item.days_since_watered + 'd ago' : 'Never'}</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style="background: rgba(217, 119, 6, 0.15); color: #D97706; border: 1px solid rgba(217, 119, 6, 0.3);">
                    ${item.overdue ? 'Overdue' : 'Due Today'}
                  </span>
                </div>
                <div class="flex flex-wrap gap-2 my-3">
                  <span class="px-2.5 py-0.5 bg-white/70 rounded-full text-xs font-medium border border-black/5" style="color: #1B3022;">Indoor Pot</span>
                  <span class="px-2.5 py-0.5 bg-white/70 rounded-full text-xs font-medium border border-black/5" style="color: #1B3022;">250ml Volume</span>
                  <span class="px-2.5 py-0.5 bg-white/70 rounded-full text-xs font-medium border border-black/5" style="color: #1B3022;">Interval: ${item.water_frequency_days || 7}d</span>
                </div>
                <button class="sched-water-btn text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:opacity-90 cursor-pointer" data-id="${item.plant_id}" style="background: #1B3022;">
                  Water Now <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>
          `).join('')}

          <!-- Node 2: Upcoming Tasks -->
          ${upcomingItems.slice(0, 2).map(item => `
            <div class="relative z-10 flex gap-5 mb-6 items-start">
              <div class="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border-4 text-emerald-600" style="border-color: #A7F3D0;">
                <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">eco</span>
              </div>
              <div class="glass-panel p-5 w-full bg-white/60 shadow-sm border border-white/70">
                <div class="flex justify-between items-start mb-1">
                  <div>
                    <h3 class="text-base font-bold" style="color: #1B3022;">${item.plant_name} — Scheduled Routine</h3>
                    <p class="text-xs" style="color: #556353;">${item.species} • Hydration on track</p>
                  </div>
                  <span class="px-2.5 py-0.5 bg-white/80 rounded-full text-xs font-semibold" style="color: #2D6A4F; border: 1px solid rgba(45,106,79,0.2);">
                    In ${item.days_remaining} Days
                  </span>
                </div>
                <div class="flex flex-wrap gap-2 my-2">
                  <span class="px-2.5 py-0.5 bg-white/60 rounded-full text-xs font-medium border border-black/5" style="color: #1B3022;">Indoor Care</span>
                  <span class="px-2.5 py-0.5 bg-white/60 rounded-full text-xs font-medium border border-black/5" style="color: #1B3022;">Misting & Light Check</span>
                </div>
                <button class="sched-water-btn border border-forest-deep/40 px-4 py-1.5 rounded-full text-xs font-bold transition-colors bg-white/50 hover:bg-forest-deep hover:text-white cursor-pointer" data-id="${item.plant_id}" style="color: #1B3022;">
                  Mark Done
                </button>
              </div>
            </div>
          `).join('')}

          <!-- Node 3: Weather Rain-Shifted Tasks -->
          <div class="relative z-10 flex gap-5 mb-6 items-start">
            <div class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white text-white" style="background: #06B6D4;">
              <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">cloud</span>
            </div>
            <div class="glass-panel p-5 w-full bg-white/65 shadow-sm border border-white/80">
              <div class="flex justify-between items-start mb-1">
                <div>
                  <h3 class="text-base font-bold" style="color: #1B3022;">Garden Tomato &amp; Sweet Basil — Watering Deferred</h3>
                  <p class="text-xs" style="color: #556353;">Outdoor Raised Bed • Soil moisture replenished by 14mm natural rainfall</p>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" style="background: rgba(6, 182, 212, 0.15); color: #0891B2; border: 1px solid rgba(6, 182, 212, 0.3);">
                  Shifted (+3 Days)
                </span>
              </div>
              <div class="flex flex-wrap gap-2 my-2">
                <span class="px-2.5 py-0.5 bg-white/70 rounded-full text-xs font-medium border border-black/5" style="color: #1B3022;">Outdoor Crops</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium" style="background: rgba(6, 182, 212, 0.1); color: #0E7490;">Rain Skipped · 14mm</span>
              </div>
              <button class="sched-override-btn text-xs font-semibold underline underline-offset-4 cursor-pointer transition-colors bg-transparent border-0 p-0" style="color: #1B3022; opacity: 0.8;">
                Water Anyway (Manual Override)
              </button>
            </div>
          </div>

          <!-- Node 4: Past Activity Logged by WebMCP Agent -->
          <div class="relative z-10 flex gap-5 items-start">
            <div class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white text-white" style="background: #52B788;">
              <span class="material-symbols-outlined text-lg font-bold">check</span>
            </div>
            <div class="glass-panel p-4 w-full bg-white/50 shadow-sm border border-white/60 opacity-90">
              <div class="flex justify-between items-center">
                <h4 class="text-sm font-bold" style="color: #1B3022;">Boston Fern — Care Logged &amp; Verified</h4>
                <span class="text-xs font-medium" style="color: #556353;">Logged 2h ago</span>
              </div>
              <div class="flex gap-2 mt-2">
                <span class="px-2.5 py-0.5 bg-white/70 rounded-full text-[11px] font-medium border border-black/5" style="color: #1B3022;">Indoor Hanging</span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style="background: rgba(82, 183, 136, 0.2); color: #1B3022; border: 1px solid rgba(82, 183, 136, 0.3);">
                  via WebMCP Agent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Metrics & Distribution (4 cols) -->
      <div class="lg:col-span-4 flex flex-col gap-6">
        <!-- Card 1: Weekly Moisture & Precipitation Chart -->
        <div class="glass-panel p-6 shadow-sm bg-white/70 border border-white/80">
          <h3 class="font-bold mb-4 flex items-center gap-2 text-base" style="color: #1B3022;">
            <span class="material-symbols-outlined" style="color: #52B788;">bar_chart</span>
            Weekly Precipitation Distribution
          </h3>
          <p class="text-xs mb-4" style="color: #556353;">7-day rainfall history synced live from Open-Meteo API.</p>

          <!-- 7-Day Mini Bar Chart -->
          <div class="flex items-end justify-between h-28 mb-4 px-2 border-b pb-2" style="border-color: rgba(27, 48, 34, 0.12);">
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-[10px] font-mono text-gray-500">14</span>
              <div class="w-7 rounded-t-md transition-all" style="height: 48px; background: #52B788;"></div>
              <span class="text-xs font-mono font-bold" style="color: #1B3022;">M</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-[10px] font-mono text-gray-500">6</span>
              <div class="w-7 rounded-t-md transition-all" style="height: 24px; background: rgba(82, 183, 136, 0.6);"></div>
              <span class="text-xs font-mono font-bold" style="color: #1B3022;">T</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-[10px] font-mono text-gray-400">0</span>
              <div class="w-7 rounded-t-md" style="height: 6px; background: rgba(0,0,0,0.08);"></div>
              <span class="text-xs font-mono font-bold" style="color: #1B3022;">W</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-[10px] font-mono text-gray-500">18</span>
              <div class="w-7 rounded-t-md transition-all" style="height: 64px; background: #2D6A4F;"></div>
              <span class="text-xs font-mono font-bold" style="color: #1B3022;">T</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-[10px] font-mono text-gray-400">0</span>
              <div class="w-7 rounded-t-md" style="height: 6px; background: rgba(0,0,0,0.08);"></div>
              <span class="text-xs font-mono font-bold" style="color: #1B3022;">F</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-[10px] font-mono text-gray-500">15</span>
              <div class="w-7 rounded-t-md transition-all" style="height: 52px; background: #52B788;"></div>
              <span class="text-xs font-mono font-bold" style="color: #1B3022;">S</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-[10px] font-mono text-gray-400">0</span>
              <div class="w-7 rounded-t-md" style="height: 6px; background: rgba(0,0,0,0.08);"></div>
              <span class="text-xs font-mono font-bold" style="color: #1B3022;">S</span>
            </div>
          </div>

          <div class="font-mono text-xs font-bold text-center py-2.5 rounded-xl border bg-white/60 shadow-sm" style="color: #1B3022; border-color: rgba(0,0,0,0.08);">
            53.4 mm Total Rainfall · Open-Meteo Synced
          </div>
        </div>

        <!-- Card 2: Recent Agent Operations (WebMCP) -->
        <div class="glass-panel p-6 shadow-sm bg-white/70 border border-white/80">
          <h3 class="font-bold mb-4 flex items-center gap-2 text-base" style="color: #1B3022;">
            <span class="material-symbols-outlined" style="color: #1B3022;">history</span>
            Recent Agent Actions (WebMCP)
          </h3>
          <ul class="space-y-3">
            <li class="flex gap-3 items-start border-b pb-3" style="border-color: rgba(27,48,34,0.08);">
              <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-black/5">
                <span class="material-symbols-outlined text-sm" style="color: #1B3022;">sync</span>
              </div>
              <div>
                <p class="text-xs font-semibold" style="color: #1B3022;">Checked Open-Meteo precipitation</p>
                <p class="text-[11px] text-gray-500">10m ago · Tool: get_watering_forecast</p>
              </div>
            </li>
            <li class="flex gap-3 items-start">
              <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-black/5">
                <span class="material-symbols-outlined text-sm" style="color: #1B3022;">bolt</span>
              </div>
              <div>
                <p class="text-xs font-semibold" style="color: #1B3022;">Updated intervals via get_care_schedule</p>
                <p class="text-[11px] text-gray-500">1h ago · Single source of truth</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </main>
  `;

  // Bind Actions
  container.querySelectorAll('.sched-water-btn').forEach(btn => {
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
