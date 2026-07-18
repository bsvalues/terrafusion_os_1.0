# WO-ATLAS-009 - GIS Package Mapbox Token Metadata Alignment

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R3
**Status:** Complete on protected merge

## Objective

Align the two stale GIS package Mapbox token metadata references with the live browser contract and
add focused, cwd-independent proof without accessing a token or changing package behavior.

## Result

- README setup guidance names `VITE_MAPBOX_ACCESS_TOKEN`.
- `terrafusion-config.json` publishes the same canonical browser environment name.
- A Node test proves README, integration metadata, live source, and Vite type declarations agree.
- The test resolves all inputs relative to itself and passes from outside the repository.
- No token value, environment file, package source, provider behavior, compatibility alias, manifest,
  lockfile, runtime, CI, deployment, county, PACS, SQL, live service, or production resource changed.
- The bounded exact-file decision is consumed on protected merge.

## Evidence

See
[WO-ATLAS-009-GIS-PACKAGE-MAPBOX-TOKEN-METADATA-ALIGNMENT.md](../evidence/WO-ATLAS-009-GIS-PACKAGE-MAPBOX-TOKEN-METADATA-ALIGNMENT.md).

## Next

`WO-PORTFOLIO-010 - Post-Atlas Portfolio Reconciliation` refreshes the canonical backlog and admits
the next dependency-cleared bounded slice instead of treating the completed Atlas chain as a terminal
park.
