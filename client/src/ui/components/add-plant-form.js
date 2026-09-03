/**
 * client/src/ui/components/add-plant-form.js
 * Botanical Harmony Add Plant Modal matching exact design specification:
 * - Clean warm off-white container (#F4F6F3 / #FAF9F6) with deep forest green accents (#1A3A22)
 * - Required badge, Botanical DB search badge, and live matched species banner
 * - Quick-select chips (Monstera Deliciosa, Golden Pothos, Snake Plant, Sweet Basil)
 * - 2-column custom dropdowns for Location & Light Exposure with full visibility
 * - High-fidelity pot drainage toggle card and action footer (Cancel + Add to Garden)
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
    water_freq: data.water_frequency_days || 7,
    light: data.light || 'bright_indirect'
  }));

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'add-plant-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999;
    background: ${isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(26, 58, 34, 0.25)'};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  `;

  // Color tokens
  const modalBg = isDark ? '#141E16' : '#F6F5EE';
  const modalBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.9)';
  const textColor = isDark ? '#FFFFFF' : '#162719';
  const labelColor = isDark ? '#E1E8E0' : '#1F2F23';
  const subtextColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#6B7280';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.92)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(27, 48, 34, 0.14)';
  const cardFieldBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)';
  const cardFieldBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(27, 48, 34, 0.1)';
  const menuBg = isDark ? '#1A261C' : '#FFFFFF';
  const itemHover = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 58, 34, 0.06)';
  const primaryBtnBg = isDark ? '#244D2E' : '#1A3A22';

  modalOverlay.innerHTML = `
    <div class="glass-modal" style="width: 100%; max-width: 530px; background: ${modalBg}; border: 1.5px solid ${modalBorder}; border-radius: 28px; box-shadow: 0 24px 60px rgba(27, 48, 34, 0.18), 0 4px 16px rgba(27, 48, 34, 0.06); overflow: hidden; position: relative; font-family: 'Plus Jakarta Sans', sans-serif;">
      
      <!-- Modal Header -->
      <div style="padding: 20px 24px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26, 58, 34, 0.08)'};">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 14px; background: ${isDark ? 'rgba(188, 240, 174, 0.15)' : 'rgba(26, 58, 34, 0.08)'}; border: 1px solid ${isDark ? 'rgba(188, 240, 174, 0.25)' : 'rgba(255, 255, 255, 0.8)'}; display: flex; align-items: center; justify-content: center; color: ${isDark ? '#bcf0ae' : '#1A3A22'}; shrink-0;">
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21V10m0 0C12 5.5 15.5 3 19.5 3c-.5 4.5-3 7-7.5 7zm0 0C12 5.5 8.5 3 4.5 3c.5 4.5 3 7 7.5 7z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
          <div>
            <h2 style="font-size: 17px; font-weight: 700; color: ${textColor}; margin: 0; line-height: 1.25;">Add Plant to Garden</h2>
            <p style="font-size: 12px; color: ${subtextColor}; margin: 2px 0 0; font-weight: 500;">Automatic care schedule & botanical profile</p>
          </div>
        </div>
        <button id="close-modal-btn" aria-label="Close dialog" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${subtextColor}; background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)'}; cursor: pointer; transition: all 0.2s;">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      </div>

      <!-- Error Box -->
      <div id="modal-error" style="display: none; margin: 14px 24px 0; padding: 10px 14px; border-radius: 12px; font-size: 12px; background: rgba(186, 26, 26, 0.15); border: 1px solid rgba(186, 26, 26, 0.35); color: ${isDark ? '#ffb4ab' : '#ba1a1a'};"></div>

      <!-- Modal Body Form -->
      <form id="modal-add-plant-form" style="padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Field 1: Plant Nickname -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <label for="plant-nickname" style="font-size: 12px; font-weight: 600; color: ${labelColor}; margin: 0;">Plant Nickname</label>
            <span style="font-size: 11px; color: ${subtextColor}; font-weight: 500;">Required</span>
          </div>
          <div style="position: relative;">
            <input id="plant-nickname" type="text" required placeholder="e.g. Kitchen Fern, Living Room Fiddle" value="Kitchen Fern" style="width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 12px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s;" />
          </div>
        </div>

        <!-- Field 2: Species / Variety Scientific Search -->
        <div style="position: relative;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <label for="plant-species-input" style="font-size: 12px; font-weight: 600; color: ${labelColor}; margin: 0;">
              Species / Variety <span style="color: ${subtextColor}; font-weight: 400;">(Scientific Search)</span>
            </label>
            <span style="font-size: 11px; font-weight: 600; color: #166534; background: rgba(22, 101, 52, 0.12); padding: 2px 8px; border-radius: 9999px;">Botanical DB</span>
          </div>
          
          <div style="position: relative;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; color: ${subtextColor}; pointer-events: none;">
              <svg style="width: 15px; height: 15px;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
            <input id="plant-species-input" type="text" required placeholder="Search botanical species or common name..." autocomplete="off" value="Monstera Deliciosa" style="width: 100%; box-sizing: border-box; padding: 10px 36px 10px 36px; border-radius: 12px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s;" />
            <span id="species-match-check" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #15803d; display: flex; align-items: center; pointer-events: none;">
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M4.5 12.75l6 6 9-13.5" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
          </div>

          <!-- Autocomplete Dropdown Menu -->
          <div id="species-suggestions" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 70; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 14px; max-height: 200px; overflow-y: auto; display: none; box-shadow: 0 16px 36px rgba(0,0,0,0.25); padding: 4px;"></div>

          <!-- Popular Quick Chips -->
          <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px; overflow-x: auto; padding-bottom: 2px;">
            <span style="font-size: 11px; color: ${subtextColor}; font-weight: 500; shrink-0;">Popular:</span>
            <button type="button" class="popular-chip active" data-species="Monstera Deliciosa" style="padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: rgba(26, 58, 34, 0.1); color: #1A3A22; border: 1px solid rgba(26, 58, 34, 0.16); cursor: pointer; white-space: nowrap; transition: all 0.15s;">
              Monstera Deliciosa
            </button>
            <button type="button" class="popular-chip" data-species="Golden Pothos" style="padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: rgba(255, 255, 255, 0.6); color: ${labelColor}; border: 1px solid ${inputBorder}; cursor: pointer; white-space: nowrap; transition: all 0.15s;">
              Golden Pothos
            </button>
            <button type="button" class="popular-chip" data-species="Snake Plant" style="padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: rgba(255, 255, 255, 0.6); color: ${labelColor}; border: 1px solid ${inputBorder}; cursor: pointer; white-space: nowrap; transition: all 0.15s;">
              Snake Plant
            </button>
            <button type="button" class="popular-chip" data-species="Sweet Basil" style="padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: rgba(255, 255, 255, 0.6); color: ${labelColor}; border: 1px solid ${inputBorder}; cursor: pointer; white-space: nowrap; transition: all 0.15s;">
              Sweet Basil
            </button>
          </div>

          <!-- Matched Scientific Profile Feedback Card -->
          <div id="species-match-card" style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-radius: 12px; background: ${isDark ? 'rgba(34, 60, 40, 0.5)' : 'rgba(236, 245, 238, 0.85)'}; border: 1px solid ${isDark ? 'rgba(188, 240, 174, 0.25)' : 'rgba(180, 220, 190, 0.6)'}; font-size: 11px; color: ${isDark ? '#d1fae5' : '#1E3A24'};">
            <span style="display: flex; align-items: center; gap: 6px; font-weight: 500;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
              <span id="match-card-text">Matched: <em id="match-card-species" style="font-style: italic; font-weight: 600;">Monstera Deliciosa</em> · Indoor · 7-day default cycle</span>
            </span>
            <span style="color: ${subtextColor}; font-size: 10px; font-weight: 500;">Optimal Care</span>
          </div>
        </div>

        <!-- Field 3: 2-Column Row for Location and Light Exposure -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          
          <!-- Location Dropdown -->
          <div style="position: relative;">
            <label style="font-size: 12px; font-weight: 600; color: ${labelColor}; margin-bottom: 6px; display: block;">Location</label>
            <input type="hidden" id="plant-location-value" value="indoor" />
            
            <div id="custom-location-trigger" tabindex="0" role="button" aria-haspopup="listbox" style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 12px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; transition: all 0.2s;">
              <span id="custom-location-text" style="font-weight: 500;">Indoor Houseplant</span>
              <svg id="loc-arrow" style="width: 16px; height: 16px; color: ${subtextColor}; transition: transform 0.2s;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>

            <div id="custom-location-menu" role="listbox" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 60; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 14px; padding: 4px; display: none; box-shadow: 0 16px 36px rgba(0,0,0,0.25);">
              <div class="custom-dropdown-item" role="option" data-value="indoor" data-text="Indoor Houseplant" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Indoor Houseplant</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700;">✓</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="outdoor" data-text="Outdoor Bed / Garden" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Outdoor Bed / Garden</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700; display: none;">✓</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="outdoor" data-text="Balcony & Patio" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Balcony & Patio</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700; display: none;">✓</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="indoor" data-text="Greenhouse Enclosure" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Greenhouse Enclosure</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700; display: none;">✓</span>
              </div>
            </div>
          </div>

          <!-- Light Exposure Dropdown -->
          <div style="position: relative;">
            <label style="font-size: 12px; font-weight: 600; color: ${labelColor}; margin-bottom: 6px; display: block;">Light Exposure</label>
            <input type="hidden" id="plant-light-value" value="bright_indirect" />
            
            <div id="custom-light-trigger" tabindex="0" role="button" aria-haspopup="listbox" style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 12px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; transition: all 0.2s;">
              <span id="custom-light-text" style="font-weight: 500;">Bright Indirect</span>
              <svg id="light-arrow" style="width: 16px; height: 16px; color: ${subtextColor}; transition: transform 0.2s;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>

            <div id="custom-light-menu" role="listbox" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 60; background: ${menuBg}; border: 1px solid ${inputBorder}; border-radius: 14px; padding: 4px; display: none; box-shadow: 0 16px 36px rgba(0,0,0,0.25);">
              <div class="custom-dropdown-item" role="option" data-value="bright_indirect" data-text="Bright Indirect" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Bright Indirect</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700;">✓</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="direct" data-text="Direct Sunlight" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Direct Sunlight</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700; display: none;">✓</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="medium" data-text="Medium Light" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Medium Light</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700; display: none;">✓</span>
              </div>
              <div class="custom-dropdown-item" role="option" data-value="low" data-text="Low Light / Shade" style="padding: 9px 12px; border-radius: 8px; font-size: 13px; color: ${textColor}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Low Light / Shade</span>
                <span class="check-icon" style="color: #16a34a; font-size: 14px; font-weight: 700; display: none;">✓</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Field 4: Pot Drainage Toggle Card -->
        <div style="padding: 12px 14px; border-radius: 16px; background: ${cardFieldBg}; border: 1px solid ${cardFieldBorder}; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26, 58, 34, 0.08)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.6)'}; display: flex; align-items: center; justify-content: center; color: ${isDark ? '#86efac' : '#1A3A22'}; shrink-0;">
              <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <div>
              <span style="font-size: 13px; font-weight: 600; color: ${textColor}; display: block;">Pot Has Drainage Holes</span>
              <span style="font-size: 11px; color: ${subtextColor};">Crucial for overwatering risk & diagnosis evaluation</span>
            </div>
          </div>
          
          <label style="position: relative; display: inline-block; width: 44px; height: 24px; margin: 0; cursor: pointer;">
            <input type="checkbox" id="plant-drainage" checked style="opacity: 0; width: 0; height: 0;" />
            <span id="drainage-toggle-slider" style="position: absolute; cursor: pointer; inset: 0; background-color: #1A3A22; border-radius: 9999px; transition: 0.2s;"></span>
            <span id="drainage-toggle-knob" style="position: absolute; height: 18px; width: 18px; left: 22px; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
          </label>
        </div>

        <!-- Footer Actions -->
        <div style="padding-top: 8px; display: flex; align-items: center; justify-content: flex-end; gap: 12px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26, 58, 34, 0.08)'};">
          <button type="button" id="cancel-modal-btn" style="padding: 10px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; color: ${subtextColor}; background: none; border: none; cursor: pointer; transition: color 0.15s;">
            Cancel
          </button>
          
          <button type="submit" id="add-plant-submit-btn" style="padding: 10px 22px; border-radius: 9999px; font-size: 13px; font-weight: 600; background: ${primaryBtnBg}; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 12px rgba(26, 58, 34, 0.18); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
            <svg style="width: 15px; height: 15px;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span>Add to Garden</span>
          </button>
        </div>

      </form>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const closeBtn = modalOverlay.querySelector('#close-modal-btn');
  const cancelBtn = modalOverlay.querySelector('#cancel-modal-btn');
  const form = modalOverlay.querySelector('#modal-add-plant-form');
  const nicknameInput = modalOverlay.querySelector('#plant-nickname');
  const speciesInput = modalOverlay.querySelector('#plant-species-input');
  const matchCheck = modalOverlay.querySelector('#species-match-check');
  const suggestionsBox = modalOverlay.querySelector('#species-suggestions');
  const matchCard = modalOverlay.querySelector('#species-match-card');
  const matchCardSpecies = modalOverlay.querySelector('#match-card-species');
  const matchCardText = modalOverlay.querySelector('#match-card-text');
  const errorBox = modalOverlay.querySelector('#modal-error');
  const drainageCheckbox = modalOverlay.querySelector('#plant-drainage');
  const toggleSlider = modalOverlay.querySelector('#drainage-toggle-slider');
  const toggleKnob = modalOverlay.querySelector('#drainage-toggle-knob');

  // Toggle drainage
  drainageCheckbox?.addEventListener('change', (e) => {
    if (e.target.checked) {
      toggleSlider.style.backgroundColor = isDark ? '#244D2E' : '#1A3A22';
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
      const text = item.getAttribute('data-text');
      locValue.value = val;
      locText.textContent = text;
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
      const text = item.getAttribute('data-text');
      lightValue.value = val;
      lightText.textContent = text;
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
  cancelBtn?.addEventListener('click', cleanup);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cleanup();
  });

  function selectSpecies(speciesName, scientificName, type = 'indoor', waterFreq = 7) {
    speciesInput.value = speciesName;
    if (matchCheck) matchCheck.style.display = 'flex';
    if (matchCard) {
      matchCard.style.display = 'flex';
      matchCardSpecies.textContent = scientificName || speciesName;
      matchCardText.innerHTML = `Matched: <em style="font-style: italic; font-weight: 600;">${scientificName || speciesName}</em> · ${type === 'outdoor' ? 'Outdoor' : 'Indoor'} · ${waterFreq}-day default cycle`;
    }

    if (type === 'outdoor') {
      locValue.value = 'outdoor';
      locText.textContent = 'Outdoor Bed / Garden';
    } else {
      locValue.value = 'indoor';
      locText.textContent = 'Indoor Houseplant';
    }
    locMenu?.querySelectorAll('.custom-dropdown-item').forEach(ci => {
      const isSelected = ci.getAttribute('data-value') === locValue.value;
      ci.querySelector('.check-icon').style.display = isSelected ? 'inline-block' : 'none';
    });

    suggestionsBox.style.display = 'none';
  }

  // Popular Quick Chips
  modalOverlay.querySelectorAll('.popular-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      modalOverlay.querySelectorAll('.popular-chip').forEach(c => {
        c.style.background = 'rgba(255, 255, 255, 0.6)';
        c.style.color = labelColor;
        c.style.border = `1px solid ${inputBorder}`;
      });
      chip.style.background = 'rgba(26, 58, 34, 0.1)';
      chip.style.color = '#1A3A22';
      chip.style.border = '1px solid rgba(26, 58, 34, 0.16)';

      const sp = chip.getAttribute('data-species');
      const found = speciesList.find(s => s.name.toLowerCase() === sp.toLowerCase() || s.scientific.toLowerCase() === sp.toLowerCase());
      if (found) {
        selectSpecies(found.name, found.scientific, found.type, found.water_freq);
      } else {
        selectSpecies(sp, sp, 'indoor', 7);
      }
    });
  });

  // Autocomplete Species Search
  speciesInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      suggestionsBox.style.display = 'none';
      if (matchCheck) matchCheck.style.display = 'none';
      if (matchCard) matchCard.style.display = 'none';
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
      if (matchCheck) matchCheck.style.display = 'none';
      if (matchCard) matchCard.style.display = 'none';
      return;
    }

    suggestionsBox.innerHTML = matches.map(m => `
      <div class="species-item" data-key="${m.key}" data-name="${m.name}" data-scientific="${m.scientific}" data-type="${m.type}" data-freq="${m.water_freq}" style="padding: 8px 12px; font-size: 13px; color: ${textColor}; cursor: pointer; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; transition: background-color 0.15s;">
        <div style="display: flex; flex-direction: column;">
          <strong style="color: ${isDark ? '#bcf0ae' : '#1A3A22'}; font-size: 13px;">${m.name}</strong>
          <span style="font-size: 11px; color: ${subtextColor}; font-style: italic;">${m.scientific}</span>
        </div>
        <span style="font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,58,34,0.06)'}; color: ${subtextColor}; border: 1px solid ${inputBorder};">
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
        const scientific = item.getAttribute('data-scientific');
        const autoType = item.getAttribute('data-type');
        const freq = item.getAttribute('data-freq');
        selectSpecies(selectedName, scientific, autoType, freq);
      });
    });

    suggestionsBox.style.display = 'block';
  });

  // Submit Handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = modalOverlay.querySelector('#add-plant-submit-btn');
    const name = nicknameInput.value.trim();
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
