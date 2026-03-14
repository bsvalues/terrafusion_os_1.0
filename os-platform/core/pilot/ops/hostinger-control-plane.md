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
- Date/time verified: 2026-03-13T03:26Z (Google DNS 8.8.8.8 from local machine)
- Verification method:
  - `Resolve-DnsName staging.terrafusionmarket.com -Server 8.8.8.8` → 72.60.126.11
  - `Resolve-DnsName terrafusionmarket.com -Server 8.8.8.8` → 72.60.126.11

### Required DNS Records
- A: staging -> 72.60.126.11 ✅ verified
- A: @ (root) -> 72.60.126.11 ✅ verified

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

## Runtime Role Decision (2026-03-13)
- Hostinger staging is a Benton operational-snapshot runtime
- Hostinger production is a Benton operational-snapshot runtime
- Neither environment is a PACS-connected sync runtime
- PACS SQL connectivity and PACS-backed sync remain local/canonical or separate infrastructure concerns

## Phase 10 Environment Identity Truth (2026-03-13)
- Staging public `/health` must report `"environment":"Staging"`
- Production public `/health` must report `"environment":"Production"`
- The deploy and rollback workflows are responsible for rewriting the shared runtime compose template so `ASPNETCORE_ENVIRONMENT` matches `TARGET_ENV`
- Environment identity truth is a separate gate from runtime health; `200 OK` is not sufficient if staging labels itself as production
- Staging also requires a mounted valid `/app/appsettings.Staging.json` overlay because the current backend image carries an invalid empty staging config file
- Verified at 2026-03-13T03:42Z:
  - `https://staging.terrafusionmarket.com/health` -> `"environment":"Staging"`
  - `https://terrafusionmarket.com/health` -> `"environment":"Production"`

## Phase 11 Deployment Contract Hardening (2026-03-13)
- Public DNS truth is mandatory for deploy and rollback workflows
- Public `/health` verification must succeed through the real hostname
- IP-resolve fallback is no longer an acceptable success mode in release or rollback verification
- Release and rollback evidence must record `aspnetcoreEnvironment`
- The staging runtime contract includes a mounted valid `/app/appsettings.Staging.json` overlay

## Phase 12 PACS-Connected Runtime Track (2026-03-13)
- PACS-connected runtime remains local/canonical or separate SQL-reachable infrastructure.
- Hostinger staging and production continue to serve Benton operational snapshots only.
- The PACS-connected runtime is responsible for TerraFusionSync conversion and snapshot-source generation.
- Hostinger is responsible for serving promoted Benton operational truth, not live PACS connectivity.

## Phase 13 Snapshot Promotion Spine (2026-03-13)
- The promoted Benton artifact is a logical operational snapshot contract, not raw live PACS state.
- Hostinger staging and production receive promoted Benton operational truth from the PACS-connected runtime track.
- Staging and production should match the promoted Benton snapshot contract even if SQLite file hashes diverge after runtime activity.
- Mutable runtime metadata such as `EtlSyncJobs` is not part of promotion identity.

## Phase 14 Benton Operator Workflow (2026-03-13)
- Staging and production now have authenticated Benton 9-tab workbench proof on the public operator surface.
- Phase 14 operator proof depends on the snapshot runtime serving the promoted Benton contract, not live PACS connectivity.
- The active Benton operator path is validated by local workbench slice tests plus deployed browser proof across the constitutional workbench tabs.

## Phase 15 Data Quality and Operational Completeness (2026-03-13)
- The Benton snapshot runtimes currently carry the same data-quality profile as the canonical local Benton runtime.
- ComparableSales remains structurally valid on staging and production, matching the local Benton snapshot on price/date/type/qualification integrity.
- PACS improvement-level matrices are now converted into TerraFusion `CostMatrices`; Hostinger continues to serve the promoted Benton snapshot rather than talking to PACS directly.
- Phase 15 reached `GO` after the canonical Benton snapshot carried non-empty `CamaCharacteristics` and `CostMatrices`, and comparable sales retained subject-aware enrichment coverage.

## Phase 16 Monitoring, Backup, and Recovery Truth (2026-03-13)
- Snapshot freshness is bounded by the latest completed full Benton sync marker (`CamaCharacteristics,Sales,CostMatrices`) on the canonical local runtime.
- Hostinger staging and production each carry a verified backup-and-restore drill for the promoted Benton snapshot contract.
- Public Benton health remains truthful only when staging reports `Staging`, production reports `Production`, and both surfaces emit a release SHA.
- Phase 16 reaches `GO` only when public health, bounded freshness, and backup/restore truth all pass together.

