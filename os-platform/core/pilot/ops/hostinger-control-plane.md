# Hostinger Control Plane -- External Infra Truth Surface

## Purpose
Record the authoritative external infrastructure state required to close the ops/evidence lane for TerraFusion OS 1.0.

This document contains **no secrets**. Store secrets only in:
- Hostinger account vault / password manager
- VPS-local `/opt/terrafusion/<env>/app.env`
- GitHub Environment Secrets

## Canonical Baselines
- Protected main (release candidate): 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b
- Engineering remediation baseline: 24531f37a9ea785a99c1b7e4e1dd70c294af1a0c

## Domains (Authoritative)
- Staging: https://staging.terrafusionmarket.com
- Production: https://terrafusionmarket.com

## DNS Control Plane
- DNS provider for terrafusionmarket.com: Hostinger
- Date/time verified: 2026-03-10T19:00Z (nslookup from local machine)
- Verification method: `nslookup staging.terrafusionmarket.com` → 72.60.126.11

### Required DNS Records
- A: staging -> 72.60.126.11 ✅ verified
- A: @ (root) -> 72.60.126.11 ✅ verified (2026-03-11, Google DNS 8.8.8.8 confirms single A record)

## Staging VPS (Hostinger)
- VPS name/id: srv1479342
- IPv4: 72.60.126.11
- OS: Ubuntu 22.04 LTS
- Provider firewall open: 22/tcp, 80/tcp, 443/tcp
- Server firewall (ufw) open: 22/tcp, 80/tcp, 443/tcp
- APP_ROOT: /opt/terrafusion/staging

## Production VPS (Hostinger) — SAME BOX as staging
- VPS name/id: srv1479342 (shared with staging)
- IPv4: 72.60.126.11
- OS: Ubuntu 22.04 LTS
- Provider firewall open: 22/tcp, 80/tcp, 443/tcp
- Server firewall (ufw) open: 22/tcp, 80/tcp, 443/tcp
- APP_ROOT: /opt/terrafusion/production

## GHCR Pull Auth (Staging)
- Configured on VPS (deploy user): yes (workflow-injected per-run token)
- Method: `printf TOKEN | ssh ... docker login ghcr.io --password-stdin` (no persistent credential)
- Date/time verified: 2026-03-11T00:28Z (E1 run 22931357865 GHCR pull step)

## GHCR Pull Auth (Production)
- Configured on VPS (deploy user): yes/no
- Method: `docker login ghcr.io` with least-privilege token
- Date/time verified: (UTC)

## GitHub Environments
### staging
Variables:
- DEPLOY_HOST = 72.60.126.11
- DEPLOY_PORT = 22
- DEPLOY_USER = deploy
- PUBLIC_URL = https://staging.terrafusionmarket.com
- APP_ROOT = /opt/terrafusion/staging

Secrets:
- DEPLOY_SSH_KEY = (stored in GitHub only)

### production
Variables:
- DEPLOY_HOST = 72.60.126.11
- DEPLOY_PORT = 22
- DEPLOY_USER = deploy
- PUBLIC_URL = https://terrafusionmarket.com
- APP_ROOT = /opt/terrafusion/production

Secrets:
- DEPLOY_SSH_KEY = (stored in GitHub only)

## Public-Exposure Remediation Status (2026-03-11)

### GitHub Containment
- Repository visibility: private as of 2026-03-11
- Existing public fork remains unretractable: `startgis/terrafusion_os_1.0`
- Secret scanning: unavailable on current repo/account plan

### GHCR Cutover Contract
- Old public package families must be deleted only after private reseed succeeds:
  - `ghcr.io/bsvalues/terrafusion-os-backend`
  - `ghcr.io/bsvalues/terrafusion-os-frontend`
  - `ghcr.io/bsvalues/terrafusion_os_1.0-frontend`
  - inspect for `ghcr.io/bsvalues/terrafusion_os_1.0-backend` and delete if present
- New internal package families wired in workflows:
  - `ghcr.io/bsvalues/terrafusion-os-backend-internal`
  - `ghcr.io/bsvalues/terrafusion-os-frontend-internal`
  - `ghcr.io/bsvalues/terrafusion-os-slsa-backend-internal`
  - `ghcr.io/bsvalues/terrafusion-os-slsa-frontend-internal`
  - `ghcr.io/bsvalues/terrafusion-api-internal`
  - `ghcr.io/bsvalues/terrafusion-os-prod-api-internal`
  - `ghcr.io/bsvalues/terrafusion-os-prod-frontend-internal`
  - `ghcr.io/bsvalues/terrafusion-os-prod-ai-swarm-internal`

