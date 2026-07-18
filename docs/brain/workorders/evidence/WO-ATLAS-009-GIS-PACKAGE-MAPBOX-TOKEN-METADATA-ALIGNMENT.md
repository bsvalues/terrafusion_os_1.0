# WO-ATLAS-009 - GIS Package Mapbox Token Metadata Alignment Evidence

## Verdict

**PASS - METADATA CONTRACT ALIGNED.** The GIS package README and unconsumed integration metadata now
match the live Vite contract `VITE_MAPBOX_ACCESS_TOKEN`. Focused proof covers all four contract
surfaces without token access or runtime behavior changes.

## Exact Changes

| Surface | Before | After |
| --- | --- | --- |
| `packages/gis-pro/README.md` | `MAPBOX_ACCESS_TOKEN` | `VITE_MAPBOX_ACCESS_TOKEN` |
| `packages/gis-pro/terrafusion-config.json` Mapbox `env_var` | `MAPBOX_ACCESS_TOKEN` | `VITE_MAPBOX_ACCESS_TOKEN` |
| `packages/gis-pro/tests/mapbox-token-metadata-contract.test.mjs` | absent | cwd-independent agreement proof |

The live source and type declaration were read-only proof surfaces and remained unchanged:

- `client/src/components/TerraFusionMap.tsx` reads
  `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN`;
- `client/src/env.d.ts` declares `VITE_MAPBOX_ACCESS_TOKEN`.

## Validation

- pre-change focused test: FAIL on the stale README name;
- post-change focused test from `%TEMP%`: 1/1 PASS;
- JSON parse of `terrafusion-config.json`: PASS through the focused test;
- tracked legacy exact-name scan in the aligned README/config surfaces: PASS;
- `git diff --check`: required before commit;
- Brain query and portfolio routing: required before commit;
- required remote checks, zero unresolved threads, exact-head assurance, and protected merge: required.

## Scope And Non-Claims

- No token value or environment content was read.
- No Mapbox request, provider availability, deployment configuration, or production environment was
  tested.
- No package source, compatibility fallback, manifest, lockfile, runtime, backend, CI, deployment,
  county, PACS, SQL, live service, or production resource changed.
- This alignment does not claim that every historical or quarantine reference is canonical.

## Rollback

Revert the WO-ATLAS-009 squash merge. This restores only the two metadata names and removes the
focused test and Brain closeout. No token, runtime, provider, deployment, or operational resource
requires rollback.
