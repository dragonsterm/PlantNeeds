/**
 * client/src/ui/components/seasonal-planner-modal.js
 * Seasonal Planting Planner & Companion Planting Matrix Modal (Task T-17, FR-6.1, FR-6.2).
 */
import { planSeasonalPlanting } from '../../logic/planner.js';
import { getAppTheme } from '../render.js';

export async function renderSeasonalPlannerModal(container, { onClose = () => {} } = {}) {
  const theme = getAppTheme();
  const isDark = theme === 'dark';

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'seasonal-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999;
    background: ${isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.45)'};
    backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  // Default selection
  let selectedCrops = ['Tomato', 'Basil', 'Pepper', 'Cucumber'];
  let planData = null;

  async function fetchPlan() {
    try {
      planData = await planSeasonalPlanting({
        latitude: 40.71,
        longitude: -74.00,
        crops: selectedCrops
      });
    } catch {
      // Fallback
      planData = {
        location: { zone: 'Northern Temperate Zone', latitude: 40.71, longitude: -74.00 },
        planting_plan: [
          {
            crop: 'Tomato',
            start_indoors: '2026-03-15 (6 weeks before last frost)',
            transplant_after: '2026-05-01 (After last spring frost)',
            days_to_harvest: 70,
            expected_harvest: '2026-07-10 (~70 days)',
            companion_plants: ['basil', 'marigold', 'alliums'],
            avoid_planting_near: ['fennel', 'potato', 'corn'],
            care_tips: 'Stake or cage plants. Provide consistent moisture to prevent blossom end rot.'
          },
          {
            crop: 'Basil',
            start_indoors: '2026-04-01 (4 weeks before frost)',
            transplant_after: '2026-05-15 (Warm soil required)',
            days_to_harvest: 30,
            expected_harvest: '2026-06-15 (~30 days)',
            companion_plants: ['tomatoes', 'peppers', 'marigold'],
            avoid_planting_near: ['rue'],
            care_tips: 'Pinch flower buds to prolong aromatic leaf harvest.'
          }
        ]
      };
    }
  }

  await fetchPlan();

  function renderModalContent() {
    const cardGlass = isDark
      ? `background: rgba(18, 24, 20, 0.85); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); color: #FFFFFF;`
      : `background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 20px 50px rgba(27, 48, 34, 0.15); color: #1B3022;`;

    const textColor = isDark ? '#FFFFFF' : '#1B3022';
    const subtextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : '#556353';
    const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
    const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(27, 48, 34, 0.15)';

    const cropsList = ['Tomato', 'Basil', 'Pepper', 'Cucumber', 'Carrot', 'Spinach', 'Corn'];

    modalOverlay.innerHTML = `
      <div class="glass-panel" style="width: 100%; max-width: 780px; max-height: 88vh; display: flex; flex-direction: column; padding: 28px; border-radius: 28px; position: relative; ${cardGlass}">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(27,48,34,0.1)'}; padding-bottom: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined" style="color: #10B981; font-size: 26px;">calendar_month</span>
              <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: ${textColor}; margin: 0;">
                Seasonal Planting Planner
              </h3>
            </div>
            <p style="font-size: 13px; color: ${subtextColor}; margin: 4px 0 0 0;">
              Outdoor crop sowing, transplanting, and companion matrix (${planData?.location?.zone || 'Temperate'})
            </p>
          </div>
          <button id="close-planner-btn" style="background: none; border: none; color: ${textColor}; cursor: pointer; font-size: 26px; line-height: 1; padding: 4px;">&times;</button>
        </div>

        <!-- Crop Selection Chips -->
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px;">
          <span style="font-size: 12px; font-weight: 700; color: ${subtextColor}; display: flex; align-items: center; margin-right: 4px;">Select Crops:</span>
          ${cropsList.map(crop => {
            const isSelected = selectedCrops.includes(crop);
            const chipBg = isSelected ? (isDark ? '#154212' : '#1B3022') : inputBg;
            const chipColor = isSelected ? '#FFFFFF' : textColor;
            const chipBorder = isSelected ? 'transparent' : inputBorder;
            return `
              <button class="crop-chip-btn" data-crop="${crop}" style="background: ${chipBg}; color: ${chipColor}; border: 1px solid ${chipBorder}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                ${isSelected ? '✓ ' : '+ '}${crop}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Plan Rows List -->
        <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-right: 4px;">
          ${(planData?.planting_plan || []).map(p => `
            <div style="padding: 16px; border-radius: 20px; background: ${inputBg}; border: 1px solid ${inputBorder}; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="font-size: 16px; font-weight: 700; color: ${textColor}; margin: 0;">${p.crop}</h4>
                <span style="font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 10px; rounded: 20px; border-radius: 20px;">
                  ⏱️ ${p.days_to_harvest} Days to Harvest
                </span>
              </div>

              <!-- 3-Stage Progress Timeline -->
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 11px; margin: 4px 0;">
                <div style="padding: 8px 10px; border-radius: 12px; background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}; border: 1px solid ${inputBorder};">
                  <span style="font-weight: 700; color: ${subtextColor}; display: block; margin-bottom: 2px;">1. Start Indoors</span>
                  <span style="color: ${textColor}; font-weight: 600;">${p.start_indoors}</span>
                </div>
                <div style="padding: 8px 10px; border-radius: 12px; background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}; border: 1px solid ${inputBorder};">
                  <span style="font-weight: 700; color: ${subtextColor}; display: block; margin-bottom: 2px;">2. Transplant</span>
                  <span style="color: ${textColor}; font-weight: 600;">${p.transplant_after}</span>
                </div>
                <div style="padding: 8px 10px; border-radius: 12px; background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}; border: 1px solid ${inputBorder};">
                  <span style="font-weight: 700; color: ${subtextColor}; display: block; margin-bottom: 2px;">3. Harvest</span>
                  <span style="color: ${textColor}; font-weight: 600;">${p.expected_harvest}</span>
                </div>
              </div>

              <!-- Companion & Enemies Tags -->
              <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; margin-top: 2px;">
                ${p.companion_plants?.length ? `
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-weight: 700; color: #10B981;">Good Neighbors:</span>
                    ${p.companion_plants.map(c => `
                      <span style="padding: 2px 8px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); color: ${isDark ? '#A7F3D0' : '#154212'}; font-weight: 600;">
                        ${c}
                      </span>
                    `).join('')}
                  </div>
                ` : ''}

                ${p.avoid_planting_near?.length ? `
                  <div style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
                    <span style="font-weight: 700; color: #EF4444;">Avoid Near:</span>
                    ${p.avoid_planting_near.map(e => `
                      <span style="padding: 2px 8px; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #EF4444; font-weight: 600;">
                        ${e}
                      </span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind Close
    modalOverlay.querySelector('#close-planner-btn')?.addEventListener('click', () => {
      modalOverlay.remove();
      onClose();
    });

    // Bind Crop Chips
    modalOverlay.querySelectorAll('.crop-chip-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const crop = e.currentTarget.getAttribute('data-crop');
        if (selectedCrops.includes(crop)) {
          if (selectedCrops.length > 1) {
            selectedCrops = selectedCrops.filter(c => c !== crop);
          }
        } else {
          selectedCrops.push(crop);
        }
        await fetchPlan();
        renderModalContent();
      });
    });
  }

  renderModalContent();
  container.appendChild(modalOverlay);
}
