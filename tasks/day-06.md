---
tags: [tasks, day-log]
type: day
day: 6
---
# 📅 Day 06 — Diagnosis Engine

> Tasks: **T-11, T-12, T-13** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [x] Author `symptoms-matrix.json` — 20 causes per [[docs/diagnosis-engine#Target Coverage (~20 causes — Day 6 work, tasks/day-06)|coverage]]
- [x] Implement rule evaluator (whitelisted comparisons — NEVER eval())
- [x] Implement `diagnoseProblem()` scoring + evidence strings
- [x] DiagnosisPanel UI: symptom multi-select → ranked results

## ✅ Gate / Acceptance
Tests L8–L10 pass; monstera demo case ranks Overwatering #1 🏁 **Day 6 gate: agent-callable app** ✅ PASSED

## 📝 Notes & Decisions
- Authoring: `symptoms-matrix.json` covering 20 causes in 5 categories (Water, Light, Roots/soil, Environment, Pests, Other).
- Rule Evaluator: Whitelisted expression evaluator parsing comparison operators (`<`, `>`, `<=`, `>=`, `===`, `!==`) and arithmetic multiplier chains without using `eval()`.
- Diagnosis Engine: `server/logic/diagnose.js` derives historical metrics (`avgWaterGap`, `daysSinceWatered`, `daysSinceFertilized`, `daysSinceRepotted`) and scores candidates with evidence strings and suggested remedies.
- UI: `DiagnosisPanel` modal added with symptom multi-select and confidence scoring cards, integrated with dark and light dashboards.
- Verification: `test-day-6.js` verifies evaluator rules, L8 (Overwatering rank #1 on 4d water gap vs 10d), L9 (Underwatering rank #1 on 18d gap), and L10 (mandatory disclaimer).

---
[[tasks/day-05|← Day 5]] · [[tasks/kanban|Kanban]] · [[tasks/day-07|Day 7 →]]
