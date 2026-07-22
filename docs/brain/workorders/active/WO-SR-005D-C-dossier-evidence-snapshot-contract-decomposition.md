# WO-SR-005D-C - Dossier Evidence Snapshot Contract Decomposition

| Field | Value |
| --- | --- |
| Status | COMPLETE - NO_GO |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 docs/evidence contract design |
| Dependency | WO-SR-005D-P complete |
| Next | WO-SR-005D-C2 - Dossier Evidence Registry Read Contract Decomposition |

## Objective

Define the exact provider-neutral, county-scoped `dossier.evidence-snapshot@1.0.0` read contract and
the smallest later implementation allowlist without changing contract artifacts or runtime source.

## Required Content

- Exact request, result, evidence summary, trace, and hash-basis records and fields.
- County, parcel, stable ordering, duplicate identity, and cross-county denial semantics.
- Integrity enums and unknown-value handling.
- Explicit PII, free-text, storage, retention, custody-mutation, Dais, Forge, Atlas, provider, and OS exclusions.
- Compatibility/deprecation rules and positive/negative synthetic fixtures.
- Sovereign and standalone parity-gate design.
- Exact later implementation files or `NO_GO`.

## Allowed Files

- This Work Order and its evidence packet.
- Bounded `docs/brain/workorders/**` routing and registry files required for transition.

## Blocked

- Contract, adapter, runtime, API, entity, service, persistence, test, destination, package,
  lockfile, workflow, migration, deployment, or product-source changes.
- County/PACS/SQL access, credentials, secrets, live resources, source copying, custody mutation,
  ownership cutover, or duplicate retirement.

## Validation

- Exact file-line source reconciliation.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.
- Exact docs-only scope inspection.

## Stop Type

`DOSSIER_EVIDENCE_SNAPSHOT_CONTRACT_DECOMPOSED`

## Result

`NO_GO_SNAPSHOT_CROSSES_FORGE_DAIS_AND_OS_COMPOSITION`. The endpoint is a composed property
snapshot containing Property, Forge valuation, levies, and notes rather than a Dossier-owned
evidence record projection. `dossier.evidence-snapshot@1.0.0` is rejected. The dependency-cleared
successor is a docs-only decomposition of the persistent Dossier evidence registry read surface.
