using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): EF configuration for
/// <see cref="DictExemptionType"/>. Schema <c>canonical_tf</c>;
/// table <c>dict_exemption_type</c>.
///
/// <para>Mirrors <see cref="DictNeighborhoodConfiguration"/>
/// exactly. <c>(CountyId, ExemptionTypeCd)</c> is the natural
/// unique key.</para>
/// </summary>
public sealed class DictExemptionTypeConfiguration
    : IEntityTypeConfiguration<DictExemptionType>
{
    public void Configure(EntityTypeBuilder<DictExemptionType> builder)
    {
        builder.ToTable("dict_exemption_type", schema: "canonical_tf");

        builder.HasKey(x => x.DictExemptionTypeId);
        builder.Property(x => x.DictExemptionTypeId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.ExemptionTypeCd)
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

        builder.HasIndex(x => new { x.CountyId, x.ExemptionTypeCd })
            .IsUnique()
            .HasDatabaseName("ux_dict_exemption_type_county_code");

        builder.HasIndex(x => new { x.CountyId, x.ExemptionTypeCd, x.IsActive })
            .HasDatabaseName("ix_dict_exemption_type_county_code_active");

        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_dict_exemption_type_load_batch");
    }
}
