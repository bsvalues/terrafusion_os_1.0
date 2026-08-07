# WO-SR-009C - Atlas Workbench Canonical Projection Adoption Evidence

## Activation

- Owner decision: `OWNER-SR-009C-R3-ATLAS-WORKBENCH-CANONICAL-PROJECTION-20260806`
- Terminal narrowing: `OWNER-SR-009C-R3-ATLAS-POINT-TERMINAL-NARROWING-AMENDMENT-001`
- Decision source: Issue #1422
- Sovereign base: `f559a181832f0b5ce0617cdbd0bc2d08dfd9ebc2`
- State: `COMPLETE / AUTHORITY CONSUMED`

## Exact Provenance

- Atlas checkout: `E:\.codex-reference\atlas-sr009c`
- Atlas commit: `6c530f1b6b77d59225353dede929c0688f1587da`
- Module: `src/spatial-read/project-atlas-feature.mjs`
- Verified SHA-256: `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46`
- Implementation PR: `#1424`
- Exact assured head: `e70548cb4938da92b2c0b254d71c5361aa10a6ed`
- Merge: `b5a02db1758deda45d84c0ec99adb8f31d328c7b`

## Delivery Evidence

- `AtlasProjectionOptions` defaults to `Disabled` and permits only the exact local mode, absolute
  module path, pinned hash, bounded timeout, and explicit Node executable.
- The canonical endpoint requires authentication and `read:parcel`, resolves external parcel number
  by authenticated county, and does not disclose missing, ambiguous, or cross-county existence.
- Geometry is materialized only after county-scoped identity resolution. The consumer reads through
  `IParcelGeometryReader`, maps through the unchanged frozen adapter, and invokes the exact local
  module through the existing network-denied bounded process host.
- The Workbench displays canonical Polygon as non-live evidence and truthfully distinguishes loading,
  unavailable, error with copyable correlation evidence, and projected states.
- The disposable SQLite/browser harness proved same-county Polygon, unavailable, cross-county
  non-disclosure, error rendering, and correlation-ID display without live data or provider access.
- Focused validation passed: backend consumer/controller 26 of 26, frontend 19 of 19, exact-module
  process host 3 of 3, and authenticated Playwright 1 of 1.
- The Release backend build passed with zero warnings and zero errors. Frontend TypeScript,
  `git diff --check`, `wo-query`, exact scope, and frozen-adapter checks passed.
- PR #1424 had exactly 11 changed product/test files, 60 passing remote checks, 11 neutral/skipped
  checks, zero failed checks, zero unresolved substantive threads, and independent assurance PASS at
  the exact recorded head.

## Geometry Disposition

The canonical source provides Polygon WKT. The frozen `AtlasSpatialReadAdapter` and its tests are
unchanged. Point is neither required nor claimed; a synthetic Point path would not prove canonical
ingestion behavior.

## Safety Boundary

No Atlas repository mutation, live provider/network call, protected county/PACS/SQL access, schema,
migration, persistence/sync mutation, runtime write, credential, deployment, production, publication,
source retirement, cutover, route/tab/navigation restructuring, Mapbox change, or other-suite
adoption occurred or is claimed. The legacy anonymous GIS path remains unchanged and non-canonical.

## Rollback Evidence

Revert PR #1424 and this closeout. The default remains `Disabled`; no data, schema, provider,
deployment, external repository, or live resource repair is required.

## Terminal Condition

`ATLAS_COUNTY_SCOPED_CANONICAL_PROJECTION_REACHABLE_IN_WORKBENCH_NO_LIVE_PROVIDER_OR_CUTOVER`
