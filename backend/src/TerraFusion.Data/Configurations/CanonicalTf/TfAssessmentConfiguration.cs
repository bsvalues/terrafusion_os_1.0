using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// ASSESSMENT-VALUE-SEAL: EF configuration for
/// <see cref="TfAssessment"/>. Schema <c>canonical_tf</c>;
/// table <c>tf_assessment</c>.
/// </summary>
public sealed class TfAssessmentConfiguration
    : IEntityTypeConfiguration<TfAssessment>
{
    public void Configure(EntityTypeBuilder<TfAssessment> builder)
    {
        builder.ToTable("tf_assessment", schema: "canonical_tf");

        builder.HasKey(x => x.TfAssessmentId);
        builder.Property(x => x.TfAssessmentId).IsRequired();

        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.AssessmentYear).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();

        builder.Property(x => x.AssessedVal).HasPrecision(18, 2);
        builder.Property(x => x.AppraisedVal).HasPrecision(18, 2);
        builder.Property(x => x.MarketVal).HasPrecision(18, 2);
        builder.Property(x => x.LandHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.LandNonHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.ImprvHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.ImprvNonHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.AgUseVal).HasPrecision(18, 2);
        builder.Property(x => x.AgMarketVal).HasPrecision(18, 2);
        builder.Property(x => x.TimberUseVal).HasPrecision(18, 2);
        builder.Property(x => x.TimberMarketVal).HasPrecision(18, 2);
        builder.Property(x => x.HsCapNewVal).HasPrecision(18, 2);
        builder.Property(x => x.HsCapPrevVal).HasPrecision(18, 2);

        builder.Property(x => x.PropertyUseCd).HasMaxLength(16);

        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Hot read path: assessment for a parcel/year.
        builder.HasIndex(x => new { x.TfParcelId, x.AssessmentYear })
            .HasDatabaseName("ix_tf_assessment_parcel_year");

        // County-isolated reads.
        builder.HasIndex(x => new { x.CountyId, x.AssessmentYear })
            .HasDatabaseName("ix_tf_assessment_county_year");

        // Idempotency-key path.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_assessment_promotion_batch");

        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_tf_assessment_conversion_era");
    }
}
