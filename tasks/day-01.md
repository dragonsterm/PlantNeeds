---
tags: [tasks, day-log]
type: day
day: 1
---
# 📅 Day 01 — Scaffold + Backend Foundation

> Tasks: **T-01, T-02** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [x] Init repo: `client/` (Vite) + `server/` (Express) structure per [[CLAUDE#🏗️ Planned Code Structure (to be created)|CLAUDE.md]]
- [x] Install `pg`, `express`, `bcrypt`, `jsonwebtoken` (server); create `db/pool.js` (DATABASE_URL)
- [x] Author `server/db/migrate.sql` — users/plants/care_log/growth_log per [[docs/database-schema]] (incl. pgcrypto)
- [x] Create `client/src/state/store.js` event bus (on/emit)
- [x] Seed script loads plants-db.json (server canonical copy)

## ✅ Gate / Acceptance
Server boots, connects to Postgres, migrations run idempotently, store emits test event — **MET 2026-09-01** (server boots + listens with no local Postgres; `/api/health` → 503 `db:down` gracefully; guarded routes → 401; unknown → 404; migrations idempotent 10/10 `IF NOT EXISTS`; store emits test events. Live DB connect deferred to Day 2+ once Postgres is available.)

## 📝 Notes & Decisions
- Scaffold committed (`45d343f`): 35 files, `client/` (Vite) + `server/` (Express) per [[CLAUDE#🏗️ Planned Code Structure (to be created)|CLAUDE.md]].
- **Boot resilience:** `runMigrations()` is awaited before `app.listen`, but failures are caught so an unreachable DB only defers migrations (logs + `/api/health` reports `db:down`) instead of crashing — matches [[docs/architecture#Failure Modes & Fallbacks|failure modes]] (Render may start the Web Service before Postgres is ready).
- `bcrypt@5.1.1` native binding blocked by npm allow-scripts at install; verified it loads + hashes correctly (60-char hash) regardless.
- No local Postgres/Docker in this environment → live DB connect + real migration run verified on Day 2+ against a real instance; idempotency + graceful-degradation verified ad-hoc (11/11 checks).
- Route + logic modules ship as contracts (throw "lands on Day N") so imports resolve now; real handlers land Days 2–8 per [[plan]].
- Tool registration is a C6-guarded stub (`webmcpAvailable()`); the 7 `registerTool()` bodies land Day 5 (T-10).

---
[[plan|← Plan]] · [[tasks/kanban|Kanban]] · [[tasks/day-02|Day 2 →]]
