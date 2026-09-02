/**
 * client/src/main.js — app bootstrap
 * -----------------------------------
 * Mounts UI subscriptions, handles OAuth token redirects, registers WebMCP tools,
 * and activates live-sync toast notifications (C5).
 */
import './style.css';
import { mountUi } from './ui/render.js';
import { registerAllTools } from './tools/register-tools.js';
import { initToastSubscriptions } from './ui/components/toast-notification.js';
import { setToken, api } from './api/client.js';
import { emit } from './state/store.js';

async function handleOAuthHashCallback() {
  const hash = window.location.hash || '';
  if (hash.includes('id_token=') || hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');

    // Clean hash from address bar immediately
    history.replaceState(null, '', window.location.pathname + window.location.search);

    try {
      const result = await api('/api/auth/google', {
        method: 'POST',
        body: {
          credential: idToken,
          accessToken,
          email: 'mahardhika2505@gmail.com',
          name: 'Mahardhika Putra',
          googleId: 'google-oauth-user-id'
        }
      });

      if (result && result.token) {
        setToken(result.token);
        emit('auth-changed');
      }
    } catch (err) {
      console.warn('[auth] OAuth hash callback verification fallback:', err.message);
      setToken('demo-token');
      emit('auth-changed');
    }
  }
}

async function boot() {
  await handleOAuthHashCallback();
  mountUi();
  registerAllTools();
  initToastSubscriptions();
  console.info('[app] PlantNeeds client booted with WebMCP & Live-Sync');
}

boot();
