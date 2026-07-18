# WO-ATLAS-008 - GIS Package Mapbox Token Metadata Disposition Audit Evidence

## Verdict

**PASS - CORRECTION REQUIRED.** The GIS package has one live browser token contract:
`VITE_MAPBOX_ACCESS_TOKEN`. The README's `MAPBOX_ACCESS_TOKEN` setup line and the same value in
`terrafusion-config.json` are stale guidance/metadata. They are not consumed by tracked live code and
must not be represented as a separate server-side contract.

## Exact Evidence

| Surface | Current evidence | Classification |
| --- | --- | --- |
| `packages/gis-pro/client/src/components/TerraFusionMap.tsx:20` | Reads `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` | Live browser contract |
| `packages/gis-pro/client/src/components/TerraFusionMap.tsx:23` | Missing-token guidance names `VITE_MAPBOX_ACCESS_TOKEN` | Live operator guidance |
| `packages/gis-pro/client/src/env.d.ts:4` | Declares `VITE_MAPBOX_ACCESS_TOKEN` | Live type contract |
| `packages/gis-pro/README.md:86` | Shows `MAPBOX_ACCESS_TOKEN` in `.env` setup | Stale browser guidance |
| `packages/gis-pro/terrafusion-config.json:179` | Publishes `MAPBOX_ACCESS_TOKEN` as Mapbox `env_var` | Stale, unconsumed metadata |

Repository-wide tracked-source inspection found no non-quarantine GIS package reader for
`MAPBOX_ACCESS_TOKEN`. The package scripts use Vite for the client build, and the only package Mapbox
source reads the Vite-prefixed name. Tracked references to `terrafusion-config.json` outside audit or
quarantine material do not load this package file; the migration script only names it as a copied
artifact.

## Disposition

1. Preserve `VITE_MAPBOX_ACCESS_TOKEN` as the sole live GIS package browser token contract.
2. Correct the README setup example to the Vite-prefixed name.
3. Correct the Mapbox `env_var` metadata to the Vite-prefixed name.
4. Add a cwd-independent test proving the README, metadata, live source, and type declaration agree.
5. Do not add compatibility fallback, server-side aliasing, token lookup, secret access, or deployment
   wiring.

The correction is isolated as WO-ATLAS-009 because this audit is docs-only and does not have package
write authority. The current wave planner excludes all `packages/**` allowed files unconditionally,
so WO-ATLAS-009 remains blocked rather than being advertised as executable. WO-PORTFOLIO-009 must
mechanically bind an active, exact-file owner decision to a candidate before the package reservation
can pass.

## Validation

- exact tracked-source token-name scan: PASS;
- tracked `terrafusion-config.json` consumer scan: PASS - no live package consumer found;
- package manifest/script inspection: PASS - Vite client contract confirmed;
- package README/config history inspection: PASS - references predate current live-contract audit;
- `git diff --check`: required before commit;
- Brain query at R3: required before commit;
- wave planner at R3: required to select WO-PORTFOLIO-009 and keep WO-ATLAS-009 excluded;
- required remote checks and exact-head assurance: required before protected merge.

## Non-Claims

- No token value or environment content was read or validated.
- No Mapbox network request, provider availability, or deployment configuration was tested.
- No claim is made that a deployed environment defines the canonical variable.
- No claim is made that every unrelated historical, quarantine, or planning reference is canonical.
- No package source or metadata was changed in this audit.

## Rollback

Revert the WO-ATLAS-008 squash merge. This removes only the disposition evidence and routing; it does
not alter a token, package, runtime, provider, deployment, or production resource.
