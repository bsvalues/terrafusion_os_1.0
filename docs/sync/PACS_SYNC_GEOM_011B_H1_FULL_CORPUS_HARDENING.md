# GEOM-011B-H1: ArcGIS Pagination Full-Corpus Hardening

**Work Order**: WO-DATA-004C-GEOM-011B-H1
**Base**: main @ `9c3f2f67e` (branch `fix/geom-011b-h1-pagination-hardening`)
**Date**: 2026-06-20
**Type**: Code hardening only. No full corpus. No GEOM-011C. No live ArcGIS (tests use mocks). No PACS. No DB mutation except in-memory test DB.

---

## Finding being addressed

GEOM-011B (TopN=5,000) passed, but the ArcGIS server under-fills every page, so a
full-corpus run will issue ~80–90 page requests. CodeRabbit flagged that the D1 paged
landing loop calls `SaveChangesAsync` per page but never detaches the persisted entities,
so the EF `ChangeTracker` would **accumulate every landed geometry row** across all pages.
At full corpus (~80k rows) this is a memory and change-detection throughput risk that could
turn a clean proof into a performance/OOM failure.

---

## Hardening approach

After each successful per-page `SaveChangesAsync`, detach the geometry entities that were
just persisted, so the tracker holds none of them going into the next page:

```csharp
// Per-page save keeps memory bounded across large corpus.
await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

// GEOM-011B-H1: detach the geometry entities just persisted so the EF ChangeTracker
// does not accumulate thousands of landed rows across pages during a full-corpus run.
foreach (var entry in _db.ChangeTracker
             .Entries<LegacyArcGisRawParcelGeom>().ToList())
    entry.State = EntityState.Detached;
```

### Why detach-by-type instead of `ChangeTracker.Clear()`

A blanket `ChangeTracker.Clear()` would also detach the `LoadBatch` (`batch`) entity, which
is created before the loop and updated **after** it (`batch.Status = "COMPLETED"`,
`RowsExtracted`, `RowsPromoted`) and in the catch path (`batch.Status = "FAILED"`). A
detached batch would silently not persist those updates. Detaching only the page's
`LegacyArcGisRawParcelGeom` entries removes the bulk (1000/page) while keeping the single
`LoadBatch` tracked — satisfying requirement #4 (preserve transaction/batch semantics).

---

## Why it is safe

- **Entities are already persisted** before detach — `SaveChangesAsync` returns before the
  loop body detaches. Detach only drops change-tracking, not data.
- **Batch semantics preserved** — the `LoadBatch` stays tracked; COMPLETED/FAILED finalize
  updates persist exactly as before.
- **Cross-page dedup preserved** — dedup uses an in-memory `HashSet<(Guid,long)> seenKeys`,
  independent of the EF tracker. Detaching entities does not affect it.
- **Pagination stop logic unchanged** — loop still terminates on
  `totalConsidered >= targetCount` or an empty page. No change to TopN / full-corpus guard.
- **D2 (truth promotion) and D3 (canonical projection) untouched** — change is confined to
  the D1 paged landing loop in `LandParcelGeomsPagedAsync`.
- **Non-paged `LandParcelGeomsAsync` untouched.**

---

## ChangeTracker behavior

| | Before H1 | After H1 |
|---|---|---|
| Geometry entities tracked after page N | N × pageSize (cumulative) | 0 (detached each page) |
| `LoadBatch` tracked | yes | yes (unchanged) |
| Peak tracked geometry entities | full landed count (~80k at corpus) | ≤ one page (~1000) |

---

## Tests / build

- **New test**: `ArcGisRawLandingServicePagedTests.LandParcelGeomsPagedAsync_DoesNotAccumulateTrackedGeometryEntitiesAcrossPages`
  — lands 3,000 rows across 3 pages, then asserts
  `db.ChangeTracker.Entries<LegacyArcGisRawParcelGeom>().Count() == 0`.
  Without the fix this would be 3,000.
- **Paged service tests**: 8/8 PASS (7 prior + 1 new).
- **All GIS tests**: 46/46 PASS (no regression).
- **Build**: TerraFusion.Data Release — 0 warnings, 0 errors.

---

## Final Report

```
RESULT                   PASS — hardening applied, tests green
FILES_CHANGED            backend/src/TerraFusion.Data/Services/LegacyArcGisRaw/ArcGisRawLandingService.cs
                         backend/TerraFusion.API.Tests/GIS/ArcGisRawLandingServicePagedTests.cs
                         docs/sync/PACS_SYNC_GEOM_011B_H1_FULL_CORPUS_HARDENING.md
HARDENING_APPROACH       Detach per-page LegacyArcGisRawParcelGeom entities after each
                         SaveChangesAsync; LoadBatch stays tracked (batch-safe equivalent
                         of ChangeTracker.Clear()).
CHANGETRACKER_BEHAVIOR   Peak tracked geometry entities reduced from full landed count to
                         ≤ one page; LoadBatch tracking preserved.
PAGINATION_LOGIC_CHANGED NO (targetCount/totalConsidered stop logic unchanged)
D2_D3_CHANGED            NO
TESTS                    Paged service 8/8 PASS (incl. new accumulation test); all GIS 46/46 PASS
BUILD_STATUS             TerraFusion.Data Release: 0 warnings / 0 errors
FULL_CORPUS_RUN          NO — no full corpus executed; no live ArcGIS (mocks only)
LOCAL_COMMIT_OR_PR       local commit on fix/geom-011b-h1-pagination-hardening (see git log)
NEXT_WORK_ORDER          WO-DATA-004C-GEOM-011C — Full-corpus demo (LOCKED; review H1 first)
```

No full corpus ran. GEOM-011C remains LOCKED pending review of this hardening.
