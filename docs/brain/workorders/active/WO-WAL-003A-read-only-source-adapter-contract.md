# WO-WAL-003A — Read-Only Source Adapter Contract

| Field | Value |
| --- | --- |
| Status | `IN_PROGRESS` |
| Parent | `WO-WAL-003` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Risk | R3 bounded contract and static guard foundation inside the R5 WAL mission |
| Terminal condition | `READ_ONLY_SOURCE_ADAPTER_CONTRACT_AND_FAIL_CLOSED_COMMAND_GUARD_PROVEN` |

## Objective

Define the smallest reusable county source-profile and read-only adapter boundary for later
SQL-family adapters. The contract must expose reads only, and its command guard must fail closed on
anything that is not one unambiguous read command.

This child does not connect to a county source. It establishes a mock-only contract and static
command gate; it does not claim that source-side DML absence has been observed.

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
2. Add a read-only adapter interface whose only operation is bounded row reading.
3. Add a conservative SQL-family command guard that accepts only one explicit `SELECT` command and
   rejects DML, DDL, execution/transaction commands, `SELECT INTO`, comments, statement separators,
   control/format characters, and any ambiguous leading operation.
4. Add focused contract tests using in-process strings and reflection only.

## Denials

- no write, mutate, execute, sync-back, schema-change, connection-lifecycle, or credential API;
- no modification or registration of an existing production interface or dependency-injection
  surface;
- no DML, DDL, stored procedure, dynamic SQL, transaction-control, multi-statement, comment, or
  obfuscated command acceptance;
- no external network, database, county source, credential, secret, PACS, or production access;
- no claim that static inspection or unit tests prove observed live no-DML behavior;
- no files outside the exact path reservations.

## Required proof

- the source-profile contract carries the exact governed identities needed by later adapters;
- reflection shows the adapter exposes a bounded read method and no mutation-shaped method;
- a simple parameterized `SELECT` is accepted;
- DML, DDL, `SELECT INTO`, execution/transaction commands, multiple statements, comments,
  zero-width/control obfuscation, blank input, and ambiguous commands are rejected;
- focused `TerraFusion.Unit.Tests` pass without any external resource;
- `git diff --check` passes and the diff contains only the four reserved paths.

## Proof boundary and continuation

The guard is defense in depth, not a SQL parser or a source-side audit. A later exact WAL child must
bind a real adapter to a read-only source credential/role where supported and capture observed
source-side command or method evidence. Only that later evidence can satisfy WO-WAL-003's live
no-DML requirement.
