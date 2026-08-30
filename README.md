# 🌱 PlantNeeds

> *"Plant apps today are reference books. PlantNeeds is a gardener."*

**PlantNeeds** is a **WebMCP-powered web app** that helps people keep their plants alive — built for **[The WebMCP Challenge](https://webmcp.devpost.com/)** hackathon. Log your plants, get care schedules, skip watering when it rains (real weather data), and diagnose sick plants — all operable by an **AI agent** through 7 WebMCP tools, with the UI updating live as the agent acts.

---

## 🧭 Start Here (by role)

| You are... | Do this |
|---|---|
| 🤖 **An AI agent** (Claude Code, Codex, etc.) | Read **[`CLAUDE.md`](CLAUDE.md)** first, then [`AGENTS.md`](AGENTS.md) — full orientation + constraints |
| 👤 **A teammate / designer** | Open this folder **as an Obsidian vault** (see below), then read [`PlantNeeds-SRD.md`](PlantNeeds-SRD.md) |
| 💻 **A developer** | Read [`specification.md`](specification.md) + [`plan.md`](plan.md), then check [`tasks/kanban.md`](tasks/kanban.md) |

## 📖 Open as an Obsidian Vault (recommended)

The docs are a linked knowledge graph. To get the full experience (clickable links, Graph View, Canvas maps):

1. Install [Obsidian](https://obsidian.md)
2. `File → Open vault → Open folder as vault` → select this cloned folder
3. Open the **Graph view** to see the doc network, and browse `canvas/*.canvas` for visual maps

> Reading on GitHub works too — the markdown renders fine — but `[[wiki-links]]` and canvases only work inside Obsidian.

## 🗺️ Documentation Map

| Doc | What it covers |
|---|---|
| [`PlantNeeds-SRD.md`](PlantNeeds-SRD.md) | Full requirements (17 sections) — the "what & why" |
| [`plan.md`](plan.md) | 10-day build roadmap |
| [`specification.md`](specification.md) | Technical contract — data shapes, function signatures, tool schemas |
| [`docs/architecture.md`](docs/architecture.md) | 3-layer sync pattern (UI ↔ WebMCP tools ↔ state) |
| [`docs/webmcp-tools.md`](docs/webmcp-tools.md) | All 7 tool schemas + description-writing rules |
| [`docs/data-model.md`](docs/data-model.md) | IndexedDB schema, plant DB format |
| [`docs/diagnosis-engine.md`](docs/diagnosis-engine.md) | Symptom→cause scoring with care-history reasoning |
| [`docs/api-integrations.md`](docs/api-integrations.md) | Open-Meteo weather API (keyless) |
| [`docs/ui-ux-overview.md`](docs/ui-ux-overview.md) | Components + live-sync (⚠️ visual design TBD) |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | Test matrix (Chrome WebMCP flag + ChatGPT browser) |
| [`docs/deployment.md`](docs/deployment.md) | Render Static Site config |
| [`docs/decisions.md`](docs/decisions.md) | ADRs — why choices were made |
| [`tasks/kanban.md`](tasks/kanban.md) + `tasks/day-*.md` | Task tracking |

## 🔄 Keep the Knowledge Graph in Sync

After adding/renaming docs or editing links:

```bash
python scripts/sync-graphify.py
```

This regenerates `.graphify/graph.json` so Obsidian Graph View and Graphify stay in sync. Commit the result with your doc changes. Details: [`docs/graph-sync.md`](docs/graph-sync.md).

## 🚀 Status

- ✅ Requirements, specs, docs, plan — complete
- ⬜ App code (`src/`) — not started; see [`plan.md`](plan.md)
- **Deploy target:** Render Static Site · **External API:** Open-Meteo (no key) · **Storage:** IndexedDB (no backend)

## 📄 License

[MIT](LICENSE) © 2026 dragonsterm
