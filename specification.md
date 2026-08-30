---
tags: [specification, technical]
type: spec
status: active
---
# 📐 PlantNeeds — Technical Specification

> **Purpose:** The authoritative technical contract for building PlantNeeds. If you're an AI agent about to write code, **this is your source of truth** for data shapes, function signatures, and tool schemas.
> Narrative context: [[PlantNeeds-SRD]] · Build order: [[plan]] · Rationale: [[docs/decisions]]

---

## 1. Technology Stack (Locked)

| Layer | Choice | Version/Notes |
|---|---|---|
| App type | Static SPA | No backend (constraint C1) |
| Build | Vite + vanilla JS (ES modules) | React optional; vanilla preferred for simplicity |
| Storage | IndexedDB via **Dexie.js** | `dexie@^4` |
| Reactive state | Tiny pub/sub store (`store.js`) | UI + tools subscribe to the same store |
| Weather API | **Open-Meteo** | No key. See [[docs/api-integrations]] |
| WebMCP | `document.modelContext.registerTool()` | Guarded by feature detection |
| Hosting | **Render Static Site** | Free tier; config in [[docs/deployment]] |

**Feature detection pattern (REQUIRED):**
```javascript
const webmcpAvailable = 'modelContext' in document && document.modelContext?.registerTool;
if (webmcpAvailable) { registerAllTools(); }  // else: app still 100% usable (C6)
```

---

## 2. Data Model (IndexedDB)

Store name: `plantneeds-db`, version 1. Three object stores. Full rationale: [[docs/data-model]].

### 2.1 `plants`
```typescript
interface Plant {
  id: string;                       // crypto.randomUUID()
  name: string;                     // user nickname, e.g. "Kitchen Fern"
  species: string;                  // key into plants-db.json, or "custom"
  location: 'indoor' | 'outdoor';
  light_exposure: 'low' | 'medium' | 'bright_indirect' | 'direct';
  pot_has_drainage: boolean | null; // null for outdoor beds
  acquired_date: string;            // ISO date
  // Resolved from care profile at creation; user-overridable:
  water_frequency_days: number;         // default from species profile
  water_needs_inches_weekly: number|null; // outdoor plants only
  last_watered: string | null;      // ISO date of last 'watered' log
  created_at: string;
}
// Indexes: id (primary), location, species
```

### 2.2 `care_log`
```typescript
interface CareLogEntry {
  id: string;
  plant_id: string;                 // FK -> plants.id
  activity: 'watered'|'fertilized'|'repotted'|'pruned'|'misted'|'rotated';
  date: string;                     // ISO date
  notes?: string;
  source: 'human' | 'agent';        // powers the activity timeline
  created_at: string;
}
// Indexes: id (primary), plant_id, date
```

### 2.3 `growth_log`
```typescript
interface GrowthLogEntry {
  id: string;
  plant_id: string;
  milestone: string;                // e.g. "first new leaf"
  height_cm?: number;
  notes?: string;
  date: string;
  source: 'human' | 'agent';
}
// Indexes: id (primary), plant_id
```

