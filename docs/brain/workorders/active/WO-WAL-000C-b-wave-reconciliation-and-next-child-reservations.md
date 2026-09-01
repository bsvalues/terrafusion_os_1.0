# WO-WAL-000C — B-Wave Reconciliation and Next Exact Child Reservations

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Parent | `WO-WAL-000` |
| Program | Washington Assessor Launch V1 |
| Base | `4fde39015c71fea20193207bfb7bf8878f870e0e` |
| Risk | R3 governance-only routing reconciliation |
| Terminal condition | `B_WAVE_PROTECTED_COMPLETE_AND_C_WAVE_EXACT_RESERVATIONS_REGISTERED` |

## Objective

Reconcile the protected completion of `WO-WAL-001B` through `WO-WAL-004B`, keep their broad parents
open, and register the next exact, non-colliding child wave. This Work Order changes governance only;
it does not implement any C child or claim that a broad parent is complete.

## Protected B-wave evidence

| Child | PR | Protected merge | Exact reviewed/integrated head |
| --- | --- | --- | --- |
| `WO-WAL-001B` | `#1493` | `d54d1722f776fd38ab58d734b0252c4ef78f2804` | `a90e6f5ed5b947fb74313bb77fec1f5fa57bc7f3` |
| `WO-WAL-002B` | `#1494` | `43fb4e239d12fcd264b56c3cf0918e862cb0fbdd` | `bc7ec0956b2ad4072490897b6b5ea5ccca0005fc` |
| `WO-WAL-003B` | `#1495` | `3992e89f689127313dcd9f877ee865c4a9ae2ba9` | `e62cb2367aa7393acad030f492cb181b5af1266b` |
| `WO-WAL-004B` | `#1496` | `4fde39015c71fea20193207bfb7bf8878f870e0e` | `e2dd95338f54a18f1aa6986699fc0a4c0699229e` |

These merges complete the bounded B children only. `WO-WAL-001` through `WO-WAL-004` remain open
under exact-child routing, and `WO-WAL-005`/`006` remain blocked on stable completed parent
contracts.

The registry change in this commit is a prospective protected-main state. It becomes canonical
atomically only if this commit reaches the protected default branch. A pull-request branch, test
checkout, or unmerged commit is not a dispatch source. Before starting any C child, the operator must
read the registry from protected main and verify that the protected-main head contains this Work
Order's merge commit; until then every C child remains non-executable.

## Exact C-wave reservations

### WO-WAL-001C — Public Acquisition Receipt Ledger

- Paths: `docs/brain/workorders/active/WO-WAL-001C-public-acquisition-receipt-ledger.md`,
  `scripts/truth/wal-public-acquisition-receipt-ledger.mjs`, and
  `scripts/truth/wal-public-acquisition-receipt-ledger.test.mjs`.
- Contract: `wal.public-acquisition-receipt-ledger.v1`.
- Environment: `local-memory-receipt-ledger-only`.
- Dependency: protected-complete `WO-WAL-001A` and `WO-WAL-001B`.
- Terminal: `CANONICAL_39_COUNTY_ACQUISITION_RECEIPT_LEDGER_AND_EXPLICIT_GAPS_PROVEN`.
- Boundary: aggregate validated parcel/sales receipts into exactly 39 canonical immutable rows with
  explicit missing gaps; no acquisition transport, landing, parsing, freshness, runtime, or
  capability inference.

### WO-WAL-002C — Canonical County-Bound CSV Intake

- Paths: `docs/brain/workorders/active/WO-WAL-002C-canonical-county-bound-csv-intake.md`,
  `backend/src/TerraFusion.Core/Import/CountyCsvCountyBoundIntake.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvCountyBoundIntakeTests.cs`.
