using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Pacs;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Core.Models;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data.Configurations;
using TerraFusion.Data.Configurations.Sync;
using TerraFusion.Data.Configurations.Sync.Mapping;
using TerraFusion.Data.Configurations.Sync.Profile;
// NOTE: TerraFusion.AI.Entities cannot be referenced here due to circular dependency
// AI-specific DbSets are added via partial class or extension in TerraFusion.AI project

namespace TerraFusion.Data;

public class TerraFusionDbContext : DbContext, ITerraFusionDbContext
{
  private readonly IConfiguration _configuration;

  public TerraFusionDbContext(DbContextOptions<TerraFusionDbContext> options, IConfiguration configuration)
      : base(options)
  {
    _configuration = configuration;
  }

  // Core Government Entities
  public DbSet<Property> Properties { get; set; }
  public DbSet<County> Counties { get; set; }
  public DbSet<CountyDeployment> CountyDeployments { get; set; }
  public DbSet<PropertyAssessment> PropertyAssessments { get; set; }
  public DbSet<TaxLevy> TaxLevies { get; set; }
  public DbSet<GovernmentUser> GovernmentUsers { get; set; }
  public DbSet<AuditLog> AuditLogs { get; set; }

  // AI System Entities
  public DbSet<AIAgent> AIAgents { get; set; }
  public DbSet<AIModel> AIModels { get; set; }
  public DbSet<PerformanceMetric> PerformanceMetrics { get; set; }

  // GPT Core Entities (TerraFusion.Core.Entities — no circular dep)
  public DbSet<GPTConfiguration> GPTConfigurations { get; set; }
  public DbSet<GPTConversation> GPTConversations { get; set; }

  // GPT/RAG AI Entities (TerraFusion.AI.Entities — registered via OnModelCreatingExtensions
  // hook to avoid circular dependency Data → AI → Data).
  // Extension method: TerraFusion.AI.Data.GptAiEntityConfigurations.Apply(ModelBuilder, string?)
  // Wire in Program.cs: TerraFusionDbContext.OnModelCreatingExtensions = GptAiEntityConfigurations.Apply;
  // The second parameter receives Database.ProviderName so vector-specific type mapping
  // is skipped for non-Postgres providers (e.g. InMemory used in unit tests).
  public static Action<ModelBuilder, string?>? OnModelCreatingExtensions { get; set; }

  // Module System Entities
  public DbSet<Module> Modules { get; set; }
  public DbSet<Valuation> Valuations { get; set; }

  // Marketplace Entities
  public DbSet<Plugin> Plugins { get; set; }
  public DbSet<PluginSubmission> PluginSubmissions { get; set; }
  public DbSet<PluginInstallation> PluginInstallations { get; set; }
  public DbSet<PluginRevenue> PluginRevenue { get; set; }
  public DbSet<PluginAnalytics> PluginAnalytics { get; set; }

  // Calibration Workbench Entities
  public DbSet<MatrixVersion> MatrixVersions { get; set; }
  public DbSet<RevalAreaEvidenceAge> RevalAreaEvidenceAges { get; set; }
  public DbSet<CalibrationMemo> CalibrationMemos { get; set; }
  public DbSet<CalibrationFinding> CalibrationFindings { get; set; }
  public DbSet<SaleRecord> SaleRecords { get; set; }
  public DbSet<SaleComparableRecord> SaleComparableRecords { get; set; }
  public DbSet<OutlierExclusion> OutlierExclusions { get; set; }
  public DbSet<PropertyWorkbenchFlag> PropertyWorkbenchFlags { get; set; }

  // Security Entities
  public DbSet<SecurityEvent> SecurityEvents { get; set; }
  public DbSet<UserSession> UserSessions { get; set; }
  public DbSet<PasswordHistory> PasswordHistories { get; set; }

  // Collaboration Entities
  public DbSet<CollaborationUser> CollaborationUsers { get; set; }
  public DbSet<Team> Teams { get; set; }
  public DbSet<TeamMember> TeamMembers { get; set; }
  public DbSet<Project> Projects { get; set; }
  public DbSet<ProjectParticipant> ProjectParticipants { get; set; }
  public DbSet<ProjectDocument> ProjectDocuments { get; set; }
  public DbSet<TerraFusion.Core.Entities.Task> Tasks { get; set; }
  public DbSet<TaskComment> TaskComments { get; set; }
  public DbSet<Milestone> Milestones { get; set; }
  public DbSet<DocumentPermission> DocumentPermissions { get; set; }
  public DbSet<CollaborationNotification> CollaborationNotifications { get; set; }
  public DbSet<AuditEvent> AuditEvents { get; set; }
  public DbSet<Permission> Permissions { get; set; }
  public DbSet<UserPermission> UserPermissions { get; set; }

  // R3 Sync Spine — durable PACS-to-TerraFusion bridge audit trail
  public DbSet<SyncBatch> SyncBatches { get; set; }
  public DbSet<SyncRecord> SyncRecords { get; set; }
  public DbSet<SyncWatermark> SyncWatermarks { get; set; }
  public DbSet<SyncQuarantine> SyncQuarantine { get; set; }

  // R3 Sync Source Connections — operator-defined connection profiles (no plaintext passwords)
  public DbSet<SyncSourceConnection> SyncSourceConnections { get; set; }

  // R3 Sync Canonical Landing Schema — TerraFusion-canonical entities populated by Sync ingest
  public DbSet<Owner> Owners { get; set; }
  public DbSet<OwnershipEvent> OwnershipEvents { get; set; }
  public DbSet<LandSegment> LandSegments { get; set; }
  public DbSet<ImprovementDetail> ImprovementDetails { get; set; }

  // R3 Sync Database Atlas — read-only metadata profile output (Slice B1)
  public DbSet<SyncProfileTable> SyncProfileTables { get; set; }
  public DbSet<SyncProfileColumn> SyncProfileColumns { get; set; }
  public DbSet<SyncProfileView> SyncProfileViews { get; set; }
  public DbSet<SyncProfileProcedure> SyncProfileProcedures { get; set; }
  public DbSet<SyncProfileFunction> SyncProfileFunctions { get; set; }
  public DbSet<SyncProfileTrigger> SyncProfileTriggers { get; set; }
  public DbSet<SyncProfileConstraint> SyncProfileConstraints { get; set; }
  public DbSet<SyncProfileCode> SyncProfileCodes { get; set; }

  // R3 Sync Data Profile — deep-profile statistics output (Slice B2)
  // (Sample-based row counts, null %, distinct counts, top values,
  //  code-table candidate detection.)
  public DbSet<SyncProfileTableStats> SyncProfileTableStats { get; set; }
  public DbSet<SyncProfileColumnStats> SyncProfileColumnStats { get; set; }
  public DbSet<SyncProfileCodeCandidate> SyncProfileCodeCandidates { get; set; }

  // R3 Sync Mapping Workbook — county-scoped canonical-mapping decisions
  // seeded off a B2 deep-profile batch (Slice C2). Stores reviewable
  // decisions only; transforms that consume them are Slice C3+.
  public DbSet<SyncMappingWorkbook> SyncMappingWorkbooks { get; set; }
  public DbSet<SyncMappingColumn> SyncMappingColumns { get; set; }
  public DbSet<SyncMappingCodeValue> SyncMappingCodeValues { get; set; }

