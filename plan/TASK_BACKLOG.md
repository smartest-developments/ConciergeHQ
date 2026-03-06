# TASK_BACKLOG

Last reviewed: **2026-03-06**

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
  status: IN_PROGRESS
  Scope: `ACQ-AUTH-001`
  Exit: Auth + RBAC enforcement and complete/race-safe status transitions validated in staging.
- item: MUST-02
  priority: P0
  status: TODO
  Scope: `ACQ-REL-001`, `ACQ-REL-002`, `ACQ-REL-003`
  Exit: Release governance, deployment gates, and rollback procedure are documented and dry-run tested.
- item: MUST-03
  priority: P1
  status: IN_PROGRESS
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
  status: DONE
  DoD: Add dashboard messaging for failed or abandoned payment sessions.
  Evidence: `apps/web/src/pages/PaymentPage.tsx`, `apps/web/src/pages/DashboardPage.tsx`, `apps/web/tests/dashboard-page.test.tsx`
- id: ACQ-AUTO-006
  priority: P0
  status: DONE
  DoD: Add operator-only auth guard for proposal publishing endpoint.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/src/lib/operatorRole.ts`, `apps/api/tests/operator-role.test.ts`, `docs/API_SPEC.md`, `docs/SECURITY.md`
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
  status: DONE
  DoD: Implement missing state-machine transitions (`FEE_PAID -> SOURCING`, `PROPOSAL_PUBLISHED -> COMPLETED`, `* -> CANCELED`) with explicit APIs and event logging.
  Evidence: `docs/STATE_MACHINE.md`, `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`
- id: ACQ-AUTO-013
  priority: P0
  status: DONE
  DoD: Make proposal expiry processing race-safe across multiple API instances and prevent duplicate `PROPOSAL_EXPIRED` events.
  Evidence: `apps/api/src/jobs/proposalExpiry.ts`, `apps/api/tests/proposal-expiry-job.test.ts`
- id: ACQ-AUTO-014
  priority: P1
  status: DONE
  DoD: Add env-driven CORS allow-list and disable permissive wildcard behavior for production deployments.
  Evidence: `apps/api/src/server.ts`, `apps/api/src/lib/runtimeConfig.ts`, `apps/api/tests/runtime-config.test.ts`, `.env.example`, `docs/SECURITY.md`
- id: ACQ-AUTO-015
  priority: P1
  status: DONE
  DoD: Add startup env validation with fail-fast errors for required and typed configuration values.
  Evidence: `apps/api/src/index.ts`, `apps/api/src/lib/runtimeConfig.ts`, `apps/api/tests/runtime-config.test.ts`
- id: ACQ-AUTO-016
  priority: P1
  status: DONE
  DoD: Add pagination controls to `GET /api/requests` and document limits in API spec.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`, `docs/API_SPEC.md`
- id: ACQ-AUTO-017
  priority: P1
  status: DONE
  DoD: Add API integration tests for checkout/payment/proposal routes, including 429 headers and unhappy-path validations.
  Evidence: `apps/api/tests/requests-list.test.ts`, `apps/api/tests/request-checkout-proposal.test.ts`, `apps/api/src/routes/requests.ts`
- id: ACQ-AUTO-018
  priority: P1
  status: DONE
  DoD: Add operator queue sort controls (`createdAt`, `budgetChf`) and persist filter state in URL query params for shareable triage links.
  Evidence: `apps/web/src/pages/OperatorQueuePage.tsx`, `apps/web/tests/operator-queue-page.test.tsx`