- Contract: `wal.county-upload.csv-county-bound-intake.v1`.
- Environment: `local-memory-authority-bound-csv-only`.
- Dependency: protected-complete `WO-WAL-002A`, `WO-WAL-002B`, `WO-WAL-004A`, and `WO-WAL-004B`.
- Terminal: `CSV_INTAKE_ENVELOPE_SAME_COUNTY_OPERATION_BINDING_PROVEN`.
- Boundary: require the protected `COUNTY_PROVIDED` + `PROTECTED` + `OPERATE` same-county decision
  before one envelope parse and bind evidence to one canonical county/dataset; no raw claims,
  authentication, API, filesystem, persistence, quarantine, promotion, rollback, or UI.

### WO-WAL-003C — ADO Read Adapter Contract

- Paths: `docs/brain/workorders/active/WO-WAL-003C-ado-read-adapter-contract.md`,
  `backend/src/TerraFusion.Core/Sync/Execution/ReadOnlyDbCommandAdapter.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyDbCommandAdapterTests.cs`.
- Contract: `wal.external-readonly.db-command-adapter.v1`.
- Environment: `fake-ado-reader-only`.
- Dependency: protected-complete `WO-WAL-003A` and `WO-WAL-003B`.
- Terminal: `FAKE_ADO_READER_SINGLE_EXECUTION_AND_BOUNDED_PAGE_PROVEN`.
- Boundary: execute the guarded command once through an already-supplied fake ADO reader surface,
  cap row/field enumeration, and compose through the protected executor; no nonquery, transaction,
  credential, live database, DI registration, persistence, or observed no-DML claim.

### WO-WAL-004C — County Data Activation Prerequisite Contract

- Paths: `docs/brain/workorders/active/WO-WAL-004C-county-data-activation-prerequisite-contract.md`,
  `backend/src/TerraFusion.Core/Counties/CountyDataActivationPrerequisite.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Counties/CountyDataActivationPrerequisiteTests.cs`.
- Contract: `wal.county-data-activation-prerequisite.v1`.
- Environment: `local-memory-activation-prerequisite-only`.
- Dependency: protected-complete `WO-WAL-004A` and `WO-WAL-004B`.
- Terminal: `DATA_MODE_ACTIVATION_PREREQUISITES_FAIL_CLOSED_WITHOUT_ACTIVATION_PROVEN`.
- Boundary: return only a data-free eligibility decision from explicit per-mode evidence facts and
  canonical county authority; no activation, adoption, role grant, UI, persistence, integration,
  fabricated evidence, protected data, or default county.

## Collision and authority result

The twelve implementation paths, four contracts, and four environments are pairwise distinct. The
children may execute in isolated worktrees only after this registration reaches protected main.
Each child may consume its completed predecessor contracts but may not modify another child's
reservation. Contract success does not complete a parent, activate a data mode, authorize protected
data, or permit external writes.

## Exact governance reservation

Only these repository-relative paths may change in this governance Work Order:

- `docs/brain/workorders/active/WO-WAL-000C-b-wave-reconciliation-and-next-child-reservations.md`
- `docs/brain/workorders/active/WO-WAL-000B-next-child-reservations.md`
- `docs/brain/workorders/active/WO-WAL-001B-public-acquisition-artifact-receipt-contract.md`
- `docs/brain/workorders/active/WO-WAL-002B-declared-csv-intake-envelope.md`
- `docs/brain/workorders/active/WO-WAL-003B-bounded-read-execution-envelope.md`
- `docs/brain/workorders/active/WO-WAL-004B-county-data-authority-boundary-contract.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

## Validation

- parse the registry JSON and validate the 000C/C-wave records against the Work Order schema;
- run the focused work-order query, report, wave-planner, phase-83, and governance tests;
- prove the exact four-child C wave is accepted and overlapping path, contract, or environment
  reservations fail closed;
- prove query and planner output excludes every C child unless the clean checkout head exactly equals
  its declared protected remote-tracking ref;
- prove B children are terminal while broad parents remain open and WAL-005/006 remain blocked;
- `git diff --check`;
- exact ten-path changed-file audit.

## Completion

This Work Order reached protected main as
`474161f9309145e2341419563de7192dfbded11e`. That protected merge cleared the four C children for
isolated implementation and did not complete any broad parent Work Order. Routing continues through
`WO-WAL-000D` after protected completion of the bounded C wave.
