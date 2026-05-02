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
    }
}
