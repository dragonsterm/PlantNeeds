---
tags: [plan, roadmap]
type: plan
status: active
---
# 🗺️ PlantNeeds — Build Plan

> **Purpose:** The master roadmap for the 10-day hackathon build. Pair with [[specification]] (the *how*) and [[tasks/kanban]] (the *tracker*).
> **Requirement source:** [[PlantNeeds-SRD]] — scope beyond it needs human approval.
> **Visual version:** open `canvas/Build-Plan.canvas` in Obsidian.

---

## Phase Overview

```
Phase 1: FOUNDATION          Phase 2: CORE FEATURES        Phase 3: AGENT LAYER         Phase 4: POLISH & SUBMIT
Days 1-2                     Days 3-6                      Days 7-8                     Days 9-10
───────────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────────────
• Scaffold app               • Human UI (dashboard, cards) • Test in ChatGPT browser    • Deploy to Render
• IndexedDB layer            • Weather integration         • Refine tool descriptions   • Demo video (<3 min)
• plants-db.json (50 sp.)    • All 7 tools registered      • Diagnosis engine deep pass • README + license
• Reactive store             • Live UI↔tool sync           • Growth journal + planner   • Submission text
```

**Milestone gates:**
- 🏁 **End Day 2** — app boots, data persists, plant DB loads
- 🏁 **End Day 4** — human can use the app fully without any agent
- 🏁 **End Day 6** — all 7 tools callable in Chrome (WebMCP flag), UI syncs live
- 🏁 **End Day 8** — full demo scenario ([[PlantNeeds-SRD#6. The Demo Scenario (How It All Comes Together)|SRD §6]]) works in ChatGPT's browser
- 🏁 **Day 10** — SUBMITTED ✅

---

## Day-by-Day Plan

| Day | Focus | Key Deliverables | Details |
|---|---|---|---|
| **1** | Scaffold + data layer | Repo, build tooling (Vite), IndexedDB schema via Dexie, reactive store | [[tasks/day-01]] |
| **2** | Plant database | `plants-db.json` (~50 species), generic fallback profile, DB seed/load logic | [[tasks/day-02]] |
| **3** | Human UI v1 | Plant list, add-plant form, care schedule view (functional, minimal styling — design TBD) | [[tasks/day-03]] |
| **4** | Weather feature | Open-Meteo wiring, `getWateringForecast()` logic, weather widget, offline fallback | [[tasks/day-04]] |
| **5** | WebMCP tools | All 7 `registerTool()` calls as thin wrappers over `src/logic/`; test in Chrome flag | [[tasks/day-05]] |
| **6** | Diagnosis engine | `symptoms-matrix.json` (~20 mappings), likelihood scoring vs. care history, diagnosis panel | [[tasks/day-06]] |
| **7** | Agent browser pass | End-to-end test in **ChatGPT in-app browser**; iterate tool descriptions until agent picks correctly | [[tasks/day-07]] |
| **8** | Secondary features | Growth journal, seasonal planting planner, live-sync animations, edge cases | [[tasks/day-08]] |
| **9** | Ship assets | Deploy to Render ([[docs/deployment]]), record demo video, README with screenshots | [[tasks/day-09]] |
| **10** | Submit | License file, submission text per [[PlantNeeds-SRD#16. Hackathon Submission Checklist|SRD §16]], final QA, SUBMIT | [[tasks/day-10]] |

---

## Workstreams (parallel tracks)

| Stream | Owner | Docs |
|---|---|---|
| 🧠 Logic layer (`src/logic/`) | Agent/human | [[docs/architecture]], [[specification]] |
| 🌦️ Weather integration | Agent/human | [[docs/api-integrations]] |
| 🔧 WebMCP tools | Agent/human | [[docs/webmcp-tools]] |
| 🎨 UI components | Agent (functional only — **design TBD by human**) | [[docs/ui-ux-overview]] |
| 🧪 Testing & QA | Agent + human verify | [[docs/testing-strategy]] |

---

## Risk Watchlist (from [[PlantNeeds-SRD#15. Risks & Mitigations|SRD §15]])

| Risk | Mitigation in plan |
|---|---|
| WebMCP spec drift | Tool registration isolated to one file (`register-tools.js`) — Day 5, re-check Day 7 |
| Agent picks wrong tool | Dedicated Day 7 for description iteration |
| Scope creep | Days 8 features are droppable; Tools 6–7 optional if behind |
| Diagnosis too shallow | Full Day 6 reserved for the matrix + scoring |

---

## Progress Log

> Update this table as milestones complete (agents: check off + date).

- [ ] 🏁 Day 2 gate — foundation solid
- [ ] 🏁 Day 4 gate — human-usable app
- [ ] 🏁 Day 6 gate — agent-callable app
- [ ] 🏁 Day 8 gate — demo scenario passes in ChatGPT browser
- [ ] 🏁 Day 10 — submitted

**Related:** [[specification]] · [[tasks/kanban]] · [[docs/decisions]] · [[CLAUDE]]
