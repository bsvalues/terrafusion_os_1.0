# WO-SR-005D-C2 - Dossier Evidence Registry Read Contract Decomposition

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 docs/evidence contract design |
| Dependency | WO-SR-005D-C complete with snapshot NO_GO |
| Next | WO-SR-005D-I proposed/authority-gated; WO-SR-005E-P active |

## Objective

Define the exact provider-neutral, county-scoped `dossier.evidence-registry-read@1.0.0` contract
from persistent Dossier evidence reads and the smallest later implementation allowlist, or return
`NO_GO`, without changing contract artifacts or runtime source.

## Required Content

- Exact request, result, evidence record, pagination, and trace records and fields.
- County, parcel, selector-to-result, stable ordering, duplicate identity, and denial semantics.
- Evidence type and integrity enums with unknown-value handling.
- Explicit free-text, identity, custody, retention, storage, Forge, Dais, Atlas, provider, and OS exclusions.
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

`DOSSIER_EVIDENCE_REGISTRY_READ_CONTRACT_DECOMPOSED`

## Result

`IMPLEMENTATION_READY_READ_ONLY_WITHOUT_RUNTIME_ADOPTION`. The exact county/parcel-scoped registry
read contract, closed vocabularies, privacy exclusions, deterministic ordering, fixtures, parity
gate, and bounded later implementation files are defined in the evidence packet. Implementation
remains authority-gated; GPT contract preparation is the next dependency-cleared docs-only slice.
