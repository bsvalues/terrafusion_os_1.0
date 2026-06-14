# DB/Data Work Order Plan

**Work Order:** WO-DATA-000  
**Date:** 2026-06-13  
**Type:** READ-ONLY audit — planning output

---

## Summary of Findings

WO-DATA-000 audited the TerraFusion DB/data layer from source code, configuration, and migration files. No live database was queried. Key findings:

1. **219 entity types** in the primary DbContext, plus 12 in secondary contexts (CurrentUse + Levy).
2. **99 EF migrations** spanning Oct 2025 through May 2026.
3. **Three DbContexts** — TerraFusionDbContext, CurrentUseDbContext, LevyDbContext — each with independent migration histories.
4. **Dual DB provider** — SQLite for zero-config, Npgsql for real work. Provider selected at startup from connection string format.
5. **No verified applied migration state** — whether all 99 migrations are applied to any given instance is unknown.
6. **No real seed data in scripts** — fabricated sample data only. Real data enters through Sync drains.
7. **Sync runtime has deep DB dependencies** — doctrine rules, SourceXref, AttributeDefinition, SyncSourceConnection must all be populated for meaningful operation.
8. **Three different DB names across environments** — `terrafusion` (dev), `terrafusion_os` (docker), `terrafusion_production` (prod).

## Recommended Work Order Sequence

Per `docs/branching/WORKORDER_PR_BOUNDARY.md`, the following sequence is locked:

### WO-DATA-001: Migration Status Baseline Proof
**Scope:** Connect to local PostgreSQL, run `dotnet ef migrations list`, document applied vs. pending migrations. If DB doesn't exist, document that. If DB exists with partial migrations, document the gap.
**Prerequisites:** PostgreSQL running locally, connection string confirmed.
**Deliverable:** Applied/pending migration list, schema version confirmation.

### WO-DATA-002: Domain Coverage + CountyId Proof
**Scope:** Query actual tables for CountyId column presence. Verify county isolation in core entities (Property, TfParcel, SyncBatch). Count rows per county. Identify entities that lack CountyId.
**Prerequisites:** WO-DATA-001 (know which migrations are applied).
**Deliverable:** CountyId coverage matrix, multi-tenant risk assessment.

### WO-DATA-003: Seed/Fixture Provenance Cleanup
**Scope:** Audit seed scripts for fabricated vs. real data. Remove or quarantine fabricated sample data (initial-benton-import.sql). Ensure doctrine seeder (hosted service) is the only runtime seed path.
**Prerequisites:** WO-DATA-002 (know what data exists).
**Deliverable:** Seed provenance audit, cleaned seed scripts.

### WO-DATA-004: CAMA/PACS Import Contract Proof
**Scope:** Verify the Sync drain → promote → project pipeline against live PACS. Confirm that legacy_pacs_raw → truth_pacs → canonical_tf flow produces correct data. Verify SourceXref population. Document data completeness per lane (parcel, owner, improvement, land, sales, geometry).
**Prerequisites:** WO-DATA-003 (clean seed state).
**Deliverable:** Drain pipeline proof with row counts and sample verification.

### WO-DATA-005: TerraDais Persistence Completion
**Scope:** Verify TerraDais entities (Appeal, Workflow, QueueItem, etc.) are persisted and queryable. Complete any missing persistence wiring.
**Prerequisites:** WO-DATA-004 (canonical data exists for Dais to reference).
**Deliverable:** TerraDais persistence proof.

### WO-DATA-006: TerraTrace Event Persistence Proof
**Scope:** Verify AuditEvent and SecurityEvent are append-only, timestamped, and queryable. Confirm no mutation paths exist.
**Prerequisites:** WO-DATA-005.
**Deliverable:** TerraTrace append-only proof.

### WO-DATA-007: Sync Checkpoint/Job State Proof
**Scope:** Verify SyncBatch, SyncWatermark, SyncQuarantine state persistence across drain restarts. Confirm idempotency of drain operations.
**Prerequisites:** WO-DATA-006.
**Deliverable:** Sync state persistence proof.

### WO-DATA-008: DB Runtime Harness
**Scope:** Create a reproducible DB setup script that: starts PostgreSQL, applies all migrations, seeds doctrine rules, validates schema. Intended for CI and new-developer onboarding.
**Prerequisites:** WO-DATA-007 (all prior verifications complete).
**Deliverable:** `scripts/db-harness.sh` or equivalent, CI integration.

## Blockers for WO-DATA-001

1. **PostgreSQL must be running** on localhost:5432 with the `terrafusion` database (or ability to create it).
2. **PACS MSSQL** (`localhost:1433`) is needed for WO-DATA-004 but not WO-DATA-001.
3. **Connection string confirmation** — the actual password for the dev PostgreSQL user must be available (not the `${TF_DB_PASSWORD}` placeholder).

## Risks to Monitor

1. **init-db.sql vs. EF migrations conflict** — if init-db.sql was run AND EF migrations were applied, table conflicts are possible. WO-DATA-001 should check for this.
2. **Dual DbContext schema overlap** — LevyDbContext and TerraFusionDbContext both have levy-related entities. If both target the same database, schema conflicts are possible.
3. **Model snapshot drift** — if `TerraFusionDbContextModelSnapshot.cs` doesn't match the actual DB schema, new migrations will generate incorrect diffs.
4. **99-migration chain fragility** — any corruption in the migration chain (missing file, reordered timestamp) blocks all subsequent migrations.
5. **Three DB names** — dev (`terrafusion`), docker (`terrafusion_os`), production (`terrafusion_production`). Migration state may differ across all three.

## Constitutional Write-Lane Gaps

The following entities don't clearly belong to a constitutional write lane and should be assigned:
- Experiment, ExperimentRun (likely Dev/Test)
- Collaboration* entities (likely OS Core)
- Marketplace* entities (likely OS Core or dedicated Marketplace lane)
- Codex*, QuantumNotebook (likely AI or Herald)

Assignment is a governance decision, not a technical one. Flag for operator review.
