---
tags: [tasks, day-log]
type: day
day: 4
---
# 📅 Day 04 — Plants API + Weather

> Tasks: **T-08, T-09, T-22** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [ ] Plants CRUD endpoints + care-log: `GET/POST /plants`, `GET /plants/schedule`, `POST /plants/:id/care` ([[docs/backend-api]])
- [ ] All queries scoped by `user_id` (verify A7: cross-user read blocked)
- [ ] Open-Meteo proxy + 30-min cache + `getWateringForecast()` logic ([[docs/api-integrations]])
- [ ] WeatherWidget + TodayBanner UI; offline→`data_source:'unavailable'` fallback
- [ ] Run API & auth tests A1–A10 ([[docs/testing-strategy#2. API & Auth Tests (scripted — HTTP against running server)|api tests]])

## ✅ Gate / Acceptance
Tests L5–L7 + A1–A10 pass; Seattle→SKIP, Phoenix→WATER 🏁 **Day 4 gate: human-usable app**

## 📝 Notes & Decisions
_(log surprises, blockers, and any ADR-worthy decisions here; significant ones → [[docs/decisions]])_

---
[[tasks/day-03|← Day 3]] · [[tasks/kanban|Kanban]] · [[tasks/day-05|Day 5 →]]
