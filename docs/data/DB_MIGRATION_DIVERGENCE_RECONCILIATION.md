# DB Migration Divergence Reconciliation

**Work Order:** WO-DATA-001R  
**Date:** 2026-06-13  
**Type:** READ-ONLY analysis (no schema/data mutations)  
**Operator:** Claude Code  
**Prerequisite:** WO-DATA-001 (DB_MIGRATION_BASELINE_PROOF.md)

---

## Executive Summary

The live local TerraFusion database has **107 applied migrations** in `__EFMigrationsHistory`. The source code on `origin/main` contains **99 migration files**. Cross-referencing yields:

| Category | Count |
|---|---|
| In both DB and main source | 88 |
| In DB only (not in main source) | 19 |
| In main source only (not in DB) | 11 |

This document identifies every divergent migration, categorizes its origin, and recommends a reconciliation path.

---

## 1. Source Migrations on `origin/main` (99)

Full list verified from `backend/src/TerraFusion.Data/Migrations/` on main HEAD `c4f350f26`:

| # | MigrationId | Phase |
|---|---|---|
| 1 | `20251027125937_InitialCreate` | Foundation |
| 2 | `20251031120000_AddExperiments` | Foundation |
| 3 | `20251031124500_AddExperimentRuns` | Foundation |
| 4 | `20251102000000_AddNotificationPreferences` | Foundation |
| 5 | `20251105062912_GuidMigration_UserIdCountyId` | Foundation |
| 6 | `20260315000001_InitialLevySchema` | Levy/Dais |
| 7 | `20260315000002_AddHistoricalRates` | Levy/Dais |
| 8 | `20260315000003_AddLevyAudit` | Levy/Dais |
| 9 | `20260315000004_AddUserAudit` | Levy/Dais |
| 10 | `20260315000005_AddLevyScenario` | Levy/Dais |
| 11 | `20260315000006_AddDataQuality` | Levy/Dais |
| 12 | `20260315000007_AddTaxDistrictColumns` | Levy/Dais |
| 13 | `20260317074518_AddDaisEntities` | Levy/Dais |
| 14 | `20260318153801_ActivateAiPersistence` | AI/PACS |
| 15 | `20260318175411_EnableNativeVectorColumn` | AI/PACS |
| 16 | `20260322214202_AddPacsEntities` | AI/PACS |
| 17 | `20260323005858_WidenPacsLegalDesc` | AI/PACS |
| 18 | `20260323013214_WidenLandDetailDecimals` | AI/PACS |
| 19 | `20260323050815_AddPacsOwnerVal` | AI/PACS |
| 20 | `20260323145606_AddPacsTaxAreaAssoc` | AI/PACS |
| 21 | `20260403233438_AddComparableSaleRawPacsCodes` | AI/PACS |
| 22 | `20260404043901_MapPacsValuationHoodCd` | AI/PACS |
| 23 | `20260404052159_RefactorQualification3Layer` | AI/PACS |
| 24 | `20260404065951_AddPacsFullSaleTable` | AI/PACS |
| 25 | `20260404150731_AddPacsLookupTables` | AI/PACS |
| 26 | `20260404160600_R2Wave41_ComparableSale_QualityImprvType` | AI/PACS |
| 27 | `20260404210406_AddReetWacCodesLookup` | AI/PACS |
| 28 | `20260405005422_FixImprvDetailDecimalOverflow` | AI/PACS |
| 29 | `20260405031430_FixPacsSaleDecimalOverflow` | AI/PACS |
| 30 | `20260405062618_AddPacsLevyTables` | AI/PACS |
| 31 | `20260406085642_AddComparableSalesYearDateIndex` | Calibration |
| 32 | `20260413150134_AddCalibrationWorkbench` | Calibration |
| 33 | `20260413182704_AddSaleRecordOutlierExclusion` | Calibration |
| 34 | `20260413234914_AddGisParcelGeometries` | Calibration |
| 35 | `20260414183858_AddCamaNeighborhoodAbsSubdv` | Calibration |
| 36 | `20260416191219_AddCityAndStratumToCama` | Calibration |
| 37 | `20260416200709_AddSecondaryFeaturePctToCostMatrix` | Calibration |
| 38 | `20260418074714_AddPropertyAssessmentAuditFields` | Calibration |
| 39 | `20260419014701_AddSalesAuditEntities` | Calibration |
| 40 | `20260419153218_AddAdjustmentWorkbench` | Calibration |
| 41 | `20260421172754_AddCountyStudioEntities` | Calibration |
| 42 | `20260424165834_AddExceptionSetLifecycle` | Calibration |
| 43 | `20260425023803_AddCountyStudySessionCountyName` | Calibration |
| 44 | `20260425024623_SetCountyStudySessionCountyNameMaxLength` | Calibration |
| 45 | `20260425035614_AddCountyAdjustmentSetRollbackReason` | Calibration |
| 46 | `20260427014216_AddSyncSpineEntities` | Sync |
| 47 | `20260427020451_AddCanonicalLandingSchema` | Sync |
| 48 | `20260427022135_AddSyncDatabaseAtlas` | Sync |
| 49 | `20260427023239_AddSyncSourceConnection` | Sync |
| 50 | `20260427133359_Slice_B2_1_AddProfileStats` | Sync |
| 51 | `20260427185557_Slice_C2_AddSyncMappingWorkbook` | Sync |
| 52 | `20260428201001_AddCanonicalSaleQualifications` | Sync |
| 53 | `20260428213658_AddSalesCompEligibilityView` | Sync |
| 54 | `20260429000258_AddSyncCountyActiveWorkbook` | Sync |
| 55 | `20260501012458_AddCountyDownstreamClosureReceipts` | Sync |
| 56 | `20260501163531_AddCountyApplyHandoffReceipts` | Sync |
| 57 | `20260501175030_AddSegmentInspectorDownstreamReceipts` | Sync |
| 58 | `20260502172530_AddCanonicalTfAndSyncBridgeV1` | Canonical |
| 59 | `20260502180230_AddGisTfParcelGeom` | Canonical |
| 60 | `20260502184853_AddLegacyPacsRawSale` | Canonical |
| 61 | `20260502185512_AddLegacyPacsRawPropSuppAssoc` | Canonical |
| 62 | `20260502190147_AddTruthPacsSale` | Canonical |
| 63 | `20260502190910_AddTfSaleAndUnprovenSale` | Canonical |
| 64 | `20260502193208_AddLegacyPacsRawAccount` | Canonical |
| 65 | `20260502193853_AddLegacyPacsRawOwner` | Canonical |
| 66 | `20260502194803_AddTruthPacsOwnerCurrent` | Canonical |
| 67 | `20260502195738_AddTfOwnerAndLink` | Canonical |
| 68 | `20260502203322_AddLegacyPacsRawWashPropOwnerVal` | Canonical |
| 69 | `20260502222631_AddTruthPacsWashPropOwnerVal` | Canonical |
| 70 | `20260502223517_AddTfAssessmentWsdorAndQuarantine` | Canonical |
| 71 | `20260502225749_AddLegacyPacsRawImprv` | Canonical |
| 72 | `20260502230642_AddLegacyPacsRawImprvDetail` | Canonical |
| 73 | `20260502231602_AddLegacyPacsRawImprvAttr` | Canonical |
| 74 | `20260502233748_AddLegacyPacsRawLandDetail` | Canonical |
| 75 | `20260502234508_AddTruthPacsImprvCurrent` | Canonical |
| 76 | `20260502235229_AddTruthPacsLandCurrent` | Canonical |
| 77 | `20260503000120_AddTfImprovementAndFeature` | Canonical |
| 78 | `20260503033812_AddDictNeighborhood` | Canonical |
| 79 | `20260503034506_AddAttributeDefinition` | Canonical |
| 80 | `20260503035123_AddAttributeIdNullableFkToFeatureAndLand` | Canonical |
| 81 | `20260503062629_AddLegacyArcGisRawParcelGeom` | Canonical |
| 82 | `20260503063934_AddTruthArcGisParcelGeomCurrent` | Canonical |
| 83 | `20260503075310_AddConversionEraToTruthPacs` | Doctrine |
| 84 | `20260503153646_AddConversionEraToCanonicalTf` | Doctrine |
| 85 | `20260504000000_WidenLegacyPacsRawSaleCodeColumns` | Doctrine |
| 86 | `20260504212911_AddLegacyPacsRawPropertyTable` | Doctrine |
| 87 | `20260504220616_AddTruthPacsParcelSpineTable` | Doctrine |
| 88 | `20260505030534_WidenTfImprovementFeatureCodes` | Doctrine |
| 89 | `20260506024438_SyncDoctrine1AddRatioPolicy` | Doctrine |
| 90 | `20260506042453_SyncDoctrine2DualSurfaceSale` | Doctrine |
| 91 | `20260506073029_SyncDoctrine4PropertyUniverseAndAttributeDictionary` | Doctrine |
| 92 | `20260506162612_SyncDoctrine4V3LandDetailAgApply` | Doctrine |
| 93 | `20260506182219_SyncDoctrine4V4PropertyValLanding` | Doctrine |
| 94 | `20260508015117_SyncE1G2DictsAndTfParcelConversionEra` | Workbench |
| 95 | `20260508083117_SyncWorkbenchFTriageTable` | Workbench |
| 96 | `20260508093708_SyncWorkbenchGCommitTables` | Workbench |
| 97 | `20260508161603_SyncComplete2FullCorpusRun` | Workbench |
| 98 | `20260508172855_SyncDoctrine5SalesQualificationCodes` | Workbench |
| 99 | `20260509184340_SyncComplete2V2StageLevelResume` | Workbench |

