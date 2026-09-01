/**
 * client/src/ui/components/plant-grid.js
 * Plant Grid layout container with empty states and action bindings.
 */
import { renderPlantCard } from './plant-card.js';

export function renderPlantGrid(plants = []) {
  if (!plants || plants.length === 0) {
    return `
      <div class="glass-panel" style="padding: 48px 32px; text-align: center; border-radius: 24px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.1); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; color: var(--sage-soft, #E1E8E0);">
          <span class="material-symbols-outlined" style="font-size: 32px;">yard</span>
        </div>
        <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">No plants in your garden yet</h3>
        <p style="color: var(--sage-soft, #E1E8E0); font-size: 14px; max-width: 400px; margin: 0 auto 20px;">
          Add your first houseplant or outdoor crop to start tracking weather-aware care schedules.
        </p>
        <button id="empty-add-plant-btn" class="btn-primary-stitch" style="width: auto; margin: 0 auto; padding: 10px 24px;">
          + Add First Plant
        </button>
      </div>
    `;
  }

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">My Plants</h2>
        <span style="font-size: 13px; color: var(--sage-soft, #E1E8E0);">${plants.length} plants under active monitoring</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="icon-btn active" title="Grid View" style="background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; width: 36px; height: 36px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 18px;">grid_view</span>
        </button>
        <button class="icon-btn" title="List View" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; width: 36px; height: 36px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 18px;">format_list_bulleted</span>
        </button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
      ${plants.map(p => renderPlantCard(p)).join('')}
    </div>
  `;
}
