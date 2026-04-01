using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Calibration;

/// <summary>
/// GAMA Equity Guard — Assessment equity monitoring, bias detection,
/// and IAAO compliance enforcement for mass appraisal calibration.
/// Asset: TFT-038 — GAMA equity guard from TerraFusionTheory.
///
/// Implements three core equity checks:
/// 1. Vertical equity (PRD/PRB) — ensures no systematic over/under-assessment by value tier
/// 2. Horizontal equity (COD) — ensures uniform treatment of similar properties
/// 3. Bias detection — identifies systematic assessment bias by property class, neighborhood, or characteristic
///
/// References: IAAO Standard on Ratio Studies (2013), IAAO Standard on Mass Appraisal (2017).
/// </summary>
public interface IGamaEquityGuard
{
    /// <summary>Run full equity analysis on calibration results.</summary>
    EquityAssessment EvaluateEquity(EquityInput input);

    /// <summary>Check a single neighborhood's calibration for IAAO compliance.</summary>
    NeighborhoodEquityResult CheckNeighborhood(string neighborhoodCode, RatioObservation[] ratios);

    /// <summary>Detect systematic bias across a grouping variable.</summary>
    BiasDetectionResult DetectBias(RatioObservation[] ratios, string groupingVariable);

    /// <summary>Generate equity remediation recommendations.</summary>
    EquityRemediation[] RecommendRemediations(EquityAssessment assessment);
}

/// <summary>
/// GAMA Equity Guard implementation.
/// </summary>
public class GamaEquityGuard : IGamaEquityGuard
{
    private readonly ILogger<GamaEquityGuard> _logger;

    // IAAO compliance thresholds
    private const decimal CodResidentialMax = 15.0m;
    private const decimal CodCommercialMax = 20.0m;
    private const decimal CodVacantLandMax = 20.0m;
    private const decimal PrdLow = 0.98m;
    private const decimal PrdHigh = 1.03m;
    private const decimal PrbAbsMax = 0.05m;
    private const decimal MedianRatioLow = 0.90m;
    private const decimal MedianRatioHigh = 1.10m;
    private const int MinSampleSize = 30; // IAAO minimum for statistical reliability

