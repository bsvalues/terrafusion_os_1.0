# WO-SR-005D-E1 - Dossier Sovereign Evidence Registry Read Adapter

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded unwired implementation and synthetic tests |
| Dependency | WO-SR-005D-A complete; owner-authorized E1/E2 envelope anchored at `6b9ccb29fac6065264792c03880298347477e8d0` |
| Next | WO-SR-005D-E2 - Dossier Standalone Synthetic Contract Parity |

## Objective

Implement one pure adapter from an already-materialized, county- and parcel-scoped evidence page to
frozen `dossier.evidence-registry-read@1.0.0`. Prove identity, vocabulary, ordering, pagination,
timestamp, and cross-lane exclusion behavior without wiring a runtime consumer.

## Exact Allowed Files

- `backend/src/TerraFusion.API/Adapters/DossierEvidenceRegistryReadAdapter.cs`
- `backend/tests/TerraFusion.Unit.Tests/Dossier/DossierEvidenceRegistryReadAdapterTests.cs`
- `docs/brain/workorders/**` evidence and routing required for this Work Order

## Required Behavior

- Require the exact `1.0.0` schema and canonical county and parcel identities.
- Require every source row to match the requested county and parcel.
- Preserve evidence and optional document identity, closed evidence-type and integrity vocabulary,
  pagination identity, and optional trace identity.
- Sort deterministically by `createdAt` descending then `evidenceId` ascending.
- Reject duplicate or empty identities, invalid pagination, and non-UTC timestamps.
- Omit title, creator, custody, valuation, levy, note, provider, and persistence fields.

## Blocked

- DI registration, controllers, endpoints, services, consumers, entity or persistence mutation.
- Database/provider calls, custody mutation, write commands, source extraction, or destination
  product implementation.
- Frontend, packages, publication, workflows, deployment, production, or cutover.
- County/PACS/SQL access, credentials, secrets, live services, or protected resources.

## Validation

- targeted Dossier adapter unit tests;
- canonical backend build with zero warnings;
- frozen contract verifier and tests;
- `git diff --check`;
- Work Order query and tooling tests;
- exact-file and no-runtime-consumer inspection.

## Stop Type

`DOSSIER_SOVEREIGN_ADAPTER_IMPLEMENTED_READY_FOR_STANDALONE_PARITY`

## Completion

The pure adapter and 31-test synthetic matrix pass without introducing registration, consumers,
external calls, custody mutation, or runtime behavior. Completion evidence is recorded in
[WO-SR-005D-E1-DOSSIER-SOVEREIGN-EVIDENCE-REGISTRY-READ-ADAPTER.md](../evidence/WO-SR-005D-E1-DOSSIER-SOVEREIGN-EVIDENCE-REGISTRY-READ-ADAPTER.md).
The owner-authorized envelope continues to E2. E1 does not authorize extraction, runtime adoption,
or F1.
