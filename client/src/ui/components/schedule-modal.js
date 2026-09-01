/**
 * client/src/ui/components/schedule-modal.js
 * Care Schedule View (Task T-07)
 * Uses computePlantSchedule from logic/plants.js for 100% single source of truth with WebMCP.
 */
import { computePlantSchedule } from '../../logic/plants.js';

export function renderScheduleModal(container, { plants = [], onClose = () => {} } = {}) {
  let activeFilter = 7; // days ahead

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'schedule-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  function renderContent() {
    // 1. Calculate schedule using the same single source of truth function as WebMCP
    const scheduleItems = computePlantSchedule(plants, { days_ahead: activeFilter });

    modalOverlay.innerHTML = `
      <div class="glass-panel" style="width: 100%; max-width: 680px; max-height: 85vh; display: flex; flex-direction: column; padding: 28px; border-radius: 24px; position: relative;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 16px;">
          <div>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0;">Care Schedule</h3>
            <span style="font-size: 13px; color: var(--sage-soft, #E1E8E0);">Upcoming watering & care tasks (Single Source of Truth)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.1); padding: 3px; border-radius: var(--radius-pill); border: 1px solid rgba(255,255,255,0.15);">
              <button class="filter-btn ${activeFilter === 7 ? 'active' : ''}" data-days="7" style="background: ${activeFilter === 7 ? 'var(--primary-container, #2D5A27)' : 'transparent'}; border: none; color: #fff; padding: 4px 12px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; cursor: pointer;">7 Days</button>
              <button class="filter-btn ${activeFilter === 14 ? 'active' : ''}" data-days="14" style="background: ${activeFilter === 14 ? 'var(--primary-container, #2D5A27)' : 'transparent'}; border: none; color: #fff; padding: 4px 12px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; cursor: pointer;">14 Days</button>
              <button class="filter-btn ${activeFilter === 30 ? 'active' : ''}" data-days="30" style="background: ${activeFilter === 30 ? 'var(--primary-container, #2D5A27)' : 'transparent'}; border: none; color: #fff; padding: 4px 12px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; cursor: pointer;">30 Days</button>
            </div>
            <button id="close-sched-btn" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 26px; line-height: 1; padding: 4px;">&times;</button>
          </div>
        </div>

        <!-- Schedule Task List -->
        <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 4px;">
          ${scheduleItems.length === 0 ? `
            <div style="text-align: center; padding: 36px 20px; color: var(--sage-soft, #E1E8E0);">
              <p style="font-size: 15px; margin-bottom: 4px;">No watering tasks due in the next ${activeFilter} days.</p>
              <span style="font-size: 12px; opacity: 0.7;">All plants are well-hydrated.</span>
            </div>
          ` : scheduleItems.map(item => {
            const isOverdue = item.overdue;
            const isSkipped = item.rain_skipped;
            const badgeBg = isSkipped ? 'rgba(74, 144, 226, 0.25)' : isOverdue ? 'rgba(217, 119, 6, 0.3)' : 'rgba(163, 217, 78, 0.2)';
            const badgeBorder = isSkipped ? 'rgba(74, 144, 226, 0.5)' : isOverdue ? 'rgba(217, 119, 6, 0.5)' : 'rgba(163, 217, 78, 0.4)';
            const badgeColor = isSkipped ? '#4A90E2' : isOverdue ? '#D97706' : '#A3D94E';
            const badgeText = isSkipped ? 'Rain Skipped' : isOverdue ? 'Overdue' : (item.days_remaining === 0 ? 'Due Today' : `In ${item.days_remaining} Days`);

            // Safe fallback for plant species name (Fixes 'undefined' finding 3)
            const speciesDisplay = item.species || 'Houseplant';
            const locationDisplay = (item.location || 'indoor') === 'outdoor' ? 'Outdoor Bed' : 'Indoor';

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <div style="width: 40px; height: 40px; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.3); flex-shrink: 0;">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw" alt="${item.plant_name}" style="width: 100%; height: 100%; object-fit: cover;" />
                  </div>
                  <div>
                    <h4 style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin: 0 0 2px 0;">${item.plant_name}</h4>
                    <p style="font-size: 12px; color: var(--sage-soft, #E1E8E0); margin: 0;">Watering (${locationDisplay}) • ${speciesDisplay}</p>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: var(--radius-pill); background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor}; letter-spacing: 0.5px;">
                    ${badgeText}
                  </span>
                  <button class="water-task-btn" data-id="${item.plant_id}" style="background: var(--primary, #1B3022); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 14px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                    Water
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Bind Close Button
    modalOverlay.querySelector('#close-sched-btn')?.addEventListener('click', () => {
      modalOverlay.remove();
      if (window.location.hash === '#schedule') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      onClose();
    });

    // Bind Filter Buttons
    modalOverlay.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeFilter = parseInt(e.currentTarget.getAttribute('data-days'), 10) || 7;
        renderContent();
      });
    });
  }

  renderContent();
  container.appendChild(modalOverlay);
}
