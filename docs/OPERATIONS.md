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

## Instrumentation Verification (ACQ-REL-004B)
- API emits structured `http_request_completed` logs with `route`, `method`, `requestId`, `statusCode`, and `latencyMs`.
- Web app emits lightweight `web-vitals` telemetry (`first-contentful-paint`, `largest-contentful-paint`, `layout-shift`) via `PerformanceObserver`.
- Verification checklist:
  - Trigger one API request and confirm `http_request_completed` includes non-null `latencyMs`.
  - Load dashboard and confirm browser logs include `[telemetry:web-vitals]` entries.
  - Confirm no sensitive fields are present in API or web telemetry payloads.

## Incident Response Runbook (ACQ-REL-005)

### Severity Matrix + Response SLAs
| Severity | Trigger examples | Initial response SLA | Update cadence |
| --- | --- | --- | --- |
| `SEV-1` | Full API outage, data-integrity risk, auth/session compromise, payment confirmation failure spike across all users | <= 15 minutes | Every 15 minutes |
| `SEV-2` | Partial outage (for one critical flow), persistent elevated 5xx/latency above alert threshold, proposal publish blocked for operators | <= 30 minutes | Every 30 minutes |
| `SEV-3` | Localized degradation, non-critical feature regression with workaround available | <= 4 hours | Every 2 hours |

### Escalation Path
1. Incident commander (`IC`): backend owner on call.
2. Secondary responder: web owner on call.
3. Product owner + legal stakeholder: required for `SEV-1` and any incident touching payment/compliance/legal copy.
4. Escalate to infrastructure/vendor support when:
   - payment provider errors persist > 30 minutes (`SEV-1`/`SEV-2`);
   - database connectivity incidents persist > 20 minutes;
   - deployment rollback fails once.

### First 30 Minutes Checklist
1. Create incident channel/ticket with UTC timestamp and severity.
2. Assign `IC`, communications owner, and scribe.
3. Freeze non-incident deploys until severity is downgraded.
4. Confirm blast radius:
   - affected endpoints/routes;
   - affected user segments/roles;
   - latest successful request/deploy timestamp.
5. Start mitigation:
   - rollback last deploy if regression is release-correlated;
   - disable non-essential jobs/traffic paths if they amplify risk;
   - apply temporary rate/feature guard if needed.

### Communications Template
- Initial update:
  - `Severity`: `SEV-x`
  - `Impact`: concise customer-visible effect
  - `Start time (UTC)`:
  - `Current mitigation`:
  - `Next update ETA`:
- Resolution update:
  - `Resolved at (UTC)`:
  - `Root cause summary`:
  - `Permanent fix`:
  - `Follow-up actions` (link backlog IDs):

### Postmortem Template (required for `SEV-1`/`SEV-2`)
- `Incident ID`:
- `Severity`:
- `Start / end (UTC)`:
- `Customer impact`:
- `Detection source` (alert, support, manual):
- `Root cause`:
- `What worked`:
- `What failed`:
- `Action items`:
  - each item must include owner + due date + backlog ID.

Post-incident minimum evidence:
- Timeline with UTC timestamps.
- Root cause and trigger path.
- Customer impact scope.
- Immediate fix + follow-up backlog tasks.

## Performance SLO Baseline (ACQ-REL-009A)

### SLO targets
- API latency: `GET /api/requests` and `POST /api/requests` p95 <= 1200ms over 15-minute windows.
- API error budget: 5xx rate <= 1% per day for customer-critical endpoints.
- Web vitals: dashboard `LCP <= 2.5s`, `CLS <= 0.1`, `INP <= 200ms` on representative 4G mobile profile.

### Measurement baseline
- API: compute p95 and error rate from `http_request_completed` logs by route and status code.
- Web: sample `web-vitals` telemetry stream and aggregate by route (`/`, `/dashboard`, `/operator/queue`).
- Breach policy: two consecutive windows above threshold open a `SEV-2` investigation.

### Verification checklist
- Capture one 24h sample and record p95 + error-rate summary in `plan/PROGRESS_LOG.md`.
- Capture one web-vitals sample set and confirm dashboard values meet LCP/CLS/INP targets.
- Attach query/command snippets used for SLO computation in release evidence.

## Customer Support + Admin Escalation Baseline (ACQ-REL-012)

### Contact paths
- Customer support inbox: `support@acquisition-concierge.example` (primary).
- Operator escalation alias: `ops-escalation@acquisition-concierge.example`.
- Security/legal escalation alias: `legal-security@acquisition-concierge.example`.

### SLA targets
- Initial customer acknowledgment: within 1 business day.
- Request-status clarification (order state mismatch): within 8 business hours.
- Fee/payment dispute triage handoff to operator: within 4 business hours.
- Legal/security requests (privacy, abuse, compliance): acknowledge within 4 business hours, assign owner immediately.

### Dispute + escalation playbook
1. Capture evidence: request ID, timeline screenshot, payment session id, and latest status events.
2. Classify severity:
   - `SEV-3` informational/question only;
   - `SEV-2` wrong status/payment mismatch with no financial impact;
   - `SEV-1` duplicate charge, unauthorized access suspicion, or legal-risk wording incident.
3. Route by severity:
   - `SEV-3`: support owner resolves directly and records note in ticket.
   - `SEV-2`: operator owner validates state-machine trail and replies with remediation ETA.
   - `SEV-1`: page on-call operator + legal/security alias; post first status update within 30 minutes.
4. Resolution criteria:
   - Customer receives deterministic outcome summary.
   - Ticket links request/audit evidence and applied remediation.
   - If root cause is product defect, open follow-up backlog item and attach ticket ID.
