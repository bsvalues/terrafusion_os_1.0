using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice C3: EF configuration for
/// <see cref="TfImprovementFeature"/>. Schema <c>canonical_tf</c>;
/// table <c>tf_improvement_feature</c>.
/// </summary>
public sealed class TfImprovementFeatureConfiguration
    : IEntityTypeConfiguration<TfImprovementFeature>
{
    public void Configure(EntityTypeBuilder<TfImprovementFeature> builder)
    {
        builder.ToTable("tf_improvement_feature", schema: "canonical_tf");

        builder.HasKey(x => x.TfImprovementFeatureId);
        builder.Property(x => x.TfImprovementFeatureId).IsRequired();
        builder.Property(x => x.TfImprovementId).IsRequired();

        builder.Property(x => x.FeatureCode).HasMaxLength(16).IsRequired();
        builder.Property(x => x.MethodCd).HasMaxLength(16);
        builder.Property(x => x.ClassCd).HasMaxLength(16);
        builder.Property(x => x.SubClassCd).HasMaxLength(16);
        builder.Property(x => x.ConditionCd).HasMaxLength(8);

        builder.Property(x => x.Area).HasPrecision(18, 2);
        builder.Property(x => x.Value).HasPrecision(18, 2);

        builder.Property(x => x.SourceImprvDetailLandedRowId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Hot path: features for an improvement.
        builder.HasIndex(x => x.TfImprovementId)
            .HasDatabaseName("ix_tf_improvement_feature_imprv");

        // Code scans (Benton-Method secondary-feature reads).
        builder.HasIndex(x => x.FeatureCode)
            .HasDatabaseName("ix_tf_improvement_feature_code");

        // Idempotency: clear by promotion batch.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_improvement_feature_promotion_batch");

        // ── E3a (v1.3): nullable FK to attribute_definition ──────
        // Per docs/pacs/block-c-contract-v1.3.md. NoAction on
        // delete: an attribute_definition row should never be
        // hard-deleted (soft-retire only), and any future hard
        // delete must explicitly fail rather than orphan features.
        builder.HasOne(x => x.AttributeDefinition)
            .WithMany()
            .HasForeignKey(x => x.AttributeId)
            .HasConstraintName("fk_tf_improvement_feature_attribute_definition")
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(x => x.AttributeId)
            .HasDatabaseName("ix_tf_improvement_feature_attribute_id");
    }
}
