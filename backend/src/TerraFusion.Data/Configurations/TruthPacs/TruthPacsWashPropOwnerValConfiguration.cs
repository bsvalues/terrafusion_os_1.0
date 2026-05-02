using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// Slice B2-B: EF configuration for
/// <see cref="TruthPacsWashPropOwnerVal"/>. Schema <c>truth_pacs</c>;
/// table <c>wash_prop_owner_val</c>.
/// </summary>
public sealed class TruthPacsWashPropOwnerValConfiguration
    : IEntityTypeConfiguration<TruthPacsWashPropOwnerVal>
{
    public void Configure(EntityTypeBuilder<TruthPacsWashPropOwnerVal> builder)
    {
        builder.ToTable("wash_prop_owner_val", schema: "truth_pacs");

        builder.HasKey(x => x.TruthWpovId);
        builder.Property(x => x.TruthWpovId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();

        builder.Property(x => x.AssessedVal).HasPrecision(18, 2);
        builder.Property(x => x.MarketVal).HasPrecision(18, 2);
        builder.Property(x => x.AppraisedVal).HasPrecision(18, 2);
        builder.Property(x => x.TaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.TaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.LandTaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.LandTaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.ImprvTaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.ImprvTaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.StateValueClassified).HasPrecision(18, 2);
        builder.Property(x => x.StateValueNonClassified).HasPrecision(18, 2);

        builder.Property(x => x.BoeStatus).HasMaxLength(8);
        builder.Property(x => x.DisasterProrationPct).HasPrecision(7, 4);
        builder.Property(x => x.SnrFrzImprvHs).HasPrecision(18, 2);
        builder.Property(x => x.SnrFrzLandHs).HasPrecision(18, 2);

        builder.Property(x => x.SourceWpovLandedRowId).IsRequired();
        builder.Property(x => x.SourceSuppAssocLandedRowId).IsRequired();
        builder.Property(x => x.WpovLoadBatchId).IsRequired();
        builder.Property(x => x.SuppAssocLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // Idempotency / re-promote key.
        builder.HasIndex(x => new { x.WpovLoadBatchId, x.PropId, x.OwnerId })
            .HasDatabaseName("ix_truth_pacs_wpov_wpovbatch_propowner");

        // Hot read path.
        builder.HasIndex(x => new { x.PropId, x.PropValYr })
            .HasDatabaseName("ix_truth_pacs_wpov_prop_year");

        // Lineage lookup.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_wpov_promotion_batch");

        // BOE status scans.
        builder.HasIndex(x => x.BoeStatus)
            .HasDatabaseName("ix_truth_pacs_wpov_boe_status");
    }
}
