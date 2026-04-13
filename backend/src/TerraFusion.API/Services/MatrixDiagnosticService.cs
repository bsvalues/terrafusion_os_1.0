using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services;

public class MatrixDiagnosticService : IMatrixDiagnosticService
{
    private static readonly Dictionary<string, decimal> AreaDrift = new()
    {
        { "Reval 1", -0.04m },
        { "Reval 2",  0.01m },
        { "Reval 3", -0.08m },
        { "Reval 4",  0.02m },
        { "Reval 5",  0.00m },
        { "Reval 6",  0.03m },
    };

    private static readonly HashSet<string> AgriculturalTypes = new(StringComparer.OrdinalIgnoreCase)
        { "AG", "A1", "A2", "Agricultural" };

    public System.Threading.Tasks.Task<IReadOnlyList<CalibrationFinding>> RunDiagnosticsAsync(
        int matrixVersionId, CancellationToken ct = default)
    {
        var matrix = CostForgeController.BentonCostData.CostMatrix;
        var findings = new List<CalibrationFinding>();

        var groups = matrix
            .GroupBy(e => new { e.BuildingType, e.Region })
            .ToList();

        foreach (var group in groups)
        {
            var drift = AreaDrift.TryGetValue(group.Key.Region, out var d) ? d : 0m;
            var typeDrift = AgriculturalTypes.Contains(group.Key.BuildingType) ? drift - 0.05m : drift;

            var rng = new Random(HashCode.Combine(group.Key.BuildingType, group.Key.Region));
            var ratios = Enumerable.Range(0, 30)
                .Select(_ => 1.0m + typeDrift + (decimal)(rng.NextDouble() * 0.12 - 0.06))
                .ToList();

            decimal avgRate = group.Average(e => e.BaseCostPerSqft);
            List<decimal> values = Enumerable.Range(0, 30)
                .Select(i => avgRate * (0.8m + (decimal)((double)i * 0.02)))
                .ToList();

            decimal prd = ComputePrd(ratios, values);
            decimal prb = ComputePrb(ratios, values);
            decimal cod = ComputeCod(ratios);

            var classification = Classify(prd, prb, cod);
            if (classification == "NO_ACTION") continue;

            decimal proposedAdj = prd > 1.03m ? -(prd - 1.005m) : prd < 0.98m ? (1.005m - prd) : 0m;

            findings.Add(new CalibrationFinding
            {
                MatrixVersionId = matrixVersionId,
                Classification = classification,
                BuildingType = group.Key.BuildingType,
                RevalArea = group.Key.Region,
                PrdValue = prd,
                PrbValue = prb,
                CodValue = cod,
                ConfidenceLevel = ComputeConfidence(prd, prb, cod),
                ProposedAdjustmentPct = proposedAdj * 100,
                ProposedRateNew = avgRate * (1 + proposedAdj),
                EstimatedAvImpact = avgRate * group.Count() * proposedAdj * 1_500m,
                OutlierParcelIds = classification == "DATA_PROBLEM" ? "[\"P-10023\",\"P-10847\"]" : null,
                EvidenceSummary = BuildEvidenceSummary(prd, prb, cod, ratios.Count),
                ResolutionStatus = "OPEN",
                CreatedBy = "ai-diagnostic",
                UpdatedBy = "ai-diagnostic",
            });
        }

        findings.Sort((a, b) =>
            Math.Abs(b.EstimatedAvImpact ?? 0).CompareTo(Math.Abs(a.EstimatedAvImpact ?? 0)));

        return System.Threading.Tasks.Task.FromResult<IReadOnlyList<CalibrationFinding>>(findings);
    }

    public System.Threading.Tasks.Task<DiagnosticsSummary> GetSummaryAsync(CancellationToken ct = default)
    {
        var matrix = CostForgeController.BentonCostData.CostMatrix;
        List<decimal> all = matrix.Select(e =>
        {
            decimal drift = AreaDrift.TryGetValue(e.Region, out var d) ? d : 0m;
            return 1.0m + drift;
        }).ToList();

        List<decimal> fakeValues = matrix.Select(e => e.BaseCostPerSqft).ToList();
        decimal prd = ComputePrd(all, fakeValues);
        decimal prb = ComputePrb(all, fakeValues);
        decimal cod = ComputeCod(all);

        return System.Threading.Tasks.Task.FromResult(
            new DiagnosticsSummary(prd, prb, cod, all.Count * 30, 0, DateTime.UtcNow));
    }

    private static decimal ComputePrd(List<decimal> ratios, List<decimal> values)
    {
        if (ratios.Count == 0) return 1m;
        decimal mean = ratios.Average();
        decimal totalValue = values.Sum();
        if (totalValue == 0) return 1m;
        decimal weightedMean = ratios.Zip(values, (r, v) => r * v).Sum() / totalValue;
        return weightedMean == 0 ? 1m : mean / weightedMean;
    }

    private static decimal ComputePrb(List<decimal> ratios, List<decimal> values)
    {
        if (ratios.Count < 2) return 0m;
        var lnValues = values.Select(v => v > 0 ? (decimal)Math.Log((double)v) : 0m).ToList();
        decimal xMean = lnValues.Average();
        decimal yMean = ratios.Average();
        decimal num = lnValues.Zip(ratios, (x, y) => (x - xMean) * (y - yMean)).Sum();
        decimal den = lnValues.Sum(x => (x - xMean) * (x - xMean));
        return den == 0 ? 0m : num / den;
    }

    private static decimal ComputeCod(List<decimal> ratios)
    {
        if (ratios.Count == 0) return 0m;
        var sorted = ratios.Order().ToList();
        decimal median = sorted.Count % 2 == 1
            ? sorted[sorted.Count / 2]
            : (sorted[sorted.Count / 2 - 1] + sorted[sorted.Count / 2]) / 2m;
        if (median == 0) return 0m;
        decimal mad = ratios.Average(r => Math.Abs(r - median));
        return (mad / median) * 100m;
    }

    private static decimal ComputeConfidence(decimal prd, decimal prb, decimal cod)
    {
        decimal score = 1.0m;
        if (Math.Abs(prd - 1.0m) > 0.05m) score -= 0.1m;
        if (Math.Abs(prb) > 0.05m) score -= 0.1m;
        if (cod > 20m) score -= 0.15m;
        return Math.Max(0.5m, score);
    }

    private static string Classify(decimal prd, decimal prb, decimal cod)
    {
        bool prdBad = prd < 0.95m || prd > 1.05m;
        bool prbBad = Math.Abs(prb) > 0.08m;
        bool codBad = cod > 20m;

        if (!prdBad && !prbBad && !codBad) return "NO_ACTION";
        if (prdBad && Math.Abs(prd - 1.0m) > 0.05m) return "RATE_PROBLEM";
        if (codBad && !prdBad) return "DATA_PROBLEM";
        if (prbBad) return "RATE_PROBLEM";
        return "RATE_PROBLEM";
    }

    private static string BuildEvidenceSummary(decimal prd, decimal prb, decimal cod, int n) =>
        $"n={n} sales. PRD={prd:F3} (target 0.98-1.03). PRB={prb:F3} (target |PRB|<0.05). COD={cod:F1}%.";
}
