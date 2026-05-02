using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyTfUnproven;

namespace TerraFusion.Data.Configurations.LegacyTfUnproven;

/// <summary>
/// Slice C1-C: EF configuration for
/// <see cref="LegacyTfUnprovenImprvAttr"/>. Schema
/// <c>legacy_tf_unproven</c>; table <c>unresolved_imprv_attr</c>.
/// </summary>
public sealed class LegacyTfUnprovenImprvAttrConfiguration
    : IEntityTypeConfiguration<LegacyTfUnprovenImprvAttr>
{
    public void Configure(EntityTypeBuilder<LegacyTfUnprovenImprvAttr> builder)
    {
        builder.ToTable("unresolved_imprv_attr", schema: "legacy_tf_unproven");

        builder.HasKey(x => x.UnprovenRowId);
        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.ImprvId).IsRequired();
        builder.Property(x => x.ImprvDetId).IsRequired();
        builder.Property(x => x.IAttrValId).IsRequired();

        builder.Property(x => x.IAttrValCd).HasMaxLength(32).IsRequired();
        builder.Property(x => x.AttrValueText).HasMaxLength(255);
        builder.Property(x => x.AttrValueNumeric).HasPrecision(18, 4);

        builder.Property(x => x.LandingLoadBatchId).IsRequired();
        builder.Property(x => x.QuarantineReason).HasMaxLength(50).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        // Audit reads by quarantine reason.
        builder.HasIndex(x => x.QuarantineReason)
            .HasDatabaseName("ix_legacy_tf_unproven_imprv_attr_reason");

        // Audit by code (which code is failing the dictionary?).
        builder.HasIndex(x => x.IAttrValCd)
            .HasDatabaseName("ix_legacy_tf_unproven_imprv_attr_code");

        builder.HasIndex(x => x.LandingLoadBatchId)
            .HasDatabaseName("ix_legacy_tf_unproven_imprv_attr_landingbatch");
    }
}
