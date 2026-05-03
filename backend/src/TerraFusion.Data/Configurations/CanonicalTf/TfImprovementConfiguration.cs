using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice C3: EF configuration for
/// <see cref="TfImprovement"/>. Schema <c>canonical_tf</c>; table
/// <c>tf_improvement</c>.
/// </summary>
public sealed class TfImprovementConfiguration : IEntityTypeConfiguration<TfImprovement>
{
    public void Configure(EntityTypeBuilder<TfImprovement> builder)
    {
        builder.ToTable("tf_improvement", schema: "canonical_tf");

        builder.HasKey(x => x.TfImprovementId);
        builder.Property(x => x.TfImprovementId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();

        builder.Property(x => x.ImprvTypeCd).HasMaxLength(8);
        builder.Property(x => x.ImprvClassCd).HasMaxLength(8);
        builder.Property(x => x.ImprvDesc).HasMaxLength(500);
        builder.Property(x => x.ImprvVal).HasPrecision(18, 2);

        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => x.CountyId)
            .HasDatabaseName("ix_tf_improvement_county");
        builder.HasIndex(x => x.TfParcelId)
            .HasDatabaseName("ix_tf_improvement_parcel");
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_improvement_promotion_batch");
        builder.HasIndex(x => x.ImprvTypeCd)
            .HasDatabaseName("ix_tf_improvement_type");

        // G2 (v1.11): conversion-era marker.
        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_tf_improvement_conversion_era");
    }
}
