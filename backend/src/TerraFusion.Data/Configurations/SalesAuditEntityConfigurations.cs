// R2 Wave 40 — Sales Audit EF Entity Configurations
// Entities live in TerraFusion.Core.Entities (no circular dep with TerraFusion.Data).
// Registered directly in TerraFusionDbContext.OnModelCreating so that EF Core's
// design-time migration tool picks them up without the Program.cs static hook.

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

/// <summary>
/// EF Core configurations for AI-driven sales audit entities.
/// These mirror the configurations previously in TerraFusion.AI.Data.GptAiEntityConfigurations
/// but belong here because the entity types are in TerraFusion.Core (no circular dep).
/// </summary>
public static class SalesAuditEntityConfigurations
{
    public sealed class SaleAuditDiagnosisConfiguration
        : IEntityTypeConfiguration<SaleAuditDiagnosis>
    {
        public void Configure(EntityTypeBuilder<SaleAuditDiagnosis> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("SaleAuditDiagnoses");
            builder.Property(e => e.StratumKey).IsRequired().HasMaxLength(200);
            builder.Property(e => e.PrimaryDiagnosis).IsRequired().HasMaxLength(50);
            builder.Property(e => e.Confidence).HasColumnType("decimal(3,2)");
            builder.Property(e => e.FindingsJson).HasColumnType("text");
            builder.Property(e => e.SimulationResultJson).HasColumnType("text");
            builder.Property(e => e.RecommendedAction).HasMaxLength(50);
            builder.Property(e => e.RecommendedSaleIdsJson).HasColumnType("text");
            builder.Property(e => e.RecommendedFactor).HasColumnType("decimal(6,4)");
            builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.StratumKey })
                   .HasDatabaseName("IX_SaleAuditDiagnoses_CountyYearStrat");
            builder.HasIndex(e => e.IsStale).HasDatabaseName("IX_SaleAuditDiagnoses_IsStale");
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        }
    }

    public sealed class SalesAuditAdjustmentProposalConfiguration
        : IEntityTypeConfiguration<SalesAuditAdjustmentProposal>
    {
        public void Configure(EntityTypeBuilder<SalesAuditAdjustmentProposal> builder)
        {
            builder.HasKey(e => e.Id);
            builder.ToTable("SalesAuditAdjustmentProposals");
            builder.Property(e => e.StratumKey).IsRequired().HasMaxLength(200);
            builder.Property(e => e.ProposedFactor).HasColumnType("decimal(6,4)");
            builder.Property(e => e.ProjectedCod).HasColumnType("decimal(8,4)");
            builder.Property(e => e.ProjectedMedianRatio).HasColumnType("decimal(6,4)");
            builder.Property(e => e.ProjectedPrd).HasColumnType("decimal(6,4)");
            builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
            builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.Status })
                   .HasDatabaseName("IX_SalesAuditAdjProposals_CountyYearStatus");
        }
    }
}
