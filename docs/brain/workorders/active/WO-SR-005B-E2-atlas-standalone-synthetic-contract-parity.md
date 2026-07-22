# WO-SR-005B-E2 - Atlas Standalone Synthetic Contract Parity Harness

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Repository | `bsvalues/terrafusion-atlas` |
| Risk | R2 bounded synthetic contract-compat implementation |
| Dependency | WO-SR-005B-E1 complete |
| Next | WO-SR-005B-E3 - Atlas Bounded Extraction Scope Audit |

## Objective

Materialize the hash-pinned `atlas.spatial-read@1.0.0` schema and seven frozen synthetic fixtures in
the standalone Atlas repository, then prove contract acceptance and provider-neutral map projection
without extracting product source or adopting the sovereign adapter at runtime.

## Exact Allowed Files

- `.github/workflows/suite-ci.yml` (`contract-compat` job only)
- `canon/CONTRACT_DEPENDENCY.md`
- `contract-compat/atlas.spatial-read.v1/manifest.json`
- `contract-compat/atlas.spatial-read.v1/atlas.spatial-read.v1.schema.json`
- `contract-compat/atlas.spatial-read.v1/fixtures/*.json` (the seven frozen fixtures only)
- `scripts/verify-atlas-spatial-read.mjs`
- `scripts/verify-atlas-spatial-read.test.mjs`
- `operations/work-orders/WO-SR-005B-E2-atlas-standalone-synthetic-contract-parity.md`
- `operations/evidence/WO-SR-005B-E2-ATLAS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md`

## Required Behavior

- Record the exact sovereign source SHA and SHA-256 for every mirrored contract artifact.
- Verify four positive fixtures and reject county mismatch, invalid ring, and cross-lane fields.
- Project polygon evidence to one longitude-first GeoJSON Polygon.
- Project centroid-only evidence to one GeoJSON Point.
- Project unavailable evidence to no feature without inventing location.
- Keep verification dependency-free, deterministic, synthetic-only, and offline.

## Blocked

- Product source extraction, adapter/runtime adoption, ownership cutover, or duplicate retirement.
- Provider, Mapbox, ArcGIS, county, PACS, SQL, credential, secret, network, live-service, or
  production input.
- Package/lockfile changes or workflow changes outside the existing `contract-compat` job.
- Changes to the frozen sovereign contract.

## Validation

- destination verifier and tests;
- frozen source/destination hash parity;
- existing standalone required checks (`suite-ci`, `contract-compat`, `governance-gate`);
- exact-file scope inspection and `git diff --check`;
- proof that no product source, package, lockfile, provider, or runtime files changed.

## Stop Type

`ATLAS_STANDALONE_SYNTHETIC_CONTRACT_PARITY_PROVEN`

## Completion

- Atlas PR #1 merged the exact 15-file synthetic parity slice at
  `a1669e09636743ac18c2525db69e20346a0f408b`.
- The destination verifier passed 6 tests, all eight materialized artifact hashes match the
  sovereign freeze, and all standalone required checks passed.
- No product source, runtime, provider, package, lockfile, county, PACS, SQL, secret, or production
  surface changed.
- Completion evidence: [WO-SR-005B-E2-ATLAS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md](../evidence/WO-SR-005B-E2-ATLAS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md).
- `WO-SR-005B-E3` completed with no safe direct-copy slice; `WO-SR-005B-F1` is active as the exact
  built-fresh standalone projection foundation. Runtime adoption and extraction remain blocked.
