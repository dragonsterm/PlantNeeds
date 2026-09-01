/**
 * client/src/ui/components/add-plant-form.js
 * Add Plant Modal with 53-species live autocomplete dropdown.
 */
import plantsDb from '../../data/plants-db.json';
import { addPlant } from '../../logic/plants.js';

export function renderAddPlantModal(container, { onClose = () => {} } = {}) {
  const speciesList = Object.entries(plantsDb).map(([key, data]) => ({
    key,
    name: data.common_name,
    aliases: data.aliases || [],
    type: data.type || 'indoor'
  }));

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'add-plant-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  modalOverlay.innerHTML = `
    <div class="glass-panel" style="width: 100%; max-width: 520px; padding: 32px; border-radius: 24px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #FFFFFF;">Add Plant to Garden</h3>
        <button id="close-modal-btn" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
      </div>

      <div id="modal-error" class="error-alert" style="display: none;"></div>

      <form id="modal-add-plant-form" class="form-stack" style="gap: 16px;">
        <div>
          <label class="form-label" style="color: #fff; margin-bottom: 6px; display: block;">Plant Nickname</label>
          <input id="plant-nickname" class="glass-input" type="text" required placeholder="e.g. Kitchen Fern" />
        </div>

        <div style="position: relative;">
          <label class="form-label" style="color: #fff; margin-bottom: 6px; display: block;">Species (Autocomplete)</label>
          <input id="plant-species-input" class="glass-input" type="text" required placeholder="Type species (e.g. monstera, pothos, basil)" autocomplete="off" />
          <div id="species-suggestions" style="position: absolute; top: 100%; left: 0; right: 0; z-index: 10; background: rgba(20, 30, 20, 0.95); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; margin-top: 4px; max-height: 180px; overflow-y: auto; display: none;"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="color: #fff; margin-bottom: 6px; display: block;">Location</label>
            <select id="plant-location" class="glass-input" style="padding-left: 14px;">
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor Bed</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="color: #fff; margin-bottom: 6px; display: block;">Light Exposure</label>
            <select id="plant-light" class="glass-input" style="padding-left: 14px;">
              <option value="bright_indirect">Bright Indirect</option>
              <option value="medium">Medium</option>
              <option value="low">Low Light</option>
              <option value="direct">Direct Sun</option>
            </select>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0;">
          <span style="font-size: 13px; color: var(--sage-soft, #E1E8E0);">Pot Has Drainage Holes</span>
          <input id="plant-drainage" class="custom-checkbox" type="checkbox" checked />
        </div>

        <button type="submit" class="btn-primary-stitch" style="margin-top: 8px; padding: 14px;">
          Add to Garden
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const closeBtn = modalOverlay.querySelector('#close-modal-btn');
  const form = modalOverlay.querySelector('#modal-add-plant-form');
  const speciesInput = modalOverlay.querySelector('#plant-species-input');
  const suggestionsBox = modalOverlay.querySelector('#species-suggestions');
  const errorBox = modalOverlay.querySelector('#modal-error');

  function cleanup() {
    modalOverlay.remove();
    onClose();
  }

  closeBtn?.addEventListener('click', cleanup);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cleanup();
  });

  // Autocomplete logic
  speciesInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q || q.length < 1) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const matches = speciesList.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.key.toLowerCase().includes(q) ||
      s.aliases.some(a => a.toLowerCase().includes(q))
    ).slice(0, 6);

    if (matches.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    suggestionsBox.innerHTML = matches.map(m => `
      <div class="species-item" data-key="${m.key}" data-name="${m.name}" style="padding: 10px 14px; font-size: 13px; color: #fff; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <strong style="color: #A3D94E;">${m.name}</strong> <span style="font-size: 11px; color: #aaa;">(${m.key})</span>
      </div>
    `).join('');

    suggestionsBox.style.display = 'block';

    suggestionsBox.querySelectorAll('.species-item').forEach(item => {
      item.addEventListener('click', () => {
        speciesInput.value = item.getAttribute('data-name');
        speciesInput.setAttribute('data-selected-key', item.getAttribute('data-key'));
        suggestionsBox.style.display = 'none';
      });
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = modalOverlay.querySelector('#plant-nickname').value.trim();
    const species = speciesInput.value.trim();
    const location = modalOverlay.querySelector('#plant-location').value;
    const light_exposure = modalOverlay.querySelector('#plant-light').value;
    const pot_has_drainage = modalOverlay.querySelector('#plant-drainage').checked;

    if (!name || !species) return;

    try {
      await addPlant({
        name,
        species,
        location,
        light_exposure,
        pot_has_drainage
      });
      cleanup();
    } catch (err) {
      errorBox.textContent = err.message || 'Failed to add plant. Backend endpoint ready Day 4.';
      errorBox.style.display = 'block';
    }
  });
}
