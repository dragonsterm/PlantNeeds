# PlantNeeds — Garden & Houseplant Companion
## Software Requirements Document (SRD)

| | |
|---|---|
| **Project Name** | PlantNeeds |
| **Type** | WebMCP-Powered Web Application |
| **Purpose** | Submission for The WebMCP Challenge (Devpost Hackathon) |
| **Version** | 1.0 |
| **Status** | Planning / Pre-Development |

---

# 1. What Is PlantNeeds? (Plain English)

PlantNeeds is a **website that helps people keep their plants alive**.

You tell it what plants you own (houseplants, garden vegetables, flowers). It then:

- 📅 Tracks when each plant needs water, fertilizer, or repotting
- 🌧️ Checks the **real weather** in your area and tells you when rain has already watered your outdoor plants (so you can skip watering)
- 🔍 Helps you figure out **what's wrong** when a plant looks sick (yellow leaves, brown tips, drooping...)
- 📓 Keeps a **growth journal** so you can look back at your plant's progress

### The Special Ingredient: WebMCP

PlantNeeds is built to work with **AI agents** (like ChatGPT). Normally, an AI visiting a website has to guess how to click buttons and fill forms. PlantNeeds instead exposes a **menu of tools** the AI can call directly — like a waiter handing the AI a menu instead of making it wander into the kitchen.

This is done through a new open web standard called **WebMCP**, using a browser feature: `document.modelContext.registerTool()`.

> **In short:** You can tell your AI assistant, *"It's been raining all week — which of my plants should I skip watering? And why does my monstera have yellow leaves?"* — and the AI will use PlantNeeds tools to check your local weather, review your watering history, and give you a real answer in seconds.

---

# 2. The Problem We're Solving

### Facts
- **~70% of houseplants die from overwatering**, not neglect. People care — they just can't keep track.
- Plant owners juggle: *Which plant needs water today? Did I already water the fern? It rained — should I skip the garden? Why are these leaves yellow?*
- Existing plant apps are **static databases** — digital reference books. They show generic care info but can't reason about *your* weather, *your* plants, and *your* history.

### The Gap
Nobody has built a plant app that **reasons**. Doing so requires an AI agent that can act on real data — and agents can only do that reliably when a website exposes structured tools. That's exactly what WebMCP enables.

### Our One-Line Pitch
> *"Plant apps today are reference books. PlantNeeds is a gardener."*

---

# 3. Goals & Non-Goals

### ✅ Goals (What We WILL Build)
| # | Goal |
|---|---|
| G1 | A working web app with **user accounts** where users manage their own plant collection (add, view, edit, remove) |
| G2 | Automatic care scheduling (when to water/fertilize each plant) |
| G3 | **Weather-aware watering advice** using a real, free weather API (Open-Meteo) |
| G4 | A symptom-based **plant problem diagnosis** feature that considers the plant's actual care history |
| G5 | A growth journal (milestones, notes, dates) |
| G6 | **7 WebMCP tools** registered in the page so AI agents can do everything above |
| G7 | A visual UI that **updates live** when the agent performs an action |
| G8 | Deployed public URL + open-source repo + demo video (hackathon requirements) |
| G9 | **Server-side persistence**: per-user data (collection, tracker, journal) stored in PostgreSQL, synced across devices |

### ❌ Non-Goals (What We Will NOT Build)
| # | Exclusion | Why |
|---|---|---|
| N1 | ~~No user accounts~~ → **We DO have accounts now** (username/password + JWT, server-side) | Revised 2026-08-28 (ADR-009) — accounts are a goal |
| N2 | ~~No backend server~~ → **We DO have a backend now** (Node/Express + PostgreSQL on Render) | Revised 2026-08-28 (ADR-009) — server-side persistence |
| N3 | No photo-based disease detection (AI image recognition) | Too large for a 10-day build; symptom checklists cover the use case |
| N4 | No mobile native app | Web app only; mobile-responsive in browser |
| N5 | No plant store / e-commerce | Out of scope by design |
| N6 | No social features (sharing, feeds) | Out of scope for v1 |
| N7 | No third-party OAuth (Google/GitHub login) | Username/password only — keeps auth simple for hackathon |

---


# 4. Who Is This For? (Users & Personas)

