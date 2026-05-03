using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Sync.SalesRatioStudy;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice F5: EF-backed read-model for sales-ratio-study
/// aggregates. Canonical-equivalent of the operator's morning
/// queries documented in
/// <c>docs/sync/operator-sql-regression/sales-ratio-queries.md</c>.
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
    private readonly TerraFusionDbContext _db;

    public SalesRatioStudyReader(TerraFusionDbContext db) => _db = db;

    public async Task<int> GetValidSaleCountAsync(
        Guid countyId,
        DateTime? fromDate = null,
        CancellationToken cancellationToken = default)
    {
        var cutoff = fromDate ?? ISalesRatioStudyReader.DefaultFromDate;

        return await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt != null
                        && s.SlDt >= cutoff)
            .CountAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<SalesByYearRow>> GetValidSalesByYearAsync(
        Guid countyId,
        DateTime? fromDate = null,
        CancellationToken cancellationToken = default)
    {
        var cutoff = fromDate ?? ISalesRatioStudyReader.DefaultFromDate;

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
        CancellationToken cancellationToken = default)
    {
        var cutoff = fromDate ?? ISalesRatioStudyReader.DefaultFromDate;

        var prices = await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt != null
                        && s.SlDt >= cutoff
                        && s.SlPrice != null)
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
}
