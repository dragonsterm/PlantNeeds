# AGENTS.md — Universal AI Agent Instructions

> This file follows the emerging **AGENTS.md open convention** — a tool-agnostic instruction file read by AI coding agents (OpenAI Codex, Claude Code, Cursor, Aider, etc.). If your tool reads `CLAUDE.md` instead, that file exists too and mirrors this one.

---

## Mission

Build **PlantNeeds**: a WebMCP-powered plant care web app for the WebMCP Challenge hackathon. Deadline-driven 10-day build. Full context lives in this Obsidian vault — start with [[CLAUDE]], then [[PlantNeeds-SRD]], [[plan]], and [[specification]].

## Operating Principles for Agents

1. **Docs before code.** Every feature is specified in `docs/`. Implement to spec; if spec and code disagree, flag it to the human — don't silently improvise.
2. **Respect the 8 constraints in [[CLAUDE#⛔ Non-Negotiable Constraints (Read Before Writing Code)|CLAUDE.md]]** — especially: no backend, no accounts, no API keys, shared logic between UI and WebMCP tools.
3. **Shared-logic rule:** `src/logic/*` functions are called by BOTH UI event handlers and WebMCP tool `execute()` wrappers in `src/tools/register-tools.js`. Never duplicate business logic.
4. **Small, reviewable commits.** One feature or fix per commit. Reference task IDs (e.g., `T-03`, see [[tasks/kanban]]) in commit messages.
5. **Update the vault as you work:** check off tasks in the day notes, log significant decisions in [[docs/decisions]], and re-run `python scripts/sync-graphify.py` if you add/rename docs.
6. **UI design is undecided.** Build functional, accessible, component-based UI with sensible minimal styling; avoid committing to a specific visual theme until the human finalizes design ([[docs/ui-ux-overview]]).
7. **Verification matters.** Before claiming a tool works, test it per [[docs/testing-strategy]] (Chrome WebMCP flag + logic-level tests).

## Key Paths

| What | Where |
|---|---|
| Entry docs | `CLAUDE.md`, this file |
| Requirements | `PlantNeeds-SRD.md` |
| Roadmap | `plan.md` |
| Tech spec | `specification.md` |
| Deep dives | `docs/*.md` |
| Task tracking | `tasks/kanban.md`, `tasks/day-*.md` |
| Visual maps | `canvas/*.canvas` (open in Obsidian) |
| Doc knowledge graph | `.graphify/graph.json` (regenerate via `scripts/sync-graphify.py`) |

## Definition of "Done" for the Whole Project

- Live URL working in ChatGPT's in-app browser + Chrome (WebMCP flag)
- All 7 tools callable, non-trivial, and UI-synced
- Public repo with visible open-source license
- <3 min demo video + submission text (see [[PlantNeeds-SRD#16. Hackathon Submission Checklist|SRD §16]])
