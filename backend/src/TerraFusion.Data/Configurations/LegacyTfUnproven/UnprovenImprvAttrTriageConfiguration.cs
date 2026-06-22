using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyTfUnproven;

namespace TerraFusion.Data.Configurations.LegacyTfUnproven;

/// <summary>
/// SYNC-WORKBENCH-F: EF configuration for
/// <see cref="UnprovenImprvAttrTriage"/>. Schema
/// <c>legacy_tf_unproven</c>; table <c>unproven_imprv_attr_triage</c>.
/// Unique on <see cref="UnprovenImprvAttrTriage.UnprovenRowId"/>;
/// non-unique on <see cref="UnprovenImprvAttrTriage.Status"/>.
/// </summary>
public sealed class UnprovenImprvAttrTriageConfiguration
    : IEntityTypeConfiguration<UnprovenImprvAttrTriage>
{
    public void Configure(EntityTypeBuilder<UnprovenImprvAttrTriage> builder)
    {
        builder.ToTable("unproven_imprv_attr_triage", schema: "legacy_tf_unproven");

        builder.HasKey(x => x.TriageId);
        builder.Property(x => x.TriageId).IsRequired();

        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();

        builder.Property(x => x.RoutedToUniverse).HasMaxLength(50);
        builder.Property(x => x.RoutedToIAttrValCd).HasMaxLength(64);

        builder.Property(x => x.DismissalReason).HasMaxLength(50);
        builder.Property(x => x.OperatorNote).HasMaxLength(1000);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(255);
        builder.Property(x => x.UpdatedBy).HasMaxLength(255);

        // One triage decision per quarantine row.
        builder.HasIndex(x => x.UnprovenRowId)
            .IsUnique()
            .HasDatabaseName("ux_unproven_imprv_attr_triage_unproven_row");

        // Status is the primary filter from the workbench list view.
        builder.HasIndex(x => x.Status)
            .HasDatabaseName("ix_unproven_imprv_attr_triage_status");
    }
}
