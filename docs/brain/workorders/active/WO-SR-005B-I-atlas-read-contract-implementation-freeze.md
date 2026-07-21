# WO-SR-005B-I - Atlas Read Contract Implementation and Freeze

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded contract implementation; no runtime adoption |
| Dependency | WO-SR-005B-C complete |
| Next | WO-SR-005B-A Atlas adapter and standalone parity preparation |

## Objective

Implement and hash-freeze `atlas.spatial-read@1.0.0` with the exact provider-neutral DTO, schema, and
synthetic fixtures defined by WO-SR-005B-C.

## Allowed

- The exact files listed in the WO-SR-005B-C implementation slice.
- Contract build, schema/fixture validation, freeze verification, evidence, and routing updates.

## Blocked

- Runtime adoption, service/controller/hook/UI changes, extraction, destination runtime writes
- Package publication, package/lockfile changes, or workflow changes
- Provider calls, county/PACS/SQL data, secrets, deployment, or production access
- Source deletion, ownership cutover, or mutable duplicate retirement

## Required proof

- Contract project build
- Schema validates all positive fixtures and rejects all negative fixtures
- Freeze hashes match tracked bytes
- Existing frozen groups remain unchanged
- Contract verifier tests pass
- No runtime consumer or behavior changed

## Result

`atlas.spatial-read@1.0.0` is implemented and frozen as a provider-neutral DTO, JSON Schema, and
seven-file synthetic fixture corpus. The contract verifier reports three groups and fourteen frozen
files. Four positive fixtures pass; county mismatch, invalid ring, and cross-lane field fixtures fail
closed. Runtime adoption and extraction remain unstarted.
