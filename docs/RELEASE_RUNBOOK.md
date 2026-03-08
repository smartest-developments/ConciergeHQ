# RELEASE_RUNBOOK

## Scope
This runbook defines the staging and production deployment process for ConciergeHQ v1.

## Preconditions
- `main` is green on CI (`lint`, `typecheck`, `test`, `build`).
- Production changes are merged (no direct pushes to release tags).
- Required runtime secrets exist in GitHub environments:
  - `staging`
  - `production`

## Deployment workflow
Workflow file: `.github/workflows/deploy.yml`

### Staging deploy (manual)
1. Open Actions -> `deploy` workflow.
2. Select `environment=staging`.
3. Run workflow from target branch/commit.
4. Confirm `verify` and `deploy_staging` jobs succeed.

### Production deploy (tagged release)
1. Create and push an annotated version tag from `main`:
   - `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
   - `git push origin vX.Y.Z`
2. Confirm `deploy` workflow runs on tag push.
3. Approve `production` environment gate in GitHub (protected approval).
4. Confirm `verify`, `create_release`, and `deploy_production` jobs succeed.

### Production deploy (manual rollback/redeploy)
1. Open Actions -> `deploy` workflow.
2. Select `environment=production`.
3. Set `release_tag` to an existing `v*` tag.
4. Run workflow and approve production environment gate.
5. Confirm `verify` and `deploy_production` jobs succeed.

## Post-deploy UI smoke gate
- Workflow gate: `deploy_staging` and `deploy_production` run `npm --workspace apps/web run test:smoke` after deployment.
- Smoke scope:
  - `apps/web/tests/dashboard-page.test.tsx`
  - `apps/web/tests/operator-queue-page.test.tsx`
  - `apps/web/tests/operator-request-detail-page.test.tsx`

## Rollback trigger thresholds
- Trigger immediate rollback/redeploy to prior release tag if any smoke test fails in `deploy_production`.
- Trigger immediate rollback/redeploy if post-deploy smoke finds 1+ regression in:
  - dashboard request visibility,
  - operator queue filtering/pagination, or
  - operator request-detail transition/proposal flows.
- Record incident summary and failing spec path in release notes before retrying production deploy.

## Acceptance criteria for ACQ-REL-002
- Staging deploy path exists and requires successful verify jobs.
- Production deploy path uses protected `production` environment approval.
- Tagged releases (`v*`) create a GitHub release and trigger production deploy path.
- Manual production deploy requires explicit `release_tag` input.
- Post-deploy web smoke checks run automatically and block production completion when regressions are detected.

## ACQ-REL-003 backup/restore + migration rollback dry-run
### Scope and guardrails
- Run this procedure in staging only.
- Freeze schema changes for the dry-run window (no concurrent migration deploys).
- Keep production data out of staging snapshots.

### Inputs
- `DATABASE_URL` for staging app database.
- Access to Postgres client tools (`pg_dump`, `pg_restore`, `psql`).
- Git tag or commit SHA for current release and previous known-good release.

### Dry-run procedure
1. Capture baseline release + schema state.
   - `git rev-parse --short HEAD`
   - `npm --workspace apps/api run prisma -- migrate status`
2. Create a compressed logical backup.
   - `pg_dump --format=custom --file=backup_pre_rel003.dump "$DATABASE_URL"`
3. Verify backup artifact integrity.
   - `pg_restore --list backup_pre_rel003.dump >/tmp/backup_pre_rel003.list`
   - Confirm `/tmp/backup_pre_rel003.list` is non-empty.
4. Apply a reversible migration candidate in staging.
   - `npm --workspace apps/api run prisma -- migrate deploy`
5. Validate application + API health after migration.
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
6. Execute rollback restore into staging DB.
   - `pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DATABASE_URL" backup_pre_rel003.dump`
7. Re-run schema + API checks after restore.
   - `npm --workspace apps/api run prisma -- migrate status`
   - `npm run test`
8. Record evidence in release notes and progress log.

### Dry-run evidence template
- Date/time window:
- Operator:
- Baseline commit/tag:
- Backup artifact: `backup_pre_rel003.dump`
- Backup integrity check (`pg_restore --list`): PASS/FAIL
- Migration deploy result: PASS/FAIL
- Restore rollback result: PASS/FAIL
- Post-restore gate results (`lint/typecheck/test/build`):
- Follow-up actions:

## ACQ-REL-008C keyboard-only + contrast checklist evidence
### Scope
- App shell + auth/session flow (`/auth/login`, `/auth/session`).
- Customer request creation flow (`/requests/new`).
- Operator queue + request detail surfaces (`/operator/queue`, `/operator/requests/:requestId`).

### Checklist execution (2026-03-08)
1. Keyboard-only navigation checks:
   - Verified tab order reaches skip link, primary nav items, form controls, and submit actions in visual order.
   - Verified `Enter` and `Space` activate buttons/links across request and operator flows.
   - Verified no keyboard trap in queue filters, detail actions, or proposal controls.
2. Focus visibility checks:
   - Verified global `:focus-visible` outline is present on links, buttons, and text/select/textarea controls.
   - Verified skip-link becomes visible on focus and moves focus target to `#main-content`.
3. Contrast checks (manual):
   - Verified high-importance text and controls meet WCAG 2.1 AA contrast target (>= 4.5:1 for normal text, >= 3:1 for large text/UI indicators).
   - Spot-checked primary text, muted helper text, focus outlines, and action buttons on app shell + operator pages.

### Findings
- No keyboard blocker found in the sampled release-critical UI flows.
- No failing contrast pair detected in sampled controls/copy.
- Existing accessibility baseline from `ACQ-REL-008A` and form semantics fixes from `ACQ-REL-008B` remain valid.

## Notes
- Replace placeholder `echo` deployment commands with provider-specific deploy commands once infrastructure target is finalized.
