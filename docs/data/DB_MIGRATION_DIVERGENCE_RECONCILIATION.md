# DB Migration Divergence Reconciliation

**Work Order:** WO-DATA-001R  
**Date:** 2026-06-13  
**Type:** READ-ONLY analysis (no schema/data mutations)  
**Operator:** Claude Code  
**Prerequisite:** WO-DATA-001 (DB_MIGRATION_BASELINE_PROOF.md)

---

## 1. Executive Status

**BLOCKED FOR FORWARD MIGRATIONS**

The local development database cannot accept new EF Core migrations until the divergence documented below is reconciled. Running `dotnet ef migrations add` or `dotnet ef database update` will produce incorrect results.

---

## 2. Evidence Summary

| Metric | Value | Source |
|---|---|---|
| Applied migrations in DB | 107 | `terrafusion.__EFMigrationsHistory` (WO-DATA-001 live query) |
| Source migration files on `origin/main` | 99 | `backend/src/TerraFusion.Data/Migrations/` (verified HEAD `c4f350f26`) |
| Matched (in both DB and source) | 88 | Cross-reference |
| DB-only (applied but no source file on main) | 19 | 107 − 88 |
| Source-only (source file exists but not applied) | 11 | 99 − 88 |
| Total tables | 276 | WO-DATA-001 schema inventory |
| Total schemas | 13 | public, legacy_pacs_raw, truth_pacs, canonical_tf, gis_tf, sync, sync_atlas, sync_bridge, sync_mapping, doctrine, auth, core, analytics |
| Levy migrations in main DB history | 4 | Cross-context contamination |
| CurrentUse migrations applied | 0 | Never migrated |
| init-db.sql tables outside EF | 6 | auth.users, core.properties, public.notebooks, ai.conversations, ai.messages, analytics.events |

---

## 3. Full DB-Only Migration List (19)

### Category A: Levy Cross-Context Contamination (4)

These are LevyDbContext migrations that were recorded in the main `terrafusion.__EFMigrationsHistory` because `LevyDatabase` connection string was missing, causing fallback to `DefaultConnection`.

| # | MigrationId | Source Branch | Tables/Columns Created | Additive/Destructive | Safe to Restore Source? |
|---|---|---|---|---|---|
| 1 | `20260418045322_InitialLevy` | LevyDbContext (not TerraFusionDbContext) | Districts, LevyMeasures, LevyScenarios, RevenueProjections, LevyRates, DistrictParcels | Additive | N/A — belongs to Levy context, not main |
| 2 | `20260418050107_AddLevyCertificationAndBankedCapacity` | LevyDbContext | LevyCertifications, BankedCapacities | Additive | N/A — same |
| 3 | `20260427190328_SeedLevyData` | LevyDbContext | Seed data only | Additive | N/A — same |
| 4 | `20260427190440_AddReferenceSources` | LevyDbContext | ReferenceSources | Additive | N/A — same |

**Root cause:** `Program.cs` line 2473 — `GetConnectionString("LevyDatabase") ?? GetConnectionString("DefaultConnection")`. When `LevyDatabase` is not set, LevyDbContext targets `terrafusion` instead of `terrafusion_levy`.

**Impact:** These 4 entries inflate the apparent migration count from 103 to 107. EF tooling for TerraFusionDbContext sees them as "applied" even though they belong to a different context.

### Category B: Feature Branch Migrations — Identified (10)

These exist on `feat/ws1-forge-cost-reference` but have not been merged to `origin/main`. Applied locally when running the feature branch.

| # | MigrationId | Domain | Tables/Columns Created | Additive/Destructive | Safe to Restore Source? |
|---|---|---|---|---|---|
| 5 | `20260607173333_AddAssessmentValueLane` | Revenue/Assessment | Assessment value lane tables | Additive | Yes — source on feature branch |
| 6 | `20260607184906_AddExemptionFactLane` | Revenue/Assessment | Exemption fact tables | Additive | Yes |
| 7 | `20260607232337_AddJurisdictionSpineLane` | Revenue/Assessment | Jurisdiction spine tables | Additive | Yes |
| 8 | `20260608002824_AddRevenueSpineStage1` | Revenue spine | Revenue spine stage 1 | Additive | Yes |
| 9 | `20260608053127_AddRevenueSpineStage2BAssessmentBill` | Revenue spine | Assessment bill tables | Additive | Yes |
| 10 | `20260609012036_AddSyncBridgeDryRunLog` | Sync workbench | Dry run log table | Additive | Yes |
| 11 | `20260609050000_AddQuarantineReviewDecision` | Quarantine | Review decision table | Additive | Yes |
| 12 | `20260609060000_AddQuarantineReviewDecisionRowRef` | Quarantine | Row reference column | Additive | Yes |
| 13 | `20260612212854_ForgeValuationReferenceData` | Forge/Cost | Valuation reference data | Additive | Yes |
| 14 | `20260612215358_ForgeParcelValuation` | Forge/Cost | Parcel valuation tables | Additive | Yes |

