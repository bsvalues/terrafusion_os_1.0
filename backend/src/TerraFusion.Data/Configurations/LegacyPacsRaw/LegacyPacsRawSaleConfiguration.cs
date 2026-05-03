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

        builder.Property(x => x.SlCountyRatioCd).HasMaxLength(8);
        builder.Property(x => x.WacCd).HasMaxLength(8);
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
