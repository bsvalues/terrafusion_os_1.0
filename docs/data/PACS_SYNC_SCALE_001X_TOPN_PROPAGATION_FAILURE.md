# WO-DATA-004B-SCALE-001X — TopN Propagation Failure Investigation

**Work Order:** WO-DATA-004B-SCALE-001X
**Date:** 2026-06-19
**Status:** INVESTIGATION COMPLETE — No drain run. No DB mutation. Code not changed.
**Prerequisite evidence:** PR #1047 (FIX3–FIX8), PR #1048 (schema), PR #1049 (SCALE-001 decision memo)

---

## Executive Summary

SCALE-001A (parcel) and SCALE-001B (owner-wsdor) both executed with `FullCorpus=True`
despite being called with `?topN=500`. The `topN` query-string parameter is **not
wired to the endpoint** — the controller exclusively uses `[FromBody] DoctrineDrainRequest`.
Calls with no request body default to `FullCorpus=true` (full corpus).

Prior WO-004B controlled-slice drains (FIX3–FIX7B) all sent correct JSON bodies with
`"FullCorpus":false,"TopN":100` and were properly bounded. Those results remain valid.

SCALE-001A completed a near-full Benton parcel corpus import (83,326 rows, ~93% of
89,247 total parcels). SCALE-001B was killed after ~1 hour with no rows committed.

---

## 1. Endpoint Signatures

All five active drain endpoints share the same binding pattern:

```
POST /api/sync/doctrine/drain/parcel
POST /api/sync/doctrine/drain/owner-wsdor
POST /api/sync/doctrine/drain/improvement
POST /api/sync/doctrine/drain/land
POST /api/sync/doctrine/drain/sales
```

**Controller:** `DoctrineDrainController` — `[Route("api/sync/doctrine/drain")]`
**File:** `backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs`
**Attribute:** `[AllowAnonymous]` — no auth required.

Each endpoint signature:
```csharp
[HttpPost("<lane>")]
public async Task<IActionResult> Drain<Lane>(
    [FromServices] ...,
    [FromBody] DoctrineDrainRequest? request,
    CancellationToken cancellationToken = default)
```

**TopN and FullCorpus come exclusively from `[FromBody]`.** There is no `[FromQuery]`
binding for either parameter.

---

## 2. Request DTO

```csharp
public sealed record DoctrineDrainRequest(
    string? OperatorName,
    int? WorkingYear,
    bool? FullCorpus,
    int? TopN,
    Guid? LaneResultId = null,
    string? ResumeFromStage = null);
```

**File:** `DoctrineDrainController.cs` line 2152.

---

## 3. NormalizeRequest — Default Behavior

```csharp
// DoctrineDrainController.cs line 1640–1650
private static (string OperatorName, short WorkingYear, bool FullCorpus, int? TopN)
    NormalizeRequest(DoctrineDrainRequest? request, string laneName)
{
    var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
        ? $"doctrine-drain-{laneName}"
        : request!.OperatorName!.Trim();
    var workingYear = (short)(request?.WorkingYear ?? 2026);
    var fullCorpus = request?.FullCorpus ?? true;   // ← DEFAULT IS TRUE
    var topN = request?.TopN;
    return (operatorName, workingYear, fullCorpus, topN);
}
```

**When `request` is `null` (no body sent): `FullCorpus = true`, `TopN = null`.**

---

## 4. TopN Propagation Path

```csharp
// Parcel lane (line 269) — same pattern in all lanes:
var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);
// → if FullCorpus=true: seedTopN = null (no limit)
// → if FullCorpus=false, TopN=500: seedTopN = 500
// → if FullCorpus=false, TopN=null: seedTopN = 200 (per-lane safe default)
```

Propagation: `NormalizeRequest` → `seedTopN` → `SqlServerPacsOwnerSource(pacsCs!, topN: seedTopN)` → SQL `TOP (N)` clause (or no clause when null).

**Exact drop point: `NormalizeRequest` line 1647.** When `request` is null, `FullCorpus`
is never false and `TopN` is never set. There is no query-string binding at any layer.

---

## 5. SCALE-001A/B Actual Calls vs. Required Calls

### What was sent (SCALE-001A, SCALE-001B):
```bash
curl -X POST "http://localhost:5046/api/sync/doctrine/drain/parcel?topN=500" \
  -H "Content-Type: application/json"
# No -d / --data body. Request body = null.
```

**Result:** `NormalizeRequest(null, "parcel")` → `FullCorpus=true`, `TopN=null` → full corpus.

### What should have been sent:
```bash
curl -X POST "http://localhost:5046/api/sync/doctrine/drain/parcel" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"scale-001a-parcel","WorkingYear":2026,"FullCorpus":false,"TopN":500}'
```

---

## 6. Prior TopN=100 Controlled Slice — Impact Assessment

