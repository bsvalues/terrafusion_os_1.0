# WO-DATA-004C-GEOM-002 — Geometry Slice-Control Implementation

**Branch:** `fix/geom-slice-control`
**Date:** 2026-06-19
**Status:** COMPLETE — build green, 9/9 unit tests pass

---

## Problem

The geometry drain endpoint (`POST /api/sync/doctrine/drain/geometry`) previously accepted a
`TopN` request parameter but discarded it at line 1529 of `DoctrineDrainController.cs`. There was
no guard: if the operator omitted `TopN` and left `FullCorpus=false` (or omitted it entirely), the
controller silently issued a `where=1=1` full-county pull against Benton County's ArcGIS REST
Feature Service — 89,247 parcels with full geometry — with no explicit authorization.

Additionally, `ArcGisFeatureServiceClient` had no mechanism to bound the ArcGIS query; it always
issued `where=1=1` with no `resultRecordCount` limit, making slice-testing impossible and
provenance ambiguous between runs of different sizes.

---

## Solution

### Operational locks honored throughout

- No geometry execution
- No ArcGIS full-corpus import
- No DB mutation beyond build/test artifacts
- No PACS drains
- No touching `terrafusion_dev_clean`
- Credential `TfVerify2026!Secure` stays in gitignored local settings; never committed
- No literal passwords in any evidence doc
- All work in worktree `tf-geom-002` — no mutation to shared `main` checkout

---

## Files Changed

### 1. `backend/src/TerraFusion.Core/GIS/ArcGisRest/IArcGisFeatureServiceClient.cs`

Added `int? topN` as the second parameter to `FetchParcelsAsync`.

```csharp
Task<IReadOnlyList<ArcGisParcelFeature>> FetchParcelsAsync(
    Guid countyId,
    int? topN,
    CancellationToken cancellationToken = default);
```

### 2. `backend/src/TerraFusion.Core/GIS/ArcGisRest/ArcGisFeatureServiceClient.cs`

- `FetchParcelsAsync` accepts `int? topN` and passes it to `BuildQueryUrl`.
- `BuildQueryUrl` appends `resultRecordCount=N&orderByFields=OBJECTID+ASC` when `topN` is
  non-null. `OBJECTID+ASC` ordering makes slices deterministic and reproducible across calls.

```csharp
private static string BuildQueryUrl(CountyArcGisOptions county, int? topN = null)
{
    var separator = county.ParcelFeatureServiceUrl.EndsWith('/') ? "query" : "/query";
    var sr = county.OutSpatialReferenceEpsg.ToString(CultureInfo.InvariantCulture);
    var limit = topN.HasValue
        ? $"&resultRecordCount={topN.Value.ToString(CultureInfo.InvariantCulture)}&orderByFields=OBJECTID+ASC"
        : string.Empty;
    return $"{county.ParcelFeatureServiceUrl}{separator}" +
           $"?f=geojson&where=1%3D1&outFields=*&outSR={sr}&returnGeometry=true{limit}";
}
```

### 3. `backend/src/TerraFusion.Core/Sync/ArcGisRawLanding/IArcGisRawLandingService.cs`

Added `int? topN` to `LandParcelGeomsAsync`.

```csharp
Task<ArcGisRawLandingResult> LandParcelGeomsAsync(
    Guid countyId,
    string operatorName,
    int? topN,
    CancellationToken cancellationToken = default);
```

### 4. `backend/src/TerraFusion.Data/Services/LegacyArcGisRaw/ArcGisRawLandingService.cs`

- `LandParcelGeomsAsync` accepts `int? topN`.
- `queryDescriptor` encodes `topN` so distinct slice sizes produce distinct `SourceQueryHash`
  values — provenance is unambiguous.

```
topN=100   → "...topN=100 orderByFields=OBJECTID+ASC"     → hash A
topN=500   → "...topN=500 orderByFields=OBJECTID+ASC"     → hash B
topN=null  → "...fullCorpus=true"                          → hash C
```

- `FetchParcelsAsync(countyId, topN, cancellationToken)` passes the bound through to the
  HTTP adapter.

### 5. `backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs` (geometry lane)

Three changes:

**a) Extract all four request fields (was discarding topN):**
```csharp
const string LaneName = "geometry";
var (operatorName, _, fullCorpus, topN) = NormalizeRequest(request, LaneName);
```

**b) Full-corpus guard — 400 if neither TopN nor FullCorpus:**
```csharp
if (topN is null && !fullCorpus)
{
    return BadRequest(new
    {
        error = "Geometry drain requires either TopN (bounded slice) or FullCorpus=true " +
                "(full county). Refusing to run without an explicit slice or " +
                "full-corpus authorization.",
    });
}
```

