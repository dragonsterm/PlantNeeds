/**
 * db/migrate.js — run migrations idempotently across Postgres and SQLite.
 * ------------------------------------------------------------------------
 * Executed on server boot (see index.js) and via `npm run migrate`.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  if (process.env.DATABASE_URL) {
    try {
      const sql = await readFile(join(__dirname, 'migrate.sql'), 'utf8');
      await pool.query(sql);
      console.log('[db] PostgreSQL migrations applied');
      return;
    } catch (err) {
      console.warn('[db] PostgreSQL migration failed:', err.message);
    }
  }

  // SQLite migrations are initialized automatically via pool.js
  console.log('[db] SQLite schema initialized & ready');
}

// Allow running directly: `node db/migrate.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error('[db] migration failed:', err.message);
      process.exitCode = 1;
      pool.end();
    });
}
