# WO-DATA-002B: Sync/Dais/Forge/Trace Table Coverage Proof

**Date**: 2026-06-15
**Database**: `terrafusion_dev_clean` (Docker PG16, port 5432)
**Status**: COMPLETE
**Method**: SELECT-only against `information_schema.tables` with pattern matching

---

## 1. Summary

| Domain | Tables Found | Status |
|--------|-------------|--------|
| Sync pipeline (full) | 64 | PRESENT |
| TerraDais | 10 | PRESENT |
| TerraForge | 4 | PRESENT |
| TerraTrace | 6 | PRESENT |
| **Total domain coverage** | **84** | **ALL PRESENT** |

## 2. Sync Pipeline Tables (64)

### canonical_tf (16 tables)

| Table | Purpose |
|-------|---------|
| attribute_definition | Improvement attribute dictionary |
| dict_exemption_type | Exemption type lookup |
| dict_imprv_state | Improvement state codes |
| dict_imprv_type | Improvement type codes |
| dict_land_state | Land state codes |
| dict_land_use | Land use codes |
| dict_neighborhood | Neighborhood lookup |
| dict_situs_legal | Situs/legal lookup |
| tf_assessment_wsdor | WSDOR assessment records |
| tf_improvement | Canonical improvements |
| tf_improvement_feature | Improvement features (child) |
| tf_land | Canonical land records |
| tf_owner | Canonical owners |
| tf_parcel | Canonical parcels |
| tf_parcel_owner_link | Parcel-owner junction |
| tf_sale | Canonical sales |

### doctrine_tf (4 tables)

| Table | Purpose |
|-------|---------|
| tf_doctrine_attribute_dictionary | Attribute dictionary rules |
| tf_doctrine_property_universe | Universe classification rules |
| tf_doctrine_ratio_policy | Ratio qualification rules |
| tf_doctrine_sales_qualification_codes | Sale qualification code rules |

### gis_tf (1 table)

| Table | Purpose |
|-------|---------|
| tf_parcel_geom | Parcel geometry (canonical) |

### legacy_pacs_raw (11 tables)

| Table | Purpose |
|-------|---------|
| account | PACS account landing |
| imprv | PACS improvement landing |
| imprv_attr | PACS improvement attributes |
| imprv_detail | PACS improvement details |
| land_detail | PACS land details |
| owner | PACS owner landing |
| prop_supp_assoc | Property supplemental associations |
| property | PACS property landing |
| property_val | PACS property valuations |
| sale | PACS sale landing |
| wash_prop_owner_val | WA property-owner-val composite |

### legacy_tf_unproven (7 tables)

| Table | Purpose |
|-------|---------|
| imprv_current | Unproven improvement staging |
| land_current | Unproven land staging |
| owner_current | Unproven owner staging |
| sale | Unproven sale staging |
| unproven_imprv_attr_triage | Attribute triage staging |
| unresolved_imprv_attr | Unresolved attribute staging |
| wash_prop_owner_val | WA prop-owner-val staging |

### truth_pacs (6 tables)

| Table | Purpose |
|-------|---------|
| imprv_current | Promoted improvement truth |
| land_current | Promoted land truth |
| owner_current | Promoted owner truth |
| parcel_spine | Parcel spine (identity) |
| sale | Promoted sale truth |
| wash_prop_owner_val | WA prop-owner-val truth |

### sync_bridge (8 tables)

| Table | Purpose |
|-------|---------|
| conflict_queue | Conflict resolution queue |
| diff_ledger | Change diff tracking |
| field_authority | Field-level authority map |
| load_batch | Batch load tracking |
| promotion_gate_result | Gate evaluation results |
| rollback_package | Rollback snapshots |
| source_xref | Source identity crosswalk |
| writeback_journal | Writeback audit journal |

### tf_workbench (5 tables)

| Table | Purpose |
|-------|---------|
| full_corpus_lane_result | Full corpus per-lane results |
| full_corpus_reconciliation | Reconciliation records |
| full_corpus_run | Full corpus run metadata |
| workbench_commit | Workbench commit records |
| workbench_commit_decision_link | Commit-decision junction |

### public.Sync* (17 tables)

SyncBatches, SyncCountyActiveWorkbooks, SyncMappingCodeValues, SyncMappingColumns, SyncMappingWorkbooks, SyncProfileCodeCandidates, SyncProfileCodes, SyncProfileColumnStats, SyncProfileColumns, SyncProfileConstraints, SyncProfileFunctions, SyncProfileProcedures, SyncProfileTableStats, SyncProfileTables, SyncProfileTriggers, SyncProfileViews, SyncQuarantine, SyncRecords, SyncSourceConnections, SyncWatermarks

### GIS (2 tables)

| Table | Schema | Purpose |
|-------|--------|---------|
| parcel_geom | legacy_arcgis_raw | Raw ArcGIS geometry landing |
| parcel_geom_current | truth_arcgis | Promoted ArcGIS geometry |

## 3. TerraDais Tables (10)

| Table | Purpose |
|-------|---------|
| public.Appeals | Appeal records |
| public.CertificationSteps | Certification workflow steps |
| public.Exemptions | Exemption records |
| public.Notices | Notice generation |
| public.QueueItems | Work queue items |
| public.WorkflowExecutions | Workflow execution log |
| public.Workflows | Workflow definitions |
| public.LevyCertifications | Levy certification records |
| public.pacs_appeals | PACS appeal mirror |
| public.pacs_exemptions | PACS exemption mirror |

## 4. TerraForge Tables (4)

| Table | Purpose |
|-------|---------|
| public.ComparableSales | Comparable sale records |
| public.CostMatrices | Cost matrix definitions |
| public.MatrixVersions | Matrix version tracking |
| public.SaleComparableRecords | Sale-comparable junction |

## 5. TerraTrace Tables (6)

| Table | Purpose |
|-------|---------|
| public.AuditEvents | Audit event log |
| public.AuditLogs | Audit trail |
| public.AuditFindings | Audit findings |
| public.AuditReconciliations | Audit reconciliation records |
| public.SecurityEvents | Security event log |
| public.DossierCustodyEvents | Evidence custody chain |

## 6. Three-Layer Pipeline Verification

The Sync pipeline's three-layer architecture is fully represented:

```
legacy_pacs_raw (11 tables)     ← Layer 1: Raw PACS landing
     ↓ promote
truth_pacs (6 tables)           ← Layer 2: Promoted truth
     ↓ project
canonical_tf (16 tables)        ← Layer 3: Canonical TerraFusion
```

Supporting infrastructure:
- `doctrine_tf` (4 tables) — classification rules
- `sync_bridge` (8 tables) — crosswalk + conflict resolution
- `tf_workbench` (5 tables) — full-corpus operations
- `legacy_tf_unproven` (7 tables) — staging/triage

## 7. Schemas Present

All 11 expected schemas exist:

1. `public` — core domain + EF-managed entities
2. `canonical_tf` — canonical TerraFusion data
3. `doctrine_tf` — doctrine/rule engine
4. `gis_tf` — GIS canonical
5. `legacy_arcgis_raw` — raw ArcGIS landing
6. `legacy_pacs_raw` — raw PACS landing
7. `legacy_tf_unproven` — unproven staging
8. `sync_bridge` — sync infrastructure
9. `tf_workbench` — workbench operations
10. `truth_arcgis` — promoted ArcGIS truth
11. `truth_pacs` — promoted PACS truth

---

No mutations performed. All queries were SELECT-only.
