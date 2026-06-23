# DB / Sync Dependency Map

**Work Order:** WO-DATA-000
**Date:** 2026-06-13
**Type:** READ-ONLY audit (source-code analysis only)

---

## Data Flow Architecture

```
Harris PACS (MSSQL)     ArcGIS (external)
     │                        │
     ▼                        ▼
┌─────────────────────────────────────┐
│  Legacy Raw Landing Layer           │
│  legacy_pacs_raw.* (12 tables)      │
│  legacy_arcgis_raw.* (1 table)      │
└──────────────┬──────────────────────┘
               │ Drain → Promote
               ▼
┌─────────────────────────────────────┐
│  Truth Layer                        │
│  truth_pacs.* (7 tables)            │
│  truth_arcgis.* (1 table)           │
│  + Doctrine rules applied           │
└──────────────┬──────────────────────┘
               │ Project → Canonical
               ▼
┌─────────────────────────────────────┐
│  Canonical TF Layer                 │
│  canonical_tf.* (17 tables)         │
│  + GIS TF (1 table)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Application Layer                  │
│  TerraForge, TerraDais, TerraDossier│
│  Marketplace, AI, Collaboration     │
└─────────────────────────────────────┘
```

## Sync Entity Dependencies

### Layer 1: Sync Infrastructure
| Entity | Depends On | Purpose |
|---|---|---|
| SyncSourceConnection | — | PACS connection config |
| SyncBatch | SyncSourceConnection | Batch envelope |
| SyncRecord | SyncBatch | Individual record tracking |
| SyncWatermark | SyncSourceConnection | High-water mark per source |
| SyncQuarantine | SyncBatch | Quarantined records |

### Layer 2: Sync Atlas (Database Profiling)
| Entity | Depends On | Purpose |
|---|---|---|
| SyncProfileTable | SyncSourceConnection | Source table catalog |
| SyncProfileColumn | SyncProfileTable | Column-level profile |
| SyncProfileTableStats | SyncProfileTable | Row counts, sizes |
| SyncProfileColumnStats | SyncProfileColumn | Value distributions |
| SyncProfileCode | SyncProfileColumn | Code/enum values |
| SyncProfileCodeCandidate | SyncProfileCode | Candidate mappings |
| SyncProfileView/Procedure/Function/Trigger/Constraint | SyncSourceConnection | DB object catalog |

### Layer 3: Sync Mapping Workbook
| Entity | Depends On | Purpose |
|---|---|---|
| SyncMappingWorkbook | SyncSourceConnection | Mapping definition |
| SyncMappingColumn | SyncMappingWorkbook | Column-level mapping |
| SyncMappingCodeValue | SyncMappingColumn | Code value translation |
| SyncCountyActiveWorkbook | SyncMappingWorkbook | Active workbook per county |

### Layer 4: Sync Bridge
| Entity | Depends On | Purpose |
|---|---|---|
| SourceXref | LoadBatch | Cross-reference source→canonical IDs |
| FieldAuthority | — | Field ownership registry |
| LoadBatch | SyncBatch | Load batch tracking |
| DiffLedger | LoadBatch | Change detection ledger |
| ConflictQueue | DiffLedger | Conflict resolution queue |
| WritebackJournal | LoadBatch | Writeback tracking |
| RollbackPackage | LoadBatch | Rollback capability |
| PromotionGateResult | LoadBatch | Gate check results |

### Layer 5: Legacy Raw Landing
| Entity | Source | Depends On |
|---|---|---|
| LegacyPacsRawSale | pacs_oltp/pacs_golive | SyncBatch |
| LegacyPacsRawPropSuppAssoc | pacs_oltp | SyncBatch |
| LegacyPacsRawProperty | pacs_oltp | SyncBatch |
| LegacyPacsRawPropertyVal | pacs_oltp | SyncBatch |
| LegacyPacsRawAccount | pacs_oltp | SyncBatch |
| LegacyPacsRawOwner | pacs_oltp | SyncBatch |
| LegacyPacsRawImprv | pacs_oltp | SyncBatch |
| LegacyPacsRawImprvDetail | pacs_oltp | SyncBatch |
| LegacyPacsRawImprvAttr | pacs_oltp | SyncBatch |
| LegacyPacsRawLandDetail | pacs_oltp | SyncBatch |
| LegacyPacsRawWashPropOwnerVal | pacs_oltp | SyncBatch |
| LegacyArcGisRawParcelGeom | ArcGIS | SyncBatch |

