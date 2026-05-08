using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): EF configuration for
/// <see cref="DictImprvState"/>. Schema <c>canonical_tf</c>;
/// table <c>dict_imprv_state</c>.
///
/// <para>Mirrors <see cref="DictNeighborhoodConfiguration"/>
/// exactly. <c>(CountyId, ImprvStateCd)</c> is the natural unique
/// key.</para>
/// </summary>
public sealed class DictImprvStateConfiguration
    : IEntityTypeConfiguration<DictImprvState>
{
    public void Configure(EntityTypeBuilder<DictImprvState> builder)
    {
        builder.ToTable("dict_imprv_state", schema: "canonical_tf");

        builder.HasKey(x => x.DictImprvStateId);
        builder.Property(x => x.DictImprvStateId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.ImprvStateCd)
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

        builder.HasIndex(x => new { x.CountyId, x.ImprvStateCd })
            .IsUnique()
            .HasDatabaseName("ux_dict_imprv_state_county_code");

        builder.HasIndex(x => new { x.CountyId, x.ImprvStateCd, x.IsActive })
            .HasDatabaseName("ix_dict_imprv_state_county_code_active");

        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_dict_imprv_state_load_batch");
    }
}
