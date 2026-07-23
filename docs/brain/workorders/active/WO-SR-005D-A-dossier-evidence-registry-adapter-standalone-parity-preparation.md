# WO-SR-005D-A - Dossier Evidence Registry Adapter and Standalone Parity Preparation

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only design and evidence |
| Dependency | WO-SR-005D-I complete |
| Verdict | IMPLEMENTATION_READY_AS_TWO_REPOSITORY_SEQUENCE |
| Next | WO-SR-005D-E1 - Dossier Sovereign Evidence Registry Read Adapter |

## Objective

Define the smallest pure adapter and standalone synthetic parity slices needed before any Dossier
source extraction, custody mutation, persistence change, or runtime adoption. Reuse
`dossier.evidence-registry-read@1.0.0`; do not create a competing contract or expose the persistence
entity or current controller projection as a suite API.

## Allowed

- Read-only inspection of committed Dossier evidence-registry entities, controller reads, tests,
  frozen contracts, and the standalone `bsvalues/terrafusion-dossier` bootstrap.
- Exact source-to-contract mapping, fail-closed synthetic parity cases, file scopes, provenance,
  rollback, validation gates, and an implementation verdict.
- Evidence and routing updates under `docs/brain/workorders/**`.

## Blocked

- Backend, runtime, test, destination repository, package, workflow, or deployment edits.
- Runtime wiring, API/controller adoption, database access, persistence or custody mutation.
- Source extraction, package publication, county/PACS/SQL access, credentials, secrets, or
  production resources.

## Completion

The evidence packet at
`docs/brain/workorders/evidence/WO-SR-005D-A-DOSSIER-EVIDENCE-REGISTRY-ADAPTER-STANDALONE-PARITY-PREPARATION.md`
records the exact two-repository implementation sequence. The first slice is a pure unwired
sovereign adapter over an already-materialized county- and parcel-scoped evidence page. The second
is a dependency-free standalone contract/parity harness using only frozen synthetic artifacts.

Neither slice authorizes extraction, custody mutation, persistence access, or runtime adoption.
