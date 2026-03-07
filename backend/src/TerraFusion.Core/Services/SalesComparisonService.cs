using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

/// <summary>
/// Sales comparison approach — USPAP-aligned paired-sales adjustment grid.
/// Data extracted from quarantine terraforge-suite/harness/src/approaches/sales.ts
/// and Benton County PACS comparable tables.
/// </summary>
public class SalesComparisonService : ISalesComparisonService
{
  private readonly ILogger<SalesComparisonService> _logger;

  // ── Benton County Default Adjustment Rates ──
  // Source: quarantine/terraforge-suite/harness/fixtures/sales_approach/standard_3comp.json
  private static readonly AdjustmentRatesDto BentonDefaultRates = new()
  {
    GlaPerSqFt = 100m,
    LotSizePerSqFt = 5m,
    AgePerYear = 500m,
    BedroomAdjustment = 5000m,
    BathroomAdjustment = 7500m,
    ConditionAdjustments = new Dictionary<string, decimal>
    {
      ["excellent"] = 20000m,
      ["good"] = 10000m,
      ["average"] = 0m,
      ["fair"] = -10000m,
      ["poor"] = -25000m,
    },
    LocationAdjustments = new Dictionary<string, decimal>
    {
      ["superior"] = 25000m,
      ["good"] = 12500m,
      ["average"] = 0m,
      ["fair"] = -12500m,
      ["inferior"] = -25000m,
    },
  };

  // Maximum gross adjustment % before comp is flagged as weak
  private const double MaxGrossAdjustmentPercent = 50.0;

  public SalesComparisonService(ILogger<SalesComparisonService> logger)
  {
    _logger = logger;
  }

  public Task<SalesComparisonResultDto> AnalyzeSalesAsync(SalesComparisonRequest request)
  {
    _logger.LogInformation(
        "Sales comparison analysis for property {PropertyId}, {CompCount} comparables",
        request.PropertyId, request.Comparables?.Count ?? 0);

    var subject = request.Subject;
    var comps = request.Comparables ?? new List<ComparableSaleDto>();
    var rates = request.AdjustmentRates ?? BentonDefaultRates;
    var warnings = new List<string>();

    if (comps.Count == 0)
    {
      return Task.FromResult(new SalesComparisonResultDto
      {
        PropertyId = request.PropertyId,
        IndicatedValue = 0,
        Warnings = new List<string> { "No comparable sales provided" },
        ConfidenceLevel = "low",
        AnalysisDate = DateTime.UtcNow,
      });
    }

    if (comps.Count < 3)
    {
      warnings.Add($"Only {comps.Count} comparable(s) provided — 3+ recommended per USPAP");
    }

    // Calculate adjustments for each comparable
    var adjustedComps = comps.Select(comp => CalculateAdjustments(subject, comp, rates)).ToList();

    // Flag high gross adjustments
    foreach (var ac in adjustedComps)
    {
      if (ac.GrossAdjustmentPercent > 25.0)
      {
        warnings.Add($"Comparable {ac.CompId}: gross adjustment {ac.GrossAdjustmentPercent:F1}% exceeds 25% threshold");
      }
    }

    // Calculate weights (inverse of gross adjustment %)
    foreach (var ac in adjustedComps)
    {
      ac.Weight = CalculateWeight(ac.GrossAdjustmentPercent);
    }

    // Calculate indicated value (weighted average)
    var totalWeight = adjustedComps.Sum(c => c.Weight);
    decimal indicatedValue;
    string valueMethod;

    if (totalWeight > 0 && adjustedComps.Count >= 2)
    {
      indicatedValue = adjustedComps.Sum(c => c.AdjustedPrice * (decimal)c.Weight) / (decimal)totalWeight;
      indicatedValue = Math.Round(indicatedValue, 0);
      valueMethod = "weighted_average";
    }
    else if (adjustedComps.Count > 0)
    {
      var sorted = adjustedComps.OrderBy(c => c.AdjustedPrice).ToList();
      indicatedValue = sorted[sorted.Count / 2].AdjustedPrice;
      valueMethod = "median";
    }
    else
    {
      indicatedValue = 0;
      valueMethod = "none";
    }

    // Statistics
    var adjustedPrices = adjustedComps.Select(c => (double)c.AdjustedPrice).ToList();
    var mean = adjustedPrices.Average();
    var variance = adjustedPrices.Sum(p => (p - mean) * (p - mean)) / adjustedPrices.Count;
    var stdDev = Math.Sqrt(variance);
    var cov = mean > 0 ? (stdDev / mean) * 100.0 : 0.0;
    var avgGrossAdj = adjustedComps.Average(c => c.GrossAdjustmentPercent);

    // Comparability score (0-100)
    var adjScore = Math.Max(0, 100.0 - avgGrossAdj * 2.0);
    var varScore = Math.Max(0, 100.0 - cov * 3.0);
    var countScore = Math.Min(100.0, comps.Count * 20.0);
    var comparabilityScore = Math.Round(adjScore * 0.4 + varScore * 0.3 + countScore * 0.3, 1);

    // Confidence level
    string confidenceLevel;
    if (comps.Count >= 3 && cov < 10 && avgGrossAdj < 15)
      confidenceLevel = "high";
    else if (comps.Count >= 2 && cov < 20 && avgGrossAdj < 25)
      confidenceLevel = "moderate";
    else
      confidenceLevel = "low";

    var result = new SalesComparisonResultDto
    {
      PropertyId = request.PropertyId,
      Method = "sales_comparison",
      ValueMethod = valueMethod,
      IndicatedValue = indicatedValue,
      AdjustedComparables = adjustedComps,
      CoefficientOfVariation = Math.Round(cov, 2),
      ComparabilityScore = comparabilityScore,
      ConfidenceLevel = confidenceLevel,
      Warnings = warnings,
      AnalysisDate = DateTime.UtcNow,
    };

    return Task.FromResult(result);
  }

