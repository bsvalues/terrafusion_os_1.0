# WO-ATLAS-006 - Mapbox Token Alias Contract Audit Evidence

## Verdict

**PASS.** Current-main inspection confirms `VITE_MAPBOX_ACCESS_TOKEN` as the canonical token name and
limits active alias debt to three GeoForge references. The audit inspected names and source contracts
only; it did not read, copy, validate, or mutate a token value.

## Live Contract Inventory

| Surface | Canonical name | Legacy alias | Classification |
| --- | --- | --- | --- |
| `GeoForgeMap.tsx` | runtime read | missing-state guidance | Guidance is inconsistent with its own canonical runtime read |
| `GeoForgeV2Map.tsx` | primary runtime read | fallback plus missing-state guidance | Compatibility debt; two active alias references |
| `PropertyAtlas.tsx` and focused test | runtime read and test stub | none | Canonical |
| `BentonCountyMap.tsx` and integration test | runtime read and guidance | none | Canonical |
| `packages/gis-pro` component and env typing | runtime read, guidance, and type | none | Canonical |

The live non-GeoForge inventory contains no `VITE_MAPBOX_TOKEN` reference. GeoForge contains exactly
three. A filename-only `git grep` over tracked `.env*` paths returned no file declaring either name;
environment contents and untracked operator configuration were not inspected.

## Non-Live References

- `QUARANTINE/**` is excluded by canon and is not a supported runtime contract.
- `docs/superpowers/plans/**` records earlier implementation planning and is not current guidance.
- `.playwright-mcp/**` snapshots already display the canonical name and are evidence, not config.
- `docs/data/WO_P8_MGMT_004_FRONTEND_DEPLOYMENT_AUTHORIZATION_PACKET.md` is completed authorization
  evidence. Its legacy name is preserved as historical truth rather than rewritten after execution.
- Prior Brain evidence is preserved and now superseded for live routing by this audit.

## Canonical Token Contract

1. `VITE_MAPBOX_ACCESS_TOKEN` is the only supported live OS-shell and GIS package name.
2. `VITE_MAPBOX_TOKEN` is a deprecated compatibility alias, not a second canonical name.
3. Missing-token UI must identify only the canonical name and must not display a real token value.
4. Frontend source must not infer, fetch, persist, log, or install a token.
5. A deployment or operator environment that defines only the legacy alias should fail truthfully as
   missing canonical configuration after cleanup; no silent fallback remains.
6. No provider, style, renderer, geometry, valuation, routing, persistence, or API behavior changes.

## Exact Cleanup Contract

`WO-ATLAS-007 - GeoForge Mapbox Token Alias Cleanup` may change only:

- `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx` - correct the V1 missing-state name;
- `frontend/apps/os-shell/src/pages/forge/geo/v2/GeoForgeV2Map.tsx` - remove the legacy fallback and
  correct missing-state guidance;
- `frontend/apps/os-shell/src/pages/forge/geo/__tests__/mapboxTokenContract.test.ts` - prove the live
  GeoForge contract contains the canonical name and no legacy alias; and
- bounded Brain active, evidence, queue, register, command-map, playbook, and registry records.

The successor must not open `.env*`, introduce a token value, change package or lock files, alter
provider behavior, modify CI/deployment, or touch county, PACS, SQL, secrets, live services, or
production resources.

## Required Validation For WO-ATLAS-007

- focused token-contract test from the frontend working directory;
- frontend type-check and production build;
- exact-source scan proving zero live GeoForge `VITE_MAPBOX_TOKEN` references;
- package and lockfile hashes unchanged;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json --authority R3`;
- required remote checks, zero unresolved review threads, exact scope, and clean merge state.

`wo-query` is a read-only safety classifier, not an authority grant. Its current hard-exclusion rule
classifies every `allowedSystems` entry containing `frontend` as `protected-system-required`, including
when `--authority R3` is supplied. That expected classification must remain visible. WO-ATLAS-007 is
admitted by the recorded bounded R3 standing portfolio authority and exact file allowlist; the query
result does not lower its risk or independently authorize execution.

## Rollback

Revert the WO-ATLAS-007 squash merge. That restores only the prior guidance and V2 alias fallback;
there is no token, data, schema, provider, deployment, or production rollback.

## Non-Claims

- No token value or environment content was inspected.
- No Mapbox request, map runtime, provider availability, or licensing state was validated.
- No claim is made that an operator environment already defines the canonical name.
- Historical and quarantine references are not declared active simply because their text remains.
