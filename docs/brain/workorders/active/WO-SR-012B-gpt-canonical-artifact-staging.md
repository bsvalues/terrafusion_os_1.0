# WO-SR-012B - GPT Canonical Artifact Staging

| Field | Value |
| --- | --- |
| Status | PROVEN ON CURRENT PROTECTED BASE - protected PR pending |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded non-production local artifact staging |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Integrated sovereign base | `aec4f1e18b619730842c828e4f1c93ecd18d64b2` |
| GPT protected source | `bsvalues/terrafusion-gpt@550b50f27af6f0911f16c973cbb6fc57a20eb15a` |
| Execution manifest | 1618 bytes; Git blob `7a9ca7bf114f34f2562102efa8817fd37506b614`; SHA-256 `6d04e14674e4e91a1a5d12ba12f53684cbad0bcec17e4e53ec01d8287618794b` |
| Module | 8578 bytes; Git blob `d81a8135caea1685ce02efd5acfdf1f9dfdd930a`; SHA-256 `cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb` |
| Schema | 3555 bytes; Git blob `42fc40dcb2d459a4b81fbaab4f71b33433402fb5`; SHA-256 `da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019` |
| Source manifest | 4954 bytes; Git blob `fae097a93c2b7435de85e7643cdb15d4714ee9c8`; SHA-256 `b2c679b3ebb70c9e055cc80a7923a215a7c9c60753d2f2c0984c89b246d81bc1` |
| Terminal condition | `GPT_CANONICAL_ARTIFACT_STAGING_PROVEN` |

## Objective

Stage the exact GPT-owned grounded-context projection module and frozen schema into the ignored,
fixed OS-managed `.terrafusion/runtime/gpt/grounded-context` slot. Verify the protected suite
merge, its execution manifest, module, schema, source manifest, Git blobs, byte lengths, hashes,
original contract anchor, and DTO identity before publication. The generated published manifest is
also byte pinned. The slot remains inert and reports `runtimeAdopted=false`.

## Exact scope

1. `.github/workflows/gpt-canonical-staging.yml`
2. `.gitignore`
3. `backend/src/TerraFusion.API/Configuration/GptGroundedContextRuntimeOptions.cs`
4. `scripts/bootstrap/Stage-GptGroundedContextModule.ps1`
5. `tests/gpt-staging-identity.ps1`
6. this Work Order and its evidence record
7. Five-Suite program routing and canonical workflow inventory

The protected merge remains ordered behind `WO-SR-011B`: after that runtime child merges, this
branch must integrate its exact protected-main SHA and rerun both proof tiers before merge.

## Required proof

- canonical origin, explicit protected `main` fetch, pinned protected-merge reachability, detached
  exact checkout, and disabled line-ending conversion;
- exact length, SHA-256, and Git-blob verification of the execution manifest, module, schema, and
  source manifest, plus structural provenance agreement between them;
- exact three-file candidate/published inventories and byte-pinned generated manifest;
- canonical/no-link path checks, same-volume backup, disjoint build/live/source paths, and a named
  inter-process transaction mutex;
- verified whole-slot move backup with complete relative-path/hash inventory; no wildcard-copy
  semantics;
- injected artifact tamper, manifest type tamper, backup-verification failure, post-publication
  failure, concurrency, originally-absent cleanup, and existing-empty restoration;
- Production and forged origins refused before mutation; default runtime mode remains `Disabled`;
- offline manual Windows workflow guards require no sibling-repository credential.

## Ownership boundary and denials

GPT owns grounded-context projection semantics for `gpt.grounded-context@1.0.0`. The sovereign OS
retains authentication, county context/isolation, persistence and dataset authorization, provider
orchestration, TerraPilot/TerraTrace integration, transport, contracts, and APIs. This child does not
wire a consumer, select `LocalExact`, call a provider or network at runtime, change persistence,
mutate any suite record, handle secrets, deploy, use county data, or activate Production.

## Rollback

For an existing slot, move the whole slot to a same-volume rollback directory, verify every file
against the pre-move inventory, publish only after verification, and restore the directory on any
failure. For an originally absent slot, remove any failed partial publication and restore absence.
For an existing empty slot, restore the empty directory itself.
