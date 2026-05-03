using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyTfUnproven;

namespace TerraFusion.Data.Configurations.LegacyTfUnproven;

/// <summary>
/// Slice C3: EF configuration for
/// <see cref="LegacyTfUnprovenImprvCurrent"/>. Schema
/// <c>legacy_tf_unproven</c>; table <c>imprv_current</c>.
/// </summary>
public sealed class LegacyTfUnprovenImprvCurrentConfiguration
    : IEntityTypeConfiguration<LegacyTfUnprovenImprvCurrent>
{
    public void Configure(EntityTypeBuilder<LegacyTfUnprovenImprvCurrent> builder)
    {
        builder.ToTable("imprv_current", schema: "legacy_tf_unproven");

        builder.HasKey(x => x.UnprovenRowId);
        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.ImprvId).IsRequired();

        builder.Property(x => x.ImprvTypeCd).HasMaxLength(8);
        builder.Property(x => x.ImprvDesc).HasMaxLength(500);
        builder.Property(x => x.ImprvVal).HasPrecision(18, 2);

        builder.Property(x => x.SourceTruthImprvId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.QuarantineReason).HasMaxLength(50).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_legacy_tf_unproven_imprv_promotion_batch");
        builder.HasIndex(x => x.QuarantineReason)
            .HasDatabaseName("ix_legacy_tf_unproven_imprv_reason");
        builder.HasIndex(x => x.PropId)
            .HasDatabaseName("ix_legacy_tf_unproven_imprv_propid");
    }
}
