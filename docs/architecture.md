---
tags: [architecture, docs]
type: doc
---
# 🏛️ Architecture

> The structural design of PlantNeeds. For data shapes see [[docs/data-model]]; for function contracts see [[specification]].

## The Three-Layer Sync Pattern

PlantNeeds serves **two users** — a human (visual UI) and an AI agent (WebMCP tools) — over **one dataset**. The entire architecture exists to keep them in sync:

```
        ┌─────────────────────┐         ┌──────────────────────┐
        │      HUMAN UI       │         │   WEBMCP TOOL LAYER  │
        │  buttons, cards,    │         │  7 × registerTool()  │
        │  dashboards         │         │  (agent's menu)      │
        └──────────┬──────────┘         └──────────┬───────────┘
                   │  onClick(...)                 │  execute(...)
                   │                               │
                   └───────────────┬───────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │   SHARED LOGIC LAYER        │  ← THE ONLY place
                    │   src/logic/*.js            │    business logic lives
                    │   addPlant, waterPlant,     │
                    │   getWateringForecast, ...  │
                    └──────────────┬──────────────┘
                                   │ writes + emit(event)
                                   ▼
                    ┌─────────────────────────────┐
                    │   STATE LAYER               │
                    │   IndexedDB (Dexie) +       │
                    │   pub/sub store             │
                    └──────────────┬──────────────┘
                                   │ 'plants-changed' etc.
                                   ▼
                    ┌─────────────────────────────┐
                    │   UI RE-RENDERS (no reload) │  ← agent actions become VISIBLE
                    └─────────────────────────────┘
                                   +
                    ┌─────────────────────────────┐
                    │   Open-Meteo API (keyless)  │  weather only
                    └─────────────────────────────┘
```

## Why This Pattern (the reasoning)

| Decision | Consequence |
|---|---|
| **One logic layer, two callers** (C4) | UI and agent can never disagree about behavior; test logic once |
| **Events drive re-render** (C5) | Agent calls `log_care_activity` → store emits → card animates. Judge *sees* the agent act |
| **Tools are thin wrappers** | Tool bugs can only be schema/validation bugs; logic stays unit-tested |
| **Local-first (IndexedDB)** | Works offline, zero cost, zero privacy surface (NFR-3) |
| **Static hosting** | Deploy = push. No server to break during judging |

## Module Map

| Module | Responsibility | Depends on |
|---|---|---|
| `state/db.js` | Dexie schema, CRUD primitives | Dexie |
| `state/store.js` | Event bus (on/emit) | — |
| `logic/plants.js` | Collection + care scheduling | db, store |
| `logic/weather.js` | Open-Meteo + forecast logic | fetch, db, store |
| `logic/diagnose.js` | Symptom matrix scoring | db |
| `logic/planner.js` | Seasonal planner + growth log | db, store |
| `tools/register-tools.js` | WebMCP registration (wrappers only) | logic/* |
| `ui/*` | Components + render | logic/*, store |
| `data/*.json` | Static plant/symptom data | — |

**Dependency rule:** dependencies point DOWN the diagram only. UI never calls IndexedDB directly; tools never touch the DOM (they emit events instead).

## Failure Modes & Fallbacks

| Failure | Behavior |
|---|---|
| No WebMCP in browser | App fully usable by human (C6); tools simply not registered |
| Open-Meteo down | Cached forecast (30 min) → else `data_source:'unavailable'`, schedule-only advice |
| Unknown species | Generic care profile ([[docs/data-model#Fallback Profile|data-model]]) |
| IndexedDB unavailable | In-memory fallback with a "data won't persist" banner |

**Related:** [[specification]] · [[docs/ui-ux-overview]] · [[docs/api-integrations]] · [[docs/deployment]] · [[docs/decisions]]
