# Security Notes (v1)

## Auth/session plan
- v1 bootstrap runs without full auth, but API is designed to add auth middleware.
- Next increment should enforce session-bound user identity and remove raw email query filtering.
- Planned session model: HTTP-only secure cookie + server-side session table with rotation.
- Web UI now enforces a bootstrap session gate (`/auth/login`, with `/auth/session` compatibility redirect) and role-aware route guards (`CUSTOMER|OPERATOR|ADMIN`) before protected pages load data; this is a temporary frontend safety layer until backend cookie sessions (`ACQ-AUTH-001A`) are live.
- Operator-only mutation routes (`POST /api/requests/:id/status`, `POST /api/requests/:id/proposals`) now require `acq_session` cookie auth with persisted `OPERATOR|ADMIN` user role (`401 AUTH_REQUIRED` or `403 OPERATOR_FORBIDDEN`).

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
- CI now enforces dependency vulnerability and secret scanning gates:
  - `npm audit --audit-level=high --omit=dev` fails builds on high/critical production dependency findings.
  - `gitleaks/gitleaks-action@v2` fails builds when committed secrets are detected.

## 2026-03-06 Session Primitive Baseline (ACQ-AUTH-001A1)
- Added backend session helper primitives in `apps/api/src/lib/sessionAuth.ts`:
  - `acq_session` cookie parsing + issuance/clear header builders
  - SHA-256 token hashing for DB lookup
  - active-session resolver with revoked/expired filtering
- Added role primitives in schema via `User.role` (`CUSTOMER|OPERATOR|ADMIN`) and `Session` persistence model.
- `ACQ-AUTH-001A3` completed: proposal/status mutation routes no longer accept header role fallback and now enforce session-only operator/admin auth.

## 2026-03-06 Credential Auth Increment (ACQ-AUTH-002B)
- Added `UserCredential` persistence (`passwordHash`, failed-attempt counter, lock window) to support email/password auth without storing plaintext secrets.
- `POST /api/auth/register` now hashes password with salted scrypt and immediately issues an HTTP-only `acq_session` cookie.
- `POST /api/auth/login` now enforces deterministic brute-force lockout (5 failed attempts -> 15 minute lock, `429 AUTH_LOCKED` + `Retry-After`).
- Successful login resets failed-attempt counters and creates a fresh server-side session row.

## 2026-03-06 Password Recovery Increment (ACQ-AUTH-003)
- Added `PasswordResetToken` persistence with SHA-256 token hash, 30-minute expiry, single-use `consumedAt`, and requesting IP metadata.
- `POST /api/auth/forgot-password` now returns deterministic `202 RESET_LINK_ENQUEUED` for both known and unknown emails (anti-enumeration).
- `POST /api/auth/reset-password` now validates single-use expiring tokens, rotates password hash, resets credential lock counters, and revokes all active sessions for the account.