### Primary Persona: "Plant Parent Priya"
- **Who:** 28-year-old apartment dweller with 8 houseplants
- **Pain:** Forgets watering schedules; killed 3 plants last year to overwatering; Googles symptoms in a panic
- **What she needs:** A schedule she can trust, and quick answers when something looks wrong

### Secondary Persona: "Weekend Gardener Greg"
- **Who:** 45-year-old suburban homeowner with a backyard vegetable garden
- **Pain:** Waters on a fixed schedule even when it rained; doesn't know when to plant what
- **What he needs:** Weather-based watering guidance and a seasonal planting calendar

### Third "User": The AI Agent
- **Who:** ChatGPT (or any agent-enabled browser) acting on the user's behalf
- **What it needs:** Clearly described tools with structured inputs/outputs — which we provide via WebMCP

---

# 5. User Stories

> Format: *"As a [user], I want [goal] so that [benefit]."*

### Core (Must Have)
| ID | Story |
|---|---|
| US-01 | As a plant owner, I want to **add my plants** with their species and location, so the app knows their care needs |
| US-02 | As a plant owner, I want to **see a care schedule**, so I know what needs attention today |
| US-03 | As a plant owner, I want to **log when I water** a plant, so the schedule stays accurate |
| US-04 | As a gardener, I want the app to **check real rainfall** and tell me to skip watering outdoor plants, so I don't overwater |
| US-05 | As a plant owner, I want to **describe symptoms** (yellow leaves etc.) and get a likely diagnosis, so I can fix problems early |
| US-06 | As a user, I want my **AI assistant to do all of this for me** through conversation, so I don't have to click through the app |

### Secondary (Should Have)
| ID | Story |
|---|---|
| US-07 | As a plant owner, I want to **log growth milestones**, so I can see my plant's journey |
| US-08 | As a gardener, I want a **seasonal planting plan** for my crops, so I plant at the right time |
| US-09 | As a user, I want to **see the agent's actions happen live** on screen, so I trust what it's doing |

### Stretch (Nice to Have)
| ID | Story |
|---|---|
| US-10 | As a user, I want care reminder notifications |
| US-11 | As a user, I want to export my plant journal as a shareable summary |

---

# 6. The Demo Scenario (How It All Comes Together)

**Setup:** Priya has 6 houseplants + an outdoor garden bed logged in PlantNeeds. It has rained for 4 days straight.

**Priya says to her AI assistant:**
> *"It's rained all week — which of my plants should I skip watering? And my monstera has yellow leaves, what's wrong?"*

**Behind the scenes, the agent uses PlantNeeds WebMCP tools:**

1. **Calls `get_watering_forecast`** -> PlantNeeds fetches live rainfall data for Priya's location (Open-Meteo API) -> returns: 2.1 inches of rain this week
2. Agent reasons: outdoor tomatoes & lavender got enough rain -> **skip**; indoor pothos & fern still **due today**
3. **Calls `diagnose_problem({ plant_id, symptoms: ["yellow_leaves"] })`** -> PlantNeeds checks the watering log: monstera watered every 4 days, but needs 10 -> **likely overwatering**
4. Agent answers: *"Skip your outdoor plants — rain covered them. Your pothos and fern are due indoors. Your monstera's yellow leaves are likely overwatering — you're watering every 4 days but it prefers every 10. Let it dry out."*
5. **Calls `log_care_activity`** when Priya confirms she watered the fern -> the on-screen fern card animates, the "3 plants due" badge drops to 2

**Time with PlantNeeds + agent: ~20 seconds.**
**Time manually (checking each plant, weather app, plant care websites): ~15 minutes.**


# 7. Functional Requirements

