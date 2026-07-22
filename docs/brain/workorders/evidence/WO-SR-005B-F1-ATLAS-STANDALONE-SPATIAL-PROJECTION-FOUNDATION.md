# WO-SR-005B-F1 - Atlas Standalone Spatial Projection Foundation Evidence

## Result

`PASS_BUILT_FRESH_STANDALONE_FOUNDATION_MERGED`

Atlas PR `#2` promoted the E2-proven provider-neutral projection behavior into a built-fresh product
module and merged as `6c530f1b6b77d59225353dede929c0688f1587da`. The module remains offline,
dependency-free, and unwired.

## Delivered Scope

- `src/spatial-read/project-atlas-feature.mjs` owns Polygon, centroid Point, and unavailable
  projection behavior.
- `test/project-atlas-feature.test.mjs` directly proves the product module.
- The existing verifier imports the product module instead of retaining duplicate projection logic.
- Atlas governance and Work Order evidence record the exact bounded slice.

## Validation

| Gate | Result |
| --- | --- |
| `node --test test/project-atlas-feature.test.mjs` | PASS - 3/3 |
| `node --test scripts/verify-atlas-spatial-read.test.mjs` | PASS - 6/6 |
| `node scripts/verify-atlas-spatial-read.mjs` | PASS - 8 artifacts, 4 positive, 3 negative |
| Required Atlas PR checks | PASS |
| Unresolved review threads | 0 |
| Exact-file scope and `git diff --check` | PASS |

## Contract And Safety Proof

- Polygon projection remains longitude-first GeoJSON.
- Centroid-only evidence remains a Point.
- Unavailable geometry returns no feature and does not invent location.
- Frozen `atlas.spatial-read@1.0.0` contract blobs remained unchanged.
- No sovereign source was copied and no Git history was imported.
- No runtime consumer, provider, package, lockfile, workflow, county/PACS/SQL surface, credential,
  secret, deployment, ownership cutover, or duplicate retirement changed.

## Rollback

Revert Atlas merge `6c530f1b6b77d59225353dede929c0688f1587da`. Because the module has no
runtime consumer or external dependency, rollback is repository-only and does not mutate the
sovereign base or a protected resource.

## Non-Claims

F1 does not make Atlas live, adopt a provider, transfer source ownership, or authorize runtime
integration. It proves only the built-fresh standalone projection foundation.

## Next

`WO-SR-005C-P - Dais Domain Contract and County-Isolation Gate Preparation` is admitted as the next
dependency-cleared R2 evidence slice. Dais extraction and implementation remain blocked.
