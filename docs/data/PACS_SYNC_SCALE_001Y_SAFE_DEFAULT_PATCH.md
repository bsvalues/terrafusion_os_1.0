# WO-DATA-004B-SCALE-001Y — Drain Request Safe Default Patch

**Work Order:** WO-DATA-004B-SCALE-001Y
**Date:** 2026-06-19
**Status:** PATCH APPLIED — No drain run. No DB mutation. No PACS contact.
**Prerequisite evidence:** PR #1050 (SCALE-001X investigation)

---

## Executive Summary

One-line fix to `DoctrineDrainController.NormalizeRequest`: changed the `FullCorpus`
null-coalescing default from `true` to `false`. A missing request body now defaults to
bounded mode (per-lane safe TopN of 200) instead of triggering a full-corpus import.

Full-corpus runs still work by explicitly passing `"FullCorpus":true` in the body.

---

## 1. Root Cause (from SCALE-001X)

`NormalizeRequest` was the drop point for TopN propagation failure:

```csharp
// Before (DoctrineDrainController.cs line 1647):
var fullCorpus = request?.FullCorpus ?? true;
// When request is null (no body sent) → FullCorpus=true → seedTopN=null → no SQL TOP clause → full corpus
```

SCALE-001A and SCALE-001B were called without a request body. The prior default silently
triggered full-corpus mode on every bodyless call. SCALE-001A completed a near-full Benton
parcel corpus import (~93%, 83,326 rows). SCALE-001B was killed after ~1 hour with 0 rows
committed. See `PACS_SYNC_SCALE_001X_TOPN_PROPAGATION_FAILURE.md` for the full investigation.

---

## 2. The Fix

**File:** `backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs`
**Location:** `NormalizeRequest` private method, line 1647

```csharp
// After (SCALE-001Y patch):
var fullCorpus = request?.FullCorpus ?? false;
// When request is null → FullCorpus=false → seedTopN = topN ?? 200 → bounded by per-lane default
```

**Accessor change:** `NormalizeRequest` was also changed from `private static` to `internal static`
to enable direct unit testing via the existing `InternalsVisibleTo` grant to `TerraFusion.Unit.Tests`.

---

## 3. Behavior Matrix After Patch

| Call pattern | `request` | `FullCorpus` resolved | `seedTopN` | Effect |
|---|---|---|---|---|
| No body (curl without -d) | `null` | `false` ← patched | `200` (per-lane default) | Bounded 200-row slice |
| `{"FullCorpus":false,"TopN":500}` | not null | `false` | `500` | Bounded 500-row slice |
| `{"FullCorpus":true}` | not null | `true` | `null` | Full corpus (explicit) |
| `{"TopN":100}` (no FullCorpus key) | not null | `false` (null-coalesce) | `100` | Bounded 100-row slice |

The last row is a new safe behavior: omitting `FullCorpus` from the body now defaults to
bounded rather than full-corpus.

---

## 4. seedTopN Propagation (unchanged)

The downstream logic is unchanged. Only the `FullCorpus` default changed:

```csharp
// Parcel lane (line ~269) — same pattern in all lanes:
var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);
```

With the patch:
- `FullCorpus=false` and no `TopN` → `seedTopN = 200` (per-lane safe default, not unbounded)
- `FullCorpus=false` and `TopN=500` → `seedTopN = 500`
- `FullCorpus=true` → `seedTopN = null` (full corpus, SQL has no TOP clause)

---

## 5. All Five Affected Endpoints

All five drain endpoints call `NormalizeRequest` and are protected by this fix:

| Endpoint | Lane |
|---|---|
| `POST /api/sync/doctrine/drain/parcel` | parcel |
| `POST /api/sync/doctrine/drain/owner-wsdor` | owner-wsdor |
| `POST /api/sync/doctrine/drain/improvement` | improvement |
| `POST /api/sync/doctrine/drain/land` | land |
| `POST /api/sync/doctrine/drain/sales` | sales |

The geometry endpoint uses a different code path and is not affected.

---

## 6. Unit Tests Added

**File:** `backend/tests/TerraFusion.Unit.Tests/Sync/Doctrine/DoctrineDrainNormalizeRequestTests.cs`

Five test cases added:

| Test | Verifies |
|---|---|
| `NullBody_defaults_to_FullCorpus_false_and_TopN_null` | null body → FullCorpus=false, TopN=null |
| `Body_with_FullCorpus_false_and_TopN_500_passes_through_bounded` | explicit bounded body → FullCorpus=false, TopN=500 |
| `Body_with_FullCorpus_true_is_still_explicit_full_corpus` | explicit full-corpus body → FullCorpus=true, TopN=null |
| `NullBody_operator_name_defaults_to_lane_scoped_name` | null body → OperatorName = "doctrine-drain-{lane}" |
| `NullBody_working_year_defaults_to_2026` | null body → WorkingYear = 2026 |

All 5 pass. No regressions in the full `TerraFusion.Unit.Tests` suite.

---

## 7. Prior Slice Evidence — Impact Assessment

This fix does not invalidate any prior evidence. The controlled-slice drains (FIX3–FIX7B)
all sent correct JSON bodies with `"FullCorpus":false,"TopN":100`. Those results are
accurate and unaffected.

SCALE-001A parcel import (83,326 rows, near-full corpus) was a procedural scope breach
caused by the missing body, not by the pipeline logic. The data is technically clean
(17/17 gates PASS). The `terrafusion_dev_clean` DB classification stands as defined in
the SCALE-001X investigation: valid for completed WO-DATA-004B controlled slices through
sales; additionally contains out-of-scope near-full parcel import; not clean for future
scale proof.

---

## 8. Correct Drain Call Format (post-patch)

Always send a JSON body. The endpoint binding is `[FromBody]` only — there is no
query-string TopN binding.

```bash
# Bounded drain (recommended for scale proof):
curl -X POST "http://localhost:5046/api/sync/doctrine/drain/parcel" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"scale-001a-parcel","WorkingYear":2026,"FullCorpus":false,"TopN":500}'

# Full corpus (explicit opt-in):
curl -X POST "http://localhost:5046/api/sync/doctrine/drain/parcel" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"full-corpus-run","WorkingYear":2026,"FullCorpus":true}'
```

The following call form is NOW SAFE (no body → bounded at 200 rows, not full corpus):
```bash
curl -X POST "http://localhost:5046/api/sync/doctrine/drain/parcel"
# Resolves: FullCorpus=false, TopN=null → seedTopN=200
```

---

## 9. Files Changed

| File | Change |
|---|---|
| `backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs` | `?? true` → `?? false` on line 1647; `private static` → `internal static` on `NormalizeRequest` |
| `backend/tests/TerraFusion.Unit.Tests/Sync/Doctrine/DoctrineDrainNormalizeRequestTests.cs` | New file — 5 unit tests |
| `docs/data/PACS_SYNC_SCALE_001Y_SAFE_DEFAULT_PATCH.md` | This file |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | PATCH APPLIED |
| FILE_CHANGED | `DoctrineDrainController.cs` line 1647 — `?? true` → `?? false` |
| ACCESSOR_CHANGE | `NormalizeRequest` `private` → `internal` (for testability) |
| TESTS_ADDED | 5 new unit tests in `DoctrineDrainNormalizeRequestTests.cs` — all PASS |
| REGRESSIONS | None — full `TerraFusion.Unit.Tests` suite green |
| DRAINS_RUN | None |
| DB_MUTATION | None |
| PACS_CONTACT | None |
| NEXT_WORK_ORDER | WO-DATA-004B-SCALE-001Z — Fresh Scale DB Bootstrap |