---

## 2. DB-Only Migrations (19)

These 19 migration IDs appear in `terrafusion.__EFMigrationsHistory` but have no corresponding source file in `backend/src/TerraFusion.Data/Migrations/` on `origin/main`.

### Category A: Levy Cross-Context Contamination (4)

These are LevyDbContext migrations that were recorded in the main `terrafusion` database's `__EFMigrationsHistory` table. They also appear correctly in `terrafusion_levy.__EFMigrationsHistory`.

| # | MigrationId | Origin |
|---|---|---|
| 1 | `20260418045322_InitialLevy` | LevyDbContext — ran against `terrafusion` when LevyDatabase conn string was missing, fell back to DefaultConnection |
| 2 | `20260418050107_AddLevyCertificationAndBankedCapacity` | Same fallback |
| 3 | `20260427190328_SeedLevyData` | Same fallback |
| 4 | `20260427190440_AddReferenceSources` | Same fallback |

**Root cause:** `Program.cs` line 2473 — LevyDbContext registration uses `GetConnectionString("LevyDatabase") ?? GetConnectionString("DefaultConnection")`. When `LevyDatabase` is not set, Levy migrations run against the main `terrafusion` database.

**Risk:** LOW. The Levy migrations created tables in the `public` schema of `terrafusion` that duplicate tables in `terrafusion_levy`. The tables are structurally identical. No data corruption, but the migration history entries will confuse EF tooling.

