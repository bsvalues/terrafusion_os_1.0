# WO-SR-005E-C - GPT Grounded Context Contract Decomposition

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 docs/evidence contract design |
| Dependency | WO-SR-005E-P complete |
| Next | Bounded contract implementation/freeze only if decomposition and exact source authority pass |

## Objective

Define the exact provider-neutral, county-scoped `gpt.grounded-context@1.0.0` read contract and the
smallest later implementation allowlist, or return `NO_GO`, without provider calls or changes to
contract artifacts, runtime source, packages, workflows, or destination repositories.

## Required Content

- Exact request, result, citation, denial, and trace records and fields.
- County, dataset, query sanitation, request-to-result, deterministic ordering, and identity semantics.
- Grounding and denial vocabularies with unknown-value handling.
- PII, full-text, embedding, provider/model, prompt, conversation, cost, tool/action, suite-data, and trace-store exclusions.
- Compatibility/deprecation rules and positive/negative synthetic fixtures.
- Sovereign and standalone parity-gate design.
- Exact later implementation files or `NO_GO`.

## Allowed Files

- This Work Order and its evidence packet.
- Bounded `docs/brain/workorders/**` routing and registry files required for transition.

## Blocked

- Contract, adapter, runtime, API, entity, service, persistence, test, destination, package,
  lockfile, workflow, migration, deployment, or product-source changes.
- Provider/model/embedding calls, county/PACS/SQL access, credentials, secrets, live resources,
  source copying, TerraPilot promotion, ownership cutover, or duplicate retirement.

## Validation

- Exact file-line source reconciliation.
- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.
- Exact docs-only scope inspection.

## Stop Type

`GPT_GROUNDED_CONTEXT_CONTRACT_DECOMPOSED`
