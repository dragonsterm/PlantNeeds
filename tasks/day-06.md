---
tags: [tasks, day-log]
type: day
day: 6
---
# 📅 Day 06 — Diagnosis Engine

> Tasks: **T-11, T-12, T-13** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [ ] Author `symptoms-matrix.json` — 20 causes per [[docs/diagnosis-engine#Target Coverage (~20 causes — Day 6 work, tasks/day-06)|coverage]]
- [ ] Implement rule evaluator (whitelisted comparisons — NEVER eval())
- [ ] Implement `diagnoseProblem()` scoring + evidence strings
- [ ] DiagnosisPanel UI: symptom multi-select → ranked results

## ✅ Gate / Acceptance
Tests L8–L10 pass; monstera demo case ranks Overwatering #1 🏁 **Day 6 gate: agent-callable app**

## 📝 Notes & Decisions
_(log surprises, blockers, and any ADR-worthy decisions here; significant ones → [[docs/decisions]])_

---
[[tasks/day-05|← Day 5]] · [[tasks/kanban|Kanban]] · [[tasks/day-07|Day 7 →]]