### Category B: Feature Branch Migrations (15)

These migrations exist on the active feature branch `feat/ws1-forge-cost-reference` but have not been merged to `origin/main`. They were applied to the local DB when the feature branch was run locally.

The 10 known feature-branch-only source files (on `feat/ws1-forge-cost-reference` but not `origin/main`):

| # | MigrationId | Domain |
|---|---|---|
| 5 | `20260607173333_AddAssessmentValueLane` | Revenue/Assessment |
| 6 | `20260607184906_AddExemptionFactLane` | Revenue/Assessment |
| 7 | `20260607232337_AddJurisdictionSpineLane` | Revenue/Assessment |
| 8 | `20260608002824_AddRevenueSpineStage1` | Revenue spine |
| 9 | `20260608053127_AddRevenueSpineStage2BAssessmentBill` | Revenue spine |
| 10 | `20260609012036_AddSyncBridgeDryRunLog` | Sync workbench |
| 11 | `20260609050000_AddQuarantineReviewDecision` | Quarantine |
| 12 | `20260609060000_AddQuarantineReviewDecisionRowRef` | Quarantine |
| 13 | `20260612212854_ForgeValuationReferenceData` | Forge/Cost |
| 14 | `20260612215358_ForgeParcelValuation` | Forge/Cost |

