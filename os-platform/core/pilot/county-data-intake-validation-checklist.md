# County Data Intake MVP Validation Checklist

Generated: 2026-05-27

This checklist defines MVP validation gates for assessor-provided county exports. It is design-only and does not authorize production binding, DB mutation, or canonical import.

## Gate A: Intake Request

- Uploader is authenticated.
- Uploader identity includes id, email, display name, organization, and auth method.
- Uploader is authorized for the declared county FIPS.
- County selection uses controlled `WA` county/FIPS registry values.
- Export type, source system, export timestamp, declared format, and data domains are provided.
- Upload request contains no password, token, cookie, connection string, API key, private key, or shared secret.

Failure status:

- `REJECTED_BINDING_CONFLICT` for authorization or county mismatch.
- `REJECTED_SECRET` for secret-like values.

## Gate B: File Safety

- File format is one of `.csv`, `.txt`, `.xlsx`, `fgdb_directory`, `zipped_fgdb`, or `zip_generic`.
- File size is within the configured MVP limit.
- File name is normalized and contains no path separators.
- ZIP entries contain no absolute paths, parent-directory traversal, duplicate normalized names, unsupported nested archives, or secret-like names.
- Password-protected and encrypted archives are rejected.
- Executables, scripts, browser exports, connection profiles, private keys, and unrelated binaries are rejected.

Failure status:

- `REJECTED_UNSUPPORTED_FORMAT`
- `REJECTED_SECRET`

## Gate C: Receipt And Hashing

- Original upload is stored before parsing.
- SHA-256 is computed for the original upload.
- SHA-256 is computed for every extracted artifact.
- Receipt ID and intake ID are generated.
- Receipt validates against `county-data-intake-receipt.schema.json`.
- `noSecretValuesRecorded` is true.
- Receipt is append-only; corrections use `supersedesReceiptId`.

Failure status:

- `REJECTED_SCHEMA`
- `REJECTED_SECRET`

## Gate D: County/FIPS Binding

- Declared state is `WA`.
- Declared FIPS matches `^53[0-9]{3}$`.
- Declared county token matches the selected county.
- Uploader authorization includes the declared FIPS.
- File headers, metadata, or declared source metadata do not contradict the selected county/FIPS.
- Multi-county files are rejected unless a future explicit multi-county intake lane is designed.

Failure status:

- `REJECTED_BINDING_CONFLICT`

## Gate E: Schema Validation

- Required fields are present for the declared data domain.
- Parcel exports include a parcel identifier candidate.
- Valuation exports include parcel identifier and valuation fields.
- Sales exports include parcel identifier or sale identifier plus sale date and sale amount candidates.
- Geometry exports include a parcel join key or declared crosswalk.
- TXT exports declare delimiter and header behavior.
- XLSX exports declare workbook sheet and header row.
- `zip_generic` exports declare the authoritative member file.
- `zipped_fgdb` exports declare the authoritative FGDB layer.

Failure status:

- `REJECTED_SCHEMA`

## Gate F: Row-Level Validation

- Total row count is recorded.
- Empty rows are counted and rejected.
- Required field failures are counted and included in rejected-row report.
- Duplicate parcel identifiers are counted and included in rejected-row report.
- Invalid county/FIPS values are counted and included in rejected-row report.
- Transform-dependent rows are flagged with transform reason.
- Rejected-row report is generated even when count is zero.

Required rejected-row columns:

```text
sourceRowNumber,rejectionCode,rejectionReason,parcelIdCandidate,countyFips,rawFragmentSha256
```

## Gate G: Transform Declaration

- Every transform is named and versioned.
- Transform inputs and outputs are described.
- Lossy transforms are flagged.
- Parcel ID normalization is summarized with before/after examples.
- Geometry-to-parcel joins are summarized if present.
- Transform report is linked from dry-run import report.

Failure status:

- `REJECTED_SCHEMA` if an undeclared transform is required.

## Gate H: Dry-Run Import

- Dry-run performs no DB mutation.
- Report includes candidate rows, inserts, updates, unchanged rows, rejected rows, duplicates, unresolved joins, and warnings.
- Report echoes county/FIPS and source receipt ID.
- Report sets `canonicalImportAllowed: false`.
- Report includes artifact path and SHA-256.
- Any import authorization remains absent until approval.

## Gate I: Approval Readiness

- Receipt is schema-valid.
- Original and extracted hashes are present.
- Secret scan passed.
- County/FIPS binding passed.
- Required schema and row checks passed or documented exceptions exist.
- Rejected-row report exists.
- Dry-run import report exists.
- Reviewer decision artifact is ready but not pre-approved.

Passing this gate sets intake state to `PENDING_APPROVAL`; it does not import data.

## Gate J: Rollback Readiness

- Rollback is marked required for any future import.
- Future import must bind batch ID, canonical tables touched, before/after row counts, dry-run report hash, approval artifact hash, and rollback plan hash.
- Rollback receipt must be linked if rollback executes.

This gate remains design-only until the canonical import lane exists.
