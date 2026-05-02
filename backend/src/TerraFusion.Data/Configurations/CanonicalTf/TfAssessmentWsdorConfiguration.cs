using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice B4: EF configuration for
/// <see cref="TfAssessmentWsdor"/>. Schema <c>canonical_tf</c>;
/// table <c>tf_assessment_wsdor</c>.
/// </summary>
public sealed class TfAssessmentWsdorConfiguration
    : IEntityTypeConfiguration<TfAssessmentWsdor>
{
    public void Configure(EntityTypeBuilder<TfAssessmentWsdor> builder)
    {
        builder.ToTable("tf_assessment_wsdor", schema: "canonical_tf");

        builder.HasKey(x => x.TfAssessmentWsdorId);
        builder.Property(x => x.TfAssessmentWsdorId).IsRequired();

        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.TfOwnerId).IsRequired();
        builder.Property(x => x.AssessmentYear).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();

        builder.Property(x => x.AssessedVal).HasPrecision(18, 2);
        builder.Property(x => x.MarketVal).HasPrecision(18, 2);
        builder.Property(x => x.AppraisedVal).HasPrecision(18, 2);
        builder.Property(x => x.TaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.TaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.LandTaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.LandTaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.ImprvTaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.ImprvTaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.StateValueClassified).HasPrecision(18, 2);
        builder.Property(x => x.StateValueNonClassified).HasPrecision(18, 2);

        builder.Property(x => x.BoeStatus).HasMaxLength(8);
        builder.Property(x => x.DisasterProrationPct).HasPrecision(7, 4);
        builder.Property(x => x.SnrFrzImprvHs).HasPrecision(18, 2);
        builder.Property(x => x.SnrFrzLandHs).HasPrecision(18, 2);

        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Hot read path: WSDOR roll for a parcel/year.
        builder.HasIndex(x => new { x.TfParcelId, x.AssessmentYear })
            .HasDatabaseName("ix_tf_assessment_wsdor_parcel_year");

        // Reverse: per-owner WSDOR view.
        builder.HasIndex(x => new { x.TfOwnerId, x.AssessmentYear })
            .HasDatabaseName("ix_tf_assessment_wsdor_owner_year");

        // County-isolated reads.
        builder.HasIndex(x => new { x.CountyId, x.AssessmentYear })
            .HasDatabaseName("ix_tf_assessment_wsdor_county_year");

        // Idempotency-key path.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_assessment_wsdor_promotion_batch");

        // BOE status scans.
        builder.HasIndex(x => x.BoeStatus)
            .HasDatabaseName("ix_tf_assessment_wsdor_boe_status");
    }
}
