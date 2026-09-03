---
tags: [database, schema, docs]
type: doc
---
# 🗄️ Database Schema (PostgreSQL)

> The persistent model — the **single source of truth** ([[docs/decisions#ADR-011: Server is the state authority (client is a reactive view)|ADR-011]]). Implemented as `server/db/migrate.sql`, queried via `server/db/pool.js` (pg).
> API surface: [[docs/backend-api]] · payload mapping: [[docs/data-model]].

## Entity-Relationship

```
users 1 ────< plants 1 ────< care_log
                 │
                 └────< growth_log
```
Every plant belongs to one user; every log belongs to one plant. All reads scoped by `user_id`.

## DDL (`migrate.sql`)

```sql
-- Users (accounts)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,              -- bcrypt, cost >= 10 (ADR-010)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plants (a user's collection)
CREATE TABLE IF NOT EXISTS plants (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  species                   TEXT NOT NULL,           -- key into plants-db, or 'custom'
  location                  TEXT NOT NULL CHECK (location IN ('indoor','outdoor')),
  light_exposure            TEXT CHECK (light_exposure IN ('low','medium','bright_indirect','direct')),
  pot_has_drainage          BOOLEAN,
  acquired_date             DATE,
  water_frequency_days      INT NOT NULL DEFAULT 7,
  water_needs_inches_weekly NUMERIC(4,2),            -- outdoor crops only
  last_watered              DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plants_user     ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_location ON plants(location);

-- Care log (the plant tracker history)
CREATE TABLE IF NOT EXISTS care_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id   UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  activity   TEXT NOT NULL CHECK (activity IN
               ('watered','fertilized','repotted','pruned','misted','rotated')),
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  source     TEXT NOT NULL DEFAULT 'human' CHECK (source IN ('human','agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_care_plant ON care_log(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_date  ON care_log(date);

-- Growth journal
CREATE TABLE IF NOT EXISTS growth_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id   UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  milestone  TEXT NOT NULL,
  height_cm  NUMERIC(6,1),
  notes      TEXT,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  source     TEXT NOT NULL DEFAULT 'human' CHECK (source IN ('human','agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_growth_plant ON growth_log(plant_id);
```

> `gen_random_uuid()` requires the `pgcrypto` extension: `CREATE EXTENSION IF NOT EXISTS pgcrypto;` at the top of `migrate.sql`.

## Why `source` on every log row

The activity timeline shows *"💧 Watered — by agent, 2 min ago"* vs *"by you"* — making human↔agent collaboration visible (the hackathon theme) and a judging differentiator. Persisted server-side so it survives sessions.

## Date & Unit Conventions (locked)

| Convention | Value |
|---|---|
| Dates | ISO `YYYY-MM-DD` (Postgres `DATE`) |
| Rain in API | millimetres (Open-Meteo native); convert with `MM_PER_INCH = 25.4` |
| "Due" calc | `next_watering = last_watered + water_frequency_days`; `overdue = today > next_watering` |

## Static Reference Data (NOT in Postgres)

- `client/src/data/plants-db.json` — ~50 species care profiles. Ships with the client; the server keeps a canonical copy to resolve species at `POST /plants`. See [[docs/data-model#Plant Database Format|data-model]].
- `client/src/data/symptoms-matrix.json` — ~20 symptom→cause mappings for [[docs/diagnosis-engine]].

These are static lookups, not user data — they don't belong in the relational DB.

## Notes for Agents

- **Always parameterize queries** (`pool.query('... WHERE user_id = $1', [userId])`) — never interpolate user input.
- **Every plant-scoped query must also filter `user_id`** (join through plants) so one user can never read another's data.
- Migrations run on Web Service startup (idempotent `IF NOT EXISTS`).

**Related:** [[docs/backend-api]] · [[docs/data-model]] · [[docs/architecture]] · [[docs/deployment]]
