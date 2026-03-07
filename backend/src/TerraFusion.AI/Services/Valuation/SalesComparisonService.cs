using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services.Valuation;

/// <summary>
/// USPAP-aligned Sales Comparison Approach service.
/// Ported from quarantine: applications/terraforge-suite/harness/src/approaches/sales.ts
/// Adjusts comparable sales to subject property and produces deterministic indicated value.
/// </summary>
public class SalesComparisonService
{
    private readonly ILogger<SalesComparisonService> _logger;

    public SalesComparisonService(ILogger<SalesComparisonService> logger)
    {
        _logger = logger;
    }

    public SalesApproachResult RunSalesApproach(SalesApproachInput input)
    {
        try
        {
            if (input.Comparables is null || input.Comparables.Count == 0)
                return SalesApproachResult.Failure("At least one comparable sale is required");

            var analysis = input.Comparables.Select(comp =>
            {
                var adjustments = CalculateAdjustments(input.SubjectCharacteristics, comp, input.AdjustmentRates);
                var adjustedPrice = comp.SalePrice + adjustments.Total;
                var grossAdjustment = Math.Abs(adjustments.Total);
                var grossAdjustmentPercent = comp.SalePrice > 0
                    ? Math.Round(grossAdjustment / (double)comp.SalePrice * 10000) / 100
                    : 0;
                var netAdjustmentPercent = comp.SalePrice > 0
                    ? Math.Round((double)adjustments.Total / (double)comp.SalePrice * 10000) / 100
                    : 0;
                var weight = CalculateWeight(grossAdjustmentPercent);

                return new ComparableAnalysis
                {
                    CompId = comp.CompId,
                    SalePrice = comp.SalePrice,
                    Adjustments = adjustments,
                    AdjustedPrice = adjustedPrice,
                    GrossAdjustmentPercent = grossAdjustmentPercent,
                    NetAdjustmentPercent = netAdjustmentPercent,
                    Weight = weight,
                };
            }).ToList();

            var adjustedPrices = analysis.Select(a => a.AdjustedPrice).ToList();
            var mean = (long)Math.Round(adjustedPrices.Average(p => (double)p));
            var med = Median(adjustedPrices);
            var stdDev = StandardDeviation(adjustedPrices, mean);
            var cov = mean > 0 ? Math.Round((double)stdDev / mean * 10000) / 100 : 0;

            // Determine value method and calculate indicated value
            var totalWeight = analysis.Sum(a => a.Weight);
            string valueMethod;
            long indicatedValue;

            if (totalWeight > 0 && analysis.Count >= 3)
            {
                valueMethod = "weighted_average";
                var weightedSum = analysis.Sum(a => (double)a.AdjustedPrice * a.Weight);
                indicatedValue = (long)Math.Round(weightedSum / totalWeight);
            }
            else
            {
                valueMethod = "median";
                indicatedValue = med;
            }

            // Quality indicators
            var grossAdjustmentPercents = analysis.Select(a => a.GrossAdjustmentPercent).ToList();
            var confidenceLevel = DetermineConfidence(cov, grossAdjustmentPercents, analysis.Count);
            var avgGrossAdj = grossAdjustmentPercents.Average();
            var adjScore = Math.Max(0, 100 - avgGrossAdj * 2);
            var covScore = Math.Max(0, 100 - cov * 3);
            var countScore = Math.Min(100, analysis.Count * 20);
            var comparabilityScore = Math.Round((adjScore * 0.4 + covScore * 0.3 + countScore * 0.3) * 10) / 10;
            var flags = GenerateFlags(analysis, cov);

            var output = new SalesApproachOutput
            {
                SubjectParcelId = input.SubjectParcelId,
                IndicatedValue = indicatedValue,
                ValueMethod = valueMethod,
                ComparableAnalysis = analysis,
                Statistics = new SalesStatistics
                {
                    AdjustedPriceRange = new ValueRange { Min = adjustedPrices.Min(), Max = adjustedPrices.Max() },
                    AdjustedPriceMean = mean,
                    AdjustedPriceMedian = med,
                    StandardDeviation = stdDev,
                    CoefficientOfVariation = cov,
                },
                QualityIndicators = new SalesQualityIndicators
                {
                    ComparabilityScore = comparabilityScore,
                    ConfidenceLevel = confidenceLevel,
                    Flags = flags,
                },
                Explanation = GenerateExplanation(input, analysis, indicatedValue, valueMethod),
            };

            _logger.LogInformation(
                "Sales comparison completed for parcel {ParcelId}: {CompCount} comps, indicated value {Value}, confidence {Confidence}",
                input.SubjectParcelId, analysis.Count, indicatedValue, confidenceLevel);

            return SalesApproachResult.Success(output);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sales approach failed for parcel {ParcelId}", input.SubjectParcelId);
            return SalesApproachResult.Failure($"Sales approach failed: {ex.Message}");
        }
    }

