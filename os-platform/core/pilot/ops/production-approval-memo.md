# TerraFusion OS 1.0 — Production Approval Memo

**Date**: 2026-03-11  
**Prepared by**: Ops Automation (AI-Collaboration)  
**Authoritative reference**: `os-platform/core/pilot/ops/hostinger-control-plane.md`

---

## Executive Summary

TerraFusion OS 1.0 is **staging-proven, production-proven, and coexistence-proven**
on private internal GHCR packages behind a shared edge proxy. All deploy, rollback,
and redeploy operations have been verified through live dispatches against the
Hostinger VPS (`srv1479342`, `72.60.126.11`).

---

## 1. Repository Security

| Control | Status | Evidence |
|---------|--------|----------|
| Repository visibility | Private | GitHub settings, 2026-03-11 |
| GHCR packages | `-internal` suffix, private | PR #676 cutover |
| Old public GHCR packages | Deleted | `gh api -X DELETE` confirmed, anonymous pull denied |
| SSH deploy key | v4 ed25519, per-environment | Fingerprint `SHA256:KzPSUPMKf+P/oX83Z8PyPZpcqGp6eBBkIlfJSHgeaF0` |
| Kubeconfig material | Sanitized | `.ai/core/kubeconfig.yaml` — all credentials `REDACTED_ROTATE_CA_BEFORE_USE` |
| Unretractable fork | `startgis/terrafusion_os_1.0` | Known; no secrets committed post-awareness |

## 2. Staging Proof (4-Dispatch Sequence)

All runs on internal GHCR packages (post-cutover reseed):

| Step | Workflow | SHA | Run ID | Result |
|------|----------|-----|--------|--------|
| E1 seed | release-lane | `24531f37a9ea` | 22949967718 | ✅ SUCCESS |
| E2 release | release-lane | `864d651a8b49` | 22950463468 | ✅ SUCCESS |
| E3 rollback | rollback-staging | auto | 22951371572 | ✅ SUCCESS |
| E4 redeploy | release-lane | `864d651a8b49` | 22951590126 | ✅ SUCCESS |

## 3. Production Proof (4-Dispatch Sequence)

| Step | Workflow | SHA | Run ID | Result |
|------|----------|-----|--------|--------|
| E1 seed | release-lane | `24531f37a9ea` | 22952476204 | ✅ SUCCESS |
| E2 release | release-lane | `864d651a8b49` | 22953010096 | ✅ SUCCESS |
| E3 rollback | rollback-production | auto | 22953429826 | ✅ SUCCESS |
| E4 redeploy | release-lane | `864d651a8b49` | 22953654896 | ✅ SUCCESS |

## 4. Coexistence Proof

Both environments running simultaneously behind shared edge proxy (2026-03-11T16:59Z):

| Environment | Health | SHA | TLS |
|-------------|--------|-----|-----|
| Production | HTTP 200 | `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` | ACME (Let's Encrypt) |
| Staging | HTTP 200 | `4a639b5399edf14683157dfae8dd6eaeaae1b7ae` | Internal CA (self-signed) |

- Edge proxy: Caddy 2.8-alpine at `/opt/terrafusion/edge-proxy/`
- Network isolation: `terrafusion-edge` Docker network, per-env stacks have no host port bindings
- Architecture PRs: #684 (edge proxy), #685 (graceful transition), #686 (`tls internal`), #687 (caddy reload)

## 5. Health Monitoring

| Signal | Method | Frequency |
|--------|--------|-----------|
| Production health | `.github/workflows/health-check.yml` | Every 15 min (cron) |
| Staging health | Same workflow | Every 15 min (informational) |
| Container health | Docker HEALTHCHECK (`127.0.0.1:5000/health`) | Per Docker policy |
| Edge proxy logs | Caddy container stdout | Continuous |
| Infrastructure probe | `.github/workflows/infra-probe.yml` | Manual dispatch |

## 6. Infrastructure Summary

| Component | Detail |
|-----------|--------|
| VPS | Ubuntu 22.04 LTS, srv1479342 |
| Docker | 29.3.0 + Compose v5.1.0 |
| Edge proxy | Caddy 2.8-alpine, owns :80/:443 |
| Production APP_ROOT | `/opt/terrafusion/production` |
| Staging APP_ROOT | `/opt/terrafusion/staging` |
| Edge proxy path | `/opt/terrafusion/edge-proxy/` |
| Firewall | ufw: 22/tcp, 80/tcp, 443/tcp |
| DNS | `terrafusionmarket.com` → 72.60.126.11 |

## 7. Infrastructure Fix Chronicle

### Workflow & SSH (PRs #660–#671)

| PR | Fix |
|----|-----|
| #660–#663 | Workflow scaffolding, SSH config |
| #664 | SSH keyscan retry + accept-new fallback |
| #665 | Backend Dockerfile project-level restore |
| #666 | Frontend Dockerfile COPY packages/ |
| #667 | GHCR packages:read permission |
| #668 | Alpine HEALTHCHECK 127.0.0.1 |
| #669 | SSH docker login: remove cat pipe |
| #670 | Health check: GET instead of HEAD |
| #671 | Evidence collection: add --env-file |

### Security & Cutover (PRs #676–#683)

| PR | Fix |
|----|-----|
| #676 | GHCR cutover to `-internal` packages |
| #677 | DNS preflight non-fatal |
| #680 | Health check DNS fallback (release-lane) |
| #681 | Health check DNS fallback (rollback) |
| #682 | 8-dispatch evidence recording |
| #683 | GHCR public package deletion evidence |

### Coexistence (PRs #684–#688)

| PR | Fix |
|----|-----|
| #684 | Shared edge proxy architecture |
| #685 | Graceful edge proxy transition |
| #686 | `tls internal` for staging |
| #687 | `caddy reload` after file copy |
| #688 | Coexistence evidence documentation |

## 8. Outstanding Items

| Item | Status | Owner |
|------|--------|-------|
| Staging DNS A record | Pending | Manual (Hostinger) |
| K3s cluster presence | Probe workflow ready | Dispatch `infra-probe.yml` |
| Remove `tls internal` | Blocked on DNS | Automated after DNS restored |
| Prometheus/Grafana on VPS | Future | Pending resource assessment |

## 9. Proven Claims

- [x] GitHub Actions can reach VPS over SSH (v4 ed25519 key)
- [x] GHCR auth and image pull work from VPS (internal packages, workflow-injected token)
- [x] Runtime bundle deployment works (compose up with env-file)
- [x] Health verification works (GET /health, X-Release-Sha header)
- [x] SHA finalization and invariant verification work
- [x] Rollback workflow restores prior state
- [x] Redeploy re-establishes target release after rollback
- [x] Both environments pass complete 4-dispatch proof
- [x] Staging and production coexist behind shared edge proxy
- [x] Automated health monitoring runs every 15 minutes
- [x] Infrastructure probe available for on-demand diagnostics

---

**Classification**: Infrastructure Operations  
**Government**: FISMA compliance  
**AI-Collaboration**: GitHub Copilot (Claude Opus 4.6)
