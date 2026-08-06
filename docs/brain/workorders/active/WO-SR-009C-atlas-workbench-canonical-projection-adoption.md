# WO-SR-009C - Atlas Workbench Canonical Projection Adoption

## Status

`BLOCKED - FROZEN_ADAPTER_POINT_MAPPING_AUTH_REQUIRED`

## Authority

- Decision: `OWNER-SR-009C-R3-ATLAS-WORKBENCH-CANONICAL-PROJECTION-20260806`
- Issue: `#1422`
- Sovereign base: `f559a181832f0b5ce0617cdbd0bc2d08dfd9ebc2`
- Atlas evidence head: `6c530f1b6b77d59225353dede929c0688f1587da`
- Module: `src/spatial-read/project-atlas-feature.mjs`
- Module SHA-256: `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46`

## Objective

Make the canonical county-scoped Atlas projection reachable in the existing Property Workbench tab
through a default-disabled, authenticated, read-only consumer. Prove Polygon, Point, unavailable,
and cross-county non-disclosure without live providers, writes, deployment, or cutover.

## Exact Blocker

The frozen `AtlasSpatialReadAdapter` always emits `GeometryState = polygon`, requires a valid polygon
outer ring, and rejects `POINT` WKT. `AtlasProjectionProcessHost` accepts Point output only when the
exchange says `centroid_only`. The approved real-API Point proof is therefore unreachable using only
the frozen adapter and exact allowlist.

No product file is modified. Continuing requires either one narrow amendment authorizing the existing
adapter and its tests to map canonical point evidence to `centroid_only`, or an owner-approved terminal
condition that removes the real-API Point proof.

## Preserved Boundary

The anonymous legacy GIS endpoint is not canonical evidence. Atlas source, persistence, schemas,
providers, network, live county resources, routing, tab identity, navigation, Mapbox, deployment,
production, and other suites remain unchanged and denied.

## Next Valid Action

Approve or reject the narrow Point-mapping amendment recorded on Issue #1422. If approved, continue
the existing bounded sequence without per-stage relay. If rejected, close this Work Order as blocked
without claiming the terminal condition.