  public Task<SalesComparisonParametersDto> GetSalesParametersAsync()
  {
    var result = new SalesComparisonParametersDto
    {
      DefaultAdjustmentRates = BentonDefaultRates,
      ConditionAdjustments = new Dictionary<string, decimal>(BentonDefaultRates.ConditionAdjustments),
      LocationAdjustments = new Dictionary<string, decimal>(BentonDefaultRates.LocationAdjustments),
      MaxGrossAdjustmentPercent = MaxGrossAdjustmentPercent,
      MinComparableCount = 3,
      GeneratedAt = DateTime.UtcNow,
    };

    return Task.FromResult(result);
  }

  private static AdjustedComparableDto CalculateAdjustments(
      SubjectCharacteristicsDto subject,
      ComparableSaleDto comp,
      AdjustmentRatesDto rates)
  {
    var adjustments = new Dictionary<string, decimal>();

    // GLA: positive if comp is smaller (subject has more space)
    var glaDiff = subject.GrossLivingArea - comp.GrossLivingArea;
    adjustments["gla"] = Math.Round((decimal)glaDiff * rates.GlaPerSqFt, 0);

    // Lot size: positive if comp lot is smaller
    var lotDiff = subject.LotSize - comp.LotSize;
    adjustments["lotSize"] = Math.Round((decimal)lotDiff * rates.LotSizePerSqFt, 0);

    // Age: positive if comp is newer (subject is older, so comp needs downward)
    var ageDiff = comp.YearBuilt - subject.YearBuilt;
    adjustments["age"] = Math.Round(ageDiff * rates.AgePerYear, 0);

    // Bedrooms
    var bedDiff = subject.Bedrooms - comp.Bedrooms;
    adjustments["bedrooms"] = Math.Round(bedDiff * rates.BedroomAdjustment, 0);

    // Bathrooms
    var bathDiff = subject.Bathrooms - comp.Bathrooms;
    adjustments["bathrooms"] = Math.Round((decimal)bathDiff * rates.BathroomAdjustment, 0);

    // Condition (dollar difference)
    var subjectCondVal = rates.ConditionAdjustments.GetValueOrDefault(subject.Condition.ToLower(), 0m);
    var compCondVal = rates.ConditionAdjustments.GetValueOrDefault(comp.Condition.ToLower(), 0m);
    adjustments["condition"] = subjectCondVal - compCondVal;

    // Location (dollar difference)
    var subjectLocVal = rates.LocationAdjustments.GetValueOrDefault(subject.Location.ToLower(), 0m);
    var compLocVal = rates.LocationAdjustments.GetValueOrDefault(comp.Location.ToLower(), 0m);
    adjustments["location"] = subjectLocVal - compLocVal;

    var netAdj = adjustments.Values.Sum();
    var grossAdj = adjustments.Values.Sum(v => Math.Abs(v));
    var grossAdjPercent = comp.SalePrice > 0
        ? (double)(grossAdj / comp.SalePrice) * 100.0
        : 0.0;

    return new AdjustedComparableDto
    {
      CompId = comp.CompId,
      OriginalPrice = comp.SalePrice,
      AdjustedPrice = comp.SalePrice + netAdj,
      Adjustments = adjustments,
      NetAdjustment = netAdj,
      GrossAdjustmentPercent = Math.Round(grossAdjPercent, 2),
    };
  }

  private static double CalculateWeight(double grossAdjustmentPercent)
  {
    var capped = Math.Min(grossAdjustmentPercent, MaxGrossAdjustmentPercent);
    var weight = 1.0 - capped / MaxGrossAdjustmentPercent;
    return Math.Round(Math.Max(0.0, weight), 3);
  }
}
