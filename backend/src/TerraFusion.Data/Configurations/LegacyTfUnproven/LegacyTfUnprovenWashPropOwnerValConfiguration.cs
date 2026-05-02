using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyTfUnproven;

namespace TerraFusion.Data.Configurations.LegacyTfUnproven;

/// <summary>
/// Slice B4: EF configuration for
/// <see cref="LegacyTfUnprovenWashPropOwnerVal"/>. Schema
/// <c>legacy_tf_unproven</c>; table <c>wash_prop_owner_val</c>.
/// </summary>
public sealed class LegacyTfUnprovenWashPropOwnerValConfiguration
    : IEntityTypeConfiguration<LegacyTfUnprovenWashPropOwnerVal>
{
    public void Configure(EntityTypeBuilder<LegacyTfUnprovenWashPropOwnerVal> builder)
    {
        builder.ToTable("wash_prop_owner_val", schema: "legacy_tf_unproven");

        builder.HasKey(x => x.UnprovenRowId);
        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();

        builder.Property(x => x.AssessedVal).HasPrecision(18, 2);
        builder.Property(x => x.MarketVal).HasPrecision(18, 2);
        builder.Property(x => x.BoeStatus).HasMaxLength(8);

        builder.Property(x => x.SourceTruthWpovId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.QuarantineReason).HasMaxLength(50).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_legacy_tf_unproven_wpov_promotion_batch");
        builder.HasIndex(x => x.QuarantineReason)
            .HasDatabaseName("ix_legacy_tf_unproven_wpov_reason");
        builder.HasIndex(x => x.PropId)
            .HasDatabaseName("ix_legacy_tf_unproven_wpov_propid");
    }
}
