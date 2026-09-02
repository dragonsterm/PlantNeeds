/**
 * client/src/ui/components/toast-notification.js
 * Visual Toast Feedback & Agent Pulse animation (Task T-18, Constraint C5).
 * Differentiates agent-initiated mutations (🤖) from human actions (💧).
 */
import { on } from '../../state/store.js';
import { getAppTheme } from '../render.js';

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
}

/**
 * Show a toast notification with live pulse.
 * @param {{ title: string, message: string, source?: 'human'|'agent', duration?: number }} opts
 */
export function showToast({ title, message, source = 'human', duration = 4000 } = {}) {
  ensureToastContainer();

  const isDark = getAppTheme() === 'dark';
  const isAgent = source === 'agent';

  const toast = document.createElement('div');
  toast.className = 'toast-bubble';
  toast.style.cssText = `
    min-width: 280px;
    max-width: 380px;
    padding: 12px 18px;
    border-radius: 20px;
    background: ${isDark ? 'rgba(18, 24, 20, 0.9)' : 'rgba(255, 255, 255, 0.92)'};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid ${isAgent ? '#52B788' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(27,48,34,0.15)')};
    box-shadow: 0 10px 30px rgba(0, 0, 0, ${isDark ? '0.4' : '0.12'});
    color: ${isDark ? '#FFFFFF' : '#1B3022'};
    display: flex;
    align-items: center;
    gap: 12px;
    animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
    transition: all 0.3s ease;
  `;

  const iconBg = isAgent ? '#52B788' : '#10B981';
  const iconSymbol = isAgent ? 'bolt' : 'water_drop';

  toast.innerHTML = `
    <div style="width: 32px; height: 32px; border-radius: 10px; background: ${iconBg}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; shrink-0; box-shadow: 0 4px 10px rgba(82, 183, 136, 0.4);">
      <span class="material-symbols-outlined" style="font-size: 18px;">${iconSymbol}</span>
    </div>
    <div style="flex: 1;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${isAgent ? '#52B788' : (isDark ? '#A7F3D0' : '#154212')}; letter-spacing: 0.5px;">
          ${isAgent ? '🤖 WebMCP Agent' : '💧 Care Logged'}
        </span>
      </div>
      <p style="font-size: 13px; font-weight: 600; margin: 2px 0 0 0; line-height: 1.3;">
        ${title || message}
      </p>
    </div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Initialize reactive store listeners for auto-toasting on WebMCP agent mutations.
 */
export function initToastSubscriptions() {
  on('care-logged', (data) => {
    if (data?.source === 'agent') {
      showToast({
        title: 'Plant Care Logged by Agent',
        message: 'Care task recorded via WebMCP tool',
        source: 'agent'
      });
    }
  });

  on('growth-logged', (data) => {
    showToast({
      title: 'Growth Milestone Logged',
      message: 'New milestone added to Growth Journal',
      source: data?.source === 'agent' ? 'agent' : 'human'
    });
  });

  on('plant-added', (plant) => {
    showToast({
      title: `Plant Added: ${plant?.name || 'New Plant'}`,
      message: 'Added to your garden collection',
      source: 'human'
    });
  });
}
