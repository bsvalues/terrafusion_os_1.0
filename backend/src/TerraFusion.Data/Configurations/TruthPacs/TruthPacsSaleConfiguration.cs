using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// Slice S2-B: EF configuration for
/// <see cref="TruthPacsSale"/>. Schema <c>truth_pacs</c> on Postgres.
/// </summary>
public sealed class TruthPacsSaleConfiguration : IEntityTypeConfiguration<TruthPacsSale>
{
    public void Configure(EntityTypeBuilder<TruthPacsSale> builder)
    {
        builder.ToTable("sale", schema: "truth_pacs");

        builder.HasKey(x => x.TruthSaleId);
        builder.Property(x => x.TruthSaleId).IsRequired();

        builder.Property(x => x.ChgOfOwnerId).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();

        builder.Property(x => x.SlCountyRatioCd).HasMaxLength(8).IsRequired();

        builder.Property(x => x.SlPrice).HasPrecision(18, 2);
        builder.Property(x => x.AdjSlPrice).HasPrecision(18, 2);

        builder.Property(x => x.SourceSaleLandedRowId).IsRequired();
        builder.Property(x => x.SourceSuppAssocLandedRowId).IsRequired();
        builder.Property(x => x.SaleLoadBatchId).IsRequired();
        builder.Property(x => x.SuppAssocLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();

        builder.Property(x => x.PromotedAt).IsRequired();

        // Idempotency-key path: re-promoting a sale batch deletes by
        // (SaleLoadBatchId, ChgOfOwnerId).
        builder.HasIndex(x => new { x.SaleLoadBatchId, x.ChgOfOwnerId })
            .HasDatabaseName("ix_truth_pacs_sale_salebatch_chgofowner");

        // Read by sale identity.
        builder.HasIndex(x => x.ChgOfOwnerId)
            .HasDatabaseName("ix_truth_pacs_sale_chgofowner");

        // Lineage lookup.
        builder.HasIndex(x => x.SourceSaleLandedRowId)
            .HasDatabaseName("ix_truth_pacs_sale_source_sale_landed");
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_sale_promotion_batch");

        // Date-range scans.
        builder.HasIndex(x => x.SlDt)
            .HasDatabaseName("ix_truth_pacs_sale_sl_dt");
    }
}
