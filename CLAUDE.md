# CLAUDE.md — PlantNeeds Project Guide for AI Agents

> **Read this first.** This file orients any AI coding agent (Claude Code, Cursor, Copilot, etc.) working in this repository. It explains what we're building, the non-negotiable rules, and where every piece of documentation lives.

---

## 🌱 Project in One Paragraph

**PlantNeeds** is a WebMCP-powered web app (built for [The WebMCP Challenge](https://webmcp.devpost.com/) hackathon) that helps people keep plants alive. Users log their plants; the app schedules care, checks **real weather** (Open-Meteo API) to skip watering outdoor plants when it rained, and **diagnoses sick plants** from symptoms cross-referenced with actual care history. The killer feature: the page registers **7 WebMCP tools** via `document.modelContext.registerTool()` so AI agents (e.g., ChatGPT's browser) can operate the app directly — and the **visual UI updates live** when an agent acts.

**One-line pitch:** *"Plant apps today are reference books. PlantNeeds is a gardener."*

---

## ⛔ Non-Negotiable Constraints (Read Before Writing Code)

> ⚠️ **Revised 2026-08-28:** the project moved from local-first to a **server-backed architecture** ([[docs/decisions#ADR-009: Add a backend — Node/Express + PostgreSQL on Render|ADR-009]]). C1/C2 below replace the old "no backend / no accounts" rules.

| # | Rule | Reason |
|---|---|---|
| C1 | **Backend: Node/Express + PostgreSQL on Render.** Static frontend + Web Service API + managed Postgres. | Server-side accounts & persistence — [[docs/architecture]], [[docs/deployment]] |
| C2 | **User accounts (username + password, hashed) + JWT auth.** All plant data lives server-side, scoped per user. | Multi-user, cross-device — [[docs/backend-api]], [[docs/database-schema]] |
| C3 | **No third-party keyed APIs for core features.** Open-Meteo stays keyless. (We DO hold our own `DATABASE_URL` + `JWT_SECRET` as env vars.) | Zero-config external deps |
| C4 | **Shared logic: UI handlers and WebMCP tool `execute()` hit the SAME API endpoints; business logic lives on the server.** | Single source of truth — [[docs/architecture]] |
| C5 | **Every agent tool call must visibly update the UI.** | The demo superpower — [[docs/ui-ux-overview]] |
| C6 | **App must fully work for humans with NO agent present.** | Graceful degradation |
| C7 | **Tool descriptions are UX for AI — write them carefully.** | Agents pick tools by reading descriptions |
| C8 | **All tools must be non-trivial** (real logic, not stubs). | Judging criterion: "WebMCP Leverage" |

---

## 📚 Documentation Map (This Vault)

This repo is an **Obsidian vault** with wiki-links. Follow the links — everything connects.

### Core Documents
| Document | Purpose | When to Read |
|---|---|---|
| [[PlantNeeds-SRD]] | Full Software Requirements Document (17 sections) | Understanding the "what & why" |
| [[plan]] | 10-day build roadmap with phases & daily tasks | Planning work, tracking progress |
| [[specification]] | Technical specification (data shapes, function signatures) | Before writing ANY code |

### Deep-Dive Docs (`docs/`)
| Document | Purpose |
|---|---|
| [[docs/architecture]] | Client+server sync pattern (UI ↔ tools ↔ API ↔ Postgres), tech stack, module layout |
| [[docs/webmcp-tools]] | All 7 tool schemas, execute() pseudocode, description-writing rules |
| [[docs/backend-api]] | REST API: auth + all endpoints, request/response, how tools call them |
| [[docs/database-schema]] | PostgreSQL DDL — users, plants, care_log, growth_log |
| [[docs/data-model]] | Server data model + API payload mapping, plant database format |
| [[docs/diagnosis-engine]] | Symptom matrix, likelihood scoring algorithm (server-side) |
| [[docs/api-integrations]] | Open-Meteo API: endpoints, response shapes, caching, fallback |
| [[docs/ui-ux-overview]] | Components, live-sync mechanism, state flow (⚠️ visual design still TBD) |
| [[docs/testing-strategy]] | Test matrix incl. API/auth tests + WebMCP-in-Chrome & ChatGPT-browser |
| [[docs/deployment]] | Render: Static frontend + Web Service + managed Postgres |
| [[docs/decisions]] | Architecture Decision Records (ADRs) — WHY choices were made |
| [[docs/graph-sync]] | How Obsidian ⇄ Graphify stay synchronized |

### Working Files (`tasks/`)
| Document | Purpose |
|---|---|
| [[tasks/kanban]] | Master task board (backlog → in-progress → done) |
| [[tasks/day-01]] … [[tasks/day-10]] | Daily checklists with acceptance criteria |

### Visual Maps (Obsidian Canvas — open in Obsidian)
| Canvas | Shows |
|---|---|
| `canvas/PlantNeeds-System.canvas` | Original concept: users, UI layer, tool layer, state, external API |
| `canvas/System-Backend.canvas` | **Current architecture:** client (UI+tools) → API → server logic → Postgres |
| `canvas/WebMCP-Tools.canvas` | The 7 tools, their inputs/outputs, and which UI they update |
| `canvas/Build-Plan.canvas` | 10-day plan as a visual timeline with dependencies |

### Knowledge Graph
- **Obsidian Graph View** — open Obsidian → Graph icon. All wiki-links form the graph.
- **Graphify** — `.graphify/graph.json` mirrors the vault's doc graph. Keep in sync by running `python scripts/sync-graphify.py` after adding/renaming docs. See [[docs/graph-sync]].

---

## 🏗️ Planned Code Structure (to be created)

```
PlantNeeds/
├── client/                       # Static frontend (Render Static Site)
│   ├── index.html
│   └── src/
│       ├── main.js               # App bootstrap
│       ├── api/
│       │   └── client.js         # fetch wrapper: base URL + JWT header + refresh
│       ├── state/
│       │   └── store.js          # Reactive store (UI + tools subscribe)
│       ├── logic/                # ⭐ CLIENT ORCHESTRATION (C4: UI & tools BOTH call these)
│       │   ├── plants.js         # calls server API: addPlant, waterPlant, getSchedule...
│       │   ├── weather.js        # getWateringForecast (via server proxy)
│       │   └── diagnose.js       # diagnoseProblem (via server API)
│       ├── tools/
│       │   └── register-tools.js # All 7 registerTool() calls (thin wrappers over logic/)
│       ├── ui/
│       │   ├── components/       # PlantCard, Dashboard, DiagnosisPanel, AuthForm...
│       │   └── render.js
│       └── data/
│           ├── plants-db.json    # ~50 species care profiles (static reference)
│           └── symptoms-matrix.json # (reference; canonical copy also server-side)
├── server/                       # Backend API (Render Web Service)
│   ├── index.js                  # Express bootstrap
│   ├── db/
│   │   ├── pool.js               # pg Pool (DATABASE_URL)
│   │   └── migrate.sql           # DDL (see docs/database-schema)
│   ├── middleware/
│   │   └── auth.js               # JWT verify -> req.userId
│   ├── routes/
│   │   ├── auth.js               # POST /api/auth/register, /login, /me
│   │   ├── plants.js             # CRUD + schedule + care log
│   │   ├── weather.js            # GET /api/weather/forecast (Open-Meteo proxy + cache)
│   │   ├── diagnose.js           # POST /api/diagnose (symptom scoring)
│   │   └── planner.js            # growth log + seasonal planting
│   └── logic/                    # ⭐ BUSINESS LOGIC (single source of truth, C4)
│       ├── plants.js  weather.js  diagnose.js  planner.js
└── tests/                        # client logic + server route tests
```

**Key change:** business logic moved from the browser to `server/logic/`. Both the human UI and the WebMCP tools call the same REST endpoints (C4). The server owns all state (Postgres); the client is a reactive view + agent tool layer.

---

## ✅ Definition of Done (per feature)

1. Server endpoint works and is unit/route-testable (business logic in `server/logic/`)
2. UI button AND the matching tool's `execute()` both call that endpoint via `client/logic/` (same path!)
3. State change re-renders affected UI without page refresh (client store refresh after mutation)
4. Endpoint requires valid JWT and scopes data to the authenticated user
5. Tool verified callable in Chrome with `chrome://flags/#enable-webmcp-testing`
6. Task checked off in the relevant [[tasks/kanban|day note]]

---

## 🎯 Current Status

| Area | Status |
|---|---|
| Requirements (SRD) | ✅ Complete |
| Documentation vault | ✅ Complete |
| UI/visual design | 🔶 **In discussion — DO NOT hardcode a design system** (see [[docs/ui-ux-overview]]) |
| Code | ⬜ Not started — begin with [[plan]] Phase 1 |

**When in doubt:** read the SRD section, then the matching deep-dive doc, then ask the human. Never invent scope beyond [[PlantNeeds-SRD#3. Goals & Non-Goals|the Goals list]].
