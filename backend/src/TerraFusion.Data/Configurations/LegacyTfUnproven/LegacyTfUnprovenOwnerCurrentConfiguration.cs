using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyTfUnproven;

namespace TerraFusion.Data.Configurations.LegacyTfUnproven;

/// <summary>
/// Slice B3: EF configuration for
/// <see cref="LegacyTfUnprovenOwnerCurrent"/>. Schema
/// <c>legacy_tf_unproven</c>; table <c>owner_current</c>.
/// </summary>
public sealed class LegacyTfUnprovenOwnerCurrentConfiguration
    : IEntityTypeConfiguration<LegacyTfUnprovenOwnerCurrent>
{
    public void Configure(EntityTypeBuilder<LegacyTfUnprovenOwnerCurrent> builder)
    {
        builder.ToTable("owner_current", schema: "legacy_tf_unproven");

        builder.HasKey(x => x.UnprovenRowId);
        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerTaxYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();
        builder.Property(x => x.AcctId).IsRequired();

        builder.Property(x => x.FileAsName).HasMaxLength(200);

        builder.Property(x => x.SourceTruthOwnerCurrentId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.QuarantineReason).HasMaxLength(50).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_legacy_tf_unproven_owner_current_promotion_batch");
        builder.HasIndex(x => x.QuarantineReason)
            .HasDatabaseName("ix_legacy_tf_unproven_owner_current_reason");
        builder.HasIndex(x => x.PropId)
            .HasDatabaseName("ix_legacy_tf_unproven_owner_current_propid");
    }
}
