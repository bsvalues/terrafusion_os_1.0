# WO-SR-009C - Atlas Workbench Canonical Projection Adoption Evidence

## Activation

- Owner decision: `OWNER-SR-009C-R3-ATLAS-WORKBENCH-CANONICAL-PROJECTION-20260806`
- Terminal narrowing: `OWNER-SR-009C-R3-ATLAS-POINT-TERMINAL-NARROWING-AMENDMENT-001`
- Decision source: Issue #1422
- Sovereign base: `f559a181832f0b5ce0617cdbd0bc2d08dfd9ebc2`
- Atlas evidence head: `6c530f1b6b77d59225353dede929c0688f1587da`
- Exact module SHA-256: `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46`
- State: `ACTIVE - AUTHORIZED STAGES 1 THROUGH 4`

## Source Evidence

Current-base inspection establishes:

1. `ParcelGeometryResponse.GeomWkt` is explicitly the canonical Polygon WKT source.
2. `AtlasSpatialReadAdapter.Adapt` parses that canonical `POLYGON`, emits
   `AtlasGeometryState.polygon`, and correctly rejects `POINT` input.
3. The local-sovereign proof's Point case uses a hand-built frozen synthetic `centroid_only` exchange,
   not the real `IParcelGeometryReader` plus adapter ingestion path.
4. Accepting synthetic Point input in the adapter would prove a state the canonical source cannot
   produce. The owner therefore narrowed the terminal proof instead of expanding product scope.

## Safety State

- No backend, frontend, runtime, test, configuration, persistence, workflow, or Atlas-repository file
  was changed before this governance reconciliation.
- No module was executed and no disposable database or process state was created.
- The legacy anonymous GIS path remains unchanged and is not represented as canonical evidence.
- The terminal condition is not yet claimed; implementation remains required.

## Controlling Disposition

`OWNER-SR-009C-R3-ATLAS-POINT-TERMINAL-NARROWING-AMENDMENT-001` removes Point from the terminal
proof. It does not add the adapter or adapter tests to the allowlist and does not authorize a new
mapper. Point is outside this Work Order until a real canonical Point source is separately proven and
authorized.

The active terminal proof is authenticated same-county canonical Polygon, truthful unavailable, and
cross-county non-disclosure. The exact Atlas hash, default `Disabled` configuration, authentication,
`read:parcel`, county, parcel, and returned-geometry identity checks, legacy anonymous GIS behavior,
and every original denial remain controlling.

## Validation Required During Implementation

Focused consumer, controller, Workbench, and disposable browser tests must prove canonical Polygon,
truthful unavailable, authentication and `read:parcel`, same-county identity, cross-county
non-disclosure, exact hash enforcement, and default-disabled behavior. No test may claim Point support.
All original Issue #1422 review, exact-head, merge, rollback, and closeout gates remain mandatory.
