# WO-WAL-002A — Streaming CSV Parser Harness

| Field | Value |
| --- | --- |
| Status | `COMPLETE_ON_PROTECTED_MAIN` |
| Protected merge | PR `#1490`, merge `b98bc2ccd626eb94469b07fd2a9fffdd4802590a` |
| Program | Washington Assessor Launch V1 |
| Parent | `WO-WAL-002` |
| Base | `b57411aef09bae3074d99999f08e4210a20a3208` |
| Risk | R2 bounded in-memory parsing foundation |
| Contract reservation | `wal.county-upload.csv-parser.v1` |
| Environment reservation | `local-memory-stream-only` |
| Terminal condition | `BOUNDED_UTF8_CSV_STREAM_PARSER_FAIL_CLOSED_AND_FOCUSED_TESTS_PASS` |

## Objective

Add the smallest reusable CSV parsing foundation needed by the governed county-upload intake without
creating an upload endpoint, authentication policy, persistence model, ingestion envelope, or county
data path.

## Exact path reservation

- `docs/brain/workorders/active/WO-WAL-002A-streaming-csv-parser-harness.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvStreamParser.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvStreamParserTests.cs`

No other repository path is writable under this child Work Order.

## Contract

`wal.county-upload.csv-parser.v1` accepts a readable stream under an explicit parser policy and:

1. decodes strict UTF-8 only;
2. requires one explicit single-character delimiter and a required, non-empty, unique header row;
3. parses quoted delimiters, quoted CR/LF newlines, and escaped double quotes according to CSV rules;
4. rejects quotes in unquoted fields, characters after a closing quote, unterminated quoted fields,
   inconsistent row widths, blank physical data rows, empty or duplicate headers, invalid UTF-8,
   and trailing data after a bounded limit is exceeded;
5. enforces maximum input bytes, data rows, fields per row, and decoded characters per field;
6. observes cancellation during asynchronous reads;
7. returns parsed headers and rows as a deeply read-only in-memory result without mapping or
   promoting domain records.

## Environment reservation

`local-memory-stream-only` means proof uses only disposable in-memory streams. No authentication,
database, filesystem ingestion, network, external process, secret, PACS/CAMA/GIS source, or live
county data is admitted.

## Denials

- No upload API/controller, authentication, authorization, county claim handling, shared ingestion
  envelope, provenance receipt, quarantine store, staging/canonical promotion, rollback, or UI.
- No database, filesystem import, network, credentials, secrets, protected data, or live county data.
- No XLSX, DBF, GDB, shapefile, ZIP/archive, encoding autodetection, delimiter guessing, or
  unknown-format fallback.
- No package/lockfile, project-file, workflow, registry, queue, or unrelated parser changes.
- No readiness claim for the parent `WO-WAL-002` upload terminal condition.

## Required proof

Focused tests must prove:

- strict UTF-8, explicit delimiter, and required header behavior;
- ordinary rows plus quoted delimiter, newline, and escaped-quote handling;
- EOF trailing-field behavior, split CRLF/quoted CRLF decoding, and blank-row denial;
- deeply read-only headers, outer rows, and individual rows;
- byte, row, field-count, and field-character limits fail closed;
- malformed quoting, inconsistent row width, duplicate/empty headers, and invalid UTF-8 fail closed;
- cancellation is observed;
- parser syntax never substitutes for format detection; the later upload envelope must independently
  gate declared format, extension, MIME and magic bytes without fallback;
- the exact diff contains only the three reserved files.

## Validation

```text
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter FullyQualifiedName~CountyCsvStreamParserTests
git diff --check
git status --short
```

The implementation and focused harness are complete, including static review remediation for deeply
read-only output and explicit boundary cases. The focused test command passed in the protected PR
check suite, and PR `#1490` reached protected main as merge
`b98bc2ccd626eb94469b07fd2a9fffdd4802590a`. Static diff checks remain mandatory for later changes.

## Continuation

Completion returns to `WO-WAL-002`. A later exact child must own the authenticated upload envelope,
county binding, provenance, quarantine, promotion, rollback, API, and UI work.
