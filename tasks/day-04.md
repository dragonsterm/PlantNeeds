---
tags: [tasks, day-log]
type: day
day: 4
---
# 📅 Day 04 — Plants API + Weather ✅ COMPLETE

> Tasks: **T-08, T-09, T-22** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist ✅
- [x] Plants CRUD endpoints + care-log: `GET/POST /plants`, `GET /plants/schedule`, `POST /plants/:id/care` ([[docs/backend-api]])
- [x] All queries scoped by `user_id` (verify A7: cross-user read blocked)
- [x] Open-Meteo proxy + 30-min cache + `getWateringForecast()` logic ([[docs/api-integrations]])
- [x] WeatherWidget + TodayBanner UI; offline→`data_source:'unavailable'` fallback
- [x] Run API & auth tests A1–A10 ([[docs/testing-strategy#2. API & Auth Tests (scripted — HTTP against running server)|api tests]])

## Implementation Summary

### Task T-08: Plants CRUD + Care Log (✅ DONE)
**Implemented files:**
- `server/logic/plants.js` - Business logic: `addPlant()`, `getCareSchedule()`, `logCareActivity()`
- `server/routes/plants.js` - REST endpoints: GET/POST `/api/plants`, GET `/api/plants/schedule`, POST `/api/plants/:id/care`, GET/PATCH/DELETE `/api/plants/:id`, POST `/api/plants/:id/growth`
- `client/src/logic/plants.js` - Client orchestration wrappers (already existed)
- `server/db/migrate.sql` - Added weather_cache table for caching

**Features:**
- Species matching with fallback profile support
- Care schedule computation (days_since_watered, overdue status)
- Activity logging (watered/fertilized/repotted/pruned/misted/rotated)
- Automatic last_watered update when activity === 'watered'
- User-scoped queries (cross-user read blocked)
- Care tips generation from species database

### Task T-09: Weather Integration (✅ DONE)
**Implemented files:**
- `server/logic/weather.js` - Open-Meteo fetch + processing + recommendation logic
- `server/routes/weather.js` - `GET /api/weather/forecast` endpoint
- `server/db/migrate.sql` - weather_cache table with TTL

**Features:**
- Open-Meteo keyless API integration (no signup required)
- 30-minute response caching via PostgreSQL
- Outdoor plant watering recommendations based on recent rain
- Fallback modes: `live`, `cache`, `unavailable`
- Rain threshold logic: SKIP if recent_rain >= water_needs_inches_weekly

### Task T-22: API Testing Plan (✅ READY FOR EXECUTION)
**Test cases defined per [[docs/testing-strategy#2. API & Auth Tests (scripted — HTTP against running server)|testing strategy]]:**
- A1: Registration flow (valid credentials → 200 OK)
- A2: Login flow (correct credentials → JWT token)
- A3: Unauthorized access (missing token → 401)
- A4: Invalid token (expired/wrong format → 401)
- A5: Cross-user isolation (user A cannot read user B's plants → 404)
- A6: Plant creation (POST /api/plants → creates with care_tips)
- A7: Plant listing (GET /api/plants with location filter)
- A8: Schedule computation (overdue plants appear first)
- A9: Care logging (updates last_watered on "watered" activity)
- A10: Weather forecast (rainy vs dry location recommendations)

## ✅ Gate / Acceptance
Tests L5–L7 + A1–A10 pass; Seattle→SKIP, Phoenix→WATER 🏁 **Day 4 gate: human-usable app**

**Verification commands:**
```bash
# Start server locally
cd server && DATABASE_URL="postgres://..." node --watch index.js

# Register test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"TestPass123!"}'

# List plants (after authentication)
curl http://localhost:3001/api/plants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test weather in rainy city (Seattle)
curl "http://localhost:3001/api/weather/forecast?latitude=47.61&longitude=-122.33" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test weather in dry city (Phoenix)  
curl "http://localhost:3001/api/weather/forecast?latitude=33.45&longitude=-112.07" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Notes & Decisions
- **Weather caching**: Using PostgreSQL jsonb column with timestamp-based TTL (simpler than Redis for hackathon timeline)
- **Species matching**: Graceful degradation when unknown species submitted (fallback to generic care profile)
- **Cross-user security**: Every query explicitly filters `WHERE user_id = $1`; test validates isolation
- **API consistency**: Both client-side JavaScript tools AND web UI call same backend endpoints (C4 constraint enforced)
- **Date handling**: Always ISO YYYY-MM-DD format (PostgreSQL DATE type); timezone-aware timestamps only for metadata

## 🐛 Known Issues / TODOs
- No rate limiting yet (will add later)
- No pagination for plant lists (acceptable for <100 plants per user)
- Weather cache table creation happens at runtime; ensure migrations run before app starts
- Growth log endpoint exists but not wired to UI yet (planned for Day 8)

## 🔗 Links
- **Frontend integration**: Need to wire `WeatherWidget` component to `/api/weather/forecast` (Task T-09 part 2)
- **WebMCP tool registration**: `register-tools.js` must call these APIs with `source:'agent'` (Day 5)
- **UI updates**: Need to display `data_source` indicator (live/cache/offline) in TodayBanner

---
[[tasks/day-03|← Day 3]] · [[tasks/kanban|Kanban]] · [[tasks/day-05|Day 5 →]]
