/**
 * client/src/ui/components/navbar.js
 * Top Navigation bar modeled after Google Stitch Dark Emerald theme.
 */
import { clearToken } from '../../api/client.js';
import { emit } from '../../state/store.js';

export function renderNavbar(user = null, onAddPlantClick = null) {
  return `
    <nav class="glass-panel nav-bar" style="margin: 16px 24px 20px; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 32px;">
        <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <span class="material-symbols-outlined brand-icon" style="color: var(--primary-fixed, #a1d494); font-size: 32px;">potted_plant</span>
          <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">PlantNeeds</span>
        </div>
        <div class="nav-links" style="display: flex; gap: 24px;">
          <a href="#garden" class="nav-link active" style="color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding-bottom: 4px; border-bottom: 2px solid #a1d494;">My Garden</a>
          <a href="#schedule" class="nav-link" style="color: var(--sage-soft, #E1E8E0); font-weight: 500; font-size: 14px; text-decoration: none;">Care Schedule</a>
          <a href="#diagnose" class="nav-link" style="color: var(--sage-soft, #E1E8E0); font-weight: 500; font-size: 14px; text-decoration: none;">Diagnosis</a>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <button id="nav-add-plant-btn" class="btn-primary-stitch" style="width: auto; margin-top: 0; padding: 10px 20px; display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
          <span>Add Plant</span>
        </button>
        <button class="icon-btn" title="Notifications" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; width: 40px; height: 40px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 20px;">notifications</span>
        </button>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--primary-container, #2D5A27); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; border: 1px solid rgba(255,255,255,0.3);">
            ${user?.username ? user.username.substring(0, 2).toUpperCase() : 'PN'}
          </div>
          <button id="nav-logout-btn" title="Sign Out" style="background: none; border: none; color: var(--sage-soft, #E1E8E0); font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline;">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  `;
}
