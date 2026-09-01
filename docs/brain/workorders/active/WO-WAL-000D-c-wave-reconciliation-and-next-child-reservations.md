# WO-WAL-000D — C-Wave Reconciliation and Next Exact Child Reservations

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Parent | `WO-WAL-000` |
| Program | Washington Assessor Launch V1 |
| Base | `0374caafdc943b9f4dd53189542d4cc2b2e8fc67` |
| Risk | R3 governance-only routing reconciliation |
| Terminal condition | `C_WAVE_PROTECTED_COMPLETE_AND_D_WAVE_EXACT_RESERVATIONS_REGISTERED` |
| Protected completion | PR `#1502`, merge `f21cfa6f61db0bac7d5da643c948991a14f459fd` |

## Objective

Reconcile the protected completion of `WO-WAL-001C` through `WO-WAL-004C`, keep their broad parents
open, and register the next exact, non-colliding child wave. This Work Order changes governance only;
it does not implement any D child or claim that a broad parent is complete.

## Protected C-wave evidence

| Child | PR | Protected merge | Updated integrated head | Reviewed evidence head |
| --- | --- | --- | --- | --- |
| `WO-WAL-001C` | `#1498` | `cfbb64713d21970407c856856dd40671891d15d1` | `3a128deb21e48a5e9c29bb3e6cb2b0c9963c40e4` | reviewed fix `ad4f2f1c234a17ffb475153f332ebba104a6f344` |
| `WO-WAL-002C` | `#1500` | `22d00eda80a820c3a8f1541500cdec812216fc4a` | `b3bd7ec00c2240ebae27a97f996dc3b118d8fa48` | same exact head |
| `WO-WAL-003C` | `#1501` | `0374caafdc943b9f4dd53189542d4cc2b2e8fc67` | `307db297f9e8d037f1ba80c5d039c98da1ed37ec` | `d2a3cb746b4109d47bafea5b5033f041763d81df` |
| `WO-WAL-004C` | `#1499` | `da2443068fc20187f1d65e1d3614881e9f7b06f0` | `2e70dd09599721c40af1085962e98b73c8ac8967` | `6b2c590875d89f98d22e87bd2aa6c1aa0f6ad39e` |

For 001C, 003C, and 004C, the reviewed evidence head and the later updated integrated head are
deliberately recorded as distinct identities. The protected merge is the canonical completion
authority and contains the reviewed correction/evidence plus the updated integrated child. These
merges complete the bounded C children only. `WO-WAL-001` through `WO-WAL-004` remain open under
exact-child routing, and `WO-WAL-005`/`006` remain blocked on stable completed parent contracts.

The registry change in this commit is a prospective protected-main state. It becomes canonical
atomically only if this commit reaches the protected default branch. A pull-request branch, test
checkout, or unmerged commit is not a dispatch source. Before starting any D child, the operator
must read the registry from protected main and verify that the protected-main head contains this Work
Order's merge commit; until then every D child remains non-executable.

## Exact D-wave reservations

### WO-WAL-001D — Public Artifact Byte Verification

- Paths: `docs/brain/workorders/active/WO-WAL-001D-public-artifact-byte-verification.md`,
  `scripts/truth/wal-public-acquisition-artifact-verification.mjs`, and
  `scripts/truth/wal-public-acquisition-artifact-verification.test.mjs`.
- Contract: `wal.public-acquisition-artifact-verification.v1`.
- Environment: `local-memory-public-artifact-verification-only`.
- Dependency: protected-complete `WO-WAL-001A`, `WO-WAL-001B`, and `WO-WAL-001C`.
- Terminal: `PUBLIC_ARTIFACT_BYTES_MATCH_RECEIPT_LEDGER_HASH_LENGTH_COUNTY_KIND_PROVEN`.
- Boundary: recompute exact byte length and SHA-256 for supplied bounded public artifact bytes,
  bind them to one canonical county/artifact slot, and retain explicit gaps; no network acquisition,
  filesystem landing, parsing, source authenticity, freshness, normalization, runtime, or capability
  inference.

### WO-WAL-002D — County CSV Idempotency Identity

- Paths: `docs/brain/workorders/active/WO-WAL-002D-county-csv-idempotency-contract.md`,
  `backend/src/TerraFusion.Core/Import/CountyCsvIntakeIdempotency.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvIntakeIdempotencyTests.cs`.
