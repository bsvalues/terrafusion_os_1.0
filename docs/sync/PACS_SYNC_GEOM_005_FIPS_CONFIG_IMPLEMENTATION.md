# GEOM-005I — FIPS-Keyed ArcGIS Config Implementation

**WO**: WO-DATA-004C-GEOM-005I  
**Branch**: `feat/geometry-fips-config`  
**Commit**: `e8250ab26`  
**Date**: 2026-06-19  
**Status**: COMPLETE

---

## Problem

`ArcGisFeatureServiceOptions.Counties` was keyed by `County.Id` GUID.  
County GUIDs change on every DB provisioning — any DB built before GEOM-002's
`19190019-1919-1919-1919-191919191919` sentinel produced a different GUID, silently
breaking geometry drain config resolution (config lookup returned `null`, drain 404'd).

## Solution

Key the `Counties` dictionary by **FIPS code** — the stable, immutable county identifier
assigned by the US Census Bureau. FIPS codes never change across DB provisioning.

- Benton County WA → **`"53005"`**
- The GUID is now optional metadata (`CountyId: Guid?`) on `CountyArcGisOptions`, used
  only by the nightly sync hosted service for DB row stamping.

## Config Shape

```json
"ArcGisFeatureServices": {
  "Counties": {
    "53005": {
      "ParcelFeatureServiceUrl": "https://services7.arcgis.com/...",
      "ApnAttributeName": "geo_id",
      "ObjectIdAttributeName": "OBJECTID",
      "OutSpatialReferenceEpsg": 4326,
      "RequestTimeoutSeconds": 120,
      "CountyId": "19190019-1919-1919-1919-191919191919"
    }
  }
}
```

`CountyId` is **optional** in config. The hosted service warns and skips entries where
`CountyId` is absent; the drain controller resolves `CountyId` from the DB, not config.

## Lookup Behavior

```csharp
// Case-insensitive string match on FIPS key
GetForCounty("53005")    // → Benton config
GetForCounty("53005")    // → same (case-insensitive)
GetForCounty("99999")    // → null (unknown county)
```

The drain controller enforces two guards before calling the landing service:
- **400** if `county.FipsCode` is null or empty (DB row has no FIPS)
- **404** if no config entry exists for `county.FipsCode`

## Signature Changes

| Interface | Old | New |
|---|---|---|
| `IArcGisFeatureServiceClient` | `FetchParcelsAsync(Guid countyId, CT)` | `FetchParcelsAsync(string fipsCode, Guid countyId, CT)` |
| `IArcGisRawLandingService` | `LandParcelGeomsAsync(Guid countyId, string op, CT)` | `LandParcelGeomsAsync(string fipsCode, Guid countyId, string op, CT)` |
| `IArcGisSyncService` | `SyncCountyAsync(Guid countyId, string op, CT)` | `SyncCountyAsync(string fipsCode, Guid countyId, string op, CT)` |

## Files Changed

**Source (12 files):**
- `TerraFusion.Core/Configuration/ArcGisFeatureServiceOptions.cs` — `GetForCounty(string)`, `CountyId: Guid?`
- `TerraFusion.Core/GIS/ArcGisRest/IArcGisFeatureServiceClient.cs`
- `TerraFusion.Core/GIS/ArcGisRest/ArcGisFeatureServiceClient.cs`
- `TerraFusion.Core/GIS/ArcGisRest/IArcGisSyncService.cs`
- `TerraFusion.Core/GIS/ArcGisRest/ArcGisNightlySyncHostedService.cs`
- `TerraFusion.Core/Sync/ArcGisRawLanding/IArcGisRawLandingService.cs`
- `TerraFusion.Data/Services/GisTf/ArcGisSyncService.cs`
- `TerraFusion.Data/Services/LegacyArcGisRaw/ArcGisRawLandingService.cs`
- `TerraFusion.API/Controllers/DoctrineDrainController.cs`
- `TerraFusion.API/Controllers/CanonicalDebugController.cs`
- `TerraFusion.API/appsettings.Development.json`
- `TerraFusion.API/publish/appsettings.Development.json`

**Tests (6 files, 1 new):**
- `GisTf/ArcGisFeatureServiceOptionsTests.cs` — FIPS key tests
- `GisTf/ArcGisRest/ArcGisFeatureServiceClientTests.cs`
- `GisTf/ArcGisRest/ArcGisSyncServiceTests.cs`
- `GisTf/ArcGisRest/ArcGisNightlySyncHostedServiceTests.cs`
- `LegacyArcGisRaw/ArcGisRawLandingServiceTests.cs`
- `GisTf/DoctrineDrainGeometryFipsTests.cs` ← NEW (4 guard-behavior tests)

## Build Status

```
Build succeeded.
0 Error(s)
6 Warning(s) — pre-existing XML doc warnings in SyncController.cs / ModuleLoaderService.cs
```

Unit.Tests project has pre-existing compilation failures in `CanonicalTf`, `TruthPacs`,
and `Prometheus` namespaces (constructor signatures, missing methods) that predate GEOM-005
and are not in the GisTf/LegacyArcGisRaw scope of this work order.

## Constraints Honored

- No geometry executed
- No ArcGIS called
- No DB mutated
- No PACS touched
- No TopN=500 / full-corpus run
- Worktree isolation maintained (`tf-geom-005` only)

## Next Work Order

Operator decides: TopN=100 ArcGIS live probe (GEOM-003 gate not yet authorized).
Per memory: `GEOM-003 no-network gate PASSED 18/18. Live TopN=100 ArcGIS probe NOT yet authorized — explicit operator go-ahead required.`
