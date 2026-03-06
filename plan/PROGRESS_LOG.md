# PROGRESS_LOG

## 2026-03-06
- 2026-03-06T11:45:00+0100 — ACQ-AUTO-013 Race-safe proposal expiry processing — Result: refactored expiry worker to use conditional `updateMany` inside transaction so only one API instance can transition each request from `PROPOSAL_PUBLISHED` to `PROPOSAL_EXPIRED`; status-event insert now runs only when the state update is applied, preventing duplicate expiry events under concurrent workers. Added focused job tests for successful expiry and concurrent no-op path. Backlog maintenance: marked `ACQ-AUTO-013` DONE and narrowed `MUST-01` scope to remaining auth foundation work. — Next: ACQ-AUTH-001A backend session primitives.
- 2026-03-06T10:05:00+0100 — ACQ-AUTH-001B Web route guards + auth bootstrap shell — Result: introduced client session bootstrap flow at `/auth/session`, added `RequireSession` route wrappers for customer/operator pages, and enforced role-gated access to operator surfaces (`OPERATOR|ADMIN`). Dashboard/create-request now bind identity to active session instead of editable freeform email input before fetching data. Added UI coverage in `app-shell`, `dashboard-page`, and new `session-bootstrap-page` tests. Backlog maintenance: marked `ACQ-AUTH-001B` DONE with concrete evidence. — Next: ACQ-AUTH-001A backend session primitives.
- 2026-03-06T09:32:00+0100 — ACQ-AUTO-012 State-transition API contract validation coverage — Result: validated and locked coverage for remaining P0 transition paths on `POST /api/requests/:id/status`, including `PROPOSAL_PUBLISHED -> COMPLETED` and `SOURCING -> CANCELED` with persisted status-event assertions. Backlog maintenance: marked `ACQ-AUTO-012` DONE with concrete test evidence and removed it from `MUST-01` open scope. — Next: ACQ-AUTH-001B web route guards + auth bootstrap shell.
- 2026-03-06T08:18:45+0100 — ACQ-AUTO-006 Operator-only guard for proposal publishing endpoint — Result: added proposal publish authorization gate on `POST /api/requests/:id/proposals` requiring `x-operator-role: OPERATOR|ADMIN`, returning deterministic `401 AUTH_REQUIRED` and `403 OPERATOR_FORBIDDEN` for unauthorized callers; status-event metadata now captures `operatorRole` for audit context; added unit coverage for canonical operator-role header parsing (`apps/api/tests/operator-role.test.ts`). Backlog maintenance: marked `ACQ-AUTO-006` DONE with evidence links and retained auth-foundation split (`ACQ-AUTH-001A/B`) as next P0 wave. — Next: ACQ-AUTH-001A backend session primitives.
- 2026-03-06T07:25:00+0100 — ACQ-ADMIN-002C Transition confirmation + reason capture UX — Result: request detail transition flow now stages an explicit confirmation step, captures optional operator reason text, applies optimistic request/timeline/proposal updates before server response, and then refreshes detail payload for canonical state. Added UI test coverage for confirmed transition payload with reason capture. Backlog maintenance: marked `ACQ-ADMIN-002`/`ACQ-ADMIN-002C` done and split oversized auth foundation into `ACQ-AUTH-001A` (backend session primitives) and `ACQ-AUTH-001B` (web route guards) to keep P0 work executable in 1-3h slices. — Next: ACQ-AUTH-001A backend session primitives.
- 2026-03-06T06:20:20+0100 — ACQ-ADMIN-002B Request detail transition action panel + API validation — Result: added `POST /api/requests/:id/status` with validated operator transition targets (`SOURCING|COMPLETED|CANCELED`) and transition guard enforcement from current state; wired detail-page action buttons to execute transition and refresh timeline context; expanded API/UI tests for success, invalid transition, and payload validation paths. Marked `ACQ-ADMIN-002B` done and moved `ACQ-ADMIN-002C` to in-progress for reason/confirmation UX follow-up. — Next: ACQ-ADMIN-002C add transition confirmation + reason capture UX.
- 2026-03-06T04:25:00+0100 — ACQ-ADMIN-002A Operator request detail workspace read model — Result: added `GET /api/requests/:id` detail contract with timeline + proposal history, wired `/operator/requests/:requestId` UI page, and linked queue rows to detail view for operator triage handoff. Added API + UI test coverage and split `ACQ-ADMIN-002` into `002A..C` (A done, transition actions pending in B/C). — Next: ACQ-ADMIN-002B add guarded transition action panel on request detail.
- 2026-03-06T02:52:24+0100 — ACQ-AUTO-019 Deterministic server-side queue sorting — Result: extended `GET /api/requests` query contract with `sortBy`/`sortDir`, added deterministic DB ordering (`createdAt|budgetChf` with stable tie-breakers), removed client-side re-sorting from operator queue page, and expanded API/UI tests to assert sorting params are forwarded and honored. Updated API spec and backlog evidence. — Next: ACQ-AUTH-001 secure session + RBAC foundation for operator/admin surfaces.
- 2026-03-06T02:05:00+0100 — ACQ-AUTO-018 Operator queue URL-state + sorting controls — Result: added operator queue sort controls (`createdAt|budgetChf`, `asc|desc`), persisted filters/sort/pagination into URL query params for shareable triage links, and expanded UI tests to assert query-state behavior and page navigation persistence. Marked `ACQ-AUTO-018` DONE and added backend follow-up `ACQ-AUTO-019` for server-side deterministic sorting. — Next: ACQ-AUTH-001 secure session + RBAC foundation for operator/admin surfaces.

