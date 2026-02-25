# TASK_BACKLOG

Last reviewed: **2026-02-25**

Backlog policy: keep `ACTIVE_TASKS` self-maintaining with automated gap discovery and enforce `P0 <= 7` items.

## STRATEGIC_EPICS
- id: EPIC-1
  priority: P0
  status: DONE
  DoD: End-to-end request -> fee -> proposal state flow implemented with legal boundaries enforced.
  Evidence: `docs/PRD.md`, `docs/STATE_MACHINE.md`, `apps/api/src/routes/requests.ts`, `apps/web/src/pages/DashboardPage.tsx`
- id: EPIC-2
  priority: P1
  status: TODO
  DoD: Authenticated customer accounts and role-based operator console.
  Evidence: `docs/SECURITY.md`
- id: EPIC-3
  priority: P1
  status: IN_PROGRESS
  DoD: Proposal publishing + expiry automation with notifications.
  Evidence: `apps/api/src/jobs/proposalExpiry.ts`, `docs/STATE_MACHINE.md`

## INDISPENSABLE_TODO
- item: MUST-01
  priority: P0
  status: TODO
  Scope: `ACQ-AUTH-001`, `ACQ-AUTO-006`, `ACQ-AUTO-012`, `ACQ-AUTO-013`
  Exit: Auth + RBAC enforcement and complete/race-safe status transitions validated in staging.
- item: MUST-02
  priority: P0
  status: TODO
  Scope: `ACQ-REL-001`, `ACQ-REL-002`, `ACQ-REL-003`
  Exit: Release governance, deployment gates, and rollback procedure are documented and dry-run tested.
- item: MUST-03
  priority: P1
  status: TODO
  Scope: `ACQ-AUTH-002`, `ACQ-AUTH-003`, `ACQ-AUTH-004`, `ACQ-AUTH-005`
  Exit: Customer login lifecycle is complete end-to-end (UI + API + secure sessions).
- item: MUST-04
  priority: P1
  status: TODO
  Scope: `ACQ-ADMIN-001`, `ACQ-ADMIN-002`, `ACQ-ADMIN-003`, `ACQ-ADMIN-005`
  Exit: Operator/admin can triage requests, publish proposals, and audit actions without direct DB access.
- item: MUST-05
  priority: P1
  status: TODO
  Scope: `ACQ-AUTO-004`, `ACQ-AUTO-014`, `ACQ-AUTO-015`, `ACQ-AUTO-016`, `ACQ-AUTO-017`, `ACQ-REL-004`, `ACQ-REL-006`, `ACQ-REL-011`
  Exit: Payment reconciliation, platform hardening, and release quality gates are automated and measurable.

## ACTIVE_TASKS
- id: ACQ-001
  priority: P0
  status: DONE
  DoD: Monorepo scaffold with web/api workspaces and shared scripts.
  Evidence: `package.json`, `apps/web/package.json`, `apps/api/package.json`
- id: ACQ-002
  priority: P0
  status: DONE
  DoD: API endpoints for health, categories, request creation with validation and persistence.
  Evidence: `apps/api/src/routes/health.ts`, `apps/api/src/routes/categories.ts`, `apps/api/src/routes/requests.ts`
- id: ACQ-003
  priority: P0
  status: DONE
  DoD: Web UI with request creation, fee payment flow, and dashboard status view.
  Evidence: `apps/web/src/pages/CreateRequestPage.tsx`, `apps/web/src/pages/PaymentPage.tsx`, `apps/web/src/pages/DashboardPage.tsx`
- id: ACQ-004
  priority: P0
  status: DONE
  DoD: Data model + migration + seed with sample user/request.
  Evidence: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260221204500_init/migration.sql`, `apps/api/prisma/seed.ts`
- id: ACQ-005
  priority: P0
  status: DONE
  DoD: Replace mock payment with PSP integration while preserving non-merchant role boundaries.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/web/src/pages/PaymentPage.tsx`, `docs/API_SPEC.md`
