using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

/// <summary>
/// Income approach valuation — direct capitalization per USPAP.
/// Data extracted from Benton County CAMA + quarantine bs-income-valuation-production.
/// </summary>
public class IncomeApproachService : IIncomeApproachService
{
  private readonly ILogger<IncomeApproachService> _logger;

  // ── Benton County Cap Rate Ranges (by property type) ──
  // Source: quarantine/bs-income-valuation-production + Benton County market data
  private static readonly Dictionary<string, (double Low, double Mid, double High)> CapRateRanges = new()
  {
    ["residential"] = (0.0325, 0.050, 0.070),
    ["commercial"] = (0.042, 0.065, 0.090),
    ["industrial"] = (0.055, 0.075, 0.100),
    ["agricultural"] = (0.035, 0.055, 0.080),
    ["multi-family"] = (0.040, 0.060, 0.085),
    ["retail"] = (0.050, 0.070, 0.095),
    ["office"] = (0.045, 0.065, 0.090),
  };

  // ── Default Vacancy Rates by Property Type ──
  // Source: Benton County market indicators (3.2% base) + property type adjustments
  private static readonly Dictionary<string, double> DefaultVacancyRates = new()
  {
    ["residential"] = 0.032,
    ["commercial"] = 0.050,
    ["industrial"] = 0.060,
    ["agricultural"] = 0.020,
    ["multi-family"] = 0.045,
    ["retail"] = 0.055,
    ["office"] = 0.065,
  };

  // ── Expense Ratio Bounds (per USPAP / industry standard) ──
  private const double MinExpenseRatio = 0.30;
  private const double MaxExpenseRatio = 0.50;

  // ── Benton County Market Indicators ──
  // Source: quarantine/bs-income-valuation-production/agents/ValuationLeadAgent.ts
  private const double BentonVacancyRate = 0.032;
  private const double BentonAnnualRentGrowth = 0.043;
  private const double BentonPropertyAppreciation = 0.067;
  private const double BentonNewConstructionGrowth = 0.12;

  public IncomeApproachService(ILogger<IncomeApproachService> logger)
  {
    _logger = logger;
  }

  public Task<IncomeAnalysisDto> AnalyzeIncomeAsync(IncomeApproachRequest request)
  {
    _logger.LogInformation(
        "Income approach analysis for property {PropertyId}, type={Type}",
        request.PropertyId, request.PropertyType);

    var propertyType = (request.PropertyType ?? "commercial").ToLower();

    // Step 1: Income calculation
    var pgi = request.PotentialGrossIncome;
    var vacancyRate = request.VacancyRate > 0
        ? request.VacancyRate
        : DefaultVacancyRates.GetValueOrDefault(propertyType, 0.05);
    var vacancyLoss = pgi * (decimal)vacancyRate;
    var otherIncome = request.OtherIncome;
    var egi = pgi - vacancyLoss + otherIncome;

    // Step 2: Expense calculation
    var expenses = request.Expenses ?? new OperatingExpensesDto();
    var totalOpEx = expenses.Total;

    // Step 3: NOI
    var noi = egi - totalOpEx;

    // Step 4: Cap rate validation
    var capRate = request.CapitalizationRate;
    var warnings = new List<string>();

    if (capRate < 0.03 || capRate > 0.12)
    {
      warnings.Add($"Capitalization rate ({capRate:P2}) outside typical range (3%-12%)");
    }

    var capRateRange = CapRateRanges.TryGetValue(propertyType, out var range)
        ? range
        : (Low: 0.03, Mid: 0.065, High: 0.10);
    if (capRate < capRateRange.Low || capRate > capRateRange.High)
    {
      warnings.Add(
          $"Cap rate ({capRate:P2}) outside typical {propertyType} range " +
          $"({capRateRange.Low:P1}-{capRateRange.High:P1})");
    }

    // Step 5: Expense ratio check
    var expenseRatio = egi > 0 ? (double)(totalOpEx / egi) : 0.0;
    if (expenseRatio < MinExpenseRatio && totalOpEx > 0)
    {
      warnings.Add(
          $"Expense ratio ({expenseRatio:P1}) below typical range " +
          $"({MinExpenseRatio:P0}-{MaxExpenseRatio:P0})");
    }
    else if (expenseRatio > MaxExpenseRatio)
    {
      warnings.Add(
          $"Expense ratio ({expenseRatio:P1}) above typical range " +
          $"({MinExpenseRatio:P0}-{MaxExpenseRatio:P0})");
    }

    // Step 6: Indicated value
    decimal indicatedValue = 0;
    if (capRate > 0 && noi > 0)
    {
      indicatedValue = Math.Round(noi / (decimal)capRate, 0);
    }
    else if (noi <= 0)
    {
      warnings.Add("Net operating income is zero or negative — income approach not applicable");
    }

    // Step 7: GRM (Gross Rent Multiplier)
    var grm = pgi > 0 && indicatedValue > 0
        ? (double)(indicatedValue / pgi)
        : 0.0;

    // Step 8: Cap rate support assessment
    var supportingCount = request.SupportingComparables?.Count ?? 0;
    var capRateSupport = supportingCount >= 3 ? "strong"
        : supportingCount >= 1 ? "moderate"
        : "weak";

    if (supportingCount == 0 && request.CapRateSource == "provided")
    {
      warnings.Add("Cap rate provided without market extraction support");
    }

    // Step 9: Confidence assessment
    var confidenceLevel = "high";
    var dataQuality = "verified";

    if (noi <= 0 || totalOpEx == 0)
    {
      confidenceLevel = "low";
      dataQuality = "incomplete";
    }
    else if (warnings.Count > 0)
    {
      confidenceLevel = "medium";
      dataQuality = "estimated";
    }

    var confidenceScore = CalculateConfidenceScore(
        expenseRatio, capRate, supportingCount, warnings.Count, noi > 0);

    var result = new IncomeAnalysisDto
    {
      PropertyId = request.PropertyId,
      Method = "direct_capitalization",
      IndicatedValue = indicatedValue,
      PotentialGrossIncome = pgi,
      VacancyLoss = vacancyLoss,
      OtherIncome = otherIncome,
      EffectiveGrossIncome = egi,
      OperatingExpenses = expenses,
      TotalOperatingExpenses = totalOpEx,
      NetOperatingIncome = noi,
      CapitalizationRate = capRate,
      CapRateSource = request.CapRateSource ?? "provided",
      ExpenseRatio = Math.Round(expenseRatio, 4),
      GrossRentMultiplier = Math.Round(grm, 2),
      ConfidenceLevel = confidenceLevel,
      DataQuality = dataQuality,
      CapRateSupport = capRateSupport,
      Warnings = warnings,
      AnalysisDate = DateTime.UtcNow,
      ConfidenceScore = confidenceScore,
    };

    return Task.FromResult(result);
  }

