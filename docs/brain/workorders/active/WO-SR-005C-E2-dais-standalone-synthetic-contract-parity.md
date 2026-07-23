# WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity

| Field | Value |
| --- | --- |
| Status | ACTIVE / AUTHORIZED |
| Program | Five-Suite Federated Repository Buildout |
| Repository | `bsvalues/terrafusion-dais` |
| Risk | R3 bounded standalone synthetic contract-compat implementation |
| Dependency | WO-SR-005C-E1 complete |
| Next | Portfolio reconciliation; F1 remains separately gated |

## Objective

Materialize the hash-pinned `dais.appeal-workflow@1.0.0` schema and nine frozen synthetic fixtures
in the standalone Dais repository, then prove exact standalone validation parity without extracting
product source or adopting the sovereign adapter at runtime.

## Exact Allowed Files

- `.github/workflows/suite-ci.yml` (`contract-compat` job only)
- `canon/CONTRACT_DEPENDENCY.md`
- `contract-compat/dais.appeal-workflow.v1/manifest.json`
- `contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json`
- `contract-compat/dais.appeal-workflow.v1/fixtures/*.json` (the nine frozen fixtures only)
- `scripts/verify-dais-appeal-workflow.mjs`
- `scripts/verify-dais-appeal-workflow.test.mjs`
- `operations/work-orders/WO-SR-005C-E2-dais-standalone-synthetic-contract-parity.md`
- `operations/evidence/WO-SR-005C-E2-DAIS-STANDALONE-SYNTHETIC-CONTRACT-PARITY.md`

## Required Behavior

- Pin the exact sovereign source SHA and SHA-256 of every mirrored contract artifact.
- Accept all three positive fixtures and reject all six negative fixtures fail closed.
- Preserve county, appeal, selector, ordering, lifecycle vocabulary, and UTC timestamp semantics.
- Remain dependency-free, deterministic, synthetic-only, offline, and provider-neutral.

## Blocked

- Product source extraction, adapter/runtime adoption, ownership cutover, F1, or duplicate retirement.
- Provider, persistence, database, county, PACS, SQL, credential, secret, network, live-service, or
  production input.
- Package/lockfile changes or workflow changes outside the existing `contract-compat` job.
- Changes to the frozen sovereign contract.

## Validation

- standalone verifier and tests;
- all frozen source/destination hashes;
- existing standalone required checks (`suite-ci`, `contract-compat`, `governance-gate`);
- exact-file scope inspection and `git diff --check`.

## Stop Type

`DAIS_STANDALONE_SYNTHETIC_CONTRACT_PARITY_PROVEN`
