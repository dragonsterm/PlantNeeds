# 🌱 PlantNeeds The AI-Powered Intelligent Botanical Companion

<div align="center">

[![WebMCP Challenge](https://img.shields.io/badge/WebMCP-Challenge-green)](https://webmcp.devpost.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Render](https://img.shields.io/badge/Deployed-Render-success)](https://plantneeds-web.onrender.com)

**"Plant apps today are reference books. PlantNeeds is an active gardener."**

</div>

---

## 📖 What Is PlantNeeds?

PlantNeeds is a **WebMCP-powered web application** that helps plant owners keep their plants alive by combining real-time weather data, care history tracking, and intelligent diagnosis—all operable by both humans and AI agents.

### Why Plant Needs This App

- ~70% of houseplants die from overwatering, not neglect
- Existing plant apps are static databases—digital reference books with no reasoning capability
- AI agents can't reliably act on websites without structured tool access

### What PlantNeeds Does Differently

✅ **Real Weather Awareness**: Checks live rainfall forecasts to skip outdoor watering when rain already watered your plants  
✅ **History-Aware Diagnosis**: Cross-references symptoms against actual care logs, not just generic lookup tables  
✅ **Dual-Audience Design**: Humans click buttons; AI agents call WebMCP tools—both execute identical backend logic  
✅ **Live-Sync Feedback**: Watch your plant dashboard update in real time as your agent performs care tasks  

---

## 🚀 Live Demo

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | [https://plantneeds-web.onrender.com](https://plantneeds-web.onrender.com) | ✅ Live |
| **Backend API** | [https://plantneeds-api.onrender.com](https://plantneeds-api.onrender.com) | ✅ Live |
| **Devpost Submission** | [WebMCP Challenge](https://webmcp.devpost.com/) | Submitting |

**Test it with ChatGPT**: Open the frontend in ChatGPT's in-app browser or Chrome with `chrome://flags/#enable-webmcp-testing` enabled and ask: *"It's been raining all week in Seattle. Which of my outdoor plants should I skip watering?"*

---

## 🔧 7 WebMCP Tools

Every feature below is exposed as a structured WebMCP tool callable by AI agents via `document.modelContext.registerTool()`:

| # | Tool Name | Description | Agent Prompt Example |
|---|-----------|-------------|----------------------|
| 1 | `add_plant` | Add a new plant to your collection with auto-matched care profile | "Add a Monstera deliciosa named Kitchen Fern to my indoor collection" |
| 2 | `get_care_schedule` | Get upcoming watering schedule sorted by urgency | "What needs watering this week? Show me overdue plants first" |
| 3 | `get_watering_forecast` ⭐ | Get weather-adjusted recommendations using real local rainfall | "Check if I can skip watering outdoor plants because it rained" |
| 4 | `diagnose_problem` | Diagnose plant issues from symptoms + care history evidence | "Why does my Monstera have yellow leaves and drooping?" |
| 5 | `log_care_activity` | Record care tasks (watered, fertilized, repotted, pruned, misted, rotated) | "Mark my kitchen fern as watered yesterday" |
| 6 | `plan_seasonal_planting` | Build seasonal planting calendar with companion hints | "When should I plant tomatoes and basil this season in Seattle?" |
| 7 | `log_growth` | Record growth milestones in journal timeline | "My Monstera grew its first new leaf today, now 42 cm tall" |

> **Technical Note**: Tool descriptions follow constraint C7—"Descriptions are UX for AIs". Clear usage triggers + explicit enum values ensure 100% LLM tool selection reliability.

---

## 🛠️ Tech Stack

| Layer | Technology | Version/Notes |
|-------|------------|---------------|
| **Frontend** | Vite + Vanilla ES Modules | No frameworks, <60KB gzipped bundle |
| **Backend** | Node.js + Express | REST API with JWT authentication |
| **Database** | PostgreSQL | Render Managed Postgres |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs | Stateless auth, per-user scoping |
| **Weather API** | Open-Meteo | Keyless forecast & archive API |
| **Emerging Standard** | WebMCP | `document.modelContext.registerTool()` |
| **Deployment** | Render | Static Site + Web Service + Postgres |
| **Design** | Botanical Ether Glassmorphism | Semi-transparent frosted glass panels |

---

## 📐 Architecture Overview

```
┌──────────────────────┐         ┌────────────────────────┐
│    Human Web UI      │         │   WebMCP Agent Layer   │
│  Buttons, Modals     │         │  7 × registerTool()    │
└──────────┬───────────┘         └───────────┬────────────┘
           │  UI Events                      │  Tool Execution
           └────────────────┬────────────────┘
                            ▼
             ┌─────────────────────────────────┐
             │    Client Logic & Event Bus     │
             │   (Vite + Reactive Pub/Sub)     │
             └────────────────┬────────────────┘
                              │  HTTP REST + JWT
                              ▼
             ┌─────────────────────────────────┐
             │    Server Logic Engine (Pure)   │
             │  (Node.js / Express Middleware) │
             └────────────────┬────────────────┘
                              │  Parameterized SQL
                              ▼
             ┌─────────────────────────────────┐
             │    PostgreSQL (Render Managed)  │
             │  Users, Plants, Care & Growth   │
             └─────────────────────────────────┘
```

### Architectural Constraints (C4-C7)

- **C4**: Exactly ONE business logic implementation (server-side). UI handlers and WebMCP `execute()` wrappers call same endpoints.
- **C5**: Reactive live-sync—agent tool calls trigger DOM updates via pub/sub store without page reloads.
- **C6**: Graceful degradation—app remains fully usable without WebMCP in browsers lacking support.
- **C7**: AI UX principle—tool descriptions are explicit enough for LLMs to pick correct tools every time.

---

## 🧭 Getting Started

### Prerequisites

- Node.js v20+ (for local development)
- PostgreSQL database (use Docker container or Render free tier)
- npm or pnpm package manager

### Quick Start

#### 1. Clone Repository

```bash
git clone https://github.com/dragonsterm/PlantNeeds.git
cd PlantNeeds
```

#### 2. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend (from root)
cd ../client
npm install
```

#### 3. Set Environment Variables

Create `.env` in `server/` directory:

```env
DATABASE_URL=postgres://username:password@host:port/plantneeds
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
PORT=3001
```

#### 4. Run Database Migrations

```bash
cd server
npx pg-cli -f db/migrate.sql
```

#### 5. Start Development Servers

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

The app will be accessible at `http://localhost:5173` and backend API at `http://localhost:3001`.

---

## 📁 Documentation Structure

This project uses an **Obsidian Vault** knowledge graph for documentation. All docs are linked via `[[wiki-links]]` and can be browsed in Graph View.

| Doc | Purpose |
|-----|---------|
| [`PlantNeeds-SRD.md`](PlantNeeds-SRD.md) | Software Requirements Document (full scope) |
| [`specification.md`](specification.md) | Technical contract—data shapes, function signatures |
| [`plan.md`](plan.md) | 10-day hackathon build roadmap |
| [`docs/architecture.md`](docs/architecture.md) | System architecture diagrams |
| [`docs/webmcp-tools.md`](docs/webmcp-tools.md) | All 7 tool schemas + description rules |
| [`docs/database-schema.md`](docs/database-schema.md) | PostgreSQL DDL definitions |
| [`docs/diagnosis-engine.md`](docs/diagnosis-engine.md) | Symptom→cause scoring algorithm |
| [`tasks/kanban.md`](tasks/kanban.md) | Task tracker (Day 1–10) |
| [`canvas/*.canvas`](canvas/) | Visual system maps in Obsidian Canvas |

**Tip**: Open this folder as an Obsidian vault for the full wiki-link experience. See [`README.md`](README.md#-open-as-an-obsidian-vault-recommended) for details.

---

## 🎯 Hackathon Submission Details

### Problem We Solve

Plant enthusiasts struggle with unreliable manual schedules. Overwatering kills most houseplants due to forgetfulness—not malice. Existing apps don't reason about **your** weather, **your** plants, or **your** history.

### How WebMCP Solves It

Traditional plant apps require users to manually check weather and guess scheduling. With WebMCP tools, **agents become active gardeners**:
- They query live precipitation (`get_watering_forecast`)
- Cross-reference with care logs (`diagnose_problem`)
- Execute maintenance tasks (`log_care_activity`)
- Update dashboards in real time (live-reactive sync)

### Judges Can Test

1. Open frontend in **ChatGPT browser** or Chrome with WebMCP flag
2. Say: *"It's been raining in Seattle. Which outdoor plants can I skip watering?"*
3. Watch agent call tools → verify weather verdict → see dashboard update automatically

---

## 🤝 Team

Built by:

- **[Jauza Ilham Mahardhika Putra](https://github.com/dragonsterm)** — Full-stack development, WebMCP integration, weather engine
- **[Badar Rahman](https://github.com/DarRahman)** — Full-stack development, diagnosis engine, UI design

Platform: [Render](https://render.com/) (Static Site + Web Service + Postgres)  
Challenge: [The WebMCP Challenge](https://webmcp.devpost.com/)

---

## 🏆 Accomplishments

- ✅ **Zero duplicated logic**—human clicks and agent calls share identical backend code
- ✅ **100% tool selection reliability** after iterating prompt engineering (constraint C7)
- ✅ **End-to-end autonomous demo** where ChatGPT acts as a functional gardener
- ✅ **MIT licensed open-source** repository with comprehensive documentation
- ✅ **No "AI slop"**—clean design tokens, responsive layouts, accessible interfaces

---

## 🚧 Known Future Improvements

- Soil sensor hardware integration via Web Bluetooth (real-time moisture readings)
- Multi-agent delegation—specialized sub-agents (irrigation vs pest control)
- Microclimate modeling based on building orientation and window lux levels
- Mobile native wrapper (PWA capabilities under review)

---

## 📜 License

This project is released under the **[MIT License](LICENSE)**. You're free to use, modify, and distribute this software for personal, educational, or commercial purposes.

```
MIT License

Copyright (c) 2026 Jauza Ilham Mahardhika Putra, Badar Rahman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Andrej Karpathy's /raw folder concept](https://www.youtube.com/watch?v=6bUuNlH9Y8Q)—drop anything into a folder, get structured insights
- [The WebMCP Consortium](https://webmcp.org)—enabling structured agent interaction on the open web
- [Open-Meteo](https://open-meteo.com/)—keyless weather API without signup requirements
- [Render](https://render.com)—$300 credits per winner sponsorship for hackathon winners
- Obsidian community for powerful markdown knowledge graph visualization

---

<div align="center">

**Made with 💚 and ☔ for plant parents everywhere**

*Not responsible for dead plants—always consult a local nursery for serious gardening issues!*

</div>
