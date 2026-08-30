---
tags: [data, docs]
type: doc
---
# 🗄️ Data Model

> Full data design. TypeScript-style contracts also in [[specification#2. Data Model (IndexedDB)|spec §2]]. Used by [[docs/architecture|the logic layer]].

## IndexedDB Stores

Database: `plantneeds-db` (v1) via Dexie.

```javascript
// state/db.js
import Dexie from 'dexie';
export const db = new Dexie('plantneeds-db');
db.version(1).stores({
  plants:     'id, location, species',          // primary key 'id', indexed fields listed
  care_log:   'id, plant_id, date',
  growth_log: 'id, plant_id'
});
```

| Store | Holds | Key indexes |
|---|---|---|
| `plants` | The collection + resolved care fields | `location` (forecast queries outdoor only), `species` |
| `care_log` | Every care event with `source: human\|agent` | `plant_id` (history per plant), `date` (timeline) |
| `growth_log` | Milestones per plant | `plant_id` |

**Why `source` on every log row:** the activity timeline shows *"💧 Watered — by agent, 2 min ago"* vs *"by you"* — this makes the human↔agent collaboration visible (hackathon theme) and is a judging-criterion differentiator.

## Date & Unit Conventions (locked)

| Convention | Value |
|---|---|
| Dates | ISO `YYYY-MM-DD` strings |
| Rain in API | millimetres (Open-Meteo native) |
| Rain shown/compared | convert with `MM_PER_INCH = 25.4` |
| "Due" calculation | `next_watering = last_watered + water_frequency_days`; `overdue = today > next_watering` |

## Plant Database Format (`src/data/plants-db.json`)

~50 species, keyed by normalized species id:

```json
{
  "monstera_deliciosa": {
    "common_name": "Monstera",
    "aliases": ["monstera", "swiss cheese plant"],
    "water_frequency_days": 10,
    "light": "bright_indirect",
    "humidity": "high",
    "toxic_to_pets": true,
    "common_issues": ["yellow_leaves_from_overwatering", "brown_tips_from_low_humidity"],
    "tips": "Loves to climb — give it a moss pole."
  },
  "solanum_lycopersicum": {
    "common_name": "Tomato",
    "type": "outdoor_crop",
    "water_needs_inches_weekly": 1.5,
    "light": "direct",
    "days_to_harvest": 70,
    "weeks_before_last_frost": 6,
    "companions": ["basil", "marigold"],
    "enemies": ["fennel"]
  }
}
```

### Field Rules
| Field | Indoor | Outdoor crop |
|---|---|---|
| `water_frequency_days` | required | optional |
| `water_needs_inches_weekly` | n/a | **required** (drives [[docs/api-integrations|forecast logic]]) |
| `days_to_harvest`, `companions`, `enemies` | n/a | required (planner tool) |
| `aliases` | recommended — improves species matching from agent input | recommended |

### Fallback Profile
Unknown species resolve to:
```json
{ "common_name": "Unknown plant", "water_frequency_days": 7, "light": "medium",
  "tips": "Generic care: water when top inch of soil is dry." }
```
…with `species: "custom"` stored on the plant so the user/agent can refine later (FR-1.4).

## Species Matching (agent-friendly)

`addPlant` matches `species` input by, in order:
1. Exact key (`"monstera_deliciosa"`)
2. Normalized key (lowercase, spaces→`_`)
3. `common_name` or `aliases` (case-insensitive)
4. No match → fallback profile

This matters because agents will pass free text like `"monstera"` — matching must be forgiving (supports C8 non-trivial implementation).

**Related:** [[specification]] · [[docs/architecture]] · [[docs/diagnosis-engine]]
