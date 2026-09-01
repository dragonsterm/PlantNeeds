---
tags: [tasks, day-log]
type: day
day: 2
---
# 📅 Day 02 — Auth + Plant Database

> Tasks: **T-03, T-04, T-05** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [x] Author `client/src/data/plants-db.json`: 30 indoor + 20 outdoor species ([[docs/data-model#Plant Database Format|format]])
- [x] Implement species matching incl. aliases + fallback profile (server-side)
- [x] Build auth endpoints: `POST /auth/register`, `/login`, `GET /auth/me` per [[docs/backend-api#Authentication|backend-api]]
- [x] bcrypt hash passwords (cost≥10); JWT sign/verify middleware → req.userId
- [x] Unit-check matching: 'monstera' / 'Monstera' / 'swiss cheese plant' all match

## ✅ Gate / Acceptance
- [x] 53 species load (30 indoor + 23 outdoor) ✅
- [x] register→login returns JWT (verified via logic tests; needs live Postgres for E2E) ✅
- [x] unknown species→fallback ✅
- [x] tests A1–A4 pass (bcrypt hash, correct/wrong password, JWT sign/verify, validation) ✅
- [x] Species matching 12/12 pass (L11) ✅

🏁 **Day 2 gate MET** — 2026-09-01

## 📝 Notes & Decisions
- Used **bcryptjs** (pure JS) instead of bcrypt (native binding fails on Windows). Same API, same hash format. Logged as potential ADR.
- plants-db.json has **53 species** (30 indoor + 23 outdoor) — exceeds 50 target.
- Indonesian aliases included (kemangi→basil, cabai→pepper, buncis→green bean, jagung→corn, etc.) for local relevance.
- `server/logic/species.js` handles all matching: exact key → normalized key → common_name/aliases → fallback.
- `server/logic/auth.js` handles register/login/me with bcryptjs cost 10, JWT 1h expiry, input validation (3-32 chars username, ≥8 password, alphanumeric+underscore only).
- Both `server/data/plants-db.json` (canonical) and `client/src/data/plants-db.json` (client copy) populated.
- No local Postgres available — A1-A4 verified via logic unit tests + endpoint structure tests (400/401/404). Full E2E auth tests need live Postgres (Day 4 or when Render Postgres is provisioned).

---
[[tasks/day-01|← Day 1]] · [[tasks/kanban|Kanban]] · [[tasks/day-03|Day 3 →]]
