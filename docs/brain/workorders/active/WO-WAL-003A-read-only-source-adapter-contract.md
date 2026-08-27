# WO-WAL-003A — Read-Only Source Adapter Contract

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_PENDING_DOTNET_VALIDATION` |
| Parent | `WO-WAL-003` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Risk | R3 bounded contract and static guard foundation inside the R5 WAL mission |
| Terminal condition | `LEXICAL_READ_GUARD_AND_PROFILE_BOUND_REQUEST_IMPLEMENTED_PENDING_DOTNET_VALIDATION` |

## Objective

Define the smallest reusable county source-profile and read-only adapter boundary for later
SQL-family adapters. The contract exposes a read-shaped operation, and its command value admits only
one deliberately narrow lexical `SELECT` subset.

This child does not connect to a county source. It establishes a mock-only contract and lexical
command gate; it does not claim that lexical inspection proves semantic read-only behavior or that
source-side DML absence has been observed.

## Exact reservations

### Paths

- `docs/brain/workorders/active/WO-WAL-003A-read-only-source-adapter-contract.md`
- `backend/src/TerraFusion.Core/Sync/Profiles/IReadOnlyCountySourceAdapter.cs`
- `backend/src/TerraFusion.Core/Sync/Profiles/ReadOnlySourceCommandGuard.cs`
- `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyCountySourceAdapterContractTests.cs`

### Contracts

- `wal.source-profile.v1`
- `wal.external-readonly.v1`

### Environment

- `mock-source-only`

No external network, county credential, secret, source database, production environment, or live
county data is reserved or authorized.

## Allowed implementation

1. Add an immutable source-profile shape with explicit county, source, family, extraction, schema,
   mapping, checkpoint, and freshness identities.
2. Bind every read request structurally to its source profile, admit only immutable scalar
   parameter values into its defensive snapshot, and expose only the bound request through the
   adapter interface.
3. Add a conservative SQL-family command guard that accepts only one explicit `SELECT` command and
   rejects DML, DDL, execution/transaction commands, `SELECT INTO`, comments, statement separators,
   control/format characters, parentheses/function-call syntax, sequence `NEXTVAL`/`CURRVAL` access,
   and any ambiguous leading operation. Guarded command construction must be private and reachable
   only through `ReadOnlySourceCommand.RequireRead`.
4. Add focused contract tests using in-process strings and reflection only.

## Denials

- no write, mutate, execute, sync-back, schema-change, connection-lifecycle, or credential API;
- no modification or registration of an existing production interface or dependency-injection
  surface;
- no DML, DDL, stored procedure, dynamic SQL, transaction-control, multi-statement, comment, or
  obfuscated command acceptance;
- no external network, database, county source, credential, secret, PACS, or production access;
- no claim that static inspection or unit tests prove observed live no-DML behavior;
- no result-bound/provenance enforcement or sealed execution facade in this child; those remain
  mandatory continuation work and this foundation is denied for live use until they exist;
- no files outside the exact path reservations.

## Required proof

- the source-profile contract carries the exact governed identities needed by later adapters;
- reflection shows guarded command constructors are private and the adapter accepts only one
  profile-bound request plus cancellation;
- caller mutation after request construction cannot alter the request's parameter snapshot, and
  mutable parameter values are rejected before an adapter can observe them;
- a simple parameterized `SELECT` is accepted;
- DML, DDL, `SELECT INTO`, execution/transaction commands, multiple statements, comments,
  zero-width/control obfuscation, parentheses/function calls, sequence access, blank input, and
  ambiguous commands are rejected;
- focused `TerraFusion.Unit.Tests` pass without any external resource;
- `git diff --check` passes and the diff contains only the four reserved paths.

## Proof boundary and continuation

The lexical guard is defense in depth, not a SQL parser, semantic capability proof, sealed executor,
or source-side audit. A later exact WAL child must own result bounds and provenance, provide a sealed
execution path that cannot ignore the guarded command or row limit, bind a real adapter to a
read-only source credential/role where supported, and capture observed source-side command or method
evidence. Only that later evidence can satisfy WO-WAL-003's live no-DML requirement. This mock-only
foundation is not authorized for live use.

The implementation is complete, but the authoring environment does not expose a `dotnet` executable.
The focused test command must pass in an SDK-equipped integration environment before this child can
leave `IMPLEMENTED_PENDING_DOTNET_VALIDATION`.
