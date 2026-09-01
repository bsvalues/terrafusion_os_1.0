# WO-WAL-003D — Profile-Bound Fake ADO Connection Session

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Parent | `WO-WAL-003` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Risk | R4 fake-ADO open-connection composition inside the R5 WAL mission |
| Contract | `wal.external-readonly.db-connection-session.v1` |
| Environment | `fake-ado-open-connection-only` |
| Dispatch clearance | `WO-WAL-000D` protected merge `f21cfa6f61db0bac7d5da643c948991a14f459fd` |
| Terminal condition | `FAKE_ADO_CALLER_OPEN_CONNECTION_SINGLE_COMMAND_READ_SESSION_PROVEN` |
| Protected completion | PR `#1505`, merge `9155856c2d970f3d772c3f7790f91e017fb47dd8`; reviewed fix `cc8a3fd1a9c648b07a0f7516df1f51b398433c10`; integrated head `d006d3567a4a7e9da43e014e021b5cf81f976e39` |

## Objective

Compose one protected `WO-WAL-003A` profile-bound request through the protected `WO-WAL-003B`
execution envelope and `WO-WAL-003C` fake command adapter over one caller-owned, already-open fake
ADO connection. The session creates and owns exactly one command and returns the existing immutable,
bounded execution result.

This child remains a deterministic fake-only contract. It does not connect to an external source and
does not claim that source-side DML absence has been observed.

## Exact reservations

### Paths

- `docs/brain/workorders/active/WO-WAL-003D-profile-bound-ado-connection-session.md`
- `backend/src/TerraFusion.Core/Sync/Execution/ReadOnlyDbConnectionSession.cs`
- `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyDbConnectionSessionTests.cs`

### Contract

- `wal.external-readonly.db-connection-session.v1`

### Environment

- `fake-ado-open-connection-only`

No external network, county credential, secret, source database, production environment, or live
county data is reserved or authorized.

## Caller-owned connection decision

The session accepts exactly one caller-owned `DbConnection` that must report exactly
`ConnectionState.Open` at construction and immediately before dispatch. It never reads or changes a
connection string, opens, closes, disposes, discovers, retries, or replaces that connection. The
caller must keep it stable for the bounded session.

The .NET `DbConnection` type cannot prove that an instance is fake, that its state report is honest,
or that its role is source-side read-only. Therefore `fake-ado-open-connection-only` is an authority
boundary, not a runtime type claim. Supplying a live connection, credential, county database, or
protected data is forbidden even if the local contract tests pass.

## Implemented contract

1. The sealed session is configured with one already-open connection, one immutable governed source
   profile, positive row and field limits within the protected ceilings, and an explicit time
   provider. It exposes only one asynchronous execution operation.
2. Before dispatch, the session requires exact protected profile provenance, a request within its
   configured row bound, an exactly open connection, and a non-cancelled token. It then takes a
   provisional atomic claim. A registered cancellation callback and final dispatch transition
   compete on that same state: cancellation that wins releases the claim, creates no command, and
   does not consume the session.
3. Once the final atomic dispatch transition wins, the session is consumed on success, exception,
   or later cancellation. A second or concurrent call cannot create another command, and there is
   no retry, fallback, discovery, or alternate execution path.
4. The session calls `CreateCommand` exactly once and fails closed if the returned command is null or
   is not reference-bound to the supplied connection. It never assigns a connection or attaches a
   transaction.
5. The created command is session-owned and asynchronously disposed exactly once on every path after
   creation. The protected adapter continues to own and dispose only its returned reader, while the
   caller continues to own the connection.
6. The exact command, field limit, and time provider are supplied to the protected command adapter.
   That adapter is supplied to the protected executor with the exact governed profile and configured
   row/field limits, and the request is composed through that path exactly once.
7. Protected command projection, reader-only execution, parameter and result bounds, immutable
   snapshots, deterministic observation time, cancellation, and exception behavior remain enforced
   by the composed `WO-WAL-003A` through `WO-WAL-003C` contracts.

## Denials

- no connection-string read, discovery, factory, open, close, dispose, change-database, role, or
  credential behavior;
- no `ExecuteNonQuery`, `ExecuteScalar`, stored procedure, transaction, prepare, cancel,
  next-result, retry, or fallback API;
- no dependency-injection registration, live connector, database, county source, PACS, protected
  data, external network, filesystem, or production access;
- no persistence, durable checkpoint, lineage landing, quarantine, canonical promotion, schema
  mutation, writeback, or synchronization-back behavior;
- no claim that an open fake connection, lexical guard, fake command, or unit test proves observed
  source-side no-DML;
- no files outside the three exact path reservations.

## Required proof

- reflection proves the sealed session exposes only one execution operation and the exact contract
  ID;
- constructor tests reject null dependencies, invalid bounds, and every connection state other than
  exactly open;
- pre-dispatch cancellation, including cancellation racing the provisional dispatch claim, state
  drift, profile drift, and request-bound failure create no command and do not consume the session;
- protected-executor composition proves exact provenance, guarded command and parameters, one
  command creation, one reader execution, bounded enumeration, deterministic observation time, and
  immutable output;
- the created command is reference-bound to the supplied connection and is disposed exactly once,
  while the supplied connection is never opened, closed, changed, or disposed;
- null, wrongly bound, transaction-attached, failing, cancelled, repeated-use, and concurrent paths
  fail closed without retry; post-creation paths dispose the command;
- fake counters prove zero connection lifecycle, nonquery, scalar, transaction, prepare, cancel,
  retry, fallback, and next-result calls;
- focused and protected 003A/003B/003C regression tests pass without any external resource;
- `git diff --check` passes and the diff contains only the three reserved paths.

## Proof boundary and continuation

This child supplies the final fake-only ADO connection composition currently reserved by the WAL
program. It does not bind a real adapter to a read-only credential or source role, inspect live
permissions, collect observed external command evidence, implement durable checkpoints, persist
lineage, or promote county data. Those remain mandatory R5 continuation work under `WO-WAL-003` and
require separately authorized source and credential authority. Production connection remains denied
before WAL-007 release acceptance.

Protected PR `#1505` completed this child as merge
`9155856c2d970f3d772c3f7790f91e017fb47dd8`, containing reviewed fix
`cc8a3fd1a9c648b07a0f7516df1f51b398433c10` and updated integrated head
`d006d3567a4a7e9da43e014e021b5cf81f976e39`. Completion of this bounded child does not complete
`WO-WAL-003`. No `WO-WAL-003E` is registered: the named source, read-only credential/role and
secret-store reference, execution/network environment, data-handling classification, and source-side
no-DML evidence method remain an explicit authority wall recorded by
[`WO-WAL-000E`](WO-WAL-000E-d-wave-reconciliation-and-e-wave-reservations.md).
