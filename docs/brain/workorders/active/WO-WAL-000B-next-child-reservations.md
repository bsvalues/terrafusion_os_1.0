# WO-WAL-000B — A-Wave Reconciliation and Next Exact Child Reservations

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Parent | `WO-WAL-000` |
| Program | Washington Assessor Launch V1 |
| Base | `81d7c16b0e0e6539a5ac8b6c1b5871897c596c62` |
| Risk | R3 governance-only routing reconciliation |
| Terminal condition | `A_WAVE_PROTECTED_COMPLETE_AND_B_WAVE_EXACT_RESERVATIONS_REGISTERED` |

## Objective

Reconcile the protected completion of `WO-WAL-001A` through `WO-WAL-004A`, keep their broad parents
open, and register the next exact, non-colliding child wave. This Work Order changes governance only;
it does not implement any B child or claim that a broad parent is complete.

## Protected A-wave evidence

| Child | PR | Protected merge |
| --- | --- | --- |
| `WO-WAL-001A` | `#1489` | `b4b57e7c318fe9beb3c7b37eafafa4d84fbd199e` |
| `WO-WAL-002A` | `#1490` | `b98bc2ccd626eb94469b07fd2a9fffdd4802590a` |
| `WO-WAL-003A` | `#1491` | `81d7c16b0e0e6539a5ac8b6c1b5871897c596c62` |
| `WO-WAL-004A` | `#1488` | `ca2aef938949ae92fa0aeda095ebd0198616eef0` |

These merges complete the bounded A children only. `WO-WAL-001` through `WO-WAL-004` remain active
under exact-child routing, and `WO-WAL-005`/`006` remain blocked on stable completed parent contracts.

The registry change in this commit is a prospective protected-main state: it becomes canonical
atomically only if this commit reaches the protected default branch. A pull-request branch, test
checkout, or unmerged commit is not a dispatch source. Before starting any B child, the operator must
read the registry from protected main and verify that the protected-main head contains this Work
Order's merge commit; until then every B child remains non-executable.

## Exact B-wave reservations

### WO-WAL-001B — Public Acquisition Artifact Receipt Contract

- Paths: `docs/brain/workorders/active/WO-WAL-001B-public-acquisition-artifact-receipt-contract.md`,
  `scripts/truth/wal-public-acquisition-artifact-receipt.mjs`, and
  `scripts/truth/wal-public-acquisition-artifact-receipt.test.mjs`.
- Contract: `wal.public-acquisition-artifact-receipt.v1`.
- Environment: `local-memory-artifact-fixture-only`.
- Dependency: protected-complete `WO-WAL-001A` and `wal.public-baseline-ledger.v1`.
- Boundary: deterministic public artifact receipts only; no network, filesystem output, persistence,
  landed/runtime inference, or capability activation.

### WO-WAL-002B — Declared CSV Intake Envelope

- Paths: `docs/brain/workorders/active/WO-WAL-002B-declared-csv-intake-envelope.md`,
  `backend/src/TerraFusion.Core/Import/CountyCsvIntakeEnvelope.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvIntakeEnvelopeTests.cs`.
- Contract: `wal.county-upload.csv-envelope.v1`.
- Environment: `local-memory-csv-envelope-only`.
- Dependency: protected-complete `WO-WAL-002A` and `wal.county-upload.csv-parser.v1`.
- Boundary: declared CSV validation and deterministic in-memory evidence only; no authentication,
  county binding, API, filesystem, persistence, quarantine, promotion, rollback, or UI.

### WO-WAL-003B — Bounded Read Execution Envelope

- Paths: `docs/brain/workorders/active/WO-WAL-003B-bounded-read-execution-envelope.md`,
  `backend/src/TerraFusion.Core/Sync/Execution/ReadOnlyCountySourceExecutor.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyCountySourceExecutorTests.cs`.
- Contract: `wal.external-readonly.execution-envelope.v1`.
- Environment: `mock-read-executor-only`.
- Dependency: protected-complete `WO-WAL-003A`, `wal.source-profile.v1`, and
  `wal.external-readonly.v1`.
- Boundary: one mock-adapter bounded read plus immutable result validation; no DI registration,
  credential, live connection, source-side no-DML claim, persistence, or production behavior.

### WO-WAL-004B — County Data Mode and Authority Boundary Contract

- Paths: `docs/brain/workorders/active/WO-WAL-004B-county-data-authority-boundary-contract.md`,
  `backend/src/TerraFusion.Core/Counties/CountyDataAuthorityBoundary.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Counties/CountyDataAuthorityBoundaryTests.cs`.
- Contract: `wal.county-data-authority-boundary.v1`.
- Environment: `local-memory-authority-predicate-only`.
- Dependency: protected-complete `WO-WAL-004A` and `wal.county-authority.v1`.
- Boundary: pure PUBLIC/COUNTY_PROVIDED/CONNECTED visibility and same-county predicate only;
  no raw claims, controller/DI/UI integration, persistence, activation inference, official adoption,
  external system, credential, or default county.

## Collision and authority result

The twelve implementation paths, four contracts, and four environments are pairwise distinct. The
children may execute in isolated worktrees after this registration reaches protected main. Each child
may consume its completed A contract but may not modify another child's reservation. Contract success
does not complete a parent, activate a data mode, authorize protected data, or permit external writes.

## Exact governance reservation

Only these repository-relative paths may change in this governance Work Order:

- `docs/brain/workorders/active/WO-WAL-000B-next-child-reservations.md`
- `docs/brain/workorders/active/WO-WAL-001-statewide-public-baseline-runtime-completion.md`
- `docs/brain/workorders/active/WO-WAL-001A-public-baseline-ledger-contract.md`
- `docs/brain/workorders/active/WO-WAL-002-governed-county-upload-intake.md`
- `docs/brain/workorders/active/WO-WAL-002A-streaming-csv-parser-harness.md`
- `docs/brain/workorders/active/WO-WAL-003-read-only-multicounty-terrafusion-sync.md`
- `docs/brain/workorders/active/WO-WAL-003A-read-only-source-adapter-contract.md`
- `docs/brain/workorders/active/WO-WAL-004-county-identity-isolation-trust-activation-boundary.md`
- `docs/brain/workorders/active/WO-WAL-004A-canonical-county-authority-contract.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/schema/work-order.schema.json`
- `docs/brain/workorders/tools/wo-query.mjs`
- `docs/brain/workorders/tools/wo-query.test.mjs`
- `docs/brain/workorders/tools/wo-wave-plan.mjs`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

## Validation

- parse the registry JSON and validate it against the Work Order schema;
- run the focused work-order query, report, wave-planner, phase-83, and governance tests;
- prove the exact four-child wave is accepted and overlapping path, contract, or environment
  reservations fail closed;
- prove query and planner output excludes every B child unless the clean checkout head exactly equals
  its declared protected remote-tracking ref;
- `git diff --check`;
- exact seventeen-path changed-file audit.

## Completion

This Work Order reached protected main in PR #1492 as merge
`b740c3dadf069c0e7bfacf7a3e2c4e53dd5a388e`. That protected merge cleared the four B children for
isolated implementation and did not complete any broad parent Work Order. Their later protected
completion is reconciled separately by `WO-WAL-000C`.
