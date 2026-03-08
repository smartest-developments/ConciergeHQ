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

## Notes
- Replace placeholder `echo` deployment commands with provider-specific deploy commands once infrastructure target is finalized.