    private static ComparableAdjustments CalculateAdjustments(
        SubjectCharacteristics subject, Comparable comp, AdjustmentRates rates)
    {
        var glaAdj = (long)Math.Round((subject.Gla - comp.Gla) * rates.GlaPerSqFt);
        var lotAdj = (long)Math.Round((subject.LotSize - comp.LotSize) * rates.LotSizePerSqFt);
        var ageAdj = (long)Math.Round((double)(comp.YearBuilt - subject.YearBuilt) * rates.AgePerYear);

        var bedroomAdj = rates.BedroomAdjustment.HasValue
            ? (long)Math.Round((double)((subject.Bedrooms ?? 0) - (comp.Bedrooms ?? 0)) * rates.BedroomAdjustment.Value)
            : 0L;
        var bathroomAdj = rates.BathroomAdjustment.HasValue
            ? (long)Math.Round((double)((subject.Bathrooms ?? 0) - (comp.Bathrooms ?? 0)) * rates.BathroomAdjustment.Value)
            : 0L;

        var conditionAdj = rates.ConditionAdjustments.GetValueOrDefault(subject.Condition, 0)
                         - rates.ConditionAdjustments.GetValueOrDefault(comp.Condition, 0);
        var locationAdj = rates.LocationAdjustments.GetValueOrDefault(subject.Location, 0)
                        - rates.LocationAdjustments.GetValueOrDefault(comp.Location, 0);

        var total = glaAdj + lotAdj + ageAdj + bedroomAdj + bathroomAdj + conditionAdj + locationAdj;

        return new ComparableAdjustments
        {
            Gla = glaAdj,
            LotSize = lotAdj,
            Age = ageAdj,
            Bedrooms = bedroomAdj,
            Bathrooms = bathroomAdj,
            Condition = conditionAdj,
            Location = locationAdj,
            Total = total,
        };
    }

    private static double CalculateWeight(double grossAdjustmentPercent)
    {
        var capped = Math.Min(grossAdjustmentPercent, 50);
        return Math.Round((1 - capped / 50) * 100) / 100;
    }

    private static long Median(List<long> values)
    {
        if (values.Count == 0) return 0;
        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (long)Math.Round((sorted[mid - 1] + sorted[mid]) / 2.0)
            : sorted[mid];
    }

    private static long StandardDeviation(List<long> values, long mean)
    {
        if (values.Count < 2) return 0;
        var avgSquaredDiff = values.Average(v => Math.Pow(v - mean, 2));
        return (long)Math.Round(Math.Sqrt(avgSquaredDiff));
    }

    private static string DetermineConfidence(double cov, List<double> grossAdjPercents, int compCount)
    {
        var avgGrossAdj = grossAdjPercents.Average();
        if (compCount >= 3 && cov < 10 && avgGrossAdj < 15) return "High";
        if (compCount >= 2 && cov < 20 && avgGrossAdj < 25) return "Moderate";
        return "Low";
    }

    private static List<string> GenerateFlags(List<ComparableAnalysis> analysis, double cov)
    {
        var flags = new List<string>();
        var highAdj = analysis.Count(a => a.GrossAdjustmentPercent > 25);
        if (highAdj > 0)
            flags.Add($"{highAdj} comparable(s) have gross adjustments > 25%");
        if (cov > 15)
            flags.Add($"High coefficient of variation ({cov:F1}%) indicates value dispersion");
        if (analysis.Count < 3)
            flags.Add($"Limited comparable sales ({analysis.Count}) - recommend additional market research");
        return flags;
    }

