using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesRatioStudy;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice F5 + G3: EF-backed read-model for sales-ratio-study
/// aggregates. Canonical-equivalent of the operator's morning
/// queries documented in
/// <c>docs/sync/operator-sql-regression/sales-ratio-queries.md</c>,
/// extended in v1.12 with the <c>era</c> conversion-era filter.
///
/// <para>Read-only by contract: <c>AsNoTracking</c> on every
/// query, no <c>SaveChangesAsync</c>. The reader sits over
/// <c>canonical_tf.tf_sale</c> directly — the canonical-vs-PACS
/// equivalence is already proven by
/// <c>OperatorSalesRegressionTests</c>; F5 just reshapes the
/// equivalent into typed result records.</para>
/// </summary>
public sealed class SalesRatioStudyReader : ISalesRatioStudyReader
{
    private static readonly DateTime EraCutoverDate =
        new(ConversionEras.CutoverYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;

    public SalesRatioStudyReader(TerraFusionDbContext db) => _db = db;

    public async Task<int> GetValidSaleCountAsync(
        Guid countyId,
        DateTime? fromDate = null,
        string? era = null,
        CancellationToken cancellationToken = default)
    {
        var cutoff = fromDate ?? ISalesRatioStudyReader.DefaultFromDate;
        var eraPredicate = ResolveEraPredicate(era);

        return await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt != null
                        && s.SlDt >= cutoff)
            .Where(eraPredicate)
            .CountAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<SalesByYearRow>> GetValidSalesByYearAsync(
        Guid countyId,
        DateTime? fromDate = null,
        string? era = null,
        CancellationToken cancellationToken = default)
    {
        var cutoff = fromDate ?? ISalesRatioStudyReader.DefaultFromDate;
        var eraPredicate = ResolveEraPredicate(era);

        // EF may not translate Year() across all providers; a
        // safe portable shape is to materialize the date column
        // and group in memory. Aggregate-only output stays small
        // (one row per year), so this is bounded.
        var dates = await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt != null
                        && s.SlDt >= cutoff)
            .Where(eraPredicate)
            .Select(s => s.SlDt!.Value)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        return dates
            .GroupBy(d => d.Year)
            .Select(g => new SalesByYearRow
            {
                SaleYear = g.Key,
                Count = g.Count(),
            })
            .OrderByDescending(r => r.SaleYear)
            .ToList();
    }

    public async Task<SalePriceAggregate> GetAggregateSalePriceAsync(
        Guid countyId,
        DateTime? fromDate = null,
        string? era = null,
        CancellationToken cancellationToken = default)
    {
        var cutoff = fromDate ?? ISalesRatioStudyReader.DefaultFromDate;
        var eraPredicate = ResolveEraPredicate(era);

        var prices = await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt != null
                        && s.SlDt >= cutoff
                        && s.SlPrice != null)
            .Where(eraPredicate)
            .Select(s => s.SlPrice!.Value)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        if (prices.Count == 0)
        {
            return new SalePriceAggregate
            {
                Count = 0,
                TotalPrice = null,
                AveragePrice = null,
            };
        }

        var sum = prices.Sum();
        return new SalePriceAggregate
        {
            Count = prices.Count,
            TotalPrice = sum,
            AveragePrice = sum / prices.Count,
        };
    }

    /// <summary>
    /// Slice G3 (v1.12): translates an era filter token into a
    /// <c>tf_sale</c> predicate. Per Block-C contract v1.12 §2:
    ///
    /// <list type="bullet">
    ///   <item><c>null</c> resolves to <see cref="ConversionEras.PostConversion"/>.</item>
    ///   <item><see cref="ISalesRatioStudyReader.EraAll"/> bypasses
    ///   the era filter entirely.</item>
    ///   <item>Recognized eras (POST / PRE / UNKNOWN) match by
    ///   exact column value AND, for POST / PRE only, by
    ///   year-fallback when the column is <c>NULL</c> (per v1.10 §0.5
    ///   doctrine that pre-G2 rows fall back to their year column).</item>
    ///   <item>Unrecognized values throw <see cref="ArgumentException"/>.</item>
    /// </list>
    /// </summary>
    private static Expression<Func<TfSale, bool>> ResolveEraPredicate(string? era)
    {
        var resolved = era ?? ConversionEras.PostConversion;

        if (resolved == ISalesRatioStudyReader.EraAll)
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
            // UNKNOWN never falls back to year — by doctrine v1.10 §2
            // the truth-layer never emits UNKNOWN, and canonical-layer
            // UNKNOWN is the explicit "contributors disagree" signal.
            return s => s.ConversionEra == ConversionEras.Unknown;
        }

        throw new ArgumentException(
            $"Unrecognized era '{era}'. Valid values: " +
            $"{ConversionEras.PostConversion}, {ConversionEras.PreConversion2017}, " +
            $"{ConversionEras.Unknown}, {ISalesRatioStudyReader.EraAll}.",
            nameof(era));
    }
}