  public Task<decimal> ExtractCapRateAsync(IEnumerable<CapRateComparable> comparables)
  {
    var list = comparables.ToList();
    if (list.Count == 0)
      throw new ArgumentException("At least one comparable required for cap rate extraction");

    var rates = list
        .Where(c => c.SalePrice > 0)
        .Select(c => c.NetOperatingIncome / c.SalePrice)
        .ToList();

    if (rates.Count == 0)
      throw new ArgumentException("No valid comparables (sale price must be > 0)");

    var avgRate = rates.Average();
    return Task.FromResult(Math.Round(avgRate, 4));
  }

  public Task<IncomeParametersDto> GetIncomeParametersAsync()
  {
    var result = new IncomeParametersDto
    {
      CapRatesByPropertyType = CapRateRanges.ToDictionary(
            kvp => kvp.Key,
            kvp => new CapRateRangeDto { Low = kvp.Value.Low, Mid = kvp.Value.Mid, High = kvp.Value.High }),
      DefaultVacancyRates = new Dictionary<string, double>(DefaultVacancyRates),
      ExpenseRatioBounds = new ExpenseRatioBoundsDto
      {
        Minimum = MinExpenseRatio,
        Maximum = MaxExpenseRatio,
      },
      BentonCountyMarket = new BentonMarketIndicatorsDto
      {
        VacancyRate = BentonVacancyRate,
        AnnualRentGrowth = BentonAnnualRentGrowth,
        PropertyAppreciation = BentonPropertyAppreciation,
        NewConstructionGrowth = BentonNewConstructionGrowth,
      },
      GeneratedAt = DateTime.UtcNow,
    };

    return Task.FromResult(result);
  }

  private static double CalculateConfidenceScore(
      double expenseRatio, double capRate, int supportingCount, int warningCount, bool positiveNoi)
  {
    var score = 90.0;

    // Deductions
    if (!positiveNoi) score -= 30.0;
    if (expenseRatio < MinExpenseRatio || expenseRatio > MaxExpenseRatio) score -= 5.0;
    if (capRate < 0.03 || capRate > 0.12) score -= 10.0;
    if (supportingCount == 0) score -= 10.0;
    score -= warningCount * 2.0;

    // Bonuses
    if (supportingCount >= 3) score += 5.0;
    if (expenseRatio >= MinExpenseRatio && expenseRatio <= MaxExpenseRatio) score += 3.0;

    return Math.Max(10.0, Math.Min(99.0, Math.Round(score, 1)));
  }
}
