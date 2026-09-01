/**
 * client/src/ui/components/today-banner.js
 * Weather-Aware Guidance Banner modeled after Stitch Reference.
 */
export function renderTodayBanner({
  rain_mm = 53.4,
  skipped_outdoor = 3,
  due_indoor = 2,
  data_source = 'Live Weather'
} = {}) {
  return `
    <div class="glass-panel" style="margin: 0 24px 28px; padding: 14px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-radius: var(--radius-pill);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(74, 144, 226, 0.2); border: 1px solid rgba(74, 144, 226, 0.4); display: flex; align-items: center; justify-content: center; color: #4A90E2;">
          <span class="material-symbols-outlined" style="font-size: 22px;">rainy</span>
        </div>
        <p style="color: #FFFFFF; font-size: 14px; font-weight: 400; margin: 0;">
          Rain covered <strong style="color: #FFFFFF; font-weight: 600;">${skipped_outdoor} outdoor garden crops</strong> (${rain_mm} mm rain this week). <strong style="color: #FFFFFF; font-weight: 600;">${due_indoor} indoor houseplants</strong> due for watering today.
        </p>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; background: rgba(45, 90, 39, 0.35); border: 1px solid rgba(45, 90, 39, 0.5); padding: 6px 14px; border-radius: var(--radius-pill); white-space: nowrap;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #A3D94E; display: inline-block;"></span>
        <span style="font-size: 12px; font-weight: 600; color: #FFFFFF; letter-spacing: 0.04em;">${data_source}</span>
      </div>
    </div>
  `;
}
