# OPS-R1-FINAL-DEPLOY-EVIDENCE-864d651a8

Date: 2026-03-10

## Scope Freeze

This work item is bounded to:

- evidence freshness
- staging deploy
- rollback drill
- observability verification
- final deployment recommendation

No product engineering scope is included here. The only legitimate reopen path is a real release blocker discovered by staging or operations.

## Baseline

- Current protected main: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
- Engineering remediation baseline: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`
- PR `#659` merged at: `2026-03-10T14:18:33Z`
- PR `#659` head commit: `a042ce6506f03732493d7b18f3e7d2f0034a5e28`
- PR `#659` scope: docs-only change to `os-platform/core/pilot/production-readiness-accounting.md`

## Evidence Freshness Completed

1. Verified `origin/main` resolves to `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`.
2. Verified PR `#659` merged the accounting publication onto protected `main`.
3. Verified required branch-protection checks and admin enforcement on `main`.
4. Verified required checks are green on `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`.
5. Re-ran `pnpm install --frozen-lockfile`, `pnpm run type-check`, `phase83`, `phase85`, `phase86`, and `pnpm run check:generated` in a clean detached worktree at `864d651a8`.

## Execution Results

### Staging Deploy

- Environment: `staging`
- GitHub deployment record: `4029987833`
- Recorded start: `2026-03-10T14:19:35Z`
- Recorded end: `2026-03-10T14:19:44Z`
- Migration/config actions performed: none evidenced
- What actually happened: `.github/workflows/release-lane.yml` downloaded an artifact, extracted it, and the `Deploy STAGING` step only echoed the SHA
- Independent runtime probe: `https://terrafusion-backend-staging.azurecontainerapps.io/health` failed DNS resolution
- Result: `fail`
- Warning: a bookkeeping-only deployment record exists, but no decision-grade staging deploy was executed

### Rollback Drill

- Rollback target SHA: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`
- Trigger method: not executed
- Time to recover: not measurable
- Data/config impact: not measurable
- Clean / partial / messy: not exercised
- Result: `fail`
- Warning: no live staging target existed to roll back honestly

### Observability Verification

- Health endpoints respond correctly: `fail`
- Logs emitted and searchable: `not verified`
- Metrics flowing: `not verified`
- Alerts wired and usable: `not verified`
- Dashboards reflect deployed version/path: `not verified`
- Error conditions produce usable signals: `not verified`
- Control-plane blocker 1: Heroku MCP returned `The token provided to HEROKU_API_KEY is invalid`
- Control-plane blocker 2: Grafana MCP returned `http: no Host in request URL`
- Result: `fail`

## Final Deployment Recommendation

- Protected main: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
- Engineering remediation baseline: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`
- Accounting published: `yes`, via PR `#659`
- Staging deploy: `fail`
- Rollback verification: `fail`
- Observability verification: `fail`
- Decision: `not approved`
- Reason: the protected-main lineage is governance-green and locally revalidated, but no real staging deploy, rollback drill, or observability proof exists for `864d651a8`

## Ops Remediation Lane

This is now an operations-only lane. Product engineering remains frozen unless a live staging execution exposes a real release-blocking defect.

Execution rule: preserve the evidence order of the lane, but allow prerequisite ops repairs to happen before the live staging deploy when required. Reachability repair and secrets or control-plane repair are dependency work, not scope drift.

### Priority Order

1. Repair staging reachability and control-plane access enough to support a real deploy.
   The staging target must resolve and answer health checks, and the required deployment or observability credentials must be valid before the lane can produce decision-grade evidence.

2. Make the staging deploy real.
   The current release workflow records deployment state, but the staging step in `.github/workflows/release-lane.yml` only echoes the SHA and does not execute a real deployment action.

3. Repair secrets and control-plane access where still unresolved.
   Replace or re-provision `HEROKU_API_KEY`, Grafana host configuration, and any related deployment or observability credentials.

4. Run a live staging deploy against `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`.
   Record deployed SHA, target environment, exact deployment command or workflow path, start and end time, success or failure, and post-deploy health outcome.

5. Run a real rollback drill against the live staging target.
   Record rollback target SHA, trigger method, time to recover, data or config impact, and whether service restoration was clean, partial, or messy.

6. Run observability verification against the deployed staging build.
   Prove logs, metrics, dashboards, and alert paths are functional, and that deployed-version telemetry can be correlated back to `864d651a8`.

7. Reissue the decision memo only after staging deploy, rollback, and observability all pass.
   Until then, protected `main` remains engineering-ready but not production-approved.

## Exit Condition

This lane closes as an evidence refresh plus blocker declaration, not as production approval. Promotion can be reconsidered only after:

1. a real staging deploy of `864d651a8`
2. a real rollback drill from that deployment
3. a real observability verification pass against that deployment
