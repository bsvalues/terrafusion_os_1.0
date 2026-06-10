# TerraFusion Sync — Production Readiness Packet

**Sealed**: 2026-06-09  
**Branch**: `fix/projector-delete-insert-atomicity`  
**Operator**: Benton County WA — Solo Dev  
**County data**: 83,326 active parcels / real Harris PACS 9.0 source  

---

## 1. Executive Status

TerraFusion Sync is **runtime-proven production-ready** on the Benton County data set. All identity-critical lanes are sealed against live Harris PACS: parcel spine, owner, land, improvement, improvement features, assessment value, exemption fact, tax area/district assignment, sales, geometry, and revenue (A-bill assessment bills). The `tf-sync-doctor` automated health check reaches steady-state `OVERALL: WARN` — WARN is correct because three lanes are LANDED_ONLY or DISCOVERED_DEFERRED (deferred by operator decision, not failure). The OS Shell Workbench v0.3 serves all four backend endpoints. Five Brain/Cortex memory lessons are seeded from proven production incidents. Two structural bugs (F1 projector FK fan-out, F2 parcel debris) are repaired and verified via identity-drift-detector. Revenue-A canonical lane is fully repaired with 313,139 bill lines / 79,078 current bill rollups / $8,841,075.97 amount-due sealed.

---

## 2. Doctor Result

Run: `POST /api/sync/workbench/doctor/run` (or `node tools/sync/tf-sync-doctor.mjs`)

**Steady-state**: `exitCode: 0` / `OVERALL: WARN`

| Step | Name | Result | Notes |
|---|---|---|---|
| #0 | Pack Validator | PASS | 65 checks, 1 info |
| #1 | Identity-Drift Detector | PASS | All 11 tables, 0 dangling |
| #2 | Seal-Check Runner | PASS | Revenue-A 22/22, $8.84M |
| #3 | Domain-Coverage Audit | WARN | 12 SEALED / 3 LANDED_ONLY / 3 DISCOVERED_DEFERRED / 1 EMPTY_IN_SOURCE |

**WARN is not a failure.** Doctor exit code 0 + OVERALL WARN = healthy with known deferred lanes.  
**FAIL would be** exit code 1. No unresolved FAIL remains on this branch.

### Identity-Drift per table (post-F1+F2)

| table | total | live | dangling | result |
|---|---|---|---|---|
| canonical_tf.tf_parcel | 83,326 | 83,326 | 0 | PASS |
| canonical_tf.tf_parcel_owner_link | 714,553 | 714,553 | 0 | PASS |
| canonical_tf.tf_land | ~89K | ~89K | 0 | PASS |
| canonical_tf.tf_improvement | ~89K | ~89K | 0 | PASS |
| canonical_tf.tf_improvement_feature | ~300K | ~300K | 0 | PASS |
| canonical_tf.tf_assessment_value | ~89K | ~89K | 0 | PASS |
| canonical_tf.tf_exemption_fact | ~35K | ~35K | 0 | PASS |
| canonical_tf.tf_tax_area | ~89K | ~89K | 0 | PASS |
| canonical_tf.tf_sale | ~40K | ~40K | 0 | PASS |
| gis_tf.tf_parcel_geom | 83,296 | 83,296 | 0 | PASS (970 null_ref documented) |
| canonical_tf.tf_assessment_bill_current | 79,078 | 79,078 | 0 | PASS |

---

## 3. Runtime-Proven Substrate

Each lane below was proven against live Harris PACS in the sequence shown. Evidence docs linked.

| lane | sealed commit | evidence |
|---|---|---|
| Parcel spine (F2 cleaned) | `3057891b4` + `481955026` | [F2 cleanup evidence](workbench/) |
| Owner / WSDOR | various | Phase 1 proof |
| Land (active supplement) | various | Phase 1 proof |
| Improvement + features | `e4b3ec0cd` | Phase 1 proof |
| Assessment value | various | Phase 1 proof |
| Exemption fact | various | Phase 1 proof |
| Tax area / district | various | Phase 1 proof |
| Sales | various | Phase 1 proof |
| Geometry | various | Phase 1 proof |
| Revenue-A (assessment bills) | `1e75e628c` | [Revenue-A evidence](workbench/REVENUE_A_ASSESSMENT_BILL_REPAIR_EVIDENCE.md) |
| **F1 fix (projector FK)** | `be087d586` | Identity-drift PASS (all 11) |
| **F2 fix (parcel debris)** | `3057891b4` | Identity-drift PASS (0 dangling) |
| **identity-runner timeout** | `e50e9633a` | Workbench Slice L PASS |