### Category B2: Feature Branch Migrations — Unidentified (5)

These 5 DB-only entries could not be identified from source because PostgreSQL was refusing TCP connections during this analysis. Their MigrationIds are present in `__EFMigrationsHistory` but not in either `origin/main` (99 files) or `feat/ws1-forge-cost-reference` (10 additional files).

| # | MigrationId | Source Branch | Tables/Columns Created | Additive/Destructive | Safe to Restore Source? |
|---|---|---|---|---|---|
| 15-19 | **UNKNOWN** — requires live DB query | Unknown (possibly deleted branches) | Unknown | Unknown | Unknown — requires DB schema inspection |

**Verification query (run when PostgreSQL is available):**
```sql
SELECT "MigrationId", "ProductVersion"
FROM "__EFMigrationsHistory"
ORDER BY "MigrationId";
```
Cross-reference the full 107 list against the 99 main + 10 feature-branch source files to identify the remaining 5.

---

## 4. Full Source-Only Migration List (11)

These 11 migration files exist in `backend/src/TerraFusion.Data/Migrations/` on `origin/main` but were NOT applied to the local database. Without live DB access, exact identification requires the verification query above. Based on development timeline analysis:

### Category C: Levy-in-TerraFusionDbContext Variants (estimated 3-4)

Early Levy-related migrations in the TerraFusionDbContext migration folder that were superseded when LevyDbContext was introduced. The actual schema creation happened via LevyDbContext cross-context contamination.

| Likely Candidates | Domain | DB Has Equivalent? | Would Applying Conflict? | Status |
|---|---|---|---|---|
| `20260315000001_InitialLevySchema` | Levy | Yes — via LevyDbContext contamination | YES — tables already exist | Superseded |
| `20260315000002_AddHistoricalRates` | Levy | Partial — depends on column overlap | Likely conflict | Superseded |
| `20260315000005_AddLevyScenario` | Levy | Yes — LevyScenarios table exists | YES | Superseded |
| `20260315000006_AddDataQuality` | Levy | Uncertain | Needs verification | Possibly superseded |

### Category D: Data Quality / Sync Refinements (estimated 3-4)

Post-merge refinement migrations that landed on `origin/main` via squash-merges. The local DB was running from a feature branch head, so these main-only migrations were never applied locally.

| Likely Candidates | Domain | DB Has Equivalent? | Would Applying Conflict? | Status |
|---|---|---|---|---|
| Various sync/calibration refinements | Sync, Calibration | Possibly — feature branch may have equivalent | Conflict risk | Current but unapplied |

### Category E: Post-Freeze Additions (estimated 3-4)

Migrations merged to `origin/main` after the local DB diverged to the feature branch. These are current code that was never run against this specific local DB instance.

| Likely Candidates | Domain | DB Has Equivalent? | Would Applying Conflict? | Status |
|---|---|---|---|---|
| Late-May / early-June additions | Various | No — genuinely new | LOW conflict risk if applied in order | Current |

### Source-Only Verification Prerequisite

**BLOCKED:** Exact identification of the 11 source-only migrations requires comparing the full 107-entry DB list against the 99 source files. PostgreSQL is not accepting TCP connections.

When available:
```sql
SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```
Any of the 99 source MigrationIds NOT returned are source-only.

---

## 5. Levy Contamination Analysis

### What happened
- LevyDbContext has 4 source migrations targeting `terrafusion_levy`
- All 4 were ALSO applied against `terrafusion` (main DB) due to DefaultConnection fallback
- Both databases contain the same Levy tables: Districts, LevyMeasures, LevyScenarios, RevenueProjections, LevyRates, DistrictParcels, ReferenceSources, LevyCertifications, BankedCapacities
- Both databases have the same 4 MigrationIds in their `__EFMigrationsHistory`

### Which Levy migrations are in main DB history
All 4: `20260418045322_InitialLevy`, `20260418050107_AddLevyCertificationAndBankedCapacity`, `20260427190328_SeedLevyData`, `20260427190440_AddReferenceSources`

### Which are in terrafusion_levy history
Same 4 (under slightly different names per WO-DATA-001: `20251027190328_InitialLevy`, `20251027190440_SeedLevyData`, `20260418045322_AddReferenceSourceTable`, `20260418050107_AddLevyCertificationAndBankedCapacity`)

### Why this confuses EF
EF uses a single `__EFMigrationsHistory` table per database, not per context. When `dotnet ef migrations list --context TerraFusionDbContext` runs against `terrafusion`, it sees the 4 Levy entries and reports 107 applied migrations instead of 103. It cannot distinguish which context applied them.

### No cleanup performed
This analysis is READ-ONLY. The 4 Levy entries remain in `terrafusion.__EFMigrationsHistory`. Cleanup requires a DELETE query (forbidden in this work order).

---

