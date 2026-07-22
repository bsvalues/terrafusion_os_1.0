# WO-SR-005C-P - Dais Domain Contract and County-Isolation Gate Preparation

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Repository | `bsvalues/terrafusion_os_1.0` with read-only `bsvalues/terrafusion-dais` inspection |
| Risk | R2 read-only discovery and governance evidence |
| Dependency | WO-SR-005B-F1 complete |
| Next | A bounded Dais contract-decomposition WO only if evidence returns implementation-ready |

## Objective

Inventory the exact Dais domain-contract candidates and county-isolation semantics required before
any Dais extraction or destination implementation can be admitted.

## Allowed Scope

- Read committed Dais source, tests, domain packs, shared contracts, and standalone bootstrap files.
- Record exact source paths and file-line evidence.
- Classify domain ownership, county context, isolation semantics, cross-lane exclusions,
  compatibility/versioning requirements, synthetic fixtures, adapter boundaries, and parity gates.
- Update only `docs/brain/workorders/**` governance and evidence required for this Work Order.

## Blocked

- Source copying, contract implementation, destination product implementation, runtime wiring, or
  ownership cutover.
- Package, lockfile, workflow, provider, deployment, schema, migration, or live-service changes.
- County/PACS/SQL access, credentials, secrets, production resources, or non-synthetic data.
- Changes in `backend/`, `frontend/`, `os-platform/`, `tools/sync/`, or suite product-source paths.

## Required Evidence

- Exact candidate files and line citations.
- Domain ownership and excluded cross-suite concerns.
- County-context source, propagation, denial, and no-context behavior.
- Existing tests and missing isolation proof.
- Proposed versioned contract groups and compatibility/deprecation rules.
- Synthetic positive and negative fixture plan.
- Sovereign adapter and standalone parity-gate plan.
- `IMPLEMENTATION_READY`, `DECOMPOSITION_REQUIRED`, or `NO_GO` verdict with the smallest safe next WO.

## Validation

- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.
- Exact docs-only scope inspection.
- No runtime, product, contract artifact, package, workflow, county/PACS/SQL, secret, deployment, or
  production changes.

## Stop Type

`DAIS_DOMAIN_CONTRACT_COUNTY_ISOLATION_GATE_PREPARED`