**Full runtime proof**: [SYNC_RUNTIME_PRODUCTION_PROOF.md](workbench/SYNC_RUNTIME_PRODUCTION_PROOF.md)  
**Workbench endpoint proof**: [WORKBENCH_V0_3_RUNTIME_PROOF.md](workbench/WORKBENCH_V0_3_RUNTIME_PROOF.md)

---

## 4. Workbench Status (v0.3)

All four OS Shell Workbench endpoints are operational at `http://localhost:5000`.

| slice | endpoint | what it does | steady-state |
|---|---|---|---|
| Slice I | GET /api/sync/workbench/quarantine/review | Returns quarantine rows from landing layer. Read-only projection. Immutability notice on every response. | 27,684 unreviewed `UNKNOWN_I_ATTR_VAL_CD` rows (operator decision needed, not auto-released) |
| Slice J | POST /api/sync/workbench/doctor/run | Runs tf-sync-doctor 4-step health check. Returns raw stdout + exitCode. 409 if already running. | exitCode 0, OVERALL: WARN |
| Slice K | POST /api/sync/workbench/source-pack/run | Runs harris-pacs-pack-validator against live PACS schema. Returns 65-check report. | exitCode 0, all PASS |
| Slice L | POST /api/sync/workbench/identity-spine/run | Runs identity-drift-detector.sql. Timeout 300s (fixed from 90s). Returns per-table dangling counts. | exitCode 0, OVERALL: PASS |

**UI pixel acceptance**: NOT claimed. Backend endpoints are proven. Frontend component rendering requires a live browser session.

---

## 5. Brain/Cortex Memory — Seeded Lessons

Five runtime-proven lessons in `docs/brain/sync/lessons/`. Each has YAML frontmatter + prevention rule + automation target for Obsidian graph and future doctor automation.

| lesson | what it prevents |
|---|---|
| [SYNC-LESSON-BENTON-ACTIVE-SUPPLEMENT](../brain/sync/lessons/SYNC-LESSON-BENTON-ACTIVE-SUPPLEMENT.md) | Wrong row counts from assuming sup_num=0; always join through active supplement |
| [SYNC-LESSON-BENTON-F1-LIVE-SPINE](../brain/sync/lessons/SYNC-LESSON-BENTON-F1-LIVE-SPINE.md) | Canonical rows pointing at dead parcel generation; always resolve through source_xref |
| [SYNC-LESSON-BENTON-F2-PARCEL-DEBRIS](../brain/sync/lessons/SYNC-LESSON-BENTON-F2-PARCEL-DEBRIS.md) | 3.1M debris rows from historical stacking bug; track stacking ratio after every parcel drain |
| [SYNC-LESSON-BENTON-REVENUE-A-WORKINGYEAR](../brain/sync/lessons/SYNC-LESSON-BENTON-REVENUE-A-WORKINGYEAR.md) | NormalizeRequest defaulting to wrong year → 0 rows silently; always pass WorkingYear explicitly |
| [SYNC-LESSON-BENTON-REVENUE-A-LANDING-GAP](../brain/sync/lessons/SYNC-LESSON-BENTON-REVENUE-A-LANDING-GAP.md) | Empty canonical tables giving false seal-check FAIL; always run drain → seal-check as a pair |

---

## 6. Deferred Work

These items are explicitly NOT done. Deferred by operator decision — not forgotten, not skipped in error.

| item | reason deferred |
|---|---|
| Quarantine review disposition (27,684 `UNKNOWN_I_ATTR_VAL_CD` rows) | Operator decision: which codes to promote vs quarantine permanently. V8 dictionary auto-refresh is in place; this is a policy call. |
| History lanes (Treasurer accounting, fund/distribution, delinquency) | Out of scope for this mission. Separate operator decision needed. |
| Frontend workbench UI pixel acceptance | Requires live browser session. Backend is proven; frontend render is untested. |
| CI Dockerfile.API publish bug (MSB4018 deps file write failure) | Pre-existing unrelated to sync lanes. Noted in V6 seal doc. Separate slice needed. |
| Doctor DISCOVERED_DEFERRED lanes (3) | Operator discovery. Not missing data — lanes not yet designed for this county. |
| Parcel debris backup protocol | Protocol miss on F2 — no pre-cleanup backup table. Cleanup was safely reconstructible from truth spine. Future cleanups should create backup table first. |
| Per-year active supplement auto-resolve in DoctrineDrainController | WorkingYear should be inferred from MAX(active A-bill year) in PACS. Currently manual. |

