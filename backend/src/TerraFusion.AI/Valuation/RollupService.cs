/*
 * RollupService
 *
 * City/Type/Vintage/Grade rollups that combine parcel counts from
 * CamaCharacteristics with equity metrics from EquityMetricService.
 * Used by TriageTab sidebar and Calibration cross-stratum verify.
 *
 * @version 1.0.0 - Track 2 (CostForge Benton Method v2)
 */

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.AI.Valuation;

public class RollupService : IRollupService
{
    private static readonly Dictionary<string, string> StratumDisplayName = new()
    {
        ["R"] = "Residential SFR",
        ["M"] = "Manufactured",
        ["C"] = "Commercial / Industrial",
        ["A"] = "Agricultural",
        ["V"] = "Vacant",
        ["X"] = "Exempt",
    };

    private readonly TerraFusionDbContext _context;
    private readonly IEquityMetricService _equity;

    public RollupService(TerraFusionDbContext context, IEquityMetricService equity)
    {
        _context = context;
        _equity = equity;
    }

    public async Task<RollupResponseDto> GetRollupAsync(
        Guid countyId, int taxYear, string by, CancellationToken ct = default)
    {
        var stratum = by.ToLowerInvariant();
        if (stratum is not ("city" or "type" or "vintage" or "grade"))
            throw new ArgumentException(
                $"Invalid rollup dimension '{by}'. Use city | type | vintage | grade.", nameof(by));

        // Parcel counts per stratum from CamaCharacteristics
        Dictionary<string, int> parcelCounts;
        Dictionary<string, string> displayNames;

        switch (stratum)
        {
            case "city":
                parcelCounts = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.City != null)
                    .GroupBy(c => c.City!)
                    .Select(g => new { Key = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
                displayNames = parcelCounts.ToDictionary(kv => kv.Key, kv => kv.Key);
                break;

            case "type":
                parcelCounts = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.PropertyUseStratum != null)
                    .GroupBy(c => c.PropertyUseStratum!)
                    .Select(g => new { Key = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
                displayNames = parcelCounts.ToDictionary(
                    kv => kv.Key,
                    kv => StratumDisplayName.GetValueOrDefault(kv.Key, kv.Key));
                break;

            case "vintage":
                var years = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.YearBuilt.HasValue)
                    .Select(c => c.YearBuilt!.Value)
                    .ToListAsync(ct);
                parcelCounts = years
                    .GroupBy(y => y >= 1800 ? $"{(y / 10) * 10}s" : "Unknown")
                    .ToDictionary(g => g.Key, g => g.Count());
                displayNames = parcelCounts.ToDictionary(kv => kv.Key, kv => kv.Key);
                break;

            case "grade":
                parcelCounts = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.QualityGrade != null)
                    .GroupBy(c => c.QualityGrade!)
                    .Select(g => new { Key = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
                displayNames = parcelCounts.ToDictionary(kv => kv.Key, kv => kv.Key);
                break;

            default:
                throw new InvalidOperationException($"unreachable stratum {stratum}");
        }

        // Equity metrics per stratum
        var metricsMap = await _equity.GetMetricsAsync(countyId, taxYear, stratum, null, ct);

        var emptyMetrics = new EquityMetricsDto(
            0, null, null, null, null, null, null,
            new decimal?[10], false, false, "no-data");

        // Include strata that have parcels (even if no sales)
        var allKeys = parcelCounts.Keys.Union(metricsMap.Keys, StringComparer.OrdinalIgnoreCase).ToList();

        var strata = allKeys
            .Select(key => new StratumRollupDto(
                Key: key,
                Name: displayNames.GetValueOrDefault(key, key),
                ParcelCount: parcelCounts.GetValueOrDefault(key, 0),
                SaleCount: metricsMap.TryGetValue(key, out var m) ? m.SaleCount : 0,
                TotalAv: null,
                Metrics: metricsMap.TryGetValue(key, out var m2) ? m2 : emptyMetrics,
                ChildCount: null))
            .OrderByDescending(s => s.ParcelCount)
            .ThenByDescending(s => s.SaleCount)
            .ToList();

        return new RollupResponseDto(countyId, taxYear, stratum, strata);
    }
}
