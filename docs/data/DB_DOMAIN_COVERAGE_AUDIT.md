# DB Domain Coverage Audit

**Work Order:** WO-DATA-000
**Date:** 2026-06-13
**Type:** READ-ONLY audit (source-code analysis only)

---

## Entity Count by Domain

**Total:** 219 entity types registered in TerraFusionDbContext + 4 in CurrentUseDbContext + 8 in LevyDbContext = **231 total**.

## Domain Breakdown (TerraFusionDbContext)

### OS Core — Government Foundation (14 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| Property | OS Core | Core parcel record |
| County | OS Core | County master |
| CountyDeployment | OS Core | Multi-county deployment |
| PropertyAssessment | OS Core | Assessment values |
| TaxLevy | OS Core | Tax levy records |
| GovernmentUser | OS Core | User accounts |
| AuditLog | OS Core | Audit trail |
| Module | OS Core | System modules |
| Valuation | OS Core | Valuation records |
| Notice | OS Core | Notices |
| TaxPayment | OS Core | Tax payments |
| TaxStatement | OS Core | Tax statements |
| TaxSale | OS Core | Tax sales |
| Exemption | OS Core | Exemptions |

### TerraForge — Valuation & Calibration (30 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| MatrixVersion | TerraForge | Cost matrix versions |
| RevalAreaEvidenceAge | TerraForge | Evidence age tracking |
| CalibrationMemo | TerraForge | Calibration notes |
| CalibrationFinding | TerraForge | Calibration findings |
| SaleRecord | TerraForge | Sale records |
| SaleComparableRecord | TerraForge | Comparable sales |
| OutlierExclusion | TerraForge | Outlier management |
| PropertyWorkbenchFlag | TerraForge | Workbench flags |
| ComparableSale | TerraForge | Comparable sale analysis |
| CostMatrix | TerraForge | Cost matrices |
| MarketAnalysis | TerraForge | Market analysis |
| RegressionAnalysis | TerraForge | Regression models |
| MonteCarloSimulation | TerraForge | Monte Carlo sims |
| BayesianAnalysis | TerraForge | Bayesian analysis |
| SpatialAnalysis | TerraForge | Spatial analysis |
| AdjustmentProposal | TerraForge | Adjustment proposals |
| AdjustmentRun | TerraForge | Adjustment runs |
| AdjustmentSet | TerraForge | Adjustment sets |
| CountyAdjustmentSet | TerraForge | County adjustments |
| CountyExceptionSet | TerraForge | County exceptions |
| CountyStudySession | TerraForge | Study sessions |
| CountyCohort | TerraForge | Study cohorts |
| CountySegment | TerraForge | Study segments |
| CountySegmentSet | TerraForge | Segment sets |
| CountyScenario | TerraForge | Scenarios |
| CountySpatialArtifact | TerraForge | Spatial artifacts |
| SalesAuditAdjustmentProposal | TerraForge | Sales audit adjustments |
| SaleAuditDiagnosis | TerraForge | Sale audit diagnosis |
| ParcelAdjustmentRecord | TerraForge | Parcel adjustments |
| CertificationStep | TerraForge | Certification steps |

### TerraDais — Workflow & Admin (16 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| Appeal | TerraDais | Appeal records |
| Workflow | TerraDais | Workflow definitions |
| WorkflowExecution | TerraDais | Workflow runs |
| QueueItem | TerraDais | Work queue items |
| CountyDownstreamClosureReceipt | TerraDais | Closure receipts |
| CountyApplyHandoffReceipt | TerraDais | Apply handoff receipts |
| PacsAppeal | TerraDais | PACS appeals |
| PacsExemption | TerraDais | PACS exemptions |
| DelinquencyRecord | TerraDais | Delinquency |
| InstallmentPlan | TerraDais | Payment plans |
| TitleChainEntry | TerraDais | Title chain |
| ValuationPipeline | TerraDais | Pipeline records |
| ValuationRecord | TerraDais | Valuation records |
| PilotDraft | TerraDais | Pilot drafts |
| RcwCalculation | TerraDais | RCW calculations |
| AnalysisResult | TerraDais | Analysis results |

