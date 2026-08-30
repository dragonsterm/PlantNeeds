---
tags: [decisions, adr, docs]
type: doc
---
# 🧭 Architecture Decision Records (ADRs)

> **WHY** choices were made — so future contributors (human or AI) don't relitigate settled decisions or accidentally violate their intent. Newest at top. Append; never edit history.

## ADR Format
```
## ADR-NNN: Title
**Date:** YYYY-MM-DD · **Status:** accepted | superseded | proposed
**Context:** what forced the decision
**Decision:** what we chose
**Consequences:** what follows (good + bad)
```

---

## ADR-001: Local-first, zero backend
**Date:** 2026-08-28 · **Status:** accepted
**Context:** 10-day hackathon; judges need a live URL that can't go down; zero budget.
**Decision:** Static SPA, all data in IndexedDB, deploy to a free static host (Render chosen in ADR-008).
**Consequences:** (+) $0 forever, offline-capable, privacy by default, no server to crash mid-judging. (−) No cross-device sync (accepted as out of scope, N1/N2).

## ADR-002: Shared logic layer for UI and WebMCP tools
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Two "users" (human, agent) must never behave differently or drift.
**Decision:** `src/logic/*` is the ONLY business-logic location; UI handlers and tool `execute()` wrappers both call it (constraint C4). Tools contain zero logic.
**Consequences:** (+) One test surface; agent/human parity guaranteed. (−) Requires discipline — code review must reject logic in UI/tool files.

## ADR-003: Event-driven UI re-render (not framework state)
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Agent tool calls happen OUTSIDE any UI event flow; the screen must still update (C5).
**Decision:** Tiny pub/sub store (`state/store.js`); logic emits `plants-changed`/`care-logged`/etc.; UI subscribes.
**Consequences:** (+) Framework-agnostic, ~30 lines, testable. (−) Manual subscription management (acceptable at this scale).

## ADR-004: Open-Meteo as the only external API
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Need real weather for the flagship feature; constraint C3 forbids API keys.
**Decision:** Open-Meteo forecast endpoint (keyless, CORS-friendly) with 30-min localStorage cache and graceful `unavailable` fallback.
**Consequences:** (+) Zero-config for judges, real data in demos. (−) Single point of failure → mitigated by cache + fallback ([[docs/api-integrations]]).

## ADR-005: History-aware diagnosis over static lookup
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Static symptom→cause tables are the status quo and often wrong; "reasoning app" is our pitch.
**Decision:** Score candidate causes against actual care history via a whitelisted rule evaluator (never `eval()`); return ranked causes + evidence strings ([[docs/diagnosis-engine]]).
**Consequences:** (+) Genuine differentiator on "WebMCP Leverage" + "Creativity". (−) Day 6 is fully consumed building ~20 matrix entries.

## ADR-006: Vanilla JS + Vite (React optional)
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Solo 10-day build; small UI surface; pub/sub already handles reactivity.
**Decision:** Vanilla ES modules by default; React permitted only if builder prefers, behind the same store contract.
**Consequences:** (+) Tiny bundle, fast load (NFR-1), fewer deps. (−) More manual DOM work.

## ADR-007: UI visual design deferred
**Date:** 2026-08-28 · **Status:** proposed (awaiting human)
**Context:** Owner stated visual design is still in discussion.
**Decision:** Build functional components with neutral styling and CSS custom properties; theme decision lands later as a one-file swap ([[docs/ui-ux-overview]]).
**Consequences:** (+) No rework. (−) Demo-day visuals need a dedicated polish pass (Day 8).

## ADR-008: Deploy to Render (not Vercel/Netlify)
**Date:** 2026-08-28 · **Status:** accepted (supersedes the host named in ADR-001)
**Context:** Owner directed deployment on Render (https://render.com). Render is also a WebMCP Challenge sponsor ($300 credits per winner).
**Decision:** Deploy as a **Render Static Site** (free tier) with `render.yaml` IaC, auto-deploy from `main`, SPA rewrite rule. Explicitly NOT Render Workflows (background-task containers — we have no backend jobs). Details: [[docs/deployment]].
**Consequences:** (+) Free CDN hosting, automatic HTTPS, deploy history/rollback, sponsor alignment. (−) One platform-specific config file to maintain.

---

**Pending decisions:** UI theme (ADR-009, owner) · plant illustration style (ADR-010, owner)

**Related:** [[docs/architecture]] · [[specification]] · [[plan]]
