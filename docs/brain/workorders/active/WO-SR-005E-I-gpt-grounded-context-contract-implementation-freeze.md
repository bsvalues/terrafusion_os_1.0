# WO-SR-005E-I - GPT Grounded Context Contract Implementation and Freeze

| Field | Value |
| --- | --- |
| Status | PROPOSED / AUTHORITY GATED |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded contract implementation; no provider/runtime adoption |
| Dependency | WO-SR-005E-C complete |
| Next | GPT adapter and standalone parity preparation only after contract proof |

## Objective

Implement and hash-freeze `gpt.grounded-context@1.0.0` with the exact read-only DTO, schema, and
synthetic fixtures defined by WO-SR-005E-C.

## Allowed

- The exact files listed in the WO-SR-005E-C implementation slice.
- Contract build, schema/fixture validation, freeze verification, evidence, and routing updates.

## Blocked

- Provider/model/embedding calls, runtime adoption, controller/service/entity/persistence/test or adapter changes.
- Extraction, destination writes, package publication, package/lockfile changes, or workflows.
- County/PACS/SQL data, credentials, secrets, deployment, production, TerraPilot promotion, or tool actions.
- Source deletion, ownership cutover, or mutable duplicate retirement.

## Required Proof

- Contract project build.
- Schema accepts all positive fixtures and rejects all negative fixtures.
- Freeze hashes match tracked bytes and existing frozen groups remain unchanged.
- Contract verifier tests pass.
- No provider, runtime consumer, or behavior changes.

## Stop Type

`GPT_GROUNDED_CONTEXT_CONTRACT_IMPLEMENTED_AND_FROZEN`

## Authority Gate

This Work Order must not execute until recorded authority explicitly covers the exact
`TerraFusion.Abstractions` and contract-verifier paths listed by WO-SR-005E-C. Its proposal does not
expand the root governance write scope.
