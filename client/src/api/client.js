/**
 * client/src/api/client.js — fast fetch wrapper with cookie + localStorage dual-persistence (C4)
 * ---------------------------------------------------------------------------------------------
 * Dual-persists JWT tokens in both cookie (SameSite=Lax, Secure over HTTPS) and localStorage,
 * guaranteeing the user stays logged in across refreshes on Render and all browsers.
 */
import { emit } from '../state/store.js';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

const TOKEN_KEY = 'plantneeds_auth_token';

// Helper to get cookie by name
function getCookie(name) {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to set cookie with HTTPS detection
function setCookie(name, value, days = 14) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

// Helper to erase cookie
function eraseCookie(name) {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

// Read token from cookie or localStorage or in-memory
export function readStoredToken() {
  if (typeof window === 'undefined') return null;
  let localVal = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localVal = localStorage.getItem(TOKEN_KEY);
    }
  } catch {}
  return getCookie(TOKEN_KEY) || localVal || null;
}

let token = readStoredToken();

export function setToken(t) {
  token = t;
  if (t) {
    setCookie(TOKEN_KEY, t, 14);
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {}
  } else {
    eraseCookie(TOKEN_KEY);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
}

export function clearToken() {
  token = null;
  eraseCookie(TOKEN_KEY);
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('plantneeds_local_plants');
  } catch {}
}

export function hasToken() {
  if (!token) {
    token = readStoredToken();
  }
  return Boolean(token);
}

/**
 * Authenticated JSON fetch with production-ready timeout (30s for Render cold starts).
 * @param {string} path     e.g. '/api/plants'
 * @param {object} [opts]   { method, body, headers, timeout }
 * @returns {Promise<any>}  parsed JSON body
 */
export async function api(path, { method = 'GET', body, headers = {}, timeout = 30000 } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const currentToken = token || readStoredToken();
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
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Connection timed out. Render backend may be spinning up from sleep, please try again in a few seconds.');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    throw err;
  }
}

export { BASE_URL };
