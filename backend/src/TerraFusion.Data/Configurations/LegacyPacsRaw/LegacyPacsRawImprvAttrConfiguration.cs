using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice C1-C: EF configuration for
/// <see cref="LegacyPacsRawImprvAttr"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>imprv_attr</c>.
/// </summary>
public sealed class LegacyPacsRawImprvAttrConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawImprvAttr>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawImprvAttr> builder)
    {
        builder.ToTable("imprv_attr", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.ImprvId).IsRequired();
        builder.Property(x => x.ImprvDetId).IsRequired();
        builder.Property(x => x.IAttrValId).IsRequired();

        builder.Property(x => x.IAttrValCd).HasMaxLength(32).IsRequired();
        builder.Property(x => x.AttrValueText).HasMaxLength(255);
        builder.Property(x => x.AttrValueNumeric).HasPrecision(18, 4);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // 6-key index for join back to imprv_detail.
        builder.HasIndex(x => new
        {
            x.PropId, x.PropValYr, x.SupNum, x.ImprvId, x.ImprvDetId, x.IAttrValId,
        }).HasDatabaseName("ix_legacy_pacs_raw_imprv_attr_6key");

        // Read by code (for downstream feature-set filtering).
        builder.HasIndex(x => x.IAttrValCd)
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_attr_code");

        // Re-runs / rollback.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_imprv_attr_loadbatch");
    }
}
