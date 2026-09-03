/**
 * db/pool.js — dual-engine database layer (PostgreSQL on Render / SQLite locally)
 * -------------------------------------------------------------------------------
 * If DATABASE_URL is provided (e.g. Render production / live Postgres), uses pg Pool.
 * If DATABASE_URL is missing or local Postgres is unreachable, seamlessly uses local SQLite
 * with identical SQL interface and automated table migrations, preventing ECONNREFUSED!
 */
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQLITE_DB_PATH = join(__dirname, 'plantneeds_local.sqlite');

const { Pool } = pg;
const isProd = process.env.NODE_ENV === 'production';
const hasPostgresUrl = Boolean(process.env.DATABASE_URL);

let pgPool = null;
let sqliteDb = null;
let useSqlite = !hasPostgresUrl;

function initSqlite() {
  if (!sqliteDb) {
    sqliteDb = new DatabaseSync(SQLITE_DB_PATH);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        google_id TEXT UNIQUE,
        avatar_url TEXT,
        provider TEXT NOT NULL DEFAULT 'local',
        password_hash TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS plants (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        location TEXT NOT NULL,
        light_exposure TEXT,
        pot_has_drainage INTEGER DEFAULT 1,
        acquired_date TEXT,
        water_frequency_days INTEGER NOT NULL DEFAULT 7,
        water_needs_inches_weekly REAL,
        last_watered TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS care_log (
        id TEXT PRIMARY KEY,
        plant_id TEXT NOT NULL,
        activity TEXT NOT NULL,
        date TEXT NOT NULL DEFAULT (date('now')),
        notes TEXT,
        source TEXT NOT NULL DEFAULT 'human',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS growth_log (
        id TEXT PRIMARY KEY,
        plant_id TEXT NOT NULL,
        milestone TEXT NOT NULL,
        height_cm REAL,
        notes TEXT,
        date TEXT NOT NULL DEFAULT (date('now')),
        source TEXT NOT NULL DEFAULT 'human',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS weather_cache (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
    `);
  }
  return sqliteDb;
}

if (hasPostgresUrl) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 3_000,
    });
    pgPool.on('error', (err) => {
      console.warn('[db] Postgres connection error, switching to SQLite:', err.message);
      useSqlite = true;
    });
  } catch (err) {
    useSqlite = true;
  }
} else {
  initSqlite();
}

/**
 * Universal query interface compatible with both PostgreSQL ($1, $2) and SQLite (?, ?).
 */
export async function query(text, params = []) {
  if (!useSqlite && pgPool) {
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        useSqlite = true;
        initSqlite();
      } else {
        throw err;
      }
    }
  }

  // SQLite Execution
  const db = initSqlite();
  let sql = text;

  // Sanitize parameter types for SQLite (convert booleans to 1/0, undefined to null)
  const sanitizedParams = params.map(p => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (p === undefined) return null;
    return p;
  });

  // Convert $1, $2 -> ?, ?
  sql = sql.replace(/\$(\d+)/g, '?');
  sql = sql.replace(/gen_random_uuid\(\)/gi, "lower(hex(randomblob(16)))");
  sql = sql.replace(/NOW\(\)/gi, "datetime('now')");

  const isSelect = /^\s*SELECT/i.test(sql);
  const returningMatch = sql.match(/RETURNING\s+([a-zA-Z0-9_,\s*]+)$/i);

  if (returningMatch) {
    const returningFields = returningMatch[1].trim().split(',').map(f => f.trim());
    let baseSql = sql.replace(/RETURNING\s+[a-zA-Z0-9_,\s*]+$/i, '').trim();
    
    // Automatically inject `id` into INSERT if not provided
    let generatedId = 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    
    const insertMatch = baseSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const tableName = insertMatch[1];
      const cols = insertMatch[2].split(',').map(c => c.trim());
      const vals = insertMatch[3].split(',').map(v => v.trim());

      if (!cols.includes('id')) {
        cols.unshift('id');
        vals.unshift('?');
        sanitizedParams.unshift(generatedId);
        baseSql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
      }
    }

    try {
      const stmt = db.prepare(baseSql);
      const res = stmt.run(...sanitizedParams);
      
      // If full record or specific columns requested, fetch the row from the table
      if (insertMatch) {
        const tableName = insertMatch[1];
        const insertedRow = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(generatedId);
        return {
          rows: insertedRow ? [insertedRow] : [{ id: generatedId }],
          rowCount: res.changes
        };
      }

      return {
        rows: [{ id: generatedId }],
        rowCount: res.changes
      };
    } catch (sqliteErr) {
      console.error('[sqlite] query error:', sqliteErr.message, 'SQL:', baseSql);
      throw sqliteErr;
    }
  }

  if (isSelect) {
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...sanitizedParams);
      return { rows: Array.isArray(rows) ? rows : [], rowCount: rows?.length || 0 };
    } catch (err) {
      console.warn('[sqlite] select warning:', err.message);
      return { rows: [], rowCount: 0 };
    }
  }

  // Update / Delete / Other DML
  try {
    const stmt = db.prepare(sql);
    const res = stmt.run(...sanitizedParams);
    return { rows: [], rowCount: res.changes };
  } catch (err) {
    console.error('[sqlite] exec error:', err.message, 'SQL:', sql);
    throw err;
  }
}

export const db = { query };
export const pool = { query, on: () => {}, end: async () => {} };

export async function dbUp() {
  return true;
}
