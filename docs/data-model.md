---
tags: [data, docs]
type: doc
---
# 🗃️ Data Model

> **Status: server-backed (revised 2026-08-28, [[docs/decisions#ADR-009: Add a backend — Node/Express + PostgreSQL on Render|ADR-009]]).** The canonical shapes used across API payloads and the client.
> Storage/DDL: [[docs/database-schema]] · endpoints: [[docs/backend-api]] · contracts: [[specification]].

## Overview: where data lives now

| Data | Location | Why |
|---|---|---|
| User accounts, plants, care_log, growth_log | **PostgreSQL** (server) | persistent, multi-user, state authority (ADR-011) |
| plants-db.json, symptoms-matrix.json | static JSON (client + server copy) | static reference, not user data |
| Weather | Open-Meteo via server proxy, 30-min cache | external, keyless |
| Client UI state | in-memory pub/sub store (read cache) | fast render; refreshed after mutations |

## Core Types (API payloads)

### `User`
```typescript
interface User {
  id: string;                 // uuid
  username: string;
  created_at: string;         // ISO 8601
  // password_hash NEVER leaves the server
}
```

### `Plant`
```typescript
interface Plant {
  id: string;
  user_id: string;
  name: string;                       // nickname, e.g. "Kitchen Fern"
  species: string;                    // plants-db key, or "custom"
  location: 'indoor' | 'outdoor';
  light_exposure: 'low'|'medium'|'bright_indirect'|'direct' | null;
  pot_has_drainage: boolean | null;
  acquired_date: string | null;       // ISO date
  water_frequency_days: number;         // resolved from species profile; user-overridable
  water_needs_inches_weekly: number | null; // outdoor crops only
  last_watered: string | null;          // ISO date
  created_at: string;
}
```

### `CareLogEntry`
```typescript
interface CareLogEntry {
  id: string;
  plant_id: string;
  activity: 'watered'|'fertilized'|'repotted'|'pruned'|'misted'|'rotated';
  date: string;
  notes?: string;
  source: 'human' | 'agent';        // powers the timeline attribution
  created_at: string;
}
```

### `GrowthLogEntry`
```typescript
interface GrowthLogEntry {
  id: string;
  plant_id: string;
  milestone: string;
  height_cm?: number;
  notes?: string;
  date: string;
  source: 'human' | 'agent';
}
```

### `ScheduleItem` (derived, returned by `GET /plants/schedule`)
```typescript
interface ScheduleItem {
  plant_id: string; name: string; species: string;
  next_watering: string; overdue: boolean; days_since_watered: number;
}
```

## Date & Unit Conventions (locked)

| Convention | Value |
|---|---|
| Dates | ISO `YYYY-MM-DD` |
| Rain | mm in API; convert `MM_PER_INCH = 25.4` |
| "Due" | `next_watering = last_watered + water_frequency_days`; `overdue = today > next_watering` |

## Plant Database Format (`client/src/data/plants-db.json`)

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
| `days_to_harvest`, `companions`, `enemies` | n/a | required (planner) |
| `aliases` | recommended — improves agent species matching | recommended |

### Fallback Profile
Unknown species resolve to:
```json
{ "common_name": "Unknown plant", "water_frequency_days": 7, "light": "medium",
  "tips": "Generic care: water when top inch of soil is dry." }
```
…with `species: "custom"` stored on the plant (FR-1.4).

## Species Matching (agent-friendly)

The server resolves the `species` string at `POST /plants` by, in order:
1. Exact key (`"monstera_deliciosa"`)
2. Normalized key (lowercase, spaces→`_`)
3. `common_name` or `aliases` (case-insensitive)
4. No match → fallback profile

Agents pass free text like `"monstera"` — matching must be forgiving (supports C8).

**Related:** [[docs/database-schema]] · [[docs/backend-api]] · [[docs/architecture]] · [[docs/diagnosis-engine]]
