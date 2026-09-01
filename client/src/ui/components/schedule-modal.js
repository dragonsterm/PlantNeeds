/**
 * client/src/ui/components/schedule-modal.js
 * Care Schedule View (Task T-07)
 * Sorted list by next_watering with urgency badges and date range filters (7d / 14d / 30d).
 */
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
    // Sort plants by days remaining (urgency)
    const sortedPlants = [...plants].sort((a, b) => a.days_remaining - b.days_remaining);

    modalOverlay.innerHTML = `
      <div class="glass-panel" style="width: 100%; max-width: 680px; max-height: 85vh; display: flex; flex-direction: column; padding: 28px; border-radius: 24px; position: relative;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 16px;">
          <div>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #FFFFFF;">Care Schedule</h3>
            <span style="font-size: 13px; color: var(--sage-soft, #E1E8E0);">Upcoming watering & fertilizing tasks</span>
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
          ${sortedPlants.map(p => {
            const isOverdue = p.days_remaining <= 0;
            const isSkipped = p.rain_skipped;
            const badgeBg = isSkipped ? 'rgba(74, 144, 226, 0.25)' : isOverdue ? 'rgba(217, 119, 6, 0.3)' : 'rgba(163, 217, 78, 0.2)';
            const badgeBorder = isSkipped ? 'rgba(74, 144, 226, 0.5)' : isOverdue ? 'rgba(217, 119, 6, 0.5)' : 'rgba(163, 217, 78, 0.4)';
            const badgeColor = isSkipped ? '#4A90E2' : isOverdue ? '#D97706' : '#A3D94E';
            const badgeText = isSkipped ? 'Rain Skipped' : isOverdue ? 'Overdue' : `In ${p.days_remaining} Days`;

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <div style="width: 40px; height: 40px; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.3); flex-shrink: 0;">
                    <img src="${p.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw'}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                  </div>
                  <div>
                    <h4 style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 2px;">${p.name}</h4>
                    <p style="font-size: 12px; color: var(--sage-soft, #E1E8E0); margin: 0;">Watering (${p.location === 'outdoor' ? 'Outdoor' : 'Indoor'}) • ${p.species}</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor}; padding: 4px 12px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600;">
                    ${badgeText}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Event listeners
    modalOverlay.querySelector('#close-sched-btn')?.addEventListener('click', cleanup);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) cleanup();
    });

    modalOverlay.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = parseInt(btn.getAttribute('data-days'), 10);
        renderContent();
      });
    });
  }

  function cleanup() {
    modalOverlay.remove();
    onClose();
  }

  renderContent();
  document.body.appendChild(modalOverlay);
}
