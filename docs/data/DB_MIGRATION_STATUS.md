# DB Migration Status

**Work Order:** WO-DATA-000
**Date:** 2026-06-13
**Type:** READ-ONLY audit (source-code analysis only)

---

## Migration Summary

| Context | Migration Count | Range | Location |
|---|---|---|---|
| TerraFusionDbContext | 99 | 2025-10-27 → 2026-05-09 | `backend/src/TerraFusion.Data/Migrations/` |
| CurrentUseDbContext | Unknown | Unknown | `backend/src/TerraFusion.CurrentUse/` |
| LevyDbContext | 4 known | Unknown | `backend/src/TerraFusion.Levy/` |

## TerraFusionDbContext — Full Migration List (99)

```
 #  Date        Name
 1  2025-10-27  InitialCreate
 2  2025-10-31  AddExperiments
 3  2025-10-31  AddExperimentRuns
 4  2025-11-02  AddNotificationPreferences
 5  2025-11-05  GuidMigration_UserIdCountyId
 6  2026-03-15  InitialLevySchema
 7  2026-03-15  AddHistoricalRates
 8  2026-03-15  AddLevyAudit
 9  2026-03-15  AddUserAudit
10  2026-03-15  AddLevyScenario
11  2026-03-15  AddDataQuality
12  2026-03-15  AddTaxDistrictColumns
13  2026-03-15  AddDaisEntities
14  2026-03-18  ActivateAiPersistence
15  2026-03-18  EnableNativeVectorColumn
16  2026-03-19  AddPacsEntities
17  2026-03-19  WidenPacsLegalDesc
18  2026-03-19  WidenLandDetailDecimals
19  2026-03-20  AddPacsOwnerVal
20  2026-03-20  AddPacsTaxAreaAssoc
21  2026-03-21  AddComparableSaleRawPacsCodes
22  2026-03-21  MapPacsValuationHoodCd
23  2026-03-23  RefactorQualification3Layer
24  2026-03-23  AddPacsFullSaleTable
25  2026-03-23  AddPacsLookupTables
26  2026-03-25  R2Wave41_ComparableSale_QualityImprvType
27  2026-03-25  AddReetWacCodesLookup
28  2026-03-26  FixImprvDetailDecimalOverflow
29  2026-03-26  FixPacsSaleDecimalOverflow
30  2026-03-26  AddPacsLevyTables
31  2026-03-27  AddComparableSalesYearDateIndex
32  2026-03-27  AddCalibrationWorkbench
33  2026-03-28  AddSaleRecordOutlierExclusion
34  2026-03-29  AddGisParcelGeometries
35  2026-03-29  AddCamaNeighborhoodAbsSubdv
36  2026-03-29  AddCityAndStratumToCama
37  2026-03-29  AddSecondaryFeaturePctToCostMatrix
38  2026-03-31  AddPropertyAssessmentAuditFields
39  2026-03-31  AddSalesAuditEntities
40  2026-04-01  AddAdjustmentWorkbench
41  2026-04-01  AddCountyStudioEntities
42  2026-04-01  AddExceptionSetLifecycle
43  2026-04-01  AddCountyStudySessionCountyName
44  2026-04-01  SetCountyStudySessionCountyNameMaxLength
45  2026-04-02  AddCountyAdjustmentSetRollbackReason
46  2026-04-02  AddSyncSpineEntities
47  2026-04-02  AddCanonicalLandingSchema
48  2026-04-05  AddSyncDatabaseAtlas
49  2026-04-06  AddSyncSourceConnection
50  2026-04-08  Slice_B2_1_AddProfileStats
51  2026-04-09  Slice_C2_AddSyncMappingWorkbook
52  2026-04-10  AddCanonicalSaleQualifications
53  2026-04-11  AddSalesCompEligibilityView
54  2026-04-11  AddSyncCountyActiveWorkbook
55  2026-04-11  AddCountyDownstreamClosureReceipts
56  2026-04-11  AddCountyApplyHandoffReceipts
57  2026-04-12  AddSegmentInspectorDownstreamReceipts
58  2026-04-15  AddCanonicalTfAndSyncBridgeV1
59  2026-04-15  AddGisTfParcelGeom
60  2026-04-16  AddLegacyPacsRawSale
61  2026-04-16  AddLegacyPacsRawPropSuppAssoc
62  2026-04-16  AddTruthPacsSale
63  2026-04-17  AddTfSaleAndUnprovenSale
64  2026-04-17  AddLegacyPacsRawAccount
65  2026-04-17  AddLegacyPacsRawOwner
66  2026-04-18  AddTruthPacsOwnerCurrent
67  2026-04-18  AddTfOwnerAndLink
68  2026-04-19  AddLegacyPacsRawWashPropOwnerVal
69  2026-04-19  AddTruthPacsWashPropOwnerVal
70  2026-04-19  AddTfAssessmentWsdorAndQuarantine
71  2026-04-22  AddLegacyPacsRawImprv
72  2026-04-22  AddLegacyPacsRawImprvDetail
73  2026-04-22  AddLegacyPacsRawImprvAttr
74  2026-04-22  AddLegacyPacsRawLandDetail
75  2026-04-23  AddTruthPacsImprvCurrent
76  2026-04-23  AddTruthPacsLandCurrent
77  2026-04-24  AddTfImprovementAndFeature
78  2026-04-25  AddDictNeighborhood
79  2026-04-25  AddAttributeDefinition
80  2026-04-25  AddAttributeIdNullableFkToFeatureAndLand
81  2026-04-26  AddLegacyArcGisRawParcelGeom
82  2026-04-26  AddTruthArcGisParcelGeomCurrent
83  2026-04-29  AddConversionEraToTruthPacs
84  2026-04-29  AddConversionEraToCanonicalTf
85  2026-04-30  WidenLegacyPacsRawSaleCodeColumns
86  2026-04-30  AddLegacyPacsRawPropertyTable
87  2026-04-30  AddTruthPacsParcelSpineTable
88  2026-05-01  WidenTfImprovementFeatureCodes
89  2026-05-01  SyncDoctrine1AddRatioPolicy
90  2026-05-02  SyncDoctrine2DualSurfaceSale
91  2026-05-06  SyncDoctrine4PropertyUniverseAndAttributeDictionary
92  2026-05-06  SyncDoctrine4V3LandDetailAgApply
93  2026-05-06  SyncDoctrine4V4PropertyValLanding
94  2026-05-08  SyncE1G2DictsAndTfParcelConversionEra
95  2026-05-08  SyncWorkbenchFTriageTable
96  2026-05-08  SyncWorkbenchGCommitTables
97  2026-05-08  SyncComplete2FullCorpusRun
98  2026-05-08  SyncDoctrine5SalesQualificationCodes
99  2026-05-09  SyncComplete2V2StageLevelResume
```

