# Release-Path Verification Report

**Date**: 2026-03-11
**Branch**: `ops/release-path-verification-and-debt-closure`
**Purpose**: Close the last uncrossed go-live prerequisite and non-blocking debt items in `production-readiness-accounting.md`.

---

## 1. Controlled Release-Path Verification

A full deploy → rollback → redeploy cycle was executed against staging using the current `main` HEAD.

### SHA Chain

| Label | SHA |
|-------|-----|
| Release candidate (main HEAD) | `b4a5570ba14908e9282e3e85b5e2bd15ccf62c3c` |
| Pre-existing staging SHA | `134c05cce8dc025f9b8a575a6469da385754cd66` |
| Production SHA (unchanged) | `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` |

### Dispatch Sequence

| Step | Action | Workflow | Target SHA | Run ID | Result |
|------|--------|----------|------------|--------|--------|
| D1 | Deploy to staging | release-lane | `b4a5570ba1` | 22970615572 | SUCCESS |
| D2 | Rollback staging | rollback-staging | (auto: previous.sha) | 22970967062 | SUCCESS |
| D3 | Redeploy to staging | release-lane | `b4a5570ba1` | 22971169413 | SUCCESS |

### Verification After Each Step

**After D1 (deploy)**:
- `GET https://staging.terrafusionmarket.com/health` → HTTP 200
- `X-Release-Sha: b4a5570ba14908e9282e3e85b5e2bd15ccf62c3c`

**After D2 (rollback)**:
- `GET https://staging.terrafusionmarket.com/health` → HTTP 200
- `X-Release-Sha: 134c05cce8dc025f9b8a575a6469da385754cd66`

**After D3 (redeploy)**:
- `GET https://staging.terrafusionmarket.com/health` → HTTP 200
- `X-Release-Sha: b4a5570ba14908e9282e3e85b5e2bd15ccf62c3c`

### Notes

- First redeploy attempt (run 22971030223) was cancelled due to SSH timeout on GH Actions runner — transient networking issue.
- All dispatches used internal GHCR packages (`-internal` suffix).

---

## 2. Infrastructure Probe Validation (Post-PR #692)

Infra-probe workflow was fixed in PR #692 (container name `edge-proxy-edge-1` correction). Both environments probed successfully:

| Target | Run ID | Result |
|--------|--------|--------|
| Staging | 22970478118 | SUCCESS |
| Production | 22970472602 | SUCCESS |

### VPS State (from infra-probe logs)

| Metric | Value |
|--------|-------|
| Containers running | 7 |
| Disk total | 49G |
| Disk used | 28G (57%) |
| Disk available | 22G |
| Memory total | 3.8Gi |
| Memory used | 522Mi |
| Memory available | 2.9Gi |
| Edge network members | edge-proxy-edge-1, terrafusion-production-proxy-1, terrafusion-staging-proxy-1 |

---

## 3. Secrets Scan

Test: `os-platform/core/tests/no-secrets-committed.test.mjs`
Result: **PASS** (1/1)

Manual verification:
- No `.env`, `.key`, or `.pem` files in tracked sources
- No hardcoded credential patterns (`password=`, `secret=`, `apikey=`, `token=`) found
- `kubeconfig.yaml` properly sanitized: `REDACTED_ROTATE_CA_BEFORE_USE`

---

## 4. Deployed-Environment Smoke

Both environments verified healthy during the verification window:

| Environment | Health | SHA | TLS |
|-------------|--------|-----|-----|
| Production | HTTP 200 | `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b` | ACME (Let's Encrypt) |
| Staging | HTTP 200 | varies (deploy/rollback/redeploy cycle) | ACME (Let's Encrypt) |

---

## 5. Observability Drill

### Health-Check Cron
- Workflow: `.github/workflows/health-check.yml`
- Frequency: every 30 minutes (`*/30 * * * *`)
- Recent runs: all 4 most recent runs SUCCESS
- Latest: run 22969724250 at 2026-03-11T19:05Z

### Infra-Probe (on-demand)
- Both staging and production probed successfully post-PR #692 fix
- Container topology, disk, memory, and network confirmed healthy
- See Section 2 above for details

---

## 6. Prometheus/Grafana Resource Assessment

Based on infra-probe data:
- **Disk**: 22G free of 49G — sufficient for Prometheus TSDB (~2GB for 15-day retention with current metrics volume)
- **Memory**: 2.9Gi available — sufficient for Prometheus (~512MB) + Grafana (~256MB) alongside current workload
- **Recommendation**: Prometheus/Grafana can be deployed when needed. No resource blocker.

Assessment only. Deployment deferred to future ops cycle.

---

## 7. Conclusion

All go-live prerequisites are now satisfied:
- Controlled release-path verification: **COMPLETE** (deploy, rollback, redeploy proven)
- Secrets scan: **COMPLETE** (no secrets committed)
- Deployed-environment smoke: **COMPLETE** (both envs healthy)
- Observability drill: **COMPLETE** (health-check cron active, infra-probe validated)

---

**Classification**: Infrastructure Operations
**Government**: FISMA compliance
**AI-Collaboration**: GitHub Copilot (Claude Opus 4.6)
