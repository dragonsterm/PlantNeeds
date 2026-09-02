/**
 * client/src/api/client.js — fast fetch wrapper with instant timeout & failover (C4)
 * ----------------------------------------------------------------------------------
 * Handles fast offline-first failover (300ms network timeout) so UI never freezes.
 */
import { emit } from '../state/store.js';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

// JWT lives in memory only (never localStorage) — see ADR-010 security notes.
let token = null;

export function setToken(t) {
  token = t;
}

export function clearToken() {
  token = null;
}

export function hasToken() {
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
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
