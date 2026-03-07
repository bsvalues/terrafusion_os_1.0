using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

/// <summary>
/// Income approach valuation service — direct capitalization method per USPAP.
/// Value = NOI / Cap Rate
/// </summary>
public interface IIncomeApproachService
{
  Task<IncomeAnalysisDto> AnalyzeIncomeAsync(IncomeApproachRequest request);
  Task<decimal> ExtractCapRateAsync(IEnumerable<CapRateComparable> comparables);
  Task<IncomeParametersDto> GetIncomeParametersAsync();
}

// ── Request / Response DTOs ──

public class IncomeApproachRequest
{
  public Guid PropertyId { get; set; }
  public string PropertyType { get; set; } = "commercial";
  public string SubRegion { get; set; } = "central";
  public decimal PotentialGrossIncome { get; set; }
  public double VacancyRate { get; set; } = 0.05;
  public decimal OtherIncome { get; set; }
  public OperatingExpensesDto Expenses { get; set; } = new();
  public double CapitalizationRate { get; set; }
  public string CapRateSource { get; set; } = "provided";
  public List<CapRateComparable> SupportingComparables { get; set; } = new();
}

public class OperatingExpensesDto
{
  public decimal Taxes { get; set; }
  public decimal Insurance { get; set; }
  public decimal Utilities { get; set; }
  public decimal Maintenance { get; set; }
  public decimal Management { get; set; }
  public decimal Reserves { get; set; }
  public decimal Other { get; set; }

  public decimal Total => Taxes + Insurance + Utilities + Maintenance + Management + Reserves + Other;
}

public class CapRateComparable
{
  public string PropertyId { get; set; } = string.Empty;
  public decimal SalePrice { get; set; }
  public decimal NetOperatingIncome { get; set; }
}

public class IncomeAnalysisDto
{
  public Guid PropertyId { get; set; }
  public string Method { get; set; } = "direct_capitalization";
  public decimal IndicatedValue { get; set; }

  // Income breakdown
  public decimal PotentialGrossIncome { get; set; }
  public decimal VacancyLoss { get; set; }
  public decimal OtherIncome { get; set; }
  public decimal EffectiveGrossIncome { get; set; }

  // Expense breakdown
  public OperatingExpensesDto OperatingExpenses { get; set; } = new();
  public decimal TotalOperatingExpenses { get; set; }

  // NOI and cap rate
  public decimal NetOperatingIncome { get; set; }
  public double CapitalizationRate { get; set; }
  public string CapRateSource { get; set; } = string.Empty;

  // Ratios
  public double ExpenseRatio { get; set; }
  public double GrossRentMultiplier { get; set; }

  // Quality
  public string ConfidenceLevel { get; set; } = "medium";
  public string DataQuality { get; set; } = "estimated";
  public string CapRateSupport { get; set; } = "moderate";
  public List<string> Warnings { get; set; } = new();

  public DateTime AnalysisDate { get; set; }
  public double ConfidenceScore { get; set; }
}

public class IncomeParametersDto
{
  public Dictionary<string, CapRateRangeDto> CapRatesByPropertyType { get; set; } = new();
  public Dictionary<string, double> DefaultVacancyRates { get; set; } = new();
  public ExpenseRatioBoundsDto ExpenseRatioBounds { get; set; } = new();
  public BentonMarketIndicatorsDto BentonCountyMarket { get; set; } = new();
  public DateTime GeneratedAt { get; set; }
}

public class CapRateRangeDto
{
  public double Low { get; set; }
  public double Mid { get; set; }
  public double High { get; set; }
}

public class ExpenseRatioBoundsDto
{
  public double Minimum { get; set; }
  public double Maximum { get; set; }
}

public class BentonMarketIndicatorsDto
{
  public double VacancyRate { get; set; }
  public double AnnualRentGrowth { get; set; }
  public double PropertyAppreciation { get; set; }
  public double NewConstructionGrowth { get; set; }
}
