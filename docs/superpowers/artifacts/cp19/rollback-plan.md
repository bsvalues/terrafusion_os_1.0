# CP-19 Rollback Plan

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: COMPLETE

## Trigger Conditions

| Trigger ID | Condition | Severity | Owner | Action |
|---|---|---|---|---|
| RB-T1 | Error rate > 5% on any critical path (parcel load, auth, RBAC) within 30 min of launch | P0 | Operations Owner | Immediate rollback |
| RB-T2 | County data isolation breach detected (wrong CountyId in response) | P0 | Security Owner | Immediate rollback + incident declared |
| RB-T3 | Database corruption or data loss detected post-launch | P0 | Operations Owner | Immediate rollback + restore from pre-launch snapshot |
| RB-T4 | Break-glass event triggered during launch window | P0 | SRE | Pause launch, swarm halted, assess before resuming |
| RB-T5 | Backend health endpoint returning non-healthy for > 5 min | P1 | SRE | Rollback if no hot-fix within 15 min |
| RB-T6 | Swarm memory spiral detected (unbounded growth) | P1 | SRE / AI Swarm Lane | Rollback AI layer, core platform stays up |

## Rollback Sequence

| Step | Command/Action | Owner | Target Time |
|---|---|---|---|
| 1 | Declare rollback decision + notify stakeholders | Operations Owner | T+0 (immediate) |
| 2 | Stop inbound traffic (load balancer / WAF rule) | SRE | T+2 min |
| 3 | `pwsh -File ops/dev/tf.ps1 down` | SRE | T+3 min |
| 4 | Restore DB from pre-launch snapshot (if RB-T3) | SRE | T+10 min |
| 5 | `pwsh -File ops/dev/tf.ps1 up` (previous image tag) | SRE | T+15 min |
| 6 | Health check: `pwsh -File ops/dev/tf.ps1 status` | SRE | T+18 min |
| 7 | Smoke test: auth + parcel load + RBAC check | Platform Team | T+20 min |
| 8 | Re-open traffic gate (previous version serving) | Operations Owner | T+22 min |
| 9 | Incident debrief + TerraTrace audit | Security Owner | T+24 hr |

## Verification

| Check | Evidence | Status |
|---|---|---|
| `tf.ps1 down` / `tf.ps1 up` round-trip defined | `ops/dev/tf.ps1` — verified present with up/down commands | ✅ Verified |
| Backup restoration runbook | `cp17/restore-proof.md` | ✅ Runbook complete |
| Pre-launch DB snapshot scheduled | SRE window pre-condition | ⏸ SRE to execute |
| Break-glass CI wired | `.github/workflows/autonomy-break-glass-guard.yml` + `incident-publisher.yml` | ✅ Verified |
| Hypercare plan active for 72 hr post-launch | `cp17/hypercare-plan.md` | ✅ Complete |
