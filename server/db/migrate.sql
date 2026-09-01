-- ============================================================================
-- PlantNeeds — migrate.sql
-- ----------------------------------------------------------------------------
-- Single source of truth schema (docs/database-schema.md). Idempotent:
-- safe to run on every Web Service startup (all IF NOT EXISTS).
-- Requires pgcrypto for gen_random_uuid().
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users (accounts) ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,              -- bcrypt, cost >= 10 (ADR-010)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plants (a user's collection) -------------------------------------------------
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

-- Care log (the plant tracker history) ----------------------------------------
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

-- Growth journal ---------------------------------------------------------------
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

-- Weather cache (for Open-Meteo responses, 30-min TTL)
CREATE TABLE IF NOT EXISTS weather_cache (
  key         TEXT PRIMARY KEY,
  payload     JSONB NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL
);
