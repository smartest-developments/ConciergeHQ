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

Example response:
```json
{
  "request": {
    "id": 42,
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
- `404` with `{ "error": "REQUEST_NOT_FOUND" }`
- `409` with `{ "error": "INVALID_STATUS_TRANSITION" }` when transition is disallowed

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
Requires header `x-operator-role: OPERATOR|ADMIN`.

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
- `401` with `{ "error": "AUTH_REQUIRED" }` when operator role header is missing.
- `403` with `{ "error": "OPERATOR_FORBIDDEN" }` when operator role is invalid.

## 2026-03-06 Auth Contract Increment
- Backend session primitives are now defined for upcoming auth APIs:
  - session cookie name: `acq_session`
  - persisted session lookup by `tokenHash` with expiry/revocation checks
  - user roles normalized to `CUSTOMER|OPERATOR|ADMIN`
- Current operator proposal publish endpoint remains backward compatible with `x-operator-role` while session route wiring is finalized in `ACQ-AUTH-001A2`.
