# Security Notes (v1)

## Auth/session plan
- v1 bootstrap runs without full auth, but API is designed to add auth middleware.
- Next increment should enforce session-bound user identity and remove raw email query filtering.
- Planned session model: HTTP-only secure cookie + server-side session table with rotation.
- Interim control: proposal publishing requires `Authorization: Bearer <OPERATOR_API_KEY>` and fails closed when key is unset.

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
- Planned: global cap for unauthenticated routes.

## Data protection
- Store only required user data (email, optional name).
- Avoid storing payment instrument data (not in service scope).
- Use Prisma parameterization to avoid SQL injection.

## Logging and observability
- Fastify logger enabled for structured logs.
- Never log full request bodies with sensitive free-form content by default.
- Planned: request-id correlation and audit trail on status transitions.

## CORS policy
- CORS is now environment-driven via `CORS_ALLOWED_ORIGINS` (comma-separated absolute origins).
- `WEB_BASE_URL` is automatically included in the CORS allow-list when valid.
- In non-production environments, if no allow-list is configured, CORS allows all origins to preserve local DX.
- In production (`NODE_ENV=production`), wildcard behavior is disabled; only configured allow-list origins receive CORS allow headers.

## Startup configuration hardening
- API startup now validates required environment variables and exits fast on configuration errors.
- Required env keys: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `WEB_BASE_URL`.
- Typed env checks: `PORT` (1-65535), `RATE_LIMIT_*` positive integers, `NODE_ENV` (`development|test|production`), and `CORS_ALLOWED_ORIGINS` as absolute origins.
- Invalid configuration no longer silently falls back at process boot; startup fails with explicit error details.

## Operational hardening backlog
- Add CSRF protections when cookie sessions are introduced.
- Add secret scanning and dependency vulnerability checks in CI.
