using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesReview;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice F2: EF-backed read-model for the sales-review queue.
///
/// <para>Surfaces canonical <c>tf_sale</c> rows where at least one
/// of the dual-surface qualification reviews
/// (<c>DorRatioReviewed</c> / <c>CountyRatioReviewed</c>) is still
/// outstanding. Read-only by contract: <c>AsNoTracking</c>; no
/// <c>SaveChangesAsync</c>.</para>
///
/// <para>The era filter mirrors <see cref="SalesRatioStudyReader"/>
/// — same vocabulary, same NULL-fallback rules per v1.10 §0.5 — so
/// the operator's panels share consistent era semantics across F2
/// and F5.</para>
/// </summary>
public sealed class SalesReviewReader : ISalesReviewReader
{
    private static readonly DateTime EraCutoverDate =
        new(ConversionEras.CutoverYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;
    private readonly Func<DateTime> _utcNow;

    public SalesReviewReader(TerraFusionDbContext db)
        : this(db, () => DateTime.UtcNow)
    {
    }

    /// <summary>
    /// Test seam: lets unit tests inject a frozen "now" so the
    /// lookback-year window is deterministic. Public because the
    /// project does not configure <c>InternalsVisibleTo</c> for
    /// the test assembly.
    /// </summary>
    public SalesReviewReader(TerraFusionDbContext db, Func<DateTime> utcNow)
    {
        _db = db;
        _utcNow = utcNow;
    }

    public async Task<IReadOnlyList<SalesReviewItem>> GetReviewQueueAsync(
        Guid countyId,
        int lookbackYears = ISalesReviewReader.DefaultLookbackYears,
        string? era = null,
        int maxResults = ISalesReviewReader.DefaultMaxResults,
        CancellationToken cancellationToken = default)
    {
        var clampedLookback = lookbackYears < 1 ? 1 : lookbackYears;
        var clampedMax = maxResults < 1
            ? 1
            : (maxResults > ISalesReviewReader.MaxResultsHardCap
                ? ISalesReviewReader.MaxResultsHardCap
                : maxResults);

        var floor = _utcNow().AddYears(-clampedLookback);
        var eraPredicate = ResolveEraPredicate(era);

        // F2 predicate: a sale is in the queue when EITHER the DOR
        // study has not produced a qualifying outcome (DorRatioQualified=false,
        // surfaced as "DOR review pending") OR the county has not yet
        // reviewed the sale (CountyRatioReviewed=false). The two
        // conditions can both be true; ComputeReviewReason names that.
        var rows = await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SlDt != null
                        && s.SlDt >= floor
                        && (!s.DorRatioQualified || !s.CountyRatioReviewed))
            .Where(eraPredicate)
            .OrderByDescending(s => s.SlDt)
            .ThenBy(s => s.TfSaleId)
            .Take(clampedMax)
            .Select(s => new
            {
                s.TfSaleId,
                s.TfParcelId,
                s.SlDt,
                s.SlPrice,
                s.DorRatioQualified,
                s.CountyRatioReviewed,
                s.CountyRatioQualified,
            })
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        return rows
            .Select(r => new SalesReviewItem
            {
                TfSaleId = r.TfSaleId,
                TfParcelId = r.TfParcelId,
                SaleDt = r.SlDt,
                SalePrice = r.SlPrice,
                DorRatioQualified = r.DorRatioQualified,
                CountyRatioReviewed = r.CountyRatioReviewed,
                CountyRatioQualified = r.CountyRatioQualified,
                ReviewReason = ComputeReviewReason(
                    r.DorRatioQualified, r.CountyRatioReviewed),
            })
            .ToList();
    }

    private static string ComputeReviewReason(bool dorQualified, bool countyReviewed)
    {
        // "DOR review pending" = DOR study currently does NOT qualify
        // the sale; analyst should look at it.
        if (!dorQualified && !countyReviewed) return "BOTH_REVIEWS_PENDING";
        if (!dorQualified) return "DOR_REVIEW_PENDING";
        return "COUNTY_REVIEW_PENDING";
    }

    /// <summary>
    /// Mirrors <see cref="SalesRatioStudyReader"/> era semantics so
    /// F2 and F5 share one vocabulary. Null resolves to
    /// POST_CONVERSION; <see cref="ISalesReviewReader.EraAll"/>
    /// bypasses; PRE/POST fall back to <c>SlDt</c> year when the
    /// column is NULL (v1.10 §0.5 doctrine); UNKNOWN requires an
    /// exact column match (v1.12 §2).
    /// </summary>
    private static Expression<Func<TfSale, bool>> ResolveEraPredicate(string? era)
    {
        var resolved = era ?? ConversionEras.PostConversion;

        if (resolved == ISalesReviewReader.EraAll)
        {
            return _ => true;
        }
        if (resolved == ConversionEras.PostConversion)
        {
            return s => s.ConversionEra == ConversionEras.PostConversion
                || (s.ConversionEra == null && s.SlDt != null && s.SlDt >= EraCutoverDate);
        }
        if (resolved == ConversionEras.PreConversion2017)
        {
            return s => s.ConversionEra == ConversionEras.PreConversion2017
                || (s.ConversionEra == null && s.SlDt != null && s.SlDt < EraCutoverDate);
        }
        if (resolved == ConversionEras.Unknown)
        {
            return s => s.ConversionEra == ConversionEras.Unknown;
        }

        throw new ArgumentException(
            $"Unrecognized era '{era}'. Valid values: " +
            $"{ConversionEras.PostConversion}, {ConversionEras.PreConversion2017}, " +
            $"{ConversionEras.Unknown}, {ISalesReviewReader.EraAll}.",
            nameof(era));
    }
}
