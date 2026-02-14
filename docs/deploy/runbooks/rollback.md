# TerraFusion OS — Rollback Runbook

> **Classification:** Government Operations — FISMA-HIGH  
> **Priority:** Execute immediately when rollback triggers are met  
> **Last Updated:** Phase 7 — Production Cutover Safety

---

## 1. Rollback Triggers

Execute this runbook when **any** of the following fire:

| Trigger | Alert | Threshold |
|---------|-------|-----------|
| High error rate | `VeryHighAPIErrorRate` | 5xx > 5 % for 2 min |
| High latency | `VeryHighAPIResponseTime` | P95 > 500 ms for 2 min |
| Service down | `TerraFusionAPIDown` / `GatewayDown` | up == 0 for 1 min |
| Audit failure | `AuditLogIngestionFailure` | Any error for 2 min |
| Isolation breach | `CountyDataIsolationBreachAttempt` | Any violation for 1 min |
| Database corruption | Manual detection | Any sign of data loss |

---

## 2. Rollback Procedure

### 2.1 Halt Forward Progress

```bash
# Disable ArgoCD auto-sync to prevent re-deploying the bad version
argocd app set terrafusion-api-prod          --sync-policy none
argocd app set terrafusion-gateway-prod      --sync-policy none
argocd app set terrafusion-consciousness-prod --sync-policy none
argocd app set terrafusion-operations-prod   --sync-policy none
```

### 2.2 Roll Back Deployments (K8s)

```bash
# Option A: ArgoCD rollback to previous revision
argocd app rollback terrafusion-api-prod 0          # 0 = previous sync
argocd app rollback terrafusion-gateway-prod 0
argocd app rollback terrafusion-consciousness-prod 0
argocd app rollback terrafusion-operations-prod 0

# Option B: kubectl rollback (if ArgoCD unavailable)
kubectl rollout undo deployment/terrafusion-api -n terrafusion
kubectl rollout undo deployment/terrafusion-gateway -n terrafusion
kubectl rollout undo deployment/terrafusion-consciousness -n terrafusion
kubectl rollout undo deployment/terrafusion-operations -n terrafusion

# Wait for rollout completion
kubectl rollout status deployment/terrafusion-api -n terrafusion --timeout=120s
kubectl rollout status deployment/terrafusion-gateway -n terrafusion --timeout=120s
```

### 2.3 Database Rollback (if migration was applied)

```bash
# 1. Identify the previous migration
dotnet ef migrations list \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API

# 2. Roll back to the previous migration
dotnet ef database update <PreviousMigrationName> \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --connection "$PRODUCTION_CONNECTION_STRING"

# 3. If migration is destructive, restore from backup
# See section 2.4
```

### 2.4 Database Restore from Backup

```bash
# Sovereign (SQLite) restore
# Backups created by ops/scripts/backup_sovereign.ps1
# Located in C:\TerraFusion_Backups\<timestamp>.zip

# 1. Stop services
kubectl scale deployment/terrafusion-api -n terrafusion --replicas=0

# 2. Restore database
# For PostgreSQL:
pg_restore --dbname=terrafusion --clean --if-exists backup_<timestamp>.dump

# 3. Restart services
kubectl scale deployment/terrafusion-api -n terrafusion --replicas=3
```

### 2.5 DNS / Traffic Shift

If traffic was shifted during cutover:

```bash
# Revert DNS or Ingress backend to previous version
# Specific steps depend on DNS provider / Ingress controller configuration
```

---

## 3. Post-Rollback Verification

- [ ] All services healthy: `curl -f https://api.terrafusionmarket.com/health`
- [ ] Error rate returned to baseline (< 1 %)
- [ ] P95 latency returned to baseline (< 100 ms)
- [ ] Audit log pipeline operational (zero errors)
- [ ] Grafana dashboards show green
- [ ] No firing alerts in Prometheus

---

## 4. RPO / RTO Targets

| Metric | Target | Basis |
|--------|--------|-------|
| **RPO** (Recovery Point Objective) | ≤ 15 minutes | Continuous database replication + 5 min Redis snapshots |
| **RTO** (Recovery Time Objective) | ≤ 120 minutes | ArgoCD rollback + backup restore |

Source: `scripts/disaster-recovery-validation.sh`

---

## 5. Post-Incident

1. Declare incident resolved in `#terrafusion-critical`.
2. File incident report within 24 hours.
3. Schedule blameless post-mortem within 72 hours.
4. Update error budget tracking (see `docs/ops/slo.md` § Error Budget Policy).
5. Re-enable ArgoCD auto-sync only after root cause is identified.

---

*Government. Transcended. Recoverable.*
