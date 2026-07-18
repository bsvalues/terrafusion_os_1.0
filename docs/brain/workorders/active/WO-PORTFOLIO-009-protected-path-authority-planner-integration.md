# WO-PORTFOLIO-009 - Protected-Path Authority Planner Integration

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R3
**Status:** Complete on protected merge

## Objective

Make exact-file owner authority mechanically visible to the read-only wave planner without weakening
the default denial for protected paths or other protected resources.

## Result

- Protected allowed files remain excluded unless exactly one active decision matches the Work Order.
- The decision authority class must cover the Work Order risk without exceeding planner authority.
- Every protected allowed file and protected path reservation must be exact and explicitly listed.
- Wildcard, partial, inactive, expired, conflicting, malformed, and insufficient grants fail closed.
- Protected contract and environment reservations remain denied regardless of path authority.
- Planner output identifies the consumed decision in the existing explanation field without changing
  the output schema.
- `OWNER-ATLAS-009-R3-MAPBOX-METADATA-ALIGNMENT-20260717` now bounds the exact GIS package
  metadata correction files.

## Evidence

See
[WO-PORTFOLIO-009-PROTECTED-PATH-AUTHORITY-PLANNER-INTEGRATION.md](../evidence/WO-PORTFOLIO-009-PROTECTED-PATH-AUTHORITY-PLANNER-INTEGRATION.md).

## Next

`WO-ATLAS-009 - GIS Package Mapbox Token Metadata Alignment` is ready under the exact-file R3
decision. Token values, package source, manifests, lockfiles, provider behavior, CI, deployment, and
all protected operational resources remain denied.
