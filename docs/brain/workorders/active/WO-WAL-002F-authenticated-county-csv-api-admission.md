# WO-WAL-002F — Authenticated County CSV API Admission

| Field | Value |
| --- | --- |
| Status | `DEPENDENCY_BLOCKED_ON_004F` |
| Parent | `WO-WAL-002` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 authenticated upload API admission |
| Contract | `wal.county-upload.authenticated-csv-api-admission.v1` |
| Environment | `local-api-synthetic-csv-intake-only` |
| Terminal condition | `AUTHENTICATED_SAME_COUNTY_CSV_API_ADMISSION_REAL_RECEIPT_PROVEN` |

## Objective

Replace the fabricated anonymous upload response with a real assessor-authorized multipart CSV
admission that derives county authority from `WO-WAL-004F`, explicitly binds the Parcels or Sales
dataset, and consumes the protected 002A-002E validation and duplicate-decision contracts.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-002F-authenticated-county-csv-api-admission.md`
- `backend/src/TerraFusion.API/Controllers/DataImportController.cs`
- `backend/TerraFusion.API.Tests/Controllers/DataImportControllerTests.cs`

## Contract

1. Remove `[AllowAnonymous]` from the controller and require the existing `RequireAssessor` policy
   for the upload action.
2. Accept one multipart file and one explicit closed Parcels/Sales dataset value. Request data may
   not supply or override county authority.
3. Refuse missing, empty, oversized, non-CSV, malformed, unsupported-dataset, anonymous,
   non-assessor, and unresolved-county requests without a success-shaped receipt.
4. Bind the upload to the exact canonical county returned by `WO-WAL-004F`, run the protected CSV
   envelope and county-bound intake, compute the protected idempotency identity, and return the
   protected first-seen/duplicate disposition.
5. Return a bounded receipt summary containing county identity, dataset, content hash/length,
   accepted row count, and duplicate disposition derived from real parser output.

## Denials

No durable store, staging, quarantine persistence, canonical promotion, rollback, progress queue,
malware-service claim, external county system, write-back, credential, protected file, UI,
activation, deployment, production, or completion of `WO-WAL-002`. Existing non-upload stub
actions may not be represented as real by this child.

## Validation

- authenticated same-county Parcels and Sales CSV success through the real controller action;
- all refusal cases above, including route/body/header county tampering absence;
- exact receipt evidence from parser and duplicate contracts, cancellation, and no external write;
- focused controller tests, API compile, exact three-path audit, and `git diff --check`.

## Completion

Completion establishes a real authenticated in-memory CSV admission API. Durable staging,
quarantine, promotion, lineage persistence, rollback, UI, and parent completion remain later exact
children.
