# WO-WAL-002E — County CSV Duplicate Decision

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Program | Washington Assessor Launch V1 |
| Parent | `WO-WAL-002` |
| Base | `984018696738e437c91e5d197899e29e3867a2fd` |
| Risk | R3 bounded local-memory duplicate decision |
| Contract reservation | `wal.county-upload.csv-duplicate-decision.v1` |
| Environment reservation | `local-memory-csv-duplicate-decision-only` |
| Terminal condition | `CSV_IDEMPOTENCY_FIRST_SEEN_DUPLICATE_DECISION_FAIL_CLOSED_PROVEN` |

## Objective

Classify one protected 002D county CSV idempotency identity as first-seen, duplicate, or denied in
bounded per-instance memory. One private in-process synchronization primitive linearizes the only
state transition. This child creates no durable or external reservation and does not authenticate,
persist, quarantine, promote, or authorize an upload.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-002E-county-csv-duplicate-decision.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvIntakeDuplicateDecision.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvIntakeDuplicateDecisionTests.cs`

No other path is writable. The environment is bounded local memory only; no filesystem, network,
database, identity provider, credential, protected county file, external lock, or production
resource is admitted.

## Frozen input and validation

The only admitted operation consumes one `CountyCsvIntakeIdempotencyIdentity` value from the 002D
contract. Before entering the synchronized decision path it independently revalidates and snapshots
the complete identity-bearing value:

1. exact `wal.county-upload.csv-idempotency.v1` predecessor contract identifier;
2. value equality with exactly one protected canonical Washington county, replaced by that registry
   instance;
3. the closed `Parcels` or `Sales` dataset;
4. a positive byte length no larger than `Int32.MaxValue` and a 64-character lowercase hexadecimal
   content digest; and
5. an exact idempotency key recomputed from the protected 002D domain-separated preimage, including
   its final line feed.

Malformed, contradictory, null, altered, unsupported, or key-mismatched evidence returns `Denied`
without entering the mutation path and cannot consume capacity. This validation is intentionally
limited to the 002D identity value. It does not prove that a predecessor receipt was structurally
valid, genuinely issued, fresh, or authorized.

## Linearizable decision contract

Each `CountyCsvIntakeDuplicateDecision` instance accepts a capacity from 1 through 4096. It owns one
private dictionary and one private synchronization object; there is no static mutable state.
Inside the single critical section, evaluation order is frozen:

1. if the key already maps to an exactly equal validated snapshot, return `Duplicate`;
2. if the key already maps to a different validated snapshot, fail closed with `Denied` and
   `KeyCollision`;
3. if the configured capacity is already occupied, return `Denied` and `CapacityExceeded`; or
4. atomically add the snapshot and return `FirstSeen`.

Known identical duplicates are checked before capacity, so a previously admitted identity remains
classifiable after the instance fills. Different evidence under one key is never treated as a
duplicate. The scalar outcome contains only the contract, disposition, and denial code. It is not a
reservation receipt, authorization token, persistence proof, or claim that later work occurred.

## State and authority boundary

- state is private, bounded, per instance, process-local, and lives only for that instance lifetime;
- no reset, removal, enumeration, count, cache API, dependency-injection registration, async API,
  transport, or global state is exposed;
- no durable or external reservation, distributed or external lock, database, filesystem, network,
  queue, staging, quarantine, promotion, rollback, or recovery behavior is implemented;
- no authentication, authorization grant, uploader identity, live county data, credential, external
  system, production integration, or protected-resource access is admitted; and
- success does not complete broad `WO-WAL-002` or authorize any later upload or persistence child.

## Required validation

- first-seen then duplicate classification from protected 002D output;
- all 39 canonical counties across both closed datasets;
- separation of county, dataset, digest, and byte-length identities;
- malformed and contradictory evidence denial with proof that invalid inputs do not consume state;
- capacity denial with known-duplicate-before-capacity ordering;
- parallel same-identity proof of exactly one first-seen transition and parallel distinct-identity
  proof without loss;
- fail-closed key-collision regression through private reflection only, with no production test seam;
- exact synchronous, per-instance, state-opaque public surface;
- focused `CountyCsvIntakeDuplicateDecisionTests` plus protected 002A/002B/002C/002D compatibility;
- offline compile/test when the host .NET SDK is unavailable;
- `git diff --check` and exact three-path audit.

## Validation evidence

The host had no .NET SDK, so validation used the cached .NET 8 SDK and cached NuGet packages in
disposable Docker containers with networking disabled. Restore, production compilation, and test
compilation completed without network access. The focused 002E suite passed 12/12, and the combined
protected 002A/002B/002C/002D compatibility filter passed 92/92. Both runs reported zero failures
and zero skips, and all build outputs remained inside the disposable containers.

## Completion

PR #1508 reached protected main at merge
`dcd1405b15d7aaa686ae444ed917117fcada3de0`. Integrated head
`6dd01433b41db83ca73d1572e82e5910a0f3d7e5` contains reviewed head
`a63ebf4f3a4c12a0c75499a9adb63ef1269a6dfe`. This completes only the bounded local-memory
duplicate decision. The broad parent remains open; durable intake behavior and later authority are
not implied.
