using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// EXEMPTION-FACT-SEAL: EF config for <see cref="TfExemption"/>.
/// Schema <c>canonical_tf</c>; table <c>tf_exemption</c>.
/// </summary>
public sealed class TfExemptionConfiguration
    : IEntityTypeConfiguration<TfExemption>
{
    public void Configure(EntityTypeBuilder<TfExemption> builder)
    {
        builder.ToTable("tf_exemption", schema: "canonical_tf");

        builder.HasKey(x => x.TfExemptionId);
        builder.Property(x => x.TfExemptionId).IsRequired();

        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.SourcePropId).IsRequired();
        builder.Property(x => x.SourceOwnerId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.ExmptTypeCd).HasMaxLength(16).IsRequired();
        builder.Property(x => x.ExmptSubtypeCd).HasMaxLength(16);
        builder.Property(x => x.ExemptionPct).HasPrecision(9, 4);
        builder.Property(x => x.SupNum).IsRequired();

        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Business grain: parcel + tax year (+ type) hot read.
        builder.HasIndex(x => new { x.TfParcelId, x.TaxYr })
            .HasDatabaseName("ix_tf_exemption_parcel_year");
        builder.HasIndex(x => new { x.CountyId, x.TaxYr })
            .HasDatabaseName("ix_tf_exemption_county_year");
        builder.HasIndex(x => x.ExmptTypeCd)
            .HasDatabaseName("ix_tf_exemption_type");
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_exemption_promotion_batch");

        builder.Property(x => x.ConversionEra).HasMaxLength(20);
    }
}
