/**
 * client/src/state/store.js — reactive pub/sub event bus + read cache
 * --------------------------------------------------------------------
 * The single mechanism that keeps the human UI and the WebMCP tool layer in
 * sync (C5). Logic modules emit events after successful API mutations; UI
 * components subscribe and re-render. Framework-agnostic, ~tiny (ADR-003).
 *
 * Server (PostgreSQL) is the state AUTHORITY (ADR-011); this store is only a
 * client-side read cache + event channel. All writes go through the API.
 */

/** @typedef {'plants-changed'|'care-logged'|'growth-logged'|'weather-updated'|'auth-changed'} StoreEvent */

const listeners = new Map(); // event -> Set<callback>
const cache = new Map();     // key -> cached read value

/**
 * Subscribe to an event. Returns an unsubscribe function.
 * @param {StoreEvent} event
 * @param {() => void} cb
 */
export function on(event, cb) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(cb);
  return () => off(event, cb);
}

/** Unsubscribe a callback from an event. */
export function off(event, cb) {
  listeners.get(event)?.delete(cb);
}

/**
 * Emit an event to all subscribers. Errors in one subscriber don't break others.
 * @param {StoreEvent} event
 */
export function emit(event) {
  const set = listeners.get(event);
  if (!set) return;
  for (const cb of [...set]) {
    try {
      cb();
    } catch (err) {
      console.error(`[store] subscriber error on "${event}":`, err);
    }
  }
}

/** Cache a read value (for fast render / offline display). */
export function setCache(key, value) {
  cache.set(key, value);
}

/** Read a cached value (undefined if absent). */
export function getCache(key) {
  return cache.get(key);
}

/** Clear cached reads (e.g. on logout). */
export function clearCache() {
  cache.clear();
}
