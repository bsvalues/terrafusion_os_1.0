# WO-SR-005B-E1 - Atlas Sovereign Spatial Read Adapter Implementation

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 bounded unwired implementation and tests |
| Dependency | WO-SR-005B-A complete |
| Next | WO-SR-005B-E2 - Atlas Standalone Synthetic Contract Parity Harness |

## Objective

Implement one pure adapter from the authenticated, county-isolated canonical
`ParcelGeometryResponse` to frozen `atlas.spatial-read@1.0.0`, with exhaustive synthetic unit proof.
Do not wire the adapter into runtime behavior.

## Exact Allowed Files

- `backend/src/TerraFusion.API/Adapters/AtlasSpatialReadAdapter.cs`
- `backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasSpatialReadAdapterTests.cs`
- `docs/brain/workorders/**` evidence and routing required for this Work Order

## Required Behavior

- Enforce exact request/source county and parcel identity.
- Parse one simple WGS-84 `POLYGON` outer ring into longitude-first contract coordinates.
- Reject unsupported or invalid geometry and invalid numeric values.
- Emit canonical geometry with zoning and flood absent rather than fabricating evidence.
- Preserve the frozen DTO/schema/fixture contract unchanged.

## Blocked

- DI registration, endpoint/controller edits, runtime consumer adoption, database/provider calls.
- Frontend, `packages/gis-pro`, destination-repository, workflow, package, lockfile, deployment, or
  source-extraction changes.
- County/PACS/SQL data, credentials, secrets, providers, live services, or production resources.
- Contract redefinition, ownership cutover, duplicate retirement, multipolygon/hole support.

## Validation

- targeted adapter unit tests;
- `dotnet build backend/TerraFusion.sln -c Release` with zero warnings;
- `node scripts/contracts/verify-contract-freeze.mjs`;
- `node --test scripts/contracts/verify-contract-freeze.test.mjs`;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- work-order tooling tests;
- exact-file scope inspection.

## Stop Type

`ATLAS_SOVEREIGN_ADAPTER_IMPLEMENTED_READY_FOR_STANDALONE_PARITY`
