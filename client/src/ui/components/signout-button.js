/**
 * client/src/ui/components/signout-button.js — Sign out button component
 */
import { clearToken, hasToken } from '../../api/client.js';
import { emit } from '../../state/store.js';

export function createSignOutButton(container) {
  if (!hasToken()) return null;

  const button = document.createElement('button');
  button.textContent = 'Sign Out';
  button.className = 'btn-signout-stitch';
  
  button.style.cssText = `
    padding: 8px 16px;
    background: transparent;
    border: 2px solid #A3D94E;
    border-radius: 20px;
    color: #A3D94E;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;

  button.onmouseover = () => {
    button.style.background = '#A3D94E';
    button.style.color = '#1a1a1a';
  };

  button.onmouseout = () => {
    button.style.background = 'transparent';
    button.style.color = '#A3D94E';
  };

  button.onclick = async () => {
    try {
      // Clear local state
      clearToken();
      emit('auth-changed');
      
      // Navigate to home/login
      window.location.href = '/';
    } catch (err) {
      console.error('[signout] error:', err);
      window.location.reload();
    }
  };

  container.appendChild(button);
  return button;
}

export function renderSignOutModal() {
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  modalOverlay.innerHTML = `
    <div class="glass-panel" style="width: 100%; max-width: 400px; padding: 32px; border-radius: 24px; text-align: center;">
      <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px;">
        Sign out of PlantNeeds?
      </h3>
      
      <p style="color: #ccc; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
        You will need to sign in again to access your plants and care schedule.
      </p>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="cancel-btn" style="
          padding: 12px 24px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        ">Cancel</button>
        
        <button id="confirm-btn" style="
          padding: 12px 24px;
          background: #dc2626;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        ">Yes, Sign Out</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const cancelButton = modalOverlay.querySelector('#cancel-btn');
  const confirmButton = modalOverlay.querySelector('#confirm-btn');

  cancelButton.onclick = () => modalOverlay.remove();
  
  confirmButton.onclick = async () => {
    try {
      clearToken();
      emit('auth-changed');
      modalOverlay.remove();
      window.location.href = '/';
    } catch (err) {
      console.error('[signout-confirm] error:', err);
      modalOverlay.remove();
      window.location.reload();
    }
  };

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}