  // Slice C35-B: first canonical landing table (sales-qualification
  // decisions written by the C36 SalesQualificationTransform from a
  // locked Mapping Workbook). See
  // docs/sync/canonical-sales-qualification-landing-schema-policy.md
  // for the full contract.
  public DbSet<TerraFusion.Core.Entities.Canonical.CanonicalSaleQualification>
    CanonicalSaleQualifications { get; set; } = null!;

  // ── Sync Bridge v1 (PACS source-provenance doctrine) ────────────────
  // Per docs/pacs/pacs-sync-bridge-v1-spec.md. The control tower for
  // every PACS → TerraFusion ingest. v1 = scaffolding only; ingest
  // wires up in a follow-up slice.
  public DbSet<TerraFusion.Core.Entities.CanonicalTf.TfParcel>
    TfParcels { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.SourceXref>
    SyncBridgeSourceXrefs { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.FieldAuthority>
    SyncBridgeFieldAuthorities { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.LoadBatch>
    SyncBridgeLoadBatches { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.DiffLedger>
    SyncBridgeDiffLedger { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.ConflictQueue>
    SyncBridgeConflictQueue { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.WritebackJournal>
    SyncBridgeWritebackJournal { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.RollbackPackage>
    SyncBridgeRollbackPackages { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.SyncBridge.PromotionGateResult>
    SyncBridgePromotionGateResults { get; set; } = null!;

  // ── GIS canonical mesh (Slice G1-A) ─────────────────────────────────
  // Per docs/plans/terrafusion-90-day-execution-plan.md §4 Block D.
  // Parcel polygons sourced from county ArcGIS REST feature services;
  // no shapefile parsing. v1 lands the schema only — adapter and
  // source_xref wiring follow in G1-B/G1-C.
  public DbSet<TerraFusion.Core.Entities.GisTf.TfParcelGeom>
    TfParcelGeoms { get; set; } = null!;

  // ── Legacy PACS raw landing (Slice S1) ──────────────────────────────
  // Per docs/plans/terrafusion-90-day-execution-plan.md §4 Block A.
  // First-stop landing zone for PACS sale rows. Provenance-required
  // (LoadBatchId + SourceQueryHash). Canonical promotion is a future
  // slice (truth_pacs.sale → canonical_tf.tf_sale).
  public DbSet<TerraFusion.Core.Entities.LegacyPacsRaw.LegacyPacsRawSale>
    LegacyPacsRawSales { get; set; } = null!;

  // Slice S2-A: prop_supp_assoc landing — the supp-aware-join
  // pointer required by the truth_pacs.sale promoter (S2-B).
  public DbSet<TerraFusion.Core.Entities.LegacyPacsRaw.LegacyPacsRawPropSuppAssoc>
    LegacyPacsRawPropSuppAssocs { get; set; } = null!;

  // Slice B1-A: account landing — the global party/entity identity
  // record with the rich PII surface. Block B's first stop.
  public DbSet<TerraFusion.Core.Entities.LegacyPacsRaw.LegacyPacsRawAccount>
    LegacyPacsRawAccounts { get; set; } = null!;

  // Slice B1-B: owner landing — the 4-key year-versioned link
  // between property and account. Required by the truth_pacs.owner
  // promoter (B2-A).
  public DbSet<TerraFusion.Core.Entities.LegacyPacsRaw.LegacyPacsRawOwner>
    LegacyPacsRawOwners { get; set; } = null!;

  // Slice B1-C: wash_prop_owner_val landing — WSDOR-grade per-owner
  // valuation snapshot. Required by the truth_pacs.wash_prop_owner_val
  // promoter (B2-B).
  public DbSet<TerraFusion.Core.Entities.LegacyPacsRaw.LegacyPacsRawWashPropOwnerVal>
    LegacyPacsRawWashPropOwnerVals { get; set; } = null!;

  // Slice S2-B: truth_pacs.sale — supp-aware-validated,
  // qualification-filtered ('100' only) projection of the raw layer.
  // Stepping stone toward canonical_tf.tf_sale (S3).
  public DbSet<TerraFusion.Core.Entities.TruthPacs.TruthPacsSale>
    TruthPacsSales { get; set; } = null!;

  // Slice B2-A: truth_pacs.owner_current — supp-aware-validated
  // current owner snapshot per (prop_id, owner_tax_yr) joined to
  // account. Stepping stone toward canonical_tf.tf_owner (B3).
  public DbSet<TerraFusion.Core.Entities.TruthPacs.TruthPacsOwnerCurrent>
    TruthPacsOwnerCurrents { get; set; } = null!;

  // Slice S3: canonical_tf.tf_sale — TerraFusion-native sale identity
  // backed by sync_bridge.source_xref lineage. Sales whose parcel
  // cannot be resolved are quarantined to legacy_tf_unproven.sale.
  public DbSet<TerraFusion.Core.Entities.CanonicalTf.TfSale>
    TfSales { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.LegacyTfUnproven.LegacyTfUnprovenSale>
    LegacyTfUnprovenSales { get; set; } = null!;

  // Slice B3: canonical_tf.tf_owner + tf_parcel_owner_link with PII
  // redaction at projection. Owners whose parcel cannot be resolved
  // are quarantined to legacy_tf_unproven.owner_current.
  public DbSet<TerraFusion.Core.Entities.CanonicalTf.TfOwner>
    TfOwners { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.CanonicalTf.TfParcelOwnerLink>
    TfParcelOwnerLinks { get; set; } = null!;
  public DbSet<TerraFusion.Core.Entities.LegacyTfUnproven.LegacyTfUnprovenOwnerCurrent>
    LegacyTfUnprovenOwnerCurrents { get; set; } = null!;

  // Slice C41-B: per-county pointer naming the operator-active
  // Mapped workbook. Singleton per county (PK = CountyId). See
  // docs/sync/sync-county-active-workbook-pointer-policy.md for the
  // full contract.
  public DbSet<TerraFusion.Core.Entities.Sync.SyncCountyActiveWorkbook>
    SyncCountyActiveWorkbooks { get; set; } = null!;

  // Codex 3-6-9 Framework Entities
  public DbSet<CodexMetric> CodexMetrics { get; set; }
  public DbSet<CodexScore> CodexScores { get; set; }
  public DbSet<CodexUltimatePower> CodexUltimatePowerRecords { get; set; }
  public DbSet<CodexAlert> CodexAlerts { get; set; }
  public DbSet<NotificationPreferences> NotificationPreferences { get; set; }

  // Experiments
  // Persisted here to keep experiments in the canonical data store. Keep model simple to avoid circular deps.
  public DbSet<TerraFusion.Data.Entities.Experiment> Experiments { get; set; }
  public DbSet<TerraFusion.Data.Entities.ExperimentRun> ExperimentRuns { get; set; }

  // Dossier Entities (R1 Week 3 — CX-11)
  public DbSet<DossierNote> DossierNotes { get; set; }

  // Forge Valuation (R2 Wave 25)
  public DbSet<ValuationRecord> ValuationRecords { get; set; }
  public DbSet<ComparableSale> ComparableSales { get; set; }
  public DbSet<CamaCharacteristic> CamaCharacteristics { get; set; }   public DbSet<CamaImprovementDetail> CamaImprovementDetails { get; set; }  public DbSet<CostMatrix> CostMatrices { get; set; }

  // PACS Lookup Tables (R2 Wave 38 — FK-aware qualification)
  // Mirrors dbo.sale_ratio_type, dbo.county_ratio_code, dbo.sl_financing, dbo.deed_type
  public DbSet<SaleRatioType> SaleRatioTypes { get; set; }
  public DbSet<CountyRatioCode> CountyRatioCodes { get; set; }
  public DbSet<SlFinancing> SlFinancings { get; set; }
  public DbSet<DeedType> DeedTypes { get; set; }

  // PACS Lookup Tables (R2 Slice 1.1 — WAC code lookup)
  // Mirrors dbo.reet_wac_code: WAC 458-61A REET exemption codes.
  public DbSet<PacsReetWacCode> ReetWacCodes { get; set; } = null!;

  // PACS Levy Tables (R2 Phase 2.1 — TerraLevy levy rate lookup)
  // Mirrors dbo.levy (levy rates per $1,000 AV) and
  // dbo.tax_area_fund_assoc JOIN dbo.tax_area (which levies apply per tax area).
  public DbSet<PacsLevyRate> PacsLevyRates { get; set; } = null!;
  public DbSet<PacsLevyTaxAreaAssoc> PacsLevyTaxAreaAssocs { get; set; } = null!;
  public DbSet<PacsLevyCertificationData> PacsLevyCertificationData { get; set; } = null!;
  public DbSet<PacsLevyCertificationHighestLawful> PacsLevyCertificationHighestLawful { get; set; } = null!;
  public DbSet<PacsLevyCertificationConstitutionalLimit> PacsLevyCertificationConstitutionalLimits { get; set; } = null!;
  public DbSet<PacsLevyCertificationAggregateLimit> PacsLevyCertificationAggregateLimits { get; set; } = null!;

  // Forge Analytics (R2 Wave 26)
  public DbSet<RegressionAnalysis> RegressionAnalyses { get; set; }

  // Forge Analytics (R2 Wave 27)
  public DbSet<BayesianAnalysis> BayesianAnalyses { get; set; }
  public DbSet<MonteCarloSimulation> MonteCarloSimulations { get; set; }

  // Forge Analytics (R2 Waves 28-35)
  public DbSet<SpatialAnalysis> SpatialAnalyses { get; set; }
  public DbSet<MarketAnalysis> MarketAnalyses { get; set; }
  public DbSet<RcwCalculation> RcwCalculations { get; set; }
  public DbSet<LevyCertification> LevyCertifications { get; set; }
  public DbSet<DataQualityAssessment> DataQualityAssessments { get; set; }
  public DbSet<EtlSyncJob> EtlSyncJobs { get; set; }
  public DbSet<MlPrediction> MlPredictions { get; set; }
  public DbSet<ValuationPipeline> ValuationPipelines { get; set; }

  // Dossier Document Management (R2 Wave 24)
  public DbSet<DossierDocument> DossierDocuments { get; set; }
  public DbSet<DossierEvidence> DossierEvidenceItems { get; set; }
  public DbSet<DossierCustodyEvent> DossierCustodyEvents { get; set; }
  public DbSet<DossierPacket> DossierPackets { get; set; }
  public DbSet<DossierPacketItem> DossierPacketItems { get; set; }

  // TerraFlow Quantum Command Center Entities (Phase 1 Week 3)
  public DbSet<QuantumNotebook> QuantumNotebooks { get; set; }
  public DbSet<AnalysisResult> AnalysisResults { get; set; }
  public DbSet<Workflow> Workflows { get; set; }
  public DbSet<WorkflowExecution> WorkflowExecutions { get; set; }

  // TerraClerk — County Clerk Recording (R3 CX)
  public DbSet<ClerkDocument> ClerkDocuments { get; set; }
  public DbSet<TitleChainEntry> TitleChainEntries { get; set; }
  public DbSet<ClerkLien> ClerkLiens { get; set; }

  // TerraTreasury — Tax Collection (R3 CX)
  public DbSet<TaxStatement> TaxStatements { get; set; }
  public DbSet<TaxPayment> TaxPayments { get; set; }
  public DbSet<DelinquencyRecord> DelinquencyRecords { get; set; }
  public DbSet<InstallmentPlan> InstallmentPlans { get; set; }
  public DbSet<TaxSale> TaxSales { get; set; }

  // TerraAudit — Roll Audit & Compliance (R3 CX)
  public DbSet<AuditFinding> AuditFindings { get; set; }
  public DbSet<AuditReconciliation> AuditReconciliations { get; set; }

  // Dais County Ops — Exemptions, Appeals, Certification, Notices, Queue (Phase 7)
  public DbSet<Exemption> Exemptions { get; set; } = null!;
  public DbSet<Appeal> Appeals { get; set; } = null!;
  public DbSet<CertificationStep> CertificationSteps { get; set; } = null!;
  public DbSet<Notice> Notices { get; set; } = null!;
  public DbSet<QueueItem> QueueItems { get; set; } = null!;

  // HITL Drafter — AI-proposed assessment actions awaiting human approval (Phase 10)
  public DbSet<PilotDraft> PilotDrafts { get; set; } = null!;

  // PACS Mirror — Harris PACS 9.0 data replicated to local store (Phase 33)
  // Source: tf-mssql pacs_oltp (89,247 Benton County parcels)
  public DbSet<PacsParcel> PacsParcel { get; set; } = null!;
  public DbSet<PacsPropertyProfile> PacsPropertyProfiles { get; set; } = null!;
  public DbSet<PacsSitus> PacsSituses { get; set; } = null!;
  public DbSet<PacsValuation> PacsValuations { get; set; } = null!;
  public DbSet<PacsImprovement> PacsImprovements { get; set; } = null!;
  public DbSet<PacsImprovementDetail> PacsImprovementDetails { get; set; } = null!;
  public DbSet<PacsImprovementAttribute> PacsImprovementAttributes { get; set; } = null!;
  public DbSet<PacsLandDetail> PacsLandDetails { get; set; } = null!;
  public DbSet<PacsOwner> PacsOwners { get; set; } = null!;
  public DbSet<PacsSale> PacsSales { get; set; } = null!;
  public DbSet<PacsExemption> PacsExemptions { get; set; } = null!;
  public DbSet<PacsAppeal> PacsAppeals { get; set; } = null!;
  public DbSet<PacsTaxArea> PacsTaxAreas { get; set; } = null!;
  public DbSet<PacsOwnerVal> PacsOwnerVals { get; set; } = null!;
  public DbSet<PacsTaxAreaAssoc> PacsTaxAreaAssocs { get; set; } = null!;

  // ArcGIS GIS Sync — Benton County ArcGIS FeatureServer geometry mirror
  // Sync engine is the only writer; populated by ArcGisSyncService (IHostedService).
  public DbSet<GisParcelGeometry> GisParcelGeometries { get; set; } = null!;

  // Sales Audit — AI-driven ratio study diagnostics and adjustment proposals (R2 Wave 40)
  // These are TerraFusion.Core entities: no circular dep with TerraFusion.Data.
  // Configurations are registered directly in OnModelCreating via SalesAuditEntityConfigurations.
  public DbSet<SaleAuditDiagnosis> SaleAuditDiagnoses { get; set; } = null!;
  public DbSet<SalesAuditAdjustmentProposal> SalesAuditAdjustmentProposals { get; set; } = null!;

  // GeoForge Adjustment Workbench — staged mass adjustment workflow with two-person integrity
  public DbSet<AdjustmentProposal> AdjustmentProposals { get; set; } = null!;
  public DbSet<AdjustmentSet> AdjustmentSets { get; set; } = null!;
  public DbSet<AdjustmentRun> AdjustmentRuns { get; set; } = null!;
  public DbSet<ParcelAdjustmentRecord> ParcelAdjustmentRecords { get; set; } = null!;

  // County Studio Entities — TerraForge countywide valuation workspace
  public DbSet<CountyStudySession> CountyStudySessions { get; set; } = null!;
  public DbSet<CountySegmentSet> CountySegmentSets { get; set; } = null!;
  public DbSet<CountySegment> CountySegments { get; set; } = null!;
  public DbSet<CountyCohort> CountyCohorts { get; set; } = null!;
  public DbSet<CountyScenario> CountyScenarios { get; set; } = null!;
  public DbSet<CountyAdjustmentSet> CountyAdjustmentSets { get; set; } = null!;
  public DbSet<CountyApplyHandoffReceipt> CountyApplyHandoffReceipts { get; set; } = null!;
  public DbSet<CountyExceptionSet> CountyExceptionSets { get; set; } = null!;
  public DbSet<CountyDownstreamClosureReceipt> CountyDownstreamClosureReceipts { get; set; } = null!;
  public DbSet<CountySpatialArtifact> CountySpatialArtifacts { get; set; } = null!;

  protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
  {
    if (!optionsBuilder.IsConfigured)
    {
      var connectionString = _configuration.GetConnectionString("DefaultConnection");

      if (connectionString?.Contains("Host=") == true)
      {
        // PostgreSQL for production
        optionsBuilder.UseNpgsql(connectionString, options =>
        {
          options.EnableRetryOnFailure(
                      maxRetryCount: 3,
                      maxRetryDelay: TimeSpan.FromSeconds(5),
                      errorCodesToAdd: null);
          options.CommandTimeout(30);
        });
      }
      else
      {
        // SQLite for development fallback
        optionsBuilder.UseSqlite(connectionString ?? "Data Source=terrafusion.db");
      }

      // Enable sensitive data logging only in development
      if (_configuration.GetValue<bool>("Logging:EnableSensitiveDataLogging", false))
      {
        optionsBuilder.EnableSensitiveDataLogging();
      }

      optionsBuilder.EnableDetailedErrors();
    }
  }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    // Configure Module entity
    modelBuilder.Entity<Module>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
      entity.HasIndex(e => e.Name).IsUnique(); // Prevent duplicate module names
    });

    // Configure Property entity
    modelBuilder.Entity<Property>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
      entity.Property(e => e.OwnerName).HasMaxLength(200);
      entity.Property(e => e.PropertyType).HasMaxLength(100);
      entity.Property(e => e.LegalDescription).HasMaxLength(2000);
      entity.Property(e => e.Neighborhood).HasMaxLength(10);
      entity.Property(e => e.PropertyUseCode).HasMaxLength(10);
      entity.Property(e => e.TaxDistrictCode).HasMaxLength(23);
      entity.Property(e => e.TaxDistrictName).HasMaxLength(255);
      entity.Property(e => e.SitusCity).HasMaxLength(30);
      entity.Property(e => e.SitusState).HasMaxLength(2);
      entity.Property(e => e.SitusZip).HasMaxLength(10);
      entity.Property(e => e.Zoning).HasMaxLength(50);
      entity.Property(e => e.AssessedValue).HasPrecision(18, 2);
      entity.Property(e => e.LandValue).HasPrecision(18, 2);
      entity.Property(e => e.ImprovementValue).HasPrecision(18, 2);
      entity.Property(e => e.MarketValue).HasPrecision(18, 2);
      entity.Property(e => e.LotWidthFront).HasPrecision(10, 2);
      entity.Property(e => e.LotDepth).HasPrecision(10, 2);
      entity.HasIndex(e => e.ParcelId).IsUnique();
      entity.HasIndex(e => e.CountyId);
    });

    // Configure County entity
    modelBuilder.Entity<County>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
      entity.Property(e => e.State).IsRequired().HasMaxLength(2);
      entity.Property(e => e.FipsCode).IsRequired().HasMaxLength(5);
      entity.HasIndex(e => e.FipsCode).IsUnique();
    });

    // Configure PropertyAssessment entity
    modelBuilder.Entity<PropertyAssessment>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.AssessedValue).HasPrecision(18, 2);
      entity.Property(e => e.MarketValue).HasPrecision(18, 2);
      entity.HasOne<Property>().WithMany().HasForeignKey(e => e.PropertyId);
      entity.HasIndex(e => new { e.PropertyId, e.AssessmentYear });
    });

    // Configure TaxLevy entity
    modelBuilder.Entity<TaxLevy>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.TaxRate).HasPrecision(8, 6);
      entity.Property(e => e.LevyAmount).HasPrecision(18, 2);
      entity.HasOne<County>().WithMany().HasForeignKey(e => e.CountyId);
    });

    // Configure DossierNote entity (R1 Week 3 — CX-11)
    modelBuilder.Entity<DossierNote>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
      entity.Property(e => e.NoteType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.CreatedBy).HasMaxLength(200);
      entity.HasOne(e => e.County).WithMany().HasForeignKey(e => e.CountyId);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
    });

    // Configure DossierDocument entity (R2 Wave 24)
    modelBuilder.Entity<DossierDocument>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
      entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
      entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
      entity.Property(e => e.ContentHash).HasMaxLength(64);
      entity.Property(e => e.StoragePath).HasMaxLength(500);
      entity.Property(e => e.Description).HasMaxLength(500);
      entity.Property(e => e.RetentionClass).HasMaxLength(50);
      entity.Property(e => e.UploadedBy).HasMaxLength(200);
      entity.HasOne(e => e.County).WithMany().HasForeignKey(e => e.CountyId);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
      entity.HasIndex(e => new { e.CountyId, e.DocumentType });
    });

    // Configure DossierEvidence entity (R2 Wave 24)
    modelBuilder.Entity<DossierEvidence>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
      entity.Property(e => e.EvidenceType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Integrity).IsRequired().HasMaxLength(20);
      entity.Property(e => e.CreatedBy).HasMaxLength(200);
      entity.HasOne(e => e.County).WithMany().HasForeignKey(e => e.CountyId);
      entity.HasOne(e => e.Document).WithMany().HasForeignKey(e => e.DocumentId).IsRequired(false);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
    });

    // Configure DossierCustodyEvent entity (R2 Wave 24)
    modelBuilder.Entity<DossierCustodyEvent>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Actor).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Hash).HasMaxLength(64);
      entity.Property(e => e.Notes).HasMaxLength(500);
      entity.HasOne(e => e.Evidence).WithMany().HasForeignKey(e => e.EvidenceId);
      entity.HasIndex(e => e.EvidenceId);
    });

    // Configure DossierPacket entity (R2 Wave 24)
    modelBuilder.Entity<DossierPacket>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.PacketType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
      entity.Property(e => e.CreatedBy).HasMaxLength(200);
      entity.HasOne(e => e.County).WithMany().HasForeignKey(e => e.CountyId);
      entity.HasMany(e => e.Items).WithOne(i => i.Packet).HasForeignKey(i => i.PacketId);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
    });

    // Configure DossierPacketItem entity (R2 Wave 24)
    modelBuilder.Entity<DossierPacketItem>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(50);
      entity.HasOne(e => e.Document).WithMany().HasForeignKey(e => e.DocumentId).IsRequired(false);
    });

    // Configure ValuationRecord entity (R2 Wave 25)
    modelBuilder.Entity<ValuationRecord>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.PropertyType).IsRequired().HasMaxLength(30);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
      entity.Property(e => e.CreatedBy).HasMaxLength(100);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId, e.TaxYear });
      entity.HasIndex(e => new { e.CountyId, e.Status });
    });

    // Configure ComparableSale entity (R2 Wave 25)
    modelBuilder.Entity<ComparableSale>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.PropertyType).IsRequired().HasMaxLength(30);
      entity.Property(e => e.QualificationRecommendation).HasMaxLength(30);
      entity.Property(e => e.QualificationDecision).HasMaxLength(30);
      entity.HasIndex(e => new { e.CountyId, e.PropertyType, e.SaleDate });
      entity.HasIndex(e => new { e.CountyId, e.Neighborhood });
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
      entity.HasIndex(e => new { e.CountyId, e.QualificationDecision, e.QualificationRecommendation });
    });

    // Configure CamaCharacteristic entity (R2 Wave 25)
    modelBuilder.Entity<CamaCharacteristic>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.BuildingType).IsRequired().HasMaxLength(10);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId, e.TaxYear }).IsUnique();
    });

    // Configure CostMatrix entity (R2 Wave 25)
    modelBuilder.Entity<CostMatrix>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Region).IsRequired().HasMaxLength(100);
      entity.Property(e => e.BuildingType).IsRequired().HasMaxLength(10);
      entity.HasIndex(e => new { e.CountyId, e.BuildingType, e.Region, e.MatrixYear });
    });

    // PACS Lookup Tables (R2 Wave 38 — FK-aware qualification)
    // Mirrors PACS dbo.sale_ratio_type: WA DOR-defined sale qualification codes.
    // invalid_sale=true means the code disqualifies the sale from ratio study.
    modelBuilder.Entity<SaleRatioType>(entity =>
    {
      entity.HasKey(e => e.SlRatioTypeCd);
      entity.Property(e => e.SlRatioTypeCd).IsRequired().HasMaxLength(10);
      entity.Property(e => e.SlRatioDesc).HasMaxLength(150);
      entity.ToTable("SaleRatioTypes");
    });

    // Mirrors PACS dbo.county_ratio_code: Benton County's own sale qualifier codes.
    modelBuilder.Entity<CountyRatioCode>(entity =>
    {
      entity.HasKey(e => e.RatioCd);
      entity.Property(e => e.RatioCd).IsRequired().HasMaxLength(10);
      entity.Property(e => e.RatioDesc).HasMaxLength(150);
      entity.ToTable("CountyRatioCodes");
    });

    // Mirrors PACS dbo.sl_financing: financing type codes.
    modelBuilder.Entity<SlFinancing>(entity =>
    {
      entity.HasKey(e => e.SlFinancingCd);
      entity.Property(e => e.SlFinancingCd).IsRequired().HasMaxLength(10);
      entity.Property(e => e.SlFinancingDesc).HasMaxLength(150);
      entity.ToTable("SlFinancings");
    });

    // Mirrors PACS dbo.deed_type: deed type codes with their DOR ratio type mapping.
    // SalesRatioTypeCd → SaleRatioType.SlRatioTypeCd (the critical cross-reference).
    modelBuilder.Entity<DeedType>(entity =>
    {
      entity.HasKey(e => new { e.CountyCd, e.DeedTypeCd });
      entity.Property(e => e.CountyCd).HasMaxLength(10);
      entity.Property(e => e.DeedTypeCd).IsRequired().HasMaxLength(10);
      entity.Property(e => e.DeedTypeDesc).HasMaxLength(150);
      entity.Property(e => e.SalesRatioTypeCd).HasMaxLength(10);
      entity.ToTable("DeedTypes");
    });

    // Mirrors PACS dbo.reet_wac_code: WAC 458-61A REET exemption codes (Slice 1.1).
    // inactive=true means the code is retired; treat sale as qualified (no active exemption).
    modelBuilder.Entity<PacsReetWacCode>(entity =>
    {
      entity.HasKey(e => e.WacCd);
      entity.Property(e => e.WacCd).IsRequired().HasMaxLength(100);
      entity.Property(e => e.WacDesc).HasMaxLength(500);
      entity.ToTable("ReetWacCodes");
    });

    // Configure GovernmentUser entity
    modelBuilder.Entity<GovernmentUser>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
      entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Department).HasMaxLength(100);
      entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
      entity.HasIndex(e => e.Email).IsUnique();
    });

    // Configure AuditLog entity
    modelBuilder.Entity<AuditLog>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Type).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Data).HasColumnType("TEXT");
      entity.Property(e => e.Timestamp).IsRequired();
      entity.Property(e => e.UserId).HasMaxLength(450);
      entity.Property(e => e.UserEmail).HasMaxLength(256);
      entity.Property(e => e.IpAddress).HasMaxLength(45);
      entity.Property(e => e.UserAgent).HasMaxLength(500);
      entity.Property(e => e.RequestPath).HasMaxLength(500);
      entity.Property(e => e.RequestMethod).HasMaxLength(10);
      entity.Property(e => e.CorrelationId).HasMaxLength(100);
      entity.Property(e => e.Severity).HasMaxLength(20);
      entity.Property(e => e.Source).HasMaxLength(100);
      entity.HasIndex(e => e.Timestamp);
      entity.HasIndex(e => e.Type);
      entity.HasIndex(e => e.UserId);
    });

    // Configure AIAgent entity
    modelBuilder.Entity<AIAgent>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
      entity.Property(e => e.Configuration).HasColumnType("jsonb");
      entity.HasIndex(e => e.Status);
    });

    // Configure SecurityEvent entity
    modelBuilder.Entity<SecurityEvent>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.EventType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
      entity.Property(e => e.Metadata).HasColumnType("jsonb");
      entity.HasIndex(e => e.Timestamp);
      entity.HasIndex(e => e.EventType);
    });

    // Configure PasswordHistory entity (Phase 4 Sprint 1)
    modelBuilder.Entity<PasswordHistory>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.UserId).IsRequired();
      entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
      entity.Property(e => e.CreatedAt).IsRequired();
      entity.HasIndex(e => new { e.UserId, e.CreatedAt })
              .HasDatabaseName("IX_PasswordHistory_UserId_CreatedAt");
      entity.HasOne(e => e.User)
              .WithMany()
              .HasForeignKey(e => e.UserId)
              .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<Plugin>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Version).IsRequired().HasMaxLength(20);
      entity.Property(e => e.Description).IsRequired();
      entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
      entity.Property(e => e.AuthorId).IsRequired();
      entity.Property(e => e.Status).IsRequired();
      entity.Property(e => e.SubmittedAt).IsRequired();

      entity.HasIndex(e => e.Name);
      entity.HasIndex(e => e.Category);
      entity.HasIndex(e => e.Status);
    });

    // Apply explicit EF Core configurations to resolve navigation ambiguity
    modelBuilder.ApplyConfiguration(new CollaborationUserConfiguration());
    modelBuilder.ApplyConfiguration(new TaskConfiguration());

    // CostForge Benton Method v2 — stratum query indexes (Track 0)
    modelBuilder.ApplyConfiguration(new CamaCharacteristicConfiguration());

    // Apply Codex 3-6-9 Framework configurations
    modelBuilder.ApplyConfiguration(new CodexMetricConfiguration());
    modelBuilder.ApplyConfiguration(new CodexScoreConfiguration());
    modelBuilder.ApplyConfiguration(new CodexUltimatePowerConfiguration());
    modelBuilder.ApplyConfiguration(new CodexAlertConfiguration());

    // Apply TerraFlow Quantum Command Center configurations (Phase 1 Week 3)
    modelBuilder.ApplyConfiguration(new QuantumNotebookConfiguration());
    modelBuilder.ApplyConfiguration(new AnalysisResultConfiguration());
    modelBuilder.ApplyConfiguration(new WorkflowConfiguration());
    modelBuilder.ApplyConfiguration(new WorkflowExecutionConfiguration());
    modelBuilder.ApplyConfiguration(new ExemptionConfiguration());
    modelBuilder.ApplyConfiguration(new AppealConfiguration());
    modelBuilder.ApplyConfiguration(new CertificationStepConfiguration());
    modelBuilder.ApplyConfiguration(new NoticeConfiguration());
    modelBuilder.ApplyConfiguration(new QueueItemConfiguration());

    // R3 Sync Spine
    modelBuilder.ApplyConfiguration(new SyncBatchConfiguration());
    modelBuilder.ApplyConfiguration(new SyncRecordConfiguration());
    modelBuilder.ApplyConfiguration(new SyncWatermarkConfiguration());
    modelBuilder.ApplyConfiguration(new SyncQuarantineConfiguration());

    // R3 Sync Source Connections (Slice B1.2)
    modelBuilder.ApplyConfiguration(new SyncSourceConnectionConfiguration());

    // R3 Sync Canonical Landing Schema
    modelBuilder.ApplyConfiguration(new OwnerConfiguration());
    modelBuilder.ApplyConfiguration(new OwnershipEventConfiguration());
    modelBuilder.ApplyConfiguration(new LandSegmentConfiguration());
    modelBuilder.ApplyConfiguration(new ImprovementDetailConfiguration());

    // R3 Sync Database Atlas (Slice B1)
    modelBuilder.ApplyConfiguration(new SyncProfileTableConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileColumnConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileViewConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileProcedureConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileFunctionConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileTriggerConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileConstraintConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileCodeConfiguration());

    // R3 Sync Data Profile (Slice B2 — deep profile statistics)
    modelBuilder.ApplyConfiguration(new SyncProfileTableStatsConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileColumnStatsConfiguration());
    modelBuilder.ApplyConfiguration(new SyncProfileCodeCandidateConfiguration());

    // R3 Sync Mapping Workbook (Slice C2 — durable mapping decisions)
    modelBuilder.ApplyConfiguration(new SyncMappingWorkbookConfiguration());
    modelBuilder.ApplyConfiguration(new SyncMappingColumnConfiguration());
    modelBuilder.ApplyConfiguration(new SyncMappingCodeValueConfiguration());

    // Slice C35-B — first canonical landing table
    // (sales-qualification decisions; see C35-A policy doc)
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.Canonical.CanonicalSaleQualificationConfiguration());

    // Slice C41-B — per-county pointer naming the operator-active
    // Mapped workbook (see C41-A policy doc).
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.Sync.SyncCountyActiveWorkbookConfiguration());

    // ── Sync Bridge v1 (PACS source-provenance doctrine) ─────────────
    // Per docs/pacs/pacs-sync-bridge-v1-spec.md.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.CanonicalTf.TfParcelConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.SourceXrefConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.FieldAuthorityConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.LoadBatchConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.DiffLedgerConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.ConflictQueueConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.WritebackJournalConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.RollbackPackageConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.SyncBridge.PromotionGateResultConfiguration());

    // ── GIS canonical mesh (Slice G1-A) ──────────────────────────────
    // Per docs/plans/terrafusion-90-day-execution-plan.md §4 Block D.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.GisTf.TfParcelGeomConfiguration());

    // ── Legacy PACS raw landing (Slice S1) ───────────────────────────
    // Per docs/plans/terrafusion-90-day-execution-plan.md §4 Block A.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.LegacyPacsRaw.LegacyPacsRawSaleConfiguration());

    // Slice S2-A: prop_supp_assoc landing — supp-aware-join pointer.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.LegacyPacsRaw.LegacyPacsRawPropSuppAssocConfiguration());

    // Slice B1-A: account landing — Block B's PII-rich identity table.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.LegacyPacsRaw.LegacyPacsRawAccountConfiguration());

    // Slice B1-B: owner landing — 4-key year-versioned link table.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.LegacyPacsRaw.LegacyPacsRawOwnerConfiguration());

    // Slice B1-C: wash_prop_owner_val landing — WSDOR-grade values.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.LegacyPacsRaw.LegacyPacsRawWashPropOwnerValConfiguration());

    // Slice S2-B: truth_pacs.sale — qualification-filtered,
    // supp-aware-validated truth layer.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.TruthPacs.TruthPacsSaleConfiguration());

    // Slice S3: canonical_tf.tf_sale + legacy_tf_unproven.sale.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.CanonicalTf.TfSaleConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.LegacyTfUnproven.LegacyTfUnprovenSaleConfiguration());

    // Slice B2-A: truth_pacs.owner_current — supp-aware owner snapshot.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.TruthPacs.TruthPacsOwnerCurrentConfiguration());

    // Slice B3: canonical_tf.tf_owner + tf_parcel_owner_link with
    // PII redaction; legacy_tf_unproven.owner_current quarantine.
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.CanonicalTf.TfOwnerConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.CanonicalTf.TfParcelOwnerLinkConfiguration());
    modelBuilder.ApplyConfiguration(
      new TerraFusion.Data.Configurations.LegacyTfUnproven.LegacyTfUnprovenOwnerCurrentConfiguration());

    // Sync Bridge v1 — Phase 0 field_authority seed for the parcel
    // domain. Per docs/pacs/pacs-sync-bridge-v1-spec.md §4.
    modelBuilder.Entity<TerraFusion.Core.Entities.SyncBridge.FieldAuthority>().HasData(
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -1, DomainName = "parcel", FieldName = "parcel_number",
        Phase = "phase_0", SystemOfRecord = "PACS",
        PacsToTfAllowed = true, TfToPacsAllowed = false,
        ConflictStrategy = "PACS_WINS", ApprovalRequired = false, RollbackRequired = true,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      },
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -2, DomainName = "parcel", FieldName = "situs_address",
        Phase = "phase_0", SystemOfRecord = "PACS",
        PacsToTfAllowed = true, TfToPacsAllowed = false,
        ConflictStrategy = "MANUAL_REVIEW", ApprovalRequired = true, RollbackRequired = true,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      },
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -3, DomainName = "parcel", FieldName = "legal_description",
        Phase = "phase_0", SystemOfRecord = "PACS",
        PacsToTfAllowed = true, TfToPacsAllowed = false,
        ConflictStrategy = "PACS_WINS", ApprovalRequired = false, RollbackRequired = true,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      },
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -4, DomainName = "parcel", FieldName = "property_type",
        Phase = "phase_0", SystemOfRecord = "PACS",
        PacsToTfAllowed = true, TfToPacsAllowed = false,
        ConflictStrategy = "PACS_WINS", ApprovalRequired = false, RollbackRequired = true,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      },
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -5, DomainName = "parcel", FieldName = "parcel_status",
        Phase = "phase_0", SystemOfRecord = "PACS",
        PacsToTfAllowed = true, TfToPacsAllowed = false,
        ConflictStrategy = "PACS_WINS", ApprovalRequired = false, RollbackRequired = true,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      },
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -6, DomainName = "parcel", FieldName = "county_id",
        Phase = "phase_0", SystemOfRecord = "TF",
        PacsToTfAllowed = false, TfToPacsAllowed = false,
        ConflictStrategy = "TF_WINS", ApprovalRequired = false, RollbackRequired = true,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      },
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -7, DomainName = "parcel", FieldName = "created_at",
        Phase = "phase_0", SystemOfRecord = "TF",
        PacsToTfAllowed = false, TfToPacsAllowed = false,
        ConflictStrategy = "APPEND_ONLY", ApprovalRequired = false, RollbackRequired = false,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      },
      new TerraFusion.Core.Entities.SyncBridge.FieldAuthority
      {
        AuthorityId = -8, DomainName = "parcel", FieldName = "updated_at",
        Phase = "phase_0", SystemOfRecord = "TF",
        PacsToTfAllowed = false, TfToPacsAllowed = false,
        ConflictStrategy = "APPEND_ONLY", ApprovalRequired = false, RollbackRequired = false,
        CreatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
      });

    // NOTE: TerraFusionGPT Suite configurations temporarily disabled due to circular dependency
    // These configurations are defined in TerraFusion.Data\Configurations\GPTConfiguration.cs.disabled
    // Solution: Move GPTConfiguration.cs to TerraFusion.AI\Data\Configurations or use fluent API directly
    // modelBuilder.ApplyConfiguration(new GPTConfigurationConfiguration());
    // modelBuilder.ApplyConfiguration(new GPTConversationConfiguration());
    // modelBuilder.ApplyConfiguration(new GPTMessageConfiguration());
    // modelBuilder.ApplyConfiguration(new RAGDatasetConfiguration());
    // modelBuilder.ApplyConfiguration(new RAGDocumentConfiguration());
    // modelBuilder.ApplyConfiguration(new GPTMarketplaceInstallConfiguration());
    // modelBuilder.ApplyConfiguration(new GPTUsageMetricConfiguration());

    modelBuilder.Entity<CollaborationNotification>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Id).HasMaxLength(450);
      entity.Property(e => e.RecipientId).IsRequired().HasMaxLength(450);
      entity.Property(e => e.SenderId).HasMaxLength(450);
      entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Message).IsRequired().HasMaxLength(1000);

      entity.HasOne(e => e.Recipient)
              .WithMany(u => u.ReceivedNotifications)
              .HasForeignKey(e => e.RecipientId)
              .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(e => e.Sender)
              .WithMany(u => u.SentNotifications)
              .HasForeignKey(e => e.SenderId)
              .OnDelete(DeleteBehavior.SetNull);
    });

    // Configure Experiment entity
    modelBuilder.Entity<TerraFusion.Data.Entities.Experiment>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
      entity.Property(e => e.DatasetId).HasMaxLength(100);
      entity.Property(e => e.DatasetVersion).HasMaxLength(50);
      entity.Property(e => e.ModelId).HasMaxLength(100);
      entity.Property(e => e.ModelVersion).HasMaxLength(50);
      entity.Property(e => e.HyperparamsJson).HasColumnType("jsonb");
      entity.Property(e => e.SwarmConfigJson).HasColumnType("jsonb");
      entity.Property(e => e.Owner).HasMaxLength(200);
      entity.Property(e => e.CreatedAt).IsRequired();
      entity.HasIndex(e => e.CreatedAt);
    });

    // Configure ExperimentRun entity
    modelBuilder.Entity<TerraFusion.Data.Entities.ExperimentRun>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ExperimentId).IsRequired();
      entity.Property(e => e.Status).IsRequired().HasMaxLength(100);
      entity.Property(e => e.ExecutionDetailsJson).HasColumnType("jsonb");
      entity.Property(e => e.CreatedAt).IsRequired();
      entity.HasIndex(e => e.CreatedAt);
      entity.HasIndex(e => e.ExperimentId);
      entity.HasIndex(e => e.Status);
      entity.HasOne<TerraFusion.Data.Entities.Experiment>()
              .WithMany()
              .HasForeignKey(e => e.ExperimentId)
              .OnDelete(DeleteBehavior.Cascade);
    });

    // Apply all configurations from Configurations folder
    modelBuilder.ApplyConfiguration(new NotificationPreferencesConfiguration());

    // ── TerraClerk entities (R3 CX) ──────────────────────────────────
    modelBuilder.Entity<ClerkDocument>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.RecordingNumber).IsRequired().HasMaxLength(50);
      entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.ParcelId).HasMaxLength(50);
      entity.Property(e => e.Grantor).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Grantee).IsRequired().HasMaxLength(200);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
      entity.HasIndex(e => new { e.CountyId, e.RecordingNumber }).IsUnique();
    });

    modelBuilder.Entity<TitleChainEntry>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.TransferType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.FromParty).IsRequired().HasMaxLength(200);
      entity.Property(e => e.ToParty).IsRequired().HasMaxLength(200);
      entity.HasOne(e => e.Document).WithMany().HasForeignKey(e => e.DocumentId);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId, e.TransferDate });
    });

    modelBuilder.Entity<ClerkLien>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.LienType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.LienHolder).IsRequired().HasMaxLength(200);
      entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
    });

    // ── TerraTreasury entities (R3 CX) ──────────────────────────────
    modelBuilder.Entity<TaxStatement>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId, e.TaxYear }).IsUnique();
    });

    modelBuilder.Entity<TaxPayment>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ReceiptId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.PaymentMethod).HasMaxLength(30);
      entity.HasOne(e => e.Statement).WithMany(s => s.Payments).HasForeignKey(e => e.StatementId).IsRequired(false);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
      entity.HasIndex(e => new { e.CountyId, e.ReceiptId }).IsUnique();
    });

    modelBuilder.Entity<DelinquencyRecord>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId }).IsUnique();
    });

    modelBuilder.Entity<InstallmentPlan>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Status).HasMaxLength(20);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
    });

    modelBuilder.Entity<TaxSale>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Status).HasMaxLength(20);
      entity.Property(e => e.DelinquentYears).HasMaxLength(500);
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
    });

    // ── TerraAudit entities (R3 CX) ─────────────────────────────────
    modelBuilder.Entity<AuditFinding>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ParcelId).HasMaxLength(50);
      entity.Property(e => e.FindingType).IsRequired().HasMaxLength(50);
      entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
      entity.Property(e => e.Severity).HasMaxLength(20);
      entity.Property(e => e.Status).HasMaxLength(20);
      entity.HasIndex(e => new { e.CountyId, e.TaxYear });
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
    });

    modelBuilder.Entity<AuditReconciliation>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Offices).HasMaxLength(500);
      entity.Property(e => e.Status).HasMaxLength(20);
      entity.HasIndex(e => new { e.CountyId, e.TaxYear });
    });

    // GPT Core Entities (Wave 4 — entities are in TerraFusion.Core, no circular dep)
    modelBuilder.ApplyConfiguration(new GptCoreEntityConfigurations.GPTConfigurationConfiguration());
    modelBuilder.ApplyConfiguration(new GptCoreEntityConfigurations.GPTConversationConfiguration());

    // Sales Audit Entities (R2 Wave 40 — TerraFusion.Core entities, no circular dep)
    // Registered here so EF design-time migrations pick them up without Program.cs hook.
    modelBuilder.ApplyConfiguration(new SalesAuditEntityConfigurations.SaleAuditDiagnosisConfiguration());
    modelBuilder.ApplyConfiguration(new SalesAuditEntityConfigurations.SalesAuditAdjustmentProposalConfiguration());

    // County Studio Entities (TerraForge countywide valuation workspace)
    modelBuilder.ApplyConfiguration(new CountyStudySessionConfiguration());
    modelBuilder.ApplyConfiguration(new CountySegmentSetConfiguration());
    modelBuilder.ApplyConfiguration(new CountySegmentConfiguration());
    modelBuilder.ApplyConfiguration(new CountyCohortConfiguration());
    modelBuilder.ApplyConfiguration(new CountyScenarioConfiguration());
    modelBuilder.ApplyConfiguration(new CountyAdjustmentSetConfiguration());
    modelBuilder.ApplyConfiguration(new CountyApplyHandoffReceiptConfiguration());
    modelBuilder.ApplyConfiguration(new CountyExceptionSetConfiguration());
    modelBuilder.ApplyConfiguration(new CountyDownstreamClosureReceiptConfiguration());
    modelBuilder.ApplyConfiguration(new CountySpatialArtifactConfiguration());

    // GPT/RAG AI Entities (Wave 4 — entities in TerraFusion.AI, registered via hook)
    // Wire in Program.cs: TerraFusionDbContext.OnModelCreatingExtensions = GptAiEntityConfigurations.Apply;
    // Database.ProviderName is available here; pass it so the AI config can skip
    // vector-specific type mapping when the provider is not Postgres (e.g. InMemory tests).
    OnModelCreatingExtensions?.Invoke(modelBuilder, Database.ProviderName);

    // Configure encryption for sensitive fields
    ConfigureEncryption(modelBuilder);
    NormalizeSqliteColumnTypes(modelBuilder);
  }

  private void NormalizeSqliteColumnTypes(ModelBuilder modelBuilder)
  {
    var provider = Database.ProviderName ?? string.Empty;
    if (!provider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
      return;

    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
    {
      foreach (var property in entityType.GetProperties())
      {
        var columnType = property.GetColumnType();
        if (string.IsNullOrWhiteSpace(columnType))
          continue;

        if (columnType.Contains("jsonb", StringComparison.OrdinalIgnoreCase) ||
            columnType.Contains("nvarchar(max)", StringComparison.OrdinalIgnoreCase) ||
            columnType.Contains("varchar(max)", StringComparison.OrdinalIgnoreCase))
        {
          property.SetColumnType("TEXT");
        }
      }
    }
  }

  private void ConfigureEncryption(ModelBuilder modelBuilder)
  {
    // Configure field-level encryption for sensitive data
    modelBuilder.Entity<GovernmentUser>()
        .Property(e => e.SocialSecurityNumber)
        .HasConversion(
            v => EncryptSensitiveData(v),
            v => DecryptSensitiveData(v));

    modelBuilder.Entity<Property>()
        .Property(e => e.OwnerSSN)
        .HasConversion(
            v => EncryptSensitiveData(v),
            v => DecryptSensitiveData(v));
  }

  private string EncryptSensitiveData(string? data)
  {
    if (string.IsNullOrEmpty(data))
      return string.Empty;

    // In production, use proper encryption service
    // This is a simplified example
    return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(data));
  }

  private string? DecryptSensitiveData(string? encryptedData)
  {
    if (string.IsNullOrEmpty(encryptedData))
      return null;

    try
    {
      return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(encryptedData));
    }
    catch
    {
      return null;
    }
  }

  public override async System.Threading.Tasks.Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
  {
    // Add audit logging for all changes
    var auditEntries = CreateAuditEntries();

    var result = await base.SaveChangesAsync(cancellationToken);

    // Save audit logs after successful save
    await SaveAuditLogs(auditEntries);

    return result;
  }

  private List<AuditLog> CreateAuditEntries()
  {
    var auditEntries = new List<AuditLog>();

    foreach (var entry in ChangeTracker.Entries())
    {
      if (entry.Entity is AuditLog || entry.State == EntityState.Unchanged)
        continue;

      var auditLog = new AuditLog
      {
        Id = Guid.NewGuid(),
        Type = $"{entry.Entity.GetType().Name}_{entry.State}",
        Data = System.Text.Json.JsonSerializer.Serialize(GetChanges(entry)),
        Timestamp = DateTime.UtcNow,
        UserId = GetCurrentUserId(),
        Source = "EntityFramework"
      };

      auditEntries.Add(auditLog);
    }

    return auditEntries;
  }

  private async System.Threading.Tasks.Task SaveAuditLogs(List<AuditLog> auditEntries)
  {
    if (auditEntries.Any())
    {
      AuditLogs.AddRange(auditEntries);
      await base.SaveChangesAsync();
    }
  }

  private string GetCurrentUserId()
  {
    // Get current user from HTTP context or authentication context
    return "System"; // Placeholder
  }

  private object GetChanges(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
  {
    var changes = new Dictionary<string, object>();

    foreach (var property in entry.Properties)
    {
      if (property.IsModified)
      {
        changes[property.Metadata.Name] = new
        {
          OldValue = property.OriginalValue,
          NewValue = property.CurrentValue
        };
      }
    }

    return changes;
  }
}
