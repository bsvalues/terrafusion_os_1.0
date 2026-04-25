using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Services;

/// <summary>
/// Runs IAAO-standard calibration diagnostics against real Benton County
/// assessment and sales data.  Results surface in CalibrationDiagnosticController.
/// </summary>
public class MatrixDiagnosticService : IMatrixDiagnosticService
{
    private readonly DataDbContext _db;
    private readonly ILogger<MatrixDiagnosticService> _logger;

    public MatrixDiagnosticService(
        DataDbContext db,
        ILogger<MatrixDiagnosticService> logger)
    {
        _db    = db;
        _logger = logger;
    }

    // ── Main diagnostic run ───────────────────────────────────────────────────

    public async Task<IReadOnlyList<CalibrationFinding>> RunDiagnosticsAsync(
        int matrixVersionId, CancellationToken ct = default)
    {
        int taxYear     = DateTime.UtcNow.Year;
        int salesYearMin = taxYear - 3;

        // 1. Pull qualified sales (3-year rolling window)
        var sales = await _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.SalePrice > 10_000
                     && s.SaleQualification == "qualified"
                     && s.SalesYear >= salesYearMin
                     && s.SalesYear <= taxYear)
            .Select(s => new { s.ParcelId, s.SalePrice })
            .ToListAsync(ct);

        if (sales.Count == 0)
        {
            _logger.LogWarning("MatrixDiagnostic: no qualified sales found for {YearMin}-{Year}", salesYearMin, taxYear);
            return Array.Empty<CalibrationFinding>();
        }

        var parcelIds = sales
            .Where(s => s.ParcelId != null)
            .Select(s => s.ParcelId!)
            .ToHashSet();