- id: ACQ-006
  priority: P1
  status: DONE
  DoD: Add operator-side proposal publishing endpoint with 2-hour expiry job.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/src/jobs/proposalExpiry.ts`
- id: ACQ-RISK-001
  priority: P0
  status: DONE
  DoD: Legal copy appears in all user-facing fee/proposal touchpoints.
  Evidence: `docs/LEGAL_BOUNDARIES.md`, `apps/web/src/pages/PaymentPage.tsx`, `apps/web/src/pages/PaymentSuccessPage.tsx`, `apps/web/src/pages/DashboardPage.tsx`
- id: ACQ-RISK-002
  priority: P0
  status: DONE
  DoD: Abuse prevention implemented with concrete rate limiting.
  Evidence: `apps/api/src/lib/rateLimit.ts`, `apps/api/src/routes/requests.ts`, `docs/SECURITY.md`

## AUTO_DISCOVERED
- id: ACQ-AUTO-001
  priority: P1
  status: TODO
  DoD: Add linting beyond TypeScript checks (ESLint or Biome ruleset).
  Evidence: `package.json`
- id: ACQ-AUTO-002
  priority: P1
  status: TODO
  DoD: Add contract tests covering validation failures for request creation.
  Evidence: `apps/api/tests`
- id: ACQ-AUTO-003
  priority: P2
  status: TODO
  DoD: Add Playwright smoke for create-request to dashboard flow.
  Evidence: `e2e/README.md`
- id: ACQ-AUTO-004
  priority: P1
  status: TODO
  DoD: Add webhook listener to reconcile PSP payments asynchronously.
  Evidence: `apps/api/src/routes/requests.ts`
- id: ACQ-AUTO-005
  priority: P1
  status: TODO
  DoD: Add dashboard messaging for failed or abandoned payment sessions.
  Evidence: `apps/web/src/pages/PaymentPage.tsx`
- id: ACQ-AUTO-006
  priority: P0
  status: TODO
  DoD: Add operator-only auth guard for proposal publishing endpoint.
  Evidence: `apps/api/src/routes/requests.ts`
- id: ACQ-AUTO-007
  priority: P1
  status: TODO
  DoD: Add tests covering proposal publish and expiry transitions.
  Evidence: `apps/api/tests`
- id: ACQ-AUTO-008
  priority: P2
  status: DONE
  DoD: Surface proposal details (merchant + external URL) on the dashboard when status is PROPOSAL_PUBLISHED.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/api.ts`
- id: ACQ-AUTO-009
  priority: P2
  status: DONE
  DoD: Make rate limit thresholds configurable via env for production tuning.
  Evidence: `.env.example`, `apps/api/src/lib/runtimeConfig.ts`, `apps/api/src/routes/requests.ts`
- id: ACQ-AUTO-010
  priority: P2
  status: DONE
  DoD: Document 429 response shapes and retry headers in API spec.
  Evidence: `docs/API_SPEC.md`
- id: ACQ-AUTO-011
  priority: P1
  status: TODO
  DoD: Replace in-memory rate limiter store with shared backend (Redis or equivalent) for multi-instance deployments.
  Evidence: `apps/api/src/lib/rateLimit.ts`
- id: ACQ-AUTO-012
  priority: P0
  status: TODO
  DoD: Implement missing state-machine transitions (`FEE_PAID -> SOURCING`, `PROPOSAL_PUBLISHED -> COMPLETED`, `* -> CANCELED`) with explicit APIs and event logging.
  Evidence: `docs/STATE_MACHINE.md`, `apps/api/src/routes/requests.ts`
- id: ACQ-AUTO-013
  priority: P0
  status: TODO
  DoD: Make proposal expiry processing race-safe across multiple API instances and prevent duplicate `PROPOSAL_EXPIRED` events.
  Evidence: `apps/api/src/jobs/proposalExpiry.ts`
- id: ACQ-AUTO-014
  priority: P1
  status: TODO
  DoD: Add env-driven CORS allow-list and disable permissive wildcard behavior for production deployments.
  Evidence: `apps/api/src/server.ts`, `docs/SECURITY.md`
