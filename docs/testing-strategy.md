---
tags: [testing, docs]
type: doc
---
# 🧪 Testing Strategy

> How we verify PlantNeeds works — for humans AND agents. Executed per [[plan]] (heavy days: 5, 7, 10).

## Test Pyramid

```
        ┌──────────────┐
        │  E2E agent   │  ChatGPT browser full scenario (few, manual, high value)
        ├──────────────┤
        │  Tool tests  │  Chrome WebMCP flag — each of 7 tools (manual script)
        ├──────────────┤
        │  Logic tests │  src/logic/*.js pure functions (scripted, many)
        └──────────────┘
```

## 1. Logic Tests (scripted — `tests/`)

Run in Node with an IndexedDB shim (`fake-indexeddb`) so `src/logic/` is testable headlessly:

| # | Test | Pass criteria |
|---|---|---|
| L1 | `addPlant` with known species | plant stored with species' `water_frequency_days` |
| L2 | `addPlant` with unknown species | fallback profile, `species:'custom'` |
| L3 | `logCareActivity({activity:'watered'})` | `last_watered` updated + `next_watering_due` = date + frequency |
| L4 | `getCareSchedule` sorting | ascending by `next_watering`; overdue flagged |
| L5 | `getWateringForecast` (mock fetch: 40mm rain) | outdoor plants → `SKIP` with correct reason string |
| L6 | `getWateringForecast` (mock fetch: 2mm rain) | outdoor plants → `WATER` |
| L7 | Forecast API failure | `data_source:'unavailable'`, no crash |
| L8 | `diagnoseProblem`: 4d watering, 10d species, yellow_leaves | Overwatering rank #1, evidence cites 4d vs 10d |
| L9 | `diagnoseProblem`: 15d watering, 10d species, drooping | Underwatering rank #1 |
| L10 | Diagnosis always includes disclaimer | string present |
| L11 | Species matching: `"monstera"`, `"Monstera"`, `"swiss cheese plant"` | all resolve to `monstera_deliciosa` |
| L12 | `logGrowth` + `planSeasonalPlanting` | entries persist; plan contains crop fields |

## 2. WebMCP Tool Tests (manual — Chrome)

Setup: `chrome://flags/#enable-webmcp-testing` → Enabled → restart.

| # | Script | Pass criteria |
|---|---|---|
| T1 | Open app → DevTools console: `document.modelContext` | object exists; 7 tools registered |
| T2 | Invoke each tool via console with valid input | valid JSON return, no exceptions |
| T3 | Invoke `add_plant` via console | **new card appears without reload** (C5!) |
| T4 | Invoke `log_care_activity` via console | card countdown resets, DueBadge −1, toast shows "by agent" |
| T5 | Invoke with invalid input (missing required) | structured `{ error }`, no crash |
| T6 | Disable flag → reload | app fully usable, no console errors (C6) |

## 3. E2E Agent Scenario (manual — ChatGPT in-app browser)

The money test — run the [[PlantNeeds-SRD#6. The Demo Scenario (How It All Comes Together)|SRD §6 demo scenario]]:

1. Seed: 6 indoor plants (monstera watered every 4d) + 2 outdoor crops
2. Prompt: *"It's rained all week — which of my plants should I skip watering? And my monstera has yellow leaves, what's wrong?"*
3. **Pass:** agent calls `get_watering_forecast` → correctly splits skip/water; calls `diagnose_problem` → names overwatering with evidence; answers in < 60s total
4. Prompt: *"Mark the fern as watered"* → **pass:** agent calls `log_care_activity`; UI visibly updates live
5. Iterate tool descriptions until steps 3–4 pass reliably — this is [[tasks/day-07|Day 7]]'s whole job

## 4. Human UX Smoke Test

Add 5 plants via UI → log watering via button → check schedule → run diagnosis via panel → all in Firefox/Safari (no WebMCP) → everything works.

## 5. Weather Test Matrix

Per [[docs/api-integrations#Manual Test Locations|api-integrations]]: Seattle (expect SKIP), Phoenix (expect WATER), offline mode (expect fallback banner).

## Bug Protocol

Found during testing → add to [[tasks/kanban]] under 🐛 Bugs with repro steps → fix → reference task ID in commit.

**Related:** [[specification]] · [[docs/webmcp-tools]] · [[docs/diagnosis-engine]] · [[docs/api-integrations]]
