using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C11-B: applies a batch of operator-decided edits to a
/// <c>Status='Draft'</c> Mapping Workbook in a single all-or-nothing
/// transaction.
///
/// <para>See <c>docs/sync/mapping-workbook-batch-edit-policy.md</c>
/// (Slice C11-A) for the full safety contract. The four Hard Guards
/// from that policy are enforced here as defense-in-depth, identical
/// shape to the C9-B single-row edit service:
/// <list type="number">
/// <item><b>Status='Draft' only</b> — workbook-level check before any
/// row is processed.</item>
/// <item><b>County scope</b> — workbook lookup is county-filtered;
/// CSV identity matched only against this workbook's columns.</item>
/// <item><b>All-or-nothing atomicity</b> — every CSV row is
/// validated; if any row fails, zero rows mutate. On apply, all
/// mutations land in a single SaveChangesAsync call.</item>
/// <item><b>No auto-exclusion (WacCd directive)</b> — a code-value is
/// excluded if and only if the CSV row explicitly supplies
/// <c>review_status=Excluded</c> AND <c>is_excluded=true</c>. No
/// pattern-matching, no statute-family expansion, no inference.</item>
/// </list>
/// </para>
///
/// <para>The service runs each row through the same validation
/// pipeline as <see cref="ISyncMappingWorkbookEditService"/> — batch
/// edit is "many C9-B edits in one call," not a separate code path
/// with weaker guards.</para>
/// </summary>
public interface ISyncMappingWorkbookBatchEditService
{
    Task<SyncMappingWorkbookBatchEditResult> ApplyAsync(
        Guid countyId,
        Guid workbookId,
        IReadOnlyList<BatchEditCsvRow> rows,
        SyncMappingWorkbookBatchEditMode mode,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Run mode for the batch edit service.
/// <list type="bullet">
/// <item><see cref="DryRun"/>: full validation, no mutation.
/// Re-running with the same input must produce the same outcome.</item>
/// <item><see cref="Apply"/>: full validation, then single-transaction
/// mutation. Workbook <c>UpdatedAt</c> bumps exactly once per call,
/// regardless of row count.</item>
/// </list>
/// </summary>
public enum SyncMappingWorkbookBatchEditMode
{
    DryRun = 0,
    Apply  = 1,
}

/// <summary>
/// Per-call batch result. <see cref="Outcome"/> reflects what happened
/// at the workbook level; <see cref="Errors"/> is non-empty iff at
/// least one row failed validation, in which case <see cref="Outcome"/>
/// is <see cref="SyncMappingWorkbookBatchEditOutcome.ValidationFailed"/>
/// and zero rows were mutated regardless of <see cref="Mode"/>.
///
/// <para>Per-status counts (<see cref="MappedCount"/> etc.) are the
/// number of CSV rows that targeted that terminal status — useful for
/// printing a single-line summary like "→ Mapped: 12 / Excluded: 4".
/// On <see cref="SyncMappingWorkbookBatchEditOutcome.ValidationFailed"/>,
/// these counts are zero.</para>
/// </summary>
public sealed record SyncMappingWorkbookBatchEditResult(
    Guid WorkbookId,
    SyncMappingWorkbookBatchEditMode Mode,
    SyncMappingWorkbookBatchEditOutcome Outcome,
    int RowsValidated,
    int RowsToMutate,
    int ColumnRowCount,
    int CodeValueRowCount,
    int MappedCount,
    int ExcludedCount,
    int DeferredCount,
    int InProgressCount,
    int NeedsReviewCount,
    IReadOnlyList<BatchEditValidationError> Errors);

/// <summary>
/// Outcome of a batch edit call.
/// <list type="bullet">
/// <item><see cref="DryRunValidated"/>: dry-run, all rows valid, no mutation.</item>
/// <item><see cref="Applied"/>: apply, all rows valid, all mutations landed.</item>
/// <item><see cref="ValidationFailed"/>: at least one row failed; zero mutations.</item>
/// </list>
/// </summary>
public enum SyncMappingWorkbookBatchEditOutcome
{
    DryRunValidated  = 0,
    Applied          = 1,
    ValidationFailed = 2,
}

/// <summary>
/// One row-level validation error. <see cref="LineNumber"/> is the
/// 1-based CSV line number from <see cref="BatchEditCsvRow.LineNumber"/>;
/// <see cref="Scope"/>, <see cref="SourceLabel"/> are the original
/// CSV-supplied identity for legible error display.
/// </summary>
public sealed record BatchEditValidationError(
    int LineNumber,
    string Scope,
    string SourceLabel,
    string Message);
