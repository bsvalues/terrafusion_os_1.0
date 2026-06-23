using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// ASSESSMENT-VALUE-SEAL: EF configuration for
/// <see cref="TruthPacsAssessmentCurrent"/>. Schema <c>truth_pacs</c>;
/// table <c>assessment_current</c>.
/// </summary>
public sealed class TruthPacsAssessmentCurrentConfiguration
    : IEntityTypeConfiguration<TruthPacsAssessmentCurrent>
{
    public void Configure(EntityTypeBuilder<TruthPacsAssessmentCurrent> builder)
    {
        builder.ToTable("assessment_current", schema: "truth_pacs");

        builder.HasKey(x => x.TruthAssessmentId);
        builder.Property(x => x.TruthAssessmentId).IsRequired();

        builder.Property(x => x.PropId).IsRequired();
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

        builder.Property(x => x.SourcePropertyValLandedRowId).IsRequired();
        builder.Property(x => x.PropertyValLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // Natural-key idempotency / hot read path.
        builder.HasIndex(x => new { x.PropId, x.AssessmentYear })
            .HasDatabaseName("ix_truth_pacs_assessment_prop_year");

        // Lineage lookup.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_assessment_promotion_batch");

        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_truth_pacs_assessment_conversion_era");
    }
}
