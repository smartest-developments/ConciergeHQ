# TASK_BACKLOG

Backlog policy: keep `ACTIVE_TASKS` self-maintaining with automated gap discovery and enforce `P0 <= 7` items.

## STRATEGIC_EPICS
- id: EPIC-1
  priority: P0
  status: IN_PROGRESS
  DoD: End-to-end request -> fee -> proposal state flow implemented with legal boundaries enforced.
  Evidence: `docs/PRD.md`, `docs/STATE_MACHINE.md`, `apps/api/src/routes/requests.ts`
- id: EPIC-2
  priority: P1
  status: TODO
  DoD: Authenticated customer accounts and role-based operator console.
  Evidence: `docs/SECURITY.md`
- id: EPIC-3
  priority: P1
  status: TODO
  DoD: Proposal publishing + expiry automation with notifications.
  Evidence: `docs/STATE_MACHINE.md`

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
  DoD: Web UI with request creation, fee placeholder, dashboard status view.
  Evidence: `apps/web/src/pages/CreateRequestPage.tsx`, `apps/web/src/pages/PaymentPage.tsx`, `apps/web/src/pages/DashboardPage.tsx`
- id: ACQ-004
  priority: P0
  status: DONE
  DoD: Data model + migration + seed with sample user/request.
  Evidence: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260221204500_init/migration.sql`, `apps/api/prisma/seed.ts`
- id: ACQ-005
  priority: P0
  status: TODO
  DoD: Replace mock payment with PSP integration while preserving non-merchant role boundaries.
  Evidence: `apps/web/src/pages/PaymentPage.tsx`
- id: ACQ-006
  priority: P1
  status: TODO
  DoD: Add operator-side proposal publishing endpoint with 2-hour expiry job.
  Evidence: `docs/STATE_MACHINE.md`

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
- id: ACQ-RISK-001
  priority: P0
  status: TODO
  DoD: Legal copy appears in all user-facing fee/proposal touchpoints.
  Evidence: `docs/LEGAL_BOUNDARIES.md`, `apps/web/src/pages/PaymentPage.tsx`
- id: ACQ-RISK-002
  priority: P1
  status: TODO
  DoD: Abuse prevention implemented with concrete rate limiting.
  Evidence: `docs/SECURITY.md`

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
