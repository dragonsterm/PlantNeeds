---
tags: [api, weather, docs]
type: doc
---
# 🌦️ API Integrations — Open-Meteo

> The ONLY external API. Keyless & free (constraint C3). Powers `get_watering_forecast` ([[docs/webmcp-tools#Tool 3 — get_watering_forecast ⭐ (flagship)|tool 3]]) and `plan_seasonal_planting`.

## Endpoint

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &daily=precipitation_sum,temperature_2m_max
  &past_days=7&forecast_days=7
  &timezone=auto
```

No key, no signup, CORS-enabled, free for non-commercial use (<10k calls/day — we use ~2/user/day).

## Response Shape (what we consume)

```json
{
  "daily": {
    "time": ["2026-08-28", "..."],                  // 14 entries: 7 past + today + 6 forecast
    "precipitation_sum": [0.0, 3.2, 5.1, ...],      // mm per day
    "temperature_2m_max": [24.1, "..."]
  }
}
```

## Forecast Logic (FR-3.x) — implemented in `logic/weather.js`

```javascript
const MM_PER_INCH = 25.4;
const recentRainMm   = sum(precipitation_sum[0..6]);   // past 7 days
const forecastRainMm = sum(precipitation_sum[7..13]);  // next 7 days

for each plant where location === 'outdoor':
  needsIn = plant.water_needs_inches_weekly ?? 1.0;
  needsMm = needsIn * MM_PER_INCH;
  skip    = recentRainMm >= needsMm;
  recommendation = skip ? 'SKIP — rain covered it' : 'WATER — rain insufficient';
  reason  = `Received ${(recentRainMm/MM_PER_INCH).toFixed(1)}" rain, needs ~${needsIn}"/week`;
// indoor plants: excluded from rain logic (their schedule comes from getCareSchedule)
```

## Caching & Resilience

| Rule | Behavior |
|---|---|
| Cache key | `weather:{lat.toFixed(2)},{lon.toFixed(2)}` in localStorage |
| TTL | 30 minutes (`{ fetchedAt, payload }`) |
| API success | return live data, `data_source: 'live'`, refresh cache |
| API fail + fresh cache | return cache, `data_source: 'cache'` |
| API fail + no cache | `{ data_source: 'unavailable', recommendations: [] }` — UI shows "Weather unavailable — schedule-based advice only" banner |
| Invalid lat/long | throw validation error BEFORE fetch (tool wrapper catches → returns `{ error }` JSON) |

## Privacy Note (NFR-3)

Only lat/long leave the device. No plant data, no identifiers. Document this in README.

## Seasonal Planner Use

`plan_seasonal_planting` uses the same endpoint's `temperature_2m_max` trend as a frost-risk heuristic (last 7-day min temps near 0°C → "frost risk, delay transplanting"). Crop data itself is local ([[docs/data-model#Plant Database Format|plants-db]]) — no second API.

## Manual Test Locations ([[docs/testing-strategy|testing]])

| Scenario | Suggested coords | Expected |
|---|---|---|
| Rainy week | Seattle, USA (47.61, -122.33) | outdoor plants → SKIP (in wet season) |
| Dry week | Phoenix, USA (33.45, -112.07) | outdoor plants → WATER |
| Offline | DevTools → offline mode | `data_source: 'unavailable'` fallback works |

**Related:** [[specification]] · [[docs/webmcp-tools]] · [[docs/architecture]] · [[docs/testing-strategy]]
