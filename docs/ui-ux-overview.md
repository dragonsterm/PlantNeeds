---
tags: [ui, ux, docs]
type: doc
status: design-tbd
---
# 🎨 UI/UX Overview

> ⚠️ **STATUS: Visual design is UNDER DISCUSSION by the human.** This doc defines **structure, components, and behavior only**. Do NOT hardcode a color system, typography scale, or theme until the design decision lands in [[docs/decisions]].

## Principles (locked even though visuals aren't)

1. **Functional first** — every component works with minimal neutral styling
2. **Component-based** — design tokens can be swapped later without touching logic
3. **Live-sync is the star** — agent actions must be *visible* (C5)
4. **Accessible baseline** — semantic HTML, labeled controls, keyboard-navigable
5. **Mobile-responsive** — single-column collapse under 640px

## Screen Inventory

### Main Dashboard (single-page app — this IS the app)
| Component | Content | Data source | Updates on event |
|---|---|---|---|
| **TodayBanner** | "🌧️ 2.1″ rain this week — 3 outdoor plants skipped · 2 indoor due" | `getWateringForecast()` + `getCareSchedule()` | `weather-updated`, `plants-changed` |
| **PlantGrid → PlantCard** | emoji/photo, name, species, countdown ring to next watering, quick "💧 Water" button | `listPlants()` + schedule | `plants-changed` |
| **DueBadge** | count of due/overdue plants | `getCareSchedule()` | `plants-changed`, `care-logged` |
| **WeatherWidget** | past-7d rain, next-7d forecast, `data_source` badge | `getWateringForecast()` | `weather-updated` |
| **DiagnosisPanel** | symptom multi-select → ranked causes w/ evidence + fix | `diagnoseProblem()` | on submit |
| **ActivityTimeline** | every log: "💧 Watered Monstera — **by agent** · 2m ago" | care_log + growth_log | `care-logged`, `growth-logged` |
| **GrowthJournal** (per plant) | milestone timeline | `growth_log` | `growth-logged` |
| **AddPlantForm** | name, species (w/ autocomplete from plants-db), location, light, drainage | `addPlant()` | — |

### The Live-Sync Mechanism (C5) — HOW agent actions become visible

```javascript
// ui/render.js — subscribe once at boot
import { on } from '../state/store.js';
on('plants-changed', () => { renderPlantGrid(); renderDueBadge(); });
on('care-logged',    () => { renderTimeline(); });
on('weather-updated',() => { renderTodayBanner(); renderWeatherWidget(); });
on('growth-logged',  () => { renderJournal(); });
```

Agent calls `log_care_activity` → wrapper → `logCareActivity()` (with `source:'agent'`) → API writes to PostgreSQL → `emit('care-logged')` + `emit('plants-changed')` → **UI re-renders + toast "💧 Monstera watered by agent"**. No page reload. This is the demo's jaw-drop moment ([[PlantNeeds-SRD#10.2 The "Live Sync" Demo Moment|SRD §10.2]]).

### Toast Notifications
Transient, top-right, announce ALL state changes with source attribution:
- `💧 {plant} marked as watered` (human)
- `🤖 {plant} watered by agent` (agent) ← different icon, proving agent action

## UX Copy Rules

| Rule | Example |
|---|---|
| Show the *reason*, not just the verdict | "SKIP — 2.1″ rain ≥ 1.5″ needed" not just "SKIP" |
| Attribute every action | always "by you" / "by agent" in timeline |
| Empty states teach | "No plants yet — add one, or ask your AI assistant to" |

## What Stays Undecided (human to finalize)

- Color palette / dark mode
- Typography
- Illustration vs emoji for plants
- Layout density

→ Decision will be recorded as an ADR in [[docs/decisions]]; components must accept it via CSS custom properties (`--color-primary` etc.) so the swap is one file.

**Related:** [[docs/architecture]] · [[docs/webmcp-tools]] · [[specification]]
