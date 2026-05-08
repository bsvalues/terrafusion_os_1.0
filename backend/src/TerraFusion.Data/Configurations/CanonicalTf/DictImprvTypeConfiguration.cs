using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): EF configuration for
/// <see cref="DictImprvType"/>. Schema <c>canonical_tf</c>;
/// table <c>dict_imprv_type</c>.
///
/// <para>Mirrors <see cref="DictNeighborhoodConfiguration"/>
/// exactly. <c>(CountyId, ImprvTypeCd)</c> is the natural unique
/// key.</para>
/// </summary>
public sealed class DictImprvTypeConfiguration
    : IEntityTypeConfiguration<DictImprvType>
{
    public void Configure(EntityTypeBuilder<DictImprvType> builder)
    {
        builder.ToTable("dict_imprv_type", schema: "canonical_tf");

        builder.HasKey(x => x.DictImprvTypeId);
        builder.Property(x => x.DictImprvTypeId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.ImprvTypeCd)
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

        builder.HasIndex(x => new { x.CountyId, x.ImprvTypeCd })
            .IsUnique()
            .HasDatabaseName("ux_dict_imprv_type_county_code");

        builder.HasIndex(x => new { x.CountyId, x.ImprvTypeCd, x.IsActive })
            .HasDatabaseName("ix_dict_imprv_type_county_code_active");

        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_dict_imprv_type_load_batch");
    }
}
