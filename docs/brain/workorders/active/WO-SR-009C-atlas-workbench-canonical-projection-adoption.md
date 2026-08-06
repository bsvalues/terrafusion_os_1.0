# WO-SR-009C - Atlas Workbench Canonical Projection Adoption

## Status

`ACTIVE - AUTHORIZED STAGES 1 THROUGH 4`

## Authority

- Decision: `OWNER-SR-009C-R3-ATLAS-WORKBENCH-CANONICAL-PROJECTION-20260806`
- Amendment: `OWNER-SR-009C-R3-ATLAS-POINT-TERMINAL-NARROWING-AMENDMENT-001`
- Issue: `#1422`
- Sovereign base: `f559a181832f0b5ce0617cdbd0bc2d08dfd9ebc2`
- Atlas evidence head: `6c530f1b6b77d59225353dede929c0688f1587da`
- Module: `src/spatial-read/project-atlas-feature.mjs`
- Module SHA-256: `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46`

## Objective

Make the canonical county-scoped Atlas projection reachable in the existing Property Workbench tab
through a default-disabled, authenticated, read-only consumer. Prove canonical Polygon, truthful
unavailable, and cross-county non-disclosure without live providers, writes, deployment, or cutover.

## Canonical Geometry Boundary

`ParcelGeometryResponse.GeomWkt` is the canonical Polygon WKT source. The frozen
`AtlasSpatialReadAdapter` consumes that source as Polygon and correctly rejects `POINT` input. A
synthetic Point exchange would not prove behavior reachable from canonical ingestion.

The controlling amendment therefore removes Point from the terminal proof. Point is neither required
nor claimable by this Work Order, and the frozen adapter and its tests remain outside the allowlist.

## Preserved Boundary

The anonymous legacy GIS endpoint is not canonical evidence. Atlas source, persistence, schemas,
providers, network, live county resources, routing, tab identity, navigation, Mapbox, deployment,
production, and other suites remain unchanged and denied.

## Next Valid Action

Resume the existing Stages 1 through 4 under the original allowlist. Validate authenticated same-county
canonical Polygon, truthful unavailable, and cross-county non-disclosure, then complete the governed
delivery and closeout sequence without owner relay.
