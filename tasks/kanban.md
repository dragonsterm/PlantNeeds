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
| T-01 | Scaffold Vite app + repo structure | 1 | [[specification#1. Technology Stack (Locked)|spec §1]] |
| T-02 | IndexedDB schema via Dexie + store.js event bus | 1 | [[docs/data-model]] |
| T-03 | plants-db.json — 50 species seed data | 2 | [[docs/data-model#Plant Database Format|data-model]] |
| T-04 | Species matching (aliases, fallback profile) | 2 | [[docs/data-model#Species Matching (agent-friendly)|matching]] |
| T-05 | Plant list + AddPlantForm UI | 3 | [[docs/ui-ux-overview]] |
| T-06 | Care schedule view + DueBadge | 3 | [[specification#3.1 plants.js|spec §3.1]] |
| T-07 | Open-Meteo fetch + cache + fallback | 4 | [[docs/api-integrations]] |
| T-08 | getWateringForecast logic + weather widget | 4 | [[docs/api-integrations#Forecast Logic (FR-3.x) — implemented in logic/weather.js|forecast logic]] |
| T-09 | registerAllTools() — all 7 wrappers | 5 | [[docs/webmcp-tools]] |
| T-10 | Chrome WebMCP flag test pass (T1–T6) | 5 | [[docs/testing-strategy#2. WebMCP Tool Tests (manual — Chrome)|tool tests]] |
| T-11 | symptoms-matrix.json — 20 causes | 6 | [[docs/diagnosis-engine#Target Coverage (~20 causes — Day 6 work, tasks/day-06)|coverage]] |
| T-12 | diagnoseProblem scoring + evidence strings | 6 | [[docs/diagnosis-engine]] |
| T-13 | DiagnosisPanel UI | 6 | [[docs/ui-ux-overview]] |
| T-14 | ChatGPT-browser E2E pass + description iteration | 7 | [[docs/testing-strategy#3. E2E Agent Scenario (manual — ChatGPT in-app browser)|E2E]] |
| T-15 | Growth journal UI + log_growth tool verify | 8 | [[specification#3.4 planner.js (secondary)|spec §3.4]] |
| T-16 | Seasonal planting planner | 8 | [[docs/api-integrations#Seasonal Planner Use|planner]] |
| T-17 | Live-sync toasts/animations polish | 8 | [[docs/ui-ux-overview#The Live-Sync Mechanism (C5) — HOW agent actions become visible|live-sync]] |
| T-18 | Deploy to Render Static Site | 9 | [[docs/deployment]] |
| T-19 | Demo video (<3 min, audio) | 9 | [[PlantNeeds-SRD#16. Hackathon Submission Checklist|SRD §16]] |
| T-20 | README + LICENSE + submission text | 10 | [[PlantNeeds-SRD#16. Hackathon Submission Checklist|SRD §16]] |

## 🔨 In Progress
_(empty — pull from Backlog)_

## 🐛 Bugs
_(log with repro steps — see [[docs/testing-strategy#Bug Protocol|bug protocol]])_

## ✅ Done
_(move completed tasks here with completion date)_