### Required Operational Sequence
1. Merge the workflow-only cutover PR so no workflow publishes to old public package names.
2. Reseed staging on the new internal packages:
   - `release-lane` staging @ `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`
   - `release-lane` staging @ `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
   - `rollback-staging`
   - `release-lane` staging @ `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
3. Confirm new packages are private and accessible to Actions plus the VPS `deploy` user.
4. Delete the old public GHCR packages and confirm anonymous pull now fails.
5. Replace `DEPLOY_SSH_KEY` for both `staging` and `production` with one fresh unencrypted `ed25519` key for `deploy@72.60.126.11`.
6. Prove the same four-run sequence against `production`.

### Active Blockers
- Production SSH currently fails before deploy with `Load key \"/home/runner/.ssh/id_ed25519\": error in libcrypto`
- GHCR package administration still requires UI or a token with package admin scope
- K3s-style kubeconfig material was removed from the repo tree, but cluster trust rotation remains an external infra task if `terrafusion-k8s-api` is still live

## Lane Closure Evidence Index

### Staging (proven 2026-03-11)

| Dispatch | Workflow | SHA | Run ID | Artifact | Result |
|----------|----------|-----|--------|----------|--------|
| E1 seed deploy | release-lane | 24531f37a9ea785a99c1b7e4e1dd70c294af1a0c | 22931357865 | evidence-staging-24531f37a9ea785a99c1b7e4e1dd70c294af1a0c | SUCCESS |
| E2 release deploy | release-lane | 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | 22931562617 | evidence-staging-864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | SUCCESS |
| E3 rollback | rollback-staging | (auto: previous.sha → 24531f3) | 22931846631 | (rollback evidence artifact) | SUCCESS |
| E4 redeploy | release-lane | 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | 22932003077 | evidence-staging-864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | SUCCESS |

SHA chain verified on VPS after E4:
- current.sha = 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b
- requested.sha = 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b
- previous.sha = 24531f37a9ea785a99c1b7e4e1dd70c294af1a0c

PR #671 (evidence env-file fix) merged at 2026-03-11T00:50:36Z.
All 4 successful runs occurred after that merge (E1 created at 00:53:49Z).
Evidence collection succeeded in all runs.

### Production (pending)
- Production deploy 864d651a8... artifact: (not yet dispatched)
- Production rollback artifact: (not yet dispatched)

## Staging Readiness Posture (2026-03-11)

TerraFusion on protected `main` is engineering-ready, governance-ready, and now
staging-proven through live deploy, rollback, and redeploy evidence.

Proven claims:
- GitHub Actions can reach the staging host over SSH (port 22)
- GHCR auth and image pull work from the VPS (workflow-injected token)
- Runtime bundle deployment works (compose up with env-file)
- Health verification works (GET /health, X-Release-Sha header)
- SHA finalization and invariant verification work
- Rollback workflow can restore the prior state
- Redeploy can re-establish the target release after rollback

Remaining blockers are **production-only**:
- Production VPS not yet provisioned/verified
- Production secrets/config not yet wired
- Production observability not yet validated
- Production rollback not yet validated
- Final approval memo not yet reissued from production artifacts

## Infrastructure Fixes (PRs #660–#671)

| PR | Fix | Proven by |
|----|-----|-----------|
| #660–#663 | Workflow scaffolding, SSH config | E1 attempts 1–4 |
| #664 | SSH keyscan retry + accept-new fallback | E1 attempt 5+ |
| #665 | Backend Dockerfile project-level restore | E1 attempt 5+ |
| #666 | Frontend Dockerfile COPY packages/ | E1 attempt 5+ |
| #667 | GHCR packages:read permission | E1 attempt 5+ |
| #668 | Alpine HEALTHCHECK 127.0.0.1 (not localhost) | E1 attempt 6+ |
| #669 | SSH docker login: remove cat pipe, add newline | E1 attempt 6+ |
| #670 | Health check: GET instead of HEAD (ASP.NET 405) | E1 attempt 8+ |
| #671 | Evidence collection: add --env-file release.env | E1 attempt 9 (first full green) |

## Notes
- Hostinger MCP is optional discovery only; config is local-only and not committed.
- Production is not approved until the same live proof sequence is completed against the production target.
- Any credential or secret ever pasted into chat is compromised and must be rotated before use.
- Provider firewall (Hostinger) allows only ports 22, 80, 443. Port 65002 is blocked at provider level.
