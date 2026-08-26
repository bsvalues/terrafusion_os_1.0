# WO-SR-010A - Dais Canonical Artifact Staging

| Field | Value |
| --- | --- |
| Status | ACTIVE - local implementation and rollback proof pass; remote assurance pending |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded local artifact staging |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign base | `4fcbfbd0585122f67f640b1b76786b7629f28e1f` |
| Dais source | `bsvalues/terrafusion-dais@6932bbbf014cf70d7362e070a1dad2a8a680ad47` |
| Module | `src/appeal-workflow/project-dais-appeal-workflow.mjs`, 9269 bytes, SHA-256 `5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb` |
| Schema | `contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json`, 3496 bytes, SHA-256 `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` |
| Terminal condition | `DAIS_CANONICAL_ARTIFACT_STAGING_PROVEN` |

## Objective

Stage the exact Dais-owned appeal-workflow module and its frozen contract schema into the ignored,
fixed OS-managed slot. Bind repository, commit, module, schema, source manifest, original contract
anchor, and DTO identity in the generated manifest. Execute clean-bootstrap failure cleanup and two
whole-slot restoration paths before runtime adoption.

## Exact scope

1. `.governance/owner-decisions.json`
2. `.github/workflows/dais-canonical-staging.yml`
3. `.gitignore`
4. `PATH_CANON_REGISTER.md`
5. `backend/src/TerraFusion.API/Configuration/DaisAppealWorkflowOptions.cs`
6. `scripts/bootstrap/Stage-DaisAppealWorkflowModule.ps1`
7. `tests/dais-staging-identity.ps1`
8. `docs/brain/workorders/active/WO-SR-010A-dais-canonical-artifact-staging.md`
9. `docs/brain/workorders/evidence/WO-SR-010A-DAIS-CANONICAL-ARTIFACT-STAGING.md`
10. `docs/brain/workorders/registry/work-order-registry.seed.json`
11. `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
12. `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
13. `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
14. `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
15. `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
16. `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
17. `docs/governance/CI_WORKFLOW_LIFECYCLE_POLICY.md`

## Required proof

- canonical origin, explicit protected `main` fetch, pinned-commit reachability from that ref, and
  exact detached checkout with line-ending conversion disabled;
- module, schema, source-manifest, contract-anchor, and DTO identities agree with runtime pins;
- candidate and published inventories contain exactly module, schema, and generated manifest;
- source, option, build-root, candidate, and slot reparse points fail closed;
- the backup root is same-volume and disjoint from the sovereign repository and live slot;
- whole previous slot is moved, hashed, restored, and compared bidirectionally after injected backup
  verification and publication failures;
- an inter-process mutex serializes the complete slot observation/move/publish/rollback transaction,
  and a concurrent loser fails closed without changing the winner's exact publication;
- clean-parent bootstrap and fresh failure leave no partial slot;
- offline Windows CI parses the stager and rejects forged origin without sibling credentials;
- JSON, workflow inventory, exact scope, diff, independent review, protected checks, review threads,
  exact-head merge, and protected-main verification pass.

## Ownership boundary and denials

Dais owns semantic validation and projection for `dais.appeal-workflow@1.0.0`. The OS retains auth,
county context, data acquisition, persistence query, transport, API, Workbench, and field-limited
materialization. This staging child does not select `LocalExact`, alter the frozen contract or adapter,
touch provider/data/schema/migrations, mutate the Dais repository, deploy, publish, or delete source.

## Continuation

After verified merge, `WO-SR-010B` must make the exact suite validator the real Development runtime
semantic gate, persist governed selection, prove restarts/Disabled rollback/tamper refusal, and retire
duplicate semantic judgment while retaining legitimate sovereign integration seams.
