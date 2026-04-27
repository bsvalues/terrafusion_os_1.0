using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C14-B implementation of
/// <see cref="ISyncMappingWorkbookReviewProgressService"/>. See the
/// policy doc (<c>docs/sync/mapping-workbook-review-progress-policy.md</c>)
/// for the full contract.
///
/// <para>Architecture:
/// <list type="number">
/// <item>Workbook lookup (county-scoped, <c>AsNoTracking</c>).
/// Refuses cross-county.</item>
/// <item>Load all workbook columns + code-values into memory with
/// <c>AsNoTracking</c>. Per-workbook bounds (≤ 200 columns,
/// ≤ ~2k code-values) make the in-memory aggregation cheap.</item>
/// <item>Compute the six report sections by grouping/projecting
/// the in-memory lists. No mutation, no <c>SaveChangesAsync</c>.</item>
/// </list>
/// </para>
/// </summary>
public sealed class SyncMappingWorkbookReviewProgressService : ISyncMappingWorkbookReviewProgressService
{
    /// <summary>The set of statuses considered "review complete" for lock purposes.</summary>
    public static IReadOnlySet<string> TerminalReviewStatuses { get; } =
        SyncMappingWorkbookLockService.TerminalReviewStatuses;

    /// <summary>Status that allows lock; other workbook statuses report as already-locked.</summary>
    public const string DraftStatus = "Draft";

    /// <summary>Top Blocking Columns section is capped at this many rows.</summary>
    public const int TopBlockingColumnsCap = 20;

    /// <summary>
    /// Pinned sales-focus column identities, in display order. Each
    /// is matched case-insensitively against
    /// <see cref="SyncMappingColumn.SourceSchema"/> /
    /// <see cref="SyncMappingColumn.SourceTable"/> /
    /// <see cref="SyncMappingColumn.SourceColumn"/>. A missing column
    /// is omitted (no error).
    /// </summary>
    public static IReadOnlyList<(string Schema, string Table, string Column)> SalesFocusTargets { get; } =
        new[]
        {
            ("dbo", "sale", "wac_cd"),
            ("dbo", "sale", "sl_ratio_type_cd"),
        };

    private readonly TerraFusionDbContext _db;

