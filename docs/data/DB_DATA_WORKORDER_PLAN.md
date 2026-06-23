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
**Status:** COMPLETE (PR #1006, merged to main as `c4f350f26`)
**Scope:** Connect to local PostgreSQL, run `dotnet ef migrations list`, document applied vs. pending migrations. If DB doesn't exist, document that. If DB exists with partial migrations, document the gap.
**Prerequisites:** PostgreSQL running locally, connection string confirmed.
**Deliverable:** Applied/pending migration list, schema version confirmation.
**Finding:** 107 applied vs 99 source. 19 DB-only, 11 source-only. Forward migrations BLOCKED.

### WO-DATA-001R: Migration Divergence Reconciliation Plan
**Status:** COMPLETE (PR #1008, merged to main as `ac235e49b`)
**Scope:** READ-ONLY analysis of the migration divergence found by WO-DATA-001. Identify all DB-only and source-only migrations, categorize their origin, document context boundary risks, and recommend a reconciliation path. No schema/data mutations.
**Prerequisites:** WO-DATA-001 (divergence discovered).
**Deliverable:** Three analysis docs — DB_MIGRATION_DIVERGENCE_RECONCILIATION.md, DB_CONTEXT_BOUNDARY_RISK.md, DB_RECONCILIATION_DECISION_TREE.md.
**Finding:** Recommended path E+C: split Levy/CurrentUse histories explicitly, then create new clean dev DB (`terrafusion_dev_clean`) from current source migrations. Archive old `terrafusion` DB. Do not repair in place.

### WO-DATA-002A: Clean Dev DB Bootstrap Plan
**Status:** NOT STARTED
**Scope:** Create the plan and command harness for bootstrapping a new clean dev database from current source migrations. Includes: explicit LevyDatabase connection string, fail-loud Levy registration, 99-migration application, schema verification, PACS re-drain prerequisites. Does NOT mutate the existing contaminated `terrafusion` database.
**Prerequisites:** WO-DATA-001R (reconciliation path chosen by operator). PostgreSQL TCP connectivity restored.
**Deliverable:** Bootstrap plan doc, appsettings template, verification script.

### WO-DATA-002B: Domain Coverage + CountyId Proof
**Status:** NOT STARTED
**Scope:** Query actual tables for CountyId column presence. Verify county isolation in core entities (Property, TfParcel, SyncBatch). Count rows per county. Identify entities that lack CountyId.
**Prerequisites:** WO-DATA-002A (clean DB with all 99 migrations applied).
**Deliverable:** CountyId coverage matrix, multi-tenant risk assessment.

### WO-DATA-003: Seed/Fixture Provenance Cleanup
**Status:** NOT STARTED
**Scope:** Audit seed scripts for fabricated vs. real data. Remove or quarantine fabricated sample data (initial-benton-import.sql). Ensure doctrine seeder (hosted service) is the only runtime seed path.
**Prerequisites:** WO-DATA-002B (know what data exists).
**Deliverable:** Seed provenance audit, cleaned seed scripts.

### WO-DATA-004: CAMA/PACS Import Contract Proof
**Status:** NOT STARTED
**Scope:** Verify the Sync drain → promote → project pipeline against live PACS. Confirm that legacy_pacs_raw → truth_pacs → canonical_tf flow produces correct data. Verify SourceXref population. Document data completeness per lane (parcel, owner, improvement, land, sales, geometry).
**Prerequisites:** WO-DATA-003 (clean seed state).
**Deliverable:** Drain pipeline proof with row counts and sample verification.

### WO-DATA-005: TerraDais Persistence Completion
**Status:** NOT STARTED
**Scope:** Verify TerraDais entities (Appeal, Workflow, QueueItem, etc.) are persisted and queryable. Complete any missing persistence wiring.
**Prerequisites:** WO-DATA-004 (canonical data exists for Dais to reference).
**Deliverable:** TerraDais persistence proof.

### WO-DATA-006: TerraTrace Event Persistence Proof
**Status:** NOT STARTED
**Scope:** Verify AuditEvent and SecurityEvent are append-only, timestamped, and queryable. Confirm no mutation paths exist.
**Prerequisites:** WO-DATA-005.
**Deliverable:** TerraTrace append-only proof.

### WO-DATA-007: Sync Checkpoint/Job State Persistence Proof
**Status:** NOT STARTED
**Scope:** Verify SyncBatch, SyncWatermark, SyncQuarantine state persistence across drain restarts. Confirm idempotency of drain operations.
**Prerequisites:** WO-DATA-006.
**Deliverable:** Sync state persistence proof.

### WO-DATA-008: DB Runtime Harness
**Status:** NOT STARTED
**Scope:** Create a reproducible DB setup script that: starts PostgreSQL, applies all migrations, seeds doctrine rules, validates schema. Intended for CI and new-developer onboarding.
**Prerequisites:** WO-DATA-007 (all prior verifications complete).
**Deliverable:** `scripts/db-harness.sh` or equivalent, CI integration.

## Blockers for WO-DATA-002A

1. **PostgreSQL must accept TCP connections** on localhost:5432 (currently refusing — service running but not listening on TCP).
2. **Reconciliation path confirmed**: Path E+C (split context authority + clean dev DB from source).
3. **Operator approval** for exact DB name (`terrafusion_dev_clean`), archive procedure, and connection string changes.

## Risks to Monitor

1. **init-db.sql vs. EF migrations conflict** — if init-db.sql was run AND EF migrations were applied, table conflicts are possible.
2. **Dual DbContext schema overlap** — LevyDbContext and TerraFusionDbContext both have levy-related entities. DefaultConnection fallback must be removed.
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
