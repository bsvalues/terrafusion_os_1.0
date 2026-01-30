// TerraFusion Codex: EF Core Configuration
// Elite Government OS Engineering - Database Configuration

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations
{
    /// <summary>
    /// Entity Framework configuration for Codex entities
    /// </summary>
    public class CodexMetricConfiguration : IEntityTypeConfiguration<CodexMetric>
    {
        public void Configure(EntityTypeBuilder<CodexMetric> builder)
        {
            builder.ToTable("CodexMetrics");
            builder.HasKey(e => e.Id);

            builder.Property(e => e.Timestamp).IsRequired();
            builder.Property(e => e.Environment).IsRequired().HasMaxLength(50);
            builder.Property(e => e.County).HasMaxLength(100);
            builder.Property(e => e.Domain).IsRequired().HasMaxLength(100);
            builder.Property(e => e.MetricName).IsRequired().HasMaxLength(100);
            builder.Property(e => e.RawValue).IsRequired();
            builder.Property(e => e.ScaledValue).IsRequired();
            builder.Property(e => e.Unit).HasMaxLength(20);
            builder.Property(e => e.AlertLevel).HasMaxLength(20);

            // Audit fields
            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(200);

            // Indexes for performance
            builder.HasIndex(e => e.Timestamp).HasDatabaseName("IX_CodexMetrics_Timestamp");
            builder.HasIndex(e => new { e.Domain, e.Timestamp }).HasDatabaseName("IX_CodexMetrics_Domain_Timestamp");
            builder.HasIndex(e => new { e.County, e.Timestamp }).HasDatabaseName("IX_CodexMetrics_County_Timestamp");
            builder.HasIndex(e => new { e.Environment, e.Timestamp }).HasDatabaseName("IX_CodexMetrics_Environment_Timestamp");
        }
    }

    public class CodexScoreConfiguration : IEntityTypeConfiguration<CodexScore>
    {
        public void Configure(EntityTypeBuilder<CodexScore> builder)
        {
            builder.ToTable("CodexScores");
            builder.HasKey(e => e.Id);

            builder.Property(e => e.Timestamp).IsRequired();
            builder.Property(e => e.Environment).IsRequired().HasMaxLength(50);
            builder.Property(e => e.County).HasMaxLength(100);
            builder.Property(e => e.Domain).IsRequired().HasMaxLength(100);
            builder.Property(e => e.AmplifiedScore).IsRequired();
            builder.Property(e => e.AlertLevel).IsRequired().HasMaxLength(20);
            builder.Property(e => e.RecommendedAction).HasMaxLength(500);

            // Audit fields
            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(200);

            // Indexes
            builder.HasIndex(e => e.Timestamp).HasDatabaseName("IX_CodexScores_Timestamp");
            builder.HasIndex(e => new { e.Domain, e.Timestamp }).HasDatabaseName("IX_CodexScores_Domain_Timestamp");
            builder.HasIndex(e => new { e.County, e.Timestamp }).HasDatabaseName("IX_CodexScores_County_Timestamp");
            builder.HasIndex(e => new { e.Environment, e.Domain, e.Timestamp }).HasDatabaseName("IX_CodexScores_Env_Domain_Timestamp");
        }
    }

    public class CodexUltimatePowerConfiguration : IEntityTypeConfiguration<CodexUltimatePower>
    {
        public void Configure(EntityTypeBuilder<CodexUltimatePower> builder)
        {
            builder.ToTable("CodexUltimatePower");
            builder.HasKey(e => e.Id);

            builder.Property(e => e.Timestamp).IsRequired();
            builder.Property(e => e.Environment).IsRequired().HasMaxLength(50);
            builder.Property(e => e.County).HasMaxLength(100);
            builder.Property(e => e.UltimatePowerScore).IsRequired();
            builder.Property(e => e.Percentage).IsRequired();
            builder.Property(e => e.AlertLevel).IsRequired().HasMaxLength(20);
            builder.Property(e => e.RecommendedAction).HasMaxLength(500);
            builder.Property(e => e.Trend).HasMaxLength(20);
            builder.Property(e => e.IsChampionshipMode).IsRequired();
            builder.Property(e => e.IsFISMACompliant).IsRequired();

            // JSON column - PostgreSQL JSONB, SQLite TEXT
            builder.Property(e => e.DomainScoresJson)
                .HasColumnType("jsonb") // PostgreSQL
                .IsRequired();

            // Audit fields
            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(200);

            // Indexes
            builder.HasIndex(e => e.Timestamp).HasDatabaseName("IX_CodexUltimatePower_Timestamp");
            builder.HasIndex(e => new { e.County, e.Timestamp }).HasDatabaseName("IX_CodexUltimatePower_County_Timestamp");
            builder.HasIndex(e => e.IsChampionshipMode).HasDatabaseName("IX_CodexUltimatePower_ChampionshipMode");
            builder.HasIndex(e => e.IsFISMACompliant).HasDatabaseName("IX_CodexUltimatePower_FISMACompliant");
            builder.HasIndex(e => new { e.Environment, e.Timestamp }).HasDatabaseName("IX_CodexUltimatePower_Env_Timestamp");
        }
    }

    public class CodexAlertConfiguration : IEntityTypeConfiguration<CodexAlert>
    {
        public void Configure(EntityTypeBuilder<CodexAlert> builder)
        {
            builder.ToTable("CodexAlerts");
            builder.HasKey(e => e.Id);

            builder.Property(e => e.Timestamp).IsRequired();
            builder.Property(e => e.Environment).IsRequired().HasMaxLength(50);
            builder.Property(e => e.County).HasMaxLength(100);
            builder.Property(e => e.Domain).IsRequired().HasMaxLength(100);
            builder.Property(e => e.AlertLevel).IsRequired().HasMaxLength(20);
            builder.Property(e => e.Score).IsRequired();
            builder.Property(e => e.Threshold).IsRequired();
            builder.Property(e => e.Message).IsRequired().HasMaxLength(1000);
            builder.Property(e => e.RecommendedAction).HasMaxLength(1000);
            builder.Property(e => e.Acknowledged).IsRequired();
            builder.Property(e => e.AcknowledgedBy).HasMaxLength(200);
            builder.Property(e => e.Resolved).IsRequired();
            builder.Property(e => e.ResolutionNotes).HasMaxLength(2000);

            // Audit fields
            builder.Property(e => e.CreatedAt).IsRequired();
            builder.Property(e => e.UpdatedAt).IsRequired();
            builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(200);

            // Indexes
            builder.HasIndex(e => e.Timestamp).HasDatabaseName("IX_CodexAlerts_Timestamp");
            builder.HasIndex(e => new { e.Acknowledged, e.Timestamp }).HasDatabaseName("IX_CodexAlerts_Ack_Timestamp");
            builder.HasIndex(e => new { e.Resolved, e.Timestamp }).HasDatabaseName("IX_CodexAlerts_Resolved_Timestamp");
            builder.HasIndex(e => new { e.Domain, e.AlertLevel, e.Timestamp }).HasDatabaseName("IX_CodexAlerts_Domain_Level_Timestamp");
            builder.HasIndex(e => new { e.County, e.Timestamp }).HasDatabaseName("IX_CodexAlerts_County_Timestamp");
        }
    }
}
