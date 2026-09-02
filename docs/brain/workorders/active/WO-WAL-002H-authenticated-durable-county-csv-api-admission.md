# WO-WAL-002H — Authenticated Durable County CSV API Admission

| Field | Value |
| --- | --- |
| Status | `READY_ON_PROTECTED_000J_MERGE` |
| Parent | `WO-WAL-002` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 authenticated county-scoped API adoption of durable persistence |
| Contract | `wal.county-upload.authenticated-durable-csv-api-admission.v1` |
| Environment | `local-api-disposable-efcore-durable-admission-only` |
| Terminal condition | `AUTHENTICATED_DURABLE_COUNTY_CSV_API_ADMISSION_RESTART_IDEMPOTENCY_PROVEN` |

## Objective

Replace the protected upload action's process-local duplicate decision with the 002G durable
admission ledger. Preserve the authenticated canonical county and bounded CSV parser boundary, and
return the persisted batch identity and durable first-seen/duplicate result through the real API
contract without staging or importing any row.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-002H-authenticated-durable-county-csv-api-admission.md`
- `backend/src/TerraFusion.API/Controllers/DataImportController.cs`
- `backend/src/TerraFusion.API/Program.cs`
- `backend/src/TerraFusion.Data/Extensions/CountyCsvUploadAdmissionServiceCollectionExtensions.cs`
- `backend/TerraFusion.API.Tests/Controllers/DataImportControllerTests.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvUploadAdmissionServiceRegistrationTests.cs`

## Contract

1. Add one bounded service-registration adapter that exposes a scoped
   `IDbContextFactory<TerraFusionDbContext>` over the already configured request-scope options and
   configuration, and registers `ICountyCsvUploadAdmissionLedger` to the protected 002G service.
   Every `CreateDbContext` call must return a distinct context; no caller-owned context may be used.
2. Inject `ICountyCsvUploadAdmissionLedger` into `DataImportController`; remove the memory-cache
   duplicate store and preserve the existing assessor policy, canonical request county, multipart
   shape, byte ceiling, parser limits and closed Parcels/Sales dataset.
3. After protected intake and identity creation, call the ledger with the exact authenticated county
   context, county-bound receipt, idempotency identity and admitted bytes. Treat every ledger denial
   as a fail-closed response and do not emit a success receipt.
4. Return the persisted batch ID, durable ledger contract and exact `FirstSeen`/`Duplicate`
   disposition. A retry after controller/service recreation must return the same batch ID.
5. Prove runtime registration, distinct factory contexts, real disposable-SQLite first-seen and
   restart duplicate behavior, county separation, cancellation and zero uploaded-byte persistence.
6. Preserve 002G's database transaction, validation and immutable provenance implementation; do not
   weaken or duplicate it in the controller.

## Denials

No uploaded-file byte/blob storage, staging rows, mappings, quarantine rows, canonical promotion,
trust/capability recomputation, progress UI, import execution, rollback execution, external county
system, credential, protected county file, live database, deployment, production or completion of
`WO-WAL-002` is authorized. Existing Sync/PACS tables and vocabularies remain unchanged.

## Validation

- focused controller tests for preserved auth/county/multipart/parser boundaries, real durable
  first-seen and restart duplicate receipt, same batch identity, denial and cancellation;
- focused service-registration tests for exact interface implementation, scoped lifetime, distinct
  factory contexts and disposable SQLite only;
- API and Data Release compile, `git diff --check`, exact six-path audit and reservation proof.

## Completion

Completion establishes only authenticated durable CSV admission through the real API. Staging,
row validation/quarantine, canonical promotion, lineage through runtime, rollback, UI and parent
completion remain later exact children.
