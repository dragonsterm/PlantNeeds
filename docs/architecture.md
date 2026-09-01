---
tags: [architecture, docs]
type: doc
---
# 🏛️ Architecture

> **Status: server-backed (revised 2026-08-28, [[docs/decisions#ADR-009: Add a backend — Node/Express + PostgreSQL on Render|ADR-009]]).** The structural design of PlantNeeds. For data shapes see [[docs/database-schema]] & [[docs/data-model]]; for endpoints see [[docs/backend-api]]; for function contracts see [[specification]].

## The Big Picture

PlantNeeds serves **two users** — a human (visual UI) and an AI agent (WebMCP tools) — over **one server-side dataset** (PostgreSQL). The whole architecture exists to keep human, agent, and database in sync:

```
        ┌─────────────────────┐         ┌──────────────────────┐
        │      HUMAN UI       │         │   WEBMCP TOOL LAYER  │
        │  buttons, cards,    │         │  7 × registerTool()  │
        │  dashboards         │         │  (agent's menu)      │
        └──────────┬──────────┘         └──────────┬───────────┘
                   │  onClick(...)                 │  execute(...)
                   │                               │
                   └───────────────┬───────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │   CLIENT LOGIC LAYER        │  browser orchestration only
                    │   client/src/logic/*.js     │  (calls API, updates store)
                    └──────────────┬──────────────┘
                                   │  HTTP + JWT (fetch)
                                   ▼
              ╔═══════════════════════════════════════╗
              ║   REST API  (Node/Express, server/)   ║
              ║   /api/auth  /api/plants  /api/...    ║
              ║   middleware/auth.js → req.userId     ║
              ╚──────────────┬────────────────────────╝
                             ▼
              ┌─────────────────────────────┐
              │   SERVER BUSINESS LOGIC     │  ← THE ONLY place
              │   server/logic/*.js         │    business logic lives (C4)
              │   plants, weather, diagnose │
              └──────────────┬──────────────┘
                             │ SQL (parameterized)
                             ▼
              ┌─────────────────────────────┐
              │   PostgreSQL (Render)       │  ← SINGLE SOURCE OF TRUTH
              │   users, plants, care_log,  │     (ADR-011)
              │   growth_log                │
              └─────────────────────────────┘
                             +
              ┌─────────────────────────────┐
              │   Open-Meteo API (keyless)  │  weather, via server proxy+cache
              └─────────────────────────────┘
```

## Why This Pattern (the reasoning)

| Decision | Consequence |
|---|---|
| **Server is state authority (ADR-011)** | Human and agent can never disagree; one dataset, one truth |
| **Business logic on server (C4)** | UI and agent hit the SAME endpoints; logic tested once, server-side |
| **Tools are thin wrappers** | Tool `execute()` → `client/logic/*` → API. Tool bugs = schema bugs only |
| **Per-user scoping (`user_id`)** | Every query filtered by authenticated user — multi-user safe |
| **Client store refresh after mutation (C5)** | Agent calls `log_care_activity` → API writes → client refetches → card animates. Judge *sees* it |
| **JWT auth (ADR-010)** | Stateless API, easy to test, works for browser + agent |

## Auth Flow

```
1. POST /api/auth/register {username, password}   → bcrypt hash → INSERT user
2. POST /api/auth/login    {username, password}   → verify → return { token (JWT) }
3. Client stores JWT (memory) → every request: Authorization: Bearer <jwt>
4. middleware/auth.js verifies → sets req.userId → routes scope by user_id
```

## Module Map

| Module | Responsibility | Depends on |
|---|---|---|
| `client/api/client.js` | fetch wrapper: base URL, JWT header, error handling | fetch |
| `client/state/store.js` | pub/sub event bus + read cache | — |
| `client/logic/*.js` | orchestrate API calls + store updates | api/client, store |
| `client/tools/register-tools.js` | WebMCP registration (wrappers only) | client/logic |
| `server/index.js` | Express bootstrap, route mounting | routes/* |
| `server/middleware/auth.js` | JWT verify → req.userId | jsonwebtoken |
| `server/routes/*.js` | HTTP validation + call logic | logic/*, middleware/auth |
| `server/logic/*.js` | business rules (schedule, forecast, diagnose) | db/pool |
| `server/db/pool.js` | pg Pool (DATABASE_URL) | pg |

**Dependency rule:** routes never contain business logic; logic never touches `req`/`res`; tools never touch the DOM directly (they emit store events).

## State Sync Detail (C5) — how an agent action becomes visible

1. Agent (in browser) calls tool → `execute()` → `client/logic/plants.logCareActivity()`
2. `api/client.js` → `POST /api/plants/:id/care` (JWT) → server logic → SQL INSERT/UPDATE
3. Response returns → client logic updates store → `emit('care-logged')`
4. UI subscribed to `care-logged` → re-renders card/badge/timeline + toast "💧 watered by agent"
5. **No page reload.** Same path as a human clicking the button — one endpoint, two callers.

## Failure Modes & Fallbacks

| Failure | Behavior |
|---|---|
| No WebMCP in browser | App fully usable by human (C6); tools not registered |
| API unreachable | Store shows cached data + "offline — changes will retry" banner; mutations queue |
| Open-Meteo down | Server returns cached forecast (30 min) → else `data_source:'unavailable'` |
| Invalid/expired JWT | 401 → client redirects to login |
| Unknown species | Generic care profile ([[docs/data-model#Fallback Profile|data-model]]) |
| DB connection lost | Health endpoint `/api/health` reports degraded; Render restarts service |

## Deployment Topology ([[docs/deployment]])

- **Static Site** — serves `client/` build
- **Web Service** — runs `server/` (Node/Express)
- **Managed PostgreSQL** — persistent data
- Env: `DATABASE_URL`, `JWT_SECRET` on the Web Service; client points at API base URL

**Related:** [[specification]] · [[docs/backend-api]] · [[docs/database-schema]] · [[docs/data-model]] · [[docs/deployment]] · [[docs/decisions]]
