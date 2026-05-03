using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice L3: EF configuration for
/// <see cref="TfLand"/>. Schema <c>canonical_tf</c>; table <c>tf_land</c>.
/// </summary>
public sealed class TfLandConfiguration : IEntityTypeConfiguration<TfLand>
{
    public void Configure(EntityTypeBuilder<TfLand> builder)
    {
        builder.ToTable("tf_land", schema: "canonical_tf");

        builder.HasKey(x => x.TfLandId);
        builder.Property(x => x.TfLandId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.TfParcelId).IsRequired();

        builder.Property(x => x.LandSegTypeCd).HasMaxLength(8);
        builder.Property(x => x.LandSegStateCd).HasMaxLength(8);
        builder.Property(x => x.LandSegClassCd).HasMaxLength(8);
        builder.Property(x => x.LandSegUseCd).HasMaxLength(16);
        builder.Property(x => x.SoilCd).HasMaxLength(16);

        builder.Property(x => x.SizeAcres).HasPrecision(18, 4);
        builder.Property(x => x.SizeSquareFeet).HasPrecision(18, 2);
        builder.Property(x => x.LandSegMarketVal).HasPrecision(18, 2);
        builder.Property(x => x.LandSegAgValue).HasPrecision(18, 2);
        builder.Property(x => x.LandSegAssessedVal).HasPrecision(18, 2);

        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => x.CountyId)
            .HasDatabaseName("ix_tf_land_county");
        builder.HasIndex(x => x.TfParcelId)
            .HasDatabaseName("ix_tf_land_parcel");
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_land_promotion_batch");
        builder.HasIndex(x => x.LandSegUseCd)
            .HasDatabaseName("ix_tf_land_use");

        // ── E3a (v1.3): nullable FK to attribute_definition ──────
        // Per docs/pacs/block-c-contract-v1.3.md. NoAction delete
        // semantics — attribute_definition rows are soft-retired,
        // never hard-deleted; any future hard delete must fail
        // rather than orphan land segments.
        builder.HasOne(x => x.AttributeDefinition)
            .WithMany()
            .HasForeignKey(x => x.AttributeId)
            .HasConstraintName("fk_tf_land_attribute_definition")
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(x => x.AttributeId)
            .HasDatabaseName("ix_tf_land_attribute_id");
    }
}