## 2026-03-05
- 2026-03-06T00:55:00+0100 — ACQ-ADMIN-001C Operator queue API-bound filtering + pagination UI — Result: replaced client-only queue filtering with API-backed query params (`status/category/country/dateFrom/dateTo/page/pageSize`), added date-range controls, pagination navigation, and expanded web tests for filter payload + page transitions. Updated API client typing to support query object and pagination metadata. — Next: ACQ-AUTH-001 secure session + RBAC foundation for operator/admin surfaces.
- 2026-03-05T23:20:00+0100 — ACQ-ADMIN-001B Operator queue API filters + pagination — Result: extended `GET /api/requests` with server-side queue filters (`status`, `category`, `country`, `dateFrom`, `dateTo`) and paginated contract (`page`, `pageSize`, `total`, `totalPages`), plus route test coverage for filter and date-range validation behavior. — Next: ACQ-ADMIN-001C bind operator queue UI to API-backed filtering + pagination controls.
- 2026-03-05T22:44:00+0100 — ACQ-ADMIN-001A Operator queue UI baseline — Result: added `/operator/queue` page with status/category/country filters, request visibility count, and AppShell navigation link; added targeted UI tests and split `ACQ-ADMIN-001` into sequenced sub-tasks (`001A..001C`) to isolate backend/API pagination from UI delivery. — Next: ACQ-ADMIN-001B server-side queue filters + pagination contract on `GET /api/requests`.
- 2026-03-05T22:05:00+0100 — ACQ-AUTO-015 Startup env validation fail-fast — Result: added startup validation for required (`STRIPE_SECRET_KEY`, `WEB_BASE_URL`) and typed rate-limit/CORS envs, wired validation in API bootstrap, and expanded runtime-config tests; also reconciled backlog status for already-shipped ACQ-AUTO-005 dashboard payment notices. — Next: ACQ-AUTO-006 operator-only auth guard for proposal publishing endpoint.
- 2026-03-05T18:05:00+0100 — ACQ-AUTO-014 Env-driven CORS allow-list hardening — Result: replaced permissive CORS with `CORS_ALLOWED_ORIGINS` allow-list + localhost defaults, added runtime config tests, updated security/env docs, and marked backlog item done. — Next: ACQ-AUTO-015 startup env validation fail-fast.

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
- 2026-03-06T11:35:00+0100 — ACQ-AUTH-001A1 backend session primitives scaffold — Result: added Prisma auth-role/session schema primitives (`User.role`, `Session` model) and new session helper module (`sessionAuth`) for cookie token extraction, token hashing, cookie issuance/clear, and active-session identity lookup (`resolveSessionIdentity`). Expanded unit coverage with `session-auth.test.ts` and extended operator-role parsing tests to support session role precedence. Backlog maintenance: split `ACQ-AUTH-001A` into `001A1` (DONE) + `001A2` (TODO route wiring) to keep P0 auth work executable in small increments. — Next: ACQ-AUTH-001A2 wire request mutation routes to cookie sessions and phase out header fallback.
