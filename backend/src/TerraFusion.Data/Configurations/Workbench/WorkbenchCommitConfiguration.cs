using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Workbench;

namespace TerraFusion.Data.Configurations.Workbench;

/// <summary>
/// SYNC-WORKBENCH-G: EF configuration for
/// <see cref="WorkbenchCommit"/>. Schema <c>tf_workbench</c>; table
/// <c>workbench_commit</c>. Unique on
/// <see cref="WorkbenchCommit.IdempotencyKey"/>; descending index
/// on <see cref="WorkbenchCommit.CommittedAt"/> for the list-paging
/// surface.
/// </summary>
public sealed class WorkbenchCommitConfiguration
    : IEntityTypeConfiguration<WorkbenchCommit>
{
    public void Configure(EntityTypeBuilder<WorkbenchCommit> builder)
    {
        builder.ToTable("workbench_commit", schema: "tf_workbench");

        builder.HasKey(x => x.CommitId);
        builder.Property(x => x.CommitId).IsRequired();

        builder.Property(x => x.IdempotencyKey)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.OperatorId)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.CommitNote).HasMaxLength(2000);

        builder.Property(x => x.RoutedDecisionsApplied).IsRequired();
        builder.Property(x => x.DismissedDecisionsApplied).IsRequired();

        // JSON snapshots stored as text (provider-portable). PostgreSQL
        // can be migrated to jsonb later with a column-type-only change.
        builder.Property(x => x.UniverseDistributionJson)
            .IsRequired();
        builder.Property(x => x.RatioDistributionJson)
            .IsRequired();

        builder.Property(x => x.CommittedAt).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(255);
        builder.Property(x => x.UpdatedBy).HasMaxLength(255);

        builder.HasIndex(x => x.IdempotencyKey)
            .IsUnique()
            .HasDatabaseName("ux_workbench_commit_idempotency_key");

        // Descending index on CommittedAt — the list endpoint orders
        // newest first.
        builder.HasIndex(x => x.CommittedAt)
            .IsDescending(true)
            .HasDatabaseName("ix_workbench_commit_committed_at_desc");
    }
}
