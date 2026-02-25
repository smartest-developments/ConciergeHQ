# PROGRESS_LOG

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
