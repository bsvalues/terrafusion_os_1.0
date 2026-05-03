using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C6: transitions a county-scoped Mapping Workbook from
/// <c>Draft</c> to <c>Mapped</c> after validating that every column +
/// code-value row has reached a terminal review status. Once a workbook
/// is locked, downstream transform consumers (Slice C7+) can require
/// <c>Status='Mapped'</c> before treating the workbook's decisions as
/// authoritative.
///
/// <para>What this service does:
/// <list type="bullet">
/// <item>County-scoped workbook lookup; refuses cross-county.</item>
/// <item>Refuses to lock a workbook whose <see cref="Core.Entities.Sync.Mapping.SyncMappingWorkbook.Status"/>
/// is not <c>Draft</c> — already-Mapped, Approved, or Archived
/// workbooks throw <see cref="InvalidOperationException"/>.</item>
/// <item>Walks every <c>SyncMappingColumn</c> and every
/// <c>SyncMappingCodeValue</c> for the workbook and rejects the lock
/// when ANY row is still in a non-terminal state
/// (<c>NeedsReview</c> / <c>InProgress</c>).</item>
/// <item>On success, flips workbook <c>Status</c> to <c>Mapped</c>,
/// bumps audit fields, and persists.</item>
/// </list>
/// </para>
///
/// <para>What this service does NOT do:
/// <list type="bullet">
/// <item>Mutate <see cref="Core.Entities.Sync.Mapping.SyncMappingColumn.CanonicalTarget"/>
/// or <see cref="Core.Entities.Sync.Mapping.SyncMappingCodeValue.CanonicalValue"/> —
/// those are operator-decided, never service-derived.</item>
/// <item>Auto-exclude WAC codes or any other rows. The "WacCd bug
/// blocks all comps" memory directive is upheld at the lock layer
/// the same way it's upheld at the loader and exporter layers — a
/// human decides; the lock service only verifies the human decided.</item>
/// <item>Apply mappings to PACS rows / canonical landing tables /
/// valuation artifacts / GIS artifacts. Slice C7+ owns transform
/// consumption; nothing in C6 mutates business data.</item>
/// </list>
/// </para>
/// </summary>
public interface ISyncMappingWorkbookLockService
{
    Task<SyncMappingWorkbookLockResult> LockAsync(
        Guid countyId,
        Guid workbookId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-call summary the lock service returns. <see cref="ColumnsValidated"/>
/// and <see cref="CodeValuesValidated"/> are the totals walked, NOT just
/// the rows that flipped — they're a "we looked at this much" receipt for
/// the operator.
/// </summary>
public sealed record SyncMappingWorkbookLockResult(
    Guid WorkbookId,
    string Status,
    int ColumnsValidated,
    int CodeValuesValidated);