### TerraDossier — Documents (5 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| DossierDocument | TerraDossier | Documents |
| DossierNote | TerraDossier | Notes |
| DossierEvidence | TerraDossier | Evidence items |
| DossierPacket | TerraDossier | Document packets |
| DossierPacketItem | TerraDossier | Packet items |
| DossierCustodyEvent | TerraDossier | Custody chain |

### TerraTrace — Audit Trail (2 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| AuditEvent | TerraTrace | Append-only events |
| SecurityEvent | TerraTrace | Security events |

### AI System (6 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| AIAgent | AI | Agent records |
| AIModel | AI | Model records |
| PerformanceMetric | AI | Performance data |
| GPTConfiguration | AI | GPT configs |
| GPTConversation | AI | GPT conversations |
| MlPrediction | AI | ML predictions |

### Marketplace (5 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| Plugin | Marketplace | Plugin records |
| PluginSubmission | Marketplace | Submissions |
| PluginInstallation | Marketplace | Installations |
| PluginRevenue | Marketplace | Revenue tracking |
| PluginAnalytics | Marketplace | Analytics |

### Security & Auth (4 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| UserSession | Security | Session tracking |
| PasswordHistory | Security | Password history |
| Permission | Security | Permissions |
| UserPermission | Security | User-permission links |

### Collaboration (10 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| CollaborationUser | Collaboration | Users |
| Team | Collaboration | Teams |
| TeamMember | Collaboration | Members |
| Project | Collaboration | Projects |
| ProjectParticipant | Collaboration | Participants |
| ProjectDocument | Collaboration | Documents |
| Task | Collaboration | Tasks |
| TaskComment | Collaboration | Comments |
| Milestone | Collaboration | Milestones |
| DocumentPermission | Collaboration | Permissions |
| CollaborationNotification | Collaboration | Notifications |

### Sync R3 Spine (4 entities)
| Entity | Write Lane | Sync |
|---|---|---|
| SyncBatch | Sync | Batch records |
| SyncRecord | Sync | Individual records |
| SyncWatermark | Sync | Watermark tracking |
| SyncQuarantine | Sync | Quarantine queue |

### Sync Source & Atlas (13 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| SyncSourceConnection | Sync | Source DB connections |
| SyncProfileTable | Sync | Atlas table profiles |
| SyncProfileColumn | Sync | Column profiles |
| SyncProfileView | Sync | View profiles |
| SyncProfileProcedure | Sync | Procedure profiles |
| SyncProfileFunction | Sync | Function profiles |
| SyncProfileTrigger | Sync | Trigger profiles |
| SyncProfileConstraint | Sync | Constraint profiles |
| SyncProfileCode | Sync | Code profiles |
| SyncProfileTableStats | Sync | Table stats |
| SyncProfileColumnStats | Sync | Column stats |
| SyncProfileCodeCandidate | Sync | Code candidates |
| SyncCountyActiveWorkbook | Sync | Active workbook |

### Sync Mapping (3 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| SyncMappingWorkbook | Sync | Mapping workbooks |
| SyncMappingColumn | Sync | Column mappings |
| SyncMappingCodeValue | Sync | Code value mappings |

### Sync Bridge v1 (8 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| SourceXref | Sync | Source cross-reference |
| FieldAuthority | Sync | Field authority registry |
| LoadBatch | Sync | Load batch tracking |
| DiffLedger | Sync | Diff ledger |
| ConflictQueue | Sync | Conflict resolution |
| WritebackJournal | Sync | Writeback journal |
| RollbackPackage | Sync | Rollback packages |
| PromotionGateResult | Sync | Promotion gates |

### Canonical TF (17 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| TfParcel | Canonical | Canonical parcels |
| TfOwner | Canonical | Canonical owners |
| TfParcelOwnerLink | Canonical | Parcel-owner links |
| TfSale | Canonical | Canonical sales |
| TfImprovement | Canonical | Improvements |
| TfImprovementFeature | Canonical | Improvement features |
| TfLand | Canonical | Land records |
| TfAssessmentWsdor | Canonical | WSDOR assessments |
| CanonicalSaleQualification | Canonical | Sale qualifications |
| AttributeDefinition | Canonical | Attribute definitions |
| DictExemptionType | Canonical | Exemption type dict |
| DictImprvState | Canonical | Improvement state dict |
| DictImprvType | Canonical | Improvement type dict |
| DictLandState | Canonical | Land state dict |
| DictLandUse | Canonical | Land use dict |
| DictNeighborhood | Canonical | Neighborhood dict |
| DictSitusLegal | Canonical | Situs/legal dict |

