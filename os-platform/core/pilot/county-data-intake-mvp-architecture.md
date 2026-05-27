# County Data Intake MVP Architecture

Generated: 2026-05-27

## Scope

This is a design-only lane for assessor-provided governed exports. It is separate from the current June 10 39-county repair path, TerraFusion Sync, Benton DB drain work, and production DB binding. It does not authorize database mutation or canonical import.

The MVP is a governed upload workspace:

```text
assessor export
-> secure upload
-> county/FIPS binding
-> SHA-256 receipt
-> schema validation
-> rejected-row report
-> staging candidate
-> dry-run import report
-> human approval
-> future canonical import
```

## Non-Goals

- No scraping, reverse engineering, or public-artifact substitution.
- No SFTP, custom county APIs, sync agents, or ETL orchestration in the MVP.
- No direct canonical table writes.
- No production binding changes.
- No password, token, cookie, connection string, private key, or shared secret storage in upload payloads, receipts, logs, or evidence artifacts.
- No mutation of the current 39-county repair path.

## Actors

| Actor | Responsibility |
| --- | --- |
| County uploader | Authenticated county assessor or delegated data steward who submits an export package. |
| TerraFusion reviewer | Reviews validation results, rejected-row reports, and dry-run import report before approval. |
| Intake service | Receives files, computes hashes, validates metadata and schema posture, and writes evidence artifacts. |
| Future import runner | Performs approved canonical import in a later lane. This MVP only defines its approval boundary. |

## Accepted Formats

The MVP accepts source packages that can be stored and hashed without transformation:

| Format | Use | MVP Handling |
| --- | --- | --- |
| `.csv` | Primary tabular assessor export | Parse headers, count rows, validate required fields, generate rejected-row report. |
| `.txt` | Delimited fixed-export variant | Require declared delimiter and schema mapping before row validation. |
| `.xlsx` | Assessor workbook export | Require sheet selection, extract a tabular candidate, hash original workbook and extracted candidate. |
| `fgdb_directory` | GIS parcel geometry export delivered as a file geodatabase directory. | Treat as authoritative geometry candidate only after inventory, layer declaration, and parcel key validation. |
| `zipped_fgdb` | GIS parcel geometry export delivered as a ZIP containing one file geodatabase. | Hash ZIP, enumerate entries, require one declared FGDB, reject path traversal and secret-like files. |
| `zip_generic` | Container for related non-FGDB source files. | Hash ZIP, enumerate entries, reject path traversal and secret-like files, validate supported entries. |

Rejected inputs:

- Executables, scripts, binaries unrelated to declared source data, password-protected archives, encrypted archives, hidden credentials, connection profiles, browser exports, private keys, or files with secret-like names.
- Archives with absolute paths, parent-directory traversal, duplicate normalized entry names, or nested archives unless explicitly reviewed.
- Any upload whose declared county and detected county/FIPS evidence conflict.

## Upload Workflow

1. Uploader selects county and FIPS from a controlled list before upload.
2. Uploader identifies export type, source system, export date, file format, and whether the file includes parcel, valuation, sales, assessment, exemption, or geometry data.
3. Upload service stores the original file in immutable intake storage with a generated intake ID.
4. Upload service computes SHA-256 for the original upload and each accepted extracted artifact.
5. Upload service creates a receipt using `county-data-intake-receipt.schema.json`.
6. Validation runs against metadata, file safety rules, county/FIPS binding, schema, row counts, required fields, parcel ID uniqueness, transform declarations, and secret scanning.
7. Validation output produces an evidence packet: receipt, validation checklist result, rejected-row report, dry-run import report, and reviewer decision stub.
8. Reviewer may approve only after all required checks pass or after a documented exception is attached.
9. Approval creates an import authorization artifact for a later canonical import lane. The MVP does not execute canonical import.

## County/FIPS Binding

County identity is bound at three layers:

- Declared binding: uploader-selected county name, county token, state, and FIPS.
- Auth binding: uploader identity must be authorized for the declared county/FIPS.
- Data binding: file contents and metadata must not contradict the declared county/FIPS.

Minimum binding fields:

- `state`: `WA`
- `countyName`
- `countyToken`
- `fips`
- `assessorOfficeId`
- `uploader.id`
- `uploader.email`
- `uploader.organization`
- `sourceExport.exportedAtUtc`
- `sourceExport.sourceSystem`

If any binding layer conflicts, the intake status is `REJECTED_BINDING_CONFLICT`.

