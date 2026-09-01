/**
 * index.js — Express bootstrap (PlantNeeds API)
 * ----------------------------------------------
 * Mounts routes, runs idempotent migrations on boot, exposes /api/health for
 * Render + smoke tests. Business logic lives in server/logic/ (C4); routes are
 * thin validators that delegate.
 */
import express from 'express';
import { runMigrations } from './db/migrate.js';
import { dbUp } from './db/pool.js';
import authRoutes from './routes/auth.js';
import plantRoutes from './routes/plants.js';
import weatherRoutes from './routes/weather.js';
import diagnoseRoutes from './routes/diagnose.js';
import plannerRoutes from './routes/planner.js';

const app = express();
app.use(express.json());

// --- Routes (all under /api) ---
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/diagnose', diagnoseRoutes);
app.use('/api/planner', plannerRoutes);

// --- Health (public; used by Render healthCheckPath + smoke tests) ---
app.get('/api/health', async (_req, res) => {
  const up = await dbUp();
  res.status(up ? 200 : 503).json({
    status: up ? 'ok' : 'degraded',
    db: up ? 'up' : 'down',
    time: new Date().toISOString(),
  });
});

// --- 404 + error handler ---
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

async function start() {
  // Migrations must succeed before we accept traffic — but don't crash the
  // process if the DB isn't reachable yet (Render may start the web service
  // before Postgres is ready); /api/health will report db:down until it is.
  try {
    await runMigrations();
  } catch (err) {
    console.warn('[db] migrations deferred (DB unreachable?):', err.message);
  }
  app.listen(PORT, () => console.log(`[api] PlantNeeds API listening on :${PORT}`));
}

// Run only when executed directly (so tests can import `app` without listening).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMain) start();

export default app;
