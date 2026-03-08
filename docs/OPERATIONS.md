# OPERATIONS

Last updated: **2026-03-08**

## Observability Baseline (ACQ-REL-004A)

### Structured Logging
- API logs are JSON with fields: `timestamp`, `level`, `service`, `route`, `requestId`, `userId?`, `statusCode`, `latencyMs`, `errorCode?`.
- Web logs include critical client failures for checkout, proposal open, and auth bootstrap.
- Sensitive values (passwords, reset tokens, session tokens, payment secrets) must never be logged.

### Retention
- Application logs retained for 30 days in searchable storage.
- Security/auth logs retained for 90 days.
- Audit trail events remain in primary DB and are part of backup scope.

### Alerts
- API error-rate alert: trigger when 5xx rate > 2% for 5 minutes.
- API latency alert: trigger when `p95` latency > 1200ms for 10 minutes.
- Payment failure alert: trigger when checkout/confirm failures >= 5 in 15 minutes.
- Auth lockout alert: trigger when `AUTH_LOCKED` count >= 20 in 15 minutes.

### Dashboard Signals
- Track request flow counts by status: `FEE_PAID`, `SOURCING`, `PROPOSAL_PUBLISHED`, `COMPLETED`, `CANCELED`.
- Track proposal expiry worker outcomes: processed, skipped, and conflict-safe no-op counts.
- Track rate-limit responses (`429`) by endpoint.

## Incident Response Baseline (ACQ-REL-005 precursor)

Severity matrix preview:
- `SEV-1`: complete outage or data-integrity risk; response start <= 15m.
- `SEV-2`: partial outage or major degraded flow; response start <= 30m.
- `SEV-3`: localized degradation; response start <= 4h.

Escalation:
- Primary on-call: backend owner.
- Secondary: web owner.
- Product/legal escalation required for incidents touching payment/legal copy/compliance.

Post-incident minimum evidence:
- Timeline with UTC timestamps.
- Root cause and trigger path.
- Customer impact scope.
- Immediate fix + follow-up backlog tasks.
