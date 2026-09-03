---
tags: [webmcp, tools, docs]
type: doc
---
# 🔧 WebMCP Tools — Full Schemas

> The 7 tools agents can call. Implementation contract: [[specification#4. WebMCP Tool Registry|spec §4]]. Architecture context: [[docs/architecture]].
> **Visual map:** open `canvas/WebMCP-Tools.canvas` in Obsidian.

## ✍️ The Three Rules of Tool Descriptions (C7)

Agents choose tools **by reading descriptions**. Therefore:

1. **Say WHEN to use it.** ❌ `"Watering forecast"` → ✅ `"Get weather-adjusted watering recommendations using real local weather data. Use when the user asks which plants to water, or whether rain means they can skip watering."`
2. **Say WHAT comes back.** Mention key return fields so the agent knows the data exists.
3. **Disambiguate siblings.** `log_care_activity` vs `log_growth` — descriptions must make the difference obvious (care task vs milestone).

---

## Tool 1 — `add_plant`
**Description:** Add a plant to the user's collection. Automatically attaches a care profile (watering frequency, light needs, tips) from the built-in species database. Use when the user wants to start tracking a plant.
**Input schema:**
```json
{ "type": "object",
  "properties": {
    "name": { "type": "string", "description": "Nickname, e.g. 'Kitchen Fern'" },
    "species": { "type": "string", "description": "e.g. 'Monstera deliciosa' or common name" },
    "location": { "type": "string", "enum": ["indoor", "outdoor"] },
    "light_exposure": { "type": "string", "enum": ["low","medium","bright_indirect","direct"] },
    "pot_has_drainage": { "type": "boolean" }
  },
  "required": ["name", "species", "location"] }
```
**Returns:** `{ success, plant, care_tips[] }` · **Wraps:** `addPlant()` · **UI sync:** new card appears + toast

## Tool 2 — `get_care_schedule`
**Description:** Get the upcoming care schedule — which plants need watering and when, sorted by urgency. Use when the user asks what's due today, what's overdue, or about a specific plant's next watering. Omit `plant_id` for all plants.
**Input:** `{ plant_id?: string, days_ahead?: number (default 7) }`
**Returns:** `ScheduleItem[]` = `{ plant, species, next_watering, overdue, days_since_watered }[]` · **Wraps:** `getCareSchedule()`

## Tool 3 — `get_watering_forecast` ⭐ (flagship)
**Description:** Get weather-adjusted watering recommendations using **real local rainfall data** (past 7 days + 7-day forecast). Outdoor plants are checked against actual precipitation — tells the user which outdoor plants they can SKIP because rain already watered them. Indoor plants are excluded from rain logic. Use whenever the user asks whether they need to water given the weather.
**Input:** `{ latitude: number, longitude: number }` (both required)
**Returns:** `{ recent_rain_mm, forecast_rain_mm, recommendations: [{ plant, recommendation: "SKIP — rain covered it"|"WATER — rain insufficient", rain_received_mm, reason }], data_source }`
**Wraps:** `getWateringForecast()` · **Logic:** [[docs/api-integrations]] · **UI sync:** "Today" banner + weather widget refresh

## Tool 4 — `diagnose_problem`
**Description:** Diagnose a sick plant from visible symptoms, cross-referenced with the plant's **actual care history** (watering frequency vs. recommended, light, drainage) — not just generic symptom lookup. Returns ranked likely causes with evidence and fixes. Use when the user reports yellow leaves, drooping, spots, pests, etc.
**Input:** `{ plant_id: string (required), symptoms: array of enum (required) }`
**Symptom enum:** `yellow_leaves, brown_tips, drooping, spots, wilting, pests_visible, slow_growth, leaf_drop, mushy_stem`
**Returns:** `{ plant, diagnosis: [{ cause, likelihood, evidence[], suggested_fix }], care_context, disclaimer }`
**Wraps:** `diagnoseProblem()` · **Engine:** [[docs/diagnosis-engine]] · **UI sync:** diagnosis panel renders result

## Tool 5 — `log_care_activity`
**Description:** Record that a care task was performed — watering, fertilizing, repotting, pruning, misting, or rotating. Updates the plant's schedule immediately. Use when the user says they just watered/fertilized/etc. a plant, or asks you to mark a task done. (For growth milestones like "first flower", use `log_growth` instead.)
**Input:** `{ plant_id (required), activity: enum["watered","fertilized","repotted","pruned","misted","rotated"] (required), date?: ISO date (default today), notes?: string }`
**Returns:** `{ success, next_watering_due }` · **Wraps:** `logCareActivity()` with `source:'agent'` · **UI sync:** card countdown resets, due-badge decrements, timeline entry "by agent"

## Tool 6 — `plan_seasonal_planting`
**Description:** Build a planting calendar for outdoor crops/vegetables based on location — when to start indoors, transplant, and expected days to harvest, with companion-planting hints. Use when the user asks when/what to plant for the season.
**Input:** `{ latitude, longitude, crops: string[] }` (all required)
**Returns:** `{ planting_plan: [{ crop, start_indoors, transplant_after, days_to_harvest, companion_plants, avoid_planting_near }] }`
**Wraps:** `planSeasonalPlanting()`

## Tool 7 — `log_growth`
**Description:** Record a growth milestone in the plant's journal — e.g. "first new leaf", "flowered", height check. Use for milestones and progress notes, NOT for routine care tasks (use `log_care_activity` for those).
**Input:** `{ plant_id (required), milestone: string (required), height_cm?: number, notes?: string }`
**Returns:** `{ success, total_milestones, timeline[] }` · **Wraps:** `logGrowth()` · **UI sync:** journal timeline updates

---

## Registration Pattern (only place tools are defined — spec-drift isolation)

```javascript
// src/tools/register-tools.js
import * as plants from '../logic/plants.js';
import * as weather from '../logic/weather.js';
import * as diagnose from '../logic/diagnose.js';
import * as planner from '../logic/planner.js';

export function registerAllTools() {
  if (!('modelContext' in document)) return;   // C6 graceful degradation
  const reg = (def) => document.modelContext.registerTool(def);
  reg({ name: 'add_plant', description: '...', inputSchema: {...},
        execute: async (input) => plants.addPlant(input) });
  reg({ name: 'get_watering_forecast', description: '...', inputSchema: {...},
        execute: async ({ latitude, longitude }) => weather.getWateringForecast({ latitude, longitude }) });
  // ... all 7 — each a thin wrapper (C4)
}
```

## Testing
Each tool must pass the manual + scripted checks in [[docs/testing-strategy#WebMCP Tool Tests|testing-strategy]] in **both** Chrome (flag) and ChatGPT's browser.

**Related:** [[specification]] · [[docs/architecture]] · [[docs/diagnosis-engine]] · [[docs/api-integrations]]
