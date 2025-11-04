/**
 * Workflow Entity Configuration
 *
 * EF Core Fluent API configuration for Workflow entity.
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
/// EF Core configuration for Workflow entity
/// </summary>
public class WorkflowConfiguration : IEntityTypeConfiguration<Workflow>
{
    public void Configure(EntityTypeBuilder<Workflow> builder)
    {
        // Table name
        builder.ToTable("Workflows");

        // Primary key
        builder.HasKey(e => e.Id);

        // Properties
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("data-processing");

        builder.Property(e => e.Complexity)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("moderate");

        builder.Property(e => e.DefinitionJson)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.MetadataJson)
            .HasColumnType("text");

        builder.Property(e => e.IsTemplate)
            .HasDefaultValue(false);

        builder.Property(e => e.Visibility)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("private");

        builder.Property(e => e.IsFavorite)
            .HasDefaultValue(false);

        builder.Property(e => e.IsArchived)
            .HasDefaultValue(false);

        builder.Property(e => e.NodeCount)
            .HasDefaultValue(0);

        builder.Property(e => e.ExecutionCount)
            .HasDefaultValue(0);

        builder.Property(e => e.LastExecutionStatus)
            .HasMaxLength(50);

        builder.Property(e => e.AverageExecutionTime)
            .HasPrecision(18, 2);

        builder.Property(e => e.Tags)
            .HasMaxLength(500);

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

        builder.HasMany(e => e.Executions)
            .WithOne(e => e.Workflow)
            .HasForeignKey(e => e.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade); // Delete executions when workflow deleted

        // Self-referencing for templates
        builder.HasOne<Workflow>()
            .WithMany()
            .HasForeignKey(e => e.TemplateId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(e => e.UserId)
            .HasDatabaseName("IX_Workflows_UserId");

        builder.HasIndex(e => e.CountyId)
            .HasDatabaseName("IX_Workflows_CountyId");

        builder.HasIndex(e => new { e.UserId, e.Name })
            .HasDatabaseName("IX_Workflows_UserId_Name");

        builder.HasIndex(e => e.Category)
            .HasDatabaseName("IX_Workflows_Category");

        builder.HasIndex(e => e.Complexity)
            .HasDatabaseName("IX_Workflows_Complexity");

        builder.HasIndex(e => e.IsTemplate)
            .HasDatabaseName("IX_Workflows_IsTemplate");

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("IX_Workflows_CreatedAt");

        builder.HasIndex(e => e.IsArchived)
            .HasDatabaseName("IX_Workflows_IsArchived");
    }
}
