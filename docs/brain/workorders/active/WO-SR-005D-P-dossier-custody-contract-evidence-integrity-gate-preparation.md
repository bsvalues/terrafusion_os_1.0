# WO-SR-005D-P - Dossier Custody Contract and Evidence-Integrity Gate Preparation

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only discovery and governance evidence |
| Dependency | WO-SR-005C-C complete |
| Next | WO-SR-005D-C - Dossier Evidence Snapshot Contract Decomposition |

## Objective

Inventory committed sovereign and standalone Dossier custody/evidence surfaces, prove ownership and
integrity boundaries, and select the smallest provider-neutral contract cohort without modifying
product, contract, runtime, destination, package, or workflow source.

## Allowed

- Read-only inspection of committed Dossier source, tests, contracts, pack governance, and the
  canonical standalone Dossier bootstrap.
- Bounded `docs/brain/workorders/**` evidence and routing updates.

## Required Evidence

- Exact file-line ownership and source inventory.
- Custody identity, hash/integrity, retention, access, county, and cross-suite boundary analysis.
- Existing synthetic proof and missing-proof classification.
- Smallest coherent contract cohort or `NO_GO` verdict.
- Exact next docs/evidence decomposition slice only; no implementation admission.

## Blocked

- Contract/runtime/API/service/entity/persistence/test or destination implementation.
- Source copying, extraction, publication, packages, lockfiles, or workflows.
- County/PACS/SQL data, credentials, secrets, live resources, deployment, cutover, or deletion.

## Validation

- `git diff --check`.
- `node docs/brain/workorders/tools/wo-query.mjs --json`.
- Exact docs-only scope inspection.

## Stop Type

`DOSSIER_CUSTODY_CONTRACT_PREPARATION_COMPLETE`

## Result

`COMPLETE_DECOMPOSITION_REQUIRED_EVIDENCE_SNAPSHOT_SELECTED`. The existing read-only evidence
snapshot is the smallest coherent first contract cohort. Custody mutations, retention, documents,
packets, notes, and runtime adoption remain excluded. See the [evidence packet](../evidence/WO-SR-005D-P-DOSSIER-CUSTODY-CONTRACT-EVIDENCE-INTEGRITY-GATE-PREPARATION.md).