- id: ACQ-AUTO-019
  priority: P1
  status: DONE
  DoD: Extend `GET /api/requests` with deterministic server-side sorting (`sortBy=createdAt|budgetChf`, `sortDir=asc|desc`) so operator triage ordering is consistent across clients.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`, `apps/web/src/pages/OperatorQueuePage.tsx`, `apps/web/tests/operator-queue-page.test.tsx`, `docs/API_SPEC.md`

## AUTH_ADMIN_ESSENTIALS
- id: ACQ-AUTH-001
  priority: P0
  status: IN_PROGRESS
  DoD: Add secure session authentication foundation (HTTP-only cookie sessions, user roles `CUSTOMER|OPERATOR|ADMIN`, protected route middleware).
  Evidence: `apps/api/prisma/schema.prisma`, `apps/api/src/server.ts`, `docs/SECURITY.md`
- id: ACQ-AUTH-001A
  priority: P0
  status: IN_PROGRESS
  DoD: Add backend session primitives (session table/model, secure cookie issuance/revocation, and API middleware role extraction for `CUSTOMER|OPERATOR|ADMIN`).
  Evidence: `apps/api/prisma/schema.prisma`, `apps/api/src/routes`, `apps/api/tests`
- id: ACQ-AUTH-001B
  priority: P0
  status: DONE
  DoD: Add web route guards + auth bootstrap shell so operator/customer pages require active session before data fetch.
  Evidence: `apps/web/src/auth.tsx`, `apps/web/src/router.tsx`, `apps/web/src/pages/SessionBootstrapPage.tsx`, `apps/web/src/pages/DashboardPage.tsx`, `apps/web/tests/session-bootstrap-page.test.tsx`
- id: ACQ-AUTH-002
  priority: P1
  status: DONE
  DoD: Implement customer auth API (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) with password hashing and brute-force protection.
  Evidence: `apps/api/src/routes/auth.ts`, `apps/api/tests/auth-routes.test.ts`, `docs/API_SPEC.md`, `docs/SECURITY.md`
- id: ACQ-AUTH-003
  priority: P1
  status: DONE
  DoD: Implement password recovery flow (request reset token + reset password endpoint) with expiring single-use tokens.
  Evidence: `apps/api/src/routes/auth.ts`, `apps/api/prisma/schema.prisma`, `apps/api/tests/auth-routes.test.ts`, `apps/web/src/pages/ForgotPasswordPage.tsx`, `apps/web/src/pages/ResetPasswordPage.tsx`, `apps/web/tests/forgot-reset-page.test.tsx`, `docs/API_SPEC.md`, `docs/SECURITY.md`
- id: ACQ-AUTH-004
  priority: P1
  status: IN_PROGRESS
  DoD: Add web auth UX (login/register/forgot/reset pages) and route guards for authenticated-only views.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages`
- id: ACQ-AUTH-005
  priority: P1
  status: DONE
  DoD: Bind dashboard/request access to authenticated session identity and remove public email-based data filtering.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/web/src/pages/DashboardPage.tsx`
- id: ACQ-ADMIN-001
  priority: P1
  status: DONE
  DoD: Deliver operator queue triage capability across UI and API (`ACQ-ADMIN-001A..C`) with auth hardening tracked under `ACQ-AUTH-001`.
  Evidence: `apps/web/src/pages`, `apps/api/src/routes/requests.ts`
- id: ACQ-ADMIN-001A
  priority: P1
  status: DONE
  DoD: Add operator queue UI route with status/category/country filters and request count visibility.
  Evidence: `apps/web/src/pages/OperatorQueuePage.tsx`, `apps/web/src/router.tsx`, `apps/web/tests/operator-queue-page.test.tsx`
- id: ACQ-ADMIN-001B
  priority: P1
  status: DONE
  DoD: Add server-side operator queue filters (`status`, `category`, `country`, `dateFrom`, `dateTo`) plus pagination contract to `GET /api/requests`.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`, `docs/API_SPEC.md`
- id: ACQ-ADMIN-001C
  priority: P1
  status: DONE
  DoD: Bind operator queue UI to API-backed filtering and pagination controls (including date range) once `ACQ-ADMIN-001B` is available.
  Evidence: `apps/web/src/pages/OperatorQueuePage.tsx`, `apps/web/src/api.ts`, `apps/web/tests/operator-queue-page.test.tsx`
- id: ACQ-ADMIN-002
  priority: P1
  status: DONE
  DoD: Deliver admin request detail workspace wave (`ACQ-ADMIN-002A..C`) with timeline/payment/proposal context and guarded transition actions.
  Evidence: `apps/web/src/pages`, `apps/api/src/routes/requests.ts`, `docs/STATE_MACHINE.md`
