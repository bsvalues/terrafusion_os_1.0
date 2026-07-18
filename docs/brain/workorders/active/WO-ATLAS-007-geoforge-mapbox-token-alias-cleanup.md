# WO-ATLAS-007 - GeoForge Mapbox Token Alias Cleanup

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R3
**Status:** Complete on protected merge

## Objective

Remove the deprecated GeoForge browser token alias and align both missing-token surfaces with the
canonical `VITE_MAPBOX_ACCESS_TOKEN` contract.

## Result

- GeoForge V1 guidance names only `VITE_MAPBOX_ACCESS_TOKEN`.
- GeoForge V2 reads only `VITE_MAPBOX_ACCESS_TOKEN`; the legacy fallback is removed.
- GeoForge V2 missing-token guidance names only the canonical variable.
- A cwd-independent source-contract test proves two canonical references per map file, two canonical
  environment reads in total, and zero `VITE_MAPBOX_TOKEN` references.
- No token value, environment file, provider, renderer, geometry, valuation, route, package, lockfile,
  CI, deployment, county, PACS, SQL, live service, or production resource changed.

## Evidence

See
[WO-ATLAS-007-GEOFORGE-MAPBOX-TOKEN-ALIAS-CLEANUP.md](../evidence/WO-ATLAS-007-GEOFORGE-MAPBOX-TOKEN-ALIAS-CLEANUP.md).

## Next

`WO-ATLAS-008 - GIS Package Mapbox Token Metadata Disposition Audit` is the next docs-only R1 node.
It determines the status of the two `MAPBOX_ACCESS_TOKEN` setup/metadata references without changing
package configuration or claiming a live reader.
