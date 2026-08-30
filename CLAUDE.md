# CLAUDE.md — PlantNeeds Project Guide for AI Agents

> **Read this first.** This file orients any AI coding agent (Claude Code, Cursor, Copilot, etc.) working in this repository. It explains what we're building, the non-negotiable rules, and where every piece of documentation lives.

---

## 🌱 Project in One Paragraph

**PlantNeeds** is a WebMCP-powered web app (built for [The WebMCP Challenge](https://webmcp.devpost.com/) hackathon) that helps people keep plants alive. Users log their plants; the app schedules care, checks **real weather** (Open-Meteo API) to skip watering outdoor plants when it rained, and **diagnoses sick plants** from symptoms cross-referenced with actual care history. The killer feature: the page registers **7 WebMCP tools** via `document.modelContext.registerTool()` so AI agents (e.g., ChatGPT's browser) can operate the app directly — and the **visual UI updates live** when an agent acts.

**One-line pitch:** *"Plant apps today are reference books. PlantNeeds is a gardener."*

---

## ⛔ Non-Negotiable Constraints (Read Before Writing Code)

| # | Rule | Reason |
|---|---|---|
| C1 | **No backend server.** Static site only (deploy to **Render Static Site** — [[docs/deployment]]). | $0 cost, hackathon-friendly |
| C2 | **No user accounts/login.** All data in browser **IndexedDB**. | Simplicity; privacy |
| C3 | **No external API keys.** Only keyless free APIs (Open-Meteo). | Zero-config for judges |
| C4 | **UI handlers and tool `execute()` call the SAME functions.** | Single source of truth — see [[docs/architecture]] |
| C5 | **Every agent tool call must visibly update the UI.** | The demo superpower — see [[docs/ui-ux-overview]] |
| C6 | **App must fully work for humans with NO agent present.** | Graceful degradation |
| C7 | **Tool descriptions are UX for AI — write them carefully.** | Agents pick tools by reading descriptions |
| C8 | **All 7 tools must be non-trivial** (real logic, not stubs). | Judging criterion: "WebMCP Leverage" |

---

## 📚 Documentation Map (This Vault)

This repo is an **Obsidian vault** with wiki-links. Follow the links — everything connects.

### Core Documents
| Document | Purpose | When to Read |
|---|---|---|
| [[PlantNeeds-SRD]] | Full Software Requirements Document (17 sections) | Understanding the "what & why" |
| [[plan]] | 10-day build roadmap with phases & daily tasks | Planning work, tracking progress |
| [[specification]] | Technical specification (data shapes, function signatures) | Before writing ANY code |

### Deep-Dive Docs (`docs/`)
| Document | Purpose |
|---|---|
| [[docs/architecture]] | 3-layer sync pattern (UI ↔ tools ↔ state), tech stack, module layout |
| [[docs/webmcp-tools]] | All 7 tool schemas, execute() pseudocode, description-writing rules |
| [[docs/data-model]] | IndexedDB schema, plant database format, TypeScript-style types |
| [[docs/diagnosis-engine]] | Symptom matrix, likelihood scoring algorithm |
| [[docs/api-integrations]] | Open-Meteo API: endpoints, response shapes, caching, fallback |
| [[docs/ui-ux-overview]] | Components, live-sync mechanism, state flow (⚠️ visual design still TBD) |
| [[docs/testing-strategy]] | Test matrix incl. WebMCP-in-Chrome & ChatGPT-browser test scripts |
| [[docs/deployment]] | Render Static Site config, `render.yaml`, pre-deploy checklist |
| [[docs/decisions]] | Architecture Decision Records (ADRs) — WHY choices were made |
| [[docs/graph-sync]] | How Obsidian ⇄ Graphify stay synchronized |

### Working Files (`tasks/`)
| Document | Purpose |
|---|---|
| [[tasks/kanban]] | Master task board (backlog → in-progress → done) |
| [[tasks/day-01]] … [[tasks/day-10]] | Daily checklists with acceptance criteria |

### Visual Maps (Obsidian Canvas — open in Obsidian)
| Canvas | Shows |
|---|---|
| `canvas/PlantNeeds-System.canvas` | Whole system: users, UI layer, tool layer, state, external API |
| `canvas/WebMCP-Tools.canvas` | The 7 tools, their inputs/outputs, and which UI they update |
| `canvas/Build-Plan.canvas` | 10-day plan as a visual timeline with dependencies |

### Knowledge Graph
- **Obsidian Graph View** — open Obsidian → Graph icon. All wiki-links form the graph.
- **Graphify** — `.graphify/graph.json` mirrors the vault's doc graph. Keep in sync by running `python scripts/sync-graphify.py` after adding/renaming docs. See [[docs/graph-sync]].

---

## 🏗️ Planned Code Structure (to be created)

```
PlantNeeds/
├── index.html
├── src/
│   ├── main.js                 # App bootstrap
│   ├── state/
│   │   ├── db.js               # IndexedDB layer (Dexie)
│   │   └── store.js            # Reactive store (UI + tools share this)
│   ├── logic/                  # ⭐ SHARED LOGIC (C4: UI and tools BOTH call these)
│   │   ├── plants.js           # addPlant, waterPlant, getSchedule...
│   │   ├── weather.js          # fetchWeather, wateringForecast...
│   │   └── diagnose.js         # diagnoseProblem, symptom matrix...
│   ├── tools/
│   │   └── register-tools.js   # All 7 registerTool() calls (thin wrappers over logic/)
│   ├── ui/
│   │   ├── components/         # PlantCard, Dashboard, DiagnosisPanel...
│   │   └── render.js
│   └── data/
│       ├── plants-db.json      # ~50 species care profiles
│       └── symptoms-matrix.json # ~20 symptom→cause mappings
└── tests/
```

---

## ✅ Definition of Done (per feature)

1. Logic function works and is unit-testable
2. UI button calls it AND the matching tool's `execute()` calls it (same function!)
3. State change re-renders affected UI without page refresh
4. Tool verified callable in Chrome with `chrome://flags/#enable-webmcp-testing`
5. Task checked off in the relevant [[tasks/kanban|day note]]

---

## 🎯 Current Status

| Area | Status |
|---|---|
| Requirements (SRD) | ✅ Complete |
| Documentation vault | ✅ Complete |
| UI/visual design | 🔶 **In discussion — DO NOT hardcode a design system** (see [[docs/ui-ux-overview]]) |
| Code | ⬜ Not started — begin with [[plan]] Phase 1 |

**When in doubt:** read the SRD section, then the matching deep-dive doc, then ask the human. Never invent scope beyond [[PlantNeeds-SRD#3. Goals & Non-Goals|the Goals list]].
