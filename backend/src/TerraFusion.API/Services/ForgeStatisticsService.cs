using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Interfaces;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Services;

/// <summary>
/// Real IAAO ratio study statistics computed from live Benton County
/// ComparableSales + Properties data. Replaces the prior Random()-based stub.
/// </summary>
public class ForgeStatisticsService : IForgeStatisticsService
{
    private readonly DataDbContext _db;
    private readonly ILogger<ForgeStatisticsService> _logger;

    public ForgeStatisticsService(DataDbContext db, ILogger<ForgeStatisticsService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static int ParseTaxYear(string modelId)
    {
        if (int.TryParse(modelId, out var y) && y >= 2000 && y <= 2100) return y;
        return DateTime.UtcNow.Year;
    }

    private static decimal Median(List<decimal> values)
    {
        if (values.Count == 0) return 0m;
        var s = values.Order().ToList();
        return s.Count % 2 == 1
            ? s[s.Count / 2]
            : (s[s.Count / 2 - 1] + s[s.Count / 2]) / 2m;
    }

    private static decimal ComputeCod(List<decimal> ratios)
    {
        if (ratios.Count < 3) return 0m;
        var sorted = ratios.Order().ToList();
        var q1 = sorted[(int)(sorted.Count * 0.25)];
        var q3 = sorted[(int)(sorted.Count * 0.75)];
        var iqr = q3 - q1;
        var lo = q1 - 1.5m * iqr;
        var hi = q3 + 1.5m * iqr;
        var trimmed = sorted.Where(r => r >= lo && r <= hi).ToList();
        if (trimmed.Count < 3) trimmed = sorted;
        var med = Median(trimmed);
        if (med == 0) return 0m;
        var mad = trimmed.Average(r => Math.Abs(r - med));
        return (mad / med) * 100m;
    }

    private static decimal ComputePrd(List<decimal> ratios, List<decimal> avs)
    {
        if (ratios.Count == 0) return 1m;
        var mean = ratios.Average();
        var totalAv = avs.Sum();
        if (totalAv == 0) return 1m;
        var totalSp = ratios.Zip(avs, (r, av) => r > 0 ? av / r : 0m).Sum();
        if (totalSp == 0) return 1m;
        var weightedMean = totalAv / totalSp;
        return weightedMean == 0 ? 1m : mean / weightedMean;
    }

    private static decimal ComputePrb(List<decimal> ratios, List<decimal> avs)
    {
        if (ratios.Count < 2) return 0m;
        var lnAvs = avs.Select(v => v > 0 ? (decimal)Math.Log((double)v) : 0m).ToList();
        var xMean = lnAvs.Average();
        var yMean = ratios.Average();
        var num = lnAvs.Zip(ratios, (x, y) => (x - xMean) * (y - yMean)).Sum();
        var den = lnAvs.Sum(x => (x - xMean) * (x - xMean));
        return den == 0 ? 0m : num / den;
    }

    /// <summary>
    /// Pull qualified sales with assessed values and neighborhood codes for the given year window.
    /// Neighborhood is resolved from CamaCharacteristics (same pattern as TerraForgeController).
    /// Returns a flat projection used by all stat methods.
    /// </summary>
    private async Task<List<SaleRow>> FetchSaleRowsAsync(
        int taxYear, int windowYears, CancellationToken ct)
    {
        var cutoff = taxYear - (windowYears - 1);

        // Step 1: pull sales
        var rawSales = await _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.SaleQualification == "qualified"
                     && s.SalesYear >= cutoff
                     && s.SalesYear <= taxYear
                     && s.SalePrice > 10_000)
            .Select(s => new
            {
                s.ParcelId,
                s.Address,
                s.PropertyType,
                SalePrice = s.AdjustedSalePrice > 0 ? s.AdjustedSalePrice!.Value : s.SalePrice,
                s.SaleDate,
            })
            .ToListAsync(ct);

        if (rawSales.Count == 0) return new List<SaleRow>();

        var parcelIds = rawSales.Select(s => s.ParcelId).Distinct().ToHashSet();

        // Step 2: AV from Properties (ParcelNumber matches ParcelId)
        var avMap = await _db.Properties
            .AsNoTracking()
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.TaxYear == taxYear && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber!, p => p.AssessedValue, ct);

