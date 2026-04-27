using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Mapping;

namespace TerraFusion.Data.Configurations.Sync.Mapping;

/// <summary>
/// EF configuration for <see cref="SyncMappingColumn"/> (Slice C2).
///
/// Conventions match Sync/Profile:
///   - SchemaName / TableName / ColumnName field widths align with
///     SyncProfileTable / SyncProfileColumn (256 / 256 / 256).
///   - DistinctRatio precision matches SyncProfileCodeCandidate (7,4)
///     so seeded values land losslessly.
///   - Workbook FK cascades — deleting a workbook nukes its columns.
///   - <see cref="SyncMappingColumn.CodeCandidateId"/> is intentionally
///     NOT a foreign-key constraint: a candidate row deletion (profile
///     cleanup, or a re-run that produces different candidates) must
///     leave the operator's mapping decision intact.
///   - Unique on (WorkbookId, SourceSchema, SourceTable, SourceColumn)
///     so a column can't appear twice in a workbook.
/// </summary>
public sealed class SyncMappingColumnConfiguration : IEntityTypeConfiguration<SyncMappingColumn>
{
    public void Configure(EntityTypeBuilder<SyncMappingColumn> builder)
    {
        builder.ToTable("SyncMappingColumns");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSchema).HasMaxLength(128).IsRequired();
        builder.Property(x => x.SourceTable).HasMaxLength(256).IsRequired();
        builder.Property(x => x.SourceColumn).HasMaxLength(256).IsRequired();

        builder.Property(x => x.MappingLane).HasMaxLength(64).IsRequired();
        builder.Property(x => x.CanonicalTarget).HasMaxLength(256);

        builder.Property(x => x.ReviewStatus).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(4000);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.Property(x => x.DistinctRatio).HasPrecision(7, 4);

        // Primary lookup: "all columns in this workbook" — already
        // covered by the Workbook FK index. Add the natural-key
        // uniqueness explicitly.
        builder.HasIndex(x => new { x.WorkbookId, x.SourceSchema, x.SourceTable, x.SourceColumn })
            .IsUnique();

        // Cross-workbook lookups: "every workbook decision for this
        // physical column over time" — driven by source identity.
        builder.HasIndex(x => new { x.CountyId, x.SourceSchema, x.SourceTable, x.SourceColumn });

        // Lane-filtered review queries.
        builder.HasIndex(x => new { x.CountyId, x.MappingLane, x.ReviewStatus });

        builder.HasMany(x => x.CodeValues)
            .WithOne(x => x.MappingColumn)
            .HasForeignKey(x => x.MappingColumnId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
