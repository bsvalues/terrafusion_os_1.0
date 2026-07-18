# WO-ATLAS-007 - GeoForge Mapbox Token Alias Cleanup Evidence

## Verdict

**PASS.** The live GeoForge V1 and V2 browser surfaces now use only
`VITE_MAPBOX_ACCESS_TOKEN` for lookup and operator guidance. The deprecated `VITE_MAPBOX_TOKEN`
fallback and messages are absent.

## Implementation

| File | Change | Behavioral boundary |
| --- | --- | --- |
| `GeoForgeMap.tsx` | Correct missing-token guidance to the canonical name | Guidance only |
| `GeoForgeV2Map.tsx` | Remove legacy fallback and correct missing-token guidance | Canonical configuration fails truthfully when absent |
| `mapboxTokenContract.test.ts` | Add cwd-independent live-source contract proof | Test only |

The cleanup does not alter Mapbox access-token assignment, provider selection, map style, renderer,
geometry, valuation, API calls, persistence, routing, or error-state structure.

## Validation

- focused Vitest from repository root: PASS, 1 test;
- focused Vitest from `frontend`: PASS, 1 test;
- affected plus architectural smoke suites: PASS, 5 files and 44 tests;
- exact live-source scan: zero `VITE_MAPBOX_TOKEN` references;
- frontend type-check: PASS;
- frontend production build: PASS;
- package and lockfile SHA-256 hashes: unchanged;
- `git diff --check`: PASS;
- Brain query at R3: PASS with WO-ATLAS-008 selected;
- required remote checks and exact-head assurance: required before protected merge.

The production build emitted existing dependency annotation, CSS parser, stale Browserslist data,
and chunk-size warnings. It completed successfully; this WO does not hide or remediate unrelated build
warning debt.

The smoke suites also emitted existing React `act`, React Router future-flag, and Browserslist warnings.
They passed and are outside this token-contract scope.

## Package Metadata Follow-Up

WO-ATLAS-006 found `MAPBOX_ACCESS_TOKEN` in `packages/gis-pro/README.md` and
`packages/gis-pro/terrafusion-config.json`, while tracked non-quarantine source contained no reader for
that name. Those files are intentionally unchanged here. WO-ATLAS-008 must classify whether they are
active metadata, stale guidance, or a separate server-side contract before any correction is proposed.

## Rollback

Revert the WO-ATLAS-007 squash merge. This restores the V2 compatibility fallback and prior guidance;
there is no token, provider, data, schema, deployment, or production rollback.

## Non-Claims

- No token value or environment content was inspected or validated.
- No Mapbox request or provider availability was tested.
- No claim is made that deployed environments define the canonical variable.
- No claim is made that GIS package setup/metadata is reconciled.
