# WO-WAL-002L — County upload unsupported-media-type routing

| Field | Value |
| --- | --- |
| Status | `EXECUTING` |
| Parent | `WO-WAL-002` / issue #1485 |
| Program | Washington Assessor Launch V1 — ACTIVE |
| Authority | `OWNER-WAL-V1-MISSION-AUTHORITY-20260827`; standing operator lifecycle |
| Risk | R5 authenticated county API rejection path |
| Protected base | `7c723b33123d9695a1009ce59a90674d05377610` |
| Contract | `wal.county-upload.unsupported-media-type-routing.v1` |
| Environment | `local-synthetic-upload-routing-tests-only` |
| Terminal | `AUTHENTICATED_COUNTY_UPLOAD_MEDIA_TYPE_ROUTING_PROVEN` |

## Observed defect and scope

WO-WAL-002K candidate `b9c3753166c8e526f6cb862bd1ec68ec1a94ab9a` reached the
real authenticated API and received 404 for JSON POST `/api/upload`, where its
contract requires 415. The failed evidence is retained at browser leaf
`run-d834db52-b975-4f6f-9e74-d6e8e1359121`. This is not a completed upload journey.
The controller and Program routing are unchanged between that candidate's
protected base `63bea324baa9d8d9c5300892cae1f781b70465ef` and this base.

The multipart-only action can lose endpoint selection to the unrestricted SPA
fallback when the content type is unsupported. That source-supported explanation
is not an endpoint-name trace from the failed runtime.

## Exact reservations

- `backend/src/TerraFusion.API/Controllers/DataImportController.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvUploadMediaTypeRoutingTests.cs`
- `docs/brain/workorders/active/WO-WAL-002L-upload-media-type-routing.md`
- `docs/brain/workorders/active/WO-WAL-002H-authenticated-durable-county-csv-api-admission.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`
- `docs/brain/evidence/WO-WAL-002L-proof.md`

The last four paths are coordinator-only metadata/validation: reconcile only
already-delivered 002H and register this exact 002L child. The wave-test adjustment
must retain historical H-ready dispatch in an explicit cloned fixture and prove
current completed H cannot execute. The pre-existing E-wave historical fixture
must check absence of later 003E in its selected historical records, not deny that
003E exists in the current protected registry. No unrelated registry status changes.
002H was delivered by PR #1549 at `f868693429d875afd2bbc137f68612db8c942d08`;
its stale READY label is not ongoing implementation work. Its six-path historical
scope is retained as provenance, not assigned to this child. Current open governed
PR and worktree reservation checks remain required before source dispatch.

## Implementation and proof

1. Add an exact lower-priority POST `/api/upload` rejection action in the existing
   controller. Preserve the primary multipart action and all ingestion behavior.
2. Require the existing `RequireAssessor` policy and genuine established canonical
   county context. Invalid context remains forbidden. Unsupported content returns
   415 without reading the body or invoking admission, staging or promotion.
3. Keep duplicate-route API documentation unambiguous. No parallel importer,
   global fallback change, middleware change or authentication shortcut.
4. In the exact test file, prove actual endpoint selection with production
   controller metadata and the fallback interaction, supported multipart routing,
   unsupported media types, preserved authorization metadata and direct rejection
   behavior/no collaborator invocation. Such tests are not live JWT acceptance.
5. Use the existing observed real-HTTP failure as the original regression. Add and
   execute focused tests before the product fix; compile with the normal existing
   .NET 8 project/dependency graph. Independent exact-diff review is mandatory.
6. After protected delivery, WO-WAL-002K integrates the repaired protected base and
   rebinds its exact candidate. Its original 415 requirement must not be weakened.
   Actual authenticated upload, promotion and post-upload restart durability remain
   K acceptance, not inferred from these focused tests.

## Boundaries

No Program.cs, DI, policy, credentials, schema, migrations, project/package files,
frontend, Docker, Wi-Fi, lab services, county data, production or K source writes.
Use synthetic fixtures only. No fabricated authenticated acceptance or owner grant.
Builder owns only the two source paths after coordinator metadata handoff; Main
owns normal validation, proof, GitHub lifecycle and metadata. No simultaneous
writers in this worktree. Parent #1485 and WO-WAL-002 remain ACTIVE after delivery.

## Validation / delivery

Focused normal Unit.Tests, the bounded historical/current wave regression,
exact seven-path changed-path audit, `git diff --check`, canonical
Brain review-diff/proof/commit-plan and all protected required checks. Retain the
failing and passing exact identities separately. No terminal product or parent
completion claim until its own predicates and evidence are satisfied.

## Actual routing RED and implementation release

