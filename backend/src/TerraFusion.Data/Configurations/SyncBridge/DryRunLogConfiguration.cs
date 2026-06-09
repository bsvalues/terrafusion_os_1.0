using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

/// <summary>
/// EF Core configuration for <see cref="DryRunLog"/>.
///
/// <para>Maps to <c>sync_bridge.dry_run_log</c>. Append-only audit table —
/// no update path is modelled. <c>is_preview</c> carries a check constraint
/// enforcing the doctrine invariant that this table records preview runs only.</para>
///
/// <para>Per docs/sync/workbench/SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md §3 + §12.</para>
/// </summary>
public sealed class DryRunLogConfiguration : IEntityTypeConfiguration<DryRunLog>
{
    public void Configure(EntityTypeBuilder<DryRunLog> builder)
    {
        // DB-level guard on is_preview baked into the ToTable call (EF8 modern form).
        builder.ToTable("dry_run_log", schema: "sync_bridge",
            buildAction: t => t.HasCheckConstraint(
                "ck_dry_run_log_is_preview",
                "\"IsPreview\" = true"));
        builder.HasKey(x => x.PreviewRunId);
        builder.Property(x => x.PreviewRunId).ValueGeneratedNever(); // caller-assigned Guid

        builder.Property(x => x.CountyCode).HasMaxLength(20);

        builder.Property(x => x.Lane).HasMaxLength(64).IsRequired();

        builder.Property(x => x.OperationalYear).IsRequired();

        builder.Property(x => x.RequestedAt).IsRequired();

        builder.Property(x => x.RequestedBy).HasMaxLength(256).IsRequired();

        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();

        // DB-level guard on is_preview is declared in ToTable above (EF8 modern form).
        // Column still needs its required constraint declared here.
        builder.Property(x => x.IsPreview).IsRequired();

        // InputJson and ResultJson: text in SQLite, jsonb in Postgres.
        // EF models as string; column type resolved at migration time.
        builder.Property(x => x.InputJson);
        builder.Property(x => x.ResultJson);

        builder.Property(x => x.CreatedAt).IsRequired();

        // Query patterns: by lane (find all previews for a lane),
        // by county (find all previews for a county), by time.
        builder.HasIndex(x => x.Lane);
        builder.HasIndex(x => new { x.CountyId, x.RequestedAt });
        builder.HasIndex(x => x.RequestedAt);
    }
}