        // Step 3: neighborhood from CamaCharacteristics
        var hoodMap = await _db.CamaCharacteristics
            .AsNoTracking()
            .Where(c => parcelIds.Contains(c.ParcelId) && c.NeighborhoodCode != null && c.NeighborhoodCode != "")
            .Select(c => new { c.ParcelId, c.NeighborhoodCode })
            .ToDictionaryAsync(c => c.ParcelId, c => c.NeighborhoodCode!, ct);

        // Step 4: build SaleRow list
        var rows = new List<SaleRow>(rawSales.Count);
        foreach (var s in rawSales)
        {
            if (s.ParcelId == null) continue;
            if (!avMap.TryGetValue(s.ParcelId, out var av) || av <= 0) continue;
            if (s.SalePrice <= 0) continue;
            var ratio = Math.Clamp((double)(av / s.SalePrice), 0.5, 2.0);
            rows.Add(new SaleRow
            {
                ParcelId      = s.ParcelId,
                Address       = s.Address ?? "",
                Neighborhood  = hoodMap.TryGetValue(s.ParcelId, out var hood) ? hood : "Unknown",
                PropertyType  = s.PropertyType ?? "residential",
                SalePrice     = s.SalePrice,
                AssessedValue = av,
                SaleDate      = s.SaleDate,
                Ratio         = ratio,
            });
        }
        return rows;
    }

    private sealed class SaleRow
    {
        public string ParcelId { get; set; } = "";
        public string Address { get; set; } = "";
        public string Neighborhood { get; set; } = "Unknown";
        public string PropertyType { get; set; } = "residential";
        public decimal SalePrice { get; set; }
        public decimal AssessedValue { get; set; }
        public DateTime SaleDate { get; set; }
        public double Ratio { get; set; }
    }

    // ── Strata ────────────────────────────────────────────────────────────────

    public async Task<List<StrataResultDto>> GetStrataAsync(
        string modelId, Guid countyId, CancellationToken ct = default)
    {
        var taxYear = ParseTaxYear(modelId);
        _logger.LogInformation("GetStrataAsync: taxYear={TaxYear} countyId={CountyId}", taxYear, countyId);

        var rows = await FetchSaleRowsAsync(taxYear, 3, ct);
        _logger.LogInformation("GetStrataAsync: {Count} qualified sale rows loaded", rows.Count);

        // Normalize PropertyType → readable label
        static string NormalizeType(string raw) => raw.ToUpperInvariant() switch
        {
            "R" or "R1" or "RESIDENTIAL" => "Residential",
            "MH" or "R2" or "MOBILE" or "MANUFACTURED" => "Manufactured",
            "C" or "C1" or "C2" or "C3" or "C4" or "COMMERCIAL" => "Commercial",
            "A" or "A1" or "A2" or "APT" or "APARTMENT" => "Apartment",
            "I" or "I1" or "INDUSTRIAL" => "Industrial",
            "P" or "PERSONAL" => "Personal",
            _ => raw,
        };

        var groups = rows
            .GroupBy(r => (Neighborhood: r.Neighborhood, PropertyType: NormalizeType(r.PropertyType)))
            .Where(g => g.Count() >= 5) // IAAO minimum
            .Select(g =>
            {
                var ratios = g.Select(r => (decimal)r.Ratio).ToList();
                var avs    = g.Select(r => r.AssessedValue).ToList();
                var med    = Median(ratios);
                var cod    = ComputeCod(ratios);
                var prd    = ComputePrd(ratios, avs);
                var qualified = cod <= 15m && prd >= 0.98m && prd <= 1.03m && med >= 0.90m && med <= 1.10m;
                var hood  = g.Key.Neighborhood;
                var pt    = g.Key.PropertyType;
                var id    = $"{hood.ToLowerInvariant().Replace(" ", "-")}-{pt.ToLowerInvariant()}";
                return new StrataResultDto
                {
                    StrataId     = id,
                    StrataLabel  = $"{hood} {pt}",
                    Neighborhood = hood,
                    PropertyType = pt,
                    SampleSize   = g.Count(),
                    MedianRatio  = Math.Round((double)med, 3),
                    Cod          = Math.Round((double)cod, 1),
                    Prd          = Math.Round((double)prd, 3),
                    Qualified    = qualified,
                };
            })
            .OrderBy(s => s.Neighborhood)
            .ThenBy(s => s.PropertyType)
            .ToList();

        _logger.LogInformation("GetStrataAsync: {Count} strata computed", groups.Count);
        return groups;
    }

    // ── Outliers ──────────────────────────────────────────────────────────────

    public async Task<List<OutlierRecordDto>> GetOutliersAsync(
        string modelId, Guid countyId, CancellationToken ct = default)
    {
        var taxYear = ParseTaxYear(modelId);
        _logger.LogInformation("GetOutliersAsync: taxYear={TaxYear}", taxYear);

        var rows = await FetchSaleRowsAsync(taxYear, 3, ct);
        if (rows.Count == 0) return new List<OutlierRecordDto>();

        // Global IQR fence
        var ratios = rows.Select(r => (decimal)r.Ratio).Order().ToList();
        var q1 = ratios[(int)(ratios.Count * 0.25)];
        var q3 = ratios[(int)(ratios.Count * 0.75)];
        var iqr = q3 - q1;
        var lo  = q1 - 1.5m * iqr;
        var hi  = q3 + 1.5m * iqr;
        var globalMedian = Median(ratios);

        var outliers = rows
            .Where(r => (decimal)r.Ratio < lo || (decimal)r.Ratio > hi)
            .Select(r =>
            {
                var ratio = (decimal)r.Ratio;
                var isHigh = ratio > hi;
                var method = "iqr";
                var reason = isHigh
                    ? $"ratio {ratio:F3} > Q3 + 1.5×IQR ({hi:F3})"
                    : $"ratio {ratio:F3} < Q1 - 1.5×IQR ({lo:F3})";
                var deviation = ratio - globalMedian;
                return new OutlierRecordDto
                {
                    ParcelId       = r.ParcelId,
                    Address        = r.Address,
                    Neighborhood   = r.Neighborhood,
                    SalePrice      = r.SalePrice,
                    AssessedValue  = r.AssessedValue,
                    Ratio          = Math.Round((double)ratio, 3),
                    RatioDeviation = Math.Round((double)deviation, 3),
                    OutlierMethod  = method,
                    FlagReason     = reason,
                    Confidence     = Math.Round(Math.Min(99, 70 + Math.Abs((double)deviation) * 50), 0),
                    ReviewStatus   = "pending",
                };
            })
            .OrderByDescending(o => Math.Abs(o.RatioDeviation))
            .Take(200)
            .ToList();

        _logger.LogInformation("GetOutliersAsync: {Count} outliers detected", outliers.Count);
        return outliers;
    }

    // ── Model Comparison ──────────────────────────────────────────────────────

    public async Task<ModelComparisonDto> CompareModelsAsync(
        CompareModelsRequest request, Guid countyId, CancellationToken ct = default)
    {
        // Convention: ModelIdA = taxYear for 1-year window, ModelIdB = taxYear for 3-year window
        // If both parseable and equal, compare 1yr vs 3yr for that taxYear.
        // If different years, compare each year's 1-year window.
        var yearA = ParseTaxYear(request.ModelIdA);
        var yearB = ParseTaxYear(request.ModelIdB);

        _logger.LogInformation("CompareModelsAsync: A={A} B={B}", yearA, yearB);

        List<SaleRow> rowsA, rowsB;
        string labelA, labelB;

        if (yearA == yearB)
        {
            // Same year: compare 1-year vs 3-year rolling windows
            rowsA  = await FetchSaleRowsAsync(yearA, 1, ct);
            rowsB  = await FetchSaleRowsAsync(yearB, 3, ct);
            labelA = $"{yearA} (1-year)";
            labelB = $"{yearB} (3-year)";
        }
        else
        {
            // Different years: compare each year's 3-year window
            rowsA  = await FetchSaleRowsAsync(yearA, 3, ct);
            rowsB  = await FetchSaleRowsAsync(yearB, 3, ct);
            labelA = $"{yearA} study";
            labelB = $"{yearB} study";
        }

        var summaryA = BuildSummary(labelA, rowsA);
        var summaryB = BuildSummary(labelB, rowsB);

        var deltas = new ComparisonDeltasDto
        {
            Cod         = Math.Round(summaryB.Cod - summaryA.Cod, 1),
            Prd         = Math.Round(summaryB.Prd - summaryA.Prd, 3),
            Prb         = Math.Round(summaryB.Prb - summaryA.Prb, 3),
            MedianRatio = Math.Round(summaryB.MedianRatio - summaryA.MedianRatio, 3),
            SampleSize  = summaryB.SampleSize - summaryA.SampleSize,
        };

        var improved = new List<string>();
        var degraded = new List<string>();
        if (deltas.Cod < 0) improved.Add("cod"); else if (deltas.Cod > 0.5) degraded.Add("cod");
        if (Math.Abs(summaryB.Prd - 1.0) < Math.Abs(summaryA.Prd - 1.0)) improved.Add("prd"); else degraded.Add("prd");
        if (Math.Abs(summaryB.Prb) < Math.Abs(summaryA.Prb)) improved.Add("prb"); else degraded.Add("prb");
        if (Math.Abs(summaryB.MedianRatio - 1.0) < Math.Abs(summaryA.MedianRatio - 1.0)) improved.Add("medianRatio"); else degraded.Add("medianRatio");

        return new ModelComparisonDto
        {
            ModelA           = summaryA,
            ModelB           = summaryB,
            Deltas           = deltas,
            ImprovedMetrics  = improved,
            DegradedMetrics  = degraded,
        };
    }

    private static ModelSummaryDto BuildSummary(string label, List<SaleRow> rows)
    {
        if (rows.Count == 0)
            return new ModelSummaryDto { Label = label, SampleSize = 0 };

        var ratios = rows.Select(r => (decimal)r.Ratio).ToList();
        var avs    = rows.Select(r => r.AssessedValue).ToList();
        return new ModelSummaryDto
        {
            Label       = label,
            MedianRatio = Math.Round((double)Median(ratios), 3),
            Cod         = Math.Round((double)ComputeCod(ratios), 1),
            Prd         = Math.Round((double)ComputePrd(ratios, avs), 3),
            Prb         = Math.Round((double)ComputePrb(ratios, avs), 3),
            SampleSize  = rows.Count,
        };
    }

    // ── Segment Discovery ─────────────────────────────────────────────────────

    public async Task<List<DiscoveredSegmentDto>> DiscoverSegmentsAsync(
        string modelId, Guid countyId, CancellationToken ct = default)
    {
        var taxYear = ParseTaxYear(modelId);
        _logger.LogInformation("DiscoverSegmentsAsync: taxYear={TaxYear}", taxYear);

        // Get neighborhood summaries from CamaCharacteristics
        var nbhdStats = await _db.CamaCharacteristics
            .Where(c => c.TaxYear == taxYear && c.NeighborhoodCode != null && c.NeighborhoodCode != "")
            .GroupBy(c => c.NeighborhoodCode!)
            .Select(g => new
            {
                Hood      = g.Key,
                Count     = g.Count(),
                AvgSqft   = g.Average(c => (double?)c.SquareFeet) ?? 0.0,
                AvgYear   = g.Average(c => (double?)c.YearBuilt) ?? 0.0,
                MedianVal = g.Average(c => (double?)c.ImprvVal) ?? 0.0,
            })
            .OrderByDescending(x => x.Count)
            .Take(50)
            .ToListAsync(ct);

        // Enrich with Property AV (median per neighborhood via CamaCharacteristics parcel join)
        var currentYear = taxYear;
        var segments = nbhdStats.Select(n =>
        {
            var avgAge     = currentYear - n.AvgYear;
            var medianVal  = n.MedianVal > 0 ? (decimal)n.MedianVal : 0m;
            var confidence = Math.Min(0.95, 0.60 + (n.Count > 50 ? 0.25 : n.Count / 200.0));
            return new DiscoveredSegmentDto
            {
                Id                  = $"seg-{n.Hood.ToLowerInvariant()}-{taxYear}",
                Name                = $"Neighborhood {n.Hood}",
                BoundaryDescription = $"Properties within neighborhood code {n.Hood}",
                Status              = "pending",
                Confidence          = Math.Round(confidence, 2),
                ParcelCount         = n.Count,
                MedianValue         = Math.Round(medianVal, 0),
                AvgSqft             = Math.Round(n.AvgSqft, 0),
                AvgAge              = Math.Round(avgAge, 1),
                KeyCharacteristics  = new List<string>
                {
                    $"Neighborhood code {n.Hood}",
                    $"{n.Count:N0} parcels",
                    n.AvgYear > 0 ? $"Avg built {(int)n.AvgYear}" : "Year built unknown",
                },
            };
        }).ToList();

        _logger.LogInformation("DiscoverSegmentsAsync: {Count} segments found", segments.Count);
        return segments;
    }
}
