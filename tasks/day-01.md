---
tags: [tasks, day-log]
type: day
day: 1
---
# 📅 Day 01 — Scaffold + Backend Foundation

> Tasks: **T-01, T-02** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [ ] Init repo: `client/` (Vite) + `server/` (Express) structure per [[CLAUDE#🏗️ Planned Code Structure (to be created)|CLAUDE.md]]
- [ ] Install `pg`, `express`, `bcrypt`, `jsonwebtoken` (server); create `db/pool.js` (DATABASE_URL)
- [ ] Author `server/db/migrate.sql` — users/plants/care_log/growth_log per [[docs/database-schema]] (incl. pgcrypto)
- [ ] Create `client/src/state/store.js` event bus (on/emit)
- [ ] Seed script loads plants-db.json (server canonical copy)

## ✅ Gate / Acceptance
Server boots, connects to Postgres, migrations run idempotently, store emits test event

## 📝 Notes & Decisions
_(log surprises, blockers, and any ADR-worthy decisions here; significant ones → [[docs/decisions]])_

---
[[plan|← Plan]] · [[tasks/kanban|Kanban]] · [[tasks/day-02|Day 2 →]]
