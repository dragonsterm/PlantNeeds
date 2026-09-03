/**
 * client/src/ui/components/add-plant-form.js
 * Botanical Ether Add Plant Modal with high-fidelity glass styling,
 * robust accessible custom dropdowns, and 53-species botanical autocomplete.
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
    ? `background: rgba(18, 26, 20, 0.92); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65); color: #FFFFFF;`
    : `background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); border: 1px solid rgba(255, 255, 255, 0.95); box-shadow: 0 24px 60px rgba(27, 48, 34, 0.16); color: #1B3022;`;

  const textColor = isDark ? '#FFFFFF' : '#1B3022';
  const labelColor = isDark ? '#E1E8E0' : '#42493E';
  const subtextColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#556353';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.035)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(27, 48, 34, 0.15)';
  const menuBg = isDark ? 'rgba(22, 32, 25, 0.98)' : '#FFFFFF';
  const itemHover = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(21, 66, 18, 0.08)';
  const activePillBg = isDark ? 'rgba(188, 240, 174, 0.2)' : 'rgba(21, 66, 18, 0.1)';
  const activePillText = isDark ? '#bcf0ae' : '#154212';
  const btnBg = isDark ? '#154212' : '#1B3022';

  modalOverlay.innerHTML = `
    <div class="glass-panel" style="width: 100%; max-width: 540px; padding: 28px sm:32px; border-radius: 28px; position: relative; ${cardGlass}">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(27,48,34,0.1)'}; padding-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 42px; height: 42px; border-radius: 14px; background: ${activePillBg}; border: 1px solid ${isDark ? 'rgba(188,240,174,0.3)' : 'rgba(21,66,18,0.2)'}; display: flex; align-items: center; justify-content: center; color: ${activePillText}; shrink-0;">
            <span class="material-symbols-outlined" style="font-size: 24px;">potted_plant</span>
          </div>
          <div>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0; line-height: 1.3;">Add Plant to Garden</h3>
            <p style="font-size: 13px; color: ${subtextColor}; margin: 3px 0 0 0;">Automatic care schedule & botanical profile</p>
          </div>
        </div>
        <button id="close-modal-btn" aria-label="Close modal" style="background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: ${textColor}; cursor: pointer; transition: all 0.2s;">
          <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
        </button>
      </div>

      <div id="modal-error" class="error-alert" style="display: none; padding: 12px 16px; border-radius: 14px; font-size: 13px; margin-bottom: 16px; background: rgba(186, 26, 26, 0.15); border: 1px solid rgba(186, 26, 26, 0.35); color: ${isDark ? '#ffb4ab' : '#ba1a1a'};"></div>

      <form id="modal-add-plant-form" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Plant Nickname -->
        <div>
          <label for="plant-nickname" style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${labelColor}; margin-bottom: 6px; display: block;">Plant Nickname</label>
          <div style="position: relative;">
            <input id="plant-nickname" type="text" required placeholder="e.g. Kitchen Fern, Living Room Fiddle" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;" />
          </div>
        </div>

        <!-- Species Search with Autocomplete -->
        <div style="position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label for="plant-species-input" style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${labelColor}; margin: 0; display: block;">Species / Variety</label>
            <span id="species-match-badge" style="font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 12px; display: none; border: 1px solid rgba(16, 185, 129, 0.3);">✓ Database Match</span>
          </div>
          <div style="position: relative;">
            <input id="plant-species-input" type="text" required placeholder="Search 53 species (e.g. monstera, snake plant, basil)" autocomplete="off" style="width: 100%; box-sizing: border-box; padding: 12px 14px 12px 38px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;" />
            <span class="material-symbols-outlined" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 18px; color: ${subtextColor}; pointer-events: none;">search</span>
          </div>
          <div id="species-suggestions" style="position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 60; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 16px; max-height: 210px; overflow-y: auto; display: none; box-shadow: 0 16px 40px rgba(0,0,0,0.35); padding: 6px;"></div>
        </div>

        <!-- Dropdown Grid: Location & Light Exposure -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <!-- Location Dropdown -->
          <div style="position: relative;">
            <label style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${labelColor}; margin-bottom: 6px; display: block;">Location</label>
            <input type="hidden" id="plant-location-value" value="indoor" />
            <div id="custom-location-trigger" tabindex="0" role="button" aria-haspopup="listbox" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; transition: all 0.2s;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-symbols-outlined" style="font-size: 18px; color: ${activePillText};">home</span>
                <span id="custom-location-text" style="font-weight: 600;">Indoor</span>
              </div>
              <span id="loc-arrow" class="material-symbols-outlined" style="font-size: 18px; color: ${subtextColor}; transition: transform 0.2s;">expand_more</span>
            </div>
            <div id="custom-location-menu" role="listbox" style="position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 16px; padding: 6px; display: none; box-shadow: 0 16px 40px rgba(0,0,0,0.35);">
              <div class="custom-dropdown-item" role="option" data-value="indoor" data-icon="home" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #52B788;">home</span>
                  <span style="font-weight: 500;">Indoor</span>
                </div>
                <span class="check-icon material-symbols-outlined" style="font-size: 16px; color: #10B981; display: inline-block;">check</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="outdoor" data-icon="yard" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #4A90E2;">yard</span>
                  <span style="font-weight: 500;">Outdoor Bed</span>
                </div>
                <span class="check-icon material-symbols-outlined" style="font-size: 16px; color: #10B981; display: none;">check</span>
              </div>
            </div>
          </div>

          <!-- Light Exposure Dropdown -->
          <div style="position: relative;">
            <label style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${labelColor}; margin-bottom: 6px; display: block;">Light Exposure</label>
            <input type="hidden" id="plant-light-value" value="bright_indirect" />
            <div id="custom-light-trigger" tabindex="0" role="button" aria-haspopup="listbox" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; transition: all 0.2s;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-symbols-outlined" style="font-size: 18px; color: #F59E0B;">partly_cloudy_day</span>
                <span id="custom-light-text" style="font-weight: 600;">Bright Indirect</span>
              </div>
              <span id="light-arrow" class="material-symbols-outlined" style="font-size: 18px; color: ${subtextColor}; transition: transform 0.2s;">expand_more</span>
            </div>
            <div id="custom-light-menu" role="listbox" style="position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 16px; padding: 6px; display: none; box-shadow: 0 16px 40px rgba(0,0,0,0.35);">
              <div class="custom-dropdown-item" role="option" data-value="bright_indirect" data-icon="partly_cloudy_day" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #F59E0B;">partly_cloudy_day</span>
                  <span style="font-weight: 500;">Bright Indirect</span>
                </div>
                <span class="check-icon material-symbols-outlined" style="font-size: 16px; color: #10B981; display: inline-block;">check</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="medium" data-icon="wb_sunny" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #FBBF24;">wb_sunny</span>
                  <span style="font-weight: 500;">Medium Light</span>
                </div>
                <span class="check-icon material-symbols-outlined" style="font-size: 16px; color: #10B981; display: none;">check</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="low" data-icon="cloud" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #9CA3AF;">cloud</span>
                  <span style="font-weight: 500;">Low Light</span>
                </div>
                <span class="check-icon material-symbols-outlined" style="font-size: 16px; color: #10B981; display: none;">check</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="direct" data-icon="solar_power" style="padding: 10px 12px; border-radius: 10px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: #EA580C;">solar_power</span>
                  <span style="font-weight: 500;">Direct Sun</span>
                </div>
                <span class="check-icon material-symbols-outlined" style="font-size: 16px; color: #10B981; display: none;">check</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pot Drainage Toggle Card -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 16px; background: ${inputBg}; border: 1px solid ${inputBorder}; transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; color: #10B981;">
              <span class="material-symbols-outlined" style="font-size: 20px;">water</span>
            </div>
            <div>
              <span style="font-size: 13px; font-weight: 600; color: ${textColor}; display: block;">Pot Has Drainage Holes</span>
              <span style="font-size: 11px; color: ${subtextColor};">Crucial for overwatering risk & diagnosis evaluation</span>
            </div>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px; margin: 0; cursor: pointer;">
            <input type="checkbox" id="plant-drainage" checked style="opacity: 0; width: 0; height: 0;" />
            <span id="drainage-toggle-slider" style="position: absolute; cursor: pointer; inset: 0; background-color: #10B981; border-radius: 24px; transition: 0.2s;"></span>
            <span id="drainage-toggle-knob" style="position: absolute; height: 18px; width: 18px; left: 22px; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
          </label>
        </div>

        <!-- Submit Button -->
        <button type="submit" id="add-plant-submit-btn" style="margin-top: 6px; width: 100%; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 700; background: ${btnBg}; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 18px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s, transform 0.1s;">
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
  const locArrow = modalOverlay.querySelector('#loc-arrow');

  // Custom Dropdown logic: Light
  const lightTrigger = modalOverlay.querySelector('#custom-light-trigger');
  const lightMenu = modalOverlay.querySelector('#custom-light-menu');
  const lightValue = modalOverlay.querySelector('#plant-light-value');
  const lightText = modalOverlay.querySelector('#custom-light-text');
  const lightArrow = modalOverlay.querySelector('#light-arrow');

  function closeAllDropdowns() {
    if (locMenu) locMenu.style.display = 'none';
    if (lightMenu) lightMenu.style.display = 'none';
    if (suggestionsBox) suggestionsBox.style.display = 'none';
    if (locArrow) locArrow.style.transform = 'rotate(0deg)';
    if (lightArrow) lightArrow.style.transform = 'rotate(0deg)';
  }

  locTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = locMenu.style.display === 'block';
    closeAllDropdowns();
    if (!isShown) {
      locMenu.style.display = 'block';
      if (locArrow) locArrow.style.transform = 'rotate(180deg)';
    }
  });

  locMenu?.querySelectorAll('.custom-dropdown-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = itemHover;
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-value');
      locValue.value = val;
      locText.textContent = item.querySelector('span:nth-child(2)').textContent;
      locMenu.querySelectorAll('.check-icon').forEach(ci => ci.style.display = 'none');
      item.querySelector('.check-icon').style.display = 'inline-block';
      closeAllDropdowns();
    });
  });

  lightTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = lightMenu.style.display === 'block';
    closeAllDropdowns();
    if (!isShown) {
      lightMenu.style.display = 'block';
      if (lightArrow) lightArrow.style.transform = 'rotate(180deg)';
    }
  });

  lightMenu?.querySelectorAll('.custom-dropdown-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = itemHover;
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-value');
      lightValue.value = val;
      lightText.textContent = item.querySelector('span:nth-child(2)').textContent;
      lightMenu.querySelectorAll('.check-icon').forEach(ci => ci.style.display = 'none');
      item.querySelector('.check-icon').style.display = 'inline-block';
      closeAllDropdowns();
    });
  });

  modalOverlay.addEventListener('click', () => {
    closeAllDropdowns();
  });

  function cleanup() {
    modalOverlay.remove();
    onClose();
  }

  closeBtn?.addEventListener('click', cleanup);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cleanup();
  });

  // Autocomplete Species Handler
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
      <div class="species-item" data-key="${m.key}" data-name="${m.name}" data-type="${m.type}" style="padding: 10px 12px; font-size: 13px; color: ${textColor}; cursor: pointer; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; transition: background-color 0.15s;">
        <div style="display: flex; flex-direction: column;">
          <strong style="color: ${isDark ? '#bcf0ae' : '#154212'}; font-size: 13px;">${m.name}</strong>
          <span style="font-size: 11px; color: ${subtextColor}; font-style: italic;">${m.scientific}</span>
        </div>
        <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}; color: ${subtextColor}; border: 1px solid ${inputBorder};">
          ${m.type === 'outdoor' ? 'Outdoor' : 'Indoor'} · ${m.water_freq}d
        </span>
      </div>
    `).join('');

    suggestionsBox.querySelectorAll('.species-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = itemHover;
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
        locMenu.querySelectorAll('.check-icon').forEach(ci => ci.style.display = 'none');
        const targetOption = locMenu.querySelector(`[data-value="${locValue.value}"] .check-icon`);
        if (targetOption) targetOption.style.display = 'inline-block';
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
