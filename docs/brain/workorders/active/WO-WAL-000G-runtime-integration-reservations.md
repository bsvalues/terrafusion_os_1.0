# WO-WAL-000G — Runtime Integration Reservations

| Field | Value |
| --- | --- |
| Status | `ACTIVE_GOVERNANCE_ONLY` |
| Parent | `WO-WAL-000` |
| Program | Washington Assessor Launch V1 |
| Base | `6cfc93907a3153111115ca3468990753ffb8ae6e` |
| Risk | R3 governance-only routing reconciliation |
| Terminal condition | `F_RUNTIME_INTEGRATION_CHILDREN_EXACTLY_RESERVED_WITH_SYNC_WALL_PRESERVED` |

## Objective

Use the protected E-wave contracts and a current protected-main implementation audit to register
the smallest non-colliding runtime integration sequence that replaces two proven launch stubs:
authenticated canonical county context is wired into the real API request scope first, then the
upload endpoint consumes that context and the protected CSV intake contracts. This Work Order
changes governance only and implements neither child.

## Current implementation evidence

- `backend/src/TerraFusion.API/Auth/HttpContextRequestUserContextAccessor.cs` already derives one
  fail-closed county claim from the authenticated principal.
- `backend/src/TerraFusion.API/Services/CountyResolver.cs` already resolves canonical Washington
  identities against persisted county rows without a default.
- `backend/src/TerraFusion.API/Program.cs` already registers both abstractions, but the protected
  004D/004E binding and canonical-context contracts are not registered or consumed by the API.
- `backend/src/TerraFusion.API/Controllers/DataImportController.cs` is `[AllowAnonymous]` and returns
  fabricated `pending`/`queued` results. It consumes none of the protected 002A-002E contracts.
- The existing `RequireAssessor` policy requires `Assessor`, `Admin`, or `SystemAdmin`; no new role
  vocabulary is required.

This evidence is sufficient for bounded API integration with local authenticated fixtures and
synthetic CSV bytes. It does not provide the source/credential/environment bundle required for a
live Sync continuation and does not establish durable upload persistence, staging, quarantine,
promotion, rollback, or production readiness.

## Exact executable sequence

### WO-WAL-004F — Authenticated Canonical Context Runtime Integration

- Dependency: protected-complete `WO-WAL-004D`, `WO-WAL-004E`, and protected `WO-WAL-000G`.
- Contract: `wal.authenticated-canonical-county-runtime-context.v1`.
- Environment: `local-api-auth-context-persisted-guid-fixture-only`.
- Risk: R5.
- Terminal: `AUTHENTICATED_CANONICAL_COUNTY_CONTEXT_API_SCOPE_FAIL_CLOSED_PROVEN`.
- Paths:
  - `docs/brain/workorders/active/WO-WAL-004F-authenticated-canonical-context-runtime-integration.md`
  - `backend/src/TerraFusion.Core/Counties/AuthenticatedCountyAuthorityBinding.cs`
  - `backend/tests/TerraFusion.Unit.Tests/Counties/AuthenticatedCountyAuthorityBindingTests.cs`
  - `backend/src/TerraFusion.API/Auth/AuthenticatedCanonicalCountyContextProvider.cs`
  - `backend/src/TerraFusion.API/Program.cs`
  - `backend/TerraFusion.API.Tests/Auth/AuthenticatedCanonicalCountyContextProviderTests.cs`

### WO-WAL-002F — Authenticated County CSV API Admission

- Dependency: protected-complete `WO-WAL-002A` through `WO-WAL-002E`, protected-complete
  `WO-WAL-004F`, and protected `WO-WAL-000G`.
- Contract: `wal.county-upload.authenticated-csv-api-admission.v1`.
- Environment: `local-api-synthetic-csv-intake-only`.
- Risk: R5.
- Terminal: `AUTHENTICATED_SAME_COUNTY_CSV_API_ADMISSION_REAL_RECEIPT_PROVEN`.
- Paths:
  - `docs/brain/workorders/active/WO-WAL-002F-authenticated-county-csv-api-admission.md`
  - `backend/src/TerraFusion.API/Controllers/DataImportController.cs`
  - `backend/TerraFusion.API.Tests/Controllers/DataImportControllerTests.cs`

`WO-WAL-002F` is dependency-blocked until `WO-WAL-004F` reaches protected main. The verified
initial executable set is therefore exactly `WO-WAL-004F`.

## Preserved authority walls

- No `WO-WAL-003E` or later Sync child is registered. The complete named source, credential/role
  and secret-store reference, execution/network environment, data classification/handling, and
  source-side no-DML evidence bundle remains required.
- No `WO-WAL-001F` is registered. The missing canonical source workbook and absence of observed
  source acquisition bytes prevent a truthful source-to-runtime reservation in this wave.
- No database, durable upload store, county file, credential, protected data, external source,
  production system, deployment, or external write is admitted.
- `WO-WAL-002F` may return only a real bounded in-memory intake receipt. It may not claim staging,
  quarantine, promotion, rollback, activation, or completion of `WO-WAL-002`.
- `WO-WAL-004F` grants no role or capability and activates no data mode. Authorization policy
  remains the controller/action boundary.

## Exact governance reservation

Only these repository-relative paths may change in this governance Work Order:

- `docs/brain/workorders/active/WO-WAL-000G-runtime-integration-reservations.md`
- `docs/brain/workorders/active/WO-WAL-002F-authenticated-county-csv-api-admission.md`
- `docs/brain/workorders/active/WO-WAL-004F-authenticated-canonical-context-runtime-integration.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

## Validation

- validate `WO-WAL-000G`, `WO-WAL-002F`, and `WO-WAL-004F` against the Work Order schema;
- prove the verified initial executable set is exactly `WO-WAL-004F` and an unverified protected
  dispatch source yields an empty set;
- prove `WO-WAL-002F` remains dependency-blocked until 004F is protected-complete;
- prove all implementation, contract, and environment reservations are unique and non-colliding;
- prove 001F/003E/003F remain absent and the exact Sync authority wall is retained;
- run focused wave-plan tests, `git diff --check`, and the exact seven-path audit.

## Completion

This governance barrier becomes canonical only when its validated commit reaches protected main.
It clears exactly `WO-WAL-004F`; it does not implement either child or complete a broad parent.
