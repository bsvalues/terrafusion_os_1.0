# WO-SR-007D - Atlas Persistent Local Runtime Adoption

| Field | Value |
| --- | --- |
| Status | COMPLETE - protected runtime and suite ownership verified |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Loop | `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R4 bounded local runtime adoption and rollback |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign base | `5a328e728852dc2bb933d704d0daa5c54750728c` |
| Atlas source | `bsvalues/terrafusion-atlas@6736a53980c73d2b503ec71a440ad8e02aa43782` |
| Module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |
| Terminal condition | `ATLAS_PERSISTENT_LOCAL_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN` |

## Objective

Persist `LocalExact` selection for capable Development source-tree hosts only, make the already authenticated Atlas consumer
resolve the fixed OS-managed artifact slot, enforce the complete suite repository/commit/path/type/
transport/length/hash identity at startup and before every invocation, invoke the real process host
across fresh service-provider starts, execute selection rollback to Disabled, restore selection, and
prove module and manifest tampering fail closed before process start.

## Exact scope

1. `.governance/owner-decisions.json`
2. `.gitignore`
3. `PATH_CANON_REGISTER.md`
4. `backend/src/TerraFusion.API/Configuration/AtlasProjectionOptions.cs`
5. `backend/src/TerraFusion.API/Program.cs`
6. `backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionProcessHost.cs`
7. `backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionRuntimeRegistration.cs`
8. `backend/src/TerraFusion.API/Services/Atlas/IAtlasProjectionProcessHost.cs`
9. `backend/src/TerraFusion.API/appsettings.Development.json`
10. `backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasProjectionRuntimeRegistrationTests.cs`
11. `scripts/validation/Invoke-AtlasPersistentRuntimeAdoptionRollbackProof.ps1`
12. `docs/brain/workorders/active/WO-SR-007C-atlas-canonical-artifact-staging.md`
13. `docs/brain/workorders/evidence/WO-SR-007C-ATLAS-CANONICAL-ARTIFACT-STAGING.md`
14. `docs/brain/workorders/active/WO-SR-007D-atlas-persistent-runtime-adoption.md`
15. `docs/brain/workorders/evidence/WO-SR-007D-ATLAS-PERSISTENT-RUNTIME-ADOPTION.md`
16. `docs/brain/workorders/registry/work-order-registry.seed.json`
17. `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
18. `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
19. `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
20. `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
21. `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
22. `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`

## Runtime boundary

- `appsettings.Development.json` selects `LocalExact`; only a sovereign source-tree host with the
  canonical repository markers activates it. Published Development containers, base, and Production
  remain effectively disabled and register no host or consumer.
- Configuration cannot supply the module or Node path. The code resolves the fixed ignored slot and
  a canonical absolute Node executable.
- The exact two-file artifact inventory and all eight manifest fields are required. Links, sidecars,
  missing files, wrong length, wrong bytes, or any manifest drift fail startup.
- A wrapper repeats verification before each invocation so post-construction tampering cannot race
  the process host.
- The sovereign OS retains authentication, county scope, frozen adapter/contract, process isolation,
  API, and Workbench integration. Atlas owns the provider-neutral projection module.

## Required proof

- warnings-as-errors compile of the real API/test graph;
- deterministic verifier, registration, tamper and production-refusal tests;
- real exact module invoked across start A and fresh restart B;
- Disabled configuration overlay produces no host or consumer;
- restored `LocalExact` start succeeds;
- manifest and module tamper after construction fail before process start and bytes are restored;
- 89 focused Atlas runtime, consumer, host and controller tests pass with zero skipped;
- durable ignored receipt and prior-slot bytes exist for local artifact rollback;
- independent review, exact changed-file scope, governance/JSON/diff gates, protected checks,
  resolved threads, exact-head merge and protected-main verification.

## Denials

No provider or GIS network adoption, persistence, schema, county/PACS/SQL/live data, credential,
secret, deployment, production enablement, frozen adapter/contract change, Workbench change, Atlas
source mutation, source deletion, other-suite mutation, force push, or required-check bypass.

## Continuation

Sovereign PR #1465 reviewed exact head `feb69f85999039db03ef95f52f8a8d4e4c0d2f8f`
and merged as protected OS main `4fcbfbd0585122f67f640b1b76786b7629f28e1f`
(tree `1084c60d6aec72802a8dd477b633058b818573d6`). Atlas PR #4 merged as protected
suite main `708fc5c31988405f9ca2cba7ebea7bb9d1fec3a6`, tree
`d986cc31da0077adb3a133bd1fa6d44bb2a79acc`. Both protected mains were
verified; the Work Order is consumed and has no remaining successor action.
