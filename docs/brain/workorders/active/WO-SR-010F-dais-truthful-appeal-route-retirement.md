# WO-SR-010F - Dais Truthful Appeal Route Retirement

| Field | Value |
| --- | --- |
| Status | ACTIVE - implementation and focused no-mutation proof pass |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded sovereign behavior retirement |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign base | `52744220509a54b6544e0fa193b6d09e8d93c159` |
| Terminal condition | `DAIS_FABRICATED_APPEAL_ROUTES_TRUTHFULLY_RETIRED` |

## Objective

Retire four unsupported sovereign Dais appeal behaviors that fabricated semantic catalog results or
reported a successful hearing schedule without a canonical Dais-backed implementation. Preserve the
existing HTTP route signatures while returning explicit HTTP 501 ProblemDetails and proving that the
refusal performs no service, audit, or database mutation.

## Exact scope

1. `backend/src/TerraFusion.API/Controllers/DaisController.cs`
2. `backend/tests/TerraFusion.Unit.Tests/Dais/DaisTruthfulRetirementTests.cs`
3. `backend/tests/TerraFusion.Unit.Tests/R2FullPlan/R2FullPlanHandlerAlignmentTests.cs`
4. `docs/brain/workorders/active/WO-SR-010F-dais-truthful-appeal-route-retirement.md`

## Required proof

- appeal grounds, timeline, and evidence-checklist routes return exact HTTP 501 ProblemDetails;
- BOE hearing scheduling returns the same explicit refusal without a semantic success payload;
- strict dependency verification proves no Dais service or audit call;
- a persisted appeal proves no hearing, status, timestamp, or database mutation;
- existing route paths, parameters, and compiled return signatures remain stable;
- canonical .NET tests, zero-warning validation, protected checks, resolved review threads,
  exact-head merge, and protected-main verification pass.

## Ownership boundary and denials

This child decomposes the already-recorded owner completion mission and creates no new objective.
It changes only the four audited sovereign endpoint implementations and their focused tests. Dais
entity shape, `Appeal.HearingDate`, persistence and read behavior, PACS-imported fields, frozen
contracts, runtime selection, custody and authorization boundaries remain unchanged. It adds no
replacement scheduling capability and performs no frontend, deployment, Azure, production,
county-data, PACS/SQL, secret-policy, schema, migration, topology, or CI-program work.

## Continuation

User-surface availability and replacement scheduling are separate capability-adoption work. This
child truthfully refuses the unsupported backend operations without claiming those broader changes.
