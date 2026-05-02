using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsSaleRegression;

/// <summary>
/// Slice S5: regression-suite contract — given a county scope and a
/// post-2018 cutover, run three representative ratio-study queries
/// in two flavors and assert equality.
///
/// <para>The "PACS flavor" runs against the raw layer with a
/// supp-aware join, mirroring what the assessor would write today
/// against <c>dbo.sale</c>. The "canonical flavor" runs against
/// <c>canonical_tf.tf_sale</c> with the documented filter
/// (<c>SaleQualified = true</c>, county-isolated). The doctrine
/// asserts both flavors produce identical aggregates.</para>
///
/// <para>See <c>docs/sync/operator-sql-regression/sales-ratio-queries.md</c>
/// for the binding query texts.</para>
/// </summary>
public interface IOperatorSalesRegressionService
{
    /// <summary>Q1. Count of valid sales (post-cutover).</summary>
    Task<int> ValidSaleCountPacsAsync(Guid countyId, CancellationToken ct = default);
    Task<int> ValidSaleCountCanonicalAsync(Guid countyId, CancellationToken ct = default);

    /// <summary>Q2. Histogram of valid sales by sale-year (post-cutover).</summary>
    Task<IReadOnlyDictionary<int, int>> ValidSalesByYearPacsAsync(
        Guid countyId, CancellationToken ct = default);
    Task<IReadOnlyDictionary<int, int>> ValidSalesByYearCanonicalAsync(
        Guid countyId, CancellationToken ct = default);

    /// <summary>Q3. Aggregate price (sum + count of priced rows).</summary>
    Task<RegressionPriceAggregate> ValidSalePriceAggregatePacsAsync(
        Guid countyId, CancellationToken ct = default);
    Task<RegressionPriceAggregate> ValidSalePriceAggregateCanonicalAsync(
        Guid countyId, CancellationToken ct = default);
}

/// <summary>Slice S5: aggregate price result for Q3.</summary>
public sealed record RegressionPriceAggregate
{
    public required int Count { get; init; }
    public required decimal? TotalPrice { get; init; }
    public required decimal? AveragePrice { get; init; }
}