## Phase 17 Benton Go-Live Decision (2026-03-13)
- The approved go-live scope is the Benton operational-snapshot runtime served from Hostinger staging and production.
- This go-live scope excludes live PACS-connected sync on Hostinger; PACS-connected sync remains a separate canonical runtime role.
- Phase 17 reached `GO` only after Phase 9 through Phase 16 evidence remained green on the active Benton runtime.
- The final go-live packet proves operator workflow, promoted snapshot truth, deployment contract, environment identity, and recovery posture for the current Hostinger runtime role.

## Phase 18 PACS-Connected Runtime Productization (2026-03-13)
- The current productized PACS-connected Benton runtime is the canonical secured workstation/runtime, not Hostinger.
- This runtime remains the source Benton sync and conversion host until a separate PACS-reachable sync host is commissioned.
- Hostinger staging and production remain excluded from live PACS-connected sync responsibilities.

## Phase 19 Snapshot Promotion Automation (2026-03-13)
- The Benton promotion artifact is published to `/opt/terrafusion/promotion-artifacts/<artifactId>/` on the Hostinger VPS.
- The artifact contains the promoted Benton snapshot copy, manifest, manifest checksum, snapshot checksum, and detached local promotion-attestation signature.
- Current automation mode is parity-confirmed no-replace promotion when staging and production already serve the promoted stable contract.
- Promotion receipts are written to `/opt/terrafusion/staging/current-benton-snapshot-promotion.json` and `/opt/terrafusion/production/current-benton-snapshot-promotion.json`.
- Phase 22 will harden signer authority and promotion credentials; Phase 19 establishes the truthful repeatable automation path.

## Phase 20 Benton Acceptance / UAT Packet (2026-03-13)
- The Benton UAT packet is derived from the current technical go-live baseline plus the promoted snapshot contract.
- Technical UAT readiness is automated and must remain reproducible from the current Phase 17 and Phase 19 packets.
- Final Phase 20 `GO` requires an explicit Benton assessor/operator signoff artifact; automation must not infer acceptance from technical evidence alone.
- Until that signoff artifact exists, Phase 20 remains `READY_FOR_SIGNOFF` even when the technical UAT matrix is green.

Current aligned release on both environments:
- SHA: `fcaf281450757307fe43a235e22e9dbd78877e26`
- Backend image: `ghcr.io/bsvalues/terrafusion-os-backend-internal:fcaf281450757307fe43a235e22e9dbd78877e26`
- Frontend image: `ghcr.io/bsvalues/terrafusion-os-frontend-internal:fcaf281450757307fe43a235e22e9dbd78877e26`

Expected sync-runtime truth on Hostinger:
- `/api/TerraFusionSync/status` -> `TotalSystems = 0`, `ActiveCounties = 0`
- `/api/TerraFusionSync/systems` -> `[]`
- `/api/TerraFusionSync/counties` -> `[]`

## Phase 9 Runtime Role Separation Gate (2026-03-12)
- Hostinger remains snapshot-only for both staging and production.
- PACS-connected sync/conversion is not a Hostinger responsibility.
- The canonical PACS-connected runtime remains local/canonical or separate SQL-reachable infrastructure.
- Phase 9 reached `GO` after all of these became true:
  - `proof:phase7` passes
  - `proof:phase8` passes
  - `staging.terrafusionmarket.com` resolves publicly
  - `terrafusionmarket.com` apex resolves publicly
  - production `/health` works without `--resolve`
