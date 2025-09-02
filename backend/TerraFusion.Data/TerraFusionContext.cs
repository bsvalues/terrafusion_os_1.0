using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data;

public class TerraFusionContext : IdentityDbContext
{
    public TerraFusionContext(DbContextOptions<TerraFusionContext> options) : base(options) { }

    // Core Entities
    public DbSet<Property> Properties { get; set; }
    public DbSet<County> Counties { get; set; }
    public DbSet<Module> Modules { get; set; }
    public DbSet<AIModel> AIModels { get; set; }
    public DbSet<CostMatrix> CostMatrices { get; set; }
    public DbSet<Valuation> Valuations { get; set; }
    public DbSet<SystemLog> SystemLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Property Configuration
        modelBuilder.Entity<Property>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ParcelNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
            entity.Property(e => e.OwnerName).HasMaxLength(200);
            entity.Property(e => e.AssessedValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.LandValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ImprovementValue).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.ParcelNumber).IsUnique();
            entity.HasIndex(e => e.CountyId);
        });

        // County Configuration
        modelBuilder.Entity<County>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.State).IsRequired().HasMaxLength(2);
            entity.Property(e => e.FipsCode).HasMaxLength(10);
            entity.HasMany(e => e.Properties).WithOne(e => e.County).HasForeignKey(e => e.CountyId);
        });

        // Module Configuration
        modelBuilder.Entity<Module>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Version).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Tier).HasConversion<string>();
        });

        // AI Model Configuration
        modelBuilder.Entity<AIModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Accuracy).HasColumnType("decimal(5,4)");
        });

        // Cost Matrix Configuration
        modelBuilder.Entity<CostMatrix>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Region).IsRequired().HasMaxLength(100);
            entity.Property(e => e.BuildingType).IsRequired().HasMaxLength(10);
            entity.Property(e => e.BuildingTypeDescription).HasMaxLength(200);
            entity.Property(e => e.BaseCost).HasColumnType("decimal(10,2)");
            entity.Property(e => e.MinCost).HasColumnType("decimal(10,2)");
            entity.Property(e => e.MaxCost).HasColumnType("decimal(10,2)");
            entity.Property(e => e.MatrixDescription).HasMaxLength(500);
            entity.Property(e => e.County).HasMaxLength(50);
            entity.Property(e => e.State).HasMaxLength(5);
            entity.Property(e => e.AdjustmentFactors).HasMaxLength(1000);
            entity.Property(e => e.CostPerSqFt).HasColumnType("decimal(10,2)");
            entity.Property(e => e.AdjustmentFactor).HasColumnType("decimal(5,4)");
            entity.Property(e => e.DepreciationRate).HasColumnType("decimal(5,4)");
            entity.HasIndex(e => new { e.County, e.Region, e.BuildingType }).IsUnique();
        });

        // Valuation Configuration
        modelBuilder.Entity<Valuation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EstimatedValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Confidence).HasColumnType("decimal(5,4)");
            entity.HasOne(e => e.Property).WithMany(e => e.Valuations).HasForeignKey(e => e.PropertyId);
            entity.HasOne(e => e.AIModel).WithMany().HasForeignKey(e => e.AIModelId);
        });

        // System Log Configuration
        modelBuilder.Entity<SystemLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Level).HasConversion<string>();
            entity.Property(e => e.Message).IsRequired();
            entity.Property(e => e.Exception).HasMaxLength(4000);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.Level);
        });

        // Seed Data
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed Counties
        modelBuilder.Entity<County>().HasData(
            new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" },
            new County { Id = Guid.NewGuid(), Name = "Cowlitz", State = "WA", FipsCode = "53015" },
            new County { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "53077" }
        );

        // Seed Production-Ready Modules (15 from ACTIVE_MODULES.md)
        var productionModules = new[]
        {
            // Core Government Modules (Tier 1)
            new Module { Id = 1, Name = "government-edition", DisplayName = "Property Assessment Suite", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 1 },
            new Module { Id = 2, Name = "costforge-ai-champion", DisplayName = "CostForge AI", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 2 },
            new Module { Id = 3, Name = "terra-collections", DisplayName = "Terra Collections", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 3 },
            new Module { Id = 4, Name = "terra-levy", DisplayName = "Terra Levy", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 4 },
            new Module { Id = 5, Name = "terra-insight", DisplayName = "Terra Insight", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 5 },
            
            // AI Agent Modules (Tier 1)
            new Module { Id = 6, Name = "ai-command-brain", DisplayName = "AI Command Brain", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 6 },
            new Module { Id = 7, Name = "ai-swarm", DisplayName = "AI Swarm Orchestrator", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 7 },
            new Module { Id = 8, Name = "ai-advanced", DisplayName = "Enhanced Revenue Hunter", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier1, Priority = 8 },
            
            // Development & Testing (Tier 2)
            new Module { Id = 9, Name = "testing-suite", DisplayName = "Testing Suite", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier2, Priority = 9 },
            new Module { Id = 10, Name = "development", DisplayName = "Development Tools", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier2, Priority = 10 },
            
            // Commercial Modules (Tier 2)
            new Module { Id = 11, Name = "commercial-suite", DisplayName = "Commercial Suite", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier2, Priority = 11 },
            new Module { Id = 12, Name = "marketplace-champion", DisplayName = "Data Marketplace", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier2, Priority = 12 },
            
            // Specialized Modules (Tier 2)
            new Module { Id = 13, Name = "gispro", DisplayName = "GIS Pro Integration", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier2, Priority = 13 },
            new Module { Id = 14, Name = "TerraFusion-PublicRecords", DisplayName = "Public Records Portal", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier2, Priority = 14 },
            new Module { Id = 15, Name = "property-workbench", DisplayName = "Property Workbench", Version = "1.0.0", Status = Core.Enums.ModuleStatus.Active, Tier = Core.Enums.ModuleTier.Tier2, Priority = 15 }
        };

        modelBuilder.Entity<Module>().HasData(productionModules);

        // Seed AI Models
        var aiModels = new[]
        {
            new AIModel { Id = Guid.NewGuid(), Name = "Property Valuation Model", Type = Core.Enums.AIModelType.PropertyValuation, Status = Core.Enums.AIModelStatus.Active, Accuracy = 0.95m },
            new AIModel { Id = Guid.NewGuid(), Name = "Cost Prediction Model", Type = Core.Enums.AIModelType.CostPrediction, Status = Core.Enums.AIModelStatus.Active, Accuracy = 0.92m },
            new AIModel { Id = Guid.NewGuid(), Name = "Market Analysis Model", Type = Core.Enums.AIModelType.MarketAnalysis, Status = Core.Enums.AIModelStatus.Active, Accuracy = 0.88m }
        };

        modelBuilder.Entity<AIModel>().HasData(aiModels);
    }
}
