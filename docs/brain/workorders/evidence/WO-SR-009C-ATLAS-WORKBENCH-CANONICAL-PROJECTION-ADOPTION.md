# WO-SR-009C - Atlas Workbench Canonical Projection Adoption Evidence

## Activation

- Owner decision: `OWNER-SR-009C-R3-ATLAS-WORKBENCH-CANONICAL-PROJECTION-20260806`
- Decision source: Issue #1422
- Sovereign base: `f559a181832f0b5ce0617cdbd0bc2d08dfd9ebc2`
- Atlas evidence head: `6c530f1b6b77d59225353dede929c0688f1587da`
- Exact module SHA-256: `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46`
- State: `BLOCKED - FROZEN_ADAPTER_POINT_MAPPING_AUTH_REQUIRED`

## Source Evidence

Current-base inspection establishes:

1. `AtlasSpatialReadAdapter.Adapt` parses only a simple `POLYGON`, always emits
   `AtlasGeometryState.polygon`, and rejects `POINT` input.
2. `AtlasProjectionProcessHost` accepts `Point` output only when the serialized exchange carries
   `geometryState = centroid_only`; polygon exchanges cannot validate as Point.
3. The local-sovereign proof's Point case uses a hand-built frozen synthetic `centroid_only` exchange,
   not the real `IParcelGeometryReader` plus adapter path required by Issue #1422.
4. The exact product allowlist excludes the adapter and adapter tests, and the owner decision names an
   adapter change or different mapper as a true stop wall.

## Safety State

- No backend, frontend, runtime, test, configuration, persistence, workflow, or Atlas-repository file
  is changed.
- No module was executed and no disposable database or process state was created.
- The legacy anonymous GIS path remains unchanged and is not represented as canonical evidence.
- The terminal condition is not claimed.

## Recommended Amendment

Authorize exactly:

```text
backend/src/TerraFusion.API/Adapters/AtlasSpatialReadAdapter.cs
backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasSpatialReadAdapterTests.cs
```

The permitted change is limited to mapping an authenticated, county-matched canonical point geometry
to the existing frozen `centroid_only` contract state, while preserving current polygon behavior,
identity checks, closed vocabulary, fail-closed WKT parsing, serialization, and every Issue #1422
denial. No contract schema, DTO, host, Atlas module, persistence, provider, or route change follows.

## Alternatives

- **Approve the amendment:** complete the originally approved Polygon, Point, and unavailable product
  outcome using the existing frozen contract vocabulary.
- **Narrow the terminal condition:** authorize polygon and unavailable only; this weakens the approved
  product proof and is not recommended.
- **Reject:** retain the current unwired foundations and close WO-SR-009C without capability delivery.

## Validation Required After Amendment

Focused adapter tests must prove canonical point acceptance, polygon regression, malformed point and
identity rejection, exact `centroid_only` serialization, and unchanged contract hashes. All original
Issue #1422 validation, review, exact-head, merge, rollback, and closeout gates remain mandatory.