> Each requirement has an ID, priority (MoSCoW: **M**ust / **S**hould / **C**ould / **W**on't), and acceptance criteria.

## 7.1 Plant Collection Management
| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | User can add a plant with: nickname, species, location (indoor/outdoor), light exposure, pot drainage, acquired date | **M** |
| FR-1.2 | The app auto-assigns a **care profile** (watering frequency, tips) from a built-in plant database (~50 common species) | **M** |
| FR-1.3 | User can edit or remove a plant | **M** |
| FR-1.4 | Unknown species fall back to a generic care profile with sensible defaults | **S** |

## 7.2 Care Scheduling
| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | App computes each plant's next watering date from (last watered date + species frequency) | **M** |
| FR-2.2 | Dashboard shows a sorted "due soon / overdue" list | **M** |
| FR-2.3 | Supports activities: watered, fertilized, repotted, pruned, misted, rotated | **M** |
| FR-2.4 | Logging an activity updates the schedule immediately | **M** |

## 7.3 Weather-Aware Watering (The Star Feature)
| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | App fetches real weather data from **Open-Meteo API** (free, no API key) using the user's latitude/longitude | **M** |
| FR-3.2 | For each outdoor plant, app compares rain received (past 7 days) vs. the plant's weekly water needs | **M** |
| FR-3.3 | App returns a clear recommendation per plant: **"SKIP — rain covered it"** or **"WATER — rain insufficient"**, with the numbers shown | **M** |
| FR-3.4 | Indoor plants are excluded from rain logic but included in normal schedule checks | **M** |

## 7.4 Problem Diagnosis
| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | User (or agent) selects symptoms from a defined list: yellow_leaves, brown_tips, drooping, spots, wilting, pests_visible, slow_growth, leaf_drop, mushy_stem | **M** |
| FR-4.2 | Diagnosis engine matches symptoms to likely causes using a built-in symptom matrix (~20 mappings) | **M** |
| FR-4.3 | Diagnosis **cross-references the plant's actual care history** (e.g., watering gap vs. recommended gap) to rank likelihood — this is what makes it "reasoning," not just lookup | **M** |
| FR-4.4 | Results show: top 3 likely causes, the evidence used, and a suggested fix | **M** |

## 7.5 Growth Journal
| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | User can log milestones (e.g., "first new leaf"), optional height, notes, auto-dated | **S** |
| FR-5.2 | Timeline view per plant shows full milestone history | **S** |

## 7.6 Seasonal Planting Planner
| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Given a location and crop list, app returns a planting calendar (start indoors, transplant, days to harvest) from a built-in crop database | **S** |
| FR-6.2 | Includes companion planting hints (what grows well together / what to keep apart) | **C** |

## 7.7 WebMCP Integration (Hackathon Core)
| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | All 7 tools (see Section 8) are registered via `document.modelContext.registerTool()` on page load | **M** |
| FR-7.2 | Every tool's `execute()` function and the UI's button handlers call the **same underlying logic** (one source of truth, zero drift) | **M** |
| FR-7.3 | When an agent calls a tool, the **visual UI updates live** (card re-renders, toast notification, badge count changes) | **M** |
| FR-7.4 | App works in ChatGPT's in-app browser AND Chrome with `chrome://flags/#enable-webmcp-testing` | **M** |
| FR-7.5 | App degrades gracefully: fully usable by humans with no agent present | **M** |

---

# 8. WebMCP Tool Definitions (The Agent's Menu)

> These are the 7 tools the AI agent can call. Each has: a name, a plain description (this is what the agent reads to decide when to use it — descriptions matter!), inputs, and what it returns.

## Tool Summary Table
| # | Tool Name | What It Does | Key Inputs | Returns |
|---|---|---|---|---|
| 1 | `add_plant` | Adds a plant to the collection with its auto-matched care profile | name, species, location, light, drainage | success + care tips |
| 2 | `get_care_schedule` | Lists upcoming/overdue care tasks | plant_id (optional), days_ahead | sorted schedule |
| 3 | `get_watering_forecast` | **Weather-adjusted watering advice using real rain data** | latitude, longitude | per-plant skip/water verdicts + rain numbers |
| 4 | `diagnose_problem` | Diagnoses plant illness from symptoms + care history | plant_id, symptoms[] | top 3 causes + evidence + fixes |
| 5 | `log_care_activity` | Records watering/fertilizing/etc. | plant_id, activity, date (optional) | success + next due date |
| 6 | `plan_seasonal_planting` | Builds a planting calendar for outdoor crops | latitude, longitude, crops[] | per-crop plan |
| 7 | `log_growth` | Records a growth milestone in the journal | plant_id, milestone, height (optional), notes | success + timeline |

## Example: Tool 3 in Full (the most important one)
```javascript
document.modelContext.registerTool({
    name: "get_watering_forecast",
    description: "Get weather-adjusted watering recommendations using real " +
                 "local weather data. Outdoor plants are checked against " +
                 "actual and forecast precipitation.",
    inputSchema: {
        type: "object",
        properties: {
            latitude:  { type: "number" },
            longitude: { type: "number" }
        },
        required: ["latitude", "longitude"]
    },
    execute: async ({ latitude, longitude }) => {
        // Free API, no key needed
        const weather = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=" + latitude +
            "&longitude=" + longitude +
            "&daily=precipitation_sum,temperature_2m_max" +
            "&past_days=7&forecast_days=7&timezone=auto"
        ).then(r => r.json());

        // Compare rain vs. each outdoor plant's needs,
        // then return SKIP or WATER verdicts per plant...
    }
});
```

## The Golden Rule of Tool Design
> **Every tool has a visible consequence, and every UI element is reachable by a tool.**

The UI button "Mark as Watered" and the agent tool `log_care_activity` call the **same function**. One logic, two callers.


# 9. System Architecture

## 9.1 High-Level Diagram
```
+------------------------------------------------------+
|                  PlantNeeds (Web App)                |
|                                                      |
|  +---------------+    +---------------------------+  |
|  |   HUMAN UI    |    |   WebMCP TOOL LAYER       |  |
|  |  (dashboard,  |    |   7 x registerTool()      |  |
|  |   cards,      |    |   (agents use these)      |  |
|  |   journal)    |    +-------------+-------------+  |
|  +-------+-------+                  |                |
|          |                          |                |
|          +-----------+--------------+                |
|                      v                               |
|           +---------------------+    BOTH call the   |
|           |   CLIENT LOGIC      |    SAME endpoints  |
|           |   (calls the API)   |    (via HTTP+JWT)  |
|           +---------+-----------+                    |
+---------------------|--------------------------------+
                      v  HTTP + JWT
+======================================================+
|   REST API (Node/Express on Render Web Service)      |
|     auth middleware -> business logic (server/logic) |
+=========================+============================+
                          v  SQL
           +---------------------+
           |   PostgreSQL        |    SINGLE SOURCE
           |   users, plants,    |    OF TRUTH
           |   care_log, etc.    |
           +---------------------+
                      +
           +---------------------+
           |   Open-Meteo API    |    FREE, no key (via server proxy)
           +---------------------+

Deployment: Render Static Site (client) + Web Service (API) + managed PostgreSQL.
```

## 9.2 The Three-Layer Sync Rule
```
   UI Layer      <- humans see this (buttons, cards, charts)
     ^v  (reactive updates)
   Tool Layer    <- agents call this (registerTool execute functions)
     ^v  (both call the SAME API endpoints!)
   Server+DB     <- single source of truth (PostgreSQL)
```
When an agent waters a plant via a tool call, the tool calls the API -> the server writes to Postgres -> the client store refreshes -> the UI re-renders -> the human **sees the agent's action live on screen**. This is the demo superpower.

## 9.3 Technology Choices
| Layer | Choice | Why |
|---|---|---|
| Frontend | Vanilla JS + Vite (React optional) | Reactive re-rendering makes agent->UI sync easy |
| Backend API | Node.js + Express | Standard REST, easy to host on Render |
| Database | PostgreSQL (Render managed) | Server-side per-user persistence, cross-device sync |
| Auth | JWT + bcrypt | Stateless, hackathon-appropriate (username/password) |
| Client state | pub/sub store | UI + tools share the same view of server data |
| Weather | Open-Meteo API | Free, no API key, includes past + forecast precipitation |
| Hosting | Render (Static + Web Service + Postgres) | One platform, free tier, hackathon sponsor |
| WebMCP | `document.modelContext.registerTool()` | The standard being tested |
| Plant data | Built-in `plants-db.json` (~50 species) | Static reference, no external dependency |

## 9.4 Data Model (What We Store — in PostgreSQL)
```
users
  id, username, password_hash, created_at

plants
  id, user_id, name, species, location (indoor/outdoor),
  light_exposure, pot_has_drainage, acquired_date,
  water_frequency_days, water_needs_inches_weekly (outdoor),
  last_watered

care_log
  id, plant_id, activity (watered/fertilized/...), date, notes, source (human/agent)

growth_log
  id, plant_id, milestone, height_cm, notes, date, source
```

## 9.5 Built-In Plant Database (seed data, example entry)
```json
{
  "monstera_deliciosa": {
    "common_name": "Monstera",
    "water_frequency_days": 10,
    "light": "bright_indirect",
    "humidity": "high",
    "toxic_to_pets": true,
    "common_issues": ["yellow_leaves_from_overwatering",
                      "brown_tips_from_low_humidity"],
    "tips": "Loves to climb - give it a moss pole."
  }
}
```

---

# 10. User Interface (What Humans See)

> The app serves **two audiences**: humans (visual UI) and agents (tools). Both share the same data.

## 10.1 Main Dashboard Components
| Component | What It Shows | Linked Tool(s) |
|---|---|---|
| **Plant cards grid** | One card per plant: emoji/photo, name, species, countdown ring to next watering | `get_care_schedule`, `log_care_activity` |
| **"Today" banner** | Summary like: "Rain 2.1 in this week - outdoor plants skipped. 2 indoor plants due." | `get_watering_forecast` |
| **Weather widget** | The same Open-Meteo data the agent's tool uses | `get_watering_forecast` |
| **Diagnosis panel** | Symptom picker -> results with causes, evidence, fixes | `diagnose_problem` |
| **Activity timeline** | Every action logged with source: "Watered by agent - 2 min ago" | all tools |
| **Growth journal** | Milestone timeline per plant | `log_growth` |

## 10.2 The "Live Sync" Demo Moment
When the judge says *"water my monstera"* to the AI:
1. Agent calls `log_care_activity`
2. Tool calls the API → shared server logic writes to PostgreSQL
3. UI reacts: monstera card animates, badge "3 due" -> "2 due", toast appears: "Monstera marked as watered"
4. **The judge watches the agent act inside the app.** That is the winning moment.

## 10.3 Accessibility & Graceful Degradation
- App is 100% usable by a human with NO agent present (FR-7.5)
- Mobile-responsive layout
- Clear loading/error states for the weather API (e.g., "Weather unavailable - showing schedule-based advice")


# 11. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | **Performance** | Page loads in under 3 seconds on average broadband |
| NFR-2 | **Offline behavior** | Core reads (schedule, journal) render from cache offline; mutations + weather require connectivity |
| NFR-3 | **Privacy & Security** | Passwords bcrypt-hashed; JWT auth; all plant data scoped per user; only the anonymous Open-Meteo call (lat/long) leaves our infrastructure. Secrets (`DATABASE_URL`, `JWT_SECRET`) in env vars, never committed |
| NFR-4 | **Compatibility** | Works in Chrome/Edge (WebMCP flag) and ChatGPT's in-app browser; degrades gracefully in other browsers |
| NFR-5 | **Cost** | Free tier — Render Static Site + Web Service + free Postgres (30-day), keyless weather API |
| NFR-6 | **Maintainability** | Open source with clear README, MIT/Apache license file visible at repo top (hackathon requirement) |
| NFR-7 | **Safety** | Diagnosis results include a disclaimer: "Guidance for common issues — consult a local nursery/extension service for serious problems" |

---

# 12. How the Agent Understands Our Tools (Important!)

Agents decide which tool to call by reading the **tool descriptions**. This means:

1. **Descriptions are UX for AI.** "Get weather-adjusted watering recommendations using real local weather data" tells the agent exactly when to use it. Vague descriptions = agent picks the wrong tool.
2. **Inputs must be self-explanatory.** `latitude` + `longitude`, not `loc_a` + `loc_b`.
3. **Outputs must be structured JSON** the agent can reason over — not HTML, not prose.
4. **Enum values for symptoms** prevent the agent from inventing symptoms we can't diagnose.

---

# 13. 10-Day Build Plan

| Day | Task | Deliverable |
|---|---|---|
| 1-2 | Scaffold client+server, PostgreSQL schema + pool, plant DB JSON (~50 species) | App skeleton + data layer |
| 3 | Human UI: plant list, add-plant form, care schedule view | Usable-by-human v1 |
| 4 | Wire Open-Meteo API + `get_watering_forecast` logic | Weather feature working |
| 5 | Register all 7 WebMCP tools; test in Chrome with the WebMCP flag | Agent can call tools |
| 6 | Build `diagnose_problem` symptom matrix (~20 mappings) + likelihood scoring | Diagnosis engine |
| 7 | End-to-end test in **ChatGPT's in-app browser**; refine tool descriptions | Agent demo works live |
| 8 | Polish UI, growth journal, live-sync animations, edge cases | Complete product feel |
| 9 | Deploy to Render; record 3-min demo video; write README | Submission assets |
| 10 | Add open-source license, write submission text, submit | SUBMITTED |

---

# 14. Testing Plan

| Test | How | Pass Criteria |
|---|---|---|
| Human UI flow | Manually add 5 plants, log watering, check schedule | All CRUD works, dates compute correctly |
| Weather logic | Test with a rainy location and a dry location | Correct SKIP/WATER verdicts with numbers shown |
| Diagnosis | Water a test plant too often, then diagnose "yellow_leaves" | Overwatering ranks #1 with evidence cited |
| WebMCP in Chrome | Enable `chrome://flags/#enable-webmcp-testing`, call each tool | All 7 tools execute and return valid JSON |
| WebMCP in ChatGPT browser | Run the full demo scenario (Section 6) | Agent completes scenario end-to-end |
| Live UI sync | Have agent water a plant while watching the screen | UI updates without page refresh |
| No-agent fallback | Use the app in plain Firefox/Safari | Fully functional as a normal web app |

---

# 15. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| WebMCP API surface changes before deadline | Medium | Follow the spec repo + Chrome docs weekly; keep tool-registration code isolated in one file for easy updates |
| Open-Meteo rate limits / downtime | Low | Cache last response; fall back to schedule-only advice with a notice |
| Tool descriptions confuse the agent | Medium | Test heavily in ChatGPT browser (Day 7); iterate wording; provide rich `description` + `inputSchema` descriptions |
| Scope creep (too many features) | High | MoSCoW priorities in Section 7 — cut all "Could" items first; Tools 6-7 are droppable |
| Diagnosis matrix too shallow to impress | Medium | Invest Day 6 fully; 20+ symptom mappings with history-based scoring is the differentiator |

---

# 16. Hackathon Submission Checklist

- [ ] **Live URL** judges can open in ChatGPT's browser / Chrome with WebMCP enabled
- [ ] **7 WebMCP tools** registered and working (non-trivial implementation)
- [ ] **Public GitHub repo** with all source code + open-source license visible at top
- [ ] **Demo video** (under 3 minutes, YouTube, with audio) showing the Section 6 scenario
- [ ] **Submission text** answering:
  - Why is this a strong fit for WebMCP? -> *Agents can reason about care using real weather + history; impossible via UI-clicking*
  - What can people + agents do together that was hard before? -> *"It's raining - which plants do I skip?" answered in 20 seconds with real data*
  - How was WebMCP implemented? -> *7 structured tools, shared logic layer, live UI sync*

## Judging Criteria -> Our Answer
| Criterion | How PlantNeeds Scores |
|---|---|
| **WebMCP Leverage** | 7 distinct tools with real logic (weather integration, history-based diagnosis, state management) — not a token implementation |
| **Execution** | Complete product: dashboard, journal, diagnosis panel — not a proof of concept |
| **Potential Impact** | ~66% of US households own houseplants; most die of overwatering — universal, specific, provable problem |
| **Creativity & Ambition** | "Weather-aware agent gardener" is a fresh concept; live agent->UI sync is a standout demo |

---

# 17. Glossary (For Anyone New)

| Term | Meaning |
|---|---|
| **WebMCP** | An open web standard letting websites expose structured "tools" that AI agents can call directly |
| **Agent** | An AI assistant (like ChatGPT) that can act on your behalf |
| **Tool** | A function a website registers (name + description + inputs + code) that an agent can call |
| `registerTool()` | The JavaScript method websites use to publish their tools |
| **PostgreSQL** | The server database that stores user accounts, plants, and logs (single source of truth) |
| **JWT** | JSON Web Token — the signed token a client uses to prove it's logged in |
| **Express** | The Node.js framework our REST API is built with |
| **Open-Meteo** | A free weather API requiring no signup or API key |
| **MoSCoW** | Priority system: Must have, Should have, Could have, Won't have |
| **SRD** | Software Requirements Document — this file |

---

*Document ends. Next step: set up the project scaffold (Day 1-2 of the build plan).*
