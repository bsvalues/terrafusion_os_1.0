/*
 * EquityMetricService
 *
 * IAAO + Benton Method equity metric computation from canonical SaleRatio data.
 * Computes median, weighted mean, arithmetic mean, COD, PRD, PRB, and decile
 * medians from a single SaleRatio[] input, guaranteeing every surface sees
 * the same numbers for the same stratum.
 *
 * Thresholds:
 *   IAAO Compliant: median ∈ [0.9, 1.1] AND cod ≤ 15 AND prd ∈ [0.98, 1.03] AND |prb| ≤ 0.05
 *   Benton Compliant: IAAO + max|decileMedian - overallMedian| ≤ 0.10
 *
 * Sample-size gates:
 *   n < 3:  provenance = "insufficient-sales", no metrics
 *   n < 10: PRB returns null (needs ≥10 for regression stability)
 *   n < 30: Decile array returns all nulls (avoid volatility)
 *
 * @version 1.0.0 - Track 1 (CostForge Benton Method v2)
 */

using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.AI.Valuation;

public class EquityMetricService : IEquityMetricService
{
    private readonly TerraFusionDbContext _context;
    private readonly ILogger<EquityMetricService> _logger;

    public EquityMetricService(TerraFusionDbContext context, ILogger<EquityMetricService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IDictionary<string, EquityMetricsDto>> GetMetricsAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default)
    {
        var ratios = await SaleRatioQueryBuilder.BuildAsync(_context, countyId, taxYear, ct);

        // Segment filter narrows the input population before grouping
        if (!string.IsNullOrEmpty(segment))
        {
            ratios = stratum.ToLowerInvariant() switch
            {
                "neighborhood" => ratios.Where(r => r.NeighborhoodCode == segment).ToList(),
                "city"         => ratios.Where(r => r.City == segment).ToList(),
                "type"         => ratios.Where(r => r.PropertyUseStratum == segment).ToList(),
                "vintage"      => ratios.Where(r => VintageKey(r.YearBuilt) == segment).ToList(),
                "condition"    => ratios.Where(r => r.ConditionGrade == segment).ToList(),
                "grade"        => ratios.Where(r => r.QualityGrade == segment).ToList(),
                _              => ratios
            };
        }

        // Group by the stratum
        IEnumerable<IGrouping<string, SaleRatio>> groups;
        switch (stratum.ToLowerInvariant())
        {
            case "none":
            case "county":
                groups = ratios.Count > 0
                    ? new[] { ratios.GroupBy(_ => "ALL").First() }
                    : Enumerable.Empty<IGrouping<string, SaleRatio>>();
                break;
            case "neighborhood":
                groups = ratios.Where(r => r.NeighborhoodCode != null).GroupBy(r => r.NeighborhoodCode!);
                break;
            case "city":
                groups = ratios.Where(r => r.City != null).GroupBy(r => r.City!);
                break;
            case "type":
                groups = ratios.Where(r => r.PropertyUseStratum != null).GroupBy(r => r.PropertyUseStratum!);
                break;
            case "vintage":
                groups = ratios.GroupBy(r => VintageKey(r.YearBuilt));
                break;
            case "condition":
                groups = ratios.Where(r => r.ConditionGrade != null).GroupBy(r => r.ConditionGrade!);
                break;
            case "grade":
                groups = ratios.Where(r => r.QualityGrade != null).GroupBy(r => r.QualityGrade!);
                break;
            default:
                throw new ArgumentException(
                    $"Unknown stratum '{stratum}'. Must be: none|county|neighborhood|city|type|vintage|condition|grade",
                    nameof(stratum));
        }

        var result = groups.ToDictionary(
            g => g.Key,
            g => ComputeFromRatios(g.ToList())
        );

        _logger.LogDebug(
            "EquityMetrics: county={CountyId} year={TaxYear} stratum={Stratum} groups={GroupCount} totalSales={Total}",
            countyId, taxYear, stratum, result.Count, ratios.Count);

        return result;
    }