    private static string GenerateExplanation(
        SalesApproachInput input, List<ComparableAnalysis> analysis, long indicatedValue, string method)
    {
        var subject = input.SubjectCharacteristics;
        var methodDesc = method switch
        {
            "median" => "median of adjusted sale prices",
            "weighted_average" => "weighted average based on comparability",
            "bracketed_mean" => "bracketed mean of adjusted sale prices",
            _ => method
        };

        var adjustedPrices = analysis.Select(a => a.AdjustedPrice).ToList();
        var min = adjustedPrices.Min();
        var max = adjustedPrices.Max();

        return $"Sales Comparison Analysis for parcel {input.SubjectParcelId}: " +
               $"{input.Comparables.Count} comparable sales were analyzed. " +
               $"Subject property: {subject.Gla:N0} SF GLA, {subject.LotSize:N0} SF lot, " +
               $"built {subject.YearBuilt}, {subject.Condition} condition, {subject.Location} location. " +
               $"After adjustments, indicated values range from ${min:N0} to ${max:N0}. " +
               $"Using {methodDesc}, the indicated value is ${indicatedValue:N0}.";
    }
}

// ============================================================
// DTOs
// ============================================================

public class SalesApproachInput
{
    public string SubjectParcelId { get; set; } = string.Empty;
    public SubjectCharacteristics SubjectCharacteristics { get; set; } = new();
    public List<Comparable> Comparables { get; set; } = new();
    public AdjustmentRates AdjustmentRates { get; set; } = new();
}

public class SubjectCharacteristics
{
    public double Gla { get; set; }
    public double LotSize { get; set; }
    public int YearBuilt { get; set; }
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public string Condition { get; set; } = "Average";
    public string Location { get; set; } = "Average";
}

public class Comparable
{
    public string CompId { get; set; } = string.Empty;
    public long SalePrice { get; set; }
    public string SaleDate { get; set; } = string.Empty;
    public double Gla { get; set; }
    public double LotSize { get; set; }
    public int YearBuilt { get; set; }
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public string Condition { get; set; } = "Average";
    public string Location { get; set; } = "Average";
}

public class AdjustmentRates
{
    public double GlaPerSqFt { get; set; }
    public double LotSizePerSqFt { get; set; }
    public double AgePerYear { get; set; }
    public double? BedroomAdjustment { get; set; }
    public double? BathroomAdjustment { get; set; }
    public Dictionary<string, long> ConditionAdjustments { get; set; } = new();
    public Dictionary<string, long> LocationAdjustments { get; set; } = new();
}

public class ComparableAdjustments
{
    public long Gla { get; set; }
    public long LotSize { get; set; }
    public long Age { get; set; }
    public long Bedrooms { get; set; }
    public long Bathrooms { get; set; }
    public long Condition { get; set; }
    public long Location { get; set; }
    public long Total { get; set; }
}

public class ComparableAnalysis
{
    public string CompId { get; set; } = string.Empty;
    public long SalePrice { get; set; }
    public ComparableAdjustments Adjustments { get; set; } = new();
    public long AdjustedPrice { get; set; }
    public double GrossAdjustmentPercent { get; set; }
    public double NetAdjustmentPercent { get; set; }
    public double Weight { get; set; }
}

public class ValueRange
{
    public long Min { get; set; }
    public long Max { get; set; }
}

public class SalesStatistics
{
    public ValueRange AdjustedPriceRange { get; set; } = new();
    public long AdjustedPriceMean { get; set; }
    public long AdjustedPriceMedian { get; set; }
    public long StandardDeviation { get; set; }
    public double CoefficientOfVariation { get; set; }
}

public class SalesQualityIndicators
{
    public double ComparabilityScore { get; set; }
    public string ConfidenceLevel { get; set; } = "Moderate";
    public List<string> Flags { get; set; } = new();
}

public class SalesApproachOutput
{
    public string SubjectParcelId { get; set; } = string.Empty;
    public long IndicatedValue { get; set; }
    public string ValueMethod { get; set; } = string.Empty;
    public List<ComparableAnalysis> ComparableAnalysis { get; set; } = new();
    public SalesStatistics Statistics { get; set; } = new();
    public SalesQualityIndicators QualityIndicators { get; set; } = new();
    public string Explanation { get; set; } = string.Empty;
}

public class SalesApproachResult
{
    public bool IsSuccess { get; set; }
    public SalesApproachOutput? Data { get; set; }
    public string? Error { get; set; }

    public static SalesApproachResult Success(SalesApproachOutput data) => new() { IsSuccess = true, Data = data };
    public static SalesApproachResult Failure(string error) => new() { IsSuccess = false, Error = error };
}
