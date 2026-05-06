using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice S3: EF configuration for
/// <see cref="TfSale"/>. Schema <c>canonical_tf</c>; table <c>tf_sale</c>.
/// </summary>
public sealed class TfSaleConfiguration : IEntityTypeConfiguration<TfSale>
{
    public void Configure(EntityTypeBuilder<TfSale> builder)
    {
        builder.ToTable("tf_sale", schema: "canonical_tf");

        builder.HasKey(x => x.TfSaleId);
        builder.Property(x => x.TfSaleId).IsRequired();

        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.ChgOfOwnerId).IsRequired();

        builder.Property(x => x.SlPrice).HasPrecision(18, 2);
        builder.Property(x => x.AdjSlPrice).HasPrecision(18, 2);

        builder.Property(x => x.PromotionLoadBatchId).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Idempotency-key path: re-projecting a truth batch deletes
        // by (PromotionLoadBatchId, ChgOfOwnerId).
        builder.HasIndex(x => new { x.PromotionLoadBatchId, x.ChgOfOwnerId })
            .HasDatabaseName("ix_tf_sale_promotionbatch_chgofowner");

        // County-isolated reads.
        builder.HasIndex(x => new { x.CountyId, x.SlDt })
            .HasDatabaseName("ix_tf_sale_county_sl_dt");

        // Parcel→sales lookup.
        builder.HasIndex(x => x.TfParcelId)
            .HasDatabaseName("ix_tf_sale_parcel");

        // Identity lookup.
        builder.HasIndex(x => x.ChgOfOwnerId)
            .HasDatabaseName("ix_tf_sale_chgofowner");

        // G2 (v1.11): conversion-era marker.
        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_tf_sale_conversion_era");

        // SYNC-DOCTRINE-2 (B2): dual-surface qualification fields.
        // SaleQualified is a derived back-compat column (DOR OR County).
        builder.Property(x => x.SaleQualified).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.DorRatioQualified).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.CountyRatioReviewed).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.CountyRatioQualified).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.CountyRatioCode).HasMaxLength(8);
        builder.Property(x => x.CountyRatioDescription).HasMaxLength(64);

        // Qualification-aware reads.
        builder.HasIndex(x => x.DorRatioQualified)
            .HasDatabaseName("ix_tf_sale_dor_qualified");
        builder.HasIndex(x => new { x.CountyRatioReviewed, x.CountyRatioQualified })
            .HasDatabaseName("ix_tf_sale_county_review_qual");
    }
}