    public EquityMetricsDto ComputeFromRatios(IReadOnlyList<SaleRatio> ratios)
    {
        if (ratios.Count == 0)
        {
            return new EquityMetricsDto(
                0, null, null, null, null, null, null,
                new decimal?[10], false, false, "no-data");
        }

        if (ratios.Count < 3)
        {
            return new EquityMetricsDto(
                ratios.Count, null, null, null, null, null, null,
                new decimal?[10], false, false, "insufficient-sales");
        }

        var rArr = ratios.Select(r => r.Ratio).ToList();
        var median = Median(rArr);
        var arith = rArr.Average();
        var sumAv = ratios.Sum(r => r.AssessedValue);
        var sumSale = ratios.Sum(r => r.AdjustedSalePrice);
        var wMean = sumSale > 0 ? sumAv / sumSale : (decimal?)null;
        var cod = ComputeCod(rArr, median);
        var prd = (wMean.HasValue && wMean.Value > 0) ? arith / wMean.Value : (decimal?)null;
        var prb = ratios.Count >= 10 ? ComputePrb(ratios, median) : (decimal?)null;
        var deciles = ratios.Count >= 30 ? ComputeDeciles(ratios) : new decimal?[10];

        bool iaaoCompliant =
            median >= 0.9m && median <= 1.1m
            && cod <= 15m
            && prd.HasValue && prd.Value >= 0.98m && prd.Value <= 1.03m
            && prb.HasValue && Math.Abs(prb.Value) <= 0.05m;

        bool bentonCompliant = iaaoCompliant
            && deciles.All(d => !d.HasValue || Math.Abs(d.Value - median) <= 0.10m);

        return new EquityMetricsDto(
            ratios.Count, median, wMean, arith, cod, prd, prb, deciles,
            iaaoCompliant, bentonCompliant, "real");
    }

    // ── Statistical primitives (all public-static for reuse by Track 3 + tests) ──

    public static decimal Median(IList<decimal> values)
    {
        if (values.Count == 0) return 0m;
        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2m
            : sorted[mid];
    }

    public static decimal ComputeCod(IList<decimal> ratios, decimal median)
    {
        if (ratios.Count == 0 || median == 0) return 0m;
        var absDev = ratios.Select(r => Math.Abs(r - median)).Average();
        return (absDev / median) * 100m;
    }

    /// <summary>
    /// Price-Related Bias via OLS regression of ln(ratio/median) on
    /// ln(value/median_value), where value = (AV + SalePrice)/2 (IAAO standard proxy).
    /// Returns the slope (β₁).
    /// </summary>
    public static decimal ComputePrb(IReadOnlyList<SaleRatio> ratios, decimal median)
    {
        if (ratios.Count < 2 || median <= 0) return 0m;

        var values = ratios.Select(r => (r.AssessedValue + r.AdjustedSalePrice) / 2m).ToList();
        var medianValue = Median(values);
        if (medianValue <= 0) return 0m;

        var pairs = ratios
            .Select((r, i) => new
            {
                X = Math.Log((double)(values[i] / medianValue)),
                Y = Math.Log((double)(r.Ratio / median))
            })
            .ToList();

        var meanX = pairs.Average(p => p.X);
        var meanY = pairs.Average(p => p.Y);
        var num = pairs.Sum(p => (p.X - meanX) * (p.Y - meanY));
        var den = pairs.Sum(p => (p.X - meanX) * (p.X - meanX));
        return den > 0 ? (decimal)(num / den) : 0m;
    }

    /// <summary>
    /// Decile median ratios: sort sales by AdjustedSalePrice into 10 equal-count
    /// buckets, compute median ratio per decile. Empty deciles return null.
    /// </summary>
    public static decimal?[] ComputeDeciles(IReadOnlyList<SaleRatio> ratios)
    {
        var sorted = ratios.OrderBy(r => r.AdjustedSalePrice).ToList();
        var bucketSize = sorted.Count / 10;
        var result = new decimal?[10];
        for (int i = 0; i < 10; i++)
        {
            var start = i * bucketSize;
            var end = (i == 9) ? sorted.Count : (i + 1) * bucketSize;
            if (end <= start) { result[i] = null; continue; }
            var slice = sorted.Skip(start).Take(end - start).Select(r => r.Ratio).ToList();
            result[i] = slice.Count > 0 ? Median(slice) : null;
        }
        return result;
    }

    public static string VintageKey(int? yearBuilt)
    {
        if (!yearBuilt.HasValue || yearBuilt.Value < 1800) return "Unknown";
        return $"{(yearBuilt.Value / 10) * 10}s";
    }
}
