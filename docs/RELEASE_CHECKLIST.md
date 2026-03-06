# Release Checklist

Last updated: 2026-03-06
Scope: ConciergeHQ MVP release gate
Owners: Product, Engineering, Security, Legal, Operations

## Go/No-Go Rule
- `GO` only if all P0 items below are completed and signed.
- Any unchecked P0 item is an automatic `NO-GO`.

## Functional Sign-off (Owner: Engineering Lead + Product)
- [ ] Core flow validated in staging: create request -> checkout -> payment confirm -> operator sourcing -> proposal publish -> completion.
- [ ] Operator/admin request detail transitions validated (`SOURCING|COMPLETED|CANCELED`) with timeline event persistence.
- [ ] Customer dashboard shows canonical statuses and proposal details without stale cache anomalies.
- [ ] Session auth guards enforced for customer/operator/admin pages and APIs.
- [ ] Regression pack passes for request routes and operator detail surfaces.

## Security Sign-off (Owner: Security)
- [ ] `npm audit --omit=dev` reviewed (no unwaived high/critical issues).
- [ ] Session-cookie settings verified in staging (`HttpOnly`, `Secure`, `SameSite`, expiry).
- [ ] RBAC checks verified on privileged routes (`/api/requests/:id/status`, `/api/requests/:id/proposals`).
- [ ] Rate limit policy validated on auth/request/payment mutation endpoints.
- [ ] CORS allow-list and required env validation confirmed for release environment.

## Legal & Compliance Sign-off (Owner: Legal)
- [ ] UI legal boundaries copy reviewed and consistent across checkout/payment/proposal screens.
- [ ] Privacy policy and terms links reachable in production shell/footer.
- [ ] Data retention and deletion operating policy documented and approved.

## Operations Sign-off (Owner: Operations)
- [ ] Deployment runbook reviewed with rollback path and owner on-call.
- [ ] DB backup and restore dry-run completed within last 7 days.
- [ ] Monitoring and alert routing configured (API error rate, payment failure, job failures).
- [ ] Incident severity matrix and comms escalation path confirmed.

## Quality Gates (Owner: Engineering)
Run from repository root before release tag:
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`

## Approval Log
- Product: ____________________ Date: __________
- Engineering: ________________ Date: __________
- Security: ___________________ Date: __________
- Legal: ______________________ Date: __________
- Operations: _________________ Date: __________

## Release Decision
- Decision: `GO` / `NO-GO`
- Release tag/version: ____________________
- Notes: _________________________________________________
