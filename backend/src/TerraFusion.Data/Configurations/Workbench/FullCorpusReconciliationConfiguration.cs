using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Workbench;

namespace TerraFusion.Data.Configurations.Workbench;

/// <summary>
/// SYNC-COMPLETE-2: EF configuration for
/// <see cref="FullCorpusReconciliation"/>. Schema
/// <c>tf_workbench</c>; table <c>full_corpus_reconciliation</c>.
/// Unique on <c>(RunId, Lane)</c>.
/// </summary>
public sealed class FullCorpusReconciliationConfiguration
    : IEntityTypeConfiguration<FullCorpusReconciliation>
{
    public void Configure(EntityTypeBuilder<FullCorpusReconciliation> builder)
    {
        builder.ToTable("full_corpus_reconciliation", schema: "tf_workbench");

        builder.HasKey(x => x.ReconciliationId);
        builder.Property(x => x.ReconciliationId).IsRequired();

        builder.Property(x => x.RunId).IsRequired();
        builder.Property(x => x.Lane).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ExpectedBasis).HasMaxLength(32).IsRequired();

        builder.Property(x => x.PacsSourceCount).IsRequired();
        builder.Property(x => x.TfCanonicalCount).IsRequired();
        builder.Property(x => x.Delta).IsRequired();
        builder.Property(x => x.DeltaPct)
            .HasPrecision(18, 6)
            .IsRequired();
        builder.Property(x => x.TolerancePct)
            .HasPrecision(18, 6)
            .IsRequired();

        builder.Property(x => x.ReconciliationStatus)
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(4000);
        builder.Property(x => x.ComputedAt).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(255);
        builder.Property(x => x.UpdatedBy).HasMaxLength(255);

        builder.HasIndex(x => new { x.RunId, x.Lane })
            .IsUnique()
            .HasDatabaseName("ux_full_corpus_reconciliation_run_lane");

        builder.HasIndex(x => x.RunId)
            .HasDatabaseName("ix_full_corpus_reconciliation_run_id");
    }
}
