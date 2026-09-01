/**
 * client/src/ui/components/diagnosis-panel.js
 * Diagnosis Panel modal / view for symptom selection and ranked results.
 * Complies with Botanical Ether Glassmorphism (DESIGN.md / ADR-012).
 */
import { listPlants } from '../../logic/plants.js';
import { diagnoseProblem } from '../../logic/diagnose.js';
import { emit } from '../../state/store.js';

const SYMPTOMS_LIST = [
  { id: 'yellow_leaves', label: 'Yellow Leaves', desc: 'Foliage turning pale or yellowing' },
  { id: 'brown_tips', label: 'Brown Tips', desc: 'Crispy or dark edges and leaf tips' },
  { id: 'drooping', label: 'Drooping', desc: 'Stems and leaves losing rigidity' },
  { id: 'spots', label: 'Spots on Foliage', desc: 'Brown, black, or tan spots on leaves' },
  { id: 'wilting', label: 'Wilting', desc: 'Severe limpness and collapse' },
  { id: 'pests_visible', label: 'Visible Pests', desc: 'Insects, webbing, or cottony residue' },
  { id: 'slow_growth', label: 'Stunted / Slow Growth', desc: 'No new shoots or undersized leaves' },
  { id: 'leaf_drop', label: 'Leaf Drop', desc: 'Premature shedding of foliage' },
  { id: 'mushy_stem', label: 'Mushy Stem / Base', desc: 'Soft, waterlogged base or stems' }
];

export async function renderDiagnosisModal(onClose = () => {}) {
  const existing = document.getElementById('diagnosis-modal');
  if (existing) existing.remove();

  let plants = [];
  try {
    plants = await listPlants();
  } catch {
    plants = [];
  }

  const modal = document.createElement('div');
  modal.id = 'diagnosis-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300';
  
  modal.innerHTML = `
    <div class="glass-panel rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative shadow-2xl border border-white/20" style="background: rgba(27, 48, 34, 0.85); backdrop-filter: blur(25px); color: #F9FAF2;">
      <!-- Close Button -->
      <button id="close-diag-modal" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer border-none">
        <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
      </button>

      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner" style="background: var(--primary-container, #2D5A27);">
          <span class="material-symbols-outlined" style="font-size: 26px;">stethoscope</span>
        </div>
        <div>
          <h2 class="text-xl font-bold font-headline-lg tracking-tight" style="color: #FFFFFF; margin: 0;">Plant Health Diagnosis</h2>
          <p class="text-xs text-sage-soft mt-1" style="color: #E1E8E0; margin: 0;">Cross-references observed symptoms with actual watering and care history</p>
        </div>
      </div>

      <!-- Step 1: Select Plant -->
      <div class="mb-6">
        <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: #A1D494;">1. Select Affected Plant</label>
        <select id="diag-plant-select" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary-fixed text-sm">
          ${plants.length > 0
            ? plants.map(p => `<option value="${p.id}" class="bg-forest-deep text-white">${p.name} (${p.species})</option>`).join('')
            : '<option value="" disabled selected class="bg-forest-deep text-white">No plants found — please add a plant first</option>'
          }
        </select>
      </div>

      <!-- Step 2: Select Symptoms -->
      <div class="mb-6">
        <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: #A1D494;">2. Observed Symptoms (Multi-select)</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
          ${SYMPTOMS_LIST.map(s => `
            <label class="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors">
              <input type="checkbox" name="diag-symptom" value="${s.id}" class="mt-0.5 rounded text-primary focus:ring-0 accent-primary-fixed" />
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-white">${s.label}</span>
                <span class="text-[10px] text-sage-soft/70" style="color: #B5C4B4;">${s.desc}</span>
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Submit Action -->
      <button id="run-diagnosis-btn" class="w-full py-3.5 px-6 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-none" style="background: var(--primary-fixed, #A1D494); color: #1B3022;">
        <span class="material-symbols-outlined" style="font-size: 18px;">analytics</span>
        Run History-Aware Diagnosis
      </button>

      <!-- Step 3: Diagnosis Results Container -->
      <div id="diag-results-container" class="mt-6 hidden"></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-diag-modal').addEventListener('click', () => {
    modal.remove();
    onClose();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      onClose();
    }
  });

  const runBtn = modal.querySelector('#run-diagnosis-btn');
  const resultsContainer = modal.querySelector('#diag-results-container');

  runBtn.addEventListener('click', async () => {
    const plantSelect = modal.querySelector('#diag-plant-select');
    const plantId = plantSelect.value;
    const selectedCheckboxes = modal.querySelectorAll('input[name="diag-symptom"]:checked');
    const symptoms = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!plantId) {
      alert('Please select a plant to diagnose.');
      return;
    }
    if (symptoms.length === 0) {
      alert('Please select at least one observed symptom.');
      return;
    }

    runBtn.disabled = true;
    runBtn.innerHTML = `
      <span class="material-symbols-outlined animate-spin" style="font-size: 18px;">progress_activity</span>
      Analyzing Care History & Symptoms...
    `;

    try {
      const result = await diagnoseProblem({ plant_id: plantId, symptoms });
      resultsContainer.classList.remove('hidden');
      
      resultsContainer.innerHTML = `
        <div class="border-t border-white/20 pt-5 mt-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-primary-fixed" style="color: #A1D494;">Ranked Causes & Evidence</h3>
            <span class="text-xs text-white/60">${result.diagnosis?.length || 0} candidate(s) evaluated</span>
          </div>

          <div class="space-y-4">
            ${(result.diagnosis || []).map((diag, index) => {
              const pct = Math.round(diag.likelihood * 100);
              const badgeColor = pct >= 70 ? 'bg-status-warning text-black font-bold' : 'bg-primary-fixed/20 text-primary-fixed';
              return `
                <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">${index + 1}</span>
                      <h4 class="font-bold text-white text-sm m-0">${diag.cause}</h4>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-sage-soft">${diag.category}</span>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-full ${badgeColor}">${pct}% Confidence</span>
                  </div>

                  <!-- Evidence Bullet Points -->
                  <div class="my-2.5 pl-2 border-l-2 border-primary-fixed/40">
                    <p class="text-[11px] font-semibold uppercase text-sage-soft/80 mb-1" style="color: #B5C4B4;">Evidence from Care History:</p>
                    <ul class="text-xs text-white/90 space-y-1 list-disc pl-4 m-0">
                      ${diag.evidence.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                  </div>

                  <!-- Suggested Action -->
                  <div class="mt-3 p-2.5 rounded-xl bg-forest-deep/60 border border-white/10 text-xs">
                    <strong class="text-primary-fixed block mb-1" style="color: #A1D494;">Suggested Remedy:</strong>
                    <span class="text-white/90">${diag.suggested_fix}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Disclaimer -->
          <p class="text-[10px] text-sage-soft/60 italic text-center mt-4 border-t border-white/10 pt-3" style="color: #9AA899;">
            ${result.disclaimer || "Guidance for common issues — consult a local nursery or extension service for serious or spreading problems."}
          </p>
        </div>
      `;

      emit('diagnosis-completed', result);
    } catch (err) {
      resultsContainer.classList.remove('hidden');
      resultsContainer.innerHTML = `
        <div class="p-4 rounded-xl bg-status-danger/20 border border-status-danger/40 text-xs text-status-danger">
          Failed to run diagnosis: ${err.message || 'Server error'}
        </div>
      `;
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 18px;">analytics</span>
        Run History-Aware Diagnosis
      `;
    }
  });
}