- id: ACQ-ADMIN-002A
  priority: P1
  status: DONE
  DoD: Add request detail read model (`GET /api/requests/:id`) and operator detail page showing timeline, payment state, and proposal history.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`, `apps/web/src/pages/OperatorRequestDetailPage.tsx`, `apps/web/tests/operator-request-detail-page.test.tsx`, `apps/web/src/pages/OperatorQueuePage.tsx`
- id: ACQ-ADMIN-002B
  priority: P1
  status: DONE
  DoD: Add allowed state-transition action panel on request detail (move to `SOURCING`, `COMPLETED`, or `CANCELED`) with API contract validation.
  Evidence: `apps/web/src/pages/OperatorRequestDetailPage.tsx`, `apps/web/src/api.ts`, `apps/web/tests/operator-request-detail-page.test.tsx`, `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`, `docs/API_SPEC.md`
- id: ACQ-ADMIN-002C
  priority: P1
  status: DONE
  DoD: Add operator transition confirmation UX with reason capture and optimistic refresh of timeline/proposal sections.
  Evidence: `apps/web/src/pages/OperatorRequestDetailPage.tsx`, `apps/web/tests/operator-request-detail-page.test.tsx`
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
  status: DONE
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
  status: MITIGATED
  DoD: Proposal expiry worker enforces conditional state transition so duplicate `PROPOSAL_EXPIRED` events are not emitted under concurrent runs.
  Evidence: `apps/api/src/jobs/proposalExpiry.ts`, `apps/api/tests/proposal-expiry-job.test.ts`
- id: ACQ-RISK-005
  priority: P1
  status: MITIGATED
  DoD: CORS is constrained by explicit allow-list config and no longer defaults to permissive wildcard semantics in production.
  Evidence: `apps/api/src/server.ts`, `apps/api/src/lib/runtimeConfig.ts`

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

## AUTO_SPLIT_2026-03-06_ACQ-AUTH-001A
- id: ACQ-AUTH-001A
  priority: P0
  status: IN_PROGRESS
  DoD: Backend session primitives delivered in incremental slices to keep each run 1-3h and avoid monolithic auth rollout risk.
  Evidence: `apps/api/src/lib/sessionAuth.ts`, `apps/api/prisma/schema.prisma`, `apps/api/tests/session-auth.test.ts`, `apps/api/tests/operator-role.test.ts`
- id: ACQ-AUTH-001A1
  priority: P0
  status: DONE
  DoD: Introduce session token/cookie/hash helpers and DB session/user-role schema primitives with focused unit tests.
  Evidence: `apps/api/src/lib/sessionAuth.ts`, `apps/api/prisma/schema.prisma`, `apps/api/tests/session-auth.test.ts`
- id: ACQ-AUTH-001A2
  priority: P0
  status: DONE
  DoD: Wire request list/detail/create and operator status/proposal mutation routes to cookie-session identity and role extraction while preserving temporary operator-header fallback compatibility.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`, `docs/API_SPEC.md`
- id: ACQ-AUTH-001A3
  priority: P0
  status: TODO
  DoD: Remove `x-operator-role` fallback once auth login APIs are live and enforce session-only operator/admin authorization contracts.
  Evidence: `apps/api/src/routes/requests.ts`, `apps/api/tests/requests-list.test.ts`, `docs/API_SPEC.md`

## AUTO_SPLIT_2026-03-06_ACQ-AUTH-004
- id: ACQ-AUTH-004
  priority: P1
  status: IN_PROGRESS
  DoD: Deliver customer auth UX incrementally so each run lands a test-covered UI slice while backend auth APIs are still in flight.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages/SessionBootstrapPage.tsx`, `apps/web/tests/session-bootstrap-page.test.tsx`
- id: ACQ-AUTH-004A
  priority: P1
  status: DONE
  DoD: Introduce canonical `/auth/login` route, migrate session-gate redirects and shell navigation to it, and keep `/auth/session` compatibility redirect.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/auth.tsx`, `apps/web/src/components/AppShell.tsx`, `apps/web/src/pages/SessionBootstrapPage.tsx`, `apps/web/tests/session-bootstrap-page.test.tsx`, `apps/web/tests/app-shell.test.tsx`
