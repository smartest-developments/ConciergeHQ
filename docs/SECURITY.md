# Security Notes (v1)

## Auth/session plan
- v1 bootstrap runs without full auth, but API is designed to add auth middleware.
- Next increment should enforce session-bound user identity and remove raw email query filtering.
- Planned session model: HTTP-only secure cookie + server-side session table with rotation.

## Input validation and abuse controls
- Fastify routes validate payloads with Zod.
- Category and country inputs are strict allow-lists.
- Fee amount is computed server-side only.
- Planned rate limits:
  - `POST /api/requests`: 10 requests / 10 minutes per IP.
  - `POST /api/requests/:id/mock-pay`: 20 requests / 10 minutes per IP.
  - Global cap for unauthenticated routes.

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
- Add origin allow-list for CORS in production.
- Add secret scanning and dependency vulnerability checks in CI.
