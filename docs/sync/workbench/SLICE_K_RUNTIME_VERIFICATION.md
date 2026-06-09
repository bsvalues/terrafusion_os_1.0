# Slice K — Runtime Verification Evidence
<!-- WORKBENCH-V0.3 SLICE-K runtime verification. Do NOT commit test data. -->

**Date**: 2026-06-09  
**Branch**: `fix/projector-delete-insert-atomicity`  
**Commit at seal**: `dc22152e6`  

---

## Summary

Workbench v0.3 Slice K — OS Shell Source Pack Fit Panel — is **runtime-proven**.

The `PackValidatorRunnerService.ResolveRepoRoot` path resolves correctly to repo root.
The `pack-validator-runner.mjs` is found and executed. The endpoint is functional.

---

## Path Resolution Verification

`PackValidatorRunnerService` computes:

```csharp
Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", ".."))
```

Where `ContentRootPath` = `backend/src/TerraFusion.API` at runtime.  
Three levels up → **repo root** (`~/terrafusion_os_1.0`).

Confirmed:
```
~/terrafusion_os_1.0/tools/sync/pack-validator-runner.mjs  ✅  EXISTS
```

---

## psql Discovery

`pack-validator-runner.mjs` tries candidates in order:

```
C:/Program Files/PostgreSQL/17/bin/psql.exe   ← FOUND (installed)
C:/Program Files/PostgreSQL/16/bin/psql.exe
C:/Program Files/PostgreSQL/15/bin/psql.exe
/usr/bin/psql
psql
```

PostgreSQL 17 is installed on this machine — first candidate resolves.

---

## Live Run Result

Command executed (same as backend spawn):

```bash
node tools/sync/pack-validator-runner.mjs
```

Working directory: repo root.  
DB: `host=127.0.0.1 port=5432 dbname=terrafusion user=postgres` (defaults).

**Result**:

```
OVERALL: WARN|fail=0|warn=1|pass=64|info=1
```

---

## Divergence from Contract Expectation

The Slice K contract stated:

> "Benton expected: PASS with 65 pass + 1 info"

**Actual live result**: `WARN|fail=0|warn=1|pass=64|info=1`

### Failing Check

| field | value |
|---|---|
| category | `data_content` |
| check_name | `assessment_bills_A_active_count` |
| measured | `0` |
| expected | `>0` |
| verdict | **WARN** |
| severity | WARN |
| notes | active special-assessment bills (BillType=A IsActive=true) [Benton ref: 313,139] |

**Root cause**: `legacy_pacs_raw.assessment_bill_line` has 0 rows matching  
`WHERE "BillType" = 'A' AND "IsActive" = true`.  
The assessment-bill revenue lane data has not yet been drained to the landing layer.

This is a **real data-state finding**, not a panel bug.

### INFO Check (non-blocking)

| field | value |
|---|---|
| check_name | `col_property__PropInactiveDt` |
| measured | `missing` |
| expected | `present` |
| verdict | **INFO** |
| notes | may be 1980-01-01 ProVal-conversion sentinel for pre-2017 rows |

INFO does not contribute to the WARN overall verdict.

---

## Panel Behavior Confirmed Correct

- **WARN banner** rendered — not FAIL, not PASS.
- **`fail-gate-notice`** NOT shown (correct — fires only on FAIL verdict).
- **`data_content` section card** shows verdict=WARN with 1 warn check.
- **`assessment_bills_A_active_count`** row displayed with ⚠ symbol.
- **Raw output toggle** shows full stdout.

Panel interprets and presents the live WARN result correctly.

---

## 409 Concurrent-Run Guard

The singleton `Interlocked.CompareExchange` guard was verified via unit tests  
(6/6 `PackValidatorRunnerServiceTests` passed at seal). Not re-tested live  
(would require two concurrent requests).

---

## Contract Delta — Operator Note

The contract's "Benton expected: PASS" was written based on the state at contract  
authoring time. The current DB state produces WARN because  
`assessment_bills_A_active_count = 0`.

**Operator action required** to resolve the WARN:  
Drain the assessment-bill lane (`legacy_pacs_raw.assessment_bill_line`) so it  
contains the expected ~313,139 BillType=A IsActive=true rows.

Until then, the Workbench Source Pack Fit panel correctly reports WARN — which is  
the right behavior. WARN is non-blocking (drain is not prevented).  
Only FAIL would be a hard gate.

---

## WARN Classification — Accepted Landing-State Warning

The Slice K runtime WARN is accepted as a **current Benton landing-state warning**.
This is NOT a Source Pack Fit panel failure.

**Classification**:
- `legacy_pacs_raw.assessment_bill_line` has 0 rows matching  
  `BillType='A' AND IsActive=true` in the landing layer.
- The canonical assessment-bill read model (SYNC-COMPLETE-2/3) was built  
  from this data. Canonical tables (`canonical_tf.tf_assessment_bill_line`,  
  `canonical_tf.tf_assessment_bill_current`) exist. The landing layer is  
  a passthrough mirror of PACS source — if the source has no active A bills  
  accessible here, the validator correctly reports WARN.
- The panel worked correctly: WARN banner shown without the FAIL hard gate.

**Resolution path**: Reconcile or re-land `assessment_bill_line` if/when the  
landing layer is found to be stale. Until then, WARN is acknowledged.  
WARN is non-blocking — drain is not prevented.

---

## Conclusion

| item | status |
|---|---|
| `ResolveRepoRoot` path | ✅ correct |
| `pack-validator-runner.mjs` found | ✅ found |
| psql found | ✅ `C:/Program Files/PostgreSQL/17/bin/psql.exe` |
| SQL executes against live DB | ✅ yes |
| Panel renders live result | ✅ WARN correctly displayed |
| FAIL hard gate not triggered | ✅ (no FAIL checks) |
| Assessment-bill WARN | ⚠ accepted landing-state warning — not a panel bug |
| Contract expectation | ⚠ PASS expected, WARN actual — acknowledged, deferred |
