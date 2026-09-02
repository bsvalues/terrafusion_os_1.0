# WO-WAL-000J — Durable Upload API Release Reconciliation

| Field | Value |
| --- | --- |
| Status | `COMPLETE_ON_PROTECTED_MERGE` |
| Parent | `WO-WAL-000` |
| Program | Washington Assessor Launch V1 |
| Risk | R3 governance-only protected-boundary reconciliation |
| Terminal condition | `PROTECTED_002G_VERIFIED_AND_002H_RELEASED_READY` |

## Objective

After `WO-WAL-002G` is actually merged to protected main, verify its exact completion evidence,
record the protected API/DI seam, and register the smallest non-colliding successor: replace the
authenticated upload action's process-local duplicate decision with the protected durable admission
ledger and return the persisted batch identity. This Work Order changes governance only.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-000J-durable-upload-api-release-reconciliation.md`
- `docs/brain/workorders/active/WO-WAL-002G-durable-county-csv-admission-ledger.md`
- `docs/brain/workorders/active/WO-WAL-002H-authenticated-durable-county-csv-api-admission.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

## Contract

1. Refuse reconciliation unless `WO-WAL-002G` is complete on verified protected main and its exact
   merge, parent, reviewed head/tree, required checks, changed paths, contract, environment and
   terminal evidence are recorded.
2. Record the protected seam audit: `DataImportController` still owns an `IMemoryCache`-backed
   `CountyCsvIntakeDuplicateDecision`; `Program.cs` registers the request-scoped
   `TerraFusionDbContext` but no runtime `IDbContextFactory<TerraFusionDbContext>` or
   `ICountyCsvUploadAdmissionLedger`; the protected ledger is therefore not reachable from the API.
3. Register exactly `WO-WAL-002H` with controller, runtime DI, focused API and registration-test
   paths. Preserve the protected 002F parser/county/auth boundary and the 002G ledger unchanged.
4. Change 002G to complete and make 002H ready only on this reconciliation's protected merge.
5. Preserve the 001 public-source wall, the 003 named-source/credential/no-DML wall, and the
   005/006 stable-parent dependency gates.

## Denials

No product implementation, controller or DI mutation, uploaded byte/blob persistence, staging row,
mapping, quarantine row, promotion, rollback execution, UI, county file, credential, protected data,
external source, Sync continuation, live database, deployment, production, parent completion or
release claim is authorized by this reconciliation.

## Validation

- exact protected 002G completion and protected-ref verification;
- Work Order schema and dependency/status-transition validation;
- pre-transition 002G ready with 002H absent, and post-transition exact 002H release proof;
- exact path/contract/environment reservation collision proof;
- exact seven-path audit and `git diff --check`.

## Protected 002G evidence

- PR #1539 merged exact reviewed head `3e4caa76bf1f1a6413783a8b755ac184fecf18bd`
  from base `f2894278a93c15d9d6fe481b925d38e234bb9845` as protected commit
  `151ff376eff2ea2108579b0ac2f0e3d365460d0b` at `2026-09-02T04:28:52Z`.
- Protected `origin/main` was fetched and resolved exactly to that merge. Its sole parent is the
  recorded base, and merge tree `94df6471ad9d9a59632b69f4bc1073250591bd68` exactly equals the
  reviewed-head tree.
- The protected merge changes exactly the eight implementation/test members of 002G's nine-path
  reservation; the pre-registered 002G Work Order document was not rewritten by the product PR.
- All ten protected required contexts passed, including both canonical .NET contexts, migration,
  Vitest, Tier-1 UI, all three core-governance contexts and both seal contexts. The configured Codex
  review completed on the exact head after all thirteen earlier review threads were resolved, with
  no new thread.
- Local terminal proof passed 17/17 focused ledger tests, 121/121 Import-namespace tests,
  `git diff --check`, exact-path audit and merge-tree equality. The protected implementation proves
  contract `wal.county-upload.durable-admission-ledger.v1`, environment
  `local-efcore-synthetic-csv-ledger-only` and terminal condition
  `DURABLE_COUNTY_CSV_ADMISSION_LEDGER_ATOMIC_IDEMPOTENCY_PROVEN` without API wiring, uploaded-byte
  persistence, staging, quarantine, promotion, rollback execution, deployment or production.

## API/DI seam audit

- The protected `/api/upload` action still constructs the bounded county CSV intake and then calls
  the process-local `CountyCsvIntakeDuplicateDecision`; its receipt has no persisted batch identity.
- `Program.cs` registers only the request-scoped primary `TerraFusionDbContext`. The 002G ledger
  deliberately requires an `IDbContextFactory<TerraFusionDbContext>` so each admission owns an
  isolated context/transaction; neither that factory nor the ledger interface is registered.
- The smallest honest successor is a bounded service-registration adapter plus controller adoption
  of the existing ledger, with disposable-SQLite API proof that a retry after service/controller
  recreation returns the same persisted batch. It does not create staging or import execution.

## Release transition

The registry, queue, program, 002G record and new 002H record model the state that becomes canonical
only when this seven-path reconciliation reaches protected main: 002G and 000J are terminal, and
002H is the exact ready product child. Before this protected merge, 002H is not registered authority.

## Completion

Protected completion releases exactly `WO-WAL-002H` for its own isolated protected lifecycle. It
does not implement 002H or complete `WO-WAL-002`, another broad parent, or the launch mission.
