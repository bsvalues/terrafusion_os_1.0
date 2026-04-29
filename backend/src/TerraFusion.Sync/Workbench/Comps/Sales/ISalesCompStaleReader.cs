using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Comps.Sales;

/// <summary>
/// Slice C43-B: read-only diagnostic reader that surfaces canonical
/// sale-qualification rows whose <c>SourceWorkbookId</c> differs
/// from a baseline workbook id (the per-county "stale" set per
/// C40-A Invariant 5).
///
/// <para>Single SQL predicate per the C43-A policy:
/// <c>WHERE CountyId = @countyId AND SourceWorkbookId &lt;&gt;
/// @baselineWorkbookId</c>. No joins, no aggregations, no
/// projections beyond the canonical row's own fields plus the
/// per-row provenance.</para>
///
/// <para>Hard guards (per C43-A):
/// <list type="bullet">
/// <item>Read-only — pure SELECT projection; never mutates the
///   canonical landing or any other table.</item>
/// <item>County-scoped — <paramref name="countyId"/> is required.</item>
/// <item>Baseline-scoped — <paramref name="baselineWorkbookId"/>
///   is required (the controller resolves it from the explicit
///   query param OR the C41-B active-workbook pointer; the reader
///   itself does NOT perform the resolution).</item>
/// <item>No PII — projects only the canonical row's PII-free
///   fields.</item>
/// <item>Idempotent — same input ⇒ same output.</item>
/// </list>
/// </para>
///
/// <para>Empty-result semantics: returns an empty list when every
/// row in the county already points at the baseline OR when the
/// county has zero canonical rows. Does NOT throw.</para>
/// </summary>
public interface ISalesCompStaleReader
{
    /// <summary>
    /// Return one page of stale canonical rows for the county,
    /// staleness defined relative to <paramref name="baselineWorkbookId"/>.
    /// Ordered by <c>ChgOfOwnerId</c> ascending so re-runs are
    /// deterministic across pages (C43-A Hard Guard 8).
    /// </summary>
    /// <param name="countyId">Sovereign-county scope (required).</param>
    /// <param name="baselineWorkbookId">
    /// The workbook id staleness is computed relative to. Required.
    /// Caller (controller) is responsible for resolving the
    /// baseline; the reader rejects <c>Guid.Empty</c>.
    /// </param>
    /// <param name="page">1-based page index. Caller validates ≥ 1.</param>
    /// <param name="pageSize">Rows per page. Caller validates 1 ≤ pageSize ≤ max.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<IReadOnlyList<StaleCanonicalSale>> ReadPageAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        int  page,
        int  pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exact count of stale rows for the county relative to the
    /// baseline. Used by the controller to populate envelope
    /// metadata. Per C43-A Hard Guard 7 / inherited C39-A Hard
    /// Guard 7, the count MUST be exact — no approximation.
    /// </summary>
    Task<int> CountAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Slice C45-B: maximum <c>SourceWorkbookLockedAt</c> across
    /// the stale-row predicate. Returns <c>null</c> when no rows
    /// match. Used by the controller to seed the C45-A ETag.
    /// </summary>
    Task<DateTime?> MaxLockedAtAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// One stale canonical sale's projection. Mirrors the fields the
/// C43-A policy locks on the wire DTO; the controller maps
/// <see cref="ComputedDecision"/> from the int-stored enum to the
/// wire string.
///
/// <para>Carries <see cref="SourceWorkbookId"/> so callers can
/// reason about which prior workbook produced the row (the row is
/// stale because this id differs from the baseline).</para>
/// </summary>
public sealed record StaleCanonicalSale(
    int       ChgOfOwnerId,
    int       ComputedDecisionRaw,                 // enum stored as int; controller projects to string
    string?   WacCdSourceValue,
    string?   WacCdCanonicalValue,
    string?   SlRatioTypeCdSourceValue,
    string?   SlRatioTypeCdCanonicalValue,
    DateTime? SaleDate,
    decimal?  SalePrice,
    Guid      SourceWorkbookId,
    DateTime  SourceWorkbookLockedAt);
