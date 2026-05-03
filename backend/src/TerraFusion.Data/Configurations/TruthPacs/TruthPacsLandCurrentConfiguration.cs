using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// Slice L2: EF configuration for
/// <see cref="TruthPacsLandCurrent"/>. Schema <c>truth_pacs</c>;
/// table <c>land_current</c>.
/// </summary>
public sealed class TruthPacsLandCurrentConfiguration
    : IEntityTypeConfiguration<TruthPacsLandCurrent>
{
    public void Configure(EntityTypeBuilder<TruthPacsLandCurrent> builder)
    {
        builder.ToTable("land_current", schema: "truth_pacs");

        builder.HasKey(x => x.TruthLandId);
        builder.Property(x => x.TruthLandId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.LandSegId).IsRequired();

        builder.Property(x => x.LandSegTypeCd).HasMaxLength(8);
        builder.Property(x => x.LandSegStateCd).HasMaxLength(8);
        builder.Property(x => x.LandSegClassCd).HasMaxLength(8);
        builder.Property(x => x.LandSegUseCd).HasMaxLength(16);
        builder.Property(x => x.SoilCd).HasMaxLength(16);
        builder.Property(x => x.LandSegHomesite).HasMaxLength(2);

        builder.Property(x => x.SizeAcres).HasPrecision(18, 4);
        builder.Property(x => x.SizeSquareFeet).HasPrecision(18, 2);
        builder.Property(x => x.LandSegMarketVal).HasPrecision(18, 2);
        builder.Property(x => x.LandSegAgValue).HasPrecision(18, 2);
        builder.Property(x => x.LandSegAssessedVal).HasPrecision(18, 2);

        builder.Property(x => x.SourceLandLandedRowId).IsRequired();
        builder.Property(x => x.SourceSuppAssocLandedRowId).IsRequired();
        builder.Property(x => x.LandLoadBatchId).IsRequired();
        builder.Property(x => x.SuppAssocLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // Idempotency / re-promote key.
        builder.HasIndex(x => new { x.LandLoadBatchId, x.PropId, x.LandSegId })
            .HasDatabaseName("ix_truth_pacs_land_landbatch_propseg");

        // Hot read path.
        builder.HasIndex(x => new { x.PropId, x.PropValYr })
            .HasDatabaseName("ix_truth_pacs_land_prop_year");

        // Lineage lookup.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_land_promotion_batch");

        // Type / use scans.
        builder.HasIndex(x => x.LandSegTypeCd)
            .HasDatabaseName("ix_truth_pacs_land_type");
        builder.HasIndex(x => x.LandSegUseCd)
            .HasDatabaseName("ix_truth_pacs_land_use");
    }
}
