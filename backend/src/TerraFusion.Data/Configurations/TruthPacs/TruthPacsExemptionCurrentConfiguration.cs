using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TruthPacs;

namespace TerraFusion.Data.Configurations.TruthPacs;

/// <summary>
/// EXEMPTION-FACT-SEAL: EF config for
/// <see cref="TruthPacsExemptionCurrent"/>. Schema <c>truth_pacs</c>;
/// table <c>exemption_current</c>.
/// </summary>
public sealed class TruthPacsExemptionCurrentConfiguration
    : IEntityTypeConfiguration<TruthPacsExemptionCurrent>
{
    public void Configure(EntityTypeBuilder<TruthPacsExemptionCurrent> builder)
    {
        builder.ToTable("exemption_current", schema: "truth_pacs");

        builder.HasKey(x => x.TruthExemptionId);
        builder.Property(x => x.TruthExemptionId).IsRequired();

        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.ExmptTypeCd).HasMaxLength(16).IsRequired();
        builder.Property(x => x.ExmptSubtypeCd).HasMaxLength(16);
        builder.Property(x => x.ExemptionPct).HasPrecision(9, 4);

        builder.Property(x => x.SourceExemptionLandedRowId).IsRequired();
        builder.Property(x => x.ExemptionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.PromotedAt).IsRequired();

        // Natural-key idempotency / hot read.
        builder.HasIndex(x => new { x.PropId, x.TaxYr, x.OwnerId, x.ExmptTypeCd })
            .HasDatabaseName("ix_truth_pacs_exemption_natural_key");
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_truth_pacs_exemption_promotion_batch");

        builder.Property(x => x.ConversionEra).HasMaxLength(20);
    }
}
