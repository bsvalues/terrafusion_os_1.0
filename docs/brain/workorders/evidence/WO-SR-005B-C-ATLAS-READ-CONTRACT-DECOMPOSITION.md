# WO-SR-005B-C - Atlas Read Contract Decomposition

## Verdict

`IMPLEMENTATION_READY_WITHOUT_RUNTIME_ADOPTION`

The existing Atlas parcel-boundary and layer concepts support one genuine read-only contract group:
`atlas.spatial-read@1.0.0`. Implementation may add and hash-freeze the contract and synthetic
fixtures, but must not adopt it in runtime services, change payload behavior, publish a package, or
begin extraction in the same Work Order.

## Contract Boundary

The contract is county-scoped, parcel-scoped, provider-neutral, and read-only.

| Record | Required fields | Optional fields |
| --- | --- | --- |
| `AtlasParcelSpatialReadRequest` | `countyId`, `parcelId` | none |
| `AtlasParcelSpatialReadResult` | `schemaVersion`, `countyId`, `parcelId`, `evidenceState`, `boundary`, `layers` | none |
| `AtlasBoundary` | `geometryState` | `centroid`, `dimensions`, `areaAcres`, `areaSquareFeet`, `outerRing` |
| `AtlasCoordinate` | `longitude`, `latitude` | none |
| `AtlasDimensions` | none | front, back, left, right, effective width/depth values |
| `AtlasLayers` | none | `zoning`, `flood` |
| `AtlasZoning` | `evidenceState` | `zoneCode`, `description` |
| `AtlasFlood` | `evidenceState` | `zone`, `risk` |

`evidenceState` is the closed set `canonical`, `provider`, `fallback`, or `unavailable`.
`geometryState` is `polygon`, `centroid_only`, or `unavailable`. Coordinates use WGS-84 longitude
then latitude and are represented structurally, never as provider JSON text.

## Ownership And Exclusions

- Atlas owns boundary geometry, centroid/dimensions, zoning overlay, flood overlay, and spatial
  evidence-state semantics.
- The sovereign base owns county identity, authentication, API hosting, Workbench composition,
  provider configuration, contract publication, and compatibility governance.
- Exclude `ownerName`, image/sketch URLs, assessed/market value, tax area, land class, documents,
  workflow state, audit storage, export custody, ArcGIS/Mapbox URLs, provider query syntax, and token
  names from the suite contract.
- Runtime services may later adapt PACS or provider data to this shape, but those adapters are not
  part of the contract and are not authorized here.

## County And Source Semantics

1. `countyId` is mandatory on request and response; implicit default-county behavior is invalid.
2. A response whose county does not exactly match the request is rejected, not downgraded.
3. `canonical` means sovereign county data accepted by the active county context.
4. `provider` means approved external spatial evidence, not sovereign persistence.
5. `fallback` is partial/non-authoritative evidence and cannot support geometry mutation.
6. `unavailable` must remain explicit; absence cannot be converted into fixture or demo truth.

## Compatibility

- Patch: documentation or annotations only.
- Minor: additive optional fields or new enum-independent records.
- Major: required-field change, coordinate/order change, enum change, county semantics change, or
  ownership transfer. Major changes require one release of deprecation evidence.
- Unknown enum values fail closed at consumers until explicitly supported.

## Synthetic Fixture Set

| Fixture | Required assertion |
| --- | --- |
| `canonical-polygon` | matching county, closed outer ring, zoning and flood evidence |
| `provider-polygon` | provider evidence remains distinguishable from canonical |
| `fallback-centroid` | no polygon claim; centroid-only state remains explicit |
| `unavailable` | no invented coordinates or layers |
| `county-mismatch` | consumer rejects response |
| `invalid-ring` | fewer than four points or non-closed ring rejected |
| `cross-lane-fields` | schema rejects owner, valuation, document, workflow, and provider-secret fields |

The same fixture corpus must run in the sovereign contract verifier and destination
`contract-compat` check before extraction.

## Exact Implementation Slice

The next Work Order may modify only:

- `backend/src/TerraFusion.Abstractions/DTOs/AtlasSpatialReadDto.cs`
- `backend/src/TerraFusion.Abstractions/contracts/atlas.spatial-read.v1.schema.json`
- `backend/src/TerraFusion.Abstractions/contracts/fixtures/atlas.spatial-read.v1.*.synthetic.json`
- `backend/src/TerraFusion.Abstractions/contracts.freeze.json`
- `backend/src/TerraFusion.Abstractions/CONTRACTS.md`
- `scripts/contracts/verify-contract-freeze.mjs`
- `scripts/contracts/verify-contract-freeze.test.mjs`
- bounded `docs/brain/workorders/**` evidence and routing files

It must not modify `IGisDataService`, controllers, services, hooks, UI, `packages/gis-pro`, package or
lockfiles, workflows, publication, or destination runtime source.

## Validation

- Atlas pack and shell boundary review: PASS.
- Existing C# and TypeScript field-by-field decomposition: PASS.
- Frozen-contract compatibility policy reconciliation: PASS.
- Cross-suite/provider exclusion review: PASS.
- Synthetic fixture contract defined: PASS.
- Runtime, backend implementation, frontend, package, CI, deployment, county/PACS/SQL, secret, and
  destination changes: none.

## Next

`WO-SR-005B-I - Atlas Read Contract Implementation and Freeze` may implement only the exact contract
slice above. Runtime adoption and `WO-SR-005B` extraction remain separately blocked.
