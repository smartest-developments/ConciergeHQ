# UAT Report

Last updated: 2026-03-08
Owner: Release manager
Scope: `ACQ-REL-011`

## 1) Run Metadata
- Environment: `staging`
- Build/tag:
- Run date/time (UTC):
- Participants:
- UAT script version/reference:

## 2) Entry Criteria Check
- [ ] Staging deployed from release candidate build
- [ ] Database migrations applied successfully
- [ ] Seed/test accounts ready (customer + operator/admin)
- [ ] Required env/config validated
- [ ] Rollback path verified from `docs/RELEASE_RUNBOOK.md`

## 3) Test Matrix
| Scenario ID | Area | Expected Outcome | Status (PASS/FAIL/BLOCKED) | Evidence |
|---|---|---|---|---|
| UAT-01 | Auth login/logout | Session lifecycle works and protected routes enforce auth |  |  |
| UAT-02 | Request creation | Valid request can be created with deterministic validation behavior |  |  |
| UAT-03 | Fee + checkout flow | Checkout start/success/failure paths are handled and surfaced |  |  |
| UAT-04 | Operator/admin triage | Queue/detail/actions enforce role and expected transitions |  |  |
| UAT-05 | Proposal publish + expiry | Proposal publish works and expiry behavior remains correct |  |  |
| UAT-06 | Dashboard status visibility | Customer dashboard reflects canonical state timeline |  |  |
| UAT-07 | Legal/compliance copy | Required legal/privacy copy is present on required surfaces |  |  |
| UAT-08 | Observability hooks | Key telemetry/log hooks are emitted for release-critical flows |  |  |

## 4) Defects and Known Limitations
| ID | Severity (S1-S3) | Description | Owner | Mitigation | Blocking Release? |
|---|---|---|---|---|---|

## 5) Release Decision
- Decision: `GO` / `NO_GO` / `GO_WITH_LIMITATIONS`
- Rationale:
- Follow-up actions (with owners + due dates):

## 6) Sign-off
- Product:
- Engineering:
- Operations:
- Date:
