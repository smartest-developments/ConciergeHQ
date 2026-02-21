# API Spec (v1 bootstrap)

Base URL: `http://localhost:3001`

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

## GET /api/requests?email=<userEmail>
List requests. Optional `email` filter.

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
      "createdAt": "2026-02-21T20:50:00.000Z"
    }
  ]
}
```

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
