---
tags: [tasks, day-log]
type: day
day: 1
---
# 📅 Day 01 — Scaffold + Data Layer

> Tasks: **T-01, T-02** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [ ] Init Vite project, folder structure per [[CLAUDE#🏗️ Planned Code Structure (to be created)|CLAUDE.md]]
- [ ] Install dexie; create `state/db.js` with the 3 stores ([[docs/data-model]])
- [ ] Create `state/store.js` event bus (on/emit)
- [ ] Seed script loads plants-db.json on first run

## ✅ Gate / Acceptance
App boots, IndexedDB persists across reload, store emits test event

## 📝 Notes & Decisions
_(log surprises, blockers, and any ADR-worthy decisions here; significant ones → [[docs/decisions]])_

---
[[plan|← Plan]] · [[tasks/kanban|Kanban]] · [[tasks/day-02|Day 2 →]]
