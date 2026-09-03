/**
 * client/src/ui/components/render-light-diagnosis.js
 * Dedicated Light Mode Plant Health Doctor & Diagnosis Page.
 */
import { diagnoseProblem } from '../../logic/diagnose.js';
import { getNavbarHtml } from './navbar.js';
import { getSavedPlants, toggleAppTheme } from '../render.js';
import { renderAddPlantModal } from './add-plant-form.js';
import { clearToken } from '../../api/client.js';
import { clearCache } from '../../state/store.js';

export function renderLightDiagnosis(container, { onUpdate = () => {} } = {}) {
  const userPlants = getSavedPlants();
  let selectedPlantId = userPlants[0]?.id || '1';
  let selectedSymptoms = ['yellow_leaves', 'mushy_stem'];
  let diagnosisResult = null;
  let isRunning = false;

  const symptomOptions = [
    { key: 'yellow_leaves', label: 'Yellowing Leaves' },
    { key: 'mushy_stem', label: 'Soft / Mushy Stems' },
    { key: 'brown_tips', label: 'Brown Crispy Tips' },
    { key: 'drooping', label: 'Drooping Foliage' },
    { key: 'spots', label: 'Dark Spots' },
    { key: 'pests_visible', label: 'Visible Pests / Webbing' }
  ];

  async function runDiagnosisCalculation() {
    isRunning = true;
    const currentPlant = userPlants.find(p => p.id === selectedPlantId) || userPlants[0];
    try {
      diagnosisResult = await diagnoseProblem({
        plant_id: selectedPlantId,
        symptoms: selectedSymptoms
      });
    } catch {
      // Offline fallback calculation
      const isOverwatered = (currentPlant?.days_since_watered || 0) < (currentPlant?.water_frequency_days || 7) * 0.7;
      diagnosisResult = {
        top_diagnosis: {
          condition: isOverwatered ? 'Overwatering & Early Root Rot' : 'Underwatering & Dehydration',
          confidence: isOverwatered ? 92 : 85,
          evidence: isOverwatered 
            ? `Watered every ${currentPlant?.days_since_watered || 4} days vs 10-day recommended schedule for ${currentPlant?.name || 'Monstera'} in a pot without drainage.`
            : `Last watered ${currentPlant?.days_since_watered || 12} days ago (schedule recommends every ${currentPlant?.water_frequency_days || 7} days).`,
          suggested_fix: isOverwatered
            ? 'Hold watering for 12–14 days until top 2 inches dry. Inspect root ball and trim any black mushy roots. Repot into well-draining soil in a pot with drainage holes.'
            : 'Give the plant a deep, thorough soak until water runs through. Resume regular cadence.'
        },
        differential_diagnoses: [
          { condition: 'Insufficient Light Exposure', confidence: 42 },
          { condition: 'Natural Lower Leaf Shedding', confidence: 18 }
        ]
      };
    }
    isRunning = false;
  }

  // Initial calculation
  runDiagnosisCalculation();

  function renderPage() {
    if (userPlants.length === 0) {
      container.innerHTML = `
        <div class="fixed inset-0 z-[-1] pointer-events-none">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg');"></div>
        </div>
        ${getNavbarHtml({ activeRoute: 'diagnose', theme: 'light' })}
        <main class="container mx-auto px-6 pt-[140px] pb-12 max-w-xl text-center">
          <div class="p-12 rounded-[28px] border shadow-sm" style="background-color: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border-color: rgba(255, 255, 255, 0.85);">
            <span class="material-symbols-outlined text-5xl mb-4 text-[#154212]">stethoscope</span>
            <h2 class="text-2xl font-bold text-[#1B3022] mb-2" style="font-family: 'Plus Jakarta Sans', sans-serif;">Your Garden is Empty</h2>
            <p class="text-sm text-[#556353] mb-6">Add a plant to your garden first to run history-aware health checks and root rot evaluations.</p>
            <button id="diag-empty-add-btn" class="bg-[#154212] text-white px-6 py-3 rounded-full font-semibold text-xs hover:bg-[#1B3022] transition shadow-sm inline-flex items-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined text-sm">add</span> Add Your First Plant
            </button>
          </div>
        </main>
      `;

      container.querySelector('#diag-empty-add-btn')?.addEventListener('click', () => {
        renderAddPlantModal(container, { onSuccess: () => onUpdate() });
      });
      container.querySelector('#global-add-plant-btn')?.addEventListener('click', () => {
        renderAddPlantModal(container, { onSuccess: () => onUpdate() });
      });
      container.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
        toggleAppTheme();
        onUpdate();
      });
      container.querySelector('#global-logout-btn')?.addEventListener('click', () => {
        clearToken();
        clearCache();
        window.location.hash = '';
        onUpdate();
      });
      return;
    }

    const currentPlant = userPlants.find(p => p.id === selectedPlantId) || userPlants[0];
    const topDiag = diagnosisResult?.top_diagnosis || {
      condition: 'Overwatering & Early Root Rot',
      confidence: 92,
      evidence: `Watered every ${currentPlant.days_since_watered || 2} days vs 10-day recommended schedule for ${currentPlant.name} in a pot ${currentPlant.pot_has_drainage ? 'with' : 'without'} drainage.`,
      suggested_fix: 'Hold watering for 12–14 days until top 2 inches dry. Inspect root ball and trim any black mushy roots. Repot into well-draining soil in a pot with drainage holes.'
    };

    const diffDiags = diagnosisResult?.differential_diagnoses || [
      { condition: 'Insufficient Light Exposure', confidence: 42 },
      { condition: 'Natural Lower Leaf Shedding', confidence: 18 }
    ];

    const fixSteps = typeof topDiag.suggested_fix === 'string'
      ? topDiag.suggested_fix.split(/\.\s+/).filter(Boolean).map(s => s.endsWith('.') ? s : s + '.')
      : ['Hold watering until top 2 inches dry.', 'Inspect roots for rot.', 'Resume regular cadence.'];

    container.innerHTML = `
      <!-- Fixed Summer Vibes Background Layer -->
      <div class="fixed inset-0 z-[-1] pointer-events-none">
        <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/summer-vibes-bg.jpg');"></div>
      </div>

      <!-- Floating Navbar -->
      ${getNavbarHtml({ activeRoute: 'diagnose', theme: 'light' })}

      <!-- Main Content Container -->
      <main class="container mx-auto px-6 pt-[120px] pb-12 max-w-7xl">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <!-- Left Column: Diagnostic Inputs (7 cols) -->
          <div class="md:col-span-7 space-y-6 text-[#1B3022]">
            <div class="space-y-1">
              <h1 class="font-bold text-[32px] leading-tight text-[#1B3022]" style="font-family: 'Plus Jakarta Sans', sans-serif;">Plant Health Doctor</h1>
              <p class="text-sm text-[#556353] font-medium">Cross-referencing observed symptoms with actual watering history and pot drainage.</p>
            </div>

            <!-- Patient Selection Card -->
            <div class="p-6 rounded-[24px]" style="background-color: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 4px 24px rgba(27, 48, 34, 0.08);">
              <div class="text-[11px] font-bold tracking-wider text-[#556353] mb-4 uppercase">Select Plant</div>
              <div class="flex items-center gap-4 mb-5">
                <div class="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/80 shadow-sm">
                  <img alt="${currentPlant?.name}" class="w-full h-full object-cover" src="${currentPlant?.image_url}" />
                </div>
                <div class="flex-1">
                  <select id="diag-plant-select" class="font-bold text-[19px] text-[#1B3022] bg-transparent border-0 focus:ring-0 cursor-pointer outline-none p-0 pr-6" style="font-family: 'Plus Jakarta Sans', sans-serif;">
                    ${userPlants.map(p => `
                      <option value="${p.id}" ${p.id === selectedPlantId ? 'selected' : ''}>${p.name}</option>
                    `).join('')}
                  </select>
                  <p class="text-xs text-[#556353] mt-0.5 font-medium">${currentPlant?.species || 'Houseplant'} · ${currentPlant?.location === 'outdoor' ? 'Outdoor Bed' : 'Indoor'}</p>
                </div>
              </div>

              <!-- Telemetry Soft Capsule Chips (Matching Schedule View) -->
              <div class="flex flex-wrap gap-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/70 border border-black/5 text-xs text-[#1B3022] font-medium shadow-xs">
                  Last Watered: ${currentPlant.days_since_watered ?? 2}d ago
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/70 border border-black/5 text-xs text-[#1B3022] font-medium shadow-xs">
                  Interval: Every ${currentPlant.water_frequency_days || 7}d
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/70 border border-black/5 text-xs text-[#1B3022] font-medium shadow-xs">
                  Recommended: Every 10d
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/70 border border-black/5 text-xs text-[#1B3022] font-medium shadow-xs">
                  Pot: ${currentPlant.pot_has_drainage === false ? 'No Drainage' : 'Has Drainage'}
                </span>
              </div>
            </div>

            <!-- Observed Symptoms Grid -->
            <div>
              <h3 class="text-[17px] font-bold text-[#1B3022] mb-3" style="font-family: 'Plus Jakarta Sans', sans-serif;">Observed Symptoms</h3>
              <div class="grid grid-cols-2 gap-3">
                ${symptomOptions.map(opt => {
                  const isChecked = selectedSymptoms.includes(opt.key);
                  return `
                    <button class="symptom-chip-btn p-3.5 text-left rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${isChecked 
                      ? 'border border-[#1B3022] bg-white/80 shadow-xs' 
                      : 'border border-black/5 bg-white/40 hover:bg-white/60'}" 
                      style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);"
                      data-key="${opt.key}">
                      <div class="text-[#1B3022] flex shrink-0">
                        <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' ${isChecked ? 1 : 0};">${isChecked ? 'check_circle' : 'radio_button_unchecked'}</span>
                      </div>
                      <div class="text-sm ${isChecked ? 'font-bold' : 'font-medium'} text-[#1B3022]">${opt.label}</div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Run Diagnosis CTA Button -->
            <button id="run-diagnosis-btn" class="w-full bg-[#154212] text-white font-semibold py-3.5 rounded-full hover:bg-[#1B3022] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm">
              Run Diagnosis <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          <!-- Right Column: Results & Diagnosis (5 cols) -->
          <div class="md:col-span-5 space-y-6 text-[#1B3022]">
            
            <!-- Primary Diagnosis Card (Exact Stitch Reference) -->
            <div class="p-6 rounded-[24px]" style="background-color: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 4px 24px rgba(27, 48, 34, 0.08);">
              
              <!-- Calm Earthy Botanical Badge (Anti-Neon / Soothing Glass) -->
              <div class="inline-block text-xs font-medium px-3.5 py-1 rounded-full mb-4 tracking-wider uppercase font-label-caps" style="background: rgba(27, 48, 34, 0.06); color: #1B3022; border: 1px solid rgba(27, 48, 34, 0.1);">
                PRIMARY MATCH · ${topDiag.confidence || 92}% MATCH
              </div>

              <h3 class="text-[20px] font-bold text-[#1B3022] mb-6" style="font-family: 'Plus Jakarta Sans', sans-serif;">${topDiag.condition}</h3>
              
              <div class="bg-white/50 rounded-xl p-4 mb-8 border border-white/80 shadow-sm">
                <p class="text-[14px] text-[#1B3022]/90 leading-relaxed font-medium">
                  ${topDiag.evidence}
                </p>
              </div>

              <div class="space-y-6">
                ${fixSteps.map((step, idx) => `
                  <div class="flex gap-4 items-start">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#1B3022]/10 border border-[#1B3022]/20 text-[#1B3022] flex items-center justify-center font-bold text-sm">${idx + 1}</div>
                    <div class="text-[15px] font-bold text-[#1B3022] pt-1 leading-snug">${step}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Secondary Matches Card -->
            <div class="p-5 rounded-[24px]" style="background-color: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.85); box-shadow: 0 4px 24px rgba(27, 48, 34, 0.08);">
              <div class="space-y-3">
                <div class="flex justify-between items-center pb-2.5 border-b border-black/5">
                  <span class="text-xs font-semibold text-[#1B3022]">Insufficient Light Exposure</span>
                  <span class="text-xs font-medium text-[#556353] bg-white/70 px-2.5 py-0.5 rounded-full border border-black/5">42% match</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs font-semibold text-[#1B3022]">Natural Lower Leaf Shedding</span>
                  <span class="text-xs font-medium text-[#556353] bg-white/70 px-2.5 py-0.5 rounded-full border border-black/5">18% match</span>
                </div>
              </div>
            </div>

            <p class="text-[11px] text-[#556353] text-center max-w-sm mx-auto font-medium leading-relaxed">
              Guidance for common plant care issues — consult a nursery for severe agricultural diseases.
            </p>
          </div>

        </div>
      </main>
    `;

    // Dropdown change listener
    container.querySelector('#diag-plant-select')?.addEventListener('change', async (e) => {
      selectedPlantId = e.target.value;
      await runDiagnosisCalculation();
      renderPage();
    });

    // Symptoms multi-select listener
    container.querySelectorAll('.symptom-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        if (selectedSymptoms.includes(key)) {
          if (selectedSymptoms.length > 1) {
            selectedSymptoms = selectedSymptoms.filter(k => k !== key);
          }
        } else {
          selectedSymptoms.push(key);
        }
        renderPage();
      });
    });

    // Run Diagnosis CTA
    container.querySelector('#run-diagnosis-btn')?.addEventListener('click', async () => {
      await runDiagnosisCalculation();
      renderPage();
    });

    // Global Navbar Actions
    container.querySelector('#global-theme-toggle-btn')?.addEventListener('click', () => {
      toggleAppTheme();
      onUpdate();
    });

    container.querySelector('#global-add-plant-btn')?.addEventListener('click', () => {
      renderAddPlantModal(container, {
        onSuccess: () => onUpdate()
      });
    });

    container.querySelector('#global-signout-btn')?.addEventListener('click', () => {
      clearToken();
      clearCache();
      window.location.hash = '';
      onUpdate();
    });
  }

  renderPage();
}