- Evidence: `os-platform/core/pilot/evidence/phase9-runtime-role-separation.latest.json`

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
- Old public package families DELETED (2026-03-11):
  - ~~`ghcr.io/bsvalues/terrafusion-os-backend`~~ deleted
  - ~~`ghcr.io/bsvalues/terrafusion-os-frontend`~~ deleted
  - ~~`ghcr.io/bsvalues/terrafusion_os_1.0-frontend`~~ deleted
  - ~~`ghcr.io/bsvalues/terrafusion_os_1.0-backend`~~ deleted (confirmed present, then deleted)
  - Anonymous pull verified denied for all
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
- ~~Production SSH fails~~ RESOLVED: v4 key generated on VPS, set via pipe
- ~~GHCR old public package deletion~~ RESOLVED: 4 packages deleted via `gh api -X DELETE` (2026-03-11)
- K3s-style kubeconfig material was removed from the repo tree; ~~cluster trust rotation remains an external infra task if `terrafusion-k8s-api` is still live~~ CLOSED: infra-probe confirmed K3s not installed on VPS
- ~~Staging and production cannot run simultaneously on the same VPS (port 80/443 conflict)~~ RESOLVED: shared edge proxy routes by hostname (PR #684)
- ~~`staging.terrafusionmarket.com` DNS A record missing~~ RESOLVED: A record added at Hostinger (2026-03-11), confirmed resolving to 72.60.126.11 via Google DNS 8.8.8.8. `tls internal` removed from edge proxy Caddyfile; staging now uses ACME (Let's Encrypt).

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

### Staging — Reseed on Internal GHCR (proven 2026-03-11)

| Dispatch | Workflow | SHA | Run ID | Result |
|----------|----------|-----|--------|--------|
| E1 seed deploy | release-lane | 24531f37a9ea785a99c1b7e4e1dd70c294af1a0c | 22949967718 | SUCCESS |
| E2 release deploy | release-lane | 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | 22950463468 | SUCCESS |
| E3 rollback | rollback-staging | (auto: previous.sha) | 22951371572 | SUCCESS |
| E4 redeploy | release-lane | 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | 22951590126 | SUCCESS |

Notes:
- All images pulled from `-internal` GHCR packages (PR #676 cutover)
- Health verified via IP-resolve fallback (staging DNS NXDOMAIN, PR #680)
- Rollback health fix applied via PR #681

### Production (proven 2026-03-11)

| Dispatch | Workflow | SHA | Run ID | Result |
|----------|----------|-----|--------|--------|
| E1 seed deploy | release-lane | 24531f37a9ea785a99c1b7e4e1dd70c294af1a0c | 22952476204 | SUCCESS |
| E2 release deploy | release-lane | 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | 22953010096 | SUCCESS |
| E3 rollback | rollback-production | (auto: previous.sha) | 22953429826 | SUCCESS |
| E4 redeploy | release-lane | 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b | 22953654896 | SUCCESS |

Notes:
- Staging stopped before production E1 to free ports 80/443 (shared VPS)
- Health verified via IP-resolve fallback
- All images pulled from `-internal` GHCR packages

## Production Readiness Posture (2026-03-11)

TerraFusion OS is now **staging-proven, production-proven, and coexistence-proven**
through live deploy, rollback, redeploy, and simultaneous environment operation
on internal GHCR packages behind a shared edge proxy.

All 8 dispatches (4 staging + 4 production) completed successfully.
Both environments verified running simultaneously on the same VPS.

Proven claims:
- GitHub Actions can reach the VPS over SSH (v4 key, port 22)
- GHCR auth and image pull work from VPS (internal packages, workflow-injected token)
- Runtime bundle deployment works (compose up with env-file)
- Health verification works (GET /health, X-Release-Sha header; --resolve fallback for DNS)
- SHA finalization and invariant verification work
- Rollback workflow can restore the prior state
- Redeploy can re-establish the target release after rollback
- Both staging and production environments pass the complete 4-dispatch proof
- Staging and production coexist on the same VPS behind a shared edge proxy (PRs #684-#687)
- Edge proxy routes by hostname: both production and staging via ACME TLS (Let's Encrypt)

Remaining items:
- ~~Delete old public GHCR packages~~ DONE (2026-03-11, anonymous pull confirmed denied)
- ~~Restore `staging.terrafusionmarket.com` DNS A record at Hostinger~~ DONE (2026-03-11, resolves to 72.60.126.11)
- ~~Implement port differentiation or shared proxy for staging/production coexistence~~ DONE (PR #684, shared edge proxy)
- ~~Deploy staging behind edge proxy~~ DONE (PR #686 `tls internal`, PR #687 caddy reload)
- ~~Prove staging + production coexistence~~ DONE (2026-03-11, both 200 OK behind edge proxy)
- ~~K3s trust rotation if cluster is live~~ CLOSED: infra-probe run 22965879505 confirmed K3s NOT installed (which k3s → NOT_FOUND, systemctl → inactive, no K8s ports). No rotation needed.
- ~~Production observability validation~~ CLOSED: health-check cron created (`.github/workflows/health-check.yml`), first run 22965885009 passed (both envs 200 OK)
- ~~Final approval memo from production artifacts~~ See `os-platform/core/pilot/ops/production-approval-memo.md`
- ~~Restore `staging.terrafusionmarket.com` DNS A record at Hostinger~~ DONE (2026-03-11). `tls internal` removed from Caddyfile (ACME will provision real cert on next deploy).

## Shared Edge Proxy Architecture (PR #684)

Staging and production coexist on the same VPS via a shared Caddy edge proxy
that owns host ports 80/443 and routes by hostname.

```
┌─────────────────────────────────────── VPS 72.60.126.11 ──────────────────────────────────┐
│                                                                                           │
│   ┌── Edge Proxy (Caddy) ── ports 80/443 ──┐                                             │
│   │  terrafusionmarket.com        → terrafusion-production-proxy-1:80                     │
│   │  staging.terrafusionmarket.com → terrafusion-staging-proxy-1:80                       │
│   └────────────────────────────────────────┘                                              │
│              │ terrafusion-edge network │                                                  │
│   ┌─────────┴───────────┐   ┌──────────┴──────────┐                                      │
│   │ terrafusion-production │  │ terrafusion-staging  │                                     │
│   │  proxy → backend:5000 │  │  proxy → backend:5000 │                                     │
│   │         frontend:80   │  │         frontend:80   │                                     │
│   └───────────────────────┘  └───────────────────────┘                                    │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

- Edge proxy config: `ops/edge-proxy/Caddyfile` + `ops/edge-proxy/docker-compose.yml`
- Per-env proxy: `ops/proxy/Caddyfile` (listens `:80`, no TLS — edge handles ACME)
- Runtime compose: `ops/prod/runtime-compose.template.yml` (no host ports, joins `terrafusion-edge` network)
- Deployed to: `/opt/terrafusion/edge-proxy/` on VPS
- TLS: Edge Caddy handles ACME for production; staging uses `tls internal` (self-signed) until DNS A record is restored (PR #686)
- Config reload: Bootstrap step runs `caddy reload` after file copy to pick up Caddyfile changes (PR #687)
- Graceful degradation: If one env is down, its route returns 502; the other keeps serving

## Coexistence Evidence (2026-03-11)

Both staging and production run simultaneously behind the shared edge proxy.

### Production (via edge proxy)
- Deploy run: 22960318843 (SHA `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`)
- Health: `GET https://terrafusionmarket.com/health` → HTTP 200
- X-Release-Sha: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
- X-Release-Environment: production
- TLS: ACME (Let's Encrypt) — production DNS resolves

### Staging (via edge proxy)
- Deploy run: 22963702404 (SHA `4a639b5399edf14683157dfae8dd6eaeaae1b7ae`)
- Health: `GET https://staging.terrafusionmarket.com/health` → HTTP 200 (via `--resolve` to `72.60.126.11`)
- X-Release-Sha: `4a639b5399edf14683157dfae8dd6eaeaae1b7ae`
- X-Release-Environment: staging
- X-Release-Deployed-At: 2026-03-11T16:50:07Z
- TLS: internal CA (self-signed) — staging DNS is NXDOMAIN, `tls internal` workaround (PR #686)

### Coexistence Proof
- Both environments verified responding simultaneously at 2026-03-11T16:59Z
- Production curl (direct DNS): HTTP 200 + correct release SHA
- Staging curl (`--resolve` bypass): HTTP 200 + correct release SHA
- Edge proxy routes by hostname; per-env stacks isolated by Docker network
- No port conflicts; edge proxy owns 80/443, per-env stacks have no host bindings

### Fixes Required for Coexistence
| PR | Fix | Why |
|----|-----|-----|
| #684 | Shared edge proxy architecture | Route staging/production by hostname |
| #685 | Graceful edge proxy transition | Stop old port-binding stack before edge proxy bootstrap |
| #686 | `tls internal` for staging | ACME HTTP-01 fails for NXDOMAIN domain |
| #687 | `caddy reload` after file copy | Bind-mount Caddyfile changes invisible to running container |

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

## Production Observability (2026-03-11)

### Automated Health Check
- Workflow: `.github/workflows/health-check.yml`
- Schedule: every 15 minutes (`*/15 * * * *`)
- Checks: Production (must pass) + Staging (informational)
- Method: HTTPS GET `/health` via `--resolve` to `72.60.126.11` (DNS-independent)
- Failure behavior: workflow fails if production returns non-200
- Manual trigger: `gh workflow run health-check.yml` (optional `verbose` flag for full headers)

### Infrastructure Probe
- Workflow: `.github/workflows/infra-probe.yml`
- Trigger: manual dispatch (select environment)
- Probes: K3s/Kubernetes presence, Docker inventory, edge proxy health, disk/memory
- Purpose: one-shot diagnostic for infrastructure state assessment
- PR #692 fix: corrected container name to `edge-proxy-edge-1` (internal health check)
- Post-fix validation (2026-03-11): staging run 22970478118 SUCCESS, production run 22970472602 SUCCESS

### Observability Posture
- **Health monitoring**: Automated via cron health-check workflow (GitHub Actions)
- **Container health**: Docker built-in HEALTHCHECK on backend containers (127.0.0.1:5000/health)
- **Edge proxy**: Caddy access/error logs in container stdout (viewable via `docker logs`)
- **Metrics stack**: `compose/docker-compose.obs.yml` (Prometheus + Grafana) available for dev; NOT wired to production
- **Future**: Prometheus + Grafana on VPS — resource assessment complete (22G disk free, 2.9Gi RAM available — sufficient). Deployment deferred to future ops cycle.

## Notes
- Hostinger MCP is optional discovery only; config is local-only and not committed.
- Production 4-dispatch proof completed 2026-03-11 (see `production-approval-memo.md` Section 3). Staging release-path re-verified 2026-03-11 (PR #693).
- Any credential or secret ever pasted into chat is compromised and must be rotated before use.
- Provider firewall (Hostinger) allows only ports 22, 80, 443. Port 65002 is blocked at provider level.
