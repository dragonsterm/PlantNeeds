/**
 * client/src/ui/components/plant-card.js
 * Plant Card component with high-contrast countdown ring and care actions.
 */
export function renderPlantCard(plant) {
  const isOverdue = plant.days_remaining <= 0;
  const isSkipped = plant.rain_skipped;
  
  let statusText = 'Healthy';
  let badgeClass = 'badge-healthy';
  let ringColor = '#A3D94E';
  let ringOffset = 40;
  let countdownLabel = `${plant.days_remaining}d`;

  if (isSkipped) {
    statusText = 'Rain Covered';
    badgeClass = 'badge-rain';
    ringColor = '#4A90E2';
    ringOffset = 10;
    countdownLabel = 'skip';
  } else if (isOverdue) {
    statusText = 'Due Today';
    badgeClass = 'badge-due';
    ringColor = '#D97706';
    ringOffset = 5;
    countdownLabel = '0d';
  }

  const plantImg = plant.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhEkaeKyuoBmmFgEVi4XkgE5zr14wDdg-UMmpjk-ne84t6WCC6gvm6rfVlReiJSqhNRfJdfEAsxG2ghiWQLKN7zfvRGZ-XpKcO4ey8BdjqxooUrkZcD_FF2_CVerxj42LG9oElK1zM_Lzgpn937KCuEi5sJIn_p8jaxgE-B-5QpywJ25ocmygtN0A3AQgknTrweb_F6gCgJp0zj88WQ2pFawAiIKDMEegkTmjs-U2EDgAMfDSzQuXuQw';

  return `
    <div class="glass-panel plant-card" data-plant-id="${plant.id}" style="padding: 20px; display: flex; flex-direction: column; border-radius: 24px; transition: transform 0.2s, box-shadow 0.2s;">
      <div style="position: relative; height: 180px; border-radius: 16px; overflow: hidden; margin-bottom: 16px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.2);">
        <img src="${plantImg}" alt="${plant.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); padding: 4px 12px; border-radius: var(--radius-pill); display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.2);">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${ringColor};"></span>
          <span style="font-size: 11px; font-weight: 600; color: #FFFFFF;">${statusText}</span>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">${plant.name}</h3>
        <p style="font-size: 13px; color: var(--sage-soft, #E1E8E0);">${plant.species} • ${plant.location === 'outdoor' ? 'Outdoor Bed' : 'Indoor'}</p>
      </div>

      <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4"></path>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${ringColor}" stroke-dasharray="100, 100" stroke-dashoffset="${ringOffset}" stroke-linecap="round" stroke-width="4"></path>
            </svg>
            <span style="position: absolute; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #FFFFFF;">${countdownLabel}</span>
          </div>
          <span style="font-size: 13px; font-weight: 600; color: #FFFFFF;">${isOverdue ? 'Due Today' : `${plant.days_remaining} Days Left`}</span>
        </div>

        <button class="water-btn btn-primary-stitch" data-id="${plant.id}" style="width: auto; margin-top: 0; padding: 8px 18px; font-size: 13px; display: flex; align-items: center; gap: 6px; background: ${isOverdue ? 'var(--primary-container, #2D5A27)' : 'rgba(255,255,255,0.15)'}; border: 1px solid rgba(255,255,255,0.25);">
          <span class="material-symbols-outlined" style="font-size: 16px;">water_drop</span>
          <span>Water</span>
        </button>
      </div>
    </div>
  `;
}
