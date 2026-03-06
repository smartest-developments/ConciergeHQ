# Security Notes (v1)

## Auth/session plan
- v1 bootstrap runs without full auth, but API is designed to add auth middleware.
- Next increment should enforce session-bound user identity and remove raw email query filtering.
- Planned session model: HTTP-only secure cookie + server-side session table with rotation.
- Interim hardening in place: `POST /api/requests/:id/proposals` now rejects unauthenticated calls and requires `x-operator-role: OPERATOR|ADMIN` (`401 AUTH_REQUIRED` or `403 OPERATOR_FORBIDDEN`).

## Input validation and abuse controls
- Fastify routes validate payloads with Zod.
- Category and country inputs are strict allow-lists.
- Fee amount is computed server-side only.
- Rate limits (per IP, env-configurable via `RATE_LIMIT_*` variables):
  - `POST /api/requests`: default 10 requests / 10 minutes.
  - `POST /api/requests/:id/checkout`: default 20 requests / 10 minutes.
  - `POST /api/requests/:id/confirm-payment`: default 20 requests / 10 minutes.
  - `POST /api/requests/:id/proposals`: default 20 requests / 10 minutes.
- Rate-limited routes expose `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`; blocked requests also return `Retry-After`.
- CORS is restricted by env allow-list (`CORS_ALLOWED_ORIGINS`) with local defaults (`http://localhost:5173,http://127.0.0.1:5173`); permissive wildcard behavior is disabled.
- Planned: global cap for unauthenticated routes.

## Data protection
- Store only required user data (email, optional name).
- Avoid storing payment instrument data (not in service scope).
- Use Prisma parameterization to avoid SQL injection.

## Logging and observability
- Fastify logger enabled for structured logs.
- Never log full request bodies with sensitive free-form content by default.
- Planned: request-id correlation and audit trail on status transitions.

## Operational hardening backlog
- Add CSRF protections when cookie sessions are introduced.
- Add secret scanning and dependency vulnerability checks in CI.
