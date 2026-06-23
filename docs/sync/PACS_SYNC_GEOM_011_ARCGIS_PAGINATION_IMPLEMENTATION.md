# GEOM-011: ArcGIS Pagination Implementation

**Work Order**: WO-DATA-004C-GEOM-011  
**Branch**: feat/geom-011-arcgis-pagination  
**Status**: IMPLEMENTATION COMPLETE — build green, 0 errors, 0 warnings  
**Date**: 2026-06-20  

---

## Problem

GEOM-009 confirmed that ArcGIS Feature Service returns at most ~1,974 features per request (server `maxRecordCount` ≈ 2,000). Even `FullCorpus=true` hit the same ceiling. Full Benton corpus is ~89,247 parcels — every single-request drain was silently truncated at ~2%.

---

## Solution

Implement `resultOffset` + `resultRecordCount` + deterministic `orderByFields=OBJECTID+ASC` pagination at the D1 landing layer. A preflight `returnCountOnly=true` request establishes how many features to expect, then a loop pages through until all features are landed.

---

## Files Changed

### New interface methods
**`backend/src/TerraFusion.Core/GIS/ArcGisRest/IArcGisFeatureServiceClient.cs`**
- `FetchPageAsync(fipsCode, countyId, offset, pageSize, ct)` → `(IReadOnlyList<ArcGisParcelFeature>, bool ExceededLimit)`
- `FetchCountAsync(fipsCode, ct)` → `int`

### New config field
**`backend/src/TerraFusion.Core/Configuration/ArcGisFeatureServiceOptions.cs`**  
- `CountyArcGisOptions.PageSize` — default 1000; controls `resultRecordCount` per page

### GeoJSON model
**`backend/src/TerraFusion.Core/GIS/ArcGisRest/ArcGisGeoJson.cs`**  
- `ArcGisGeoJsonFeatureCollection.ExceededTransferLimit` — deserializes `exceededTransferLimit` from ArcGIS response

### Client implementation
**`backend/src/TerraFusion.Core/GIS/ArcGisRest/ArcGisFeatureServiceClient.cs`**  
- `FetchPageAsync` — issues `?resultRecordCount=N&resultOffset=O&orderByFields=OBJECTID+ASC`
- `FetchCountAsync` — issues `?f=json&returnCountOnly=true`, deserializes `{"count": N}`
- `BuildPageUrl` — deterministic paged URL builder
- `BuildCountUrl` — count-only URL builder
- `ArcGisCountResponse` — private record for count deserialization

### Landing service
**`backend/src/TerraFusion.Core/Sync/ArcGisRawLanding/IArcGisRawLandingService.cs`**
- `LandParcelGeomsPagedAsync(fipsCode, countyId, operatorName, pageSize, topN?, ct)` added to interface
- `ArcGisRawLandingResult.TotalPages` + `PaginatedMode` added

**`backend/src/TerraFusion.Data/Services/LegacyArcGisRaw/ArcGisRawLandingService.cs`**
- `LandParcelGeomsPagedAsync` implementation:
  - Preflight `FetchCountAsync` → abort on failure
  - Single root `LoadBatch` for the whole paged run
  - Per-page `FetchPageAsync` loop
  - Cross-page `HashSet<(Guid, long)>` deduplication
  - Per-page `SaveChangesAsync` (memory bounded)
  - Per-page `SourceQueryHash` encodes offset for provenance traceability
  - Safety cap: `ceil(preflightCount / pageSize) * 2 + 1` max pages
  - Stop conditions: empty page, `!exceededTransferLimit`, short page, `totalLanded >= effectiveMax`
  - `WriteGatesAsync` once at end on root batch

### Controller routing
**`backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs`**
- **Identity guard (409)**: if `arcGisCounty.CountyId` is set and doesn't match DB row ID → refuse before any ArcGIS call
- **Paged routing**: `FullCorpus=true` OR `topN > pageSize` → `LandParcelGeomsPagedAsync`; otherwise falls back to existing `LandParcelGeomsAsync` (backward compatible)

### Tests
**`backend/TerraFusion.API.Tests/GIS/GeomSliceControlV2Tests.cs`** — fixed pre-existing compile errors:
- Added `IOptions<ArcGisFeatureServiceOptions>` parameter to all `DrainGeometry` calls
- Fixed `LandParcelGeomsAsync` mock signature: was `(Guid, string, int?, CancellationToken)` → correct `(string, Guid, string, int?, CancellationToken)`
- Added `BuildArcGisOptions(Guid?)` helper
- 409 identity-mismatch tests now wire correctly

**`backend/TerraFusion.API.Tests/GIS/GeomSliceControlPaginationTests.cs`** — NEW (8 tests):
1. `FetchPageAsync_FirstPage_UrlContainsResultRecordCount1000`
2. `FetchPageAsync_FirstPage_UrlContainsResultOffsetZero`
3. `FetchPageAsync_SecondPage_UrlContainsResultOffset1000`
4. `FetchPageAsync_UrlContainsOrderByObjectIdAsc`
5. `FetchPageAsync_UrlContainsFGeojson`
6. `FetchCountAsync_UrlContainsReturnCountOnly`
7. `FetchCountAsync_UrlContainsFJson`
8. `FetchPageAsync_UrlDiffersFromFetchParcels_NoPaginationParams`

---

## Build Verification

```
dotnet build TerraFusion.sln --no-incremental -v q
Build succeeded.
    0 Warning(s)
    0 Error(s)
Time Elapsed 00:02:53
```

---

## Routing Logic Summary

```
DrainGeometry(request):
  geomTopN = fullCorpus ? null : topN
  pageSize  = arcGisCounty.PageSize          // default 1000
  usePaged  = fullCorpus || (topN > pageSize)

  if usePaged:
    LandParcelGeomsPagedAsync(fipsCode, countyId, op, pageSize, geomTopN)
  else:
    LandParcelGeomsAsync(fipsCode, countyId, op, geomTopN)   // backward compat
```

---

## NOT Done Here (Next Gates)

- **GEOM-011A**: `TopN=2000` proof run (requires operator go-ahead)
- **GEOM-011B**: `TopN=5000` proof run (after 011A passes)
- **GEOM-011C**: `FullCorpus=true` full-corpus run (after 011B passes)

No proof runs were executed in this implementation slice per work order.

---

## Security Controls Honoured

- No geometry execution
- No ArcGIS calls outside authorized probe runs
- No DB mutated outside authorized drains
- No PACS touched
- Git mutations confined to the dedicated GEOM-011 worktree only
- No secrets committed
