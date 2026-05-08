using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Workbench;

namespace TerraFusion.Data.Configurations.Workbench;

/// <summary>
/// SYNC-WORKBENCH-G: EF configuration for
/// <see cref="WorkbenchCommitDecisionLink"/>. Schema
/// <c>tf_workbench</c>; table <c>workbench_commit_decision_link</c>.
/// Unique on <see cref="WorkbenchCommitDecisionLink.TriageId"/> (a
/// triage row may be linked to at most one commit); non-unique on
/// <see cref="WorkbenchCommitDecisionLink.CommitId"/> for fast
/// detail-endpoint loads.
/// </summary>
public sealed class WorkbenchCommitDecisionLinkConfiguration
    : IEntityTypeConfiguration<WorkbenchCommitDecisionLink>
{
    public void Configure(EntityTypeBuilder<WorkbenchCommitDecisionLink> builder)
    {
        builder.ToTable("workbench_commit_decision_link", schema: "tf_workbench");

        builder.HasKey(x => x.LinkId);
        builder.Property(x => x.LinkId).IsRequired();

        builder.Property(x => x.CommitId).IsRequired();
        builder.Property(x => x.TriageId).IsRequired();
        builder.Property(x => x.UnprovenRowId).IsRequired();

        builder.Property(x => x.DecisionType)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.RoutedToUniverse).HasMaxLength(50);
        builder.Property(x => x.RoutedToIAttrValCd).HasMaxLength(32);
        builder.Property(x => x.DismissalReason).HasMaxLength(50);

        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.CommitId)
            .HasDatabaseName("ix_workbench_commit_decision_link_commit");

        builder.HasIndex(x => x.TriageId)
            .IsUnique()
            .HasDatabaseName("ux_workbench_commit_decision_link_triage");
    }
}
