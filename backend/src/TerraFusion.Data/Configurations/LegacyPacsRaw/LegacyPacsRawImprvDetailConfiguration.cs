using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice C1-B: EF configuration for
/// <see cref="LegacyPacsRawImprvDetail"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>imprv_detail</c>.
/// </summary>
public sealed class LegacyPacsRawImprvDetailConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawImprvDetail>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawImprvDetail> builder)
    {
        builder.ToTable("imprv_detail", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.ImprvId).IsRequired();
        builder.Property(x => x.ImprvDetId).IsRequired();

        builder.Property(x => x.ImprvDetTypeCd).HasMaxLength(16);
        builder.Property(x => x.ImprvDetMethCd).HasMaxLength(16);
        builder.Property(x => x.ImprvDetClassCd).HasMaxLength(16);
        builder.Property(x => x.ImprvDetSubClassCd).HasMaxLength(16);
        builder.Property(x => x.ConditionCd).HasMaxLength(8);

        builder.Property(x => x.ImprvDetArea).HasPrecision(18, 2);
        builder.Property(x => x.ImprvDetVal).HasPrecision(18, 2);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by the 5-key composite — for joining back to the
        // parent imprv row.
        builder.HasIndex(x => new { x.PropId, x.PropValYr, x.SupNum, x.ImprvId, x.ImprvDetId })
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_detail_5key");

        // Type-cd scans (Benton-Method secondary-feature reads).
        builder.HasIndex(x => x.ImprvDetTypeCd)
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_detail_type");

        // Re-runs / rollback.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_detail_loadbatch");
    }
}
