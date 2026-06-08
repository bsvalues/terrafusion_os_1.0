using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>REVENUE-SPINE: EF config for canonical_tf.tf_tax_bill_current.</summary>
public sealed class TfTaxBillCurrentConfiguration : IEntityTypeConfiguration<TfTaxBillCurrent>
{
    public void Configure(EntityTypeBuilder<TfTaxBillCurrent> builder)
    {
        builder.ToTable("tf_tax_bill_current", schema: "canonical_tf");
        builder.HasKey(x => x.TfTaxBillCurrentId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.SourcePropId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.TotalTaxableVal).HasPrecision(18, 2);
        builder.Property(x => x.TotalCurrentAmountDue).HasPrecision(18, 2);
        builder.Property(x => x.TotalAmountPaid).HasPrecision(18, 2);
        builder.Property(x => x.TotalBalanceAmount).HasPrecision(18, 2);
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.HasIndex(x => new { x.TfParcelId, x.TaxYr })
            .HasDatabaseName("ix_tf_tax_bill_current_parcel_year");
        builder.HasIndex(x => new { x.CountyId, x.TaxYr })
            .HasDatabaseName("ix_tf_tax_bill_current_county_year");
        builder.HasIndex(x => x.PromotionLoadBatchId).HasDatabaseName("ix_tf_tax_bill_current_promotion_batch");
    }
}
