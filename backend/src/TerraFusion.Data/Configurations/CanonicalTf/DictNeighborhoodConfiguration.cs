using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E1: EF configuration for <see cref="DictNeighborhood"/>.
/// Schema <c>canonical_tf</c>; table <c>dict_neighborhood</c>.
///
/// <para>Per Block-C contract v1.1
/// (<c>docs/pacs/block-c-contract-v1.1.md</c>):
///  - <c>(CountyId, HoodCd)</c> is the natural unique key
///    (sovereign-county isolation + closed-vocab uniqueness).
///  - Every row carries <c>LoadBatchId</c> + <c>SourceQueryHash</c>
///    provenance.</para>
/// </summary>
public sealed class DictNeighborhoodConfiguration
    : IEntityTypeConfiguration<DictNeighborhood>
{
    public void Configure(EntityTypeBuilder<DictNeighborhood> builder)
    {
        builder.ToTable("dict_neighborhood", schema: "canonical_tf");

        builder.HasKey(x => x.DictNeighborhoodId);
        builder.Property(x => x.DictNeighborhoodId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.HoodCd)
            .IsRequired()
            .HasMaxLength(10);
        builder.Property(x => x.HoodName).HasMaxLength(200);
        builder.Property(x => x.HoodDescription).HasMaxLength(1000);
        builder.Property(x => x.HoodGroupCd).HasMaxLength(20);

        builder.Property(x => x.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Provenance.
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Sovereign-county isolated uniqueness on the natural key.
        // Same hood_cd can exist in different counties with
        // different meanings; never within the same county.
        builder.HasIndex(x => new { x.CountyId, x.HoodCd })
            .IsUnique()
            .HasDatabaseName("ux_dict_neighborhood_county_hoodcd");

        // Lookup index for "active codes for county X".
        builder.HasIndex(x => new { x.CountyId, x.IsActive })
            .HasDatabaseName("ix_dict_neighborhood_county_active");

        // Provenance lookups.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_dict_neighborhood_load_batch");

        // Optional grouping scan (ratio studies).
        builder.HasIndex(x => new { x.CountyId, x.HoodGroupCd })
            .HasDatabaseName("ix_dict_neighborhood_county_group");
    }
}
