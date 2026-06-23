using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>REVENUE-SPINE: EF config for canonical_tf.tf_tax_bill_line.</summary>
public sealed class TfTaxBillLineConfiguration : IEntityTypeConfiguration<TfTaxBillLine>
{
    public void Configure(EntityTypeBuilder<TfTaxBillLine> builder)
    {
        builder.ToTable("tf_tax_bill_line", schema: "canonical_tf");
        builder.HasKey(x => x.TfTaxBillLineId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.SourcePropId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.BillId).IsRequired();
        builder.Property(x => x.BillType).HasMaxLength(8);
        builder.Property(x => x.LevyCd).HasMaxLength(32);
        builder.Property(x => x.TaxableVal).HasPrecision(18, 2);
        builder.Property(x => x.LevyRate).HasPrecision(18, 8);
        builder.Property(x => x.CurrentAmountDue).HasPrecision(18, 2);
        builder.Property(x => x.AmountPaid).HasPrecision(18, 2);
        builder.Property(x => x.BalanceAmount).HasPrecision(18, 2);
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64);
        builder.HasIndex(x => new { x.TfParcelId, x.TaxYr })
            .HasDatabaseName("ix_tf_tax_bill_line_parcel_year");
        builder.HasIndex(x => new { x.CountyId, x.TaxYr, x.TaxDistrictId })
            .HasDatabaseName("ix_tf_tax_bill_line_county_year_district");
        builder.HasIndex(x => x.BillId).HasDatabaseName("ix_tf_tax_bill_line_billid");
        builder.HasIndex(x => x.PromotionLoadBatchId).HasDatabaseName("ix_tf_tax_bill_line_promotion_batch");
    }
}
