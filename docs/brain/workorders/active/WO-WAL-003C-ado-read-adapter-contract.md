# WO-WAL-003C — ADO Read Adapter Contract

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Parent | `WO-WAL-003` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Risk | R4 fake-ADO execution contract inside the R5 WAL mission |
| Contract | `wal.external-readonly.db-command-adapter.v1` |
| Environment | `fake-ado-reader-only` |
| Terminal condition | `FAKE_ADO_READER_SINGLE_EXECUTION_AND_BOUNDED_PAGE_PROVEN` |

## Objective

Project one protected `WO-WAL-003A` guarded request onto one already-created fake ADO command,
execute only its reader path once, bound actual row and field enumeration, and compose the resulting
page through the protected `WO-WAL-003B` executor.

This child remains a deterministic fake-only contract. It does not connect to an external source and
does not claim that source-side DML absence has been observed.

## Exact reservations

### Paths

- `docs/brain/workorders/active/WO-WAL-003C-ado-read-adapter-contract.md`
- `backend/src/TerraFusion.Core/Sync/Execution/ReadOnlyDbCommandAdapter.cs`
- `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyDbCommandAdapterTests.cs`

### Contract

- `wal.external-readonly.db-command-adapter.v1`

### Environment

- `fake-ado-reader-only`

No external network, county credential, secret, source database, production environment, or live
county data is reserved or authorized.

## Supplied-command decision

The `WO-WAL-000C` phrases “already-supplied fake DbConnection/command reader” and “already-supplied
fake ADO reader surface” are frozen here as exactly one caller-owned, already-created `DbCommand`.
The adapter accepts neither a `DbConnection` nor a command factory. It never discovers, creates,
opens, closes, or disposes a connection and never disposes the supplied command; it owns only the
reader returned by its single execution.

The .NET `DbCommand` type cannot prove that an instance is fake or that a supplied connection is not
live. Therefore the `fake-ado-reader-only` environment is an authority boundary, not a runtime type
claim: supplying a live command, credential, county connection, or protected data is forbidden even
if this contract's local tests pass.

## Implemented contract

1. The sealed adapter is configured with one supplied command, a positive field limit no larger than
   the protected 256-field ceiling, and an explicit time provider for deterministic observation time.
2. Pre-cancellation prevents dispatch. Once dispatch begins, the adapter is consumed on success,
   exception, or cancellation; a second or concurrent call cannot execute the command again. A
   request above the protected 256-parameter-value ceiling fails after that single-use transition
   but before command projection or reader execution.
3. An attached transaction fails closed before the single-use transition. Within the parameter cap,
   the adapter projects `CommandType.Text`, the exact guarded command text, `UpdateRowSource.None`,
   and one ordinally ordered input parameter per request value, mapping null to `DBNull.Value` after
   clearing stale fake parameters.
4. The only execution operation is `ExecuteReaderAsync` with `SingleResult | SequentialAccess`. The
   adapter has no nonquery, scalar, transaction, connection-lifecycle, retry, or fallback path.
5. Reader field count must be positive and within the configured cap before allocation. Field names
   must be nonblank and ordinally unique. Actual row enumeration admits at most the request row bound
   plus one overflow sentinel read, and never enumerates the remainder.
6. Every admitted row is snapshotted into an immutable dictionary. `DBNull` becomes null; only the
   immutable scalar set shared with the protected executor is admitted. Mutable and unknown values
   fail closed.
7. The returned page has no next-checkpoint claim. The reader is asynchronously disposed exactly
   once, while the caller retains ownership of the supplied command and any fake connection.

## Denials

- no `ExecuteNonQuery`, `ExecuteScalar`, stored procedure, transaction, prepare, cancel, next-result,
  connection discovery/factory, open, close, retry, or fallback API;
- no dependency-injection registration, credential, live connector, database, county source, PACS,
  protected data, external network, filesystem, or production access;
- no persistence, checkpoint advancement, lineage landing, quarantine, canonical promotion,
  schema mutation, writeback, or synchronization-back behavior;
- no claim that a lexical guard, fake ADO command, or unit test proves observed source-side no-DML;
- no files outside the three exact path reservations.

## Required proof

- reflection proves the sealed adapter exposes only one read operation and the exact contract ID;
- constructor and field-schema tests fail closed on null dependencies and non-positive, oversized,
  blank, duplicate, or dishonest field metadata;
- protected-executor composition proves exact guarded command and parameter projection, one reader
  execution, bounded actual row/field access, deterministic observation time, provenance, and
  immutable output; the exact 256-parameter ceiling is admitted, while 257 fails before parameter
  creation, addition, or reader execution and leaves the adapter consumed;
- overflow and infinite-reader fakes stop after the single bounded sentinel read;
- mutable values, attached transactions, null readers, repeated use, and concurrency fail closed;
- command and reader exceptions/cancellation propagate without retry or translation;
- fake counters prove zero nonquery, scalar, transaction, prepare, cancel, connection open/close,
  command creation, retry, fallback, and next-result calls;
- focused and read-only regression tests pass with no external resource;
- `git diff --check` passes and the diff contains only the three reserved paths.

## Proof boundary and continuation

PR #1501 reached protected main as `0374caafdc943b9f4dd53189542d4cc2b2e8fc67` with updated
integrated head `307db297f9e8d037f1ba80c5d039c98da1ed37ec`; independently reviewed head
`d2a3cb746b4109d47bafea5b5033f041763d81df` remains separately identified and is contained in the
protected result. Continuation routes through the exact 003D fake open-connection session child
after `WO-WAL-000D` reaches protected main.

This child proves only a fake ADO reader composition. It does not bind a real adapter to a read-only
credential or role, collect observed external command evidence, implement durable checkpoints,
persist lineage, or promote county data. Those remain mandatory R5 continuation work under
`WO-WAL-003`; production connection remains denied before WAL-007 release acceptance.
