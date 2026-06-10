using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.SalesReview;

/// <summary>
/// Slice F2: read-only sales-review queue. Surfaces the canonical
/// <c>tf_sale</c> rows that still need analyst attention because
/// at least one of the dual-surface qualification surfaces is not
/// yet positive.
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §F:
/// "F2 Sales review queue (uses Block-C sales canonical)." This is
/// one of the operator's morning-dashboard panels and reads
/// directly from <c>canonical_tf.tf_sale</c>; no mutations, no
/// audit-table writes.</para>
///
/// <para><b>Deviation from spec note:</b> the F2 task brief named
/// boolean review-state columns (<c>DorRatioReviewed</c>,
/// <c>CountyRatioReviewed</c>) on <c>tf_sale</c>. The B1+B2
/// doctrine columns that actually exist are <c>DorRatioQualified</c>
/// (always-on rule, derived at promotion time) and
/// <c>CountyRatioReviewed</c> + <c>CountyRatioQualified</c>. F2's
/// "needs DOR review" is therefore expressed as
/// <c>!DorRatioQualified</c> — a sale the analyst should look at
/// because the DOR study currently does not qualify it. This
/// matches the operator-facing intent of the panel without
/// inventing a phantom column on the canonical entity.</para>
///
/// <para>Default behavior:
/// <list type="bullet">
///   <item>Returns sales whose <c>DorRatioQualified = false</c>
///   <b>OR</b> <c>CountyRatioReviewed = false</c>.</item>
///   <item>Filters by <c>SaleDt &gt;= currentYear − lookbackYears</c>
///   (default <c>lookbackYears = 3</c>).</item>
///   <item>Filters by <c>ConversionEra</c> per the
///   <c>era</c> token contract (default
///   <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.PostConversion"/>;
///   <see cref="EraAll"/> bypasses).</item>
///   <item>Ordered by <c>SaleDt</c> descending.</item>
/// </list>
/// </para>
/// </summary>
public interface ISalesReviewReader
{
    /// <summary>
    /// Default review-window lookback. Three years matches the
    /// operator's documented "active sales study window" used in
    /// the morning queue.
    /// </summary>
    public const int DefaultLookbackYears = 3;

    /// <summary>
    /// Default page size. Mirrors the operator dashboard default;
    /// the controller caps at <see cref="MaxResultsHardCap"/>.
    /// </summary>
    public const int DefaultMaxResults = 200;

    /// <summary>
    /// Hard ceiling on <c>maxResults</c>. Above this the controller
    /// clamps. Protects against unbounded county-wide enumeration
    /// from a single REST call.
    /// </summary>
    public const int MaxResultsHardCap = 1000;

    /// <summary>
    /// G3-equivalent "bypass era filter" sentinel (mirrors
    /// <see cref="TerraFusion.Core.Sync.SalesRatioStudy.ISalesRatioStudyReader.EraAll"/>).
    /// </summary>
    public const string EraAll = "ALL";

    /// <summary>
    /// Returns the sales review queue rows for <paramref name="countyId"/>.
    /// </summary>
    /// <param name="countyId">Sovereign-county scope.</param>
    /// <param name="lookbackYears">
    /// Number of years before <see cref="DateTime.UtcNow"/> to include.
    /// Negative or zero values clamp to 1.
    /// </param>
    /// <param name="era">
    /// Conversion-era filter per Block-C contract v1.12 §2. Null
    /// resolves to <c>POST_CONVERSION</c>. Recognized values:
    /// <c>POST_CONVERSION</c>, <c>PRE_CONVERSION_2017</c>,
    /// <c>UNKNOWN</c>, <see cref="EraAll"/>. Unknown values throw
    /// <see cref="ArgumentException"/>.
    /// </param>
    /// <param name="maxResults">
    /// Max rows to return. Clamped to
    /// <c>[1, <see cref="MaxResultsHardCap"/>]</c>.
    /// </param>
    Task<IReadOnlyList<SalesReviewItem>> GetReviewQueueAsync(
        Guid countyId,
        int lookbackYears = DefaultLookbackYears,
        string? era = null,
        int maxResults = DefaultMaxResults,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice F2 row shape. The "ReviewReason" string is a diagnostic
/// hint computed at read time from the dual-surface columns; it is
/// not a persisted value.
/// </summary>
public sealed record SalesReviewItem
{
    public required Guid TfSaleId { get; init; }
    public required Guid TfParcelId { get; init; }
    public required DateTime? SaleDt { get; init; }
    public required decimal? SalePrice { get; init; }

    /// <summary>
    /// B1+B2 doctrine: <c>true</c> iff the sale is currently DOR-
    /// qualified (per <c>tf_doctrine_ratio_policy[StudyName='DOR_RATIO']</c>).
    /// F2 surfaces <c>!DorRatioQualified</c> rows as "needs DOR
    /// review" because the always-on DOR rule has not produced a
    /// qualifying outcome.
    /// </summary>
    public required bool DorRatioQualified { get; init; }

    /// <summary>
    /// B2 doctrine: <c>true</c> iff the county has assigned ANY
    /// <c>sl_county_ratio_cd</c> for this sale. <c>false</c> means
    /// the county has not yet reviewed it.
    /// </summary>
    public required bool CountyRatioReviewed { get; init; }

    /// <summary>
    /// B2 doctrine: <c>true</c> iff the sale is qualified under
    /// <c>COUNTY_INTERNAL_RATIO</c>. May be <c>false</c> even when
    /// reviewed (codes 200/300/400/500).
    /// </summary>
    public required bool CountyRatioQualified { get; init; }

    /// <summary>
    /// Human-readable reason this row is in the queue. One of:
    /// <c>"DOR_REVIEW_PENDING"</c>, <c>"COUNTY_REVIEW_PENDING"</c>,
    /// <c>"BOTH_REVIEWS_PENDING"</c>.
    /// </summary>
    public required string ReviewReason { get; init; }
}
