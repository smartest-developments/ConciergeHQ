# PROGRESS_LOG

## 2026-02-21
- Bootstrapped Node + TypeScript monorepo with npm workspaces (`apps/api`, `apps/web`).
- Added PostgreSQL docker-compose, Prisma schema/migration, and seed data.
- Implemented Fastify API routes:
  - `GET /api/health`
  - `GET /api/categories`
  - `POST /api/requests`
  - `GET /api/requests`
  - `POST /api/requests/:id/mock-pay`
- Implemented web flow:
  - Request form
  - Fee payment placeholder
  - Dashboard request list/status
- Authored documentation set for PRD/legal/state/API/security.
- Added CI workflow running lint/typecheck/test/build.
- 2026-02-21T20:04:44Z — ACQ-005 Replace mock payment with PSP integration — Result: Stripe Checkout session + confirmation flow wired, mock payment removed. — Next: ACQ-006 operator proposal publishing with expiry job.
