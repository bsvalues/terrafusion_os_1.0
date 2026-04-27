using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C14-B: read-only progress reporter for a Mapping Workbook.
/// Surfaces lock-readiness blockers by review status, lane, source
/// column, and pinned sales focus.
///
/// <para>See <c>docs/sync/mapping-workbook-review-progress-policy.md</c>
/// (Slice C14-A) for the full safety contract. The four Hard Guards
/// from that policy are enforced here:
/// <list type="number">
/// <item><b>Read-only.</b> No <c>SaveChangesAsync</c>, every query
/// uses <c>AsNoTracking</c>; the workbook's audit fields are not
/// touched.</item>
/// <item><b>County scope.</b> Workbook lookup refuses cross-county
/// invocation with the same <c>InvalidOperationException</c> shape
/// every other mapping service uses.</item>
/// <item><b>No status guard.</b> Accepts workbooks in any status —
/// the report's job includes "tell me where I am after lock."</item>
/// <item><b>No autodetection of decisions.</b> Counts existing
/// review-status values; never recommends, never pattern-matches
/// statute prefixes, never infers from frequency distributions.</item>
/// </list>
/// </para>
/// </summary>
public interface ISyncMappingWorkbookReviewProgressService
{
    Task<SyncMappingWorkbookReviewProgressReport> GetReportAsync(
        Guid countyId,
        Guid workbookId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// One full progress report. Sections map 1:1 to the C14-A policy's
/// six output sections. Field values are computed at the moment the
/// service is called; subsequent edits to the workbook are not
/// reflected without re-running the service.
/// </summary>
public sealed record SyncMappingWorkbookReviewProgressReport(
    Guid WorkbookId,
    string WorkbookName,
    string Status,
    Guid CountyId,
    Guid SourceConnectionId,
    Guid ProfileBatchId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? CreatedBy,
    string? UpdatedBy,
    int ColumnCount,
    int CodeValueCount,
    SyncMappingReviewStatusCounts ColumnStatusCounts,
    SyncMappingReviewStatusCounts CodeValueStatusCounts,
    IReadOnlyList<SyncMappingReviewLaneRow> LaneBreakdown,
    IReadOnlyList<SyncMappingReviewBlockingColumn> TopBlockingColumns,
    IReadOnlyList<SyncMappingReviewSalesFocusRow> SalesFocus,
    SyncMappingReviewLockReadiness LockReadiness);

/// <summary>
/// Per-scope status counts. Terminal = Mapped + Excluded + Deferred,
/// mirroring <see cref="SyncMappingWorkbookLockService.TerminalReviewStatuses"/>.
/// NonTerminal = NeedsReview + InProgress.
/// </summary>
public sealed record SyncMappingReviewStatusCounts(
    int NeedsReview,
    int InProgress,
    int Mapped,
    int Excluded,
    int Deferred,
    int Terminal,
    int NonTerminal);

/// <summary>
/// One row of the Lane Breakdown section. <see cref="PercentComplete"/>
/// is null for lanes with zero code-values (the n/a case).
/// </summary>
public sealed record SyncMappingReviewLaneRow(
    string Lane,
    int Columns,
    int CodeValues,
    int Terminal,
    int NonTerminal,
    decimal? PercentComplete);

/// <summary>
/// One row of the Top Blocking Columns section. Sorted by
/// <see cref="NonTerminal"/> DESC, then Source ASC for stability.
/// Columns with zero <see cref="NonTerminal"/> are excluded by
/// construction — the section is "blockers," not "all columns."
/// </summary>
public sealed record SyncMappingReviewBlockingColumn(
    string SourceSchema,
    string SourceTable,
    string SourceColumn,
    string Lane,
    int NonTerminal,
    int Terminal,
    int Total);

/// <summary>
/// One row of the Sales Review Focus section. Pinned to the two
/// sales-comp-blocking columns (<c>dbo.sale.wac_cd</c>,
/// <c>dbo.sale.sl_ratio_type_cd</c>); rows for missing columns are
/// omitted entirely from the list.
/// </summary>
public sealed record SyncMappingReviewSalesFocusRow(
    string SourceSchema,
    string SourceTable,
    string SourceColumn,
    string ColumnReviewStatus,
    int CodeValues,
    int Terminal,
    int NonTerminal,
    decimal? PercentComplete);

/// <summary>
/// Bottom-line readiness:
/// <list type="bullet">
/// <item><see cref="SyncMappingReviewLockReadinessStatus.NotReady"/>:
/// workbook is Draft AND has at least one non-terminal column or
/// code-value.</item>
/// <item><see cref="SyncMappingReviewLockReadinessStatus.Ready"/>:
/// workbook is Draft AND every column and code-value is terminal.</item>
/// <item><see cref="SyncMappingReviewLockReadinessStatus.AlreadyLocked"/>:
/// workbook is in any non-Draft status (Mapped / Approved /
/// Archived / etc.).</item>
/// </list>
/// </summary>
public sealed record SyncMappingReviewLockReadiness(
    SyncMappingReviewLockReadinessStatus Status,
    int BlockingColumns,
    int BlockingCodeValues);

/// <summary>Lock-readiness verdict.</summary>
public enum SyncMappingReviewLockReadinessStatus
{
    NotReady = 0,
    Ready = 1,
    AlreadyLocked = 2,
}