- id: ACQ-AUTO-015
  priority: P1
  status: TODO
  DoD: Add startup env validation with fail-fast errors for required and typed configuration values.
  Evidence: `apps/api/src/index.ts`, `apps/api/src/lib/runtimeConfig.ts`, `apps/api/src/lib/stripe.ts`
- id: ACQ-AUTO-016
  priority: P1
  status: TODO
  DoD: Add pagination controls to `GET /api/requests` and document limits in API spec.
  Evidence: `apps/api/src/routes/requests.ts`, `docs/API_SPEC.md`
- id: ACQ-AUTO-017
  priority: P1
  status: TODO
  DoD: Add API integration tests for checkout/payment/proposal routes, including 429 headers and unhappy-path validations.
  Evidence: `apps/api/tests`

## AUTH_ADMIN_ESSENTIALS
- id: ACQ-AUTH-001
  priority: P0
  status: TODO
  DoD: Add secure session authentication foundation (HTTP-only cookie sessions, user roles `CUSTOMER|OPERATOR|ADMIN`, protected route middleware).
  Evidence: `apps/api/prisma/schema.prisma`, `apps/api/src/server.ts`, `docs/SECURITY.md`
- id: ACQ-AUTH-002
  priority: P1
  status: TODO
  DoD: Implement customer auth API (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) with password hashing and brute-force protection.
  Evidence: `apps/api/src/routes`, `docs/API_SPEC.md`
- id: ACQ-AUTH-003
  priority: P1
  status: TODO
  DoD: Implement password recovery flow (request reset token + reset password endpoint) with expiring single-use tokens.
  Evidence: `apps/api/src/routes`, `docs/API_SPEC.md`
- id: ACQ-AUTH-004
  priority: P1
  status: TODO
  DoD: Add web auth UX (login/register/forgot/reset pages) and route guards for authenticated-only views.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages`
- id: ACQ-AUTH-005
  priority: P1
  status: TODO
  DoD: Bind dashboard/request access to authenticated session identity and remove public email-based data filtering.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/web/src/pages/DashboardPage.tsx`
- id: ACQ-ADMIN-001
  priority: P1
  status: TODO
  DoD: Build operator queue UI with filters (status/date/country/category) and pagination for request triage.
  Evidence: `apps/web/src/pages`, `apps/api/src/routes/requests.ts`
- id: ACQ-ADMIN-002
  priority: P1
  status: TODO
  DoD: Build admin request detail workspace showing timeline, fee/payment state, and proposal history with allowed transitions.
  Evidence: `apps/web/src/pages`, `apps/api/src/routes/requests.ts`, `docs/STATE_MACHINE.md`
- id: ACQ-ADMIN-003
  priority: P1
  status: TODO
  DoD: Add admin-side proposal composer/publisher flow with role guard, preview, and expiry visibility.
  Evidence: `apps/web/src/pages`, `apps/api/src/routes/requests.ts`
- id: ACQ-ADMIN-004
  priority: P2
  status: TODO
  DoD: Add admin user-management capabilities (role assignment + account disable/enable) with safety checks.
  Evidence: `apps/api/src/routes`, `apps/web/src/pages`, `docs/SECURITY.md`
- id: ACQ-ADMIN-005
  priority: P1
  status: TODO
  DoD: Expose and render admin audit trail for sensitive actions (proposal publish, role changes, status overrides).
  Evidence: `apps/api/src/routes`, `apps/web/src/pages`, `apps/api/prisma/schema.prisma`

## RELEASE_READINESS
- id: ACQ-REL-001
  priority: P0
  status: TODO
  DoD: Publish release checklist with explicit go/no-go criteria (functional, security, legal, ops) and sign-off owners.
  Evidence: `docs/RELEASE_CHECKLIST.md`
- id: ACQ-REL-002
  priority: P0
  status: TODO
  DoD: Introduce staging/prod deployment workflow with protected production approval gate and tagged releases.
  Evidence: `.github/workflows`, `docs/RELEASE_RUNBOOK.md`
