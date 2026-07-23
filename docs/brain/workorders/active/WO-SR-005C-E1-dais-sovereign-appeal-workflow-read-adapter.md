# WO-SR-005C-E1 - Dais Sovereign Appeal Workflow Read Adapter

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded unwired implementation and synthetic tests |
| Dependency | WO-SR-005C-A complete; owner-authorized E1/E2 envelope anchored at `62cde7bd6a984b96b13c0b7f58e9caa0213cb529` |
| Next | WO-SR-005C-E2 - Dais Standalone Synthetic Contract Parity |

## Objective

Implement one pure adapter from an already-materialized, county-scoped appeal collection to frozen
`dais.appeal-workflow@1.0.0`. Prove exact selector, county, lifecycle, timestamp, and cross-lane
exclusion behavior without wiring a runtime consumer.

## Exact Allowed Files

- `backend/src/TerraFusion.API/Adapters/DaisAppealWorkflowReadAdapter.cs`
- `backend/tests/TerraFusion.Unit.Tests/Dais/DaisAppealWorkflowReadAdapterTests.cs`
- `docs/brain/workorders/**` evidence and routing required for this Work Order

## Required Behavior

- Require the exact `1.0.0` schema and canonical county/appeal identities.
- Require exactly one appeal, parcel, or tax-year selector and exact matches for every source row.
- Preserve source order, county identity, appeal identity, parcel identity, trace identity, and the
  frozen ground/status vocabularies.
- Reject non-UTC timestamps, impossible date ordering, invalid tax years, and unknown vocabulary.
- Omit absent optional values and all PII, money, notes, audit, provider, and persistence fields.

## Blocked

- DI registration, controllers, endpoints, services, consumers, entity or persistence mutation.
- Database/provider calls, write commands, source extraction, destination product implementation.
- Frontend, packages, publication, workflows, deployment, production, or cutover.
- County/PACS/SQL access, credentials, secrets, live services, or protected resources.

## Validation

- targeted Dais adapter unit tests;
- canonical backend build with zero warnings;
- frozen contract verifier and tests;
- `git diff --check`;
- Work Order query and tooling tests;
- exact-file and no-runtime-consumer inspection.

## Stop Type

`DAIS_SOVEREIGN_ADAPTER_IMPLEMENTED_READY_FOR_STANDALONE_PARITY`

## Completion

The adapter and 32-test synthetic matrix pass without introducing registration, consumers, external
calls, or runtime behavior. Completion evidence is recorded in
[WO-SR-005C-E1-DAIS-SOVEREIGN-APPEAL-WORKFLOW-READ-ADAPTER.md](../evidence/WO-SR-005C-E1-DAIS-SOVEREIGN-APPEAL-WORKFLOW-READ-ADAPTER.md).
The same owner-authorized envelope now continues to E2. E1 does not authorize F1.
