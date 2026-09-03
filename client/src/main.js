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

async function handleOAuthParams() {
  // Check URL search query (e.g. ?token=... from backend redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const queryToken = urlParams.get('token');
  const queryUsername = urlParams.get('username');

  if (queryToken) {
    setToken(queryToken);
    if (queryUsername) localStorage.setItem('plantneeds_username', decodeURIComponent(queryUsername));
    history.replaceState(null, '', window.location.pathname + window.location.hash);
    
    // Fetch real profile from server
    try {
      const meRes = await api('/api/auth/me');
      if (meRes && meRes.user) {
        if (meRes.user.username) localStorage.setItem('plantneeds_username', meRes.user.username);
        if (meRes.user.email) localStorage.setItem('plantneeds_email', meRes.user.email);
        if (meRes.user.avatar_url) localStorage.setItem('plantneeds_avatar', meRes.user.avatar_url);
        if (meRes.user.provider) localStorage.setItem('plantneeds_provider', meRes.user.provider);
      }
    } catch {}
    
    emit('auth-changed');
    return;
  }

  // Check URL hash (e.g. #id_token=...)
  const hash = window.location.hash || '';
  if (hash.includes('id_token=') || hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');

    history.replaceState(null, '', window.location.pathname + window.location.search);

    try {
      const result = await api('/api/auth/google', {
        method: 'POST',
        body: {
          credential: idToken,
          accessToken
        }
      });

      if (result && result.token) {
        setToken(result.token);
        if (result.user) {
          if (result.user.username) localStorage.setItem('plantneeds_username', result.user.username);
          if (result.user.email) localStorage.setItem('plantneeds_email', result.user.email);
          if (result.user.avatar_url) localStorage.setItem('plantneeds_avatar', result.user.avatar_url);
          if (result.user.provider) localStorage.setItem('plantneeds_provider', result.user.provider);
        }
        emit('auth-changed');
      }
    } catch (err) {
      console.warn('[auth] OAuth hash verification warning:', err.message);
    }
  }
}

async function refreshUserProfile() {
  try {
    const meRes = await api('/api/auth/me');
    if (meRes && meRes.user) {
      if (meRes.user.username) localStorage.setItem('plantneeds_username', meRes.user.username);
      if (meRes.user.email) localStorage.setItem('plantneeds_email', meRes.user.email);
      if (meRes.user.avatar_url) localStorage.setItem('plantneeds_avatar', meRes.user.avatar_url);
      if (meRes.user.provider) localStorage.setItem('plantneeds_provider', meRes.user.provider);
      emit('auth-changed');
    }
  } catch {}
}

async function boot() {
  await handleOAuthParams();
  refreshUserProfile();
  mountUi();
  registerAllTools();
  initToastSubscriptions();
  console.info('[app] PlantNeeds client booted with WebMCP & Live-Sync');
}

boot();