## Receipt Model

The receipt is the provenance anchor for every upload. It records:

- Intake identity and timestamps.
- County/FIPS binding.
- Uploader identity.
- Original source file names, sizes, media types, and SHA-256 hashes.
- Extracted artifact inventory.
- Schema version and validation status.
- Row counts and rejected-row counts.
- Dry-run import summary.
- Approval state.
- Rollback references.
- Secret-scan result.

Receipts must be append-only. Corrections create a successor receipt with `supersedesReceiptId`; they do not edit the original receipt.

## Validation Pipeline

Validation is ordered to fail early before expensive parsing:

1. Intake metadata validation.
2. Uploader authorization and county/FIPS binding.
3. File safety screening and no-secret screening.
4. Hash and immutable storage receipt.
5. Format-specific parsing.
6. Required field validation.
7. Parcel identifier uniqueness and normalization check.
8. Row count and rejected-row accounting.
9. Transform declaration check.
10. Dry-run import report generation.
11. Approval readiness decision.

The first production-grade implementation should make these checks deterministic and reproducible from evidence artifacts.

## Staging Lifecycle

The MVP defines staging lifecycle states without creating or mutating runtime tables:

| State | Meaning | Allowed Next State |
| --- | --- | --- |
| `UPLOADED` | Original source artifact stored and hashed. | `VALIDATING`, `REJECTED` |
| `VALIDATING` | File and schema checks are running. | `VALIDATED`, `REJECTED` |
| `VALIDATED` | Required checks passed; dry-run report is available. | `PENDING_APPROVAL`, `REJECTED` |
| `PENDING_APPROVAL` | Reviewer decision required before import authorization. | `APPROVED_FOR_IMPORT`, `REJECTED` |
| `APPROVED_FOR_IMPORT` | Authorization artifact exists for later canonical import. | none in MVP |
| `REJECTED` | Intake cannot proceed without a new upload or exception. | none |

Future non-MVP states for a separate approved implementation phase: `IMPORTED`, `ROLLBACK_REQUESTED`, `ROLLED_BACK`.

## Dry-Run Import Report

Dry-run import must describe what would change without changing the database:

- Target canonical dataset and schema version.
- Candidate row counts by source file and logical entity.
- Insert, update, unchanged, duplicate, rejected, and unresolved counts.
- Required transforms and their justifications.
- County/FIPS echo.
- Parcel identifier normalization summary.
- Referential integrity warnings.
- Estimated rollback scope if a future import is approved.
- Evidence artifact paths and SHA-256 hashes.

The report must end with `canonicalImportAllowed: false` for MVP; future import enablement requires a separate approved implementation phase.

## Approval Boundary

Approval is separate from validation. Passing validation means the upload is eligible for review; it does not permit canonical import.

Approval requires:

- Receipt present and schema-valid.
- Original upload SHA-256 present.
- No secret-like material detected.
- County/FIPS binding passed.
- Required schema checks passed.
- Rejected-row report present, even if empty.
- Dry-run import report present.
- Reviewer identity, timestamp, and decision reason recorded.

## Rollback Model

Rollback is receipt-driven. A future import lane must record:

- Import receipt ID.
- Canonical tables touched.
- Before/after row counts.
- Batch ID or transaction ID.
- Immutable copy of dry-run report used for approval.
- Rollback plan hash.
- Rollback execution receipt if rollback occurs.

No rollback claim is valid without a receipt chain from source upload to import authorization to import execution.

## Evidence Artifacts

Each intake should produce an evidence folder:

```text
os-platform/core/pilot/evidence/county-data-intake/<intakeId>/
  source-upload-receipt.json
  source-upload-receipt.md
  validation-checklist.json
  rejected-rows.csv
  dry-run-import-report.json
  dry-run-import-report.md
  approval-decision.json
  artifact-manifest.json
```

For the MVP design lane, these paths are canonical targets only. Any future approved phase must add tests before defining runtime writers.

## Runtime Production Definition

This lane reaches production readiness only when an implementation can prove, from a clean checkout and immutable evidence, that:

- Uploads are authenticated and county-bound.
- Files are hashed before parsing.
- Unsupported or unsafe inputs are rejected.
- Receipts are schema-valid and append-only.
- Validation reports are reproducible.
- Dry-run import makes no DB changes.
- Approval is required before canonical import.
- Rollback evidence is bound to the source receipt.
