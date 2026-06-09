using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): EF configuration for
/// <see cref="DictLandState"/>. Schema <c>canonical_tf</c>;
/// table <c>dict_land_state</c>.
///
/// <para>Mirrors <see cref="DictNeighborhoodConfiguration"/>
/// exactly. <c>(CountyId, LandStateCd)</c> is the natural unique
/// key.</para>
/// </summary>
public sealed class DictLandStateConfiguration
    : IEntityTypeConfiguration<DictLandState>
{
    public void Configure(EntityTypeBuilder<DictLandState> builder)
    {
        builder.ToTable("dict_land_state", schema: "canonical_tf");

        builder.HasKey(x => x.DictLandStateId);
        builder.Property(x => x.DictLandStateId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.LandStateCd)
            .IsRequired()
            .HasMaxLength(10);
        builder.Property(x => x.Description).HasMaxLength(1000);

        builder.Property(x => x.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => new { x.CountyId, x.LandStateCd })
            .IsUnique()
            .HasDatabaseName("ux_dict_land_state_county_code");

        builder.HasIndex(x => new { x.CountyId, x.LandStateCd, x.IsActive })
            .HasDatabaseName("ix_dict_land_state_county_code_active");

        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_dict_land_state_load_batch");
    }
}
