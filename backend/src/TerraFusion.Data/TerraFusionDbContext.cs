using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Models;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data.Configurations;
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

  // NOTE: AI GPT & RAG Entities cannot be added here due to circular dependency
  // TerraFusion.Data → TerraFusion.AI would create circular reference
  // These entities are managed directly in TerraFusion.AI services via raw DbContext access
  // public DbSet<GPTConfiguration> GPTConfigurations { get; set; }
  // public DbSet<GPTConversation> GPTConversations { get; set; }
  // public DbSet<GPTMessage> GPTMessages { get; set; }
  // public DbSet<RAGDataset> RAGDatasets { get; set; }
  // public DbSet<RAGDocument> RAGDocuments { get; set; }
  // public DbSet<GPTMarketplaceInstall> GPTMarketplaceInstalls { get; set; }
  // public DbSet<GPTUsageMetric> GPTUsageMetrics { get; set; }

  // Module System Entities
  public DbSet<Module> Modules { get; set; }
  public DbSet<Valuation> Valuations { get; set; }

  // Marketplace Entities
  public DbSet<Plugin> Plugins { get; set; }
  public DbSet<PluginSubmission> PluginSubmissions { get; set; }
  public DbSet<PluginInstallation> PluginInstallations { get; set; }
  public DbSet<PluginRevenue> PluginRevenue { get; set; }
  public DbSet<PluginAnalytics> PluginAnalytics { get; set; }

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
  public DbSet<CamaCharacteristic> CamaCharacteristics { get; set; }
  public DbSet<CostMatrix> CostMatrices { get; set; }

  // Forge Analytics (R2 Wave 26)
  public DbSet<RegressionAnalysis> RegressionAnalyses { get; set; }

  // Forge Analytics (R2 Wave 27)
  public DbSet<BayesianAnalysis> BayesianAnalyses { get; set; }
  public DbSet<MonteCarloSimulation> MonteCarloSimulations { get; set; }

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
      entity.Property(e => e.AssessedValue).HasPrecision(18, 2);
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
      entity.Property(e => e.SaleQualification).HasMaxLength(30);
      entity.HasIndex(e => new { e.CountyId, e.PropertyType, e.SaleDate });
      entity.HasIndex(e => new { e.CountyId, e.Neighborhood });
      entity.HasIndex(e => new { e.CountyId, e.ParcelId });
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

    // Configure encryption for sensitive fields
    ConfigureEncryption(modelBuilder);
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