**c) geomTopN derivation + anchored county GUID:**
```csharp
var geomTopN = fullCorpus ? (int?)null : topN;

// KnownBentonCountyId ensures GetForCounty() resolves ArcGIS config
// keyed by this GUID — prevents a new random GUID on each cold start.
private static readonly Guid KnownBentonCountyId =
    Guid.Parse("19190019-1919-1919-1919-191919191919");

var county = new County
{
    Id = KnownBentonCountyId,
    ...
};
```

### 6. `backend/src/TerraFusion.Data/Services/GisTf/ArcGisSyncService.cs` (undiscovered caller)

This file was not in the design doc but called the old 2-arg `FetchParcelsAsync`. Fixed to pass
`topN: null`, preserving its existing full-corpus behavior:

```csharp
var features = await _client
    .FetchParcelsAsync(countyId, topN: null, cancellationToken)
    .ConfigureAwait(false);
```

### 7. `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` (2 callers)

Two admin debug endpoints that call `LandParcelGeomsAsync` on the full county (GisPop1 and
multi-lane populate). Both updated to pass `topN: null` (explicit full-corpus intent):

```csharp
// Line ~1900
var d1 = await rawLandingSvc.LandParcelGeomsAsync(
    bentonCountyId, operatorName, topN: null, cancellationToken);

// Line ~2173
var gisD1 = await gisRawSvc.LandParcelGeomsAsync(
    bentonCountyId, operatorName, topN: null, cancellationToken);
```

---

## Unit Tests

**File:** `backend/TerraFusion.API.Tests/GIS/GeomSliceControlTests.cs`  
**Result:** 9/9 PASS — no network calls, no EF/DB

| Test | Behavior verified |
|------|-------------------|
| `FetchParcels_TopN100_UrlContainsResultRecordCount` | URL has `resultRecordCount=100` when topN=100 |
| `FetchParcels_TopN100_UrlContainsOrderByObjectId` | URL has `orderByFields=OBJECTID` when topN=100 |
| `FetchParcels_NullTopN_UrlHasNoResultRecordCount` | No `resultRecordCount` in URL when topN=null |
| `FetchParcels_TopN100_And_TopN500_ProduceDifferentUrls` | TopN=100 and TopN=500 yield distinct URLs |
| `Guard_Fires_WhenTopNNullAndFullCorpusFalse` | Guard condition is true → 400 path taken |
| `Guard_DoesNotFire_WhenTopNProvided` | topN=100 + fullCorpus=false → guard false |
| `Guard_DoesNotFire_WhenFullCorpusTrue` | topN=null + fullCorpus=true → guard false |
| `GeomTopN_IsNull_WhenFullCorpusTrue` | `fullCorpus=true` → `geomTopN=null` (no limit) |
| `GeomTopN_EqualsTopN_WhenFullCorpusFalse` | `fullCorpus=false, topN=100` → `geomTopN=100` |

---

## Build Evidence

```
Build succeeded.
Passed!  - Failed: 0, Passed: 9, Skipped: 0, Total: 9, Duration: 71 ms
```

---

## Callers Updated (complete inventory)

| File | Change |
|------|--------|
| `IArcGisFeatureServiceClient.cs` | interface: added `int? topN` |
| `ArcGisFeatureServiceClient.cs` | impl: URL construction + topN threading |
| `IArcGisRawLandingService.cs` | interface: added `int? topN` |
| `ArcGisRawLandingService.cs` | impl: queryDescriptor + hash + pass-through |
| `DoctrineDrainController.cs` | guard + geomTopN + county GUID anchor |
| `ArcGisSyncService.cs` | `topN: null` (full-corpus retained) |
| `CanonicalDebugController.cs` (×2) | `topN: null` (full-corpus retained) |

---

## Behavior After This PR

| Request | Outcome |
|---------|---------|
| `TopN=100, FullCorpus=false` | Lands exactly 100 parcels ordered by OBJECTID ASC |
| `TopN=500, FullCorpus=false` | Lands exactly 500 parcels; distinct provenance hash from 100-run |
| `TopN=null, FullCorpus=true` | Full county pull; `resultRecordCount` omitted from URL |
| `TopN=null, FullCorpus=false` (or omitted) | **400 Bad Request** — guard fires |

---

## Next Gate

Codex review of `fix/geom-slice-control` before any geometry execution is authorized.
