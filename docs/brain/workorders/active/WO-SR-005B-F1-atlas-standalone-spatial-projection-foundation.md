# WO-SR-005B-F1 - Atlas Standalone Spatial Projection Foundation

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Repository | `bsvalues/terrafusion-atlas` |
| Risk | R3 bounded built-fresh destination implementation |
| Dependency | WO-SR-005B-E3 complete |
| Next | Portfolio reconciliation after F1 evidence; runtime integration remains separately gated |

## Objective

Promote the provider-neutral Polygon, Point, and unavailable projection behavior already proven by
the E2 verifier into the first built-fresh Atlas product-source module, with direct parity tests and
no runtime consumer or external dependency.

## Exact Allowed Files

- `src/spatial-read/project-atlas-feature.mjs`
- `test/project-atlas-feature.test.mjs`
- `scripts/verify-atlas-spatial-read.mjs`
- `scripts/verify-atlas-spatial-read.test.mjs`
- `AGENTS.md`
- `operations/work-orders/WO-SR-005B-F1-atlas-standalone-spatial-projection-foundation.md`
- `operations/evidence/WO-SR-005B-F1-ATLAS-STANDALONE-SPATIAL-PROJECTION-FOUNDATION.md`

## Required Behavior

- Create a dependency-free product module from the proven E2 projection behavior.
- Preserve longitude-first GeoJSON Polygon projection.
- Preserve centroid-only Point projection.
- Return no feature for unavailable geometry without inventing location.
- Make the existing verifier consume the product module rather than keep duplicate projection logic.
- Add direct product-module tests and preserve every existing verifier assertion.
- Update Atlas authority text only to record this exact active built-fresh slice.

## Blocked

- Sovereign source copying or Git history import.
- Runtime consumer, endpoint, UI, provider, Mapbox, ArcGIS, network, package, lockfile, or workflow
  changes.
- County, PACS, SQL, credential, secret, live-service, production, deployment, cutover, ownership
  transfer, or duplicate retirement.
- Changes outside the seven exact files above.

## Validation

- `node --test test/project-atlas-feature.test.mjs`;
- `node --test scripts/verify-atlas-spatial-read.test.mjs`;
- `node scripts/verify-atlas-spatial-read.mjs`;
- existing standalone required checks;
- exact-file scope inspection and `git diff --check`;
- proof that package, lockfile, workflow, provider, network, runtime-consumer, and sovereign files did
  not change.

## Stop Type

`ATLAS_STANDALONE_SPATIAL_PROJECTION_FOUNDATION_READY`
