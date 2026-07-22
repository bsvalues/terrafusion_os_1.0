# WO-SR-005D-I - Dossier Evidence Registry Read Contract Implementation and Freeze

| Field | Value |
| --- | --- |
| Status | PROPOSED / AUTHORITY GATED |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded contract implementation; no runtime adoption |
| Dependency | WO-SR-005D-C2 complete |
| Next | Dossier adapter and standalone parity preparation only after contract proof |

## Objective

Implement and hash-freeze `dossier.evidence-registry-read@1.0.0` with the exact read-only DTO,
schema, and synthetic fixtures defined by WO-SR-005D-C2.

## Allowed

- The exact files listed in the WO-SR-005D-C2 implementation slice.
- Contract build, schema/fixture validation, freeze verification, evidence, and routing updates.

## Blocked

- Runtime adoption, controller/entity/service/persistence/test or adapter changes, extraction, or destination writes.
- Package publication, package/lockfile changes, or workflow changes.
- Provider calls, county/PACS/SQL data, secrets, deployment, or production access.
- Custody commands/events, retention, source deletion, ownership cutover, or duplicate retirement.

## Required Proof

- Contract project build.
- Schema accepts all positive fixtures and rejects all negative fixtures.
- Freeze hashes match tracked bytes and existing frozen groups remain unchanged.
- Contract verifier tests pass.
- No runtime consumer or behavior changes.

## Stop Type

`DOSSIER_EVIDENCE_REGISTRY_READ_CONTRACT_IMPLEMENTED_AND_FROZEN`

## Authority Gate

This Work Order must not execute until a recorded authority explicitly covers the exact
`TerraFusion.Abstractions` and contract-verifier paths listed by WO-SR-005D-C2. Its proposal does not
expand the root governance write scope.
