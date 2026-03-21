# Phase 35 — Rollback Note

**Date**: 2026-03-21
**Status**: INVENTORY ONLY (SRE owns execution)
**Baseline**: `199f0f931`

---

## Scope

This note documents rollback posture for Phase 35 K8s staging.
Phase 34 (compose-slice) has no rollback concern — `docker-compose down` is the rollback.
Phase 35 rollback applies to the first K8s cluster deployment.

---

## Rollback Triggers

Roll back immediately if any of these are observed after Phase 35 deploy:

| Signal | Threshold | Action |
|--------|-----------|--------|
| API `/health` returning non-200 | Sustained >2 min | Roll back API deployment |
| Consciousness `/health` showing crash loop | Any crash loop | Roll back Consciousness deployment |
| PACS `GET /ops/pacs/proof` returning `contractValid=false` | Single occurrence | Investigate before rollback — may be MSSQL connectivity |
| SignalR hub disconnect storm | >10% clients drop | Roll back API + Consciousness |
| Swarm OOM (pod evicted) | Any eviction | Scale swarm down; do not roll back unless repeated |
| JWT validation failures across all clients | >5% of requests | Roll back API (likely config issue) |

---

## Rollback Commands (K8s — Phase 35)

```bash
# Roll back a specific deployment to previous revision
kubectl rollout undo deployment/terrafusion-api
kubectl rollout undo deployment/terrafusion-consciousness
kubectl rollout undo deployment/terrafusion-gateway

# Verify rollback
kubectl rollout status deployment/terrafusion-api
# Expected: "deployment successfully rolled out"

# Check which revision is now active
kubectl rollout history deployment/terrafusion-api
```

---

## Rollback from Phase 35 → Phase 34 Compose

If K8s cluster is unrecoverable, fall back to Phase 34 compose-slice:

```bash
# Stop K8s workloads (or scale to 0)
kubectl scale deployment --all --replicas=0 -n terrafusion

# Return to Phase 34 compose rehearsal
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

Phase 34 compose-slice is the last known-good state.
Git baseline for last known-good: `199f0f931` (Phase 34 definition committed).

---

## Data Rollback

**Phase 35 adds no schema migrations.** Schema baseline is fixed at `446d84021`.
If Phase 35 introduces a migration (it shouldn't), rollback requires:

```bash
# Roll back one migration
dotnet ef database update <previous-migration-name> \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API
```

**PACS data**: Read-only. No rollback concern. TerraFusion never writes to PACS SQL Server.

---

## JWT Rollback

If JWT rotation (Phase 35 gate) causes widespread authentication failures:

```bash
# Revert secret to previous value
kubectl create secret generic terrafusion-jwt \
  --from-literal=TF_JWT_SECRET='<previous-key>' \
  --dry-run=client -o yaml | kubectl apply -f -

# Rolling restart to pick up reverted key
kubectl rollout restart deployment/terrafusion-api
kubectl rollout restart deployment/terrafusion-operations
```

All tokens issued with the new key become invalid. Users must re-authenticate.
This is acceptable during Phase 35 staging (no real users in K8s staging).

---

## Rollback Ownership

| Layer | Rollback Owner |
|-------|---------------|
| K8s deployments | SRE |
| Database migrations | SRE + solo dev (BSVal) |
| PACS connection config | BSVal (appsettings override) |
| JWT secret | SRE |
| Compose fallback | BSVal |

Phase 35 K8s is SRE-gated. No rollback should be executed by solo dev without SRE sign-off.

---

## Phase 35 Exit = No Rollback

Phase 35 is declared green when:
1. All Phase 34 assertions still hold in K8s context
2. `AI__SwarmSize` = 1,008 runs without OOM or crash loop on cluster hardware
3. Rolling deploy succeeds without downtime
4. No rollback was executed during the gate window

If rollback is executed during Phase 35 gate, Phase 35 is not green.
Identify root cause, fix, re-run full gate from scratch.
