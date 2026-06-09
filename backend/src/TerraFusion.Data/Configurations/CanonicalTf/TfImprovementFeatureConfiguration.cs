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

        // ATTR-DRAIN-1: widened from 16 → 32 chars to match the
        // legacy_pacs_raw.imprv_attr.IAttrValCd width (PACS source
        // i_attr_val_cd is varchar(75); landing tier truncates to
        // 32 per its own configuration, which is the actual upper
        // bound that reaches this column).
        // Widened 32 -> 128 (2026-05-27): the "landing truncates to 32" note
        // above was wrong in practice — descriptive PACS attr codes (IAttrValCd,
        // source varchar(75)) reach this column intact and overflowed varchar(32)
        // (Npgsql 22001), failing every commercial-parcel projection. PG columns
        // ALTERed to varchar(128) to match.
        builder.Property(x => x.FeatureCode).HasMaxLength(128).IsRequired();
        builder.Property(x => x.MethodCd).HasMaxLength(128);
        builder.Property(x => x.ClassCd).HasMaxLength(128);
        builder.Property(x => x.SubClassCd).HasMaxLength(128);
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

        // G2 (v1.11): conversion-era marker (inherited from parent improvement).
        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_tf_improvement_feature_conversion_era");
    }
}
