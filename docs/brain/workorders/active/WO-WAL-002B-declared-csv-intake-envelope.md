# WO-WAL-002B — Declared CSV Intake Envelope

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_PENDING_PROTECTED_MERGE` |
| Program | Washington Assessor Launch V1 |
| Parent | `WO-WAL-002` |
| Base | `b740c3dadf069c0e7bfacf7a3e2c4e53dd5a388e` |
| Risk | R3 bounded in-memory declaration and evidence contract |
| Contract reservation | `wal.county-upload.csv-envelope.v1` |
| Environment reservation | `local-memory-csv-envelope-only` |
| Terminal condition | `EXPLICIT_CSV_DECLARATION_EXACT_CONTENT_EVIDENCE_AND_BOUNDED_PARSE_PASS` |

## Objective

Add the smallest admission envelope above protected-complete `wal.county-upload.csv-parser.v1`.
The envelope proves that supplied in-memory bytes agree with an explicit CSV declaration, produces
exact immutable content evidence, and returns the bounded parser result. It creates no upload path,
county authority, persistence, or runtime readiness claim.

## Exact path reservation

- `docs/brain/workorders/active/WO-WAL-002B-declared-csv-intake-envelope.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvIntakeEnvelope.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvIntakeEnvelopeTests.cs`

No other repository path is writable under this child Work Order.

## Contract

`wal.county-upload.csv-envelope.v1` accepts a declaration plus in-memory bytes and:

1. requires the exact format token `csv`, a safe leaf filename with a non-empty `.csv` stem, and
   the parameter-free `text/csv` media type;
2. rejects path-like names, whitespace ambiguity, known binary/archive/document/database signatures,
   and UTF-16 BOMs before parsing, including signatures immediately after one permitted UTF-8 BOM;
3. rejects candidates above the protected parser byte limit before allocating a snapshot, then copies
   the supplied bytes before evidence or parsing so caller mutation cannot alter the admitted
   snapshot;
4. computes lowercase SHA-256 and exact byte length over the same copied bytes passed to the protected
   bounded parser;
5. propagates parser validation failures and cancellation without fallback or format guessing;
6. returns canonical declaration fields, immutable content evidence, and the parser's deeply
   read-only document snapshot.

The signature check is a contradiction guard, not content-type detection. Passing it does not prove
that arbitrary bytes are CSV; the strict parser remains authoritative for CSV syntax.

## Denials

- No authentication, authorization, county claim or county-data binding.
- No API/controller, multipart handling, filesystem, staging, quarantine, persistence, promotion,
  rollback, mapping, lineage store, or UI.
- No delimiter, encoding, extension, or media-type guessing and no unknown-format fallback.
- No network, external source, credential, protected/live county data, or production behavior.
- No completion claim for broad parent `WO-WAL-002`.

## Required proof

- exact declaration agreement and canonical receipt fields;
- exact SHA-256/byte-length evidence over the immutable admitted snapshot;
- caller-mutation isolation and deeply read-only parsed headers/rows;
- path-like filename, extension, format, parameterized/wrong media type, container signature, and
  UTF-16 signature denial;
- initial UTF-8 BOM acceptance through the protected parser without allowing it to mask a forbidden signature;
- pre-snapshot rejection above the protected parser byte limit;
- parser-bound propagation and pre-cancelled token propagation;
- exact three-path diff.

## Validation

```text
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter FullyQualifiedName~CountyCsvIntakeEnvelopeTests
git diff --check
git status --short
```

## Continuation

Completion returns to open parent `WO-WAL-002`. Later exact children must separately own
authenticated county binding, upload transport, provenance/lineage storage, quarantine, atomic
promotion, rollback, API, and UI behavior.
