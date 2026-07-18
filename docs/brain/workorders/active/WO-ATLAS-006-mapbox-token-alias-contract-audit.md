# WO-ATLAS-006 - Mapbox Token Alias Contract Audit

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R1
**Status:** Complete on protected merge

## Objective

Inventory current Mapbox token names and operator guidance without reading token values, then define
the exact bounded cleanup required to make the canonical name unambiguous.

## Result

- `VITE_MAPBOX_ACCESS_TOKEN` is the only canonical live frontend token name.
- GeoForge contains three live legacy-alias references: one V1 guidance string and the V2 fallback
  plus missing-token message.
- Other live OS-shell and GIS package consumers use the canonical name.
- No tracked `.env*` template declares either name; no environment value was opened or copied.
- Quarantine, historical plans, snapshots, and completed authorization evidence are records, not
  active alias contracts, and will not be rewritten.

## Evidence

See
[WO-ATLAS-006-MAPBOX-TOKEN-ALIAS-CONTRACT-AUDIT.md](../evidence/WO-ATLAS-006-MAPBOX-TOKEN-ALIAS-CONTRACT-AUDIT.md).

## Next

`WO-ATLAS-007 - GeoForge Mapbox Token Alias Cleanup` is the next bounded R3 source-and-test node.
The standing portfolio authority and exact file allowlist admit it; `wo-query` continues to report the
expected `protected-system-required` safety classification for frontend work.
