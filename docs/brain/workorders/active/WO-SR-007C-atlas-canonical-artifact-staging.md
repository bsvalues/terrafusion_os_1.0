# WO-SR-007C - Atlas Canonical Artifact Staging

| Field | Value |
| --- | --- |
| Status | COMPLETE - PR #1464 merged and protected main verified |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Loop | `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded local artifact staging |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign base | `6fa8a420c1b875255bf612802a0d9c93a0e2ea15` |
| Atlas source | `bsvalues/terrafusion-atlas@6736a53980c73d2b503ec71a440ad8e02aa43782` |
| Module | `src/spatial-read/project-atlas-feature.mjs` |
| Module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |
| PR | #1464, exact head `848546a3d5e82ed3694720e47623b965c704511c`, merge `5a328e728852dc2bb933d704d0daa5c54750728c` |
| Terminal condition | `ATLAS_CANONICAL_ARTIFACT_STAGING_PROVEN` |

## Objective

Stage the exact Atlas-owned projection module and a provenance manifest into the ignored OS-managed
runtime slot. Prove a real byte-identical backup, execute rollback, verify restored hashes, and refuse
repository, commit, module, runtime-pin, candidate, publication, or manifest identity drift.

This child Work Order does not select `LocalExact` persistently. It establishes the exact artifact and
rollback boundary required by the immediately dependent Atlas runtime-adoption child.

## Exact scope

1. `.governance/owner-decisions.json`
2. `.github/workflows/atlas-canonical-staging.yml`
3. `.gitignore`
4. `scripts/bootstrap/Stage-AtlasProjectionModule.ps1`
5. `tests/atlas-staging-identity.ps1`
6. `docs/brain/workorders/active/WO-SR-007C-atlas-canonical-artifact-staging.md`
7. `docs/brain/workorders/evidence/WO-SR-007C-ATLAS-CANONICAL-ARTIFACT-STAGING.md`
8. `docs/brain/workorders/registry/work-order-registry.seed.json`
9. `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
10. `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
11. `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
12. `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
13. `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
14. `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
15. `docs/governance/CI_WORKFLOW_LIFECYCLE_POLICY.md`

## Required proof

- canonical repository identity, exact source commit, module path, 917-byte length, and SHA-256;
- runtime pin parsed from `AtlasProjectionOptions.ExpectedModuleSha256` before fetch/publication;
- manifest binds repository, commit, path, filename, hash, artifact type, and local transport;
- whole previous slot moved to a rollback directory and every file hash recorded;
- automatic failure rollback executed and the complete restored inventory matches in both directions;
- a local Windows integration regression uses authorized access to the private Atlas repository; focused
  Windows CI guards parse the scripts and reject a forged origin before fetch without new credentials;
- the non-constitutional focused workflow is manual plus protected-`main` push-only, and the governed
  workflow-inventory snapshot includes it;
- exact changed-file scope, PowerShell parse, JSON parse, `git diff --check`, required remote checks,
  independent assurance, zero unresolved substantive threads, and exact-head merge eligibility.

## Preserved ownership boundary

Atlas owns the provider-neutral spatial projection. The sovereign OS retains the frozen
`atlas.spatial-read` contract, `AtlasSpatialReadAdapter`, authenticated county scope, canonical parcel
geometry read, process host, API and Workbench integration. No direct-copy deletion is inferred.

## Denials

No persistent `LocalExact` selection, provider or GIS network adoption, persistence, schema, county,
PACS, SQL, live data, credential, secret, deployment, production, Atlas mutation, source retirement,
other-suite change, branch-protection bypass, force push, or destructive cleanup.

## Dependency and continuation

Dependencies `WO-SR-007B` and `WO-SR-009C` are satisfied. All eight protected contexts passed on the
exact head, all ten review threads were resolved, and protected `main` was independently verified at
the squash merge above. `WO-SR-007D` is now the active persistent local-runtime adoption child under
the same mission authority.
