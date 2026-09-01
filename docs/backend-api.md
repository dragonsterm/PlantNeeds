---
tags: [backend, api, docs]
type: doc
---
# 🔌 Backend API

> The REST contract between client (UI + WebMCP tools) and server. Implemented in `server/routes/` over `server/logic/` (constraint C4).
> Schema: [[docs/database-schema]] · Auth decision: [[docs/decisions#ADR-010: Authentication — username/password + JWT (bcrypt hash)|ADR-010]] · Architecture: [[docs/architecture]]

**Base URL:** `https://<web-service>.onrender.com/api` (production) · `http://localhost:3001/api` (dev)

## Conventions

| Rule | Detail |
|---|---|
| Auth | All endpoints except `/auth/register` + `/auth/login` + `/health` require `Authorization: Bearer <jwt>` |
| Scoping | Every query filters by the authenticated `user_id` — users only ever see their own data |
| Content type | `application/json` both ways |
| Errors | `{ "error": "human-readable message" }` with appropriate HTTP status (400/401/404/409/500) |
| Dates | ISO `YYYY-MM-DD`; timestamps ISO 8601 |

## Authentication

### `POST /auth/register`
Create account. **Body:** `{ "username": string (3–32, unique), "password": string (≥ 8) }`
**200:** `{ "user": { "id", "username" }, "token": "<jwt>" }` · **409:** username taken
Password is bcrypt-hashed (cost ≥ 10) before insert — never stored plain.

### `POST /auth/login`
**Body:** `{ "username", "password" }` · **200:** `{ "user": {...}, "token": "<jwt>" }` · **401:** bad credentials

### `GET /auth/me` 🔒
Returns the current user. **200:** `{ "user": { "id", "username", "created_at" } }`

## Plants (collection + tracker)

### `GET /plants` 🔒
List the user's plants. Query: `?location=indoor|outdoor` (optional).
**200:** `{ "plants": Plant[] }` — see [[docs/data-model]] for `Plant` shape.

### `POST /plants` 🔒
Add a plant (matches species → care profile). **Body:** `{ name, species, location, light_exposure?, pot_has_drainage? }`
**200:** `{ "success": true, "plant": Plant, "care_tips": string[] }`

### `GET /plants/:id` 🔒 · `PATCH /plants/:id` 🔒 · `DELETE /plants/:id` 🔒
Read one / update / remove. All scoped to the user; **404** if not found or not owned.

### `GET /plants/schedule` 🔒
Care schedule across plants. Query: `?plant_id=&days_ahead=7`.
**200:** `{ "schedule": ScheduleItem[] }` — `{ plant_id, name, species, next_watering, overdue, days_since_watered }` sorted by `next_watering`.

### `POST /plants/:id/care` 🔒
Log a care activity (the plant tracker write). **Body:** `{ "activity": "watered"|"fertilized"|"repotted"|"pruned"|"misted"|"rotated", "date"?, "notes"?, "source": "human"|"agent" }`
**200:** `{ "success": true, "next_watering_due": "YYYY-MM-DD" }`
Side effects: inserts `care_log` row; if `watered`, updates `plants.last_watered`.

## Weather (proxied + cached)

### `GET /weather/forecast` 🔒
Weather-adjusted watering advice. Query: `?latitude=&longitude=` (required).
Server calls Open-Meteo, caches 30 min, compares rain vs each **outdoor** plant's needs.
**200:** `{ "recent_rain_mm", "forecast_rain_mm", "recommendations": [{ plant_id, plant, recommendation: "SKIP — rain covered it"|"WATER — rain insufficient", rain_received_mm, reason }], "data_source": "live"|"cache"|"unavailable" }`
Logic: [[docs/api-integrations#Forecast Logic (FR-3.x) — implemented in logic/weather.js|forecast rules]].

## Diagnosis

### `POST /diagnose` 🔒
History-aware diagnosis. **Body:** `{ "plant_id": string, "symptoms": Symptom[] }`
**200:** `{ "plant", "diagnosis": [{ cause, likelihood, evidence[], suggested_fix }], "care_context", "disclaimer" }`
Engine: [[docs/diagnosis-engine]]. Disclaimer always present (NFR-7).

## Growth Journal + Planner

### `POST /plants/:id/growth` 🔒
Log a milestone. **Body:** `{ "milestone": string, "height_cm"?, "notes"?, "source"? }`
**200:** `{ "success": true, "total_milestones": n, "timeline": GrowthLogEntry[] }`

### `POST /planner/seasonal` 🔒
Seasonal planting calendar. **Body:** `{ "latitude", "longitude", "crops": string[] }`
**200:** `{ "planting_plan": [{ crop, start_indoors, transplant_after, days_to_harvest, companion_plants, avoid_planting_near }] }`

## Health

### `GET /health` (public)
**200:** `{ "status": "ok", "db": "up"|"down", "time": "..." }` — used by Render + smoke tests.

---

## How WebMCP Tools Map to Endpoints (C4)

| WebMCP tool | Endpoint | Client logic fn |
|---|---|---|
| `add_plant` | `POST /plants` | `addPlant()` |
| `get_care_schedule` | `GET /plants/schedule` | `getCareSchedule()` |
| `get_watering_forecast` | `GET /weather/forecast` | `getWateringForecast()` |
| `diagnose_problem` | `POST /diagnose` | `diagnoseProblem()` |
| `log_care_activity` | `POST /plants/:id/care` | `logCareActivity()` |
| `plan_seasonal_planting` | `POST /planner/seasonal` | `planSeasonalPlanting()` |
| `log_growth` | `POST /plants/:id/growth` | `logGrowth()` |

**Both the human UI buttons and these tool wrappers call the same `client/logic/*` functions**, which call these endpoints. One path, two callers — zero drift.

**Related:** [[docs/architecture]] · [[docs/database-schema]] · [[docs/data-model]] · [[docs/webmcp-tools]] · [[specification]]
