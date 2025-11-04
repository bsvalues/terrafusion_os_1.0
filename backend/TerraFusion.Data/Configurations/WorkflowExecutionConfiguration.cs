/**
 * WorkflowExecution Entity Configuration
 *
 * EF Core Fluent API configuration for WorkflowExecution entity.
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
/// EF Core configuration for WorkflowExecution entity
/// </summary>
public class WorkflowExecutionConfiguration : IEntityTypeConfiguration<WorkflowExecution>
{
    public void Configure(EntityTypeBuilder<WorkflowExecution> builder)
    {
        // Table name
        builder.ToTable("WorkflowExecutions");

        // Primary key
        builder.HasKey(e => e.Id);

        // Properties
        builder.Property(e => e.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("running");

        builder.Property(e => e.StartedAt)
            .IsRequired();

        builder.Property(e => e.DurationMs)
            .HasDefaultValue(null);

        builder.Property(e => e.TotalNodes)
            .IsRequired();

        builder.Property(e => e.NodesExecuted)
            .HasDefaultValue(0);

        builder.Property(e => e.NodesFailed)
            .HasDefaultValue(0);

        builder.Property(e => e.ExecutionLogJson)
            .HasColumnType("text");

        builder.Property(e => e.OutputJson)
            .HasColumnType("text");

        builder.Property(e => e.ErrorMessage)
            .HasColumnType("text");

        builder.Property(e => e.ErrorStackTrace)
            .HasColumnType("text");

        builder.Property(e => e.ContextJson)
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
        builder.HasOne(e => e.Workflow)
            .WithMany(w => w.Executions)
            .HasForeignKey(e => e.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.WorkflowId)
            .HasDatabaseName("IX_WorkflowExecutions_WorkflowId");

        builder.HasIndex(e => e.UserId)
            .HasDatabaseName("IX_WorkflowExecutions_UserId");

        builder.HasIndex(e => e.CountyId)
            .HasDatabaseName("IX_WorkflowExecutions_CountyId");

        builder.HasIndex(e => e.Status)
            .HasDatabaseName("IX_WorkflowExecutions_Status");

        builder.HasIndex(e => e.StartedAt)
            .HasDatabaseName("IX_WorkflowExecutions_StartedAt");

        builder.HasIndex(e => new { e.WorkflowId, e.Status })
            .HasDatabaseName("IX_WorkflowExecutions_WorkflowId_Status");

        builder.HasIndex(e => new { e.WorkflowId, e.StartedAt })
            .HasDatabaseName("IX_WorkflowExecutions_WorkflowId_StartedAt");
    }
}
