---
tags: [tasks, day-log]
type: day
day: 2
---
# 📅 Day 02 — Auth + Plant Database

> Tasks: **T-03, T-04, T-05** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [ ] Author `client/src/data/plants-db.json`: 30 indoor + 20 outdoor species ([[docs/data-model#Plant Database Format|format]])
- [ ] Implement species matching incl. aliases + fallback profile (server-side)
- [ ] Build auth endpoints: `POST /auth/register`, `/login`, `GET /auth/me` per [[docs/backend-api#Authentication|backend-api]]
- [ ] bcrypt hash passwords (cost≥10); JWT sign/verify middleware → req.userId
- [ ] Unit-check matching: 'monstera' / 'Monstera' / 'swiss cheese plant' all match

## ✅ Gate / Acceptance
50 species load; register→login returns JWT; unknown species→fallback; tests A1–A4 pass 🏁 **Day 2 gate**

## 📝 Notes & Decisions
_(log surprises, blockers, and any ADR-worthy decisions here; significant ones → [[docs/decisions]])_

---
[[tasks/day-01|← Day 1]] · [[tasks/kanban|Kanban]] · [[tasks/day-03|Day 3 →]]