### Doctrine TF (4 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| TfDoctrineRatioPolicy | Doctrine | Ratio policy rules |
| TfDoctrineSalesQualificationCode | Doctrine | Sales qual codes |
| TfDoctrinePropertyUniverse | Doctrine | Property universe rules |
| TfDoctrineAttributeDictionary | Doctrine | Attribute dict rules |

### Legacy PACS Raw (12 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| LegacyPacsRawSale | Sync/Landing | Raw PACS sales |
| LegacyPacsRawPropSuppAssoc | Sync/Landing | Prop-supp associations |
| LegacyPacsRawProperty | Sync/Landing | Raw PACS properties |
| LegacyPacsRawPropertyVal | Sync/Landing | Property valuations |
| LegacyPacsRawAccount | Sync/Landing | Accounts |
| LegacyPacsRawOwner | Sync/Landing | Owners |
| LegacyPacsRawImprv | Sync/Landing | Improvements |
| LegacyPacsRawImprvDetail | Sync/Landing | Improvement details |
| LegacyPacsRawImprvAttr | Sync/Landing | Improvement attributes |
| LegacyPacsRawLandDetail | Sync/Landing | Land details |
| LegacyPacsRawWashPropOwnerVal | Sync/Landing | WA prop owner vals |
| LegacyArcGisRawParcelGeom | Sync/Landing | ArcGIS geometries |

### Truth Layer (7 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| TruthPacsSale | Sync/Truth | Promoted sales |
| TruthPacsOwnerCurrent | Sync/Truth | Promoted owners |
| TruthPacsWashPropOwnerVal | Sync/Truth | Promoted WA vals |
| TruthPacsImprvCurrent | Sync/Truth | Promoted improvements |
| TruthPacsLandCurrent | Sync/Truth | Promoted land |
| TruthPacsParcelSpine | Sync/Truth | Parcel spine |
| TruthArcGisParcelGeomCurrent | Sync/Truth | Promoted geometries |

### GIS (1 entity)
| Entity | Write Lane | Notes |
|---|---|---|
| TfParcelGeom | GIS | Canonical geometries |

### Legacy TF Unproven (7 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| LegacyTfUnprovenSale | Sync/Unproven | Unproven sales |
| LegacyTfUnprovenOwnerCurrent | Sync/Unproven | Unproven owners |
| LegacyTfUnprovenImprvCurrent | Sync/Unproven | Unproven improvements |
| LegacyTfUnprovenImprvAttr | Sync/Unproven | Unproven imprv attrs |
| LegacyTfUnprovenLandCurrent | Sync/Unproven | Unproven land |
| LegacyTfUnprovenWashPropOwnerVal | Sync/Unproven | Unproven WA vals |
| UnprovenImprvAttrTriage | Sync/Unproven | Attr triage |

### Workbench (4 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| FullCorpusRun | Workbench | Corpus run tracking |
| FullCorpusLaneResult | Workbench | Lane results |
| FullCorpusReconciliation | Workbench | Reconciliation |
| WorkbenchCommit | Workbench | Commit records |
| WorkbenchCommitDecisionLink | Workbench | Decision links |

