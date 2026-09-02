# WO-WAL-000I — Durable Upload Ledger Release Reconciliation

| Field | Value |
| --- | --- |
| Status | `COMPLETE_ON_PROTECTED_MERGE` |
| Parent | `WO-WAL-000` |
| Program | Washington Assessor Launch V1 |
| Risk | R3 governance-only protected-boundary reconciliation |
| Terminal condition | `PROTECTED_002F_VERIFIED_AND_002G_RELEASED_READY` |

## Objective

After `WO-WAL-002F` is actually merged to protected main, verify its exact completion evidence,
record the protected upload-runtime truth, and register the smallest non-colliding durable successor:
an upload-specific county CSV admission ledger with atomic idempotency and immutable provenance.
This Work Order changes governance only and implements no persistence or schema behavior.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-000I-durable-upload-ledger-release-reconciliation.md`
- `docs/brain/workorders/active/WO-WAL-002F-authenticated-county-csv-api-admission.md`
- `docs/brain/workorders/active/WO-WAL-002G-durable-county-csv-admission-ledger.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

## Contract

1. Refuse reconciliation unless `WO-WAL-002F` is complete on the verified protected-main ref and
   its exact merge, parent, reviewed head/tree, checks, changed paths, contract, environment, and
   terminal evidence are recorded.
2. Record the protected implementation audit: no upload-specific durable entity currently exists;
   `SyncBatch` is an external Sync/Atlas run record and `sync_bridge.load_batch` is PACS/source-family
   provenance. Neither may be relabeled as county-upload lineage.
3. Register exactly `WO-WAL-002G` with upload-specific paths, contract, environment, tests, schema
   rollback, and explicit denials. Do not dispatch the broad `WO-WAL-002` parent as a monolith.
4. Change 002F to complete and make 002G ready only on this reconciliation's protected merge.
5. Preserve the 001 public-source wall, the 003 named-source/credential/no-DML wall, and the
   005/006 stable-parent dependency gates.

## Denials

No implementation file, EF entity, configuration, service, migration, model snapshot, database,
controller, county file, credential, protected data, external source, Sync continuation, deployment,
production, parent completion, or release claim is authorized by this reconciliation.

## Validation

- exact protected 002F completion and protected-ref verification;
- Work Order schema and dependency/status-transition validation;
- pre-transition 002F terminal with 002G absent, and post-transition exact 002G release proof;
- exact path/contract/environment reservation collision proof;
- exact seven-path audit and `git diff --check`.

## Protected 002F evidence

- PR #1537 merged exact reviewed head `29631d4f7725f2a99eb26d967a7dde30f82ab7ac`
  from base `d4f5879a8668f8b84c993c848fe6dabf1ba876bb` as protected commit
  `378c2a47264a707d8b7a3de9882120577e9c9fb0` at `2026-09-01T23:42:25Z`.
- Protected `origin/main` was fetched and resolved exactly to that merge. Its sole parent is the
  recorded 000H merge, its tree `04912a5769b368c14bef3c8dfee68e1ee297d5f4` exactly equals the
  reviewed-head tree, and it changes only the controller and focused controller-test paths.
- All required product, governance, migration, SQLite, frontend, backend, evidence, security,
  warning, seal, Vitest, and canonical .NET gates reached terminal success on the exact head.
  The configured Codex review completed on that head with no major issue; the sole earlier P2 was
  fixed, reviewed, and resolved before merge.
- Local terminal proof passed 19/19 focused controller tests, the API Release build with zero
  warnings and zero errors, `git diff --check`, and the exact two-path audit.
- Protected main contains contract `wal.county-upload.authenticated-csv-api-admission.v1`,
  environment `local-api-synthetic-csv-intake-only`, authenticated canonical county binding,
  real Parcels/Sales parser evidence, and a process-local duplicate decision. It proves terminal
  `AUTHENTICATED_SAME_COUNTY_CSV_API_ADMISSION_REAL_RECEIPT_PROVEN` without durable persistence,
  quarantine, promotion, rollback, UI, deployment, or production.

## Durable-seam audit

- The upload domain currently ends at `backend/src/TerraFusion.Core/Import/**` plus the real API
  controller; no upload entity, EF configuration, migration, or durable service exists.
- `SyncBatch`, `SyncRecord`, and `SyncQuarantine` are modeled as Sync-run records and are used by the
  Atlas profiler. Their source-system/mode semantics are not county-upload provenance.
- `sync_bridge.load_batch` is explicitly tied to PACS/source-family raw/truth/canonical pipeline
  doctrine. Reusing it would conflate independent trust and rollback boundaries.
- The smallest honest successor is therefore an upload-specific batch ledger and atomic durable
  idempotency reservation, locally proven with synthetic CSV evidence and SQLite before API wiring.

## Release transition

The registry, queue, program, 002F record, and new 002G record model the state that becomes canonical
only when this seven-path reconciliation reaches protected main: 002F and 000I are terminal, and
002G is the exact ready product child. Before this protected merge, 002G is not registered authority.

## Completion

Protected completion releases exactly `WO-WAL-002G` for its own isolated protected lifecycle. It
does not implement 002G or complete `WO-WAL-002`, another broad parent, or the launch mission.
