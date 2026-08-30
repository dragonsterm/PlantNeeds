---
tags: [deployment, render, docs]
type: doc
---
# 🚀 Deployment — Render

> How PlantNeeds ships to production. Platform: **Render** (chosen in [[docs/decisions#ADR-008: Deploy to Render (not Vercel/Netlify)|ADR-008]]).
> **⚠️ NOTE: this doc is about the APP deployment. The Obsidian vault itself is local-only and is NOT deployed** (see "Vault vs App" below).

## Vault vs App (important distinction)

| | Obsidian Vault (`C:\Project\PlantNeeds`) | The App (future `src/` code) |
|---|---|---|
| What | Documentation, plans, canvas, knowledge graph | The actual web application |
| Deployed? | **NO** — local + git only | **YES** — Render Static Site |
| Graphify role | `.graphify/graph.json` mirrors doc links | none |

The graph-sync setup ([[docs/graph-sync]]) is entirely unaffected by hosting — it runs locally via `python scripts/sync-graphify.py`.

## Why Render (and not Workflows)

Render has several products. Choosing correctly matters:

| Render product | Fits PlantNeeds? | Why |
|---|---|---|
| **Static Sites** | ✅ **YES — use this** | Hosts our Vite build output; free tier; global CDN; automatic HTTPS; auto-deploy from git |
| Workflows | ❌ No | Long-running background tasks in ephemeral containers — we have no backend jobs (constraint C1/C2) |
| Web Services | ❌ No | For servers — we deliberately have none |
| Cron Jobs | ❌ No | Nothing scheduled server-side |

**Bonus:** Render is a WebMCP Challenge sponsor ($300 credits for winners) — deploying on Render is thematically aligned and free regardless.

## Deployment Configuration

### Build & Publish Settings
| Setting | Value |
|---|---|
| Service type | **Static Site** |
| Repository | the public GitHub repo (hackathon requires it anyway) |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Auto-deploy | On commit to `main` (default) |

### `render.yaml` (Infrastructure as Code — optional but recommended)

Commit at repo root so the deploy is reproducible and visible to judges:

```yaml
services:
  - type: web                     # 'web' + env: static = Static Site
    name: plantneeds
    env: static
    buildCommand: npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite             # SPA fallback: all paths -> index.html
        source: /*
        destination: /index.html
    headers:
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /assets/*
        name: Cache-Control
        value: public, max-age=31536000, immutable   # Vite hashed assets
```

### SPA Routing Note
PlantNeeds is a single-page app. The rewrite rule above ensures deep links serve `index.html` instead of 404ing.

## Pre-Deploy Checklist ([[tasks/day-09|Day 9]])

- [ ] `npm run build` succeeds locally with no warnings
- [ ] `dist/` loads via any static server (`npx serve dist`) — all features work
- [ ] WebMCP tools register when served over **HTTPS** (Render provides it — required since some browser capabilities are secure-context only)
- [ ] No secrets in repo (we have none — keyless API only, constraint C3)
- [ ] `render.yaml` committed
- [ ] After deploy: run the full E2E scenario on the **live URL** in ChatGPT's browser ([[docs/testing-strategy#3. E2E Agent Scenario (manual — ChatGPT in-app browser)|E2E test]])

## Rollback & Availability

- Render keeps deploy history → one-click rollback to any previous deploy
- Free static sites are served from a global CDN — no cold starts, no server to crash during judging (supports ADR-001's availability goal)

**Related:** [[docs/architecture]] · [[docs/decisions]] · [[tasks/day-09]] · [[plan]]