- id: ACQ-REL-003
  priority: P0
  status: TODO
  DoD: Add tested DB backup/restore + migration rollback runbook with one successful dry-run in staging.
  Evidence: `docs/RELEASE_RUNBOOK.md`, `apps/api/prisma/migrations`
- id: ACQ-REL-004
  priority: P1
  status: TODO
  DoD: Baseline observability in production (structured logs retention, API error-rate/latency alerts, payment failure alerting).
  Evidence: `docs/OPERATIONS.md`
- id: ACQ-REL-005
  priority: P1
  status: TODO
  DoD: Define incident response runbook (severity matrix, escalation path, response SLAs, postmortem template).
  Evidence: `docs/OPERATIONS.md`
- id: ACQ-REL-006
  priority: P1
  status: TODO
  DoD: Add dependency vulnerability scanning + secret scanning in CI with failing thresholds.
  Evidence: `.github/workflows`, `docs/SECURITY.md`
- id: ACQ-REL-007
  priority: P1
  status: TODO
  DoD: Add production-ready legal/privacy docs (Privacy Policy, Terms, refund/legal boundary consistency) linked from UI.
  Evidence: `docs/LEGAL_BOUNDARIES.md`, `apps/web/src/components/AppShell.tsx`
- id: ACQ-REL-008
  priority: P1
  status: TODO
  DoD: Complete UI accessibility pass (WCAG 2.1 AA basics: keyboard nav, labels, focus states, contrast) with findings resolved.
  Evidence: `apps/web/src`, `e2e`
- id: ACQ-REL-009
  priority: P1
  status: TODO
  DoD: Define and validate performance SLOs (API p95 latency and web Core Web Vitals targets) under realistic load.
  Evidence: `docs/OPERATIONS.md`
- id: ACQ-REL-010
  priority: P1
  status: TODO
  DoD: Add product analytics/funnel instrumentation for request creation, checkout start/success/failure, proposal open.
  Evidence: `apps/web/src`, `docs/PRD.md`
- id: ACQ-REL-011
  priority: P1
  status: TODO
  DoD: Execute end-to-end UAT script in staging and capture release sign-off report with known limitations.
  Evidence: `docs/UAT_REPORT.md`
- id: ACQ-REL-012
  priority: P2
  status: TODO
  DoD: Add customer support/admin operational baseline (contact path, SLA targets, dispute/escalation handling playbook).
  Evidence: `docs/OPERATIONS.md`

## TECH_DEBT
- id: ACQ-DEBT-001
  priority: P1
  status: TODO
  DoD: Remove direct email filter query from dashboard API once auth is added.
  Evidence: `apps/api/src/routes/requests.ts`
- id: ACQ-DEBT-002
  priority: P2
  status: TODO
  DoD: Add centralized error handler with typed domain errors.
  Evidence: `apps/api/src/server.ts`

## RISK_ITEMS
- id: ACQ-RISK-003
  priority: P1
  status: OPEN
  DoD: Stripe synchronous confirmation path may miss delayed settlement edge cases without webhook reconciliation.
  Evidence: `apps/api/src/routes/requests.ts`
- id: ACQ-RISK-004
  priority: P1
  status: OPEN
  DoD: Proposal expiry job can emit duplicate status events under horizontal scaling without shared locking/guarded updates.
  Evidence: `apps/api/src/jobs/proposalExpiry.ts`
- id: ACQ-RISK-005
  priority: P1
  status: OPEN
  DoD: `origin: true` CORS policy can expose unauthenticated endpoints to unintended browser origins in production.
  Evidence: `apps/api/src/server.ts`

## PARKED
- id: ACQ-PARK-001
  priority: P3
  status: BLOCKED
  DoD: Multi-language localization for EU markets.
  Evidence: Requires finalized brand/legal terminology.
- id: ACQ-PARK-002
  priority: P3
  status: BLOCKED
  DoD: Mobile native app parity.
  Evidence: Parked until web product-market fit and funnel metrics stabilize.
