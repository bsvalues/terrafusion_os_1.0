# TerraFusion OS — Production Cutover Runbook

> **Classification:** Government Operations — FISMA-HIGH  
> **Approval Required:** Platform Lead + County Coordinator  
> **Last Updated:** Phase 7 — Production Cutover Safety

---

## 1. Pre-Cutover Checklist

### 1.1 Version Pinning

- [ ] All container image tags use immutable digests (`sha256:...`), not `:latest`
- [ ] ArgoCD applications target a specific Git commit SHA, not a branch
- [ ] `platform.json` version field matches the release tag
- [ ] Helm chart versions (if used) are pinned in ArgoCD Application spec

### 1.2 Migration Compatibility

- [ ] Database migration is backward-compatible (expand-contract if schema change)
- [ ] EF Core migration tested: `dotnet ef migrations script` reviewed for destructive DDL
- [ ] No `DROP COLUMN` or `DROP TABLE` in the migration (use deprecation cycle)
- [ ] Migration can run while current version is still serving traffic (zero-downtime)

### 1.3 Configuration Validation

- [ ] All `REPLACE_*` markers in K8s Secrets have been substituted
- [ ] No `Development`-mode flags in production appsettings
- [ ] TLS certificate is valid and issued by cert-manager (`letsencrypt-prod` issuer)
- [ ] DNS CNAME/A records point to the correct Ingress IP

### 1.4 Gate Status

All gates must be green before cutover proceeds:

```bash
node tools/gates/config-schema-gate.mjs        # Phase 6.1
node tools/gates/deploy-manifest-validate.mjs   # Phase 6.2
node tools/gates/write-lane-rbac-gate.mjs       # Phase 6.3
node tools/gates/deploy-smoke-gate.mjs          # Phase 6.4
node tools/gates/release-evidence-gate.mjs      # Phase 6.5
node tools/gates/slo-gate.mjs                   # Phase 7.3
node tools/gates/dr-gate.mjs                    # Phase 7.4
node tools/gates/cutover-gate.mjs               # Phase 7.5
node tools/gates/trace-coverage-gate.mjs        # Phase 7.6
```

---

## 2. Cutover Procedure

### 2.1 Announce Maintenance Window

1. Notify county stakeholders ≥ 24 h in advance.
2. Post to `#terrafusion-ops` Slack channel.
3. Set Grafana annotation for maintenance start.

### 2.2 Database Migration

```bash
# 1. Take pre-migration backup
ops/scripts/backup_sovereign.ps1

# 2. Run migration (idempotent)
dotnet ef database update \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --connection "$PRODUCTION_CONNECTION_STRING"

# 3. Verify migration applied
dotnet ef migrations list \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API
```

### 2.3 ArgoCD Sync

```bash
# Trigger sync for each application in wave order
argocd app sync terrafusion-api-prod          --revision <GIT_SHA>
argocd app sync terrafusion-gateway-prod      --revision <GIT_SHA>
argocd app sync terrafusion-consciousness-prod --revision <GIT_SHA>
argocd app sync terrafusion-operations-prod   --revision <GIT_SHA>

# Wait for healthy status
argocd app wait terrafusion-api-prod --health --timeout 300
argocd app wait terrafusion-gateway-prod --health --timeout 300
argocd app wait terrafusion-consciousness-prod --health --timeout 600
argocd app wait terrafusion-operations-prod --health --timeout 300
```

### 2.4 Smoke Verification

```bash
# Health endpoints
curl -f https://api.terrafusionmarket.com/health
curl -f https://api.terrafusionmarket.com/healthz
curl -f https://gateway.terrafusionmarket.com/health

# Functional smoke
curl -f https://api.terrafusionmarket.com/api/v1/properties?limit=1
```

### 2.5 Traffic Shift

1. Update DNS weight or Ingress backend to route 100 % to new version.
2. Monitor error rate and latency in Grafana for 15 minutes.
3. If SLO thresholds hold, declare cutover complete.

---

## 3. Rollback Triggers

Immediate rollback if **any** of:

- Error rate > 5 % for > 2 minutes (alert: `VeryHighAPIErrorRate`)
- P95 latency > 500 ms for > 2 minutes (alert: `VeryHighAPIResponseTime`)
- Any service `up == 0` for > 1 minute
- Audit log ingestion failure (alert: `AuditLogIngestionFailure`)
- County data isolation breach (alert: `CountyDataIsolationBreachAttempt`)

See [rollback.md](rollback.md) for the full rollback procedure.

---

## 4. Post-Cutover Validation

- [ ] All 6 Grafana dashboards show green / healthy metrics
- [ ] Prometheus alert count == 0 (no firing alerts)
- [ ] Audit log pipeline verified (insert + query test)
- [ ] Harris PACS sync running (`harris_pacs_sync_success == 1`)
- [ ] `revisionHistoryLimit` on Deployments ≥ 5 (enables fast rollback)
- [ ] Update Grafana annotation for maintenance end

---

## 5. Communication

| When | Who | Channel |
|------|-----|---------|
| T-24 h | County coordinators | Email + Slack |
| T-0 (start) | Ops team | `#terrafusion-ops` |
| T+15 min (success) | All stakeholders | Email + Slack |
| Rollback triggered | Incident commander | PagerDuty + `#terrafusion-critical` |

---

*Government. Transcended. Cut over.*
