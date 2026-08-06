# WO-TF-POST-DAIS-001 - Authoritative Post-Dais Portfolio Reconciliation Evidence

## Result

`GENUINE_OWNER_DECISION_REQUIRED`

**Audited sovereign base:** `cb0463830d06e288e37ea5515e97b23eee51c0f4`

**Selected candidate:** `WO-SR-009C - Atlas Workbench Canonical Projection Adoption`

## Current product truth

| Surface | Verified current state | Remaining product gap |
| --- | --- | --- |
| Parcel acquisition | `WO-SR-009A` complete | None for the bounded authenticated synthetic journey |
| Dais Workbench read | `WO-SR-009B` complete | Writes and live data remain denied |
| Atlas standalone projection | Atlas `main` `6c530f1b6b77d59225353dede929c0688f1587da`; module hash `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` | Not reachable from the product |
| Atlas sovereign host | `AtlasProjectionProcessHost` exists, is hash-pinned, network-denied, bounded, and deliberately unwired | No DI registration or runtime consumer |
| Atlas Workbench | Existing tab calls `/api/atlas/gis/parcels/{parcelId}` and renders live/fallback/unavailable states | Does not consume the canonical frozen projection |

## Critical boundary finding

The existing Atlas Workbench GIS path must not be adopted as the canonical projection source:

- `AtlasGisController` applies `[Authorize]` at the controller but overrides the three parcel-read
  methods with `[AllowAnonymous]`.
- `GisDataService` reads legacy `GisParcelGeometries` by parcel ID only; that model has no county ID.
- the canonical `IParcelGeometryReader` already returns `TfParcelGeom` evidence paired with county
  identity and is consumed by `ParcelGeometryController` with a fail-closed county check.

The successor must therefore use `IParcelGeometryReader`, not `GisDataService`, and must preserve the
existing anonymous/legacy GIS path without representing it as canonical evidence.

## Exact proposed R3 outcome

An authenticated assessor opens the existing Atlas tab for one synthetic same-county parcel. A new
read-only canonical endpoint resolves the caller county, reads only the canonical `TfParcelGeom`
projection, maps it through `AtlasSpatialReadAdapter`, invokes the exact local Atlas module through
`IAtlasProjectionProcessHost`, and returns a strict normalized projection with provenance. The
Workbench shows honest loading, unavailable, error, and projected states. Cross-county geometry is
not disclosed. No route, tab identity, navigation, live provider, database schema, or deployment
changes.

## Proposed bounded sequence

1. Canonize one exact R3 decision and reserve the complete scope.
2. Add an environment-bound, default-disabled Atlas projection configuration with exact absolute
   module path and SHA-256; no package, download, network, or mutable-latest fallback.
3. Register the existing process host and one bounded read consumer.
4. Add an authenticated `read:parcel` canonical projection endpoint that uses
   `IParcelGeometryReader`, verifies caller county before adaptation or execution, and returns
   401/403/404/unavailable/fail-closed outcomes without leaking cross-county existence.
5. Add a contract-honest frontend read and Atlas-tab presentation without changing route, tab,
   navigation, Mapbox, or the existing legacy GIS endpoint.
6. Prove the complete path with disposable SQLite data, the exact local Atlas module, focused API,
   provider, component, and browser tests; remove all disposable state.
7. Close the authority and return to portfolio reconciliation without live adoption or cutover.

## Proposed exact product and test allowlist

```text
backend/src/TerraFusion.API/Configuration/AtlasProjectionOptions.cs
backend/src/TerraFusion.API/Program.cs
backend/src/TerraFusion.API/Controllers/ParcelGeometryController.cs
backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionConsumer.cs
backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasProjectionConsumerTests.cs
backend/tests/TerraFusion.Unit.Tests/GisTf/ParcelGeometryControllerTests.cs
frontend/apps/os-shell/src/hooks/useAtlasGis.ts
frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx
frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx
frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.honesty.contract.test.tsx
tests/e2e/property-workbench-production-smoke.spec.ts
```

Governance/evidence scope is limited to `.governance/owner-decisions.json` and the exact
`WO-SR-009C` Work Order, evidence, registry, queue, program, and command-routing files under
`docs/brain/workorders/**`.

## Explicit denials

```text
Atlas repository mutation or source extraction
legacy GisDataService or anonymous endpoint adoption as canonical evidence
live ArcGIS, county, PACS, or SQL access
schema, migration, persistence, or sync changes
runtime writes or provider/network calls
route, tab identity, navigation, or broader Workbench structure changes
Mapbox token or map-provider changes
credentials, secrets, packages, lockfiles, workflows, deployment, or production
Forge cutover, Dais writes, Dossier adoption, GPT providers, or TerraPilot promotion
source retirement, ownership transfer, publication, or five-suite cutover
force push or required-gate bypass
```

## Validation and rollback

Required proof includes exact Atlas commit/path/hash, default-disabled configuration, same-county
success, cross-county non-disclosure, missing/invalid identity, missing permission, no geometry,
hash mismatch, malformed output, timeout, cancellation, and cleanup failures; deterministic output;
focused frontend states; one disposable authenticated browser journey; zero-warning backend build;
frontend type-check/build; existing Atlas host and adapter suites; Work Order tooling; required remote
checks; zero substantive threads; and exact-head assurance.

Rollback is one bounded revert plus deletion of disposable data and process files. Default-disabled
configuration means no live runtime, provider, deployment, or external state needs restoration.

## Recommendation

**Approve one consolidated R3 packet.** This is the highest-value dependency-cleared gap after Dais
read adoption and the smallest coherent path from the already-proven Atlas foundations to an honest
Workbench consumer. Further R2 decomposition would not produce a new capability.

## Terminal condition for the proposed successor

`ATLAS_COUNTY_SCOPED_CANONICAL_PROJECTION_REACHABLE_IN_WORKBENCH_NO_LIVE_PROVIDER_OR_CUTOVER`
