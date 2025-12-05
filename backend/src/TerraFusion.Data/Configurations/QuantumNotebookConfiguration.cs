/**
 * QuantumNotebook Entity Configuration
 *
 * EF Core Fluent API configuration for QuantumNotebook entity.
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
/// EF Core configuration for QuantumNotebook entity
/// </summary>
public class QuantumNotebookConfiguration : IEntityTypeConfiguration<QuantumNotebook>
{
    public void Configure(EntityTypeBuilder<QuantumNotebook> builder)
    {
        // Table name
        builder.ToTable("QuantumNotebooks");

        // Primary key
        builder.HasKey(e => e.Id);

        // Properties
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.CellsJson)
            .IsRequired()
            .HasColumnType("text"); // Store as TEXT for large JSON

        builder.Property(e => e.MetadataJson)
            .HasColumnType("text");

        builder.Property(e => e.Language)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("javascript");

        builder.Property(e => e.Visibility)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("private");

        builder.Property(e => e.IsFavorite)
            .HasDefaultValue(false);

        builder.Property(e => e.IsArchived)
            .HasDefaultValue(false);

        builder.Property(e => e.ExecutionCount)
            .HasDefaultValue(0);

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
            .OnDelete(DeleteBehavior.Restrict); // Don't cascade delete

        builder.HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.UserId)
            .HasDatabaseName("IX_QuantumNotebooks_UserId");

        builder.HasIndex(e => e.CountyId)
            .HasDatabaseName("IX_QuantumNotebooks_CountyId");

        builder.HasIndex(e => new { e.UserId, e.Name })
            .HasDatabaseName("IX_QuantumNotebooks_UserId_Name");

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("IX_QuantumNotebooks_CreatedAt");

        builder.HasIndex(e => e.IsArchived)
            .HasDatabaseName("IX_QuantumNotebooks_IsArchived");

        builder.HasIndex(e => e.Language)
            .HasDatabaseName("IX_QuantumNotebooks_Language");
    }
}
