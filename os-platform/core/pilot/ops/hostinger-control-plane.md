# Hostinger Control Plane — External Infra Truth Surface

## Purpose

Record the authoritative external infrastructure state required to close the ops/evidence lane for TerraFusion OS 1.0.

This document contains **no secrets**. Store secrets only in:
- Hostinger account vault / password manager
- VPS-local `/opt/terrafusion/<env>/app.env`
- GitHub Environment Secrets

## Current State (as of 2026-03-10)

- `origin/main`: `b6487a8939648d12f6c1ceca0221ed8c8c40f7a0` (PR #660 merged)
- Repo-side release lane wiring: **complete** (release-lane.yml + rollback-staging.yml canonical)
- Remaining blockers: **external ops only** (credential rotation, VPS normalization, GitHub env config, dispatch execution)

## Canonical Baselines

- Protected main (lane wiring): `b6487a893…` (PR #660)
- Release candidate: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` (PR #659)
- Engineering remediation baseline: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c` (PR #656)

## Domains (Authoritative)

- Staging: https://staging.terrafusionmarket.com
- Production: https://terrafusionmarket.com

## DNS Control Plane

- DNS provider for terrafusionmarket.com: (Hostinger / Cloudflare / other)
- Date/time verified: (pending — execute `nslookup staging.terrafusionmarket.com` before dispatch)
- Verification method: nslookup/dig from local machine
- Required result: staging.terrafusionmarket.com → 72.60.126.11

### Required DNS Records

- A: staging → 72.60.126.11
- A: @ (root) → (defer until production provisioning)

## Staging VPS (Hostinger)

- VPS name/id: (from Hostinger panel)
- IPv4: 72.60.126.11
- OS: Ubuntu 22.04 LTS
- Provider firewall open: 22/tcp, 80/tcp, 443/tcp
- Server firewall (ufw) open: 22/tcp, 80/tcp, 443/tcp
- APP_ROOT: /opt/terrafusion/staging
- Deploy user: deploy
- Secrets file: /opt/terrafusion/staging/app.env (deploy:deploy, 600)

## Production VPS (Hostinger)

- VPS name/id: (not yet provisioned)
- IPv4: (pending)
- OS: Ubuntu 22.04 LTS
- APP_ROOT: /opt/terrafusion/production

## GHCR Pull Auth (Staging)

- Configured on VPS (deploy user): pending rotation
- Method: `docker login ghcr.io` with read:packages token
- Date/time verified: (pending)

## GHCR Pull Auth (Production)

- Configured on VPS (deploy user): not yet provisioned
- Date/time verified: (pending)

## GitHub Environments

### staging

Variables:
- DEPLOY_HOST = 72.60.126.11
- DEPLOY_PORT = 22
- DEPLOY_USER = deploy
- PUBLIC_URL = https://staging.terrafusionmarket.com
- APP_ROOT = /opt/terrafusion/staging

Secrets:
- DEPLOY_SSH_KEY = (stored in GitHub only — must be rotated to new ed25519 key)

### production

Variables:
- DEPLOY_HOST = (pending)
- DEPLOY_PORT = 22
- DEPLOY_USER = deploy
- PUBLIC_URL = https://terrafusionmarket.com
- APP_ROOT = /opt/terrafusion/production

Secrets:
- DEPLOY_SSH_KEY = (stored in GitHub only)

---

## Operator Checklist (External Ops Closure)

### Absolute Rules

- **Do not paste any secrets into chat** (passwords, private keys, JWT, DB passwords, PATs).
- If a secret was pasted anywhere earlier, treat it as compromised and rotate.

### A) Rotate Compromised Staging Credentials

#### A1) Rotate VPS root password

```bash
ssh root@72.60.126.11
passwd
```

#### A2) Rotate deploy SSH keypair (critical path — everything else depends on this)

```bash
# Generate new key locally
ssh-keygen -t ed25519 -C "terrafusion-staging-deploy-2026-03-10" -f tf_staging_deploy_key_v2

# Install public key on VPS for deploy user
ssh root@72.60.126.11 "mkdir -p /home/deploy/.ssh && cat >> /home/deploy/.ssh/authorized_keys" < tf_staging_deploy_key_v2.pub
ssh root@72.60.126.11 "chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys"

# Remove old keys (edit and delete compromised entries)
ssh root@72.60.126.11 "nano /home/deploy/.ssh/authorized_keys"

# Test
ssh -i tf_staging_deploy_key_v2 deploy@72.60.126.11 "whoami"
# Must return: deploy
```

- Status: (pending)
- Date/time completed: (pending)

#### A3) Update GitHub staging secret DEPLOY_SSH_KEY

GitHub repo → Settings → Environments → staging → Secrets → Update `DEPLOY_SSH_KEY` with private key contents of `tf_staging_deploy_key_v2`.

- Status: (pending)

#### A4) Rotate VPS-local app secrets

```bash
ssh -i tf_staging_deploy_key_v2 deploy@72.60.126.11
nano /opt/terrafusion/staging/app.env
# Replace: JWT_SECRET, DB_PASSWORD, any other compromised secrets
chmod 600 /opt/terrafusion/staging/app.env
```

- Status: (pending)

#### A5) Re-authenticate GHCR on VPS

```bash
docker logout ghcr.io || true
docker login ghcr.io -u <GITHUB_USERNAME>
# Use token with read:packages scope
```

- Status: (pending)

### B) Normalize VPS to Canonical Lane Layout

Target state: `APP_ROOT=/opt/terrafusion/staging`, secrets at `app.env`, owned by `deploy:deploy`, perms `600`.

```bash
ssh root@72.60.126.11
mkdir -p /opt/terrafusion/staging
chown -R deploy:deploy /opt/terrafusion

# Move secrets if Copilot created them elsewhere
mv /opt/terrafusion/.env /opt/terrafusion/staging/app.env 2>/dev/null || true
chown deploy:deploy /opt/terrafusion/staging/app.env 2>/dev/null || true
chmod 600 /opt/terrafusion/staging/app.env 2>/dev/null || true
```

Verify:

```bash
ssh -i tf_staging_deploy_key_v2 deploy@72.60.126.11 "ls -la /opt/terrafusion/staging && stat -c '%U %G %a %n' /opt/terrafusion/staging/app.env"
# Expected: deploy deploy 600 /opt/terrafusion/staging/app.env
```

- Status: (pending)

### C) Set GitHub Staging Environment Variables/Secrets

GitHub repo → Settings → Environments → staging:

| Type | Name | Value |
|------|------|-------|
| Variable | DEPLOY_HOST | 72.60.126.11 |
| Variable | DEPLOY_PORT | 22 |
| Variable | DEPLOY_USER | deploy |
| Variable | PUBLIC_URL | https://staging.terrafusionmarket.com |
| Variable | APP_ROOT | /opt/terrafusion/staging |
| Secret | DEPLOY_SSH_KEY | (private key of tf_staging_deploy_key_v2) |

Ignore any `STAGING_*` values; they are non-authoritative.

- Status: (pending)

### D) DNS Sanity Check (must pass before dispatch)

```bash
nslookup staging.terrafusionmarket.com
# Must resolve to 72.60.126.11
```

- Status: (pending)
- Resolved to: (pending)

### E) Staging Proof Sequence (4 Dispatches)

#### E1) Seed staging baseline (remediation SHA)

- Workflow: `release-lane`
- Inputs: `target_env=staging`, `release_sha=24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`
- Status: (pending)
- Artifact: (pending)
- Health: (pending)
- X-Release-Sha: (pending)

#### E2) Deploy proof SHA (release candidate)

- Workflow: `release-lane`
- Inputs: `target_env=staging`, `release_sha=864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
- Status: (pending)
- Artifact: (pending)
- Health: (pending)
- X-Release-Sha: (pending)

#### E3) Rollback drill

- Workflow: `rollback-staging` (no inputs)
- Status: (pending)
- Artifact: (pending)
- Health: (pending)
- X-Release-Sha after rollback: (pending — must show 24531f37a…)

#### E4) Redeploy proof SHA

- Workflow: `release-lane`
- Inputs: `target_env=staging`, `release_sha=864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
- Status: (pending)
- Artifact: (pending)
- Health: (pending)
- X-Release-Sha: (pending)

#### Pass Criteria

- `/health` returns HTTP 200
- `X-Release-Sha` header matches requested SHA
- Evidence pack contains required schema files and logs

### F) Evidence Refresh (only after artifacts exist)

After all 4 staging artifacts exist, update from receipts only (not from memory):

- [ ] This document (IP, DNS timestamp, artifact names/links)
- [ ] `production-readiness-accounting.md` (staging deploy/rollback/observability → pass)
- [ ] Create `ops-evidence-lane-report.md` if needed

### G) Production (deferred — do not start until staging passes)

After staging proof sequence passes:
1. Provision production VPS
2. Set GitHub `production` environment with same variable names
3. Run `release-lane` once for `864d651a8…`
4. Verify health + X-Release-Sha
5. Update this document and production-readiness-accounting.md

---

## Lane Closure Evidence Index

- Deploy seed 24531f37a… artifact: (pending E1)
- Deploy 864d651a8… artifact: (pending E2)
- Rollback artifact: (pending E3)
- Redeploy 864d651a8… artifact: (pending E4)
- Production deploy 864d651a8… artifact: (deferred to G)

## Notes

- Hostinger MCP is optional discovery only; config is local-only and not committed.
- Production is not approved until staging deploy + rollback + observability proofs exist.
- Any credential or secret ever pasted into chat is compromised and must be rotated before use.
- `origin/main` advanced to `b6487a893…` via PR #660 (lane wiring). Release proofs still target `24531f37a…` then `864d651a8…` via `release_sha` input.
- Fastest next step: **A2 (rotate deploy SSH key)** — everything else depends on a clean, working deploy key.
