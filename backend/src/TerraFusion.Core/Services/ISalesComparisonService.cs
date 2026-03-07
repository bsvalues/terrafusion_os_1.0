using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

/// <summary>
/// Sales comparison approach — USPAP-aligned comparable adjustment grid.
/// Adjusts comparable sale prices to subject, weights by similarity.
/// </summary>
public interface ISalesComparisonService
{
  Task<SalesComparisonResultDto> AnalyzeSalesAsync(SalesComparisonRequest request);
  Task<SalesComparisonParametersDto> GetSalesParametersAsync();
}

// ── Request / Response DTOs ──

public class SalesComparisonRequest
{
  public Guid PropertyId { get; set; }
  public SubjectCharacteristicsDto Subject { get; set; } = new();
  public List<ComparableSaleDto> Comparables { get; set; } = new();
  public AdjustmentRatesDto? AdjustmentRates { get; set; }
}

public class SubjectCharacteristicsDto
{
  public double GrossLivingArea { get; set; }
  public double LotSize { get; set; }
  public int YearBuilt { get; set; }
  public int Bedrooms { get; set; }
  public double Bathrooms { get; set; }
  public string Condition { get; set; } = "Average";
  public string Location { get; set; } = "Average";
}

public class ComparableSaleDto
{
  public string CompId { get; set; } = string.Empty;
  public decimal SalePrice { get; set; }
  public DateTime SaleDate { get; set; }
  public double GrossLivingArea { get; set; }
  public double LotSize { get; set; }
  public int YearBuilt { get; set; }
  public int Bedrooms { get; set; }
  public double Bathrooms { get; set; }
  public string Condition { get; set; } = "Average";
  public string Location { get; set; } = "Average";
}

public class AdjustmentRatesDto
{
  public decimal GlaPerSqFt { get; set; } = 100m;
  public decimal LotSizePerSqFt { get; set; } = 5m;
  public decimal AgePerYear { get; set; } = 500m;
  public decimal BedroomAdjustment { get; set; } = 5000m;
  public decimal BathroomAdjustment { get; set; } = 7500m;
  public Dictionary<string, decimal> ConditionAdjustments { get; set; } = new();
  public Dictionary<string, decimal> LocationAdjustments { get; set; } = new();
}

public class SalesComparisonResultDto
{
  public Guid PropertyId { get; set; }
  public string Method { get; set; } = "sales_comparison";
  public string ValueMethod { get; set; } = "weighted_average";
  public decimal IndicatedValue { get; set; }
  public List<AdjustedComparableDto> AdjustedComparables { get; set; } = new();
  public double CoefficientOfVariation { get; set; }
  public double ComparabilityScore { get; set; }
  public string ConfidenceLevel { get; set; } = "moderate";
  public List<string> Warnings { get; set; } = new();
  public DateTime AnalysisDate { get; set; }
}

public class AdjustedComparableDto
{
  public string CompId { get; set; } = string.Empty;
  public decimal OriginalPrice { get; set; }
  public decimal AdjustedPrice { get; set; }
  public Dictionary<string, decimal> Adjustments { get; set; } = new();
  public decimal NetAdjustment { get; set; }
  public double GrossAdjustmentPercent { get; set; }
  public double Weight { get; set; }
}

public class SalesComparisonParametersDto
{
  public AdjustmentRatesDto DefaultAdjustmentRates { get; set; } = new();
  public Dictionary<string, decimal> ConditionAdjustments { get; set; } = new();
  public Dictionary<string, decimal> LocationAdjustments { get; set; } = new();
  public double MaxGrossAdjustmentPercent { get; set; }
  public int MinComparableCount { get; set; }
  public DateTime GeneratedAt { get; set; }
}
