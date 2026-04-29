using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Comps.Sales;

/// <summary>
/// Slice C44-B: read-only diagnostic reader that aggregates stale
/// canonical sale-qualification rows by
/// <c>(SourceWorkbookId, ComputedDecision)</c> for a county per
/// the C44-A policy.
///
/// <para>Three methods, all single-predicate aggregations against
/// <c>CanonicalSaleQualifications</c>:
/// <list type="bullet">
/// <item><see cref="GroupAsync"/> returns the top-N groups by
///   <c>count DESC</c>, tie-breaking by <c>sourceWorkbookId
///   ASC</c>. The N is server-supplied (the controller passes
///   <c>maxGroups = 100</c> per C44-A Hard Guard 4).</item>
/// <item><see cref="GroupCountAsync"/> returns the exact count of
///   distinct <c>(SourceWorkbookId, ComputedDecision)</c> pairs
///   so the controller can detect truncation cheaply without
///   materializing the full group list.</item>
/// <item><see cref="TotalStaleRowsAsync"/> returns the
///   <c>COUNT(*)</c> of stale rows for the top-line total.</item>
/// </list>
/// </para>
///
/// <para>Hard guards inherited from C43-A / C44-A:
/// <list type="bullet">
/// <item>Read-only — pure aggregation projections; no mutation.</item>
/// <item>County-scoped — <paramref name="countyId"/> required.</item>
/// <item>Baseline-scoped — <paramref name="baselineWorkbookId"/>
///   required; the reader rejects <c>Guid.Empty</c>.</item>
/// <item>No PII — output carries only Guids, decision strings,
///   and counts.</item>
/// <item>Idempotent — same input ⇒ same output.</item>
/// </list>
/// </para>
/// </summary>
public interface ISalesCompStaleSummaryReader
{
    /// <summary>
    /// Return the top-<paramref name="maxGroups"/> stale-row groups
    /// for the county, ordered by <c>count DESC</c> then
    /// <c>sourceWorkbookId ASC</c> (deterministic tie-break per
    /// C44-A Hard Guard 8).
    /// </summary>
    /// <param name="countyId">Sovereign-county scope (required).</param>
    /// <param name="baselineWorkbookId">
    /// Workbook id staleness is computed relative to. Required;
    /// the controller resolves it via explicit query param OR the
    /// C41-B active-workbook pointer before calling.
    /// </param>
    /// <param name="maxGroups">
    /// Server-supplied cap (typically 100 per C44-A Hard Guard 4).
    /// Caller validates ≥ 1; the reader treats values ≥ 1 as the
    /// top-N bound.
    /// </param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<IReadOnlyList<StaleSummaryGroupRow>> GroupAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        int  maxGroups,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exact count of distinct
    /// <c>(SourceWorkbookId, ComputedDecision)</c> pairs in the
    /// county's stale set. Used by the controller to detect
    /// truncation.
    /// </summary>
    Task<int> GroupCountAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Top-line <c>COUNT(*)</c> of stale rows for the county
    /// relative to the baseline. Independent of the group cap.
    /// </summary>
    Task<int> TotalStaleRowsAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// One group's projection: <c>(SourceWorkbookId,
/// ComputedDecision-as-int, Count)</c>. The controller maps
/// <see cref="ComputedDecisionRaw"/> from the int-stored enum
/// to the wire string per C44-A's wire-stability contract.
/// </summary>
public sealed record StaleSummaryGroupRow(
    Guid SourceWorkbookId,
    int  ComputedDecisionRaw,
    int  Count);
