/**
 * AnalysisResult Entity Configuration
 *
 * EF Core Fluent API configuration for AnalysisResult entity.
 * Defines table schema, indexes, constraints, and relationships.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 3
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

/// <summary>
/// EF Core configuration for AnalysisResult entity
/// </summary>
public class AnalysisResultConfiguration : IEntityTypeConfiguration<AnalysisResult>
{
    public void Configure(EntityTypeBuilder<AnalysisResult> builder)
    {
        // Table name
        builder.ToTable("AnalysisResults");

        // Primary key
        builder.HasKey(e => e.Id);

        // Properties
        builder.Property(e => e.AnalysisType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.InputDataJson)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.ParametersJson)
            .HasColumnType("text");

        builder.Property(e => e.TestStatistic)
            .IsRequired()
            .HasPrecision(18, 6); // High precision for statistical values

        builder.Property(e => e.PValue)
            .IsRequired()
            .HasPrecision(18, 10); // Very high precision for p-values

        builder.Property(e => e.DegreesOfFreedom)
            .HasPrecision(18, 6);

        builder.Property(e => e.EffectSizeType)
            .HasMaxLength(50);

        builder.Property(e => e.EffectSizeValue)
            .HasPrecision(18, 6);

        builder.Property(e => e.ConfidenceIntervalLower)
            .HasPrecision(18, 6);

        builder.Property(e => e.ConfidenceIntervalUpper)
            .HasPrecision(18, 6);

        builder.Property(e => e.Conclusion)
            .HasColumnType("text");

        builder.Property(e => e.LatexOutput)
            .HasColumnType("text");

        builder.Property(e => e.ApaOutput)
            .HasColumnType("text");

        builder.Property(e => e.ResultJson)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.ExecutionTimeMs)
            .IsRequired();

        builder.Property(e => e.IsFavorite)
            .HasDefaultValue(false);

        builder.Property(e => e.IsArchived)
            .HasDefaultValue(false);

        builder.Property(e => e.Tags)
            .HasMaxLength(500);

        builder.Property(e => e.Notes)
            .HasColumnType("text");

        // Audit fields
        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(e => e.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(e => e.CreatedBy)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.UpdatedBy)
            .IsRequired()
            .HasMaxLength(100);

        // Relationships
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Notebook)
            .WithMany()
            .HasForeignKey(e => e.NotebookId)
            .OnDelete(DeleteBehavior.SetNull); // Set to null if notebook deleted

        // Indexes
        builder.HasIndex(e => e.UserId)
            .HasDatabaseName("IX_AnalysisResults_UserId");

        builder.HasIndex(e => e.CountyId)
            .HasDatabaseName("IX_AnalysisResults_CountyId");

        builder.HasIndex(e => e.NotebookId)
            .HasDatabaseName("IX_AnalysisResults_NotebookId");

        builder.HasIndex(e => e.AnalysisType)
            .HasDatabaseName("IX_AnalysisResults_AnalysisType");

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("IX_AnalysisResults_CreatedAt");

        builder.HasIndex(e => e.IsArchived)
            .HasDatabaseName("IX_AnalysisResults_IsArchived");

        builder.HasIndex(e => new { e.UserId, e.AnalysisType })
            .HasDatabaseName("IX_AnalysisResults_UserId_AnalysisType");

        builder.HasIndex(e => e.PValue)
            .HasDatabaseName("IX_AnalysisResults_PValue");
    }
}