- Contract: `wal.county-upload.csv-idempotency.v1`.
- Environment: `local-memory-csv-idempotency-only`.
- Dependency: protected-complete `WO-WAL-002A`, `WO-WAL-002B`, and `WO-WAL-002C`.
- Terminal: `CSV_COUNTY_DATASET_CONTENT_IDEMPOTENCY_KEY_DETERMINISTIC_AND_BOUNDED_PROVEN`.
- Boundary: derive one canonical SHA-256 batch/idempotency identity from validated canonical county,
  dataset, content hash, and byte length; no duplicate store, duplicate decision, authentication,
  uploader identity, API, staging, quarantine, persistence, promotion, or rollback.

### WO-WAL-003D — Profile-Bound Fake ADO Connection Session

- Paths: `docs/brain/workorders/active/WO-WAL-003D-profile-bound-ado-connection-session.md`,
  `backend/src/TerraFusion.Core/Sync/Execution/ReadOnlyDbConnectionSession.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyDbConnectionSessionTests.cs`.
- Contract: `wal.external-readonly.db-connection-session.v1`.
- Environment: `fake-ado-open-connection-only`.
- Dependency: protected-complete `WO-WAL-003A`, `WO-WAL-003B`, and `WO-WAL-003C`.
- Terminal: `FAKE_ADO_CALLER_OPEN_CONNECTION_SINGLE_COMMAND_READ_SESSION_PROVEN`.
- Boundary: consume one caller-owned already-open fake connection, create and dispose exactly one
  command, and compose once through the protected adapter/executor; no connection-string discovery,
  credentials, open/close, live database, DI, retry, persistence, checkpoint, or observed no-DML
  claim.

### WO-WAL-004D — Authenticated County Authority Binding

- Paths: `docs/brain/workorders/active/WO-WAL-004D-authenticated-county-authority-binding.md`,
  `backend/src/TerraFusion.Core/Counties/AuthenticatedCountyAuthorityBinding.cs`, and
  `backend/tests/TerraFusion.Unit.Tests/Counties/AuthenticatedCountyAuthorityBindingTests.cs`.
- Contract: `wal.authenticated-county-authority-binding.v1`.
- Environment: `local-auth-context-resolver-fixture-only`.
- Dependency: protected-complete `WO-WAL-004A`; protected C-wave completion is recorded by this
  governance barrier without falsely making 004B/004C code dependencies.
- Terminal: `AUTHENTICATED_CONTEXT_CANONICAL_COUNTY_BINDING_FAIL_CLOSED_PROVEN`.
- Boundary: snapshot `IRequestUserContextAccessor.Current`, require an authenticated actor/county,
  resolve claim and target through `ICountyResolver`, and bind only exact persisted GUID equality;
  no token authentication, role/capability grant, activation/public-private decision, route/body/
  header authority, controller/DI, persistence, protected data, or default county.

## Collision and authority result

The twelve implementation paths, four contracts, and four environments are pairwise distinct and do
not collide with the protected C-wave reservations. The children may execute in isolated worktrees
only after this registration reaches protected main. Each child may consume its completed
predecessor contracts but may not modify another child's reservation. Contract success does not
complete a parent, activate a data mode, authorize protected data, or permit external writes.

## Exact governance reservation

Only these repository-relative paths may change in this governance Work Order:

- `docs/brain/workorders/active/WO-WAL-000D-c-wave-reconciliation-and-next-child-reservations.md`
- `docs/brain/workorders/active/WO-WAL-000C-b-wave-reconciliation-and-next-child-reservations.md`
- `docs/brain/workorders/active/WO-WAL-001C-public-acquisition-receipt-ledger.md`
- `docs/brain/workorders/active/WO-WAL-002C-canonical-county-bound-csv-intake.md`
- `docs/brain/workorders/active/WO-WAL-003C-ado-read-adapter-contract.md`
- `docs/brain/workorders/active/WO-WAL-004C-county-data-activation-prerequisite-contract.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

## Validation

- parse the registry JSON and validate the 000D/D-wave records against the Work Order schema;
- run the focused work-order query, report, wave-planner, phase-83, and governance tests;
- prove the exact four-child D wave is accepted and overlapping path, contract, or environment
  reservations fail closed;
- prove query and planner output excludes every D child unless the clean checkout head exactly equals
  its declared protected remote-tracking ref;
- prove C children are terminal while broad parents remain open and WAL-005/006 remain blocked;
- `git diff --check`;
- exact ten-path changed-file audit.

## Completion

This Work Order completed when its validated governance-only commit reached protected main in PR
`#1502` as `f21cfa6f61db0bac7d5da643c948991a14f459fd`. That merge cleared the four D children for isolated
implementation and did not complete any broad parent Work Order. Protected D-wave reconciliation
and the next exact reservations are governed by
[`WO-WAL-000E`](WO-WAL-000E-d-wave-reconciliation-and-e-wave-reservations.md).
