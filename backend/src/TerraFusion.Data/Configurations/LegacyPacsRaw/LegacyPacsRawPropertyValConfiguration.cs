using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V4: EF configuration for
/// <see cref="LegacyPacsRawPropertyVal"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>property_val</c>.
/// </summary>
public sealed class LegacyPacsRawPropertyValConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawPropertyVal>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawPropertyVal> builder)
    {
        builder.ToTable("property_val", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();

        // Benton dominant property_use_cd values are 2-3 chars; width 16 is generous.
        builder.Property(x => x.PropertyUseCd).HasMaxLength(16);

        builder.Property(x => x.PropInactiveDt);

        // ASSESSMENT-VALUE-SEAL: nullable assessment values (NULL on the
        // classification-only landing; populated by the active-supplement
        // assessment landing).
        builder.Property(x => x.AssessedVal).HasPrecision(18, 2);
        builder.Property(x => x.AppraisedVal).HasPrecision(18, 2);
        builder.Property(x => x.MarketVal).HasPrecision(18, 2);
        builder.Property(x => x.LandHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.LandNonHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.ImprvHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.ImprvNonHstdVal).HasPrecision(18, 2);
        builder.Property(x => x.AgUseVal).HasPrecision(18, 2);
        builder.Property(x => x.AgMarketVal).HasPrecision(18, 2);
        builder.Property(x => x.TimberUseVal).HasPrecision(18, 2);
        builder.Property(x => x.TimberMarketVal).HasPrecision(18, 2);
        builder.Property(x => x.HsCapNewVal).HasPrecision(18, 2);
        builder.Property(x => x.HsCapPrevVal).HasPrecision(18, 2);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by the 3-key composite — for joining back to imprv during promotion.
        builder.HasIndex(x => new { x.PropId, x.PropValYr, x.SupNum })
            .HasDatabaseName("ix_legacy_pacs_raw_property_val_3key");

        // Use-cd scans (commercial-vs-residential split).
        builder.HasIndex(x => x.PropertyUseCd)
            .HasDatabaseName("ix_legacy_pacs_raw_property_val_use_cd");

        // Re-runs / rollback.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_property_val_loadbatch");
    }
}
