# API Spec (v1 bootstrap)

Base URL: `http://localhost:3001`

## Common error and throttling model
- Validation failures: `400` + `{ "error": "VALIDATION_ERROR", "details": ... }`.
- Unknown request id: `404` + `{ "error": "REQUEST_NOT_FOUND" }`.
- Business-state conflicts: `409` + domain-specific error codes.
- Rate limit exceeded: `429` + `{ "error": "RATE_LIMITED" }`.
- Rate-limited endpoints include:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset` (unix seconds)
  - `Retry-After` (only when blocked with 429)

## GET /api/health
Health check.

Example response:
```json
{
  "status": "ok",
  "service": "acquisition-concierge-api",
  "timestamp": "2026-02-21T20:45:00.000Z"
}
```

## GET /api/categories
Allowed request categories.

Example response:
```json
{
  "categories": [
    { "id": "ELECTRONICS", "label": "Electronics" },
    { "id": "HOME_APPLIANCES", "label": "Home Appliances" },
    { "id": "SPORTS_EQUIPMENT", "label": "Sports Equipment" }
  ]
}
```

## POST /api/requests
Create a sourcing request.

Example request:
```json
{
  "userEmail": "buyer@example.com",
  "budgetChf": 1800,
  "specs": "Used road bike, carbon frame, size 56, hydraulic brakes.",
  "category": "SPORTS_EQUIPMENT",
  "condition": "USED",
  "country": "CH",
  "urgency": "FAST"
}
```

Example response (201):
```json
{
  "id": 42,
  "status": "FEE_PENDING",
  "sourcingFeeChf": 180,
  "createdAt": "2026-02-21T20:50:00.000Z"
}
```

Validation notes:
- `category` must be one of allowed categories.
- `country` must be EU country code or `CH`.
- `budgetChf` must be positive.
- Fee formula: `max(50, budget * 0.10)`.

## GET /api/requests
List requests for dashboard/operator queue usage.
Includes latest proposal details when available.
Supports optional filters and pagination:
- `email=<userEmail>`
- `status=FEE_PENDING|FEE_PAID|SOURCING|PROPOSAL_PUBLISHED|PROPOSAL_EXPIRED|COMPLETED|CANCELED`
- `category=ELECTRONICS|HOME_APPLIANCES|SPORTS_EQUIPMENT`
- `country=<ISO2>`
- `dateFrom=<ISO datetime>`
- `dateTo=<ISO datetime>`
- `sortBy=createdAt|budgetChf` (default `createdAt`)
- `sortDir=asc|desc` (default `desc`)
- `page=<positive integer>` (default `1`)
- `pageSize=<1..100>` (default `20`)

Auth behavior:
- Requires a valid `acq_session` cookie. Missing/invalid session returns `401 { "error": "AUTH_REQUIRED" }`.
- If session role resolves to `CUSTOMER`, the endpoint is automatically scoped to that customer (`userId`) regardless of `email` query.
- If a `CUSTOMER` session provides a mismatched `email` filter, the endpoint returns `403 { "error": "REQUEST_FORBIDDEN" }`.

Example response:
```json
{
  "requests": [
    {
      "id": 42,
      "userEmail": "buyer@example.com",
      "budgetChf": 1800,
      "category": "SPORTS_EQUIPMENT",
      "country": "CH",
      "condition": "USED",
      "urgency": "FAST",
      "sourcingFeeChf": 180,
      "status": "FEE_PENDING",
      "feePaidAt": null,
      "createdAt": "2026-02-21T20:50:00.000Z",
      "proposal": null
    },
    {
      "id": 43,
      "userEmail": "buyer@example.com",
      "budgetChf": 2200,
      "category": "ELECTRONICS",
      "country": "CH",
      "condition": "USED",
      "urgency": "STANDARD",
      "sourcingFeeChf": 220,
      "status": "PROPOSAL_PUBLISHED",
      "feePaidAt": "2026-02-21T21:10:00.000Z",
      "createdAt": "2026-02-21T20:58:00.000Z",
      "proposal": {
        "id": 7,
        "merchantName": "Alpine Bikes",
        "externalUrl": "https://merchant.example/offer/abc",
        "summary": "Used road bike, size 56, hydraulic brakes, ready to ship.",
        "publishedAt": "2026-02-21T21:30:00.000Z",
        "expiresAt": "2026-02-21T23:30:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

Validation notes:
- `dateTo` must be greater than or equal to `dateFrom`.

## GET /api/requests/:id
Fetch operator/admin request detail context for triage workflows.

Auth behavior:
- Requires a valid `acq_session` cookie. Missing/invalid session returns `401 { "error": "AUTH_REQUIRED" }`.
- If session role resolves to `CUSTOMER`, the request must belong to that customer; otherwise `403 { "error": "REQUEST_FORBIDDEN" }`.

Example response:
```json
{
  "request": {
    "id": 42,
    "userId": 77,
    "userEmail": "buyer@example.com",
    "budgetChf": 1800,
    "sourcingFeeChf": 180,
    "specs": "Used road bike, carbon frame, size 56, hydraulic brakes.",
    "category": "SPORTS_EQUIPMENT",
    "country": "CH",
    "condition": "USED",
    "urgency": "FAST",
    "status": "PROPOSAL_PUBLISHED",
    "feePaidAt": "2026-02-21T21:10:00.000Z",
    "createdAt": "2026-02-21T20:58:00.000Z",
    "updatedAt": "2026-02-21T21:30:00.000Z"
  },
  "proposals": [
    {
      "id": 7,
      "merchantName": "Alpine Bikes",
      "externalUrl": "https://merchant.example/offer/abc",
      "summary": "Used road bike, size 56, hydraulic brakes, ready to ship.",
      "publishedAt": "2026-02-21T21:30:00.000Z",
      "expiresAt": "2026-02-21T23:30:00.000Z",
      "actedAt": null
    }
  ],
  "statusTimeline": [
    {
      "id": 91,
      "fromStatus": "SOURCING",
      "toStatus": "PROPOSAL_PUBLISHED",
      "reason": "Proposal published by operator",
      "metadata": { "proposalId": 7 },
      "occurredAt": "2026-02-21T21:30:00.000Z"
    }
  ]
}
```

Responses:
- `200` detail payload
- `404` with `{ "error": "REQUEST_NOT_FOUND" }`

Admin audit trail behavior:
- `adminAuditTrail` entries are derived from request status events and classify sensitive actions as:
  - `PROPOSAL_PUBLISHED`
  - `STATUS_OVERRIDE`
  - `ROLE_CHANGE` (`roleChange.fromRole`, `roleChange.toRole`, `roleChange.targetUserId`)
  - `ACCOUNT_STATUS_CHANGE` (`accountStatusChange.disabled`, `accountStatusChange.targetUserId`)
  - `SUPPORT_TICKET` (`supportTicket.severity`, `supportTicket.source`)

## POST /api/requests/:id/status
Operator/admin transition endpoint for explicit manual status moves used by request detail triage actions.

Example request:
```json
{
  "toStatus": "SOURCING",
  "reason": "Operator confirmed fee reception and sourcing handoff."
}
```

Supported `toStatus` values:
- `SOURCING`
- `COMPLETED`
- `CANCELED`

Transition guard:
- `FEE_PAID -> SOURCING|CANCELED`
- `SOURCING -> CANCELED`
- `PROPOSAL_PUBLISHED -> COMPLETED|CANCELED`
- `PROPOSAL_EXPIRED -> CANCELED`

Example response:
```json
{
  "id": 42,
  "status": "SOURCING",
  "updatedAt": "2026-03-06T10:00:00.000Z"
}
```

Responses:
- `200` transition accepted
- `400` with `{ "error": "VALIDATION_ERROR" }` when payload is invalid
- `401` with `{ "error": "AUTH_REQUIRED" }` when operator/admin session is missing or invalid
- `403` with `{ "error": "OPERATOR_FORBIDDEN" }` when authenticated session role is not operator/admin
- `404` with `{ "error": "REQUEST_NOT_FOUND" }`
- `409` with `{ "error": "INVALID_STATUS_TRANSITION" }` when transition is disallowed

## POST /api/requests/:id/support-ticket
Authenticated support-ticket intake endpoint for request-linked escalation evidence.

Example request:
```json
{
  "severity": "SEV-2",
  "message": "Checkout confirmation is missing after payment completion.",
  "source": "DASHBOARD"
}
```

Supported payload fields:
- `severity`: `SEV-1|SEV-2|SEV-3`
- `message`: trimmed string, `10..2000` chars
- `source`: `DASHBOARD|OPERATOR_QUEUE` (defaults to `DASHBOARD`)

Example response:
```json
{
  "ticketId": 777,
  "requestId": 42,
  "severity": "SEV-2",
  "status": "OPEN",
  "createdAt": "2026-03-09T01:45:00.000Z"
}
```

Responses:
- `201` ticket intake event accepted
- `400` with `{ "error": "VALIDATION_ERROR" }` when payload is invalid
- `401` with `{ "error": "AUTH_REQUIRED" }` when session is missing or invalid
- `403` with `{ "error": "REQUEST_FORBIDDEN" }` when a customer attempts intake for a non-owned request
- `404` with `{ "error": "REQUEST_NOT_FOUND" }`

Audit/event behavior:
- Writes immutable request status event with same `fromStatus/toStatus` as current request state.
- `metadata.supportTicket` contains `severity`, `message`, `source`, `submittedByRole`, and `submittedByUserId`.

## POST /api/requests/:id/checkout
Create a PSP (Stripe Checkout) session for the sourcing fee.

Example response:
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_123",
  "sessionId": "cs_test_123"
}
```

## POST /api/requests/:id/confirm-payment
Confirm the PSP payment after returning from Checkout.

Example request:
```json
{
  "sessionId": "cs_test_123"
}
```

Example response:
```json
{
  "id": 42,
  "status": "FEE_PAID",
  "feePaidAt": "2026-02-21T20:55:00.000Z"
}
```

## POST /api/requests/:id/proposals
Operator publishes a proposal and starts the 2-hour action window.
Requires operator/admin authorization from `acq_session` cookie session identity.

Example request:
```json
{
  "merchantName": "Alpine Bikes",
  "externalUrl": "https://merchant.example/offer/abc",
  "summary": "Used road bike, size 56, hydraulic brakes, ready to ship."
}
```

Example response:
```json
{
  "requestId": 42,
  "status": "PROPOSAL_PUBLISHED",
  "proposal": {
    "id": 7,
    "merchantName": "Alpine Bikes",
    "externalUrl": "https://merchant.example/offer/abc",
    "summary": "Used road bike, size 56, hydraulic brakes, ready to ship.",
    "publishedAt": "2026-02-21T21:00:00.000Z",
    "expiresAt": "2026-02-21T23:00:00.000Z"
  }
}
```

Additional responses:
- `401` with `{ "error": "AUTH_REQUIRED" }` when operator/admin session is missing or invalid.
- `403` with `{ "error": "OPERATOR_FORBIDDEN" }` when authenticated session role is not operator/admin.

## 2026-03-06 Auth Contract Increment
- Backend session primitives are now defined for upcoming auth APIs:
  - session cookie name: `acq_session`
  - persisted session lookup by `tokenHash` with expiry/revocation checks
  - user roles normalized to `CUSTOMER|OPERATOR|ADMIN`
- Request APIs now consume session identity for customer ownership and operator role checks:
  - `POST /api/requests` rejects customer session/email mismatch (`403 REQUEST_FORBIDDEN`)
  - `GET /api/requests` forces customer scope to session owner
  - `GET /api/requests/:id` enforces customer ownership
  - `POST /api/requests/:id/status` and `POST /api/requests/:id/proposals` enforce session-only operator/admin authorization (`ACQ-AUTH-001A3`)

## POST /api/auth/register
Create a customer account with credential hash + session issuance.

Example request:
```json
{
  "email": "buyer@example.com",
  "password": "Passw0rd!",
  "name": "Buyer"
}
```

Responses:
- `201` with `{ "user": { "id": <number>, "email": <string>, "role": "CUSTOMER" } }` and `Set-Cookie: acq_session=...`.
- `400` with `{ "error": "VALIDATION_ERROR", "details": ... }` when payload is invalid.
- `409` with `{ "error": "EMAIL_ALREADY_REGISTERED" }` when email already exists.

## POST /api/auth/login
Authenticate credentials and rotate session cookie.

Example request:
```json
{
  "email": "buyer@example.com",
  "password": "Passw0rd!"
}
```

Responses:
- `200` with `{ "user": { "id": <number>, "email": <string>, "role": "CUSTOMER|OPERATOR|ADMIN" } }` and `Set-Cookie: acq_session=...`.
- `400` with `{ "error": "VALIDATION_ERROR", "details": ... }` when payload is invalid.
- `401` with `{ "error": "INVALID_CREDENTIALS" }` when email/password mismatch.
- `429` with `{ "error": "AUTH_LOCKED", "retryAfterSeconds": <number> }` and `Retry-After` header when brute-force lock window is active.

Behavior:
- Passwords are persisted as salted scrypt hashes.
- Failed login attempts are tracked per credential.
- After 5 consecutive failed attempts, login is locked for 15 minutes.

## GET /api/auth/me
Resolve active authenticated user from `acq_session` cookie.

Responses:
- `200` with `{ "user": { "id": <number>, "email": <string>, "role": "CUSTOMER|OPERATOR|ADMIN" } }`
- `401` with `{ "error": "AUTH_REQUIRED" }` when session is missing, expired, or revoked.

## POST /api/auth/logout
Invalidate current cookie session (idempotent).

Responses:
- `204` with `Set-Cookie: acq_session=; ... Max-Age=0`.

Behavior:
- If a session token is present, matching non-revoked DB session is revoked (`revokedAt=now`).
- Endpoint still returns `204` when no session cookie is present.

## POST /api/admin/users/:userId/role
Admin-only role assignment contract for user-management and role-change audit persistence.

Example request:
```json
{
  "role": "OPERATOR",
  "requestId": 42,
  "reason": "Promotion approved by admin"
}
```

Responses:
- `200` with:
```json
{
  "user": {
    "id": 31,
    "email": "target@example.com",
    "role": "OPERATOR"
  },
  "roleChanged": true,
  "auditEventRecorded": true
}
```
- `400` with `{ "error": "VALIDATION_ERROR", "details": ... }` when params/body are invalid.
- `401` with `{ "error": "AUTH_REQUIRED" }` when session is missing/invalid.
- `403` with `{ "error": "OPERATOR_FORBIDDEN" }` when authenticated session is not `ADMIN`.
- `404` with `{ "error": "USER_NOT_FOUND" }` when target user id is unknown.
- `404` with `{ "error": "REQUEST_NOT_FOUND" }` when `requestId` is provided but request is unknown.

Behavior:
- Role update is idempotent (`roleChanged=false` when target already has requested role).
- When `requestId` is provided, server appends a request status event with `metadata.roleChange` (`fromRole`, `toRole`, `targetUserId`) so admin audit trail consumers can render role-change evidence.

## POST /api/admin/users/:userId/account-status
Admin-only account disable/enable mutation contract for credential lock controls and immutable audit evidence.

Example request:
```json
{
  "disabled": true,
  "requestId": 42,
  "reason": "Risk hold applied by compliance"
}
```

Responses:
- `200` with:
```json
{
  "user": {
    "id": 31,
    "email": "target@example.com",
    "role": "CUSTOMER"
  },
  "accountDisabled": true,
  "accountStatusChanged": true,
  "sessionsRevoked": true,
  "auditEventRecorded": true
}
```
- `400` with `{ "error": "VALIDATION_ERROR", "details": ... }` when params/body are invalid.
- `400` with `{ "error": "CANNOT_DISABLE_SELF" }` when admin attempts to disable their own account.
- `401` with `{ "error": "AUTH_REQUIRED" }` when session is missing/invalid.
- `403` with `{ "error": "OPERATOR_FORBIDDEN" }` when authenticated session is not `ADMIN`.
- `404` with `{ "error": "USER_NOT_FOUND" }` when target user id is unknown.
- `404` with `{ "error": "USER_CREDENTIAL_NOT_FOUND" }` when target user has no credential record.
- `404` with `{ "error": "REQUEST_NOT_FOUND" }` when `requestId` is provided but request is unknown.

Behavior:
- Disabling sets a long-lived credential lock and revokes active sessions for target user.
- Enabling clears the credential lock and resets failed-attempt counters.
- When `requestId` is provided, server appends request status event metadata (`accountStatusChange.disabled`, `accountStatusChange.targetUserId`) for admin audit-trail parity.
- Admin request-detail UI (`/operator/requests/:requestId`) consumes this mutation with explicit disable/enable confirmations and optional request-linked reason metadata.

## POST /api/auth/forgot-password
Request password recovery for an account.

Example request:
```json
{
  "email": "buyer@example.com"
}
```

Responses:
- `202` with `{ "status": "RESET_LINK_ENQUEUED" }` for deterministic anti-enumeration behavior.
- `400` with `{ "error": "VALIDATION_ERROR", "details": ... }` when payload is invalid.

Behavior:
- For existing credential users, server issues one expiring reset token (30 minutes) and marks previous active reset tokens as consumed.
- Response is intentionally identical for unknown emails.

## POST /api/auth/reset-password
Reset password with a single-use token.

Example request:
```json
{
  "token": "0123456789abcdef0123456789abcdef",
  "password": "N3wPassw0rd!"
}
```

Responses:
- `200` with `{ "status": "PASSWORD_RESET_SUCCESS" }`.
- `400` with `{ "error": "VALIDATION_ERROR", "details": ... }` when payload is invalid.
- `400` with `{ "error": "INVALID_RESET_TOKEN" }` when token is missing, expired, consumed, or unknown.

Behavior:
- Password is updated with salted scrypt hash.
- Reset token is consumed atomically on success.
- All active sessions for the user are revoked after password reset.
