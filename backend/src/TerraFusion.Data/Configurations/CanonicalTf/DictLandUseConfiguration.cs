using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): EF configuration for
/// <see cref="DictLandUse"/>. Schema <c>canonical_tf</c>; table
/// <c>dict_land_use</c>.
///
/// <para>Mirrors <see cref="DictNeighborhoodConfiguration"/>
/// exactly. <c>(CountyId, LandUseCd)</c> is the natural unique
/// key (sovereign-county isolation + closed-vocab uniqueness).
/// Every row carries <c>LoadBatchId</c> + <c>SourceQueryHash</c>
/// provenance.</para>
/// </summary>
public sealed class DictLandUseConfiguration
    : IEntityTypeConfiguration<DictLandUse>
{
    public void Configure(EntityTypeBuilder<DictLandUse> builder)
    {
        builder.ToTable("dict_land_use", schema: "canonical_tf");

        builder.HasKey(x => x.DictLandUseId);
        builder.Property(x => x.DictLandUseId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.LandUseCd)
            .IsRequired()
            .HasMaxLength(10);
        builder.Property(x => x.Description).HasMaxLength(1000);

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
        builder.HasIndex(x => new { x.CountyId, x.LandUseCd })
            .IsUnique()
            .HasDatabaseName("ux_dict_land_use_county_code");

        // Lookup index for "active codes for county X".
        builder.HasIndex(x => new { x.CountyId, x.LandUseCd, x.IsActive })
            .HasDatabaseName("ix_dict_land_use_county_code_active");

        // Provenance lookups.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_dict_land_use_load_batch");
    }
}
