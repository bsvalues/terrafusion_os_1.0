# WO-SR-005C-P - Dais Domain Contract and County-Isolation Gate Preparation

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Repository | `bsvalues/terrafusion_os_1.0` with read-only `bsvalues/terrafusion-dais` inspection |
| Risk | R2 read-only discovery and governance evidence |
| Dependency | WO-SR-005B-F1 complete |
| Next | WO-SR-005C-C - Dais Appeal Workflow Contract Decomposition |

## Objective

Inventory the exact Dais domain-contract candidates and county-isolation semantics required before
any Dais extraction or destination implementation can be admitted.

## Allowed Scope

- Read committed Dais source, tests, domain packs, shared contracts, and standalone bootstrap files.
- Reverify the canonical Dais local path, remote, default branch, privacy, clean status, and exact head
  from `PATH_CANON_REGISTER.md` before cross-repository inspection.
- Record exact source paths and file-line evidence.
- Classify domain ownership, county context, isolation semantics, cross-lane exclusions,
  compatibility/versioning requirements, synthetic fixtures, adapter boundaries, and parity gates.
- Update only `docs/brain/workorders/**` governance and evidence required for this Work Order.
- Update `PATH_CANON_REGISTER.md` only for the exact Dais repository identity prerequisite.

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

## Completion

- Verdict: `COMPLETE_DECOMPOSITION_REQUIRED_APPEAL_COHORT_SELECTED`.
- Sovereign source audited at `26c8eae1ef9c2b397cfa731dc6505a54dd62a822`.
- Standalone Dais bootstrap audited at `1404db1947587d4f8c868092798c4d71c23bb62d`.
- The appeal cohort is the smallest boundary with entity, service, county-denial, persistence,
  endpoint, audit, and write-lane proof.
- No Dais contract group exists in the frozen manifest; no source was copied or implemented.
- Evidence: [WO-SR-005C-P-DAIS-DOMAIN-CONTRACT-COUNTY-ISOLATION-GATE-PREPARATION.md](../evidence/WO-SR-005C-P-DAIS-DOMAIN-CONTRACT-COUNTY-ISOLATION-GATE-PREPARATION.md).
