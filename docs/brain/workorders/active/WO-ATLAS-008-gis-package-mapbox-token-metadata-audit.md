# WO-ATLAS-008 - GIS Package Mapbox Token Metadata Disposition Audit

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R1
**Status:** Complete on protected merge

## Objective

Classify the two `MAPBOX_ACCESS_TOKEN` references in the GIS package without reading a token value or
changing package source, metadata, provider behavior, or deployment configuration.

## Result

- `packages/gis-pro/client/src/components/TerraFusionMap.tsx` reads only
  `VITE_MAPBOX_ACCESS_TOKEN` and gives matching missing-token guidance.
- `packages/gis-pro/client/src/env.d.ts` declares only `VITE_MAPBOX_ACCESS_TOKEN`.
- No tracked live GIS package source reads `MAPBOX_ACCESS_TOKEN`.
- No tracked live code consumes `packages/gis-pro/terrafusion-config.json`.
- The README setup line and `terrafusion-config.json` integration entry are stale browser-contract
  guidance/metadata, not evidence of a separate server-side Mapbox contract.
- No token value, environment file, package file, source, provider, runtime, CI, deployment, county,
  PACS, SQL, live service, or production resource changed.

## Evidence

See
[WO-ATLAS-008-GIS-PACKAGE-MAPBOX-TOKEN-METADATA-AUDIT.md](../evidence/WO-ATLAS-008-GIS-PACKAGE-MAPBOX-TOKEN-METADATA-AUDIT.md).

## Next

`WO-ATLAS-009 - GIS Package Mapbox Token Metadata Alignment` is the next bounded R3 node. It may
change only the two stale package references, add mechanical source-contract proof, and update Brain
evidence. It may not read token values or alter provider, runtime, deployment, or protected resources.
