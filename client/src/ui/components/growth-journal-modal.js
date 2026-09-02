/**
 * client/src/ui/components/growth-journal-modal.js
 * Growth Journal & Milestone Timeline Modal (Task T-16, FR-5.1, FR-5.2).
 * Operates on both Light & Dark modes with live timeline updates.
 */
import { logGrowth } from '../../logic/planner.js';
import { api } from '../../api/client.js';
import { getAppTheme } from '../render.js';

export async function renderGrowthJournalModal(container, { plant, onClose = () => {} } = {}) {
  if (!plant) return;

  const theme = getAppTheme();
  const isDark = theme === 'dark';

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'growth-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999;
    background: ${isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.45)'};
    backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  // Fetch live growth timeline
  let timeline = [];
  try {
    const res = await api(`/api/plants/${plant.id}/growth`);
    if (res && Array.isArray(res.timeline)) {
      timeline = res.timeline;
    }
  } catch {
    // Fallback seed timeline
    timeline = [
      {
        id: '1',
        milestone: 'New fenestrated leaf unfurled',
        height_cm: 48,
        date: new Date().toISOString().split('T')[0],
        source: 'human'
      },
      {
        id: '2',
        milestone: 'Repotted into 10-inch terracotta pot with perlite',
        height_cm: 42,
        date: '2026-07-15',
        source: 'agent'
      },
      {
        id: '3',
        milestone: 'Initial plant acquisition and healthy root check',
        height_cm: 30,
        date: '2026-05-10',
        source: 'human'
      }
    ];
  }

  const latestHeight = timeline.find(t => t.height_cm)?.height_cm || '48';

  function renderModalContent() {
    const cardGlass = isDark
      ? `background: rgba(18, 24, 20, 0.85); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); color: #FFFFFF;`
      : `background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 20px 50px rgba(27, 48, 34, 0.15); color: #1B3022;`;

    const textColor = isDark ? '#FFFFFF' : '#1B3022';
    const subtextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : '#556353';
    const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
    const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(27, 48, 34, 0.15)';
    const btnBg = isDark ? '#154212' : '#1B3022';

    modalOverlay.innerHTML = `
      <div class="glass-panel" style="width: 100%; max-width: 680px; max-height: 88vh; display: flex; flex-direction: column; padding: 28px; border-radius: 28px; position: relative; ${cardGlass}">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(27,48,34,0.1)'}; padding-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined" style="color: #52B788; font-size: 24px;">psychiatry</span>
              <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: ${textColor}; margin: 0;">
                Growth Journal — ${plant.name}
              </h3>
            </div>
            <p style="font-size: 13px; color: ${subtextColor}; margin: 4px 0 0 0;">
              ${plant.species || 'Houseplant'} · Tracking physical milestones & foliage history
            </p>
          </div>
          <button id="close-journal-btn" style="background: none; border: none; color: ${textColor}; cursor: pointer; font-size: 26px; line-height: 1; padding: 4px;">&times;</button>
        </div>

        <!-- Quick Stats Row -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px 14px; border-radius: 16px; background: ${inputBg}; border: 1px solid ${inputBorder};">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${subtextColor};">Current Height</span>
            <p style="font-size: 16px; font-weight: 700; color: ${textColor}; margin: 2px 0 0 0; font-family: 'JetBrains Mono', monospace;">${latestHeight} cm</p>
          </div>
          <div style="flex: 1; padding: 10px 14px; border-radius: 16px; background: ${inputBg}; border: 1px solid ${inputBorder};">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${subtextColor};">Milestones</span>
            <p style="font-size: 16px; font-weight: 700; color: ${textColor}; margin: 2px 0 0 0; font-family: 'JetBrains Mono', monospace;">${timeline.length} Logged</p>
          </div>
          <div style="flex: 1; padding: 10px 14px; border-radius: 16px; background: ${inputBg}; border: 1px solid ${inputBorder};">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${subtextColor};">Health Status</span>
            <p style="font-size: 16px; font-weight: 700; color: #10B981; margin: 2px 0 0 0;">Optimal</p>
          </div>
        </div>

        <!-- Add Milestone Form -->
        <form id="add-milestone-form" style="display: flex; gap: 8px; margin-bottom: 20px;">
          <input type="text" id="milestone-text-input" placeholder="e.g. First fenestrated leaf unfurled" required style="flex: 2; padding: 10px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; outline: none;" />
          <input type="number" id="height-num-input" placeholder="Height cm" style="width: 100px; padding: 10px 14px; border-radius: 14px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${textColor}; font-size: 13px; outline: none;" />
          <button type="submit" id="submit-milestone-btn" style="background: ${btnBg}; color: #FFFFFF; border: none; padding: 10px 18px; border-radius: 14px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: opacity 0.2s;">
            + Log Growth
          </button>
        </form>

        <!-- Vertical Milestone Timeline List -->
        <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-right: 4px;">
          ${timeline.length === 0 ? `
            <div style="text-align: center; padding: 30px; color: ${subtextColor};">
              <p style="font-size: 14px;">No milestones logged yet.</p>
              <span style="font-size: 12px;">Use the form above or ask an AI agent via WebMCP to record the first growth milestone.</span>
            </div>
          ` : timeline.map(entry => {
            const isAgent = entry.source === 'agent';
            const badgeBg = isAgent ? 'rgba(82, 183, 136, 0.2)' : 'rgba(0, 0, 0, 0.06)';
            const badgeBorder = isAgent ? 'rgba(82, 183, 136, 0.4)' : 'rgba(0, 0, 0, 0.12)';
            const badgeColor = isAgent ? (isDark ? '#A7F3D0' : '#154212') : (isDark ? '#E1E8E0' : '#556353');
            const badgeLabel = isAgent ? '🤖 via WebMCP Agent' : '👤 by you';

            return `
              <div style="display: flex; gap: 14px; padding: 14px; border-radius: 18px; background: ${inputBg}; border: 1px solid ${inputBorder};">
                <div style="width: 38px; height: 38px; border-radius: 12px; background: ${isAgent ? '#52B788' : '#10B981'}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; shrink-0;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">${isAgent ? 'bolt' : 'eco'}</span>
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <h4 style="font-size: 14px; font-weight: 700; color: ${textColor}; margin: 0;">${entry.milestone}</h4>
                    <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor};">
                      ${badgeLabel}
                    </span>
                  </div>
                  <div style="display: flex; gap: 12px; font-size: 12px; color: ${subtextColor};">
                    <span>📅 ${entry.date || 'Recent'}</span>
                    ${entry.height_cm ? `<span>📏 ${entry.height_cm} cm</span>` : ''}
                  </div>
                  ${entry.notes ? `<p style="font-size: 12px; color: ${subtextColor}; margin: 6px 0 0 0; font-style: italic;">"${entry.notes}"</p>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Bind Close
    modalOverlay.querySelector('#close-journal-btn')?.addEventListener('click', () => {
      modalOverlay.remove();
      onClose();
    });

    // Bind Form Submit
    const form = modalOverlay.querySelector('#add-milestone-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const milestoneInput = modalOverlay.querySelector('#milestone-text-input');
      const heightInput = modalOverlay.querySelector('#height-num-input');
      const btn = modalOverlay.querySelector('#submit-milestone-btn');

      const milestone = milestoneInput?.value?.trim();
      const height_cm = heightInput?.value ? Number(heightInput.value) : null;

      if (!milestone) return;

      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        await logGrowth({
          plant_id: plant.id,
          milestone,
          height_cm,
          source: 'human'
        });
        // Append locally to timeline
        timeline.unshift({
          id: String(Date.now()),
          milestone,
          height_cm,
          date: new Date().toISOString().split('T')[0],
          source: 'human'
        });
        renderModalContent();
      } catch {
        timeline.unshift({
          id: String(Date.now()),
          milestone,
          height_cm,
          date: new Date().toISOString().split('T')[0],
          source: 'human'
        });
        renderModalContent();
      }
    });
  }

  renderModalContent();
  container.appendChild(modalOverlay);
}
