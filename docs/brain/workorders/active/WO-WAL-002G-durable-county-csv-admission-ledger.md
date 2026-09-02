# WO-WAL-002G — Durable County CSV Admission Ledger

| Field | Value |
| --- | --- |
| Status | `COMPLETE_ON_PROTECTED_MERGE_OF_PR_1539` |
| Parent | `WO-WAL-002` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 upload-specific county-scoped persistence and migration foundation |
| Contract | `wal.county-upload.durable-admission-ledger.v1` |
| Environment | `local-efcore-synthetic-csv-ledger-only` |
| Terminal condition | `DURABLE_COUNTY_CSV_ADMISSION_LEDGER_ATOMIC_IDEMPOTENCY_PROVEN` |

## Objective

Replace 002F's process-local duplicate state with an upload-specific durable admission ledger that
atomically records one immutable county/dataset/content batch identity and returns the same persisted
batch for a retry. Preserve actor, file, parser, hash, length, and accepted-row provenance without
wiring the API or claiming staging, quarantine, promotion, rollback, or production.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-002G-durable-county-csv-admission-ledger.md`
- `backend/src/TerraFusion.Core/Entities/Import/CountyCsvUploadBatch.cs`
- `backend/src/TerraFusion.Core/Import/CountyCsvUploadAdmissionLedger.cs`
- `backend/src/TerraFusion.Data/Configurations/Import/CountyCsvUploadBatchConfiguration.cs`
- `backend/src/TerraFusion.Data/Services/Import/CountyCsvUploadAdmissionLedger.cs`
- `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`
- `backend/src/TerraFusion.Data/Migrations/20260902000000_WAL002GCountyCsvUploadAdmissionLedger.cs`
- `backend/src/TerraFusion.Data/Migrations/TerraFusionDbContextModelSnapshot.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvUploadAdmissionLedgerTests.cs`

## Contract

1. Add one upload-specific county CSV batch entity with immutable batch identity, persisted county
   GUID, actor ID, closed Parcels/Sales dataset, safe source filename/media type, content SHA-256 and
   byte length, accepted row count, idempotency key, protected parser/intake contract identities,
   received time, and an explicit admitted status.
2. Configure a restrictive county foreign key, bounded required columns, exact useful indexes, and
   a database-enforced unique idempotency key. Do not reuse or mutate Sync/PACS batch tables.
3. Add a ledger abstraction and EF implementation that revalidates protected 002F receipt-shaped
   evidence, canonical county identity, actor/county agreement, closed dataset, hashes, lengths,
   row counts, and contract identifiers before any write.
4. Atomically return `FirstSeen` with a new durable batch or `Duplicate` with the exact existing
   batch. A contradictory key collision, invalid evidence, cancellation, or database failure must
   fail closed and leave no partial batch.
5. Add the exact migration and model snapshot update; prove forward creation and complete rollback
   against disposable SQLite only.
6. Prove restart durability, parallel same-key convergence, cross-county separation, mutation
   rejection, and zero external-system write seam with synthetic CSV-derived evidence.

## Denials

No controller or DI wiring, uploaded-file byte/blob storage, staging rows, mappings, quarantine rows,
canonical promotion, trust/capability recomputation, progress UI, import execution, batch rollback,
external county system, credential, protected county file, live database, deployment, production, or
completion of `WO-WAL-002` is authorized. Existing Sync/PACS tables and vocabularies remain unchanged.

## Validation

- focused SQLite ledger tests for first-seen, duplicate-after-restart, parallel convergence,
  contradictory collision, county/actor/dataset/content/contract rejection, cancellation, and
  migration up/down behavior;
- `TerraFusion.Data` Release compile and migration-model consistency;
- Work Order/schema reservation validation, exact nine-path audit, and `git diff --check`.

## Completion

Completion establishes only a durable upload admission batch ledger and atomic idempotency boundary.
API adoption, staging, row validation/quarantine, promotion, lineage through canonical runtime,
rollback, UI, and parent completion remain later exact children.

## Protected completion evidence

- PR #1539 merged reviewed head `3e4caa76bf1f1a6413783a8b755ac184fecf18bd` from protected
  base `f2894278a93c15d9d6fe481b925d38e234bb9845` as
  `151ff376eff2ea2108579b0ac2f0e3d365460d0b` at `2026-09-02T04:28:52Z`.
- Protected merge tree `94df6471ad9d9a59632b69f4bc1073250591bd68` exactly equals the
  reviewed-head tree and changes exactly the eight implementation/test paths reserved by this
  Work Order; this pre-registered document remained unchanged in the product PR.
- All ten protected required contexts passed. Exact-head review completed after all thirteen prior
  threads were resolved, with no new thread.
- Local proof passed 17/17 focused ledger tests and 121/121 Import-namespace tests. Uploaded bytes
  are not persisted, and API/DI adoption remains outside this completed child's boundary.

The next candidate is the governance-only `WO-WAL-000J` reconciliation. No API successor becomes
executable until that reconciliation reaches protected main.
