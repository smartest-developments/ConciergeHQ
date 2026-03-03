# PROGRESS_LOG

## 2026-03-04
- 2026-03-04T00:02:51+0100 — ACQ-AUTO-016 Request listing pagination controls — Result: Added `page`/`pageSize` query support (default `1`/`20`, max `100`) with total-count metadata on `GET /api/requests`, added pagination integration tests, and updated API spec docs for new query/response contract. — Next: ACQ-AUTH-001 secure session authentication foundation with role-based route protection.

## 2026-03-03
- 2026-03-03T19:02:14+0100 — ACQ-AUTO-013 Race-safe proposal expiry job — Result: Reworked expiry processing to evaluate only the latest active proposal, added compare-and-set transition (`updateMany` on `PROPOSAL_PUBLISHED`) to prevent duplicate `PROPOSAL_EXPIRED` events across workers, and added dedicated expiry-job tests for idempotency and window checks. — Next: ACQ-AUTH-001 secure session authentication foundation with role-based route protection.
- 2026-03-03T18:18:42+0100 — ACQ-AUTO-012 Explicit state transition APIs — Result: Added `start-sourcing`, `complete`, and `cancel` endpoints with operator auth where required, conflict guards, request status event logging, API/state-machine docs updates, and new route tests for transition happy/unhappy paths. — Next: ACQ-AUTO-013 race-safe proposal expiry to avoid duplicate `PROPOSAL_EXPIRED` events across instances.
- 2026-03-03T16:02:16+0100 — ACQ-AUTO-006 Operator auth guard for proposal publishing — Result: Added `Authorization: Bearer` gate backed by `OPERATOR_API_KEY`, fail-closed misconfiguration handling (`503`), and route tests for unauthorized/authorized cases. — Next: ACQ-AUTO-012 missing explicit state transition APIs with event logging.
- 2026-03-03T11:02:54+0100 — ACQ-AUTO-015 Startup env validation hardening — Result: Added fail-fast startup validation for required env vars and typed values (`PORT`, `NODE_ENV`, `RATE_LIMIT_*`, `CORS_ALLOWED_ORIGINS`), normalized `WEB_BASE_URL` validation, and added runtime config tests. — Next: ACQ-AUTO-016 pagination controls for `GET /api/requests`.
- 2026-03-03T10:01:50+0100 — ACQ-AUTO-014 Env-driven CORS allow-list hardening — Result: Added `CORS_ALLOWED_ORIGINS` + `WEB_BASE_URL` driven CORS policy, disabled production wildcard fallback, added CORS tests, and updated security docs. — Next: ACQ-AUTO-015 startup env validation with fail-fast typed checks.

## 2026-02-25
- Repository planning/doc hygiene refresh completed to realign project metadata with current date.
- Added env-configurable rate-limit thresholds (`RATE_LIMIT_*`) for production tuning.
- Added rate-limit response headers (`X-RateLimit-*`) across throttled endpoints.
- Updated `GET /api/requests` to include latest proposal details.
- Updated dashboard to render proposal merchant/link/expiry and to honor `?email=` query on entry.
- Updated API, security, and PRD docs to reflect current behavior (no mock payment path).
- 2026-02-25T19:02:37+0100 — PLAN-REFRESH-001 Deep cleanup (backlog + docs + consistency) — Result: task board and health score synchronized to 2026-02-25. — Next: ACQ-AUTO-006 operator-only auth guard for proposal publishing.
- 2026-02-25T19:07:10+0100 — PLAN-REFRESH-002 Deep gap analysis of delivered vs missing capabilities — Result: Added new P0/P1 tasks for missing state transitions, expiry job idempotency, CORS/env hardening, pagination, and integration tests.
- 2026-02-25T19:14:35+0100 — PLAN-REFRESH-003 Release readiness backlog expansion — Result: Added ACQ-REL-001..012 with priority and measurable DoD for deployment, observability, security, compliance, QA, and go-live governance.
- 2026-02-25T19:29:50+0100 — PLAN-REFRESH-004 Backlog hardening for indispensable scope — Result: Added explicit indispensable to-do waves and detailed AUTH/USER/ADMIN task set (`ACQ-AUTH-*`, `ACQ-ADMIN-*`) with priority + DoD.

## 2026-02-22
- 2026-02-22T00:03:24+0100 — ACQ-RISK-002 Abuse prevention with rate limiting — Result: per-IP limits added to request creation, checkout, payment confirmation, and proposal publishing.

## 2026-02-21
- Bootstrapped Node + TypeScript monorepo with npm workspaces (`apps/api`, `apps/web`).
- Added PostgreSQL docker-compose, Prisma schema/migration, and seed data.
- Implemented Fastify API routes:
  - `GET /api/health`
  - `GET /api/categories`
  - `POST /api/requests`
  - `GET /api/requests`
  - `POST /api/requests/:id/checkout`
  - `POST /api/requests/:id/confirm-payment`
- Implemented web flow:
  - Request form
  - Stripe checkout redirect
  - Dashboard request list/status
- Authored documentation set for PRD/legal/state/API/security.
- Added CI workflow running lint/typecheck/test/build.
- 2026-02-21T21:06:24+0100 — ACQ-005 Replace mock payment with PSP integration — Result: Stripe Checkout session + confirmation flow wired, mock payment removed.
- 2026-02-21T22:03:07+0100 — ACQ-006 Add operator proposal publishing with expiry job — Result: proposal publish endpoint + expiry job added.
- 2026-02-21T23:02:20+0100 — ACQ-RISK-001 Legal copy across fee/proposal touchpoints — Result: legal notices added to payment confirmation + proposal dashboard states.
