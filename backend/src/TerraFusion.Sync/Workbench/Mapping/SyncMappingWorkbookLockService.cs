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
/// Slice C6 implementation. See <see cref="ISyncMappingWorkbookLockService"/>
/// for the contract.
/// </summary>
public sealed class SyncMappingWorkbookLockService : ISyncMappingWorkbookLockService
{
    /// <summary>
    /// Review-status values that count as "review complete." Locking a
    /// workbook requires every column AND every code-value to be in one
    /// of these. The set is intentionally narrow:
    /// <list type="bullet">
    /// <item><c>Mapped</c> — operator decided on a canonical target/value.</item>
    /// <item><c>Excluded</c> — operator decided to drop the row from
    /// downstream consumption (e.g. exempt-transfer WAC codes for
    /// sales-comp filtering).</item>
    /// <item><c>Deferred</c> — operator parked the decision intentionally
    /// (e.g. waiting on assessor input for a low-frequency code). A
    /// deferred row is still "decided" — the decision is "not yet."</item>
    /// </list>
    /// <c>NeedsReview</c> and <c>InProgress</c> are explicitly NOT terminal.
    /// </summary>
    public static IReadOnlySet<string> TerminalReviewStatuses { get; } =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Mapped",
            "Excluded",
            "Deferred",
        };

    /// <summary>The only Status from which <see cref="LockAsync"/> can transition.</summary>
    public const string DraftStatus = "Draft";

    /// <summary>The Status set by a successful lock.</summary>
    public const string MappedStatus = "Mapped";

    private readonly TerraFusionDbContext _db;

    public SyncMappingWorkbookLockService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncMappingWorkbookLockResult> LockAsync(
        Guid countyId,
        Guid workbookId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));

        // 1. County-scoped workbook lookup. Refuse cross-county.
        var workbook = await _db.SyncMappingWorkbooks
            .FirstOrDefaultAsync(
                w => w.Id == workbookId && w.CountyId == countyId,
                cancellationToken);
        if (workbook is null)
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} not found for county {countyId}.");
        }

        // 2. Status gate. Only Draft can be locked.
        if (!string.Equals(workbook.Status, DraftStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} has Status='{workbook.Status}'. " +
                $"Only workbooks with Status='{DraftStatus}' can be locked.");
        }

        // 3. Walk columns + code-values; collect non-terminal rows for a
        //    legible-error report.
        var columns = await _db.SyncMappingColumns
            .Where(c => c.WorkbookId == workbookId)
            .OrderBy(c => c.SourceTable)
            .ThenBy(c => c.SourceColumn)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var columnIds = columns.Select(c => c.Id).ToList();

        var codeValues = await _db.SyncMappingCodeValues
            .Where(v => columnIds.Contains(v.MappingColumnId))
            .OrderBy(v => v.MappingColumnId)
            .ThenBy(v => v.SourceValue)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var nonTerminalColumns = columns
            .Where(c => !TerminalReviewStatuses.Contains(c.ReviewStatus))
            .ToList();
        var nonTerminalValues = codeValues
            .Where(v => !TerminalReviewStatuses.Contains(v.ReviewStatus))
            .ToList();

        if (nonTerminalColumns.Count > 0 || nonTerminalValues.Count > 0)
        {
            // Build a one-line summary that names a few examples so the
            // operator knows where to look. Capping at 3 of each keeps the
            // exception message bounded.
            var colExamples = string.Join(", ",
                nonTerminalColumns.Take(3).Select(c =>
                    $"{c.SourceTable}.{c.SourceColumn}=[{c.ReviewStatus}]"));
            var valExamples = string.Join(", ",
                nonTerminalValues.Take(3).Select(v =>
                    $"value '{v.SourceValue}'=[{v.ReviewStatus}]"));

            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} cannot be locked: " +
                $"{nonTerminalColumns.Count} column(s) and {nonTerminalValues.Count} code-value(s) " +
                $"still need review (terminal statuses: {string.Join(", ", TerminalReviewStatuses)}). " +
                $"Examples: " +
                (nonTerminalColumns.Count > 0 ? $"columns [{colExamples}]" : "(no column examples)") +
                "; " +
                (nonTerminalValues.Count > 0 ? $"values [{valExamples}]" : "(no value examples)") +
                ".");
        }

        // 4. Validation passed. Flip Status to Mapped, bump UpdatedAt,
        //    persist. Note: we DO NOT touch CanonicalTarget /
        //    CanonicalValue here — those are operator-decided, never
        //    service-derived, and the test suite pins this absence.
        workbook.Status    = MappedStatus;
        workbook.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return new SyncMappingWorkbookLockResult(
            WorkbookId:          workbookId,
            Status:              MappedStatus,
            ColumnsValidated:    columns.Count,
            CodeValuesValidated: codeValues.Count);
    }
}
