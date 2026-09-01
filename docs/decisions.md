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
**Date:** 2026-08-28 · **Status:** ❌ SUPERSEDED by ADR-009 (2026-08-28)
**Context:** 10-day hackathon; judges need a live URL that can't go down; zero budget.
**Decision (original):** Static SPA, all data in IndexedDB, free static host.
**Outcome:** Owner later required user accounts + server-side persistence → replaced by the client+server architecture in ADR-009.

## ADR-002: Shared logic layer for UI and WebMCP tools
**Date:** 2026-08-28 · **Status:** accepted (⚠️ amended by ADR-011 — the shared layer moved server-side)
**Context:** Two "users" (human, agent) must never behave differently or drift.
**Decision:** There is exactly ONE business-logic implementation; UI handlers and tool `execute()` wrappers both route through it (constraint C4). Tools contain zero logic.
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
**Date:** 2026-08-28 · **Status:** accepted (⚠️ scope amended by ADR-009 — applies to the **frontend** only; backend stack is ADR-009)
**Context:** Solo 10-day build; small UI surface; pub/sub already handles reactivity.
**Decision:** Vanilla ES modules by default; React permitted only if builder prefers, behind the same store contract.
**Consequences:** (+) Tiny bundle, fast load (NFR-1), fewer deps. (−) More manual DOM work.

## ADR-007: UI visual design deferred
**Date:** 2026-08-28 · **Status:** proposed (awaiting human)
**Context:** Owner stated visual design is still in discussion.
**Decision:** Build functional components with neutral styling and CSS custom properties; theme decision lands later as a one-file swap ([[docs/ui-ux-overview]]).
**Consequences:** (+) No rework. (−) Demo-day visuals need a dedicated polish pass (Day 8).

## ADR-008: Deploy to Render (not Vercel/Netlify)
**Date:** 2026-08-28 · **Status:** accepted (⚠️ extended by ADR-009 — now also hosts the Web Service + Postgres)
**Context:** Owner directed deployment on Render (https://render.com). Render is also a WebMCP Challenge sponsor ($300 credits per winner).
**Decision:** Deploy as a **Render Static Site** (free tier) with `render.yaml` IaC, auto-deploy from `main`, SPA rewrite rule. Explicitly NOT Render Workflows (background-task containers). Details: [[docs/deployment]].
**Consequences:** (+) Free CDN hosting, automatic HTTPS, deploy history/rollback, sponsor alignment. (−) One platform-specific config file to maintain.

## ADR-009: Add a backend — Node/Express + PostgreSQL on Render
**Date:** 2026-08-28 · **Status:** ✅ accepted (supersedes ADR-001)
**Context:** Owner requires user accounts (username/password), per-user plant collections, a plant tracker, and server-side persistence — impossible with the local-first model (ADR-001).
**Decision:** Add a backend: **Node.js + Express** REST API, **PostgreSQL** (Render managed), deployed as a **Render Web Service** alongside the existing Static frontend. Business logic moves to `server/logic/`. Schema: [[docs/database-schema]]. API: [[docs/backend-api]].
**Consequences:** (+) Real accounts, cross-device sync, server-side reasoning, multi-user. (+) Keeps everything on Render. (−) More moving parts: DB migrations, auth, secrets, two deployables. (−) Free Postgres expires after 30 days → acceptable for hackathon demo; upgrade if needed.

## ADR-010: Authentication — username/password + JWT (bcrypt hash)
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Need simple, hackathon-appropriate auth for a REST API consumed by a browser SPA + agent tools.
**Decision:** Username + password registration/login. Passwords hashed with **bcrypt** (cost ≥ 10). Server issues a **JWT** (signed with `JWT_SECRET`, short-lived ~1h + refresh token); client stores it in memory and sends `Authorization: Bearer <jwt>`. Auth middleware resolves `req.userId`; all queries scope by `user_id`.
**Consequences:** (+) Stateless, standard, easy to test. (−) JWT in browser storage needs XSS care; mitigated by httpOnly refresh cookie option + short expiry. Details: [[docs/backend-api#Authentication|backend-api]].

## ADR-011: Server is the state authority (client is a reactive view)
**Date:** 2026-08-28 · **Status:** accepted (amends ADR-002/ADR-003)
**Context:** With a backend, two copies of state (client + server) could drift. UI and agent tools must act on one truth.
**Decision:** **PostgreSQL is the single source of truth.** Both the human UI and WebMCP tools call the same REST endpoints (C4). After any mutation, the client refreshes affected state via its pub/sub store (re-render). The client may cache reads for speed/offline display, but all writes go through the server.
**Consequences:** (+) No client/server drift; agent and human always agree. (−) Requires the client store to refetch after mutations (already the live-sync pattern, C5).

---

**Pending decisions:** UI theme (ADR-012, owner) · plant illustration style (ADR-013, owner)

**Related:** [[docs/architecture]] · [[specification]] · [[plan]]
