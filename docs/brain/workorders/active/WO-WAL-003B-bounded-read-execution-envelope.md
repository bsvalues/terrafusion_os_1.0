# WO-WAL-003B — Bounded Read Execution Envelope

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Parent | `WO-WAL-003` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Risk | R3 bounded mock execution contract inside the R5 WAL mission |
| Contract | `wal.external-readonly.execution-envelope.v1` |
| Environment | `mock-read-executor-only` |
| Terminal condition | `MOCK_BOUNDED_READ_EXECUTION_ENVELOPE_PROVEN` |

## Objective

Seal one `WO-WAL-003A` profile-bound request and adapter invocation inside a deterministic execution
envelope. The envelope fails closed on profile drift, unbounded requests, oversized results, null
adapter pages or rows, and mutable result values. Its output is a deep immutable snapshot of the
request provenance and adapter page.

This child is a mock-only contract. It does not connect to an external source and does not claim that
source-side DML absence has been observed.

## Exact reservations

### Paths

- `docs/brain/workorders/active/WO-WAL-003B-bounded-read-execution-envelope.md`
- `backend/src/TerraFusion.Core/Sync/Execution/ReadOnlyCountySourceExecutor.cs`
- `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyCountySourceExecutorTests.cs`

### Contract

- `wal.external-readonly.execution-envelope.v1`

### Environment

- `mock-read-executor-only`

No external network, county credential, secret, source database, production environment, or live
county data is reserved or authorized.

## Implemented contract

1. The sealed executor is configured with one explicit `IReadOnlyCountySourceAdapter`, one immutable
   snapshot of a governed `ReadOnlyCountySourceProfile`, a positive result-row limit no larger than
   the protected `ReadOnlySourceReadRequest.MaximumRows` ceiling, and a positive result-field limit
   no larger than the contract's 256-field ceiling.
2. Before dispatch, the executor requires exact ordinal equality for every request/profile provenance
   field and requires the request row bound to fit inside its configured result bound.
3. A valid request invokes `ReadPageAsync` exactly once. The envelope has no retry, fallback,
   discovery, connection lifecycle, or alternate adapter path.
4. The result must fit both the request and configured row limits and every row must fit the
   configured field limit. Adapter-controlled collection counts are never used as allocation
   capacities; enumeration independently enforces both ceilings. Null pages, null row collections,
   null rows, and mutable or unknown result values fail closed.
5. Successful output independently snapshots the profile provenance, guarded command text,
   parameters, request and result bounds, checkpoints, observation time, rows, and row dictionaries.
   Only null, enums, and explicitly admitted immutable scalar values can cross the snapshot boundary.
6. Pre-dispatch cancellation prevents invocation. Adapter exceptions and cancellation propagate
   unchanged after the single invocation; the envelope neither retries nor translates them.

## Denials

- no dependency-injection registration or production interface modification;
- no live connector, external network, source database, county credential, secret, or PACS access;
- no filesystem output, database write, persistence, checkpoint advancement, quarantine, canonical
  promotion, or TerraFusion runtime activation;
- no source-system DML, DDL, writeback, schema mutation, or synchronization-back API;
- no claim that a lexical guard, mock adapter, or unit test proves observed source-side no-DML;
- no files outside the three exact path reservations.

## Required proof

- constructor tests reject zero, negative, and above-ceiling configured result bounds;
- profile drift and a request above the configured row bound fail before adapter invocation;
- a valid request reaches the exact adapter once with the original request and cancellation token;
- oversized, over-wide, changing-count, null, or mutable adapter results fail closed after only one
  invocation without trusting adapter counts for allocation;
- caller mutation after execution cannot alter the output row collection, row dictionaries, or
  parameter snapshot;
- adapter exceptions and cancellation propagate without retry or translation;
- focused `TerraFusion.Unit.Tests` pass without any external resource;
- `git diff --check` passes and the diff contains only the three reserved paths.

## Proof boundary and continuation

This child reached protected main in PR #1495 as merge
`3992e89f689127313dcd9f877ee865c4a9ae2ba9` from exact integrated head
`e62cb2367aa7393acad030f492cb181b5af1266b`. It strengthens the mock execution boundary only.
`WO-WAL-003C` separately owns the next fake-ADO reader adapter contract. No child here binds a real
adapter to a read-only source credential or role, collects observed external command/method evidence,
implements durable checkpointing, persists lineage, or promotes county data. Those remain mandatory
continuation work under `WO-WAL-003`; production connection remains denied before WAL-007 release
acceptance.
