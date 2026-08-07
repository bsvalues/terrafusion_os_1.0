# WO-SR-009C - Atlas Workbench Canonical Projection Adoption

## Status

`COMPLETE / AUTHORITY CONSUMED`

## Authority

- Decision: `OWNER-SR-009C-R3-ATLAS-WORKBENCH-CANONICAL-PROJECTION-20260806`
- Amendment: `OWNER-SR-009C-R3-ATLAS-POINT-TERMINAL-NARROWING-AMENDMENT-001`
- Issue: `#1422`
- Sovereign base: `f559a181832f0b5ce0617cdbd0bc2d08dfd9ebc2`
- Atlas evidence head: `6c530f1b6b77d59225353dede929c0688f1587da`
- Module: `src/spatial-read/project-atlas-feature.mjs`
- Module SHA-256: `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46`
- Implementation PR: `#1424`
- Exact assured implementation head: `e70548cb4938da92b2c0b254d71c5361aa10a6ed`
- Implementation merge: `b5a02db1758deda45d84c0ec99adb8f31d328c7b`
- Merge mode: bounded Mode B

## Objective

Make the canonical county-scoped Atlas projection reachable in the existing Property Workbench tab
through a default-disabled, authenticated, read-only consumer. Prove canonical Polygon, truthful
unavailable, and cross-county non-disclosure without live providers, writes, deployment, or cutover.

## Completion

- The canonical endpoint resolves the authenticated caller's external parcel number to exactly one
  same-county internal parcel identity before materializing geometry.
- The consumer reads only through `IParcelGeometryReader`, preserves county and parcel identity, maps
  through the unchanged frozen adapter, and invokes the exact hash-pinned local Atlas module through
  the bounded process host.
- Missing, ambiguous, and cross-county parcel identities remain indistinguishable and do not invoke
  geometry materialization.
- `PropertyAtlas` renders honest loading, unavailable, error, and canonical Polygon states without
  changing Workbench routing, tab identity, navigation, Mapbox behavior, or the legacy GIS endpoint.
- Configuration remains `Disabled` by default. The local exact Polygon is labeled non-live evidence;
  no provider or runtime cutover is claimed.
- Focused backend tests passed 26 of 26; focused frontend tests passed 19 of 19; exact-module process
  host tests passed 3 of 3; and the disposable authenticated Playwright journey passed 1 of 1.
- The Release backend build passed with zero warnings and zero errors, frontend type-check passed,
  `wo-query` passed, the exact 11-file product scope was verified, and the frozen adapter remained
  unchanged.
- PR #1424 completed 60 remote checks successfully with 11 neutral/skipped checks, zero failures,
  zero unresolved substantive threads, and independent exact-head assurance at the recorded head.
- The bounded R3 authority and its terminal-narrowing amendment are completed and consumed by this
  governance closeout.

## Canonical Geometry Boundary

`ParcelGeometryResponse.GeomWkt` remains the canonical Polygon WKT source. The frozen
`AtlasSpatialReadAdapter` remains unchanged and continues to reject `POINT` input. Point support is
not proven or claimed by this Work Order.

## Non-Claims

This Work Order does not authorize or claim Atlas repository mutation, source extraction, live
ArcGIS/provider/network access, county/PACS/SQL access, schema or persistence changes, runtime writes,
credentials, deployment, production, publication, source retirement, or cutover. The anonymous
legacy GIS endpoint remains unchanged and non-canonical.

## Rollback

Revert PR #1424 and this closeout. Configuration defaults to `Disabled`, and no database schema,
provider, live resource, deployment, Atlas repository, or external state requires restoration.

## Terminal Condition

`ATLAS_COUNTY_SCOPED_CANONICAL_PROJECTION_REACHABLE_IN_WORKBENCH_NO_LIVE_PROVIDER_OR_CUTOVER`
