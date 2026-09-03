# WO-WAL-002J — County CSV Row Validation and Staging

| Field | Value |
| --- | --- |
| Status | `ACTIVE_DEPENDENCY_CLEARED` |
| Parent | `WO-WAL-002` |
| Predecessor | `WO-WAL-002I`; protected merge `0853181a11aff0627c9637137e74489337d80fd9` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 authenticated county-scoped validation and TerraFusion staging |
| Contract | `wal.county-upload.durable-row-staging.v1` |
| Environment | `local-api-disposable-sqlite-and-terraforge-ui` |
| Terminal condition | `COUNTY_CSV_ROWS_VALIDATED_STAGED_OR_QUARANTINED_WITHOUT_PROMOTION` |

## Assessor outcome

After authenticating the county and uploading a Parcels or Sales CSV, an assessor sees how many
rows entered county-scoped TerraFusion staging and how many were quarantined, including stable
reason classes. The product shows the exact launch templates and states truthfully that staged rows
are not yet promoted, published, or available in TerraForge workflows.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-002J-county-csv-row-validation-staging.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvUploadRowStaging.cs`
- `backend/src/TerraFusion.Core/Interfaces/ICountyCsvUploadRowStager.cs`
- `backend/src/TerraFusion.Core/Import/CountyCsvUploadAdmissionLedger.cs`
- `backend/src/TerraFusion.Core/Entities/Import/CountyCsvUploadRowStage.cs`
- `backend/src/TerraFusion.Data/Configurations/Import/CountyCsvUploadRowStageConfiguration.cs`
- `backend/src/TerraFusion.Data/Services/Import/CountyCsvUploadRowStager.cs`
- `backend/src/TerraFusion.Data/Services/Import/CountyCsvUploadAdmissionLedger.cs`
- `backend/src/TerraFusion.Data/Extensions/CountyCsvUploadAdmissionServiceCollectionExtensions.cs`
- `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`
- `backend/src/TerraFusion.Data/Migrations/20260903000000_WAL002JCountyCsvRowStaging.cs`
- `backend/src/TerraFusion.Data/Migrations/TerraFusionDbContextModelSnapshot.cs`
- `backend/src/TerraFusion.API/Controllers/DataImportController.cs`
- `backend/TerraFusion.API.Tests/Controllers/DataImportControllerTests.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvUploadAdmissionServiceRegistrationTests.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvUploadRowValidatorTests.cs`
- `frontend/apps/terraforge/src/data-admission/CountyCsvAdmissionPage.tsx`
- `frontend/apps/terraforge/src/data-admission/countyCsvUpload.ts`
- `frontend/apps/terraforge/src/data-admission/__tests__/CountyCsvAdmissionPage.test.tsx`
- `frontend/apps/terraforge/src/data-admission/__tests__/countyCsvUpload.test.ts`
- `frontend/apps/os-shell/src/components/CountiesHub.tsx`

## Contract

1. Resolve authority only through the authenticated canonical county context and require the
   durable batch, parsed document, and county identity to match before staging.
2. Sales v1 requires `parcel_id`, ISO `sale_date`, and positive invariant `sale_price`; optional
   `assessed_value` must be a bounded non-negative invariant decimal.
3. Parcels v1 requires `parcel_id`, `situs_address`, and bounded non-negative
   `assessed_value`. Reviewed aliases normalize to these fields; ambiguous aliases fail closed.
4. Persist only normalized launch fields. Ignore and do not persist unknown source columns.
5. Persist one immutable staging document per batch with source row numbers, accepted normalized
   rows, quarantined row numbers/reasons, counts, schema version, county ID, and lineage batch ID.
6. Duplicate/retry staging must converge on the same batch result. A mismatched replay fails closed.
7. History and receipt surfaces expose county-only validation counts and reason classes and reject
   malformed or cross-county nested summaries.
8. Label the entire result as validation staging only. It grants no canonical promotion or
   TerraForge runtime availability.

## Denials

No canonical promotion, trust/capability recomputation, TerraForge sales consumption, rollback,
external system access/write-back, raw unknown-column persistence, protected county file,
credential, live database, production deployment, or completion of `WO-WAL-002` is authorized.

## Validation

- pure validator tests for valid rows, missing/ambiguous schema, bad types/ranges, and duplicates;
- disposable-SQLite persistence, restart, idempotency, and cross-county refusal;
- controller receipt/history tests and malformed/cross-county client refusal;
- TerraForge UI tests for template guidance, staging/quarantine counts, reason classes, and truthful
  not-promoted state;
- frontend type-check/build, API Release build, protected checks, exact-head independent review,
  protected merge, and exact-merge browser acceptance.

## Continuation

After exact-merge acceptance, continue under `WO-WAL-002` to atomic promotion into
TerraFusion-controlled county storage, trust/capability recomputation, TerraForge consumption, and
batch rollback. No owner relay is required inside the active mission authority.
