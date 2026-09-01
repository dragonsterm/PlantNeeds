---
tags: [tasks, kanban]
type: tracker
---
# ✅ PlantNeeds — Master Task Board

> Single source of truth for work status. Daily details live in [[tasks/day-01]] … [[tasks/day-10]].
> Roadmap context: [[plan]] · Specs: [[specification]]
> **Agents:** when you finish a task, move it to Done AND check it off in the day note, in the same commit.

## 📋 Backlog
| ID | Task | Day | Links |
|---|---|---|---|
| T-08 | Plants CRUD + care-log API endpoints | 4 | [[docs/backend-api#Plants (collection + tracker)\|plants API]] |
| T-09 | Open-Meteo proxy + cache + `getWateringForecast` logic + widget | 4 | [[docs/api-integrations]] |
| T-10 | registerAllTools() — all 7 wrappers (over client/logic → API) | 5 | [[docs/webmcp-tools]] |
| T-11 | Chrome WebMCP flag test pass (T1–T6, with auth) | 5 | [[docs/testing-strategy#3. WebMCP Tool Tests (manual — Chrome)|tool tests]] |
| T-12 | symptoms-matrix.json — 20 causes | 6 | [[docs/diagnosis-engine#Target Coverage (~20 causes — Day 6 work, tasks/day-06)|coverage]] |
| T-13 | diagnoseProblem scoring + `/api/diagnose` endpoint | 6 | [[docs/diagnosis-engine]] |
| T-14 | DiagnosisPanel UI | 6 | [[docs/ui-ux-overview]] |
| T-15 | ChatGPT-browser E2E pass + description iteration | 7 | [[docs/testing-strategy#4. E2E Agent Scenario (manual — ChatGPT in-app browser)|E2E]] |
| T-16 | Growth journal UI + log_growth endpoint | 8 | [[docs/backend-api]] |
| T-17 | Seasonal planting planner | 8 | [[docs/api-integrations#Seasonal Planner Use|planner]] |
| T-18 | Live-sync toasts/animations polish | 8 | [[docs/ui-ux-overview#The Live-Sync Mechanism (C5) — HOW agent actions become visible|live-sync]] |
| T-19 | Deploy: Render Static + Web Service + Postgres (`render.yaml`) | 9 | [[docs/deployment]] |
| T-20 | Demo video (<3 min, audio) | 9 | [[PlantNeeds-SRD#16. Hackathon Submission Checklist|SRD §16]] |
| T-21 | README + LICENSE + submission text | 10 | [[PlantNeeds-SRD#16. Hackathon Submission Checklist|SRD §16]] |
| T-22 | API & auth test pass (A1–A10) | 4,6 | [[docs/testing-strategy#2. API & Auth Tests (scripted — HTTP against running server)|api tests]] |

## 🔨 In Progress
_(empty — pull from Backlog)_

## 🐛 Bugs
_(log with repro steps — see [[docs/testing-strategy#Bug Protocol|bug protocol]])_

## ✅ Done
|| ID | Task | Day | Completed | Links |
|---|---|---|---|---|
| T-01 | Scaffold Vite client + Express server + repo structure | 1 | 2026-09-01 (`45d343f`) | [[specification#1. Technology Stack (Locked)|spec §1]] |
| T-02 | PostgreSQL schema (`migrate.sql`) + `db/pool.js` + reactive store | 1 | 2026-09-01 (`45d343f`) | [[docs/database-schema]] |
| T-03 | plants-db.json — 53 species seed data (30 indoor + 23 outdoor) | 2 | 2026-09-01 (`5bd7296`) | [[docs/data-model#Plant Database Format|data-model]] |
| T-04 | Species matching (aliases, fallback profile) | 2 | 2026-09-01 (`4f5e877`) | [[docs/data-model#Species Matching (agent-friendly)|matching]] |
| T-05 | Auth endpoints: register/login/me (JWT + bcryptjs) + auth middleware | 2 | 2026-09-01 (`bde98c2`) | [[docs/backend-api#Authentication\|backend-api]] |
| T-06 | Plant list + AddPlantForm (53 species autocomplete) + Login/Register UI | 3 | 2026-09-01 | [[docs/ui-ux-overview]] |
| T-07 | Care schedule view (7d/14d/30d modal) + DueBadge + countdown rings | 3 | 2026-09-01 | [[specification#3.2 Client orchestration|spec §3.2]] |
