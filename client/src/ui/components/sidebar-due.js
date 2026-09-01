/**
 * client/src/ui/components/sidebar-due.js
 * Right Sidebar: Due for Care card and Smart Care Insights widget.
 */
export function renderSidebar({ dueCount = 3, overdueCount = 1, dueList = ['Monstera Deliciosa', 'Balcony Basil', 'Golden Pothos'] } = {}) {
  return `
    <aside style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Due for Care Card -->
      <div class="glass-panel" style="padding: 24px; border-radius: 24px; position: relative; overflow: hidden;">
        <div style="position: absolute; right: -20px; top: -20px; opacity: 0.1; color: #fff; pointer-events: none;">
          <span class="material-symbols-outlined" style="font-size: 140px; font-variation-settings: 'FILL' 1;">water_drop</span>
        </div>
        <div style="position: relative; z-index: 2;">
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px;">Due for Care</h3>
          <div style="display: flex; align-items: flex-end; gap: 14px; margin-bottom: 14px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 56px; font-weight: 700; color: #FFFFFF; line-height: 1;">${dueCount}</span>
            ${overdueCount > 0 ? `
              <div style="background: rgba(217, 119, 6, 0.35); border: 1px solid rgba(217, 119, 6, 0.6); padding: 4px 10px; border-radius: 6px; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; color: #FFFFFF;">${overdueCount} Overdue</span>
              </div>
            ` : ''}
          </div>
          <p style="font-size: 13px; color: var(--sage-soft, #E1E8E0); margin-bottom: 18px; line-height: 1.4;">
            ${dueList.join(', ')}
          </p>
          <button id="sidebar-view-schedule-btn" class="btn-primary-stitch" style="width: 100%; padding: 12px; font-size: 13px;">
            View Full Schedule
          </button>
        </div>
      </div>

      <!-- Smart Care Insights Widget -->
      <div class="glass-panel" style="padding: 24px; border-radius: 24px; background: rgba(20, 30, 20, 0.55);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
          <span class="material-symbols-outlined" style="color: #A3D94E; font-size: 22px; font-variation-settings: 'FILL' 1;">lightbulb</span>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #FFFFFF;">Smart Insights</h3>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 12px 14px; border-radius: 14px;">
            <p style="font-size: 13px; color: #FFFFFF; font-weight: 600; margin-bottom: 4px;">Rainwater Covered</p>
            <p style="font-size: 12px; color: var(--sage-soft, #E1E8E0); line-height: 1.4;">
              Recent rainfall satisfies watering needs for all outdoor crops for the next 4 days.
            </p>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 12px 14px; border-radius: 14px;">
            <p style="font-size: 13px; color: #FFFFFF; font-weight: 600; margin-bottom: 4px;">Humidity Attention</p>
            <p style="font-size: 12px; color: var(--sage-soft, #E1E8E0); line-height: 1.4;">
              Indoor humidity is low (42%). Mist Monstera & Boston Fern leaves or use a pebble tray.
            </p>
          </div>
        </div>
      </div>
    </aside>
  `;
}