    public SyncMappingWorkbookReviewProgressService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncMappingWorkbookReviewProgressReport> GetReportAsync(
        Guid countyId,
        Guid workbookId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));

        // Hard Guard #2: county-scoped workbook lookup. AsNoTracking
        // because Hard Guard #1 forbids any tracked entity that could
        // be inadvertently mutated.
        var workbook = await _db.SyncMappingWorkbooks
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.Id == workbookId && w.CountyId == countyId,
                cancellationToken);
        if (workbook is null)
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} not found for county {countyId}.");
        }

        var columns = await _db.SyncMappingColumns
            .AsNoTracking()
            .Where(c => c.WorkbookId == workbookId)
            .ToListAsync(cancellationToken);
        var columnIds = columns.Select(c => c.Id).ToList();
        var codeValues = await _db.SyncMappingCodeValues
            .AsNoTracking()
            .Where(v => columnIds.Contains(v.MappingColumnId))
            .ToListAsync(cancellationToken);

        var columnStatusCounts = CountStatuses(columns.Select(c => c.ReviewStatus));
        var codeValueStatusCounts = CountStatuses(codeValues.Select(v => v.ReviewStatus));

        var laneBreakdown = BuildLaneBreakdown(columns, codeValues);
        var topBlockers = BuildTopBlockingColumns(columns, codeValues);
        var salesFocus = BuildSalesFocus(columns, codeValues);
        var lockReadiness = BuildLockReadiness(workbook.Status, columnStatusCounts, codeValueStatusCounts);

        return new SyncMappingWorkbookReviewProgressReport(
            WorkbookId:            workbook.Id,
            WorkbookName:          workbook.Name,
            Status:                workbook.Status,
            CountyId:              workbook.CountyId,
            SourceConnectionId:    workbook.SourceConnectionId,
            ProfileBatchId:        workbook.ProfileBatchId,
            CreatedAt:             workbook.CreatedAt,
            UpdatedAt:             workbook.UpdatedAt,
            CreatedBy:             workbook.CreatedBy,
            UpdatedBy:             workbook.UpdatedBy,
            ColumnCount:           columns.Count,
            CodeValueCount:        codeValues.Count,
            ColumnStatusCounts:    columnStatusCounts,
            CodeValueStatusCounts: codeValueStatusCounts,
            LaneBreakdown:         laneBreakdown,
            TopBlockingColumns:    topBlockers,
            SalesFocus:            salesFocus,
            LockReadiness:         lockReadiness);
    }

    // ── Aggregations ──────────────────────────────────────────────────

    private static SyncMappingReviewStatusCounts CountStatuses(IEnumerable<string> statuses)
    {
        int needs = 0, inProg = 0, mapped = 0, excl = 0, def = 0;
        foreach (var s in statuses)
        {
            if (string.Equals(s, "NeedsReview", StringComparison.OrdinalIgnoreCase))      needs++;
            else if (string.Equals(s, "InProgress",  StringComparison.OrdinalIgnoreCase)) inProg++;
            else if (string.Equals(s, "Mapped",      StringComparison.OrdinalIgnoreCase)) mapped++;
            else if (string.Equals(s, "Excluded",    StringComparison.OrdinalIgnoreCase)) excl++;
            else if (string.Equals(s, "Deferred",    StringComparison.OrdinalIgnoreCase)) def++;
            // Unknown statuses (forward-compat) count as NonTerminal —
            // see the C2 schema's string-typed ReviewStatus comment.
            else needs++;
        }
        return new SyncMappingReviewStatusCounts(
            NeedsReview: needs,
            InProgress:  inProg,
            Mapped:      mapped,
            Excluded:    excl,
            Deferred:    def,
            Terminal:    mapped + excl + def,
            NonTerminal: needs + inProg);
    }

    private static IReadOnlyList<SyncMappingReviewLaneRow> BuildLaneBreakdown(
        IReadOnlyList<SyncMappingColumn> columns,
        IReadOnlyList<SyncMappingCodeValue> codeValues)
    {
        // Group code-values by their column's MappingLane.
        var columnLaneById = columns.ToDictionary(c => c.Id, c => c.MappingLane ?? "(unknown)");
        var rows = columns
            .GroupBy(c => c.MappingLane ?? "(unknown)")
            .Select(g =>
            {
                var lane = g.Key;
                var laneColumnIds = new HashSet<Guid>(g.Select(c => c.Id));
                var laneValues = codeValues.Where(v => laneColumnIds.Contains(v.MappingColumnId)).ToList();
                var counts = CountStatuses(laneValues.Select(v => v.ReviewStatus));
                decimal? percent = laneValues.Count == 0
                    ? null
                    : Math.Round((decimal)counts.Terminal / laneValues.Count * 100m, 1);
                return new SyncMappingReviewLaneRow(
                    Lane:            lane,
                    Columns:         g.Count(),
                    CodeValues:      laneValues.Count,
                    Terminal:        counts.Terminal,
                    NonTerminal:     counts.NonTerminal,
                    PercentComplete: percent);
            })
            // Sort by PercentComplete ascending; rows with null percent
            // (zero-code-value lanes) sort to the front so they're
            // visible at a glance.
            .OrderBy(r => r.PercentComplete ?? -1m)
            .ThenBy(r => r.Lane, StringComparer.OrdinalIgnoreCase)
            .ToList();
        return rows;
    }

    private static IReadOnlyList<SyncMappingReviewBlockingColumn> BuildTopBlockingColumns(
        IReadOnlyList<SyncMappingColumn> columns,
        IReadOnlyList<SyncMappingCodeValue> codeValues)
    {
        // Pre-bucket code-values by MappingColumnId for O(N) lookup.
        var byColumn = codeValues.GroupBy(v => v.MappingColumnId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var rows = columns
            .Select(c =>
            {
                var values = byColumn.TryGetValue(c.Id, out var v) ? v : new List<SyncMappingCodeValue>();
                var counts = CountStatuses(values.Select(x => x.ReviewStatus));
                return new
                {
                    Column = c,
                    Counts = counts,
                };
            })
            // Hard rule from C14-A: omit columns with zero NonTerminal.
            .Where(x => x.Counts.NonTerminal > 0)
            .Select(x => new SyncMappingReviewBlockingColumn(
                SourceSchema: x.Column.SourceSchema,
                SourceTable:  x.Column.SourceTable,
                SourceColumn: x.Column.SourceColumn,
                Lane:         x.Column.MappingLane ?? "(unknown)",
                NonTerminal:  x.Counts.NonTerminal,
                Terminal:     x.Counts.Terminal,
                Total:        x.Counts.NonTerminal + x.Counts.Terminal))
            .OrderByDescending(r => r.NonTerminal)
            .ThenBy(r => r.SourceSchema, StringComparer.OrdinalIgnoreCase)
            .ThenBy(r => r.SourceTable,  StringComparer.OrdinalIgnoreCase)
            .ThenBy(r => r.SourceColumn, StringComparer.OrdinalIgnoreCase)
            .Take(TopBlockingColumnsCap)
            .ToList();
        return rows;
    }

    private static IReadOnlyList<SyncMappingReviewSalesFocusRow> BuildSalesFocus(
        IReadOnlyList<SyncMappingColumn> columns,
        IReadOnlyList<SyncMappingCodeValue> codeValues)
    {
        var byColumn = codeValues.GroupBy(v => v.MappingColumnId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var rows = new List<SyncMappingReviewSalesFocusRow>(SalesFocusTargets.Count);
        foreach (var (schema, table, column) in SalesFocusTargets)
        {
            var col = columns.FirstOrDefault(c =>
                string.Equals(c.SourceSchema, schema, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(c.SourceTable,  table,  StringComparison.OrdinalIgnoreCase) &&
                string.Equals(c.SourceColumn, column, StringComparison.OrdinalIgnoreCase));
            if (col is null) continue;

            var values = byColumn.TryGetValue(col.Id, out var v) ? v : new List<SyncMappingCodeValue>();
            var counts = CountStatuses(values.Select(x => x.ReviewStatus));
            decimal? percent = values.Count == 0
                ? null
                : Math.Round((decimal)counts.Terminal / values.Count * 100m, 1);
            rows.Add(new SyncMappingReviewSalesFocusRow(
                SourceSchema:       col.SourceSchema,
                SourceTable:        col.SourceTable,
                SourceColumn:       col.SourceColumn,
                ColumnReviewStatus: col.ReviewStatus,
                CodeValues:         values.Count,
                Terminal:           counts.Terminal,
                NonTerminal:        counts.NonTerminal,
                PercentComplete:    percent));
        }
        return rows;
    }

    private static SyncMappingReviewLockReadiness BuildLockReadiness(
        string workbookStatus,
        SyncMappingReviewStatusCounts columnCounts,
        SyncMappingReviewStatusCounts codeValueCounts)
    {
        if (!string.Equals(workbookStatus, DraftStatus, StringComparison.OrdinalIgnoreCase))
        {
            // Already past Draft — lock cannot be re-run regardless of
            // per-row state. Report zero blockers so the operator sees
            // the unambiguous "no further work needed" message.
            return new SyncMappingReviewLockReadiness(
                Status:              SyncMappingReviewLockReadinessStatus.AlreadyLocked,
                BlockingColumns:     0,
                BlockingCodeValues:  0);
        }

        var blockingCols   = columnCounts.NonTerminal;
        var blockingValues = codeValueCounts.NonTerminal;
        if (blockingCols == 0 && blockingValues == 0)
        {
            return new SyncMappingReviewLockReadiness(
                Status:              SyncMappingReviewLockReadinessStatus.Ready,
                BlockingColumns:     0,
                BlockingCodeValues:  0);
        }
        return new SyncMappingReviewLockReadiness(
            Status:              SyncMappingReviewLockReadinessStatus.NotReady,
            BlockingColumns:     blockingCols,
            BlockingCodeValues:  blockingValues);
    }
}
