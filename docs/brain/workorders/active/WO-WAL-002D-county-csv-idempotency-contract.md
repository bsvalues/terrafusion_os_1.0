# WO-WAL-002D — County CSV Idempotency Identity

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_VALIDATED_LOCALLY` |
| Program | Washington Assessor Launch V1 |
| Parent | `WO-WAL-002` |
| Base | `f21cfa6f61db0bac7d5da643c948991a14f459fd` |
| Risk | R3 deterministic in-memory evidence identity |
| Contract reservation | `wal.county-upload.csv-idempotency.v1` |
| Environment reservation | `local-memory-csv-idempotency-only` |
| Terminal condition | `CSV_COUNTY_DATASET_CONTENT_IDEMPOTENCY_KEY_DETERMINISTIC_AND_BOUNDED_PROVEN` |

## Objective

Derive one deterministic, domain-separated SHA-256 idempotency identity from the exact canonical
county, closed dataset, lowercase content digest, and byte length carried by a protected
`wal.county-upload.csv-county-bound-intake.v1` receipt. This child creates an identity only. It does
not look up, store, decide, reserve, or enforce duplicate state.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-002D-county-csv-idempotency-contract.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvIntakeIdempotency.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvIntakeIdempotencyTests.cs`

No other path is writable. The environment is local deterministic memory only; no filesystem,
network, database, identity provider, credential, protected county file, or production resource is
admitted.

## Frozen input and serialization

The only admitted input parameter is one 002C receipt-shaped value. Separate caller-supplied county,
dataset, hash, and length arguments are denied because they could drift from one another and bypass
the protected binding. This child revalidates only the identity-bearing subset: contract identifiers,
county, dataset, fixed posture, digest, byte length, and agreement with `Document.InputBytes`. It does
not validate filename, format, media type, headers, rows, or any other predecessor invariant, and
therefore does not prove that the complete receipt was structurally valid or genuinely issued.

The exact UTF-8 key preimage is:

```text
wal.county-upload.csv-idempotency.v1
county=<canonical Washington county key>
dataset=<parcels|sales>
sha256=<64 lowercase hexadecimal characters>
bytes=<positive invariant decimal byte length>
```

The preimage contains a final line feed. Every variable field has a closed alphabet or fixed shape,
so labeled line separation is unambiguous. The returned key is lowercase SHA-256 of those exact
bytes. Filename, media type, headers, rows, authority mode, and caller order do not enter the key.

## Contract

1. Require exact protected 002C and 002B contract identifiers and non-null binding, intake receipt,
   content evidence, and document as the minimum identity-bearing structural subset.
2. Replace the caller county object with the exact equal instance from the protected canonical
   39-county registry; altered or unknown identities fail closed.
3. Admit only `Parcels` and `Sales`, and require the protected fixed posture
   `CountyProvided` + `Protected` + `Operate`.
4. Require a 64-character lowercase hexadecimal digest, byte length from 1 through
   `Int32.MaxValue`, and exact agreement between content byte length and parser document input bytes.
5. Serialize with invariant decimal formatting, hash once, and return a scalar-only immutable
   identity snapshot containing the canonical county instance, closed dataset, copied content
   evidence, and lowercase key.

## Denials and proof boundary

- no raw bytes, reparse, digest recomputation, receipt issuance authentication, or source
  authenticity/freshness claim;
- no full predecessor receipt validation; filename, format, media type, headers, and rows are ignored
  and cannot acquire validation truth from this identity-only child;
- no duplicate lookup, duplicate decision, store, reservation, lock, cache, persistence, staging,
  quarantine, promotion, rollback, API, controller, UI, or uploader identity;
- no authentication, authorization grant, live county data, external system, credential, network,
  filesystem, database, or production behavior;
- no claim that this bounded child completes `WO-WAL-002` or authorizes a later promotion.

Because the original bytes and an unforgeable issuance token are absent, structural agreement cannot
prove that a copied receipt was genuinely issued by the predecessor. Later intake work must bind any
duplicate decision or persistence to separately authorized evidence.

## Required validation

- exact known-vector key and deterministic repeatability;
- all 39 canonical counties across both admitted datasets;
- domain separation for every county/dataset/hash/length component;
- null/nested-null, wrong-contract, altered-county, unsupported-dataset, wrong-posture, malformed
  digest, out-of-bound length, and document-length mismatch refusal;
- explicit proof that ignored predecessor metadata/document fields neither enter the key nor become
  validated by this child;
- immutable canonical output and an exact public surface with no duplicate-store/decision seam;
- focused `CountyCsvIntakeIdempotencyTests` plus protected 002A/002B/002C compatibility tests where
  locally available;
- `git diff --check` and exact three-path audit.

Local validation used the cached .NET 8 SDK in a disposable Docker container with networking
disabled. NuGet audit lookup was disabled because the local host has no .NET SDK and the bounded
container admitted no network. The focused 002D suite passed 20/20, and the combined protected
002A/002B/002C/002D compatibility filter passed 91/91. Build and test outputs remained inside the
disposable container.

## Continuation

Successful validation proves only the reserved deterministic identity contract. Completion returns
to open parent `WO-WAL-002`; authentication, transport, duplicate storage/decision, lineage,
quarantine, atomic promotion, rollback, API, and UI remain separately reserved future work.
