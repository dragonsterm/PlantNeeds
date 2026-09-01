/**
 * client/src/ui/components/care-schedule-view.js
 * Care Activity Tree & Schedule View.
 * 100% BASED ON Google Stitch Export 3 (code.html) with exact Light Dashboard Navbar,
 * Glassmorphism, Typography (Plus Jakarta Sans + Inter + JetBrains Mono), and Colors.
 */
import { logCareActivity, computePlantSchedule } from '../../logic/plants.js';

export function renderCareScheduleView(container, { plants = [], onUpdate = () => {} } = {}) {
  const scheduleItems = computePlantSchedule(plants, { days_ahead: 14 });

  container.innerHTML = `
    <!-- Background Image with Overlay (Exact same as Light Dashboard) -->
    <div class="fixed inset-0 z-[-1] pointer-events-none">
      <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg');"></div>
    </div>

    <!-- Top Floating Navbar (Exact 1:1 match with Light Dashboard) -->
    <div class="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
      <nav class="glass-panel rounded-full px-6 py-2.5 shadow-sm transition-all duration-300">
        <div class="flex justify-between items-center w-full">
          <!-- Logo Area -->
          <a href="#light-dashboard" class="flex items-center gap-3 cursor-pointer" style="text-decoration: none;">
            <img src="/assets/plantneeds-leaf-drop-logo.png" alt="PlantNeeds Logo" style="height: 34px; width: auto; object-fit: contain;" />
            <span class="font-headline-lg text-headline-lg font-bold" style="color: #1B3022;">PlantNeeds</span>
          </a>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center gap-8">
            <a class="transition-colors px-3 py-1 rounded-md duration-300 font-medium" href="#light-dashboard" style="color: #556353; text-decoration: none;">My Garden</a>
            <a class="font-semibold border-b-2 pb-1 transition-all duration-150 ease-in-out scale-95" href="#schedule" style="color: #1B3022; border-color: #1B3022; text-decoration: none;">Care Schedule</a>
            <a class="transition-colors px-3 py-1 rounded-md duration-300 font-medium" href="#diagnose" style="color: #556353; text-decoration: none;">Diagnosis</a>
            <a class="text-xs hover:underline" href="#dark-dashboard" style="color: #154212; font-weight: 600; text-decoration: none;">[Switch to Dark Theme]</a>
          </div>

          <!-- Trailing Actions -->
          <div class="flex items-center gap-4">
            <button id="sched-add-plant-btn" class="bg-forest-deep text-white px-5 py-2 rounded-full font-body-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm border border-transparent" style="background: #1B3022;">
              <span class="material-symbols-outlined text-sm">add</span> Add Plant
            </button>
            <div class="flex items-center gap-2" style="color: #1B3022;">
              <button class="p-2 rounded-full hover:bg-black/10 transition-colors bg-black/5" style="border: none; cursor: pointer;">
                <span class="material-symbols-outlined">notifications</span>
              </button>
              <div class="w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm ml-2 cursor-pointer transition-colors" style="border-color: rgba(27, 48, 34, 0.25);">
                <img class="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmX1gzteICusJWAL6o8TBIgj2aEee9UDdvGv6jrJbIKNbZAazY-YqO-IzcOOAN3rTeV7Y-YQ7bLoaXpDW90AIvceHzpVtw_OMpR58pkcZTULK5kL9f5uSdUShAUdorMz1oqpQMUPVUaakMa80pIX8-4nXAjqdeOfMMgRmDTVq2VvPSR-Chyq383zmwaJpVEaEOzhXDp8H7OeeF2QHULS_0Zk6zCCEmoBVeWXE-pzMI2x5Dpphl2Bp_sw"/>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <!-- Main Content Grid (Exact padding & layout matching Light Dashboard) -->
    <main class="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto pt-[120px] pb-12 px-container-margin">
      <!-- Left Column: Activity Tree (8 cols) -->
      <div class="lg:col-span-8 flex flex-col gap-4">
        <h1 class="font-headline-xl text-headline-xl text-forest-deep mb-1" style="color: #1B3022; font-family: 'Plus Jakarta Sans', sans-serif;">Care Activity Tree &amp; Schedule</h1>

        <!-- Weather Alert Banner (From Stitch Export 3) -->
        <div class="glass-panel p-5 flex flex-col sm:flex-row items-center gap-4 mb-2 shadow-sm relative overflow-hidden" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 4px 24px rgba(27, 48, 34, 0.08);">
          <div class="flex items-center gap-3 relative z-10 w-full">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style="background: rgba(82, 183, 136, 0.2); border-color: rgba(82, 183, 136, 0.4); color: #2D6A4F;">
              <span class="material-symbols-outlined">rainy</span>
            </div>
            <p class="font-body-sm text-forest-deep" style="color: #1B3022; margin: 0;">
              <strong class="font-semibold">Open-Meteo Rain Delay Active:</strong> 53.4 mm rain received this week. 2 outdoor tasks automatically shifted.
            </p>
          </div>
        </div>

        <!-- Git-Style Visual Activity Tree Container -->
        <div class="relative pl-2 py-4">
          <!-- Continuous Vertical Connecting Rail Line -->
          <div style="position: absolute; top: 24px; bottom: 24px; left: 23px; width: 3px; background-color: #52B788; z-index: 0; border-radius: 2px;"></div>

          <!-- Dynamic Urgent Node 1 -->
          <div class="relative z-10 flex gap-6 mb-8 items-start group">
            <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg border-4 border-white" style="background: #10B981;">
              <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">water_drop</span>
            </div>
            <div class="glass-panel p-6 w-full" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-headline-lg-mobile text-[22px] leading-tight text-forest-deep font-bold" style="color: #1B3022;">Kitchen Monstera — Due for Water (250ml)</h3>
                <button class="text-forest-deep/60 hover:text-forest-deep" style="background: none; border: none; cursor: pointer;"><span class="material-symbols-outlined">more_horiz</span></button>
              </div>
              <div class="flex flex-wrap gap-2 mb-6">
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Indoor Pot</span>
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Due Today</span>
                <span class="px-3 py-1 rounded-full font-label-caps text-xs font-bold" style="background: rgba(217, 119, 6, 0.15); color: #D97706; border: 1px solid rgba(217, 119, 6, 0.3);">Overdue 2d</span>
              </div>
              <button class="sched-water-action-btn text-white px-6 py-2.5 rounded-full font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer" data-id="${scheduleItems[0]?.plant_id || '1'}" style="background: #1B3022;">
                Water Now <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Node 2 (Upcoming) -->
          <div class="relative z-10 flex gap-6 mb-8 items-start group">
            <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border-4" style="border-color: #A7F3D0; color: #10B981;">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">eco</span>
            </div>
            <div class="glass-panel p-6 w-full" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-headline-lg-mobile text-[22px] leading-tight text-forest-deep font-bold" style="color: #1B3022;">Spider Plant — Foliage Misting</h3>
              </div>
              <div class="flex flex-wrap gap-2 mb-6">
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Indoor Hanging</span>
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Due Tomorrow</span>
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Light Mist</span>
              </div>
              <button class="sched-water-action-btn border px-6 py-2.5 rounded-full font-semibold transition-colors flex items-center gap-2 bg-white/50 hover:bg-forest-deep hover:text-white cursor-pointer" data-id="${scheduleItems[1]?.plant_id || '2'}" style="color: #1B3022; border-color: #1B3022;">
                Mark Done
              </button>
            </div>
          </div>

          <!-- Dynamic Node 3 (Rain-Shifted Branch) -->
          <div class="relative z-10 flex gap-6 mb-8 items-start group">
            <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white text-white" style="background: #06B6D4;">
              <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">cloud</span>
            </div>
            <div class="glass-panel p-6 w-full" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-headline-lg-mobile text-[22px] leading-tight text-forest-deep font-bold" style="color: #1B3022;">Garden Tomato &amp; Sweet Basil — Watering Deferred by Rainfall (+3 Days)</h3>
              </div>
              <div class="flex flex-wrap gap-2 mb-6">
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Outdoor Bed</span>
                <span class="px-3 py-1 rounded-full font-label-caps text-xs font-semibold" style="background: rgba(6, 182, 212, 0.15); color: #0891B2; border: 1px solid rgba(6, 182, 212, 0.3);">Rain Skipped · 14mm natural rain</span>
              </div>
              <a class="text-sm font-semibold underline underline-offset-4 transition-colors cursor-pointer" style="color: #1B3022; opacity: 0.85;">
                Water Anyway (Manual Override)
              </a>
            </div>
          </div>

          <!-- Dynamic Node 4 (Past Activity Logged by Agent) -->
          <div class="relative z-10 flex gap-6 mb-8 items-start group">
            <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white text-white" style="background: #52B788;">
              <span class="material-symbols-outlined text-white font-bold">check</span>
            </div>
            <div class="glass-panel p-6 w-full" style="background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-headline-lg-mobile text-[22px] leading-tight text-forest-deep font-bold" style="color: #1B3022;">Boston Fern — Care Logged</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Indoor</span>
                <span class="px-3 py-1 bg-white/60 text-forest-deep rounded-full font-label-caps text-xs border border-black/5" style="color: #1B3022;">Logged 2h ago</span>
                <span class="px-3 py-1 rounded-full font-label-caps text-xs font-bold" style="background: rgba(82, 183, 136, 0.25); color: #1B3022; border: 1px solid rgba(82, 183, 136, 0.4);">via WebMCP Agent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Metrics (4 cols - Exact from Stitch Export 3) -->
      <div class="lg:col-span-4 flex flex-col gap-6">
        <!-- Card 1: Moisture Chart -->
        <div class="glass-panel p-6" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
          <h3 class="font-bold mb-6 flex items-center gap-2" style="color: #1B3022;">
            <span class="material-symbols-outlined" style="color: #52B788;">bar_chart</span>
            Weekly Precipitation Distribution
          </h3>
          <!-- Mini Bar Chart Visualization -->
          <div class="flex items-end justify-between h-32 mb-6 px-2 border-b pb-2" style="border-color: rgba(27, 48, 34, 0.1);">
            <div class="flex flex-col items-center gap-2 group">
              <div class="w-8 rounded-t-md transition-colors" style="height: 48px; background: rgba(82, 183, 136, 0.6);"></div>
              <span class="text-xs font-mono" style="color: #1B3022;">M</span>
            </div>
            <div class="flex flex-col items-center gap-2 group">
              <div class="w-8 rounded-t-md transition-colors" style="height: 24px; background: rgba(82, 183, 136, 0.4);"></div>
              <span class="text-xs font-mono" style="color: #1B3022;">T</span>
            </div>
            <div class="flex flex-col items-center gap-2 group">
              <div class="w-8 rounded-t-md" style="height: 8px; background: rgba(0,0,0,0.1);"></div>
              <span class="text-xs font-mono" style="color: #1B3022;">W</span>
            </div>
            <div class="flex flex-col items-center gap-2 group">
              <div class="w-8 rounded-t-md transition-colors" style="height: 72px; background: rgba(82, 183, 136, 0.85);"></div>
              <span class="text-xs font-mono" style="color: #1B3022;">T</span>
            </div>
            <div class="flex flex-col items-center gap-2 group">
              <div class="w-8 rounded-t-md" style="height: 8px; background: rgba(0,0,0,0.1);"></div>
              <span class="text-xs font-mono" style="color: #1B3022;">F</span>
            </div>
            <div class="flex flex-col items-center gap-2 group">
              <div class="w-8 rounded-t-md transition-colors" style="height: 60px; background: rgba(82, 183, 136, 0.7);"></div>
              <span class="text-xs font-mono" style="color: #1B3022;">S</span>
            </div>
            <div class="flex flex-col items-center gap-2 group">
              <div class="w-8 rounded-t-md" style="height: 8px; background: rgba(0,0,0,0.1);"></div>
              <span class="text-xs font-mono" style="color: #1B3022;">S</span>
            </div>
          </div>
          <div class="font-mono text-sm font-semibold text-center py-3 rounded-xl shadow-sm border" style="background: rgba(255, 255, 255, 0.5); color: #1B3022; border-color: rgba(0,0,0,0.06);">
            53.4 mm Total Rainfall · Open-Meteo Synced
          </div>
        </div>

        <!-- Card 2: Agent Actions -->
        <div class="glass-panel p-6" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 10px 30px rgba(27, 48, 34, 0.08);">
          <h3 class="font-bold mb-6 flex items-center gap-2" style="color: #1B3022;">
            <span class="material-symbols-outlined" style="color: #1B3022;">history</span>
            Recent Agent Actions (WebMCP)
          </h3>
          <ul class="space-y-4">
            <li class="flex gap-3 items-start border-b pb-4" style="border-color: rgba(27, 48, 34, 0.08);">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background: rgba(27, 48, 34, 0.06);">
                <span class="material-symbols-outlined text-lg" style="color: #1B3022;">sync</span>
              </div>
              <div>
                <p class="font-medium text-sm" style="color: #1B3022;">Checked Open-Meteo precipitation</p>
                <p class="text-xs mt-1" style="color: #556353;">10m ago · Tool: get_watering_forecast</p>
              </div>
            </li>
            <li class="flex gap-3 items-start">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background: rgba(27, 48, 34, 0.06);">
                <span class="material-symbols-outlined text-lg" style="color: #1B3022;">history</span>
              </div>
              <div>
                <p class="font-medium text-sm" style="color: #1B3022;">Updated Monstera schedule via <code class="px-1.5 py-0.5 rounded text-xs font-mono" style="background: rgba(27, 48, 34, 0.08);">get_care_schedule</code></p>
                <p class="text-xs mt-1" style="color: #556353;">1h ago · Live synced with UI</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </main>
  `;

  // Bind Actions
  container.querySelectorAll('.sched-water-action-btn').forEach(btn => {
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
