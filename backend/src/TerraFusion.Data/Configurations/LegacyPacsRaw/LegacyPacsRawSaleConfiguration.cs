using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice S1: EF configuration for
/// <see cref="LegacyPacsRawSale"/>. Schema <c>legacy_pacs_raw</c> on
/// Postgres; flattened table name on SQLite.
/// </summary>
public sealed class LegacyPacsRawSaleConfiguration : IEntityTypeConfiguration<LegacyPacsRawSale>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawSale> builder)
    {
        builder.ToTable("sale", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.ChgOfOwnerId).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();

        // SYNC-POP-2 finding #6: original fixture caps were 8/8/8, but real
        // Harris PACS column widths (per PacsSale entity attributes) are:
        //   sl_county_ratio_cd → 10
        //   wac_cd             → 32
        //   sl_ratio_type_cd   → 5  (kept at 8 here for headroom)
        // Widened to match source-system reality. The legacy_pacs_raw.sale
        // table is the raw landing zone and must accept whatever PACS emits;
        // truncation here would corrupt the audit anchor.
        builder.Property(x => x.SlCountyRatioCd).HasMaxLength(10);
        builder.Property(x => x.WacCd).HasMaxLength(32);
        builder.Property(x => x.SlRatioTypeCd).HasMaxLength(8);

        builder.Property(x => x.SlPrice).HasPrecision(18, 2);
        builder.Property(x => x.AdjSlPrice).HasPrecision(18, 2);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();

        builder.Property(x => x.LandedAt).IsRequired();

        // Look up sales by their PACS identity.
        builder.HasIndex(x => x.ChgOfOwnerId)
            .HasDatabaseName("ix_legacy_pacs_raw_sale_chgofowner");

        // Read sales by load batch (for re-runs / rollback).
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_sale_loadbatch");

        // Distribution queries by qualification axis.
        builder.HasIndex(x => x.SlCountyRatioCd)
            .HasDatabaseName("ix_legacy_pacs_raw_sale_county_ratio_cd");

        // Cutover-aware date-range scans.
        builder.HasIndex(x => x.SlDt)
            .HasDatabaseName("ix_legacy_pacs_raw_sale_sl_dt");
    }
}
