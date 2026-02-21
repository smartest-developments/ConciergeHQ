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
- 2026-02-21T21:02:26Z — ACQ-006 Add operator proposal publishing with expiry job — Result: Proposal publish endpoint + expiry job added; API spec updated. — Next: ACQ-RISK-001 legal copy across fee/proposal touchpoints.
- 2026-02-21T22:01:43Z — ACQ-RISK-001 Legal copy across fee/proposal touchpoints — Result: Added legal notices to payment confirmation + proposal dashboard states. — Next: ACQ-RISK-002 abuse prevention with rate limiting.
- 2026-02-21T23:02:35Z — ACQ-RISK-002 Abuse prevention with rate limiting — Result: Added per-IP rate limiting on request creation, payment, and proposal publish routes; updated security doc. — Next: ACQ-AUTO-006 operator-only auth guard for proposal publishing.
