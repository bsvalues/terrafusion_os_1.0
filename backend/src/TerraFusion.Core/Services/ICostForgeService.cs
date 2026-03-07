using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Services;

public interface ICostForgeService
{
  Task<CostAnalysisDto> AnalyzeCostAsync(Guid propertyId);
  Task<CostAnalysisDto> AnalyzeCostAsync(PropertyDto property);
  Task<CostComparisonDto> CompareCostsAsync(Guid propertyId1, Guid propertyId2);
  Task<CostForecastDto> ForecastCostAsync(Guid propertyId, int years);
  Task<CostBreakdownDto> GetCostBreakdownAsync(Guid propertyId);
  Task<decimal> CalculateAssessmentValueAsync(Guid propertyId);
  Task<IEnumerable<CostFactorDto>> GetCostFactorsAsync(string region);
  Task<CostMatrixDto> GetCostMatrixAsync(string buildingType, string region);
  Task<CostMatrixCatalogDto> GetCostMatricesAsync();
}

public class CostAnalysisDto
{
  public Guid PropertyId { get; set; }
  public decimal TotalCost { get; set; }
  public decimal LandValue { get; set; }
  public decimal ImprovementValue { get; set; }
  public decimal MarketAdjustment { get; set; }
  public double ConfidenceScore { get; set; }
  public DateTime AnalysisDate { get; set; }
  public string AnalysisMethod { get; set; } = string.Empty;
  public List<CostComponentDto> Components { get; set; } = new();
}

public class CostComparisonDto
{
  public CostAnalysisDto Property1 { get; set; } = new();
  public CostAnalysisDto Property2 { get; set; } = new();
  public decimal VarianceAmount { get; set; }
  public double VariancePercentage { get; set; }
  public List<string> KeyDifferences { get; set; } = new();
}

public class CostForecastDto
{
  public Guid PropertyId { get; set; }
  public int ForecastYears { get; set; }
  public decimal CurrentValue { get; set; }
  public decimal ProjectedValue { get; set; }
  public double AnnualAppreciationRate { get; set; }
  public List<YearlyForecastDto> YearlyForecasts { get; set; } = new();
}

public class YearlyForecastDto
{
  public int Year { get; set; }
  public decimal ProjectedValue { get; set; }
  public double ConfidenceLevel { get; set; }
}

public class CostBreakdownDto
{
  public Guid PropertyId { get; set; }
  public decimal TotalValue { get; set; }
  public List<CostCategoryDto> Categories { get; set; } = new();
}

public class CostCategoryDto
{
  public string Name { get; set; } = string.Empty;
  public decimal Amount { get; set; }
  public double Percentage { get; set; }
  public List<CostComponentDto> Components { get; set; } = new();
}

public class CostComponentDto
{
  public string Name { get; set; } = string.Empty;
  public decimal Amount { get; set; }
  public string Unit { get; set; } = string.Empty;
  public double Quantity { get; set; }
  public decimal UnitCost { get; set; }
}

public class CostFactorDto
{
  public string Name { get; set; } = string.Empty;
  public double Factor { get; set; }
  public string Description { get; set; } = string.Empty;
  public string Region { get; set; } = string.Empty;
  public DateTime EffectiveDate { get; set; }
}

public class CostMatrixDto
{
  public string BuildingType { get; set; } = string.Empty;
  public string Region { get; set; } = string.Empty;
  public decimal BaseCostPerSquareFoot { get; set; }
  public Dictionary<string, double> QualityFactors { get; set; } = new();
  public Dictionary<string, double> LocationFactors { get; set; } = new();
  public Dictionary<string, decimal> ComponentCosts { get; set; } = new();
  public DateTime LastUpdated { get; set; }
}

public class CostMatrixCatalogDto
{
  public List<CostMatrixEntryDto> BuildingTypes { get; set; } = new();
  public Dictionary<string, Dictionary<string, decimal>> RegionalBaseCosts { get; set; } = new();
  public Dictionary<string, double> QualityFactors { get; set; } = new();
  public Dictionary<string, double> ConditionFactors { get; set; } = new();
  public DepreciationConfigDto Depreciation { get; set; } = new();
  public int BaseYear { get; set; }
  public double AnnualInflationRate { get; set; }
  public DateTime GeneratedAt { get; set; }
}

public class CostMatrixEntryDto
{
  public string Code { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public string Category { get; set; } = string.Empty;
  public Dictionary<string, decimal> RegionalBaseCosts { get; set; } = new();
  public Dictionary<string, decimal> ComponentCosts { get; set; } = new();
}

public class DepreciationConfigDto
{
  public double AnnualRate { get; set; }
  public double MaxDepreciation { get; set; }
  public double MinRetainedValue { get; set; }
}
