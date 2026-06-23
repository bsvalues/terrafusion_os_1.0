# BENTON_DEMO_SALES_001A_STALL_FIX

**Work Order:** WO-DATA-FINALIZE-SALES-001A — Sales Full-Corpus Stall Fix  
**Date:** 2026-06-22  
**Branch:** fix/land-drain-propsupp-bulk-source  
**Worktree:** C:/Users/bsval/tf-data-finalize-002

---

## RESULT

**COMPLETE — code only.** Both root causes of the WO-DATA-FINALIZE-SALES-001 stall are fixed. Sales drain was NOT rerun. S4 restore was NOT performed. DB is unchanged.

---

## FAILURE_SUMMARY

WO-DATA-FINALIZE-SALES-001 stalled after landing 56,500 / 440,274 rows (12.8%). Two root causes:

1. **ORDER BY stall:** `SqlServerPacsSaleSource` unconditionally emitted `ORDER BY chg_of_owner_id DESC, copa.prop_id` on both TopN and full-corpus queries. For the 440k-row JOIN, SQL Server was forced to sort the entire result through tempdb before streaming. The stream opened, delivered 56,500 rows, then blocked at `ReadAsync()`. `CommandTimeout = 600` does not apply to mid-stream stalls.

2. **Zombie batch:** When the curl 2h timeout fired, ASP.NET cancelled the request `CancellationToken`, causing `ReadAsync` to throw `OperationCanceledException`. The landing service catch clause `when (ex is not OperationCanceledException)` excluded it, so `batch.Status` was never written to `FAILED`. The `LoadBatch` row was permanently stuck at `IN_PROGRESS`. Same bug in all 11 landing services.

---

## FILES_CHANGED

| File | Change |
|------|--------|
| `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsSaleSource.cs` | Extract `BuildQuery(int? topN)` internal static; make ORDER BY conditional on `_topN.HasValue` |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsSaleLandingService.cs` | Add OCE catch before existing catch block |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsAccountLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsImprvAttrLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsImprvDetailLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsImprvLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsLandDetailLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsOwnerLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsPropSuppAssocLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsPropertyLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsPropertyValLandingService.cs` | Add OCE catch |
| `backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsWashPropOwnerValLandingService.cs` | Add OCE catch |
| `backend/tests/TerraFusion.Unit.Tests/LegacyPacsRaw/SqlServerPacsSaleSourceQueryTests.cs` | New: 8 tests covering full-corpus/TopN query shape |
| `backend/tests/TerraFusion.Unit.Tests/LegacyPacsRaw/PacsSaleLandingServiceTests.cs` | Added 2 tests + `CancellingPacsSaleSource` test double |

---

## SALES_ORDER_BY_FIX

**File:** `SqlServerPacsSaleSource.cs`

**Before:**
```csharp
var topClause = _topN.HasValue ? $"TOP {_topN.Value} " : "";
var dateFilter = _topN.HasValue
    ? "WHERE s.sl_dt >= '2018-01-01'"
    : "";
var sql = $@"
    SELECT {topClause}s.chg_of_owner_id, ...
    FROM dbo.sale s
    INNER JOIN dbo.chg_of_owner_prop_assoc copa
        ON copa.chg_of_owner_id = s.chg_of_owner_id
    {dateFilter}
    ORDER BY s.chg_of_owner_id DESC, copa.prop_id";   // ← ALWAYS present
```

**After:**
```csharp
// SQL building extracted to internal static BuildQuery(int? topN) for testability.
var sql = BuildQuery(_topN);

// BuildQuery:
var topClause   = topN.HasValue ? $"TOP {topN.Value} " : "";
var dateFilter  = topN.HasValue ? "WHERE s.sl_dt >= '2018-01-01'" : "";
var orderClause = topN.HasValue ? "ORDER BY s.chg_of_owner_id DESC, copa.prop_id" : "";
// ORDER BY absent on full-corpus → SQL Server streams hash-join result directly,
// no tempdb sort required for 440k rows.
```

**Behavior change:**
- `topN = null` (full-corpus): no ORDER BY, no TOP, no date filter → SQL Server streams JOIN result without tempdb sort
- `topN = N` (proof run): ORDER BY DESC + TOP N + date filter → unchanged from before

---

## CANCELLATION_FIX

**Pattern applied to all 11 landing services:**

**Before:**
```csharp
// OperationCanceledException was excluded from catch — left batch IN_PROGRESS forever
catch (Exception ex) when (ex is not OperationCanceledException)
{
    batch.Status = "FAILED";
    ...
}
```

