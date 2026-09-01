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

## ADR-012: Visual identity — Botanical Ether Glassmorphism (Google Stitch Reference)
**Date:** 2026-09-01 · **Status:** ✅ accepted (closes ADR-007)
**Context:** Visual design alignment using Google Stitch Project `15738293537970565966` ("PlantNeeds Botanical Login").
**Decision:** Adopt **Botanical Ether Glassmorphism** as specified in `DESIGN.md`:
- Semi-transparent frosted glass panels (`rgba(255, 255, 255, 0.22)`, blur 20px) layered over a crisp, high-resolution greenhouse tropical canopy photograph with a dark overlay wash.
- Color Palette: Forest Deep (`#1B3022`), Primary Container (`#2D5A27`), Surface (`#F9FAF2`), Sage Soft (`#E1E8E0`).
- Typography: Plus Jakarta Sans (Brand/Headings) + Inter (Body/Inputs) + JetBrains Mono (Data/Metrics).
- Zero AI Slop Compliance: No random emoji decorations on buttons/headers, no artificial neon glows, no em-dashes in copy.
**Consequences:** (+) Clean, production-grade visual design directly verified in Stitch. (+) All tokens centralized in `client/src/style.css`.

## ADR-011: Server is the state authority (client is a reactive view)
**Date:** 2026-08-28 · **Status:** accepted (amends ADR-002/ADR-003)
**Context:** With a backend, two copies of state (client + server) could drift. UI and agent tools must act on one truth.
**Decision:** **PostgreSQL is the single source of truth.** Both the human UI and WebMCP tools call the same REST endpoints (C4). After any mutation, the client refreshes affected state via its pub/sub store (re-render). The client may cache reads for speed/offline display, but all writes go through the server.
**Consequences:** (+) No client/server drift; agent and human always agree. (−) Requires the client store to refetch after mutations (already the live-sync pattern, C5).

## ADR-010: Authentication — username/password + JWT (bcryptjs hash)
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Need simple, hackathon-appropriate auth for a REST API consumed by a browser SPA + agent tools.
**Decision:** Username + password registration/login. Passwords hashed with **bcryptjs** (cost ≥ 10, pure JS). Server issues a **JWT** (signed with `JWT_SECRET`, short-lived ~1h + refresh token); client stores it in memory and sends `Authorization: Bearer <jwt>`. Auth middleware resolves `req.userId`; all queries scope by `user_id`.
**Consequences:** (+) Stateless, standard, easy to test. (−) JWT in browser storage needs XSS care; mitigated by in-memory token storage. Details: [[docs/backend-api#Authentication|backend-api]].

## ADR-009: Add a backend — Node/Express + PostgreSQL on Render
**Date:** 2026-08-28 · **Status:** ✅ accepted (supersedes ADR-001)
**Context:** Owner requires user accounts (username/password), per-user plant collections, a plant tracker, and server-side persistence — impossible with the local-first model (ADR-001).
**Decision:** Add a backend: **Node.js + Express** REST API, **PostgreSQL** (Render managed), deployed as a **Render Web Service** alongside the existing Static frontend. Business logic moves to `server/logic/`. Schema: [[docs/database-schema]]. API: [[docs/backend-api]].
**Consequences:** (+) Real accounts, cross-device sync, server-side reasoning, multi-user. (+) Keeps everything on Render. (−) More moving parts: DB migrations, auth, secrets, two deployables. (−) Free Postgres expires after 30 days → acceptable for hackathon demo; upgrade if needed.

## ADR-008: Deploy to Render (not Vercel/Netlify)
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Owner directed deployment on Render. Render is also a WebMCP Challenge sponsor ($300 credits per winner).
**Decision:** Deploy as a **Render Static Site** (free tier) with `render.yaml` IaC, auto-deploy from `main`, SPA rewrite rule.
**Consequences:** (+) Free CDN hosting, automatic HTTPS, deploy history/rollback, sponsor alignment.

## ADR-007: UI visual design deferred
**Date:** 2026-08-28 · **Status:** ❌ SUPERSEDED by ADR-012 (2026-09-01)

## ADR-006: Vanilla JS + Vite (React optional)
**Date:** 2026-08-28 · **Status:** accepted
**Context:** 10-day build; small UI surface; pub/sub already handles reactivity.
**Decision:** Vanilla ES modules by default; React permitted only if builder prefers, behind the same store contract.
**Consequences:** (+) Tiny bundle, fast load (NFR-1), fewer deps.

## ADR-005: History-aware diagnosis over static lookup
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Static symptom→cause tables are the status quo and often wrong; "reasoning app" is our pitch.
**Decision:** Score candidate causes against actual care history via a whitelisted rule evaluator; return ranked causes + evidence strings ([[docs/diagnosis-engine]]).
**Consequences:** (+) Genuine differentiator on "WebMCP Leverage" + "Creativity".

## ADR-004: Open-Meteo as the only external API
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Need real weather for the flagship feature; constraint C3 forbids API keys.
**Decision:** Open-Meteo forecast endpoint (keyless, CORS-friendly) with 30-min cache and graceful `unavailable` fallback.
**Consequences:** (+) Zero-config for judges, real data in demos.

## ADR-003: Event-driven UI re-render (not framework state)
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Agent tool calls happen OUTSIDE any UI event flow; the screen must still update (C5).
**Decision:** Tiny pub/sub store (`state/store.js`); logic emits `plants-changed`/`care-logged`/etc.; UI subscribes.
**Consequences:** (+) Framework-agnostic, testable.

## ADR-002: Shared logic layer for UI and WebMCP tools
**Date:** 2026-08-28 · **Status:** accepted
**Context:** Two "users" (human, agent) must never behave differently or drift.
**Decision:** Exactly ONE business-logic implementation; UI handlers and tool `execute()` wrappers both route through it (constraint C4). Tools contain zero logic.

## ADR-001: Local-first, zero backend
**Date:** 2026-08-28 · **Status:** ❌ SUPERSEDED by ADR-009 (2026-08-28)

---

**Pending decisions:** _(none — ADR-012 closed the UI theme question)_

**Related:** [[docs/architecture]] · [[specification]] · [[plan]] · `DESIGN.md`
