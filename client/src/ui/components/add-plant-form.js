/**
 * client/src/ui/components/add-plant-form.js
 * Botanical Ether Add Plant Modal with custom dropdowns & 53-species autocomplete.
 */
import plantsDb from '../../data/plants-db.json';
import { addPlant } from '../../logic/plants.js';
import { getAppTheme } from '../render.js';

export function renderAddPlantModal(container, { onClose = () => {}, onSuccess = () => {} } = {}) {
  const existing = document.getElementById('add-plant-modal-overlay');
  if (existing) existing.remove();

  const theme = getAppTheme();
  const isDark = theme === 'dark';

  const speciesList = Object.entries(plantsDb).map(([key, data]) => ({
    key,
    name: data.common_name,
    scientific: data.scientific_name || key,
    aliases: data.aliases || [],
    type: data.type || 'indoor',
    water_freq: data.water_frequency_days || 7
  }));

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'add-plant-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999;
    background: ${isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(27, 48, 34, 0.45)'};
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  const cardGlass = isDark
    ? `background: rgba(18, 24, 20, 0.9); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); color: #FFFFFF;`
    : `background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 20px 50px rgba(27, 48, 34, 0.15); color: #1B3022;`;

  const textColor = isDark ? '#FFFFFF' : '#1B3022';
  const subtextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : '#556353';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(27, 48, 34, 0.15)';
  const menuBg = isDark ? 'rgba(20, 28, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  const btnBg = isDark ? '#154212' : '#1B3022';

  modalOverlay.innerHTML = `
    <div class="glass-panel" style="width: 100%; max-width: 520px; padding: 28px; border-radius: 28px; position: relative; ${cardGlass}">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(27,48,34,0.1)'}; padding-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 12px; background: ${isDark ? 'rgba(188, 240, 174, 0.15)' : 'rgba(21, 66, 18, 0.1)'}; display: flex; align-items: center; justify-content: center; color: ${isDark ? '#bcf0ae' : '#154212'};">
            <span class="material-symbols-outlined" style="font-size: 22px;">potted_plant</span>
          </div>
          <div>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0;">Add Plant to Garden</h3>
            <p style="font-size: 12px; color: ${subtextColor}; margin: 2px 0 0 0;">Automatic care schedule & botanical profile</p>
          </div>
        </div>
        <button id="close-modal-btn" style="background: none; border: none; color: ${textColor}; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
      </div>

      <div id="modal-error" class="error-alert" style="display: none; padding: 10px 14px; border-radius: 12px; font-size: 12px; margin-bottom: 14px; background: rgba(186, 26, 26, 0.15); border: 1px solid rgba(186, 26, 26, 0.35); color: ${isDark ? '#ffb4ab' : '#ba1a1a'};"></div>

      <form id="modal-add-plant-form" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Nickname -->
        <div>
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${subtextColor}; margin-bottom: 6px; display: block;">Plant Nickname</label>
          <input id="plant-nickname" type="text" required placeholder="e.g. Kitchen Fern" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 14px; outline: none;" />
        </div>

        <!-- Autocomplete Species -->
        <div style="position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${subtextColor}; display: block; margin: 0;">Species</label>
            <span id="species-match-badge" style="font-size: 11px; font-weight: 600; color: #10B981; display: none;">✓ Matched</span>
          </div>
          <input id="plant-species-input" type="text" required placeholder="Type species (e.g. monstera, pothos, basil)" autocomplete="off" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 14px; outline: none;" />
          <div id="species-suggestions" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 16px; max-height: 190px; overflow-y: auto; display: none; box-shadow: 0 16px 40px rgba(0,0,0,0.25);"></div>
        </div>

        <!-- Custom Dropdowns: Location & Light -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Location Dropdown -->
          <div style="position: relative;">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${subtextColor}; margin-bottom: 6px; display: block;">Location</label>
            <input type="hidden" id="plant-location-value" value="indoor" />
            <div id="custom-location-trigger" tabindex="0" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
              <span id="custom-location-text">Indoor</span>
              <span class="material-symbols-outlined" style="font-size: 18px; color: ${subtextColor};">expand_more</span>
            </div>
            <div id="custom-location-menu" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 40; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 14px; padding: 4px; display: none; box-shadow: 0 12px 30px rgba(0,0,0,0.25);">
              <div class="custom-dropdown-item" data-value="indoor" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer;">
                🏡 Indoor
              </div>
              <div class="custom-dropdown-item" data-value="outdoor" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer;">
                🌿 Outdoor Bed
              </div>
            </div>
          </div>

          <!-- Light Exposure Dropdown -->
          <div style="position: relative;">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${subtextColor}; margin-bottom: 6px; display: block;">Light Exposure</label>
            <input type="hidden" id="plant-light-value" value="bright_indirect" />
            <div id="custom-light-trigger" tabindex="0" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
              <span id="custom-light-text">Bright Indirect</span>
              <span class="material-symbols-outlined" style="font-size: 18px; color: ${subtextColor};">expand_more</span>
            </div>
            <div id="custom-light-menu" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 40; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 14px; padding: 4px; display: none; box-shadow: 0 12px 30px rgba(0,0,0,0.25);">
              <div class="custom-dropdown-item" data-value="bright_indirect" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer;">
                ⛅ Bright Indirect
              </div>
              <div class="custom-dropdown-item" data-value="medium" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer;">
                🌤️ Medium Light
              </div>
              <div class="custom-dropdown-item" data-value="low" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer;">
                ☁️ Low Light
              </div>
              <div class="custom-dropdown-item" data-value="direct" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer;">
                ☀️ Direct Sun
              </div>
            </div>
          </div>
        </div>

        <!-- Drainage Toggle -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 14px; background: ${inputBg}; border: 1px solid ${inputBorder};">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="material-symbols-outlined" style="font-size: 20px; color: #10B981;">water</span>
            <div>
              <span style="font-size: 13px; font-weight: 600; color: ${textColor}; display: block;">Pot Has Drainage Holes</span>
              <span style="font-size: 11px; color: ${subtextColor};">Used for watering & diagnosis evaluation</span>
            </div>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px; margin: 0; cursor: pointer;">
            <input type="checkbox" id="plant-drainage" checked style="opacity: 0; width: 0; height: 0;" />
            <span id="drainage-toggle-slider" style="position: absolute; cursor: pointer; inset: 0; background-color: #10B981; border-radius: 24px; transition: 0.2s;"></span>
            <span id="drainage-toggle-knob" style="position: absolute; height: 18px; width: 18px; left: 22px; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
          </label>
        </div>

        <!-- Submit Button -->
        <button type="submit" id="add-plant-submit-btn" style="margin-top: 4px; width: 100%; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 700; background: ${btnBg}; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 18px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span class="material-symbols-outlined" style="font-size: 18px;">add_circle</span>
          <span>Add to Garden</span>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const closeBtn = modalOverlay.querySelector('#close-modal-btn');
  const form = modalOverlay.querySelector('#modal-add-plant-form');
  const speciesInput = modalOverlay.querySelector('#plant-species-input');
  const suggestionsBox = modalOverlay.querySelector('#species-suggestions');
  const matchBadge = modalOverlay.querySelector('#species-match-badge');
  const errorBox = modalOverlay.querySelector('#modal-error');
  const drainageCheckbox = modalOverlay.querySelector('#plant-drainage');
  const toggleSlider = modalOverlay.querySelector('#drainage-toggle-slider');
  const toggleKnob = modalOverlay.querySelector('#drainage-toggle-knob');

  drainageCheckbox?.addEventListener('change', (e) => {
    if (e.target.checked) {
      toggleSlider.style.backgroundColor = '#10B981';
      toggleKnob.style.left = '22px';
    } else {
      toggleSlider.style.backgroundColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      toggleKnob.style.left = '4px';
    }
  });

  // Custom Dropdown logic: Location
  const locTrigger = modalOverlay.querySelector('#custom-location-trigger');
  const locMenu = modalOverlay.querySelector('#custom-location-menu');
  const locValue = modalOverlay.querySelector('#plant-location-value');
  const locText = modalOverlay.querySelector('#custom-location-text');

  locTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = locMenu.style.display === 'block';
    lightMenu.style.display = 'none';
    suggestionsBox.style.display = 'none';
    locMenu.style.display = isShown ? 'none' : 'block';
  });

  locMenu?.querySelectorAll('.custom-dropdown-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(27,48,34,0.08)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-value');
      locValue.value = val;
      locText.textContent = item.textContent.trim().replace(/^[\p{Emoji}\s]+/u, '');
      locMenu.style.display = 'none';
    });
  });

  // Custom Dropdown logic: Light
  const lightTrigger = modalOverlay.querySelector('#custom-light-trigger');
  const lightMenu = modalOverlay.querySelector('#custom-light-menu');
  const lightValue = modalOverlay.querySelector('#plant-light-value');
  const lightText = modalOverlay.querySelector('#custom-light-text');

  lightTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = lightMenu.style.display === 'block';
    locMenu.style.display = 'none';
    suggestionsBox.style.display = 'none';
    lightMenu.style.display = isShown ? 'none' : 'block';
  });

  lightMenu?.querySelectorAll('.custom-dropdown-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(27,48,34,0.08)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-value');
      lightValue.value = val;
      lightText.textContent = item.textContent.trim().replace(/^[\p{Emoji}\s]+/u, '');
      lightMenu.style.display = 'none';
    });
  });

  modalOverlay.addEventListener('click', () => {
    if (locMenu) locMenu.style.display = 'none';
    if (lightMenu) lightMenu.style.display = 'none';
    if (suggestionsBox) suggestionsBox.style.display = 'none';
  });

  function cleanup() {
    modalOverlay.remove();
    onClose();
  }

  closeBtn?.addEventListener('click', cleanup);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cleanup();
  });

  // Autocomplete
  speciesInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q || q.length < 1) {
      suggestionsBox.style.display = 'none';
      if (matchBadge) matchBadge.style.display = 'none';
      return;
    }

    const matches = speciesList.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.key.toLowerCase().includes(q) ||
      s.scientific.toLowerCase().includes(q) ||
      s.aliases.some(a => a.toLowerCase().includes(q))
    ).slice(0, 6);

    if (matches.length === 0) {
      suggestionsBox.style.display = 'none';
      if (matchBadge) matchBadge.style.display = 'none';
      return;
    }

    suggestionsBox.innerHTML = matches.map(m => `
      <div class="species-item" data-key="${m.key}" data-name="${m.name}" data-type="${m.type}" style="padding: 10px 14px; font-size: 13px; color: ${textColor}; cursor: pointer; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,48,34,0.06)'}; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: ${isDark ? '#bcf0ae' : '#154212'};">${m.name}</strong>
          <span style="font-size: 11px; color: ${subtextColor}; margin-left: 4px;">(${m.scientific})</span>
        </div>
        <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}; color: ${subtextColor};">
          ${m.type === 'outdoor' ? 'Outdoor' : 'Indoor'} · ${m.water_freq}d
        </span>
      </div>
    `).join('');

    suggestionsBox.querySelectorAll('.species-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(27,48,34,0.08)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
      });
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const selectedName = item.getAttribute('data-name');
        const autoType = item.getAttribute('data-type');

        speciesInput.value = selectedName;
        suggestionsBox.style.display = 'none';
        if (matchBadge) matchBadge.style.display = 'inline-block';

        if (autoType === 'outdoor') {
          locValue.value = 'outdoor';
          locText.textContent = 'Outdoor Bed';
        } else {
          locValue.value = 'indoor';
          locText.textContent = 'Indoor';
        }
      });
    });

    suggestionsBox.style.display = 'block';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = modalOverlay.querySelector('#add-plant-submit-btn');
    const name = modalOverlay.querySelector('#plant-nickname').value.trim();
    const species = speciesInput.value.trim();
    const location = locValue.value || 'indoor';
    const light_exposure = lightValue.value || 'bright_indirect';
    const pot_has_drainage = drainageCheckbox.checked;

    if (!name || !species) return;

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
      await addPlant({
        name,
        species,
        location,
        light_exposure,
        pot_has_drainage
      });
      onSuccess();
      cleanup();
    } catch (err) {
      errorBox.textContent = err.message || 'Failed to add plant. Please try again.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });
}