## Migration Phases

### Phase 1: Foundation (Oct-Nov 2025) — 5 migrations
Base schema, experiments, notifications, GUID migration.

### Phase 2: Levy & Dais (Mar 2026) — 8 migrations
Levy schema, historical rates, audit, scenarios, data quality, Dais entities.

### Phase 3: AI & PACS (Mar 2026) — 15 migrations
AI persistence, PACS entities, comparable sales, levy tables.

### Phase 4: Calibration & Workbench (Mar-Apr 2026) — 12 migrations
Calibration workbench, GIS, sales audit, adjustment workbench, county studio.

### Phase 5: Sync Foundation (Apr 2026) — 11 migrations
Sync spine, canonical landing, database atlas, mapping workbook, sale qualifications.

### Phase 6: Canonical & Legacy Landing (Apr 2026) — 23 migrations
Canonical TF + Sync Bridge V1, GIS TF, Legacy PACS raw tables (12), Truth tables, TF canonical entities, dictionaries.

### Phase 7: Doctrine & Workbench (May 2026) — 11 migrations
Conversion era, doctrine rules (1-5), workbench triage/commits, full corpus, stage-level resume.

### Gap: Nov 2025 → Mar 2026
4-month gap with no migrations. The project appears to have been dormant or in planning during this period.

## Applied vs. Pending Status

**UNKNOWN** — requires `dotnet ef migrations list --project TerraFusion.Data --startup-project TerraFusion.API` against a running PostgreSQL instance. This is blocked by the read-only constraint of WO-DATA-000.

## LevyDbContext Migrations (Known)

1. `InitialLevy`
2. `SeedLevyData`
3. `AddReferenceSourceTable`
4. `AddLevyCertificationAndBankedCapacity`

## Risks

1. **99 migrations is a long chain** — any break in the chain (missing migration, reordered timestamp) will cause EF to fail.
2. **Dual DbContext for Levy entities** — TerraFusionDbContext has levy-related entities (TaxLevy, PacsLevyRate, etc.) AND LevyDbContext has its own levy entities (District, LevyMeasure, etc.). Potential schema conflicts if both contexts target the same database.
3. **init-db.sql creates tables that EF migrations also create** — running both will cause conflicts.
4. **No rollback migrations** — all 99 are forward-only. Rollback requires manual intervention.
5. **Model snapshot** — `TerraFusionDbContextModelSnapshot.cs` exists and is the EF state-of-the-world. If it diverges from the actual DB, migrations will generate incorrect diffs.
