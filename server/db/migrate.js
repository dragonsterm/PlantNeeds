/**
 * db/migrate.js — run migrate.sql idempotently.
 * ------------------------------------------------
 * Executed on server boot (see index.js) and via `npm run migrate`.
 * Safe to re-run: the DDL uses IF NOT EXISTS throughout.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  const sql = await readFile(join(__dirname, 'migrate.sql'), 'utf8');
  await pool.query(sql);
  console.log('[db] migrations applied (idempotent)');
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
