# WO-WAL-002F — Authenticated County CSV API Admission

| Field | Value |
| --- | --- |
| Status | `COMPLETE_ON_PROTECTED_MERGE_378C2A472` |
| Parent | `WO-WAL-002` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 authenticated upload API admission |
| Contract | `wal.county-upload.authenticated-csv-api-admission.v1` |
| Environment | `local-api-synthetic-csv-intake-only` |
| Terminal condition | `AUTHENTICATED_SAME_COUNTY_CSV_API_ADMISSION_REAL_RECEIPT_PROVEN` |

## Objective

Replace the fabricated anonymous upload response with a real assessor-authorized multipart CSV
admission that derives county authority from protected `WO-WAL-004F`, binds the Parcels or Sales
dataset, and consumes the protected 002A-002E validation and duplicate-decision contracts. This
ready state becomes authoritative only when protected `WO-WAL-000H` merges; the prior protected
registry remains blocked until then. PR #1537 protected completion is recorded by `WO-WAL-000I`.

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

## Protected completion evidence

- PR #1537 merged exact reviewed head `29631d4f7725f2a99eb26d967a7dde30f82ab7ac`
  from protected 000H base `d4f5879a8668f8b84c993c848fe6dabf1ba876bb` as
  `378c2a47264a707d8b7a3de9882120577e9c9fb0` at `2026-09-01T23:42:25Z`.
- The protected merge tree exactly equals the reviewed-head tree and changes only the controller and
  focused controller-test paths; the pre-registered Work Order document remained unchanged.
- All required exact-head checks completed successfully. Local terminal proof passed 19/19 focused
  tests, the API Release build with zero warnings/errors, and the exact path/diff audits.
- The current-request cache initialization race found during review was fixed before merge; the
  eight-way activation regression and current-head review verified the serialized shared decision.

## Continuation

`WO-WAL-000I` verifies this protected completion and releases exactly the upload-specific durable
admission-ledger child `WO-WAL-002G`. No broad parent or later persistence claim follows directly
from this product merge.

## Completion

Completion establishes a real authenticated in-memory CSV admission API. Durable staging,
quarantine, promotion, lineage persistence, rollback, UI, and parent completion remain later exact
children.
