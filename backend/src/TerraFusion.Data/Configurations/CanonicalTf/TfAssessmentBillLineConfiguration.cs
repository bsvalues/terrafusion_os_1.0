using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>REVENUE-SPINE Stage 2B: EF config for canonical_tf.tf_assessment_bill_line.</summary>
public sealed class TfAssessmentBillLineConfiguration : IEntityTypeConfiguration<TfAssessmentBillLine>
{
    public void Configure(EntityTypeBuilder<TfAssessmentBillLine> builder)
    {
        builder.ToTable("tf_assessment_bill_line", schema: "canonical_tf");
        builder.HasKey(x => x.TfAssessmentBillLineId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.SourcePropId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.BillId).IsRequired();
        builder.Property(x => x.BillType).HasMaxLength(8);
        builder.Property(x => x.AgencyId).IsRequired();
        builder.Property(x => x.AssessmentCd).HasMaxLength(64);
        builder.Property(x => x.CurrentAmountDue).HasPrecision(18, 2);
        builder.Property(x => x.AmountPaid).HasPrecision(18, 2);
        builder.Property(x => x.BalanceAmount).HasPrecision(18, 2);
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64);
        builder.HasIndex(x => new { x.TfParcelId, x.TaxYr })
            .HasDatabaseName("ix_tf_assessment_bill_line_parcel_year");
        builder.HasIndex(x => new { x.CountyId, x.TaxYr, x.AgencyId })
            .HasDatabaseName("ix_tf_assessment_bill_line_county_year_agency");
        builder.HasIndex(x => x.BillId).HasDatabaseName("ix_tf_assessment_bill_line_billid");
        builder.HasIndex(x => x.PromotionLoadBatchId).HasDatabaseName("ix_tf_assessment_bill_line_promotion_batch");
    }
}
