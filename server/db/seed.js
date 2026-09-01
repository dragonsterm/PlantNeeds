/**
 * db/seed.js — load plants-db.json (server canonical copy).
 * ----------------------------------------------------------
 * The plant species database is static reference data (NOT user data), so it
 * lives as JSON rather than in Postgres (docs/database-schema.md §Static
 * Reference Data). The server keeps the canonical copy at server/data/
 * plants-db.json; this script validates + loads it into memory for species
 * matching at POST /plants.
 *
 * Run directly (`npm run seed`) to validate the JSON ships correctly.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'plants-db.json');

let cache = null;

/** Load (and memoize) the species database. Returns an object keyed by species id. */
export async function loadPlantsDb() {
  if (cache) return cache;
  const raw = await readFile(DB_PATH, 'utf8');
  cache = JSON.parse(raw);
  return cache;
}

// Validate when run directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loadPlantsDb()
    .then((db) => {
      const count = Object.keys(db).length;
      console.log(`[seed] plants-db.json OK — ${count} species loaded`);
      if (count === 0) {
        console.warn('[seed] ⚠️  database is empty — Day 2 (T-03) adds ~50 species');
      }
    })
    .catch((err) => {
      console.error('[seed] failed to load plants-db.json:', err.message);
      process.exitCode = 1;
    });
}
