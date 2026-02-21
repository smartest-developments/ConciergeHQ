# ConciergeHQ - Acquisition Concierge (v1 bootstrap)

Acquisition Concierge is a paid sourcing service, not a merchant. Users submit sourcing requests, pay a non-refundable sourcing fee, and receive a proposal with an external purchase link.

## Product guardrails
- We do not sell goods and we do not process purchase payments for items.
- Purchase happens directly between user and external merchant.
- No after-sales support, warranty handling, or returns handling.
- Allowed categories only: Electronics, Home Appliances, Sports Equipment.
- Prohibited categories: cars, real estate, medicines, weapons, illegal items.
- Sourcing fee: `max(50 CHF, 10% of budget)`.
- Proposal action window: 2 hours from proposal publication.

## Monorepo layout
- `apps/api`: Fastify + Zod + Prisma API.
- `apps/web`: React + React Router web app.
- `docs`: product/legal/state/API/security docs.
- `plan`: backlog, progress log, health score.

## Local development
1. Install dependencies:
```bash
npm install
```
2. Create env file:
```bash
cp .env.example .env
```
Set `STRIPE_SECRET_KEY` to a Stripe test key to enable PSP checkout.
3. Start PostgreSQL:
```bash
npm run db:up
```
4. Apply migrations and seed:
```bash
npm --workspace apps/api run prisma:migrate:deploy
npm --workspace apps/api run db:seed
```
5. Run web + API:
```bash
npm run dev
```

Default local URLs:
- Web: `http://localhost:5173`
- API: `http://localhost:3001`

## Scripts
- `npm run dev`: run web + api in watch mode.
- `npm run build`: build all workspaces.
- `npm run test`: run tests in all workspaces.
- `npm run lint`: workspace lint checks.
- `npm run typecheck`: workspace typechecks.
- `npm run db:up`: start PostgreSQL via Docker Compose.
- `npm run db:reset`: reset DB with Prisma migrate reset.
- `npm run e2e`: Playwright foundation placeholder.

## API quick check
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/categories
```

## Legal and policy docs
- `docs/PRD.md`
- `docs/LEGAL_BOUNDARIES.md`
- `docs/STATE_MACHINE.md`
- `docs/API_SPEC.md`
- `docs/SECURITY.md`
