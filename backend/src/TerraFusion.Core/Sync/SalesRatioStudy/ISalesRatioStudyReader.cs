using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.SalesRatioStudy;

/// <summary>
/// Slice F5: read-only canonical-equivalent of the operator's
/// sales-ratio-study queries.
///
/// <para>Per
/// <c>docs/sync/operator-sql-regression/sales-ratio-queries.md</c>:
/// the operator's three morning queries — Q1 valid-sale count,
/// Q2 valid-sales by year, Q3 aggregate price (sum/avg) — are
/// already proven canonical-equivalent to their PACS-original
/// forms by <c>OperatorSalesRegressionTests</c>. F5 exposes
/// those same canonical aggregates as read-model surfaces so
/// downstream consumers (operator dashboard panels, ratio-study
/// reports) can read them through the doctrine path instead of
/// running raw SQL against PACS.</para>
///
/// <para>v1 simplifications:
/// <list type="bullet">
///   <item>County-scoped (single county per call) — multi-county
///   ratio studies are out of scope.</item>
///   <item>Aggregate-only — per-row sale lookups remain on
///   <c>SalesController</c> via <c>tf_sale</c>.</item>
///   <item>No <c>hood_cd</c> grouping yet — <c>tf_parcel</c>
///   does not carry a <c>DictNeighborhoodId</c> FK in v1.8;
///   neighborhood-level grouping is deferred to a future slice
///   once the FK lands. The "neighborhood ratio study skeleton"
///   per the v1.0 design spec is reduced in F5 v1 to "ratio
///   study aggregates by year"; the hood_cd extension attaches
///   when the canonical link exists.</item>
///   <item>2018-01-01 cutover hardcoded as the default
///   <c>fromDate</c>; callers may override.</item>
/// </list>
/// </para>
/// </summary>
public interface ISalesRatioStudyReader
{
    /// <summary>
    /// Pre-2018 sales used the old code vocabulary (per the v1.0
    /// PACS conversion caveat). The default cutoff matches the
    /// operator's documented Q1/Q2/Q3 filter and is exposed here
    /// so controllers / clients can surface it without taking a
    /// Data-layer dependency.
    /// </summary>
    public static readonly DateTime DefaultFromDate =
        new(2018, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>
    /// Q1: count of valid (qualified, post-cutover) sales for a
    /// county.
    /// </summary>
    Task<int> GetValidSaleCountAsync(
        Guid countyId,
        DateTime? fromDate = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Q2: count of valid sales grouped by sale year, descending.
    /// </summary>
    Task<IReadOnlyList<SalesByYearRow>> GetValidSalesByYearAsync(
        Guid countyId,
        DateTime? fromDate = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Q3: aggregate sale price (count, sum, average) for valid
    /// sales whose <c>SlPrice</c> is non-null.
    /// </summary>
    Task<SalePriceAggregate> GetAggregateSalePriceAsync(
        Guid countyId,
        DateTime? fromDate = null,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice F5: per-year row of Q2.</summary>
public sealed record SalesByYearRow
{
    public required int SaleYear { get; init; }
    public required int Count { get; init; }
}

/// <summary>Slice F5: aggregate price shape of Q3.</summary>
public sealed record SalePriceAggregate
{
    public required int Count { get; init; }
    public required decimal? TotalPrice { get; init; }
    public required decimal? AveragePrice { get; init; }
}