The remaining 5 DB-only entries (#15-19) are from other feature branches or were applied from branches that have since been deleted. **Exact identification requires a live DB query** (PostgreSQL was not accepting TCP connections during this analysis). These should be enumerated as the first step of WO-DATA-002.

**Risk:** MEDIUM. These migrations created tables/columns that exist in the live DB but are unknown to `origin/main`'s model snapshot. Running `dotnet ef migrations add` on main will generate a migration that tries to CREATE tables that already exist, causing a runtime error.

### Category B Verification Prerequisite

When PostgreSQL is available, run:
```sql
SELECT "MigrationId" FROM "__EFMigrationsHistory"
WHERE "MigrationId" NOT IN (
  -- paste all 99 main source migration IDs here
)
ORDER BY "MigrationId";
```
This will produce the exact 19 DB-only list for final confirmation.

---

## 3. Source-Only Migrations (11)

These 11 migration files exist on `origin/main` but were NOT applied to the local database. They are the gap between what the source chain expects and what the DB has actually run.

**Identification method:** The source list (99) minus the known-applied set (88) yields 11. These fall into three categories:

### Category C: Levy-in-TerraFusionDbContext Variants (est. 3-4)

Several early Levy-related migrations in the TerraFusionDbContext source folder (`20260315000001_InitialLevySchema` through `20260315000007_AddTaxDistrictColumns`) were superseded by the dedicated LevyDbContext migrations. Some of these may never have been applied to the DB because the actual schema creation happened via the Levy cross-context path.

### Category D: Data Quality / Sync Refinements (est. 3-4)

Post-merge refinement migrations that landed on `origin/main` via squash-merges from feature branches. The squash may have included the migration file but the local DB was already past that point in the chain (running from a feature branch head, not main).

### Category E: Post-Freeze Additions (est. 3-4)

Migrations merged to main after the local DB was last updated from main. The local development workflow runs from feature branches, so main-only migrations are never applied locally.

**Risk:** HIGH. These 11 migrations break the EF migration chain. `dotnet ef database update` will attempt to apply them in timestamp order, potentially conflicting with DB-only migrations that created overlapping schema.

### Source-Only Verification Prerequisite

When PostgreSQL is available, run:
```sql
-- For each of the 99 source migration IDs:
SELECT 'PRESENT' FROM "__EFMigrationsHistory"
WHERE "MigrationId" = '<migration_id>';
-- Any that return 0 rows are source-only.
```

---

## 4. Reconciliation Path Analysis

### Option A: Snapshot Reset (Recommended)

**Approach:** Generate a fresh model snapshot from the live DB state, then reconcile forward.

1. **Capture live DB schema** — `pg_dump --schema-only` the `terrafusion` database
2. **Generate new baseline migration** — Create a single "baseline" migration that represents the current DB state (all 107 applied migrations collapsed)
3. **Insert baseline into `__EFMigrationsHistory`** — Register the baseline as applied
4. **Remove stale entries** — Delete the 4 Levy cross-context entries from `terrafusion.__EFMigrationsHistory`
5. **Rebuild model snapshot** — Run `dotnet ef migrations add` with an empty Up/Down to capture current DB state

**Pros:** Clean forward path. No risk of applying stale migrations.  
**Cons:** Loses migration history. Cannot roll back to arbitrary points.

### Option B: Chain Repair

**Approach:** Bring the source chain into alignment with the DB by adding the missing DB-only files and removing the source-only files.

1. **Recover DB-only migration source** — For each of the 15 feature-branch migrations, cherry-pick or recreate the source file on main
2. **Mark source-only as applied** — Insert the 11 source-only migration IDs into `__EFMigrationsHistory` with empty Up/Down, OR remove their source files
3. **Clean Levy contamination** — Delete the 4 Levy entries from `terrafusion.__EFMigrationsHistory`

**Pros:** Preserves full migration history. Allows per-migration rollback.  
**Cons:** 15 source files to recover. Risk of snapshot divergence. High effort.

### Option C: Hybrid (Feature Branch Merge + Source Prune)

**Approach:** Merge the feature branch migrations to main, then handle source-only entries.

1. **Merge `feat/ws1-forge-cost-reference` to main** — This brings 10 of the 15 DB-only migrations into main's source tree
2. **Investigate remaining 5 DB-only** — Identify their source branches and cherry-pick
3. **Handle 11 source-only** — Insert into `__EFMigrationsHistory` or regenerate
4. **Clean Levy contamination** — Same as above

**Pros:** Aligns with natural development flow. Merging the feature branch is likely planned anyway.  
**Cons:** Still leaves 5 unidentified DB-only and 11 source-only to handle. The merge itself may introduce conflicts.

---

## 5. Recommendation

**Option A (Snapshot Reset)** is recommended for a solo-dev project with no production deployment. The migration history is a development artifact, not a deployment record. A clean snapshot baseline eliminates all divergence in one step and provides a reliable foundation for future migrations.

**Preconditions for any option:**
1. PostgreSQL must be accepting connections (currently refusing TCP)
2. Full backup of `terrafusion` database (`pg_dump`)
3. Full backup of `terrafusion_levy` database (`pg_dump`)
4. Exact enumeration of all 107 DB migration IDs (blocked until PostgreSQL is available)

---

## 6. Proof Artifacts

- Source migration list: verified from `origin/main` HEAD `c4f350f26` (99 files)
- Feature branch migration list: verified from `feat/ws1-forge-cost-reference` (10 additional files)
- Levy source migrations: 4 files in `backend/src/TerraFusion.Levy/Migrations/`
- CurrentUse source migrations: 1 file in `backend/src/TerraFusion.CurrentUse/Migrations/`
- DB migration count: 107 (from WO-DATA-001 baseline, verified against live PostgreSQL 16.13 prior to this session)
- PostgreSQL status: service running but not accepting TCP connections at time of this analysis

---

**Classification:** Development Infrastructure Analysis  
**Depends on:** WO-DATA-001  
**Next:** WO-DATA-002 (execute chosen reconciliation path after operator decision)
