# WO-SR-005C-I - Dais Appeal Workflow Contract Implementation and Freeze

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded contract implementation; no runtime adoption |
| Dependency | WO-SR-005C-C complete |
| Next | Dais adapter and standalone parity preparation only after contract proof |

## Objective

Implement and hash-freeze `dais.appeal-workflow@1.0.0` with the exact read-only DTO, schema, and
synthetic fixtures defined by WO-SR-005C-C.

## Allowed

- The exact files listed in the WO-SR-005C-C implementation slice.
- Contract build, schema/fixture validation, freeze verification, evidence, and routing updates.

## Blocked

- Runtime adoption, controller/service/entity/persistence/test changes, extraction, or destination writes.
- Package publication, package/lockfile changes, or workflow changes.
- Provider calls, county/PACS/SQL data, secrets, deployment, or production access.
- Write commands/events, source deletion, ownership cutover, or mutable duplicate retirement.

## Required Proof

- Contract project build.
- Schema accepts all positive fixtures and rejects all negative fixtures.
- Freeze hashes match tracked bytes and existing frozen groups remain unchanged.
- Contract verifier tests pass.
- No runtime consumer or behavior changes.

## Stop Type

`DAIS_APPEAL_WORKFLOW_CONTRACT_IMPLEMENTED_AND_FROZEN`
