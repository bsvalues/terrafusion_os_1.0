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

        // SYNC-DOCTRINE-2 (B2): SlCountyRatioCd is now the verbatim
        // raw value from PACS (NULL allowed). Pre-DOCTRINE-2 it was
        // always '100' by construction; the qualification filter has
        // moved to tf_doctrine_ratio_policy + the dual-surface fields.
        builder.Property(x => x.SlCountyRatioCd).HasMaxLength(8);

        // SYNC-DOCTRINE-2 (B2): dual-surface qualification fields.
        builder.Property(x => x.DorRatioQualified).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.CountyRatioReviewed).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.CountyRatioQualified).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.CountyRatioCode).HasMaxLength(8);
        builder.Property(x => x.CountyRatioDescription).HasMaxLength(64);

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

        // G1 (v1.10): conversion-era marker.
        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_truth_pacs_sale_conversion_era");

        // SYNC-DOCTRINE-2 (B2): qualification-aware reads.
        // "show me all DOR-qualified sales" / "show me sales reviewed
        // but not qualified by the county study" should be index-fast.
        builder.HasIndex(x => x.DorRatioQualified)
            .HasDatabaseName("ix_truth_pacs_sale_dor_qualified");
        builder.HasIndex(x => new { x.CountyRatioReviewed, x.CountyRatioQualified })
            .HasDatabaseName("ix_truth_pacs_sale_county_review_qual");
    }
}
