using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

/// <summary>
/// EF Core configuration for <see cref="QuarantineReviewDecision"/>.
///
/// <para>Maps to <c>sync_bridge.quarantine_review_decision</c>. Append-only
/// operator disposition log — no update path is modelled. Each new operator
/// decision inserts a new row; the current disposition is the most recent row
/// for a given <c>(QuarantineId, Lane)</c> pair by <c>CreatedAt DESC</c>.</para>
///
/// <para>No foreign key is imposed on <c>QuarantineId</c> — the quarantine
/// source table varies by lane (bigint PK for imprv_attr; uuid for others).
/// The <c>Lane</c> column disambiguates which quarantine table holds the row.</para>
///
/// <para>Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7.</para>
/// </summary>
public sealed class QuarantineReviewDecisionConfiguration
    : IEntityTypeConfiguration<QuarantineReviewDecision>
{
    public void Configure(EntityTypeBuilder<QuarantineReviewDecision> builder)
    {
        builder.ToTable("quarantine_review_decision", schema: "sync_bridge");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd(); // BIGSERIAL — DB-assigned identity

        builder.Property(x => x.QuarantineId).IsRequired();

        // UUID-keyed lanes store the source row PK as a string.
        // Null for bigint-keyed lanes (QuarantineId used instead).
        builder.Property(x => x.QuarantineRowRef).HasMaxLength(256);

        builder.Property(x => x.Lane).HasMaxLength(64).IsRequired();

        // Closed vocabulary: ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH
        builder.Property(x => x.Disposition).HasMaxLength(32).IsRequired();

        // Optional free-text note; max 500 chars matches contract §7
        builder.Property(x => x.OperatorNote).HasMaxLength(500);

        builder.Property(x => x.OperatorIdentity).HasMaxLength(256).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();

        // Primary query pattern: retrieve current (latest) disposition for a
        // quarantine row — SELECT TOP 1 WHERE QuarantineId=X AND Lane=Y ORDER BY CreatedAt DESC
        builder.HasIndex(x => new { x.QuarantineId, x.Lane })
            .HasDatabaseName("ix_qrd_quarantine_id_lane");

        // UUID-lane lookup — SELECT TOP 1 WHERE QuarantineRowRef=X AND Lane=Y ORDER BY CreatedAt DESC
        builder.HasIndex(x => new { x.QuarantineRowRef, x.Lane })
            .HasDatabaseName("ix_qrd_quarantine_row_ref_lane");

        // Browse by lane — list all decisions for a given lane
        builder.HasIndex(x => x.Lane)
            .HasDatabaseName("ix_qrd_lane");

        // Audit / chronological sweep
        builder.HasIndex(x => x.CreatedAt)
            .HasDatabaseName("ix_qrd_created_at");
    }
}