**After:**
```csharp
// New OCE catch before the existing block:
catch (OperationCanceledException)
{
    batch.Status = "CANCELLED";
    batch.CompletedAt = DateTime.UtcNow;
    batch.ErrorSummary = "Cancelled by caller (request timeout or explicit cancellation).";
    await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
    _logger.LogWarning("PACS <lane> landing CANCELLED. batch={BatchId}", batch.LoadBatchId);
    throw;  // re-throw so DoctrineDrainController sees cancellation
}
catch (Exception ex) when (ex is not OperationCanceledException)
{
    batch.Status = "FAILED";
    ...
}
```

The `throw` re-propagates the OCE so the controller can return an appropriate HTTP response. The `CancellationToken.None` SaveChanges ensures the write completes even though the request token is cancelled.

---

## LANDING_SERVICES_PATCHED

All 11 services received the OCE catch block:

1. `PacsSaleLandingService.cs`
2. `PacsAccountLandingService.cs`
3. `PacsImprvAttrLandingService.cs`
4. `PacsImprvDetailLandingService.cs`
5. `PacsImprvLandingService.cs`
6. `PacsLandDetailLandingService.cs`
7. `PacsOwnerLandingService.cs`
8. `PacsPropSuppAssocLandingService.cs`
9. `PacsPropertyLandingService.cs`
10. `PacsPropertyValLandingService.cs`
11. `PacsWashPropOwnerValLandingService.cs`

---

## TESTS

### New: `SqlServerPacsSaleSourceQueryTests.cs` (8 tests)

| Test | Assertion |
|------|-----------|
| `FullCorpus_Query_DoesNotContainOrderBy` | `BuildQuery(null)` SQL has no ORDER BY |
| `FullCorpus_Query_DoesNotContainTopClause` | `BuildQuery(null)` SQL has no TOP |
| `FullCorpus_Query_DoesNotContainDateFilter` | `BuildQuery(null)` SQL has no WHERE date filter |
| `TopN_Query_ContainsOrderBy` | `BuildQuery(250)` SQL has ORDER BY |
| `TopN_Query_ContainsTopClause` | `BuildQuery(250)` SQL has TOP 250 |
| `TopN_Query_ContainsDateFilter` | `BuildQuery(250)` SQL has WHERE sl_dt >= 2018 |
| `BothVariants_SelectAllRequiredColumns` | Both variants select all 8 required columns |
| `BothVariants_JoinChgOfOwnerPropAssoc` | Both variants join chg_of_owner_prop_assoc |

### Added to `PacsSaleLandingServiceTests.cs` (2 tests)

| Test | Assertion |
|------|-----------|
| `Cancellation_MarksLoadBatchCancelled_AndRethrows` | Mid-stream OCE → batch.Status = CANCELLED, exception re-thrown |
| `NonCancellation_Exception_StillMarksLoadBatchFailed` | Non-OCE exception → batch.Status = FAILED (regression guard) |

---

## BUILD_STATUS

```
dotnet build TerraFusion.sln   → exit 0, 0 errors, 0 warnings (CS)
dotnet test (targeted: 20)     → Passed: 20, Failed: 0
dotnet test (full suite: 3431) → Passed: 3431, Failed: 0, Skipped: 0
```

---

## SALES_RERUN

**NOT performed.** This work order is code-only. Sales drain was not rerun. `legacy_pacs_raw.sale` still contains the 56,500 zombie rows from WO-DATA-FINALIZE-SALES-001.

---

## DB_RESTORE

**NOT performed.** S4 snapshot restore (`terrafusion_benton_demo_S4_post_land.dump`) is reserved for WO-DATA-FINALIZE-SALES-002. Current DB state is unchanged from diagnosis:
- `legacy_pacs_raw.sale` = 56,500 (zombie batch)
- `sync_bridge.load_batch` batch `10821864-...` = IN_PROGRESS (zombie)
- `truth_pacs.sale` = 0
- `canonical_tf.tf_sale` = 0

---

## PR

Opening against `main`. See PR for diff.

---

## NEXT_WORK_ORDER

**WO-DATA-FINALIZE-SALES-002 — Restore S4 and Rerun Full Sales**

Steps:
1. Restore `terrafusion_benton_demo_S4_post_land.dump` to `terrafusion_benton_demo`.
2. Rebuild worktree API DLL from this branch.
3. Verify post-restore state (tf_parcel=83,326 / tf_owner=97,062 / tf_improvement=100,144 / tf_land=87,767, sale=0).
4. Submit `POST /api/sync/doctrine/drain/sales` with `{"fullCorpus":true,"operatorName":"WO-DATA-FINALIZE-SALES-002"}`.
5. Monitor until `canonical_tf.tf_sale > 0` and batch `COMPLETED`.
6. Write `docs/data/BENTON_DEMO_SALES_FULL_RUN_RESULTS.md`.
7. Commit + push + PR to main.

Expected full corpus: **440,274 JOIN rows**.
