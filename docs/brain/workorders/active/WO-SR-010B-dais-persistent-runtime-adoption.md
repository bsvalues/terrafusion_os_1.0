# WO-SR-010B - Dais Persistent Exact Runtime Adoption

## Status

`COMPLETE - PR #1467 merged as 54f9e4b411fb886bd592226067928f024b02285b`

## Authority and dependency

This child decomposes `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826`; it creates no new objective.
Its exact sovereign base is protected `main` merge
`5182742d756cea6a939bb12489e660d83b9593b6`, which completed WO-SR-010A through PR #1466.

## Outcome

Make the suite-owned `dais.appeal-workflow@1.0.0` validator the real semantic gate for the existing
authenticated county-scoped appeal workflow read in capable Development source hosts. Persist the
selection, verify the exact three-file artifact on startup and every invocation, execute and observe
rollback, and fail closed without a legacy semantic fallback.

## Product scope

- extend the code-pinned Dais options with resolved local module, schema, Node and timeout state;
- add a constrained disposable Node process host for the exact module and schema;
- add exact typed-manifest/inventory verification at startup and every invocation;
- add a Dais consumer that maps sovereign records into the frozen exchange and accepts only the
  exact suite-normalized exchange;
- wire the existing `GET /api/dais/appeals/parcel/{parcelId}/workflow-read` route through that
  consumer after authentication, county scoping, persistence read and SQLite UTC restoration;
- persist `LocalExact` only in `appsettings.Development.json`;
- execute fresh-start, tamper-refusal, Disabled rollback and restored-LocalExact proof.

## Exact allowlist

1. `.governance/owner-decisions.json`
2. `.gitignore`
3. `PATH_CANON_REGISTER.md`
4. `backend/src/TerraFusion.API/Configuration/DaisAppealWorkflowOptions.cs`
5. `backend/src/TerraFusion.API/Controllers/DaisController.cs`
6. `backend/src/TerraFusion.API/Program.cs`
7. `backend/src/TerraFusion.API/Services/Dais/IDaisAppealWorkflowProcessHost.cs`
8. `backend/src/TerraFusion.API/Services/Dais/DaisAppealWorkflowProcessHost.cs`
9. `backend/src/TerraFusion.API/Services/Dais/DaisAppealWorkflowRuntimeRegistration.cs`
10. `backend/src/TerraFusion.API/Services/Dais/DaisAppealWorkflowConsumer.cs`
11. `backend/src/TerraFusion.API/appsettings.Development.json`
12. `backend/tests/TerraFusion.Unit.Tests/Dais/DaisAppealWorkflowProcessHostTests.cs`
13. `backend/tests/TerraFusion.Unit.Tests/Dais/DaisAppealWorkflowRuntimeRegistrationTests.cs`
14. `backend/tests/TerraFusion.Unit.Tests/Dais/DaisAppealWorkflowConsumerTests.cs`
15. `backend/tests/TerraFusion.Unit.Tests/Stage2/DaisEndpointContractTests.cs`
16. `scripts/validation/Invoke-DaisPersistentRuntimeAdoptionRollbackProof.ps1`
17. `docs/brain/workorders/active/WO-SR-010A-dais-canonical-artifact-staging.md`
18. `docs/brain/workorders/evidence/WO-SR-010A-DAIS-CANONICAL-ARTIFACT-STAGING.md`
19. `docs/brain/workorders/active/WO-SR-010B-dais-persistent-runtime-adoption.md`
20. `docs/brain/workorders/evidence/WO-SR-010B-DAIS-PERSISTENT-RUNTIME-ADOPTION.md`
21. `docs/brain/workorders/evidence/WO-SR-010B-runtime-adoption-receipt.json`
22. `docs/brain/workorders/registry/work-order-registry.seed.json`
23. `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
24. `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
25. `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
26. `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
27. `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
28. `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`

## Hard walls

No production or deployment enablement; no Azure; no PACS, county SQL or live county-data mutation;
no schema, migration, frozen DTO/contract, provider, credential or secret-policy change; no appeal
write behavior; no topology change, sixth suite or unrelated CI/release work.

## Terminal condition

`DAIS_PERSISTENT_LOCAL_EXACT_RUNTIME_ADOPTED_ROLLBACK_EXECUTED_AND_LEGACY_SEMANTIC_FALLBACK_RETIRED`

The terminal condition requires exact artifact/source identity, a real controller consumer, two
fresh LocalExact starts, post-start tamper refusal before process execution, an observed Disabled
rollback start, restored LocalExact execution, byte-identical artifact restoration, focused and
regression tests, independent review, protected checks, resolved review findings, exact-head merge,
and protected-main verification.

All terminal observations passed. PR #1467 exact reviewed head
`b24f263ac84fd5403d8fb1ed6e3ba18c511aafbb` merged as
`54f9e4b411fb886bd592226067928f024b02285b`; protected `main` was fetched and verified before
`WO-SR-010C` began.
