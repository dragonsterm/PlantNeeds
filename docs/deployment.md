---
tags: [deployment, render, docs]
type: doc
---
# 🚀 Deployment — Render

> **Status: server-backed (revised 2026-08-28, [[docs/decisions#ADR-009: Add a backend — Node/Express + PostgreSQL on Render|ADR-009]]).** How PlantNeeds ships to production on Render.
> **⚠️ NOTE: this doc is about the APP deployment. The Obsidian vault itself is local-only and is NOT deployed** (see "Vault vs App" below).

## Vault vs App (important distinction)

| | Obsidian Vault (`C:\Project\PlantNeeds`) | The App (`client/` + `server/`) |
|---|---|---|
| What | Documentation, plans, canvas, knowledge graph | The actual web application |
| Deployed? | **NO** — local + git only | **YES** — Render (Static + Web Service + Postgres) |
| Graphify role | `.graphify/graph.json` mirrors doc links | none |

The graph-sync setup ([[docs/graph-sync]]) is unaffected by hosting — it runs locally via `python scripts/sync-graphify.py`.

## Render Topology (3 resources)

| Resource | Type | Purpose |
|---|---|---|
| `plantneeds-web` | **Static Site** | serves the `client/` build |
| `plantneeds-api` | **Web Service** | runs the `server/` Node/Express API |
| `plantneeds-db` | **PostgreSQL** (managed) | persistent data ([[docs/database-schema]]) |

Render is a WebMCP Challenge sponsor ($300 credits/winner) — thematically aligned and free-tier friendly.

### Which Render products we do NOT use
| Product | Why not |
|---|---|
| Workflows | Long-running background jobs — none needed |
| Cron Jobs | Nothing scheduled server-side |
| Key Value | Postgres covers persistence |

## `render.yaml` (Infrastructure as Code)

Commit at repo root so the whole stack is reproducible:

```yaml
services:
  # --- Static frontend ---
  - type: web
    name: plantneeds-web
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: client/dist
    routes:
      - type: rewrite            # SPA fallback
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        value: https://plantneeds-api.onrender.com

  # --- Backend API ---
  - type: web
    name: plantneeds-api
    env: node
    rootDir: server
    buildCommand: npm install
    startCommand: node index.js
    healthCheckPath: /api/health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: plantneeds-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production

databases:
  - name: plantneeds-db
    plan: free                     # free Postgres (expires after 30 days — fine for hackathon demo)
```

## Environment Variables

| Var | Where | Notes |
|---|---|---|
| `DATABASE_URL` | Web Service | from managed Postgres (auto-injected) |
| `JWT_SECRET` | Web Service | generated secret ([[docs/decisions#ADR-010: Authentication — username/password + JWT (bcrypt hash)|ADR-010]]) |
| `VITE_API_URL` | Static Site | API base URL baked into client build |
| `NODE_ENV` | Web Service | `production` |

**Never commit secrets.** Only `.env.example` (placeholder names) may be committed.

## Database Migrations

`server/db/migrate.sql` runs idempotently (`IF NOT EXISTS`) on Web Service startup, or manually via the Render shell:
```bash
psql $DATABASE_URL -f db/migrate.sql
```
Requires `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (for `gen_random_uuid()`).

## Pre-Deploy Checklist ([[tasks/day-09|Day 9]])

- [ ] `client`: `npm run build` succeeds; `dist/` works via `npx serve`
- [ ] `server`: boots locally against a local/test Postgres; `/api/health` returns `db: up`
- [ ] Register → login → add plant → log care works end-to-end over HTTP + JWT
- [ ] WebMCP tools register when served over **HTTPS** (Render provides it)
- [ ] `render.yaml` committed; env vars set on Render dashboard
- [ ] After deploy: run the full E2E agent scenario on the **live URL** in ChatGPT's browser ([[docs/testing-strategy#3. E2E Agent Scenario (manual — ChatGPT in-app browser)|E2E]])

## Availability & Cost

- Static Site: free, global CDN, no cold starts
- Web Service: free tier (spins down on idle — first request may be slow; acceptable for demo)
- Postgres free plan: **expires after 30 days** — fine for the hackathon window; upgrade if the app lives longer
- Deploy history → one-click rollback per service

**Related:** [[docs/architecture]] · [[docs/backend-api]] · [[docs/database-schema]] · [[docs/decisions]] · [[tasks/day-09]] · [[plan]]
