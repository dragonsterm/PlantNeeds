/**
 * client/src/api/client.js — fetch wrapper (base URL + JWT + refresh)
 * --------------------------------------------------------------------
 * ALL client/logic functions use this — never raw fetch. Attaches the JWT,
 * handles 401 (expired/invalid token) by bouncing to the auth screen, and
 * normalizes errors to { error } JSON (docs/backend-api.md §Conventions).
 */
import { emit } from '../state/store.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
 * Authenticated JSON fetch.
 * @param {string} path     e.g. '/api/plants'
 * @param {object} [opts]   { method, body, headers }
 * @returns {Promise<any>}  parsed JSON body
 * @throws  {Error}         with .status for callers to branch on
 */
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    emit('auth-changed'); // bounce to login
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body — leave data null */
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export { BASE_URL };