All five prior WO-004B drains (FIX3–FIX7B) used correct JSON bodies:

| Lane | Commit | Payload (confirmed from evidence) |
|---|---|---|
| parcel | `a3cbaa987` | `{"FullCorpus":false,"TopN":100}` |
| owner-wsdor | `199195895` | `{"FullCorpus":false,"TopN":100}` |
| improvement | `98f68ba0a` | `{"FullCorpus":false,"TopN":100}` |
| land | `c4a417909` | `{"FullCorpus":false,"TopN":100}` |
| sales | `0a5ac5215` | `{"FullCorpus":false,"TopN":100}` |

**Prior TopN=100 slice evidence is valid and must NOT be reclassified.** Those drains
ran exactly as intended. The carry-forward gate results (17P, 49P, 52P/1F, 34P, 30P/1W)
are accurate representations of bounded 100-row slices.

---

## 7. SCALE-001A Parcel Scope Breach Assessment

| Field | Value |
|---|---|
| Approved scope | TopN=500 (expected ~500 additional parcel rows) |
| Actual scope | FullCorpus — near-full Benton parcel corpus |
| Rows landed (legacy_pacs_raw) | 95,810 |
| Rows promoted (truth_pacs.parcel_spine) | 83,326 |
| Rows canonicalized (canonical_tf.tf_parcel) | 83,326 |
| % of Benton total (89,247 parcels) | ~93% |
| Gates | **17 PASS / 0 FAIL** |
| Quarantine delta | 0 (parcel lane has no improvement attr quarantine) |
| Duration | 558.99 sec (~9.3 min) |

**Technical quality: clean.** All 17 gates passed. No schema errors. No quarantine introduced.
**Procedural scope: exceeded.** The operator approved TopN=500; the runtime imported ~93%
of the Benton parcel corpus.

---

## 8. SCALE-001B Owner-wsdor Abort Assessment

| Field | Value |
|---|---|
| Approved scope | TopN=500 |
| Actual scope | FullCorpus — 2,539,100 owner rows in PACS |
| Duration before kill | ~1 hour |
| Last log line | `[Drain:owner-wsdor] Owner S1 (TopN=null, FullCorpus=True)` |
| owner_current before | 100 |
| owner_current after kill | 100 (unchanged — no commit) |
| tf_owner before | 84 |
| tf_owner after kill | 84 (unchanged) |

**No partial writes committed.** DB is clean. The HTTP connection reset (curl exit 56)
on API kill; no transaction was mid-commit.

---

## 9. Current DB State (post SCALE-001A, post SCALE-001B kill)

| Table | Rows | Notes |
|---|---|---|
| truth_pacs.parcel_spine | 83,687 | Was 361 before SCALE-001A. Scope breach. |
| canonical_tf.tf_parcel | 83,326 | Was 160 before SCALE-001A. Scope breach. |
| truth_pacs.owner_current | 100 | Unchanged (FIX4 state) |
| canonical_tf.tf_owner | 84 | Unchanged (FIX4 state) |
| truth_pacs.imprv_current | 104 | Unchanged (FIX5 state) |
| canonical_tf.tf_improvement | 104 | Unchanged (FIX5 state) |
| truth_pacs.land_current | 137 | Unchanged (FIX6 state) |
| canonical_tf.tf_land | 137 | Unchanged (FIX6 state) |
| truth_pacs.sale | 61 | Unchanged (FIX7B state) |
| canonical_tf.tf_sale | 61 | Unchanged (FIX7B state) |
| legacy_tf_unproven.unresolved_imprv_attr | 588 | Unchanged |

**`terrafusion_dev_clean` is in a mixed state:** parcel is near-full corpus (~93%);
all other lanes are at controlled-slice TopN=100 state. This is inconsistent for
scale-proof purposes.

---

## 10. Affected Endpoints — All Five Non-Geometry Lanes

All five drain endpoints share the same `NormalizeRequest` method and the same
`FullCorpus ?? true` default. **All five are affected by this bug if called without
a body.** The geometry endpoint uses a different internal path and ignores TopN entirely
(blocked separately for other reasons).

---

## 11. Why TopN=100 Appeared Bounded

Because those calls sent correct JSON bodies (`"FullCorpus":false,"TopN":100`).
`NormalizeRequest` received a non-null `request`, read `FullCorpus=false` and `TopN=100`,
and computed `seedTopN=100`. The SQL `TOP (100)` clause was applied at the source query.

The endpoint binding was never broken — the calls were correct. SCALE-001 calls were wrong.

---

## 12. Recommended Fix

**Minimal, targeted patch — do not apply without operator approval:**

Change `NormalizeRequest` line 1647 to default `FullCorpus` to `false` instead of `true`:

```csharp
// Before (line 1647):
var fullCorpus = request?.FullCorpus ?? true;

// After:
var fullCorpus = request?.FullCorpus ?? false;
```