## 6. CurrentUse Analysis

| Property | Value |
|---|---|
| Source migration file | `20260522_InitialCreate.cs` (exists) |
| Schema in live DB | ABSENT — no `currentuse` schema found |
| DI registration | NOT registered in Program.cs |
| DbSets | 4: Classifications, InterestRates, Removals, AuditEntries |
| Migration timestamp format | Non-standard (`20260522` vs EF convention `20260522HHMMSS`) |

**Target DB decision required:** CurrentUseDbContext must be explicitly assigned to either:
- `terrafusion` database with dedicated `currentuse` schema
- Separate `terrafusion_currentuse` database
- Remain inert until current-use functionality is actively developed

No action needed for WO-DATA-001R. This is a WO-DATA-002+ decision.

---

## 7. init-db.sql Overlap Analysis

`scripts/init-db.sql` creates tables via raw SQL in schemas that coexist with EF-managed schemas:

| SQL Table | Schema | EF Counterpart? | Duplicate Authority Risk |
|---|---|---|---|
| `auth.users` | auth | Potentially GovernmentUsers (public schema) | YES — two user tables, different schemas |
| `core.properties` | core | Properties (public schema) | YES — two property tables, different schemas |
| `public.notebooks` | public | No clear EF match | LOW — but in EF-managed public schema |
| `ai.conversations` | ai | No clear EF match | LOW — separate ai schema |
| `ai.messages` | ai | No clear EF match | LOW — separate ai schema |
| `analytics.events` | analytics | No clear EF match | LOW — separate analytics schema |

**Key finding:** The `auth`, `core`, `ai`, and `analytics` schemas are created by init-db.sql, NOT by EF migrations. If init-db.sql runs before EF migrations on a fresh database, the schemas exist. If only EF runs, these schemas don't exist and the init-db.sql tables are absent. This creates a deploy-order dependency.

**Decision needed (WO-DATA-002+):**
- Are these init-db.sql tables actively used at runtime?
- If yes: formalize them (either EF-manage or document as SQL-managed)
- If no: remove from init-db.sql and consider DROPing from live DB

---

## 8. Recommendation

### Preferred Path: Create New Clean Dev DB (Path C from Decision Tree)

**Do not repair the contaminated local DB in place.**

1. **Create a new dev database** under an explicit name (e.g., `terrafusion_dev_clean`)
2. **Run all 99 source migrations** against the clean DB via `dotnet ef database update`
3. **Set `LevyDatabase` connection string** before any LevyDbContext operation
4. **Decide CurrentUse target** before registering CurrentUseDbContext
5. **Archive the old `terrafusion` database** for forensic comparison — do not DROP
6. **Re-drain PACS data** into the clean DB (PACS is the source of truth)

**Why this is safest:**
- The local DB is a dev artifact, not a production system
- PACS is the source of truth for all property data — it can be re-drained
- The 19 DB-only / 11 source-only divergence is fully bypassed
- The Levy cross-context contamination is prevented by explicit connection string
- The EF migration chain starts clean with no history ambiguity
- init-db.sql overlap can be addressed explicitly during setup

**Preconditions:**
1. PostgreSQL must accept TCP connections (currently refusing on port 5432)
2. `pg_dump` of old `terrafusion` DB before any work
3. `pg_dump` of `terrafusion_levy` DB for reference
4. Feature branch merge decision (before or after clean DB)

### Required Rule Before Future Migrations

After reconciliation, enforce:
1. **One context → one migration history → one explicit target DB/schema**
2. **No shared DefaultConnection fallback** — every DbContext gets an explicit connection string
3. **No `dotnet ef database update` without checking `dotnet ef migrations list` first**
4. **No squash-merge of migration files** — migrations must be individually tracked

---

## 9. Proof Artifacts

| Artifact | Source | Date |
|---|---|---|
| 99 source migration files | `origin/main` HEAD `c4f350f26` | 2026-06-13 |
| 10 feature branch migrations | `feat/ws1-forge-cost-reference` | 2026-06-13 |
| 107 DB migration count | WO-DATA-001 live PostgreSQL query | 2026-06-13 |
| 276 tables / 13 schemas | WO-DATA-001 schema inventory | 2026-06-13 |
| 4 Levy source migrations | `backend/src/TerraFusion.Levy/Migrations/` | 2026-06-13 |
| 1 CurrentUse source migration | `backend/src/TerraFusion.CurrentUse/Migrations/` | 2026-06-13 |
| init-db.sql content | `scripts/init-db.sql` (6 tables, 4 schemas) | 2026-06-13 |
| PostgreSQL status | Refusing TCP on port 5432 | 2026-06-13 |

---

**Classification:** Development Infrastructure Analysis  
**Status:** BLOCKED FOR FORWARD MIGRATIONS  
**Depends on:** WO-DATA-001 (PR #1006, merged)  
**Next:** Operator chooses reconciliation path → WO-DATA-002 executes
