using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Workbench;

namespace TerraFusion.Data.Configurations.Workbench;

/// <summary>
/// SYNC-COMPLETE-2: EF configuration for
/// <see cref="FullCorpusLaneResult"/>. Schema <c>tf_workbench</c>;
/// table <c>full_corpus_lane_result</c>. Unique on
/// <c>(RunId, Lane)</c> — exactly one row per (run, lane) pair.
/// </summary>
public sealed class FullCorpusLaneResultConfiguration
    : IEntityTypeConfiguration<FullCorpusLaneResult>
{
    public void Configure(EntityTypeBuilder<FullCorpusLaneResult> builder)
    {
        builder.ToTable("full_corpus_lane_result", schema: "tf_workbench");

        builder.HasKey(x => x.LaneResultId);
        builder.Property(x => x.LaneResultId).IsRequired();

        builder.Property(x => x.RunId).IsRequired();
        builder.Property(x => x.Lane).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();

        builder.Property(x => x.BatchIdsJson);
        builder.Property(x => x.CountsJson);
        builder.Property(x => x.GateSummaryJson);
        builder.Property(x => x.QuarantineDeltaJson);
        builder.Property(x => x.ErrorMessage).HasMaxLength(4000);
        // SYNC-COMPLETE-2-V2: stage-level resume checkpoint.
        builder.Property(x => x.LastCompletedStage).HasMaxLength(64);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(255);
        builder.Property(x => x.UpdatedBy).HasMaxLength(255);

        builder.HasIndex(x => new { x.RunId, x.Lane })
            .IsUnique()
            .HasDatabaseName("ux_full_corpus_lane_result_run_lane");

        builder.HasIndex(x => x.RunId)
            .HasDatabaseName("ix_full_corpus_lane_result_run_id");
    }
}
