using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice C1-A: EF configuration for
/// <see cref="LegacyPacsRawImprv"/>. Schema <c>legacy_pacs_raw</c>;
/// table <c>imprv</c>.
///
/// <para>Note: PACS enforces UNIQUE(<c>prop_val_yr, sup_num, prop_id,
/// imprv_id</c>). The landing layer deliberately does NOT enforce
/// that constraint at the database level so the
/// <c>imprv-key-uniqueness</c> gate can FAIL the batch with the
/// actual duplicate count rather than crashing on insert.</para>
/// </summary>
public sealed class LegacyPacsRawImprvConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawImprv>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawImprv> builder)
    {
        builder.ToTable("imprv", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.ImprvId).IsRequired();

        builder.Property(x => x.ImprvTypeCd).HasMaxLength(8);
        builder.Property(x => x.ImprvStateCd).HasMaxLength(8);
        builder.Property(x => x.ImprvClassCd).HasMaxLength(8);
        builder.Property(x => x.ImprvHomesite).HasMaxLength(2);
        builder.Property(x => x.ImprvDesc).HasMaxLength(500);

        builder.Property(x => x.ImprvVal).HasPrecision(18, 2);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by the 4-key composite — the per-improvement-by-parcel
        // join key.
        builder.HasIndex(x => new { x.PropId, x.PropValYr, x.SupNum, x.ImprvId })
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_4key");

        // Re-runs / rollback.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_loadbatch");

        // Type-code scans (audit + downstream truth filter).
        builder.HasIndex(x => x.ImprvTypeCd)
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_type");
    }
}
