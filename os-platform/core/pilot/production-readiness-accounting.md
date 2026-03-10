# Production Readiness Accounting

Date: 2026-03-10 (post-PR #660 — release lane wiring complete)

This is the canonical in-scope production-readiness accounting for the current protected `main` lineage. It supersedes the earlier `24531f37a`-only framing.

It distinguishes:

- `engineering-remediation-baseline`
- `protected-main`
- `bookkeeping-only deployment records`
- `decision-grade operational proof`

This is a release-decision truth pass, not a blanket claim of production approval.

## Current Protected Main Lineage

- Active protected `origin/main`: `b6487a8939648d12f6c1ceca0221ed8c8c40f7a0`
- PR `#660` merged at: 2026-03-10 (ops: canonical release lane wiring)
- PR `#660` merge commit: `b6487a8939648d12f6c1ceca0221ed8c8c40f7a0`
- PR `#660` scope: release-lane.yml, rollback-staging.yml, runtime bundle, Hostinger truth surface
- Protected release candidate: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` (PR #659)
- Engineering remediation baseline from PR `#656`: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`
- PR `#656` merged at: `2026-03-10T13:55:35Z`
- PR `#659` merged at: `2026-03-10T14:18:33Z`
- PR `#659` head commit: `a042ce6506f03732493d7b18f3e7d2f0034a5e28`
- PR `#659` merge commit: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
- PR `#659` touched only `os-platform/core/pilot/production-readiness-accounting.md`

`864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` remains the authoritative release baseline (PR #660 adds deployment tooling, not product code).

## Lineage Truth Map

| Commit | State | Evidence-backed claim |
| --- | --- | --- |
| `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c` | prior protected main, PR `#656` merge baseline | governed engineering remediation baseline |
| `a042ce6506f03732493d7b18f3e7d2f0034a5e28` | PR `#659` head | documentation-only accounting publication |
| `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` | PR `#659` merge | authoritative release baseline |
| `b6487a8939648d12f6c1ceca0221ed8c8c40f7a0` | current protected main, PR `#660` merge | release lane wiring (ops-only, no product code) |

## Commands Executed For This Refresh

Protected-main proof was refreshed from a clean detached worktree pinned to `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` at `C:\Users\bsval\terrafusion_os_1.0__ops_864`.

| Command | Result |
| --- | --- |
| `git ls-remote origin refs/heads/main` | PASS, resolved `origin/main` to `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` |
| `gh pr view 659 --json number,title,mergedAt,mergeCommit,headRefOid,files` | PASS, PR `#659` merged at `2026-03-10T14:18:33Z`; single-file docs-only change |
| `gh api repos/bsvalues/terrafusion_os_1.0/branches/main/protection` | PASS, verified required branch-protection checks, strict mode, and admin enforcement |
| `gh api repos/bsvalues/terrafusion_os_1.0/commits/864d651a8b49ec1b2dc2cbca137091dbc1c3b29b/check-runs` | PASS, verified required checks green on protected SHA |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run type-check` | PASS |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | PASS `32/32` |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | PASS `20/20` |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | PASS `7/7` |
| `pnpm run check:generated` | PASS |
| `gh api repos/bsvalues/terrafusion_os_1.0/deployments?sha=864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` | PASS, found GitHub deployment records for `dev`, `staging`, and `production` |
| `Invoke-WebRequest https://terrafusion-backend-staging.azurecontainerapps.io/health` | FAIL, DNS resolution failed (`No such host is known`) |
| `Invoke-WebRequest https://terrafusion-frontend-staging.azurecontainerapps.io/health` | FAIL, DNS resolution failed (`No such host is known`) |
| Heroku MCP `list_apps --all` | BLOCKED, `HEROKU_API_KEY` invalid |
| Grafana MCP `list_datasources`, `search_dashboards`, `list_alert_rules` | BLOCKED, configured host invalid (`http: no Host in request URL`) |

## Required Checks On The Protected SHA

The protected `main` branch requires:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

Those required checks are green on protected SHA `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`.

## Evidence Freshness Conclusion

- The engineering readiness proven at `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c` carries forward to `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` because PR `#659` is documentation-only and no product code changed between those SHAs.
- The current protected baseline has been revalidated in a clean worktree with `type-check`, `phase83`, `phase85`, `phase86`, and `check:generated`.
- This document is the canonical in-scope SHA refresh for the governed surface.
- Out-of-scope evidence artifacts outside the core governance surface were not edited in this pass.

## Operational Execution Status

### 0. Release Lane Wiring (NEW — PR #660)

- PR #660 merged to main at `b6487a893…`
- `release-lane.yml`: canonical workflow_dispatch with `target_env` + `release_sha` inputs
- `rollback-staging.yml`: canonical workflow_dispatch, reads `current.sha`/`previous.sha` from VPS
- Workflows consume GitHub environment variables: `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `PUBLIC_URL`, `APP_ROOT` + secret `DEPLOY_SSH_KEY`
- Runtime bundle, SSH preflight, DNS check, health probe, evidence artifact upload — all wired
- Status: **pass** (repo-side complete)

### 1. Staging Deploy

- GitHub recorded staging deployment `4029987833` from `2026-03-10T14:19:35Z` to `2026-03-10T14:19:44Z`.
- That record is not decision-grade staging proof. The earlier release-lane.yml only echoed the SHA.
- PR #660 replaced that with a real VPS deployment workflow, but it has not yet been dispatched.
- **Remaining external blockers** (see `hostinger-control-plane.md` for full operator checklist):
  1. Rotate compromised credentials (VPS root pw, deploy SSH keypair, GitHub DEPLOY_SSH_KEY, VPS app.env secrets, GHCR login)
  2. Normalize VPS layout to `/opt/terrafusion/staging/app.env` with `deploy:deploy` and `600`
  3. Set GitHub `staging` environment vars/secrets to canonical names
  4. Execute DNS sanity check (staging.terrafusionmarket.com → 72.60.126.11)
  5. Run 4-dispatch proof sequence: seed (24531f37a…), deploy (864d651a8…), rollback, redeploy
- Result: `blocked-on-external-ops`

### 2. Rollback Drill

- No real staging deployment target was available to roll back.
- `rollback-staging.yml` is now wired and ready but requires a prior successful deploy to create `current.sha`/`previous.sha`.
- Result: `blocked-on-staging-deploy`

### 3. Observability Verification

- Health endpoints for the guessed staging hosts were not reachable (Azure DNS failed).
- PR #660 targets Hostinger VPS at 72.60.126.11, not Azure Container Apps.
- Heroku control-plane access is blocked by an invalid token.
- Grafana control-plane access is blocked by an invalid host configuration.
- Logs, metrics, alerts, dashboards, and deployed-version visibility were not proven for a live `864d651a8` environment.
- Result: `blocked-on-staging-deploy`

## Final Release Memo

- Protected main: `b6487a8939648d12f6c1ceca0221ed8c8c40f7a0` (PR #660, lane wiring)
- Release candidate: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` (PR #659)
- Engineering remediation baseline: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c` (PR #656)
- Accounting published: `yes`, via PR #659, updated post-PR #660
- Release lane wiring: `pass` (repo-side complete, PR #660)
- Staging deploy: `blocked-on-external-ops`
- Rollback verification: `blocked-on-staging-deploy`
- Observability verification: `blocked-on-staging-deploy`
- Decision: `not approved`
- Reason: release lane tooling is complete; external ops (credential rotation, VPS normalization, GitHub env config, 4-dispatch proof sequence) must be executed before decision-grade staging proof exists

## Release Recommendation

- Release-decision ready: `no`
- Deploy-to-production ready: `no`
- Repo-side release lane: `ready` (PR #660)
- Critical path: rotate deploy SSH key (A2) → normalize VPS (B) → set GitHub env (C) → DNS check (D) → execute 4 dispatches (E)
- Final recommendation: `do not promote beyond protected main until external ops closure completes and 4-dispatch proof sequence passes`
