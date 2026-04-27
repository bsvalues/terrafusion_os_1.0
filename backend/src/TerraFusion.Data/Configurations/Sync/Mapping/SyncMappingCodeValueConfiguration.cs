using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Mapping;

namespace TerraFusion.Data.Configurations.Sync.Mapping;

/// <summary>
/// EF configuration for <see cref="SyncMappingCodeValue"/> (Slice C2).
///
/// Conventions match Sync/Profile:
///   - SourceValue width is 512 to accommodate padded PACS varchar
///     values (e.g. <c>"R    "</c>) plus longer WAC citations like
///     <c>"458-61A-203(1)"</c> without truncation.
///   - MappingColumn FK cascades.
///   - Unique on (MappingColumnId, SourceValue) prevents duplicate
///     value rows.
///   - Filter index on (CountyId, IsExcluded) supports the common
///     "show me everything I've excluded" review query.
/// </summary>
public sealed class SyncMappingCodeValueConfiguration : IEntityTypeConfiguration<SyncMappingCodeValue>
{
    public void Configure(EntityTypeBuilder<SyncMappingCodeValue> builder)
    {
        builder.ToTable("SyncMappingCodeValues");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceValue).HasMaxLength(512).IsRequired();
        builder.Property(x => x.SourceLabel).HasMaxLength(1024);
        builder.Property(x => x.CanonicalValue).HasMaxLength(256);

        builder.Property(x => x.ReviewStatus).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        // Natural-key uniqueness: one (column, value) row.
        builder.HasIndex(x => new { x.MappingColumnId, x.SourceValue }).IsUnique();

        // Review-state filtering ("show me what I excluded", "show me
        // what's still NeedsReview").
        builder.HasIndex(x => new { x.CountyId, x.ReviewStatus });
        builder.HasIndex(x => new { x.CountyId, x.IsExcluded });
    }
}
