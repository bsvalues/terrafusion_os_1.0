/*
 * BentonCustomMetricService
 *
 * Implements the 5 Benton-method metrics that go beyond IAAO standards:
 *   1. Decile equity analysis (sort by sale price into 10 buckets, median per bucket)
 *   2. Stratified COD (COD within each vintage-decade / condition / grade segment)
 *   3. WAC condition bias (median ratio per ConditionGrade)
 *   4. Secondary-segment drift (median ratio with/without each CamaImprovementDetail.SegmentType)
 *   5. Quality-grade drift (median ratio per QualityGrade)
 *
 * All 5 consume the same SaleRatio[] from SaleRatioQueryBuilder so numbers
 * are identical across this service and EquityMetricService/RollupService.
 *
 * @version 1.0.0 - Track 3 (CostForge Benton Method v2)
 */

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.AI.Valuation;

public class BentonCustomMetricService : IBentonCustomMetricService
{
    private readonly TerraFusionDbContext _context;

    public BentonCustomMetricService(TerraFusionDbContext context)
    {
        _context = context;
    }

    private async Task<List<SaleRatio>> GetScopedRatiosAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var all = await SaleRatioQueryBuilder.BuildAsync(_context, countyId, taxYear, ct);
        if (string.IsNullOrEmpty(segment) || stratum == "none" || stratum == "county") return all;
        return stratum.ToLowerInvariant() switch
        {
            "neighborhood" => all.Where(r => r.NeighborhoodCode == segment).ToList(),
            "city"         => all.Where(r => r.City == segment).ToList(),
            "type"         => all.Where(r => r.PropertyUseStratum == segment).ToList(),
            _              => all
        };
    }

    public async Task<DecileAnalysisDto> GetDecilesAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        if (ratios.Count < 30)
            return new DecileAnalysisDto(ratios.Count, new decimal?[10], null, "insufficient-data");

        var deciles = EquityMetricService.ComputeDeciles(ratios);
        var d1 = deciles[0];
        var d10 = deciles[9];
        var spread = (d1.HasValue && d10.HasValue) ? d1.Value - d10.Value : (decimal?)null;
        var pattern = spread switch
        {
            null => "insufficient-data",
            > 0.05m => "regressive",
            < -0.05m => "progressive",
            _ => "uniform"
        };
        return new DecileAnalysisDto(ratios.Count, deciles, spread, pattern);
    }

    public async Task<StratifiedCodDto> GetStratifiedCodAsync(
        Guid countyId, int taxYear, string stratum, string? segment, string splitBy, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);

        Func<SaleRatio, string?> keyFn = splitBy.ToLowerInvariant() switch
        {
            "vintage"   => r => EquityMetricService.VintageKey(r.YearBuilt),
            "condition" => r => r.ConditionGrade,
            "grade"     => r => r.QualityGrade,
            _ => throw new ArgumentException(
                $"Unknown splitBy '{splitBy}'. Use vintage | condition | grade.", nameof(splitBy))
        };

        var segments = ratios
            .Where(r => keyFn(r) != null)
            .GroupBy(keyFn!)
            .ToDictionary(
                g => g.Key!,
                g =>
                {
                    var rs = g.Select(r => r.Ratio).ToList();
                    if (rs.Count < 3) return new SegmentCodDto(rs.Count, null, null);
                    var median = EquityMetricService.Median(rs);
                    var cod = EquityMetricService.ComputeCod(rs, median);
                    return new SegmentCodDto(rs.Count, median, cod);
                });

        return new StratifiedCodDto(splitBy, segments);
    }

    public async Task<ConditionBiasDto> GetConditionBiasAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        var grouped = ratios
            .Where(r => r.ConditionGrade != null)
            .GroupBy(r => r.ConditionGrade!)
            .ToDictionary(
                g => g.Key,
                g => new SegmentMedianDto(
                    g.Count(),
                    g.Count() >= 3 ? EquityMetricService.Median(g.Select(r => r.Ratio).ToList()) : null));
        return new ConditionBiasDto(grouped);
    }

    public async Task<SegmentDriftDto> GetSegmentDriftAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        var result = new Dictionary<string, SegmentDriftRowDto>();

        if (ratios.Count == 0)
            return new SegmentDriftDto(result);

        var parcelIds = ratios.Select(r => r.ParcelId).ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Load CamaImprovementDetail segments for these parcels
        var segmentTypes = new[] { "CovPatio", "BSMT", "POLEBLDG", "ATTGAR", "DETGAR", "POOL" };
        var details = await _context.CamaImprovementDetails
            .Where(d => d.CountyId == countyId && d.TaxYear == taxYear
                     && d.SegmentType != null
                     && segmentTypes.Contains(d.SegmentType)
                     && parcelIds.Contains(d.ParcelId))
            .Select(d => new { d.ParcelId, d.SegmentType })
            .ToListAsync(ct);

        foreach (var st in segmentTypes)
        {
            var parcelsWith = details
                .Where(d => d.SegmentType == st)
                .Select(d => d.ParcelId)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var withRatios = ratios.Where(r => parcelsWith.Contains(r.ParcelId))
                .Select(r => r.Ratio).ToList();
            var withoutRatios = ratios.Where(r => !parcelsWith.Contains(r.ParcelId))
                .Select(r => r.Ratio).ToList();

            var mWith = withRatios.Count >= 3 ? EquityMetricService.Median(withRatios) : (decimal?)null;
            var mWithout = withoutRatios.Count >= 3 ? EquityMetricService.Median(withoutRatios) : (decimal?)null;
            var drift = (mWith.HasValue && mWithout.HasValue) ? mWith - mWithout : null;

            result[st] = new SegmentDriftRowDto(
                SalesWithSegment: withRatios.Count,
                MedianWithSegment: mWith,
                SalesWithoutSegment: withoutRatios.Count,
                MedianWithoutSegment: mWithout,
                Drift: drift);
        }

        return new SegmentDriftDto(result);
    }

    public async Task<GradeDriftDto> GetGradeDriftAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        var grouped = ratios
            .Where(r => r.QualityGrade != null)
            .GroupBy(r => r.QualityGrade!)
            .ToDictionary(
                g => g.Key,
                g => new SegmentMedianDto(
                    g.Count(),
                    g.Count() >= 3 ? EquityMetricService.Median(g.Select(r => r.Ratio).ToList()) : null));
        return new GradeDriftDto(grouped);
    }
}
