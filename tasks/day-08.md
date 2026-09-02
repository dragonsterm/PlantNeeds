---
tags: [tasks, day-log]
type: day
day: 8
---
# 📅 Day 08 — Secondary Features, Planner & Live-Sync Polish

> Tasks: **T-16, T-17, T-18, T-18B, T-18C** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [x] **T-16 (Growth Journal)**:
  - Implement `server/logic/planner.js` (`logGrowth()`) and endpoint `POST /api/plants/:id/growth`
  - Build UI Timeline component for growth milestones (height cm, first leaf, notes)
  - Verify WebMCP Tool #7 (`log_growth`)
- [x] **T-17 (Seasonal Planting Planner)**:
  - Implement `server/logic/planner.js` (`planSeasonalPlanting()`) and endpoint `POST /api/planner/seasonal`
  - Compute sowing, indoor-start, and harvest calendar with companion planting hints (e.g. Tomatoes + Basil vs Fennel)
  - Build UI Seasonal Planner modal & verify WebMCP Tool #6 (`plan_seasonal_planting`)
- [x] **T-18 (Live-Sync & Toast Feedback - Constraint C5)**:
  - Add green Agent Pulse ripple animation on plant cards during agent mutations
  - Implement dual-state toast notifications (`🤖 Monstera watered by agent` vs `💧 Monstera marked as watered`)
- [x] **T-18B (Plant Management Operations - FR-1.3)**:
  - Add Growth Journal action icon & Delete plant actions in UI
  - Add Location filter tabs (*All Plants*, *Indoor*, *Outdoor*) on My Plants dashboard
- [x] **T-18C (Resilience & Compliance)**:
  - Add medical/gardening disclaimer footer on DiagnosisPanel (NFR-7)
  - Ensure graceful offline/cached fallback indicator for weather data (NFR-2)

## ✅ Gate / Acceptance
All MoSCoW Musts and Shoulds complete; app provides a full, polished, multi-feature experience with zero console errors 🏁 **Day 8 gate**

---
[[tasks/day-07|← Day 7]] · [[tasks/kanban|Kanban]] · [[tasks/day-09|Day 9 →]]
