# WO-SR-005B-A - Atlas Adapter and Standalone Parity Preparation

## Verdict

`IMPLEMENTATION_READY_AS_TWO_REPOSITORY_SEQUENCE`

The frozen `atlas.spatial-read@1.0.0` contract can be adopted without provider access, county data,
runtime wiring, or source extraction. The safe sequence is:

1. `WO-SR-005B-E1` implements and tests one pure sovereign adapter over the authenticated,
   county-isolated canonical geometry read DTO. The adapter is not registered in DI and no endpoint
   or consumer calls it.
2. `WO-SR-005B-E2` materializes the hash-pinned schema and synthetic fixtures in
   `bsvalues/terrafusion-atlas`, adds a dependency-free compatibility/parity harness, and proves a
   provider-neutral polygon/centroid/unavailable map projection. It does not extract product source.

Atlas source extraction remains blocked until both nodes pass.

## Inspection Basis

| Surface | Exact revision | Result |
| --- | --- | --- |
| Sovereign base | `d0dfaae01561ac1dda7c42ced2b03f0b82f4c526` | Frozen contract present; source remains authoritative |
| Standalone Atlas | `86999064de0bf590060f307789a6e5c3305d4171` | Private bootstrap only; no product source extracted |
| Standalone required checks | live branch protection | `suite-ci`, `contract-compat`, `governance-gate`; strict and admin-enforced |

The standalone declaration still names only `crosscut.audit@1.0.0` and the older sovereign freeze
SHA. Updating that declaration is part of WO-SR-005B-E2, not this read-only preparation WO.

## Source Boundary Findings

### Accepted canonical source

The implementation input is
`backend/src/TerraFusion.Core/DTOs/GisTf/ParcelGeometryResponse.cs`, returned through the authenticated
`GET /api/parcels/{tfParcelId}/geometry` controller. The source DTO carries `TfParcelId`, `CountyId`,
WGS-84 polygon WKT, centroid, area, provenance, and active state. The controller rejects missing
county context and cross-county lookup before returning the payload.

The adapter must be a pure transformation. It may receive an already-materialized
`ParcelGeometryResponse`; it must not query a database, resolve a provider, inspect claims, or call a
service.

### Rejected legacy source

The combined `GET /api/atlas/gis/parcels/{parcelId}` surface and `GisDataService` are not an eligible
adapter source:

- the controller actions are currently anonymous;
- the store lookup predicates only on parcel ID and does not carry county identity in the result;
- the DTO includes forbidden cross-lane fields such as owner name, image URL, sketch URL, tax area,
  and land class;
- the flood layer emits a stub `X / Minimal risk` value that cannot become contract evidence; and
- its `source` vocabulary does not match the frozen evidence-state contract.

The preparation packet does not repair that legacy surface and does not route around its defects.

## Exact Adapter Mapping

| Frozen contract field | Canonical input / rule | Fail-closed rule |
| --- | --- | --- |
| request `countyId` | caller-supplied string; must equal `source.CountyId` in canonical `D` format | reject mismatch or unparsable value |
| request `parcelId` | caller-supplied string; must equal `source.TfParcelId` in canonical `D` format | reject mismatch or unparsable value |
| `schemaVersion` | literal `1.0.0` | no caller override |
| result `countyId` | `source.CountyId.ToString("D")` | never infer/default |
| result `parcelId` | `source.TfParcelId.ToString("D")` | never substitute provider ID |
| result `evidenceState` | `canonical` | source must be active and structurally valid |
| boundary `geometryState` | `polygon` | invalid/unsupported WKT is rejected, not downgraded |
| boundary `centroid` | longitude=`CentroidLon`, latitude=`CentroidLat` | coordinate ranges enforced |
| boundary `areaSquareFeet` | decimal conversion of `AreaSqFt` | negative/non-finite rejected |
| boundary `areaAcres` | `AreaSqFt / 43560m` | derived only from accepted area |
| boundary `outerRing` | outer ring parsed from single `POLYGON` WKT as longitude/latitude pairs | reject multipolygon, holes, open ring, fewer than four points, non-finite/out-of-range values |
| boundary `dimensions` | absent | source DTO has no dimensions |
| layers `zoning` | absent | no canonical source in this slice |
| layers `flood` | absent | legacy stub is not evidence |

`LastSyncedAt` and `SourceServiceUrl` remain sovereign provenance and do not cross the suite contract.

## WO-SR-005B-E1 - Sovereign Adapter Slice

### Exact files

- `backend/src/TerraFusion.API/Adapters/AtlasSpatialReadAdapter.cs`
- `backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasSpatialReadAdapterTests.cs`
- WO evidence and routing under `docs/brain/workorders/**`

### Required assertions

- a valid canonical polygon maps field-for-field to `atlas.spatial-read@1.0.0`;
- county and parcel mismatches fail closed;
- inactive source, unsupported WKT, open ring, insufficient points, invalid coordinates, and invalid
  area fail closed;
- no owner, valuation, document, workflow, tax-area, land-class, URL, token, or provider query field
  is present in the result;
- the adapter has no DI registration, controller call, provider call, database call, or runtime
  consumer.

### Validation

- targeted adapter unit tests;
- `dotnet build backend/TerraFusion.sln -c Release` with zero warnings;
- frozen contract verifier and its tests;
- work-order query/tests and `git diff --check`.

## WO-SR-005B-E2 - Standalone Synthetic Parity Slice

### Destination scope

- update `canon/CONTRACT_DEPENDENCY.md` with the exact sovereign freeze SHA and
  `atlas.spatial-read@1.0.0`;
- materialize the frozen schema and seven synthetic fixtures under a clearly marked immutable
  contract-compat directory with source SHA and hashes;
- add a dependency-free verifier and pure map projection for `polygon`, `centroid_only`, and
  `unavailable` states;
- update only the existing `contract-compat` check to run that verifier;
- record contract materialization evidence without claiming product-source extraction.

### Parity assertions

- all four positive fixtures produce the same accepted state and normalized JSON as the sovereign
  verifier;
- county mismatch, open ring, and cross-lane fields fail;
- polygon projects to one GeoJSON Polygon with longitude-first coordinates;
- centroid-only projects to one GeoJSON Point;
- unavailable produces no feature and no invented location;
- no Mapbox, ArcGIS, PACS, SQL, county dataset, credential, network, browser, or live-service input is
  used.

## Provenance And Rollback

- Sovereign source remains authoritative throughout E1 and E2.
- No extracted source is deleted or retired.
- E1 rollback is removal of the unwired adapter and tests.
- E2 rollback is removal of the mirrored contract-compat material and restoration of the bootstrap
  declaration/check.
- Any ownership cutover, provider integration, runtime adoption, or duplicate retirement requires a
  later Work Order after both parity gates pass.

## Preparation Validation

- source and destination inspection: read-only;
- runtime/backend/frontend/GIS package changes: none;
- provider/county/PACS/SQL/secret/live access: none;
- destination writes: none;
- `git diff --check`: required;
- `node docs/brain/workorders/tools/wo-query.mjs --json`: required;
- work-order tooling tests: required.

## Next

`WO-SR-005B-E1 - Atlas Sovereign Spatial Read Adapter Implementation` is admitted as the only active
node. WO-SR-005B-E2 remains dependency-blocked on E1, and extraction remains blocked on both.