### Layer 6: Doctrine Rules
| Entity | Depends On | Purpose |
|---|---|---|
| TfDoctrineRatioPolicy | — | Sale ratio qualification rules |
| TfDoctrineSalesQualificationCode | — | Sales qual code definitions |
| TfDoctrinePropertyUniverse | — | Property universe classification |
| TfDoctrineAttributeDictionary | — | Attribute code translation |

### Layer 7: Truth Layer
| Entity | Depends On | Purpose |
|---|---|---|
| TruthPacsSale | LegacyPacsRawSale + Doctrine | Promoted sales |
| TruthPacsOwnerCurrent | LegacyPacsRawOwner | Promoted owners |
| TruthPacsWashPropOwnerVal | LegacyPacsRawWashPropOwnerVal | Promoted WA vals |
| TruthPacsImprvCurrent | LegacyPacsRawImprv + PropertyVal + LandDetail + Doctrine | Promoted improvements |
| TruthPacsLandCurrent | LegacyPacsRawLandDetail | Promoted land |
| TruthPacsParcelSpine | LegacyPacsRawProperty | Parcel spine |
| TruthArcGisParcelGeomCurrent | LegacyArcGisRawParcelGeom | Promoted geometries |

### Layer 8: Canonical TF
| Entity | Depends On | Purpose |
|---|---|---|
| TfParcel | TruthPacsParcelSpine + SourceXref | Canonical parcels |
| TfOwner | TruthPacsOwnerCurrent + SourceXref | Canonical owners |
| TfParcelOwnerLink | TfParcel + TfOwner | Owner-parcel links |
| TfSale | TruthPacsSale + SourceXref + CanonicalSaleQualification | Canonical sales |
| TfImprovement | TruthPacsImprvCurrent + SourceXref | Canonical improvements |
| TfImprovementFeature | TruthPacsImprvCurrent + AttributeDefinition | Features |
| TfLand | TruthPacsLandCurrent + SourceXref | Canonical land |
| TfAssessmentWsdor | TruthPacsWashPropOwnerVal + SourceXref | WSDOR assessments |
| TfParcelGeom | TruthArcGisParcelGeomCurrent + SourceXref | Canonical geometries |

### Unproven Layer (deprecated/transitional)
| Entity | Purpose |
|---|---|
| LegacyTfUnproven* (7 entities) | Pre-doctrine data before truth promotion |
| UnprovenImprvAttrTriage | Attribute triage queue |

## Sync Runtime Dependencies on DB State

1. **Doctrine rules must be seeded** before drains produce meaningful truth rows. Without doctrine, the promoter cannot classify sales/improvements/land.
2. **SourceXref must be populated** before canonical projection. The projector uses SourceXref to map legacy keys to canonical IDs.
3. **AttributeDefinition and dictionaries** must be populated for improvement feature resolution. Without them, features go to quarantine.
4. **SyncSourceConnection** must exist with valid PACS credentials for any drain to execute.
5. **SyncWatermark** tracks drain progress; loss of watermark state forces full re-drain.

## Cross-Domain Dependencies

| Consumer Domain | Depends On | Dependency Type |
|---|---|---|
| TerraForge (ComparableSale, CostMatrix) | TfSale, TfImprovement, TfLand | Read canonical data |
| TerraForge (CalibrationWorkbench) | TfParcel, TfImprovement, TfSale | Read canonical data |
| TerraDais (Appeal, Workflow) | Property, TfParcel | Read core + canonical |
| TerraDossier (Documents) | Property, TfParcel | Read core |
| TerraAtlas (GIS) | TfParcelGeom, TfParcel | Read canonical + GIS |
| Levy (Districts, Rates) | County, Property | Read core |
| CurrentUse (Classifications) | Property (parcel reference) | Read core |

## PACS Connection Architecture

```
TerraFusion PostgreSQL          Harris PACS MSSQL
(terrafusion / terrafusion_production)   (pacs_oltp + pacs_golive)
        ▲                                       │
        │                                       │
        │    Drain endpoints (POST)             │
        │    ── parcel drain ──────────────────►│
        │    ── owner drain ───────────────────►│
        │    ── improvement drain ─────────────►│
        │    ── land drain ────────────────────►│
        │    ── sales drain ───────────────────►│
        │    ── geometry drain ────────────────►│
        │                                       │
        └── writes to legacy_pacs_raw.* ────────┘
            then promotes to truth_pacs.*
            then projects to canonical_tf.*
```

## Sync Documentation (30+ docs in docs/sync/)

Extensive documentation exists covering:
- Atlas profiles, attribute drains, dictionary loaders
- Doctrine status/closure findings
- Mapping workbook policies
- Land/improvement review CSV policies
- Chunk strategy, dashboard findings
- Sales qualification coverage baseline
- Benton PACS catalog health baseline
