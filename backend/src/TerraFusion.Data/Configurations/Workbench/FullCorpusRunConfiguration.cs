using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Workbench;

namespace TerraFusion.Data.Configurations.Workbench;

/// <summary>
/// SYNC-COMPLETE-2: EF configuration for
/// <see cref="FullCorpusRun"/>. Schema <c>tf_workbench</c>; table
/// <c>full_corpus_run</c>. Descending index on
/// <see cref="FullCorpusRun.StartedAt"/> for the list-newest-first
/// query the operator uses to find recent runs.
/// </summary>
public sealed class FullCorpusRunConfiguration
    : IEntityTypeConfiguration<FullCorpusRun>
{
    public void Configure(EntityTypeBuilder<FullCorpusRun> builder)
    {
        builder.ToTable("full_corpus_run", schema: "tf_workbench");

        builder.HasKey(x => x.RunId);
        builder.Property(x => x.RunId).IsRequired();

        builder.Property(x => x.OperatorName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.WorkingYear).IsRequired();

        builder.Property(x => x.Status)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.CurrentLane).HasMaxLength(32);
        builder.Property(x => x.NextLaneOnResume).HasMaxLength(32);

        builder.Property(x => x.StartedAt).IsRequired();
        builder.Property(x => x.ErrorMessage).HasMaxLength(4000);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(255);
        builder.Property(x => x.UpdatedBy).HasMaxLength(255);

        builder.HasIndex(x => x.StartedAt)
            .IsDescending(true)
            .HasDatabaseName("ix_full_corpus_run_started_at_desc");

        builder.HasIndex(x => x.Status)
            .HasDatabaseName("ix_full_corpus_run_status");
    }
}