    public GamaEquityGuard(ILogger<GamaEquityGuard> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public EquityAssessment EvaluateEquity(EquityInput input)
    {
        _logger.LogInformation(
            "Evaluating equity for {Count} observations across {Neighborhoods} neighborhoods",
            input.Ratios.Length, input.Ratios.Select(r => r.NeighborhoodCode).Distinct().Count());

        var overallStats = ComputeRatioStatistics(input.Ratios);
        var neighborhoods = input.Ratios
            .GroupBy(r => r.NeighborhoodCode ?? "Unknown")
            .Select(g => CheckNeighborhood(g.Key, g.ToArray()))
            .ToArray();

        var biasResults = new List<BiasDetectionResult>();
        foreach (var groupVar in new[] { "PropertyClass", "Neighborhood", "QualityGrade", "ValueQuartile" })
        {
            biasResults.Add(DetectBias(input.Ratios, groupVar));
        }

        var overallCompliant = IsIaaoCompliant(overallStats, input.PropertyClass);
        var neighborhoodCompliance = neighborhoods.Count(n => n.IsCompliant);

        var assessment = new EquityAssessment
        {
            AnalysisDate = DateTime.UtcNow,
            PropertyClass = input.PropertyClass,
            TotalObservations = input.Ratios.Length,
            OverallStatistics = overallStats,
            IsOverallCompliant = overallCompliant,
            NeighborhoodResults = neighborhoods,
            NeighborhoodComplianceRate = neighborhoods.Length > 0
                ? (decimal)neighborhoodCompliance / neighborhoods.Length
                : 0m,
            BiasResults = biasResults.ToArray(),
            HasSystematicBias = biasResults.Any(b => b.BiasDetected),
            EquityGrade = ComputeEquityGrade(overallStats, overallCompliant, biasResults),
        };

        _logger.LogInformation(
            "Equity assessment complete: Grade={Grade}, Compliant={Compliant}, Bias={Bias}",
            assessment.EquityGrade, assessment.IsOverallCompliant, assessment.HasSystematicBias);

        return assessment;
    }

    /// <inheritdoc />
    public NeighborhoodEquityResult CheckNeighborhood(string neighborhoodCode, RatioObservation[] ratios)
    {
        if (ratios.Length < MinSampleSize)
        {
            return new NeighborhoodEquityResult
            {
                NeighborhoodCode = neighborhoodCode,
                SampleSize = ratios.Length,
                IsCompliant = false,
                InsufficientSample = true,
                Notes = $"Sample size {ratios.Length} below IAAO minimum of {MinSampleSize}",
            };
        }

        var stats = ComputeRatioStatistics(ratios);
        var compliant = IsIaaoCompliant(stats, "Residential"); // default to residential thresholds

        return new NeighborhoodEquityResult
        {
            NeighborhoodCode = neighborhoodCode,
            SampleSize = ratios.Length,
            Statistics = stats,
            IsCompliant = compliant,
            InsufficientSample = false,
            Violations = GetViolations(stats, "Residential"),
        };
    }

    /// <inheritdoc />
    public BiasDetectionResult DetectBias(RatioObservation[] ratios, string groupingVariable)
    {
        var groups = GroupByVariable(ratios, groupingVariable);
        if (groups.Count < 2)
        {
            return new BiasDetectionResult
            {
                GroupingVariable = groupingVariable,
                BiasDetected = false,
                Notes = "Insufficient groups for bias detection",
            };
        }

        var groupStats = groups.Select(g => new GroupStatistic
        {
            GroupLabel = g.Key,
            SampleSize = g.Value.Length,
            MedianRatio = ComputeMedian(g.Value.Select(r => r.Ratio).ToArray()),
            MeanRatio = g.Value.Average(r => r.Ratio),
        }).ToArray();

        // Kruskal-Wallis-like test: check if median ratios differ significantly across groups
        var overallMedian = ComputeMedian(ratios.Select(r => r.Ratio).ToArray());
        var maxDeviation = groupStats.Max(g => Math.Abs(g.MedianRatio - overallMedian));
        var biasDetected = maxDeviation > 0.05m; // 5% deviation threshold

        // Compute PRD-style vertical equity check across groups
        var sortedGroups = groupStats.OrderBy(g => g.MeanRatio).ToArray();
        decimal trendSlope = 0;
        if (sortedGroups.Length >= 2)
        {
            trendSlope = sortedGroups.Last().MedianRatio - sortedGroups.First().MedianRatio;
        }

        return new BiasDetectionResult
        {
            GroupingVariable = groupingVariable,
            BiasDetected = biasDetected,
            MaxDeviationFromOverall = maxDeviation,
            TrendSlope = trendSlope,
            GroupStatistics = groupStats,
            Notes = biasDetected
                ? $"Systematic bias detected: max deviation {maxDeviation:P1} from overall median"
                : "No systematic bias detected",
        };
    }

    /// <inheritdoc />
    public EquityRemediation[] RecommendRemediations(EquityAssessment assessment)
    {
        var remediations = new List<EquityRemediation>();

        // COD remediation
        if (assessment.OverallStatistics.Cod > CodResidentialMax)
        {
            remediations.Add(new EquityRemediation
            {
                Priority = RemediationPriority.High,
                Category = "Horizontal Equity",
                Metric = "COD",
                CurrentValue = assessment.OverallStatistics.Cod,
                TargetValue = CodResidentialMax,
                Recommendation = "Reduce assessment dispersion through targeted neighborhood recalibration. "
                    + "Focus on neighborhoods with highest individual COD values.",
            });
        }

        // PRD remediation
        if (assessment.OverallStatistics.Prd < PrdLow || assessment.OverallStatistics.Prd > PrdHigh)
        {
            var direction = assessment.OverallStatistics.Prd > PrdHigh ? "regressive" : "progressive";
            remediations.Add(new EquityRemediation
            {
                Priority = RemediationPriority.High,
                Category = "Vertical Equity",
                Metric = "PRD",
                CurrentValue = assessment.OverallStatistics.Prd,
                TargetValue = 1.00m,
                Recommendation = $"Assessment is {direction} (PRD={assessment.OverallStatistics.Prd:F3}). "
                    + "Recalibrate value models to reduce systematic bias across value tiers.",
            });
        }

        // PRB remediation
        if (Math.Abs(assessment.OverallStatistics.Prb) > PrbAbsMax)
        {
            remediations.Add(new EquityRemediation
            {
                Priority = RemediationPriority.Medium,
                Category = "Vertical Equity",
                Metric = "PRB",
                CurrentValue = assessment.OverallStatistics.Prb,
                TargetValue = 0m,
                Recommendation = "Price-related bias exceeds IAAO threshold. Review regression model "
                    + "specification for value-dependent systematic errors.",
            });
        }

        // Neighborhood-level remediations
        foreach (var nbhd in assessment.NeighborhoodResults.Where(n => !n.IsCompliant && !n.InsufficientSample))
        {
            remediations.Add(new EquityRemediation
            {
                Priority = RemediationPriority.Medium,
                Category = "Neighborhood Compliance",
                Metric = $"Neighborhood {nbhd.NeighborhoodCode}",
                Recommendation = $"Neighborhood {nbhd.NeighborhoodCode} fails IAAO compliance. "
                    + $"Violations: {string.Join(", ", nbhd.Violations ?? Array.Empty<string>())}",
            });
        }

        // Bias remediations
        foreach (var bias in assessment.BiasResults.Where(b => b.BiasDetected))
        {
            remediations.Add(new EquityRemediation
            {
                Priority = RemediationPriority.Medium,
                Category = "Systematic Bias",
                Metric = bias.GroupingVariable,
                Recommendation = $"Systematic bias by {bias.GroupingVariable}: {bias.Notes}. "
                    + "Review calibration model for omitted variable bias.",
            });
        }

        return remediations.OrderBy(r => r.Priority).ToArray();
    }

    #region Private Helpers

    private RatioStatistics ComputeRatioStatistics(RatioObservation[] ratios)
    {
        var values = ratios.Select(r => r.Ratio).OrderBy(v => v).ToArray();
        int n = values.Length;
        if (n == 0) return new RatioStatistics();

        decimal median = ComputeMedian(values);
        decimal mean = values.Average();

        // COD = (AAD / median) * 100
        decimal aad = values.Average(v => Math.Abs(v - median));
        decimal cod = median != 0 ? (aad / median) * 100m : 0m;

        // PRD = mean ratio / weighted mean ratio
        decimal sumSalePrice = ratios.Sum(r => r.SalePrice);
        decimal weightedMean = sumSalePrice > 0
            ? ratios.Sum(r => r.Ratio * r.SalePrice) / sumSalePrice
            : mean;
        decimal prd = weightedMean != 0 ? mean / weightedMean : 1m;

        // PRB via simplified regression (ln(ratio) = α + β·ln(value))
        decimal prb = ComputePrb(ratios);

        // COV = (std dev / mean) * 100
        decimal variance = n > 1
            ? values.Sum(v => (v - mean) * (v - mean)) / (n - 1)
            : 0m;
        decimal stdDev = (decimal)Math.Sqrt((double)variance);
        decimal cov = mean != 0 ? (stdDev / mean) * 100m : 0m;

        return new RatioStatistics
        {
            N = n,
            Mean = mean,
            Median = median,
            Cod = cod,
            Prd = prd,
            Prb = prb,
            Cov = cov,
            Min = values.First(),
            Max = values.Last(),
            Q1 = ComputePercentile(values, 25),
            Q3 = ComputePercentile(values, 75),
        };
    }

    private static decimal ComputePrb(RatioObservation[] ratios)
    {
        // PRB per IAAO 2013 Section 9.3: OLS of ln(ratio) on ln(predicted_value)
        // Simplified: ln(AV/SP) = α + β·ln(0.5·AV + 0.5·SP) + ε
        // PRB ≈ β
        var data = ratios
            .Where(r => r.Ratio > 0 && r.SalePrice > 0 && r.AssessedValue > 0)
            .Select(r => new
            {
                Y = Math.Log((double)r.Ratio),
                X = Math.Log((double)(0.5m * r.AssessedValue + 0.5m * r.SalePrice)),
            })
            .ToArray();

        if (data.Length < 10) return 0m;

        double meanX = data.Average(d => d.X);
        double meanY = data.Average(d => d.Y);
        double ssxy = data.Sum(d => (d.X - meanX) * (d.Y - meanY));
        double ssxx = data.Sum(d => (d.X - meanX) * (d.X - meanX));

        if (Math.Abs(ssxx) < 1e-10) return 0m;
        return (decimal)(ssxy / ssxx);
    }

    private static decimal ComputeMedian(decimal[] sorted)
    {
        int n = sorted.Length;
        if (n == 0) return 0;
        return n % 2 == 1 ? sorted[n / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2m;
    }

    private static decimal ComputePercentile(decimal[] sorted, int percentile)
    {
        if (sorted.Length == 0) return 0;
        double index = (percentile / 100.0) * (sorted.Length - 1);
        int lower = (int)Math.Floor(index);
        int upper = (int)Math.Ceiling(index);
        if (lower == upper) return sorted[lower];
        double frac = index - lower;
        return sorted[lower] + (decimal)frac * (sorted[upper] - sorted[lower]);
    }

    private bool IsIaaoCompliant(RatioStatistics stats, string propertyClass)
    {
        decimal codMax = propertyClass switch
        {
            "Commercial" => CodCommercialMax,
            "VacantLand" => CodVacantLandMax,
            _ => CodResidentialMax,
        };

        return stats.Cod <= codMax
            && stats.Prd >= PrdLow && stats.Prd <= PrdHigh
            && Math.Abs(stats.Prb) <= PrbAbsMax
            && stats.Median >= MedianRatioLow && stats.Median <= MedianRatioHigh;
    }

    private string[] GetViolations(RatioStatistics stats, string propertyClass)
    {
        var violations = new List<string>();
        decimal codMax = propertyClass == "Commercial" ? CodCommercialMax : CodResidentialMax;

        if (stats.Cod > codMax) violations.Add($"COD {stats.Cod:F1} > {codMax}");
        if (stats.Prd < PrdLow) violations.Add($"PRD {stats.Prd:F3} < {PrdLow}");
        if (stats.Prd > PrdHigh) violations.Add($"PRD {stats.Prd:F3} > {PrdHigh}");
        if (Math.Abs(stats.Prb) > PrbAbsMax) violations.Add($"|PRB| {Math.Abs(stats.Prb):F3} > {PrbAbsMax}");
        if (stats.Median < MedianRatioLow) violations.Add($"Median {stats.Median:F3} < {MedianRatioLow}");
        if (stats.Median > MedianRatioHigh) violations.Add($"Median {stats.Median:F3} > {MedianRatioHigh}");

        return violations.ToArray();
    }

    private static Dictionary<string, RatioObservation[]> GroupByVariable(
        RatioObservation[] ratios, string variable)
    {
        return variable switch
        {
            "PropertyClass" => ratios.GroupBy(r => r.PropertyClass ?? "Unknown")
                .ToDictionary(g => g.Key, g => g.ToArray()),
            "Neighborhood" => ratios.GroupBy(r => r.NeighborhoodCode ?? "Unknown")
                .ToDictionary(g => g.Key, g => g.ToArray()),
            "QualityGrade" => ratios.GroupBy(r => r.QualityGrade ?? "Unknown")
                .ToDictionary(g => g.Key, g => g.ToArray()),
            "ValueQuartile" => GroupByValueQuartile(ratios),
            _ => ratios.GroupBy(r => "All").ToDictionary(g => g.Key, g => g.ToArray()),
        };
    }

    private static Dictionary<string, RatioObservation[]> GroupByValueQuartile(RatioObservation[] ratios)
    {
        var sorted = ratios.OrderBy(r => r.SalePrice).ToArray();
        int n = sorted.Length;
        int q = n / 4;
        var result = new Dictionary<string, RatioObservation[]>();
        if (q > 0)
        {
            result["Q1"] = sorted.Take(q).ToArray();
            result["Q2"] = sorted.Skip(q).Take(q).ToArray();
            result["Q3"] = sorted.Skip(2 * q).Take(q).ToArray();
            result["Q4"] = sorted.Skip(3 * q).ToArray();
        }
        return result;
    }

    private static string ComputeEquityGrade(
        RatioStatistics stats, bool compliant, List<BiasDetectionResult> biasResults)
    {
        if (!compliant) return biasResults.Any(b => b.BiasDetected) ? "F" : "D";
        if (biasResults.Any(b => b.BiasDetected)) return "C";
        if (stats.Cod <= 10m && stats.Prd >= 0.99m && stats.Prd <= 1.01m) return "A";
        return "B";
    }

    #endregion
}

#region Records

/// <summary>Input data for equity evaluation.</summary>
public record EquityInput
{
    public RatioObservation[] Ratios { get; init; } = Array.Empty<RatioObservation>();
    public string PropertyClass { get; init; } = "Residential";
    public int TaxYear { get; init; }
}

/// <summary>A single assessment-to-sale ratio observation.</summary>
public record RatioObservation
{
    public string ParcelId { get; init; } = string.Empty;
    public decimal AssessedValue { get; init; }
    public decimal SalePrice { get; init; }
    public decimal Ratio { get; init; }
    public string? NeighborhoodCode { get; init; }
    public string? PropertyClass { get; init; }
    public string? QualityGrade { get; init; }
    public DateTime SaleDate { get; init; }
}

/// <summary>Computed ratio study statistics.</summary>
public record RatioStatistics
{
    public int N { get; init; }
    public decimal Mean { get; init; }
    public decimal Median { get; init; }
    public decimal Cod { get; init; }
    public decimal Prd { get; init; }
    public decimal Prb { get; init; }
    public decimal Cov { get; init; }
    public decimal Min { get; init; }
    public decimal Max { get; init; }
    public decimal Q1 { get; init; }
    public decimal Q3 { get; init; }
}

/// <summary>Full equity assessment result.</summary>
public record EquityAssessment
{
    public DateTime AnalysisDate { get; init; }
    public string PropertyClass { get; init; } = string.Empty;
    public int TotalObservations { get; init; }
    public RatioStatistics OverallStatistics { get; init; } = new();
    public bool IsOverallCompliant { get; init; }
    public NeighborhoodEquityResult[] NeighborhoodResults { get; init; } = Array.Empty<NeighborhoodEquityResult>();
    public decimal NeighborhoodComplianceRate { get; init; }
    public BiasDetectionResult[] BiasResults { get; init; } = Array.Empty<BiasDetectionResult>();
    public bool HasSystematicBias { get; init; }
    public string EquityGrade { get; init; } = string.Empty;
}

/// <summary>Equity result for a single neighborhood.</summary>
public record NeighborhoodEquityResult
{
    public string NeighborhoodCode { get; init; } = string.Empty;
    public int SampleSize { get; init; }
    public RatioStatistics? Statistics { get; init; }
    public bool IsCompliant { get; init; }
    public bool InsufficientSample { get; init; }
    public string[]? Violations { get; init; }
    public string? Notes { get; init; }
}

/// <summary>Bias detection result for a grouping variable.</summary>
public record BiasDetectionResult
{
    public string GroupingVariable { get; init; } = string.Empty;
    public bool BiasDetected { get; init; }
    public decimal MaxDeviationFromOverall { get; init; }
    public decimal TrendSlope { get; init; }
    public GroupStatistic[] GroupStatistics { get; init; } = Array.Empty<GroupStatistic>();
    public string? Notes { get; init; }
}

/// <summary>Statistics for a single group within bias detection.</summary>
public record GroupStatistic
{
    public string GroupLabel { get; init; } = string.Empty;
    public int SampleSize { get; init; }
    public decimal MedianRatio { get; init; }
    public decimal MeanRatio { get; init; }
}

/// <summary>Equity remediation recommendation.</summary>
public record EquityRemediation
{
    public RemediationPriority Priority { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Metric { get; init; } = string.Empty;
    public decimal CurrentValue { get; init; }
    public decimal TargetValue { get; init; }
    public string Recommendation { get; init; } = string.Empty;
}

/// <summary>Remediation priority levels.</summary>
public enum RemediationPriority
{
    High = 1,
    Medium = 2,
    Low = 3,
}

#endregion
