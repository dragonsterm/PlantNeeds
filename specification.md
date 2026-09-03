---
tags: [specification, technical]
type: spec
status: active
---
# 📐 PlantNeeds — Technical Specification

> **Purpose:** The authoritative technical contract for building PlantNeeds. If you're an AI agent about to write code, **this is your source of truth** for data shapes, function signatures, and tool schemas.
> Narrative context: [[PlantNeeds-SRD]] · Build order: [[plan]] · Rationale: [[docs/decisions]]

---

## 1. Technology Stack (Locked)

> ⚠️ **Revised 2026-08-28 ([[docs/decisions#ADR-009: Add a backend — Node/Express + PostgreSQL on Render|ADR-009]]):** client+server. Business logic lives server-side; the client is a reactive view + WebMCP tool layer.

| Layer | Choice | Version/Notes |
|---|---|---|
| Frontend | Static SPA (Vite + vanilla JS, ES modules) | React optional; deploy to **Render Static Site** |
| Backend API | **Node.js + Express** | REST; deploy to **Render Web Service** |
| Database | **PostgreSQL** (Render managed) | via `pg` Pool; DDL in [[docs/database-schema]] |
| Auth | **JWT** (jsonwebtoken) + **bcrypt** password hashing | see [[docs/backend-api#Authentication|auth]] (ADR-010) |
| Reactive state (client) | Tiny pub/sub store (`client/src/state/store.js`) | read cache + re-render on mutation |
| Weather API | **Open-Meteo** (keyless) via **server proxy + 30-min cache** | [[docs/api-integrations]] |
| WebMCP | `document.modelContext.registerTool()` | Guarded by feature detection |
| Hosting | Render: Static frontend + Web Service + Postgres | [[docs/deployment]] |

**Feature detection pattern (REQUIRED):**
```javascript
const webmcpAvailable = 'modelContext' in document && document.modelContext?.registerTool;
if (webmcpAvailable) { registerAllTools(); }  // else: app still 100% usable (C6)
```

---

## 2. Data Model (PostgreSQL)

Canonical persistence is **server-side** (ADR-011). Full DDL: [[docs/database-schema]]. API payload types: [[docs/data-model]].

### 2.1 `users`
```typescript
interface User { id: string; username: string; created_at: string; }
// password_hash stored server-side only (bcrypt), never returned.
```

### 2.2 `plants`
```typescript
interface Plant {
  id: string; user_id: string;
  name: string;                       // "Kitchen Fern"
  species: string;                    // plants-db key, or "custom"
  location: 'indoor' | 'outdoor';
  light_exposure: 'low'|'medium'|'bright_indirect'|'direct' | null;
  pot_has_drainage: boolean | null;
  acquired_date: string | null;
  water_frequency_days: number;           // from species profile; user-overridable
  water_needs_inches_weekly: number|null; // outdoor crops only
  last_watered: string | null;
  created_at: string;
}
```

### 2.3 `care_log`
```typescript
interface CareLogEntry {
  id: string; plant_id: string;
  activity: 'watered'|'fertilized'|'repotted'|'pruned'|'misted'|'rotated';
  date: string; notes?: string;
  source: 'human' | 'agent';        // timeline attribution
  created_at: string;
}
```

### 2.4 `growth_log`
```typescript
interface GrowthLogEntry {
  id: string; plant_id: string;
  milestone: string; height_cm?: number; notes?: string;
  date: string; source: 'human' | 'agent';
}
```

### 2.5 Static Data Files
- `client/src/data/plants-db.json` — ~50 species care profiles ([[docs/data-model#Plant Database Format|data-model]]). Server keeps a canonical copy to resolve species at `POST /plants`.
- `client/src/data/symptoms-matrix.json` — ~20 symptom→cause mappings ([[docs/diagnosis-engine]]).

---

## 3. Logic — Split Across Client & Server (THE Contract)

> ⚠️ **Constraint C4:** There is exactly ONE business-logic implementation, and it lives **on the server** (`server/logic/`). Both UI handlers and WebMCP tool `execute()` wrappers reach it through the SAME REST endpoints via thin client functions (`client/logic/`).

### 3.1 Server business logic (`server/logic/`) — owns the rules
Pure functions over the DB; no `req`/`res`. These are the real implementations:
- `plants.js` — addPlant (species matching), schedule computation, logCareActivity (insert + update last_watered)
- `weather.js` — Open-Meteo fetch + 30-min cache + SKIP/WATER verdicts ([[docs/api-integrations]])
- `diagnose.js` — symptom scoring vs care history ([[docs/diagnosis-engine]])
- `planner.js` — seasonal calendar, growth log

### 3.2 Client orchestration (`client/logic/`) — thin async wrappers
These call the API and update the store. UI and tools BOTH call these (never raw fetch):

```typescript
// client/logic/plants.js
async function addPlant(input)         -> POST /api/plants          -> emit('plants-changed')
async function listPlants(filter?)     -> GET  /api/plants          -> update store cache
async function logCareActivity(input)  -> POST /api/plants/:id/care -> emit('care-logged')+('plants-changed')
async function getCareSchedule(opts?)  -> GET  /api/plants/schedule
// client/logic/weather.js
async function getWateringForecast({latitude, longitude}) -> GET /api/weather/forecast
// client/logic/diagnose.js
async function diagnoseProblem({plant_id, symptoms})      -> POST /api/diagnose
// client/logic/planner.js
async function planSeasonalPlanting({latitude, longitude, crops}) -> POST /api/planner/seasonal
async function logGrowth(input)        -> POST /api/plants/:id/growth -> emit('growth-logged')
```

### 3.3 Auth client (`client/api/client.js`)
```typescript
// fetch wrapper: attaches Authorization: Bearer <jwt>, handles 401 -> login,
// base URL from config. All client/logic functions use it.
```

---

## 4. WebMCP Tool Registry (`client/src/tools/register-tools.js`)

> Tools are **thin wrappers**: validate input per schema → call `client/logic/*` (which calls the API) with `source:'agent'` → return structured JSON. NO business logic in tools. Full schemas & description rules: [[docs/webmcp-tools]].

| # | Tool name | Client logic fn | Endpoint | Required inputs |
|---|---|---|---|---|
| 1 | `add_plant` | `addPlant` | `POST /plants` | name, species, location |
| 2 | `get_care_schedule` | `getCareSchedule` | `GET /plants/schedule` | — (all optional) |
| 3 | `get_watering_forecast` | `getWateringForecast` | `GET /weather/forecast` | latitude, longitude |
| 4 | `diagnose_problem` | `diagnoseProblem` | `POST /diagnose` | plant_id, symptoms[] |
| 5 | `log_care_activity` | `logCareActivity` | `POST /plants/:id/care` | plant_id, activity |
| 6 | `plan_seasonal_planting` | `planSeasonalPlanting` | `POST /planner/seasonal` | latitude, longitude, crops[] |
| 7 | `log_growth` | `logGrowth` | `POST /plants/:id/growth` | plant_id, milestone |

**Description quality matters most** — each `description` states *when* to use it (agents choose by reading — C7).

---

## 5. Event Bus (`client/src/state/store.js`)

```typescript
type StoreEvent = 'plants-changed' | 'care-logged' | 'growth-logged' | 'weather-updated' | 'auth-changed';
function on(event: StoreEvent, cb: () => void): void
function emit(event: StoreEvent): void
```
UI subscribes on mount; `client/logic/*` emits after successful API mutations → UI re-renders (C5). See [[docs/ui-ux-overview#Live-Sync Mechanism|ui-ux]].

---

## 6. Non-Functional Requirements (revised)

Load < 3s · core reads work offline from cache (mutations require connectivity) · passwords bcrypt-hashed, JWT auth, per-user scoping · plant data server-side, only anonymous Open-Meteo lat/long leaves our infra · diagnosis results carry disclaimer · open-source license at repo root · secrets (`DATABASE_URL`, `JWT_SECRET`) in env vars, never committed.

---

## 7. Acceptance Anchors

- Every function above has tests per [[docs/testing-strategy]]
- Every tool verified callable per [[docs/testing-strategy#WebMCP Tool Tests|tool tests]]
- Done = [[CLAUDE#✅ Definition of Done (per feature)|Definition of Done]] satisfied

**Related:** [[docs/architecture]] · [[docs/backend-api]] · [[docs/database-schema]] · [[docs/data-model]] · [[docs/diagnosis-engine]] · [[docs/api-integrations]] · [[docs/webmcp-tools]] · [[docs/deployment]]
