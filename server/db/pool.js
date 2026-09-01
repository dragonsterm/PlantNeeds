/**
 * db/pool.js — pg Pool (DATABASE_URL)
 * -----------------------------------
 * Single shared connection pool for the whole API. Import `pool` (or the
 * `query` helper) anywhere in server/ — never create ad-hoc clients.
 *
 * Env:
 *   DATABASE_URL  — full postgres connection string (Render injects this)
 *   NODE_ENV      — 'production' enables SSL (Render managed Postgres requires it)
 */
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const isProd = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render managed Postgres requires SSL in production; allow self-signed certs.
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // Idle client errors shouldn't crash the process — log and move on.
  console.error('[db] unexpected idle client error:', err.message);
});

/** Convenience: parameterized query. ALWAYS use $1..$n params — never interpolate. */
export function query(text, params) {
  return pool.query(text, params);
}

/** Export db alias for query */
export const db = { query };

/** Lightweight connectivity check used by /api/health. */
export async function dbUp() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