        // 2. Assessed values (current TY from Properties table — canonical)
        var avMap = await _db.Properties
            .AsNoTracking()
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.TaxYear == taxYear && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber!, p => p.AssessedValue, ct);

        // 3. Neighborhood + building type from CamaCharacteristics
        var camaMap = await _db.CamaCharacteristics
            .AsNoTracking()
            .Where(c => parcelIds.Contains(c.ParcelId) && c.NeighborhoodCode != null)
            .Select(c => new { c.ParcelId, c.NeighborhoodCode, c.BuildingType })
            .ToDictionaryAsync(c => c.ParcelId, c => c, ct);

        // 4. Build ratio records grouped by (NeighborhoodCode × BuildingType)
        // Carry AV and SP for proper PRD computation
        var groups = new Dictionary<(string Hood, string BType), List<(decimal AV, decimal SP)>>();

        foreach (var s in sales)
        {
            if (s.ParcelId == null) continue;
            if (!avMap.TryGetValue(s.ParcelId, out var av)) continue;
            if (!camaMap.TryGetValue(s.ParcelId, out var cama)) continue;

            var ratio = av / s.SalePrice;
            if (ratio < 0.5m || ratio > 2.0m) continue;   // IAAO extraordinary-outlier clamp

            var key = (cama.NeighborhoodCode!, cama.BuildingType ?? "R1");
            if (!groups.ContainsKey(key)) groups[key] = new();
            groups[key].Add((av, s.SalePrice));
        }

        // 5. Compute IAAO stats per group and emit findings
        var findings = new List<CalibrationFinding>();

        foreach (var kv in groups.Where(g => g.Value.Count >= 5))
        {
            var pairs = kv.Value;
            var ratios = pairs.Select(p => p.AV / p.SP).ToList();

            decimal cod = ComputeCod(ratios);
            decimal prd = ComputePrd(ratios, pairs.Select(p => p.AV).ToList());
            decimal prb = ComputePrb(ratios, pairs.Select(p => p.AV).ToList());

            var classification = Classify(prd, prb, cod);
            if (classification == "NO_ACTION") continue;

            var revalDigit = kv.Key.Hood.Length >= 1 ? kv.Key.Hood[0].ToString() : "1";
            var revalArea  = int.TryParse(revalDigit, out var d) && d >= 1 && d <= 6
                             ? $"Reval {d}" : "Reval 1";

            decimal medianRatio = Median(ratios);
            decimal proposedAdj = medianRatio > 0
                ? Math.Round((1.0m / medianRatio) - 1.0m, 4)
                : 0m;

            decimal totalAv = pairs.Sum(p => p.AV);
            decimal estimatedImpact = totalAv * proposedAdj;

            // Flag extreme outliers (ratio < 0.70 or > 1.30 within group)
            var outlierParcelIds = sales
                .Where(s => s.ParcelId != null
                         && avMap.TryGetValue(s.ParcelId!, out var av2)
                         && camaMap.TryGetValue(s.ParcelId!, out var c2)
                         && c2.NeighborhoodCode == kv.Key.Hood
                         && (c2.BuildingType ?? "R1") == kv.Key.BType)
                .Where(s => {
                    var r = avMap[s.ParcelId!] / s.SalePrice;
                    return r < 0.70m || r > 1.30m;
                })
                .Select(s => s.ParcelId!)
                .Take(10)
                .ToList();

            findings.Add(new CalibrationFinding
            {
                MatrixVersionId     = matrixVersionId,
                Classification      = classification,
                BuildingType        = kv.Key.BType,
                RevalArea           = revalArea,
                PrdValue            = Math.Round(prd, 4),
                PrbValue            = Math.Round(prb, 4),
                CodValue            = Math.Round(cod, 2),
                ConfidenceLevel     = ComputeConfidence(prd, prb, cod),
                ProposedAdjustmentPct = Math.Round(proposedAdj * 100, 2),
                ProposedRateNew     = null,
                EstimatedAvImpact   = Math.Round(estimatedImpact, 0),
                OutlierParcelIds    = outlierParcelIds.Count > 0
                    ? System.Text.Json.JsonSerializer.Serialize(outlierParcelIds)
                    : null,
                EvidenceSummary     = BuildEvidenceSummary(prd, prb, cod, pairs.Count,
                    kv.Key.Hood, medianRatio),
                ResolutionStatus    = "OPEN",
                CreatedBy           = "ai-diagnostic",
                UpdatedBy           = "ai-diagnostic",
            });
        }

        findings.Sort((a, b) =>
            Math.Abs(b.EstimatedAvImpact ?? 0).CompareTo(Math.Abs(a.EstimatedAvImpact ?? 0)));

        _logger.LogInformation(
            "MatrixDiagnostic: {Total} qualified sales → {Findings} findings across {Groups} groups",
            sales.Count, findings.Count, groups.Count);

        return findings;
    }

    // ── Summary (county-level IAAO stats from real data) ─────────────────────

    public async Task<DiagnosticsSummary> GetSummaryAsync(CancellationToken ct = default)
    {
        int taxYear      = DateTime.UtcNow.Year;
        int salesYearMin = taxYear - 3;

        var sales = await _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.SalePrice > 10_000
                     && s.SaleQualification == "qualified"
                     && s.SalesYear >= salesYearMin
                     && s.SalesYear <= taxYear)
            .Select(s => new { s.ParcelId, s.SalePrice })
            .ToListAsync(ct);

        if (sales.Count == 0)
            return new DiagnosticsSummary(1m, 0m, 0m, 0, 0, DateTime.UtcNow);

        var parcelIds = sales.Where(s => s.ParcelId != null).Select(s => s.ParcelId!).ToHashSet();

        var avMap = await _db.Properties
            .AsNoTracking()
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.TaxYear == taxYear && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber!, p => p.AssessedValue, ct);

        var pairs = sales
            .Where(s => s.ParcelId != null && avMap.ContainsKey(s.ParcelId!))
            .Select(s => (AV: avMap[s.ParcelId!], SP: s.SalePrice))
            .Where(p => {
                var r = p.AV / p.SP;
                return r >= 0.5m && r <= 2.0m;
            })
            .ToList();

        if (pairs.Count == 0)
            return new DiagnosticsSummary(1m, 0m, 0m, 0, 0, DateTime.UtcNow);

        var ratios = pairs.Select(p => p.AV / p.SP).ToList();
        var avList = pairs.Select(p => p.AV).ToList();

        decimal prd = ComputePrd(ratios, avList);
        decimal prb = ComputePrb(ratios, avList);
        decimal cod = ComputeCod(ratios);

        int outOfCompliance = 0;  // placeholder — full count done by neighborhood matrix

        return new DiagnosticsSummary(prd, prb, cod, pairs.Count, outOfCompliance, DateTime.UtcNow);
    }

    // ── IAAO stat helpers (static, pure) ─────────────────────────────────────

    private static decimal Median(List<decimal> ratios)
    {
        var s = ratios.Order().ToList();
        return s.Count % 2 == 1
            ? s[s.Count / 2]
            : (s[s.Count / 2 - 1] + s[s.Count / 2]) / 2m;
    }

    private static decimal ComputePrd(List<decimal> ratios, List<decimal> avs)
    {
        if (ratios.Count == 0) return 1m;
        decimal mean = ratios.Average();
        decimal totalAv = avs.Sum();
        if (totalAv == 0) return 1m;
        // Weighted mean = sum(AV) / sum(SP) = sum(AV) / sum(AV/ratio)
        decimal weightedMean = ratios.Zip(avs, (r, av) => r > 0 ? av / r : 0m).Sum() is var totalSp && totalSp > 0
            ? totalAv / totalSp
            : mean;
        return weightedMean == 0 ? 1m : mean / weightedMean;
    }

    private static decimal ComputePrb(List<decimal> ratios, List<decimal> avs)
    {
        if (ratios.Count < 2) return 0m;
        var lnAvs = avs.Select(v => v > 0 ? (decimal)Math.Log((double)v) : 0m).ToList();
        decimal xMean = lnAvs.Average();
        decimal yMean = ratios.Average();
        decimal num = lnAvs.Zip(ratios, (x, y) => (x - xMean) * (y - yMean)).Sum();
        decimal den = lnAvs.Sum(x => (x - xMean) * (x - xMean));
        return den == 0 ? 0m : num / den;
    }

    private static decimal ComputeCod(List<decimal> ratios)
    {
        if (ratios.Count == 0) return 0m;
        var sorted = ratios.Order().ToList();
        // IQR trim before COD
        var q1 = sorted[(int)(sorted.Count * 0.25)];
        var q3 = sorted[(int)(sorted.Count * 0.75)];
        var iqr = q3 - q1;
        var lo = q1 - 1.5m * iqr;
        var hi = q3 + 1.5m * iqr;
        var trimmed = sorted.Where(r => r >= lo && r <= hi).ToList();
        if (trimmed.Count < 3) trimmed = sorted;
        decimal median = trimmed.Count % 2 == 1
            ? trimmed[trimmed.Count / 2]
            : (trimmed[trimmed.Count / 2 - 1] + trimmed[trimmed.Count / 2]) / 2m;
        if (median == 0) return 0m;
        decimal mad = trimmed.Average(r => Math.Abs(r - median));
        return (mad / median) * 100m;
    }

    private static decimal ComputeConfidence(decimal prd, decimal prb, decimal cod)
    {
        decimal score = 1.0m;
        if (Math.Abs(prd - 1.0m) > 0.05m) score -= 0.1m;
        if (Math.Abs(prb) > 0.05m)         score -= 0.1m;
        if (cod > 20m)                      score -= 0.15m;
        return Math.Max(0.5m, score);
    }

    private static string Classify(decimal prd, decimal prb, decimal cod)
    {
        bool prdBad = prd < 0.95m || prd > 1.05m;
        bool prbBad = Math.Abs(prb) > 0.08m;
        bool codBad = cod > 20m;

        if (!prdBad && !prbBad && !codBad) return "NO_ACTION";
        if (codBad && !prdBad)             return "DATA_PROBLEM";
        if (prbBad || prdBad)              return "RATE_PROBLEM";
        return "RATE_PROBLEM";
    }

    private static string BuildEvidenceSummary(decimal prd, decimal prb, decimal cod, int n, string hood, decimal medianRatio) =>
        $"Hood {hood}: n={n} sales, median ratio={medianRatio:F4}, PRD={prd:F3} (target 0.98-1.03), " +
        $"PRB={prb:F3} (target |PRB|<0.05), COD={cod:F1}%.";
}
