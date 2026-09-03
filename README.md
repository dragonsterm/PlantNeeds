# 🌱 PlantNeeds — Autonomous Botanical Companion for Humans & AI Agents

> *"Plant apps today are reference books. PlantNeeds is a gardener."*

[![WebMCP Ready](https://img.shields.io/badge/WebMCP-7%20Tools%20Registered-22c55e?style=for-the-badge&logo=openai)](https://webmachinelearning.github.io/webmcp/)
[![Live App](https://img.shields.io/badge/Live%20Demo-PlantNeeds%20Web-15803d?style=for-the-badge&logo=render)](https://plantneeds-web.onrender.com/#dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

Built for **[The WebMCP Challenge](https://webmcp.devpost.com/)** by OpenAI, Google Chrome, Cloudflare, Vercel, Shopify, Render, and Netlify.

---

## 🌿 The Problem & Why WebMCP?

Over **60% of indoor houseplants die within their first year** — not from neglect, but from **overwatering**. Most plant apps are passive encyclopedias: they tell you a plant needs water every 7 days, but they don't know it rained 15mm outside yesterday, nor do they understand that your pot lacks drainage holes.

**PlantNeeds** bridges this gap by exposing **7 structured WebMCP tools** directly to AI agents in the browser. Instead of an agent hallucinating or guessing through a UI, the agent collaborates with the user:
- **Inspects live weather telemetries** (Open-Meteo satellite rain data).
- **Auto-skips outdoor watering** when natural rain covers hydration needs.
- **Diagnoses botanical diseases** using a deterministic cross-reference engine (observed physical symptoms $\times$ actual watering cadence $\times$ pot drainage).
- **Orchestrates companion planting** and agricultural sowing calendars.

---

## 🛠️ The 7 Registered WebMCP Tools

All tools are registered via `document.modelContext.registerTool({ name, description, inputSchema, execute })` following the official [WebMCP Specification](https://webmachinelearning.github.io/webmcp/):

| # | WebMCP Tool | Description & Role | Key Input Parameters |
|---|---|---|---|
| 1 | `add_plant` | Adds a plant to the collection with botanical profile, water frequency, light needs, and pot drainage. | `name`, `species`, `location`, `light_exposure`, `pot_has_drainage` |
| 2 | `get_care_schedule` | Queries single source of truth upcoming watering dates sorted by urgency and overdue status. | `plant_id` (optional), `days_ahead` |
| 3 | `get_watering_forecast` | **Flagship Tool:** Fetches real Open-Meteo rainfall telemetry to determine whether outdoor plants can **SKIP** watering. | `latitude` (optional auto-resolve), `longitude` |
| 4 | `diagnose_problem` | Cross-references observed physical symptoms with historical watering intervals and pot drainage for root rot / dehydration analysis. | `plant_id`, `symptoms[]` |
| 5 | `log_care_activity` | Records routine care tasks (`watered`, `fertilized`, `repotted`, `pruned`, `misted`, `rotated`) with agent provenance. | `plant_id`, `activity`, `date`, `notes` |
| 6 | `plan_seasonal_planting` | Computes outdoor crop sowing, transplanting, harvest dates, and companion planting matrices by climate zone. | `latitude`, `longitude`, `crops[]` |
| 7 | `log_growth` | Records milestone journals and height check measurements into the plant's timeline. | `plant_id`, `milestone`, `height_cm`, `notes` |

---

## 🔬 Core Architectural Innovations

### 1. Zero-Hallucination Diagnosis Engine
Instead of generic LLM guessing, `diagnoseProblem()` runs a deterministic rule matrix:
$$\text{Confidence Score} = f(\text{Symptoms}, \Delta t_{\text{watered}}, \text{Pot Drainage}, \text{Light Level})$$
- If a plant shows **Yellowing Leaves + Soft Stems** and was watered $3\text{d}$ ago (recommended interval: $10\text{d}$) in a pot without drainage, it scores **92% Confidence: Overwatering & Early Root Rot**.
- If the same symptoms occur after a $21\text{d}$ watering drought, it identifies **Underwatering & Dehydration**.

### 2. Autonomous Weather Rain Delay Auto-Skip
Using real-time keyless satellite data from **Open-Meteo**:
- The agent and app track 7-day cumulative rainfall.
- Outdoor garden beds automatically receive **`Rain Covered / Skip`** guidance when precipitation $\ge 5\text{ mm}$, preventing over-saturation and root rot.

### 3. Reactive Tri-Directional State Sync (C5)
- When an AI agent executes a tool in the background (e.g. `log_care_activity`), custom event buses (`care-logged`, `plants-changed`) immediately trigger live DOM re-renders.
- The human user sees the UI update in real-time without reloading the page.

### 4. Botanical Design System
- Dual aesthetic themes: **Dark Emerald** (deep forest night) & **Light Summer Vibes** (frosted botanical glassmorphism).
- Zero-shift navigation with absolute indicator capsules.
- Dynamic plant photography library auto-matched from botanical species profiles with custom user photo upload support.

---

## 🧪 How Judges Can Test

### Option A: ChatGPT In-App Browser (Recommended)
1. Open the ChatGPT Desktop app.
2. Direct ChatGPT to navigate to the live URL:  
   **`https://plantneeds-web.onrender.com/#dashboard`**
3. In ChatGPT chat, instruct the model:
   - *"Check my garden on PlantNeeds and see if any plants need care."*
   - *"It rained heavily today. Check the watering forecast and tell me which plants I can skip."*
   - *"Add a Sweet Basil plant located outdoors in bright light."*
   - *"My Monstera has yellow leaves and mushy stems. Run a diagnosis."*
4. Watch ChatGPT discover and invoke the page-exposed tools while the PlantNeeds UI updates live!

### Option B: Google Chrome with WebMCP Enabled
1. Open Google Chrome (v134+).
2. Go to `chrome://flags/#enable-webmcp-testing` and set to **Enabled**. Relaunch Chrome.
3. Open `https://plantneeds-web.onrender.com/#dashboard`.
4. Open Chrome DevTools (`F12`) $\rightarrow$ Application $\rightarrow$ WebMCP to inspect all 7 active tool schemas and execution listeners.

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/dragonsterm/PlantNeeds.git
cd PlantNeeds

# 2. Setup & run backend API (Node.js Express + SQLite/PostgreSQL)
cd server
npm install
npm run dev

# 3. Setup & run frontend client (Vite SPA)
cd ../client
npm install
npm run dev
```

Visit `http://localhost:5173` (or preview at `http://localhost:4174`).

### Automated Test Suite
Run the comprehensive 3-tier validation tests:
```bash
node test-day-5.js   # Validates all 7 WebMCP tool schemas and fallback degradation
node test-day-6.js   # Tests diagnosis rule engine & medical disclaimer
node test-day-8.js   # Tests agricultural seasonal planner & companion matrices
```

---

## ⚖️ Legal & Privacy Compliance
- **MIT License**: Detectable open-source license visible in [`LICENSE`](LICENSE).
- **Privacy Policy**: Accessible at [`/privacy-policy.html`](https://plantneeds-web.onrender.com/privacy-policy.html) (NFR-3 geolocation privacy, keyless Open-Meteo).
- **Terms of Service & Disclaimer**: Accessible at [`/terms-of-service.html`](https://plantneeds-web.onrender.com/terms-of-service.html) (NFR-7 botanical care and health disclaimer).

---

## 👥 Team
- **Badar Rahman** ([@DarRahman](https://github.com/DarRahman))
- **Jauza Ilham Mahardhika Putra** ([@dragonsterm](https://github.com/dragonsterm))