### 2.4 Static Data Files
- `src/data/plants-db.json` — ~50 species care profiles. Schema in [[docs/data-model#Plant Database Format|data-model]].
- `src/data/symptoms-matrix.json` — ~20 symptom→cause mappings. Schema in [[docs/diagnosis-engine]].

---

## 3. Shared Logic Layer (`src/logic/`) — THE Contract

> ⚠️ **Constraint C4:** These are the ONLY implementations of business logic. UI handlers and tool `execute()` wrappers both call these. All logic functions emit store events so the UI re-renders (C5).

### 3.1 `plants.js`
```typescript
async function addPlant(input: AddPlantInput): Promise<{ plant: Plant; care_tips: string[] }>
async function updatePlant(id: string, patch: Partial<Plant>): Promise<Plant>
async function removePlant(id: string): Promise<{ success: true }>
async function listPlants(filter?: { location?: 'indoor'|'outdoor' }): Promise<Plant[]>
async function logCareActivity(input: {
  plant_id: string; activity: CareLogEntry['activity'];
  date?: string; notes?: string; source?: 'human'|'agent';
}): Promise<{ success: true; next_watering_due: string /* ISO */ }>
  // Side effects: inserts care_log row; if activity==='watered', updates plants.last_watered;
  // emits 'plants-changed' + 'care-logged' events.
async function getCareSchedule(opts?: { plant_id?: string; days_ahead?: number }):
  Promise<ScheduleItem[]>
  // ScheduleItem = { plant_id, name, species, next_watering, overdue: boolean,
  //                  days_since_watered: number } — sorted ascending by next_watering.
```

### 3.2 `weather.js`
```typescript
async function getWateringForecast(input: { latitude: number; longitude: number }):
  Promise<{
    recent_rain_mm: number;
    forecast_rain_mm: number;
    recommendations: Array<{
      plant_id: string; plant: string;
      recommendation: 'SKIP — rain covered it' | 'WATER — rain insufficient';
      rain_received_mm: number;
      reason: string;              // human/agent-readable explanation
    }>;
    data_source: 'live' | 'cache' | 'unavailable';
  }>
// Rules (FR-3.x): outdoor plants only; compare 7-day precipitation_sum vs
// plant.water_needs_inches_weekly (convert mm<->inches: 25.4). Cache 30 min.
// On API failure: return cached or { data_source:'unavailable', recommendations: [] }.
```

### 3.3 `diagnose.js`
```typescript
const SYMPTOMS = ['yellow_leaves','brown_tips','drooping','spots','wilting',
                  'pests_visible','slow_growth','leaf_drop','mushy_stem'] as const;

async function diagnoseProblem(input: {
  plant_id: string; symptoms: Array<typeof SYMPTOMS[number]>;
}): Promise<{
  plant: string;
  diagnosis: Array<{
    cause: string; likelihood: number;   // 0..1, sorted desc, top 3 returned
    evidence: string[]; suggested_fix: string;
  }>;
  care_context: {
    watering_every_days: number|null; recommended_gap: number; light: string;
  };
  disclaimer: string;              // REQUIRED (NFR-7)
}>
// Algorithm: candidate causes from symptoms-matrix -> score against actual
// care history (watering gap, light, drainage) -> rank. See docs/diagnosis-engine.
```

### 3.4 `planner.js` (secondary)
```typescript
async function planSeasonalPlanting(input: {
  latitude: number; longitude: number; crops: string[];
}): Promise<{ planting_plan: CropPlan[] }>
async function logGrowth(input: {
  plant_id: string; milestone: string; height_cm?: number; notes?: string;
  source?: 'human'|'agent';
}): Promise<{ success: true; total_milestones: number; timeline: GrowthLogEntry[] }>
```

---

## 4. WebMCP Tool Registry (`src/tools/register-tools.js`)

> Tools are **thin wrappers**: validate input per schema → call logic function with `source:'agent'` → return structured JSON. NO business logic inside tools. Full schemas & description rules: [[docs/webmcp-tools]].

| # | Tool name | Wraps logic fn | Required inputs |
|---|---|---|---|
| 1 | `add_plant` | `addPlant` | name, species, location |
| 2 | `get_care_schedule` | `getCareSchedule` | — (all optional) |
| 3 | `get_watering_forecast` | `getWateringForecast` | latitude, longitude |
| 4 | `diagnose_problem` | `diagnoseProblem` | plant_id, symptoms[] |
| 5 | `log_care_activity` | `logCareActivity` | plant_id, activity |
| 6 | `plan_seasonal_planting` | `planSeasonalPlanting` | latitude, longitude, crops[] |
| 7 | `log_growth` | `logGrowth` | plant_id, milestone |

**Registration order matters for nothing; description quality matters for everything.** Each tool's `description` must state *when* to use it (agents choose by reading descriptions — C7).

---

## 5. Event Bus (`src/state/store.js`)

```typescript
type StoreEvent = 'plants-changed' | 'care-logged' | 'growth-logged' | 'weather-updated';
function on(event: StoreEvent, cb: () => void): void
function emit(event: StoreEvent): void
```
UI subscribes on mount; logic functions emit after writes. This is how an agent's tool call visibly updates the screen (C5). See [[docs/ui-ux-overview#Live-Sync Mechanism|ui-ux]].

---

## 6. Non-Functional Requirements (from SRD §11)

Load < 3s · core works offline · zero data leaves device except anonymous Open-Meteo lat/long · zero running cost · diagnosis results carry disclaimer · open-source license at repo root.

---

## 7. Acceptance Anchors

- Every function above has tests per [[docs/testing-strategy]]
- Every tool verified callable per [[docs/testing-strategy#WebMCP Tool Tests|tool tests]]
- Done = [[CLAUDE#✅ Definition of Done (per feature)|Definition of Done]] satisfied

**Related:** [[docs/architecture]] · [[docs/data-model]] · [[docs/diagnosis-engine]] · [[docs/api-integrations]] · [[docs/webmcp-tools]]