---

## 7. Operator Start Procedure

### Prerequisites
- PostgreSQL running on port 5432 (local dev)
- Harris PACS MSSQL reachable (tf-mssql connection string in appsettings.Development.json)
- .NET 8 SDK installed

### Start the stack

```powershell
# 1. Start the API
cd C:\Users\bsval\terrafusion_os_1.0\backend
dotnet run --project TerraFusion.API --configuration Development

# 2. Verify health
curl http://localhost:5000/health
```

### Run the doctor (verify healthy state)

```powershell
# Option A: via workbench endpoint (authoritative)
curl -X POST http://localhost:5000/api/sync/workbench/doctor/run -H "Content-Type: application/json" -d "{}"
# Expect: exitCode 0, stdout contains "OVERALL: WARN"

# Option B: direct CLI
cd C:\Users\bsval\terrafusion_os_1.0
node tools/sync/tf-sync-doctor.mjs
# Expect: OVERALL: WARN
```

### Interpret the doctor output

| doctor says | meaning | action |
|---|---|---|
| `OVERALL: WARN` | Healthy — known deferred lanes | None required |
| `OVERALL: PASS` | Fully clean | None required |
| `OVERALL: FAIL` | Unexpected problem | Investigate before any drain |
| `exitCode: 1` | Hard failure | Hard stop — do not drain |

### Run a drain (example: re-drain Revenue-A after PACS update)

```powershell
# Always pass WorkingYear explicitly for year-scoped lanes
curl -X POST http://localhost:5000/api/sync/doctrine/drain/revenue-a \
  -H "Content-Type: application/json" \
  -d '{"WorkingYear": 2025}'

# After drain, verify seal-check still passes
curl -X POST http://localhost:5000/api/sync/workbench/doctor/run -H "Content-Type: application/json" -d "{}"
```

### Verify identity after any bulk drain

```powershell
curl -X POST http://localhost:5000/api/sync/workbench/identity-spine/run -H "Content-Type: application/json" -d "{}"
# Expect: exitCode 0, OVERALL: PASS — no identity drift
```

---

## 8. Solo-Dev Guardrails

These are hard stops. Do not proceed through them.

| trigger | action |
|---|---|
| Doctor shows `OVERALL: FAIL` | Stop. Diagnose before any drain. |
| Identity-drift shows dangling rows | Stop. Do not re-drain until drift is explained. |
| Seal-check shows FAIL for a previously-PASS lane | Stop. Root-cause before re-sealing. |
| About to use `git add .` | Stop. Use explicit file paths only. |
| About to use `--no-verify` | Stop. Fix the pre-commit hook issue instead. |
| WorkingYear not known for a year-scoped lane | Stop. Query `SELECT MAX(year) FROM dbo.bill WHERE bill_type='A' AND is_active=1` first. |
| About to mutate PACS source tables | Stop. PACS is read-only source. TerraFusion is the destination. |
| About to drain truth_pacs without identity-drift PASS | Stop. Identity gate must pass first. |

---

## 9. Final Readiness Statement

TerraFusion Sync on branch `fix/projector-delete-insert-atomicity` is **runtime-proven production-ready** for the following scope:

- **County**: Benton County WA
- **Source**: Harris PACS 9.0 (read-only)
- **Active parcels**: 83,326
- **Lanes sealed**: 11 (parcel, owner, land, improvement, improvement features, assessment value, exemption, tax area, sales, geometry, revenue-A)
- **Identity health**: 0 dangling rows across all 11 canonical tables
- **Revenue-A**: 313,139 bill lines / 79,078 current / $8,841,075.97 amount-due / 22/22 seal gates
- **Workbench**: 4 OS Shell endpoints operational (quarantine, doctor, source-pack, identity-spine)
- **Brain lessons**: 5 seeded from production incidents
- **Test suite**: passing (pre-commit quality gate green on commit `e50e9633a`)

The branch is ready to merge to `main` at operator's discretion.

---

*Packet sealed 2026-06-09. Do not modify this file after seal.*
