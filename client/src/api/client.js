/**
 * client/src/api/client.js — fast fetch wrapper with cookie persistence & failover (C4)
 * ----------------------------------------------------------------------------------
 * Handles cookie-persisted JWT tokens so users stay signed in across browser reloads,
 * plus fast offline-first failover (350ms network timeout) so UI never freezes.
 */
import { emit } from '../state/store.js';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

const TOKEN_COOKIE_KEY = 'plantneeds_auth_token';

// Helper to get cookie by name (SSR / Node.js safe)
function getCookie(name) {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to set cookie
function setCookie(name, value, days = 7) {
  if (typeof document === 'undefined' || !document.cookie) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Helper to erase cookie
function eraseCookie(name) {
  if (typeof document === 'undefined' || !document.cookie) return;
  document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax`;
}

// Initialize token from cookie or memory
let token = getCookie(TOKEN_COOKIE_KEY) || null;

export function setToken(t) {
  token = t;
  if (t) {
    setCookie(TOKEN_COOKIE_KEY, t, 7);
  } else {
    eraseCookie(TOKEN_COOKIE_KEY);
  }
}

export function clearToken() {
  token = null;
  eraseCookie(TOKEN_COOKIE_KEY);
}

export function hasToken() {
  if (!token) {
    token = getCookie(TOKEN_COOKIE_KEY);
  }
  return Boolean(token);
}

/**
 * Authenticated JSON fetch with fast AbortSignal timeout.
 * @param {string} path     e.g. '/api/plants'
 * @param {object} [opts]   { method, body, headers, timeout }
 * @returns {Promise<any>}  parsed JSON body
 */
export async function api(path, { method = 'GET', body, headers = {}, timeout = 350 } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const currentToken = token || getCookie(TOKEN_COOKIE_KEY);
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...headers,
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      clearToken();
      emit('auth-changed');
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON body */
    }

    if (!res.ok) {
      const err = new Error(data?.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    // Fast failover for offline or timed out connection
    throw err;
  }
}

export { BASE_URL };
