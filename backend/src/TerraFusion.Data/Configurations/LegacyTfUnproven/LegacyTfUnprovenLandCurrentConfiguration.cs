using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyTfUnproven;

namespace TerraFusion.Data.Configurations.LegacyTfUnproven;

/// <summary>
/// Slice L3: EF configuration for
/// <see cref="LegacyTfUnprovenLandCurrent"/>. Schema
/// <c>legacy_tf_unproven</c>; table <c>land_current</c>.
/// </summary>
public sealed class LegacyTfUnprovenLandCurrentConfiguration
    : IEntityTypeConfiguration<LegacyTfUnprovenLandCurrent>
{
    public void Configure(EntityTypeBuilder<LegacyTfUnprovenLandCurrent> builder)
    {
        builder.ToTable("land_current", schema: "legacy_tf_unproven");

        builder.HasKey(x => x.UnprovenRowId);
        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.LandSegId).IsRequired();

        builder.Property(x => x.LandSegTypeCd).HasMaxLength(8);
        builder.Property(x => x.LandSegUseCd).HasMaxLength(16);
        builder.Property(x => x.SizeAcres).HasPrecision(18, 4);
        builder.Property(x => x.LandSegMarketVal).HasPrecision(18, 2);

        builder.Property(x => x.SourceTruthLandId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.QuarantineReason).HasMaxLength(50).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_legacy_tf_unproven_land_promotion_batch");
        builder.HasIndex(x => x.QuarantineReason)
            .HasDatabaseName("ix_legacy_tf_unproven_land_reason");
        builder.HasIndex(x => x.PropId)
            .HasDatabaseName("ix_legacy_tf_unproven_land_propid");
    }
}
