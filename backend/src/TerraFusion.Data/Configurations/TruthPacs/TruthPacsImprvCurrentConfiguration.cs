using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// Slice C2: EF configuration for
/// <see cref="TruthPacsImprvCurrent"/>. Schema <c>truth_pacs</c>;
/// table <c>imprv_current</c>.
/// </summary>
public sealed class TruthPacsImprvCurrentConfiguration
    : IEntityTypeConfiguration<TruthPacsImprvCurrent>
{
    public void Configure(EntityTypeBuilder<TruthPacsImprvCurrent> builder)
    {
        builder.ToTable("imprv_current", schema: "truth_pacs");

        builder.HasKey(x => x.TruthImprvId);
        builder.Property(x => x.TruthImprvId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.ImprvId).IsRequired();

        builder.Property(x => x.ImprvTypeCd).HasMaxLength(8);
        builder.Property(x => x.ImprvStateCd).HasMaxLength(8);
        builder.Property(x => x.ImprvClassCd).HasMaxLength(8);
        builder.Property(x => x.ImprvHomesite).HasMaxLength(2);
        builder.Property(x => x.ImprvDesc).HasMaxLength(500);
        builder.Property(x => x.ImprvVal).HasPrecision(18, 2);

        builder.Property(x => x.SourceImprvLandedRowId).IsRequired();
        builder.Property(x => x.SourceSuppAssocLandedRowId).IsRequired();
        builder.Property(x => x.ImprvLoadBatchId).IsRequired();
        builder.Property(x => x.SuppAssocLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // Idempotency / re-promote key.
        builder.HasIndex(x => new { x.ImprvLoadBatchId, x.PropId, x.ImprvId })
            .HasDatabaseName("ix_truth_pacs_imprv_imprvbatch_propimprv");

        // Hot read path.
        builder.HasIndex(x => new { x.PropId, x.PropValYr })
            .HasDatabaseName("ix_truth_pacs_imprv_prop_year");

        // Lineage lookup.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_imprv_promotion_batch");

        // Type-cd scans.
        builder.HasIndex(x => x.ImprvTypeCd)
            .HasDatabaseName("ix_truth_pacs_imprv_type");

        // G1 (v1.10): conversion-era marker.
        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_truth_pacs_imprv_conversion_era");
    }
}