Main normal run31094 at06:16:20.3035964Z–06:18:35.1186062Z executed31cases:
9PASS/22FAIL/0SKIP with source continuity. Seven unsupported media-type cases
actually selected fallback and returned404; fifteen fallback controls separately
failed object-reference identity assertions against regenerated endpoint objects.
Evidence: wal002l-routing-red-018986bf95ad40f88d1d3a31295ca02a/routing.trx.
Do not classify those fifteen fixture assertions as product defects.

Main now owns the two source paths for the specified rejection action, corrected
fallback structural/behavior assertions and focused direct-action/cancellation/
API-explorer tests. Preserve the primary multipart action and all original routing
expectations. Direct-action tests use synthetic request-context/resolver ports
through the real protected binding chain; they do not prove JWT or policy execution.
Independent review and normal current-source tests remain required before delivery.

## MVC invocation review correction

Independent finding L-P1 was reproduced in run63992: 38PASS/2FAIL at the actual
MVC FormValueProviderFactory/ControllerBinderDelegateProvider body-read boundary.
The correction makes only the rejection parameterless and reads RequestAborted
inside it. Actual MVC invocation and direct-action tests remain explicitly
synthetic-context component evidence, not JWT/policy acceptance. Run69291 passed
40/40 with zero skips and continuous source pins. Evidence leaves:
`wal002l-mvc-binding-red-ee1a4d534cec4d9cbeafddfe906ab8eb` and
`wal002l-mvc-binding-green-d8f0b49ea4f4481e87de57a19d7a3f30`.

The first full wave suite executed 39PASS/1FAIL. The edited historical H case
passed; the unchanged E-wave assertion at line778 failed because protected base
already contains 003E. Main verified both that assertion and the existing 003E
record with git show HEAD, then releases only that historical-fixture correction
in the already-reserved wave test. No 003E record or status is changed.

## Protected prerequisite integration — 2026-09-09

PR #1581 merged to protected main at
`d6b4b0aab2d264cde97e67109e0b347369d191da` with all ten required checks passing.
Normal integration commit `4dcd40fce9ff53d1daa3a1f90d172d0155954b5f` retains
both parents and the independently reviewed tree
`a487862845f2b2a27a78314b80549931e3a7ed48`. The original protected base above
remains historical evidence; the current L delivery comparison is protected d6b.
Inherited package/lock and Sync diagnostics are protected prerequisites, not new
L permissions. The L delta remains exactly its seven reserved paths.

Fresh normal Release validation passed 40 routing cases and the broader 86-case
admission/context selection, with zero failures/skips and nine source pins
unchanged. The 40 are included in the 86, not 126 distinct cases. Normal Node20
query/wave validation passed 55 cases after frozen dependency materialization.
The 171-record registry union preserves both contributions; only the previously
authorized H completion changes an existing row. Independent integration/receipt
review is CLEAR. Required new-head CI and K's actual HTTP acceptance remain open.

## Canonical proof-output reservation

The seventh path is the exact normal `brain proof --workorder WO-WAL-002L`
generated proof bundle. It is coordinator-owned evidence, not another product
write lane. Preserve failed command evidence; this bundle alone is not runtime
acceptance. The human-readable reservations and existing Brain machine policy
below are the same seven paths; no alternate policy/parser is introduced.

<!-- brain-machine-policy: existing Brain CLI exact scope -->
```json
{
  "id": "WO-WAL-002L",
  "task": "Fix existing authenticated county upload unsupported-media-type routing",
  "risk": "R5",
  "suite": "TerraForge",
  "allowed_files": [
    "backend/src/TerraFusion.API/Controllers/DataImportController.cs",
    "backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvUploadMediaTypeRoutingTests.cs",
    "docs/brain/workorders/active/WO-WAL-002L-upload-media-type-routing.md",
    "docs/brain/workorders/active/WO-WAL-002H-authenticated-durable-county-csv-api-admission.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json",
    "docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "docs/brain/evidence/WO-WAL-002L-proof.md"
  ],
  "forbidden_patterns": [
    "backend/src/TerraFusion.API/Program.cs", "backend/src/TerraFusion.Core/**",
    "backend/src/TerraFusion.Data/**", "frontend/**", ".github/**",
    "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"
  ],
  "required_proof": [
    "dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj -c Release --filter FullyQualifiedName~CountyCsvUploadMediaTypeRoutingTests",
    "node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "node scripts/brain/brain.mjs review-diff --workorder WO-WAL-002L",
    "node scripts/brain/brain.mjs proof --workorder WO-WAL-002L",
    "node scripts/brain/brain.mjs commit-plan --workorder WO-WAL-002L"
  ]
}
```