- id: ACQ-AUTH-004B
  priority: P1
  status: DONE
  DoD: Add dedicated registration page UX (`/auth/register`) with client-side validation and test coverage, ready to bind to backend API.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages/RegisterPage.tsx`, `apps/web/src/components/AppShell.tsx`, `apps/web/tests/register-page.test.tsx`, `apps/web/tests/app-shell.test.tsx`
- id: ACQ-AUTH-004C
  priority: P1
  status: TODO
  DoD: Add forgot/reset password pages (`/auth/forgot`, `/auth/reset`) with token/error states and test coverage.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages`, `apps/web/tests`

## RUN_UPDATE_2026-03-06T16:23:58+0100
- id: ACQ-AUTH-004B
  priority: P1
  status: DONE
  DoD: Add dedicated registration page UX (`/auth/register`) with client-side validation and test coverage, ready to bind to backend API.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages/RegisterPage.tsx`, `apps/web/src/pages/SessionBootstrapPage.tsx`, `apps/web/tests/register-page.test.tsx`, `apps/web/tests/session-bootstrap-page.test.tsx`
- id: ACQ-AUTH-004C
  priority: P1
  status: TODO
  DoD: Add forgot/reset password pages (`/auth/forgot`, `/auth/reset`) with token/error states and test coverage.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages`, `apps/web/tests`

## RUN_UPDATE_2026-03-06T16:27:30+0100
- id: ACQ-AUTH-004C
  priority: P1
  status: DONE
  DoD: Add forgot/reset password pages (`/auth/forgot`, `/auth/reset`) with token/error states and test coverage.
  Evidence: `apps/web/src/router.tsx`, `apps/web/src/pages/ForgotPasswordPage.tsx`, `apps/web/src/pages/ResetPasswordPage.tsx`, `apps/web/src/pages/SessionBootstrapPage.tsx`, `apps/web/tests/forgot-reset-page.test.tsx`
- id: ACQ-AUTH-002
  priority: P1
  status: DONE
  DoD: Implement customer auth API (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) with password hashing and brute-force protection.
  Evidence: `apps/api/src/routes/auth.ts`, `apps/api/tests/auth-routes.test.ts`, `docs/API_SPEC.md`, `docs/SECURITY.md`

## RUN_UPDATE_2026-03-06T17:22:41+0100
- id: ACQ-AUTH-002
  priority: P1
  status: DONE
  Note: Split to unblock API auth integration in 1-3h increments.
- id: ACQ-AUTH-002A
  priority: P1
  status: DONE
  DoD: Add session-backed `GET /api/auth/me` and `POST /api/auth/logout` contracts with deterministic `401 AUTH_REQUIRED` and cookie revocation behavior.
  Evidence: `apps/api/src/routes/auth.ts`, `apps/api/tests/auth-routes.test.ts`, `docs/API_SPEC.md`, `plan/PROGRESS_LOG.md`.
- id: ACQ-AUTH-002B
  priority: P1
  status: DONE
  DoD: Add credential auth endpoints (`POST /api/auth/register`, `POST /api/auth/login`) with password hashing and brute-force protections.
  Evidence target: `apps/api/src/routes/auth.ts`, `apps/api/src/lib/passwordAuth.ts`, `apps/api/tests/auth-routes.test.ts`, `docs/API_SPEC.md`, `docs/SECURITY.md`.

## RUN_UPDATE_2026-03-06T18:05:00+0100
- id: ACQ-AUTO-017
  priority: P1
  status: DONE
  DoD: Add API integration tests for checkout/payment/proposal routes, including 429 headers and unhappy-path validations.
  Evidence: `apps/api/tests/requests-list.test.ts`, `apps/api/tests/request-checkout-proposal.test.ts`, `apps/api/src/routes/requests.ts`
  Note: completed by stabilizing rate-limit guard execution and validating checkout/confirm/proposal unhappy-path contracts.