### PACS Integration (18 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| PacsImprovement | PACS | PACS improvements |
| PacsImprovementAttribute | PACS | PACS imprv attrs |
| PacsImprovementDetail | PACS | PACS imprv details |
| PacsLandDetail | PACS | PACS land details |
| PacsOwner | PACS | PACS owners |
| PacsOwnerVal | PACS | PACS owner vals |
| PacsParcel | PACS | PACS parcels |
| PacsPropertyProfile | PACS | PACS prop profiles |
| PacsSale | PACS | PACS sales |
| PacsSitus | PACS | PACS situs |
| PacsValuation | PACS | PACS valuations |
| PacsTaxArea | PACS | PACS tax areas |
| PacsTaxAreaAssoc | PACS | Tax area assocs |
| PacsReetWacCode | PACS | REET/WAC codes |
| PacsLevyRate | PACS | PACS levy rates |
| PacsLevyTaxAreaAssoc | PACS | Levy tax area assocs |
| PacsLevyCertificationData | PACS | Levy cert data |
| PacsLevyCertificationHighestLawful | PACS | Highest lawful |
| PacsLevyCertificationConstitutionalLimit | PACS | Constitutional limits |
| PacsLevyCertificationAggregateLimit | PACS | Aggregate limits |

### Experiments (2 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| Experiment | Dev | Experiments |
| ExperimentRun | Dev | Experiment runs |

### Misc (9 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| Workflow | OS Core | Workflow definitions |
| WorkflowExecution | OS Core | Workflow runs |
| NotificationPreferences | OS Core | User prefs |
| DataQualityAssessment | OS Core | Data quality |
| EtlSyncJob | Sync | ETL jobs |
| QuantumNotebook | AI | Quantum notebooks |
| SaleRatioType | Forge | Sale ratio types |
| SlFinancing | Forge | SL financing |
| DeedType | OS Core | Deed types |
| CountyRatioCode | Forge | County ratio codes |

### Codex/Herald (3 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| CodexScore | AI | Codex scores |
| CodexMetric | AI | Codex metrics |
| CodexAlert | AI | Codex alerts |
| CodexUltimatePower | AI | Codex power |
| AuditFinding | Security | Audit findings |
| AuditReconciliation | Security | Audit recon |

### Clerk (2 entities)
| Entity | Write Lane | Notes |
|---|---|---|
| ClerkDocument | TerraDais | Clerk documents |
| ClerkLien | TerraDais | Clerk liens |

## CurrentUseDbContext (4 entities)
| Entity | Schema | Notes |
|---|---|---|
| Classification | currentuse | Current use classifications |
| InterestRate | currentuse | Interest rates |
| Removal | currentuse | Current use removals |
| CurrentUseAuditEntry | currentuse | Audit trail |

## LevyDbContext (8 entities)
| Entity | Schema | Notes |
|---|---|---|
| District | levy | Tax districts |
| LevyMeasure | levy | Levy measures |
| LevyScenario | levy | Scenarios |
| RevenueProjection | levy | Revenue projections |
| LevyRate | levy | Levy rates |
| DistrictParcel | levy | District-parcel links |
| ReferenceSource | levy | Reference inputs |
| LevyCertification | levy | Certifications |
| BankedCapacity | levy | Banked capacity |

## CountyId Coverage (Source Analysis)

CountyId filtering is referenced in CLAUDE.md as mandatory (`p.CountyId == currentUser.CountyId`). Without a live DB query, the actual CountyId population cannot be verified. The `DefaultCounty.Id` in dev config is `19190019-1919-1919-1919-191919191919`.

**Entities with likely CountyId columns** (from entity naming and PACS integration patterns):
- Property, County, CountyDeployment — explicitly county-scoped
- All PACS entities — implicitly Benton-only in current deployment
- Sync entities — county-scoped via SyncSourceConnection
- Canonical TF entities — county-scoped via TfParcel.CountyId

**Risk:** Entities in Collaboration, AI, Marketplace, and Experiments domains may lack CountyId columns entirely, creating potential cross-county data leakage in a multi-county deployment.

## Constitutional Write-Lane Compliance

Per AGENTS.md and the Suite Constitution:
- **OS Core** owns parcel/ownership — mapped above
- **TerraForge** owns valuation — mapped above
- **TerraAtlas** owns GIS — TfParcelGeom + GisParcelGeometry
- **TerraDais** owns workflow/admin — mapped above
- **TerraDossier** owns documents — mapped above
- **TerraTrace** owns append-only trace events — AuditEvent, SecurityEvent

**Gap:** Several entities don't clearly map to a constitutional write lane (Experiments, Collaboration, Marketplace, Codex/Herald, QuantumNotebook). These are likely OS Core or unconstrained domains.
