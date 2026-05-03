using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyTfUnproven;

namespace TerraFusion.Data.Configurations.LegacyTfUnproven;

/// <summary>
/// Slice S3: EF configuration for
/// <see cref="LegacyTfUnprovenSale"/>. Schema <c>legacy_tf_unproven</c>;
/// table <c>sale</c>.
/// </summary>
public sealed class LegacyTfUnprovenSaleConfiguration : IEntityTypeConfiguration<LegacyTfUnprovenSale>
{
    public void Configure(EntityTypeBuilder<LegacyTfUnprovenSale> builder)
    {
        builder.ToTable("sale", schema: "legacy_tf_unproven");

        builder.HasKey(x => x.UnprovenRowId);
        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.ChgOfOwnerId).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();

        builder.Property(x => x.SlPrice).HasPrecision(18, 2);
        builder.Property(x => x.AdjSlPrice).HasPrecision(18, 2);

        builder.Property(x => x.SourceTruthSaleId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();

        builder.Property(x => x.QuarantineReason).HasMaxLength(50).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_legacy_tf_unproven_sale_promotionbatch");
        builder.HasIndex(x => x.QuarantineReason)
            .HasDatabaseName("ix_legacy_tf_unproven_sale_reason");
        builder.HasIndex(x => x.PropId)
            .HasDatabaseName("ix_legacy_tf_unproven_sale_propid");
    }
}