This makes the safe default bounded (uses per-lane TopN safe default of 200) rather
than unbounded. Full-corpus runs still work by explicitly passing `"FullCorpus":true`.

**Alternative (more explicit):** Add `[FromQuery] int? topN = null` and
`[FromQuery] bool fullCorpus = false` parameters alongside `[FromBody]` for operator
convenience when making ad-hoc curl calls. Requires more surgery.

**Recommended:** The single-line default change. Low risk, preserves the existing
body-based contract, makes accidental full-corpus impossible.

---

## 13. Recommended DB Handling for Parcel Near-Full Import

Two options — operator decides:

**Option A — Reclassify and continue on this DB:**
- Document `terrafusion_dev_clean` as "parcel near-full + other lanes at TopN=100."
- Proceed with owner, improvement, land, sales drains (with correct body payloads).
- The parcel data is technically clean and gate-proven; it just wasn't scope-approved.
- Accept this as the scale-proof baseline going forward.
- Pro: no DB work needed. Con: the DB is not a clean controlled-TopN=500 proof.

**Option B — Reset parcel and re-run with correct payload:**
- Truncate `truth_pacs.parcel_spine` back to controlled-slice state (keep first 361 rows
  from FIX3 batch) and truncate `canonical_tf.tf_parcel` back to 160.
- Re-run parcel drain with correct body: `{"FullCorpus":false,"TopN":500}`.
- Pro: clean scale-proof of exactly TopN=500. Con: requires DB surgery (truncate-to-batch).
- **Requires separate operator approval before any DB mutation.**

**Option C — Fresh DB for scale proof:**
- Restore `terrafusion_dev_clean` from a snapshot taken before SCALE-001A (if one exists)
  or create a fresh Postgres container initialized at FIX7B state.
- Re-run all SCALE-001 lanes with correct payloads.
- Pro: cleanest evidence. Con: most work.

**Operator recommendation:** Do not mutate the DB casually. The parcel data is clean.
Option A (reclassify) is acceptable if the goal is functional scale proof, not procedural
purity. Option B or C if a clean TopN=500 evidence artifact is required.

---

## 14. Whether SCALE-001 Can Resume

**Yes, immediately — with one change to the drain call.**

The fix is in the caller, not the runtime:

```bash
# Correct parcel re-drain (Option A — re-run is a no-op on already-landed rows via UPSERT):
curl -X POST "http://localhost:5046/api/sync/doctrine/drain/parcel" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"scale-001a-parcel-corrected","WorkingYear":2026,"FullCorpus":false,"TopN":500}'

# Correct owner-wsdor drain:
curl -X POST "http://localhost:5046/api/sync/doctrine/drain/owner-wsdor" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"scale-001b-owner-wsdor","WorkingYear":2026,"FullCorpus":false,"TopN":500}'
```

No code change required to resume SCALE-001 correctly. However, before resuming,
operator must decide on the DB handling (§13) and whether to apply the `FullCorpus ?? false`
default fix (§12) first.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | INVESTIGATION COMPLETE |
| ROOT_CAUSE | `NormalizeRequest` defaults `FullCorpus ?? true` when request body is null. SCALE-001 calls used query-string `?topN=500` with no body → null request → FullCorpus=true. |
| AFFECTED_ENDPOINTS | All 5 non-geometry drain lanes share the same NormalizeRequest method |
| TOPN_BINDING_EXPECTATION | `[FromBody] DoctrineDrainRequest` — body only, no query-string binding |
| DROP_POINT | `DoctrineDrainController.cs` line 1647: `var fullCorpus = request?.FullCorpus ?? true` |
| PRIOR_SLICE_IMPACT | None — FIX3–FIX7B all sent correct JSON bodies. Evidence remains valid. |
| PARCEL_SCALE001A_STATUS | Completed near-full corpus (83,326 rows, ~93% Benton). Technically clean (17/17 PASS). Procedurally out of scope. |
| OWNER_SCALE001B_STATUS | Killed after ~1 hour. No rows committed. DB clean. |
| DB_STATE | Mixed: parcel near-full; all other lanes at TopN=100 (FIX3–FIX7B state). See §9. |
| RECOMMENDED_FIX | Change `?? true` → `?? false` on line 1647 of DoctrineDrainController.cs (requires separate operator approval before apply) |
| RECOMMENDED_DB_HANDLING | Three options (§13): A=reclassify and continue, B=truncate+re-run parcel, C=fresh DB. Do not mutate without operator decision. |
| FILES_CHANGED | 1 new file: `docs/data/PACS_SYNC_SCALE_001X_TOPN_PROPAGATION_FAILURE.md` |
| NEXT_WORK_ORDER | Operator decides: (1) apply FullCorpus default fix, (2) decide DB handling option A/B/C, (3) approve SCALE-001 resume with correct payloads |
