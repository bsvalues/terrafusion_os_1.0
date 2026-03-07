using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services.Valuation;

/// <summary>
/// USPAP-aligned Income Approach service using Direct Capitalization.
/// Ported from quarantine: applications/terraforge-suite/harness/src/approaches/income.ts
/// Formula: Value = NOI / Cap Rate
/// </summary>
public class IncomeApproachService
{
    private readonly ILogger<IncomeApproachService> _logger;

    public IncomeApproachService(ILogger<IncomeApproachService> logger)
    {
        _logger = logger;
    }

    public IncomeApproachResult RunIncomeApproach(IncomeApproachInput input)
    {
        try
        {
            var pgi = input.IncomeData.PotentialGrossIncome;
            var vacancyRate = input.IncomeData.VacancyRate ?? 0.05;
            var otherIncome = input.IncomeData.OtherIncome ?? 0;
            var expenses = input.IncomeData.OperatingExpenses ?? new OperatingExpenseBreakdown();

            var expenseBreakdown = new OperatingExpenseBreakdown
            {
                Taxes = expenses.Taxes,
                Insurance = expenses.Insurance,
                Utilities = expenses.Utilities,
                Maintenance = expenses.Maintenance,
                Management = expenses.Management,
                Reserves = expenses.Reserves,
                Other = expenses.Other,
            };

            // Income calculation chain: PGI → EGI → NOI → Value
            var vacancyLoss = (long)Math.Round(pgi * vacancyRate);
            var egi = pgi - vacancyLoss + otherIncome;
            var totalOpEx = expenseBreakdown.Total;
            var noi = egi - totalOpEx;
            var expenseRatio = egi > 0 ? (double)totalOpEx / egi : 0;

            // Direct capitalization: Value = NOI / Cap Rate
            var capRate = input.CapitalizationRate.Rate;
            var indicatedValue = capRate > 0 ? (long)Math.Round(noi / capRate) : 0;

            // Quality indicators
            var warnings = new List<string>();
            var dataQuality = "verified";
            var confidenceLevel = "high";
            var capRateSupport = "moderate";

            // Check expense ratio
            var checkExpenseRatio = input.AnalysisParameters?.ExpenseRatioCheck ?? true;
            var minExpenseRatio = input.AnalysisParameters?.TypicalExpenseRatioMin ?? 0.3;
            var maxExpenseRatio = input.AnalysisParameters?.TypicalExpenseRatioMax ?? 0.5;

            if (checkExpenseRatio)
            {
                if (expenseRatio < minExpenseRatio)
                {
                    warnings.Add($"Expense ratio ({expenseRatio * 100:F1}%) below typical range ({minExpenseRatio * 100:F0}-{maxExpenseRatio * 100:F0}%)");
                    if (confidenceLevel == "high") confidenceLevel = "medium";
                }
                else if (expenseRatio > maxExpenseRatio)
                {
                    warnings.Add($"Expense ratio ({expenseRatio * 100:F1}%) above typical range ({minExpenseRatio * 100:F0}-{maxExpenseRatio * 100:F0}%)");
                    if (confidenceLevel == "high") confidenceLevel = "medium";
                }
            }

            // Check cap rate support
            var supportingData = input.CapitalizationRate.SupportingData ?? new List<CapRateComparable>();
            if (supportingData.Count >= 3)
                capRateSupport = "strong";
            else if (supportingData.Count >= 1)
                capRateSupport = "moderate";
            else
            {
                capRateSupport = "weak";
                if (input.CapitalizationRate.Source == "provided")
                    warnings.Add("Cap rate provided without market extraction support");
            }

            if (noi <= 0)
            {
                warnings.Add("Net operating income is zero or negative");
                confidenceLevel = "low";
                dataQuality = "incomplete";
            }

            if (totalOpEx == 0 && pgi > 0)
            {
                warnings.Add("No operating expenses provided - typical properties have 30-50% expense ratios");
                dataQuality = "incomplete";
                confidenceLevel = "low";
            }

            var explanation = GenerateExplanation(input, pgi, vacancyLoss, otherIncome, egi, totalOpEx, noi, capRate, indicatedValue, expenseRatio);

            var output = new IncomeApproachOutput
            {
                SubjectId = input.SubjectId,
                EffectiveDate = input.EffectiveDate,
                IndicatedValue = indicatedValue,
                IncomeAnalysis = new IncomeAnalysisDetail
                {
                    PotentialGrossIncome = pgi,
                    VacancyLoss = vacancyLoss,
                    OtherIncome = otherIncome,
                    EffectiveGrossIncome = egi,
                    OperatingExpenseBreakdown = expenseBreakdown,
                    TotalOperatingExpenses = totalOpEx,
                    NetOperatingIncome = noi,
                    CapitalizationRate = capRate,
                    ExpenseRatio = Math.Round(expenseRatio * 10000) / 10000,
                },
                QualityIndicators = new IncomeQualityIndicators
                {
                    ConfidenceLevel = confidenceLevel,
                    DataQuality = dataQuality,
                    Warnings = warnings,
                    CapRateSupport = capRateSupport,
                },
                Explanation = explanation,
                GeneratedAt = DateTime.UtcNow,
            };

            _logger.LogInformation(
                "Income approach completed for {SubjectId}: NOI={Noi}, CapRate={CapRate}, Value={Value}, Confidence={Confidence}",
                input.SubjectId, noi, capRate, indicatedValue, confidenceLevel);

            return new IncomeApproachResult { Output = output };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Income approach failed for {SubjectId}", input.SubjectId);
            throw;
        }
    }

    /// <summary>
    /// Calculate market-extracted cap rate from comparable sales.
    /// </summary>
    public static double ExtractCapRate(List<CapRateComparable> comparables)
    {
        if (comparables.Count == 0)
            throw new ArgumentException("At least one comparable required for cap rate extraction");

        var rates = comparables.Select(c => c.SalePrice > 0 ? (double)c.Noi / c.SalePrice : 0).ToList();
        return rates.Average();
    }

    private static string GenerateExplanation(
        IncomeApproachInput input, long pgi, long vacancyLoss, long otherIncome,
        long egi, long totalOpEx, long noi, double capRate, long indicatedValue, double expenseRatio)
    {
        return $"Income Approach Analysis for {input.SubjectId} as of {input.EffectiveDate}\n\n" +
               "INCOME CALCULATION:\n" +
               $"  Potential Gross Income (PGI):    ${pgi:N0}\n" +
               $"  Less: Vacancy & Collection Loss: (${vacancyLoss:N0})\n" +
               $"  Plus: Other Income:               ${otherIncome:N0}\n" +
               $"  Effective Gross Income (EGI):    ${egi:N0}\n\n" +
               $"  Less: Operating Expenses:        (${totalOpEx:N0})\n" +
               $"  Net Operating Income (NOI):      ${noi:N0}\n\n" +
               "CAPITALIZATION:\n" +
               $"  NOI ${noi:N0} / Cap Rate {capRate * 100:F2}%\n" +
               $"  = Indicated Value: ${indicatedValue:N0}\n\n" +
               $"Expense Ratio: {expenseRatio * 100:F1}%\n" +
               $"Cap Rate Source: {input.CapitalizationRate.Source ?? "provided"}";
    }
}

// ============================================================
// DTOs
// ============================================================

public class IncomeApproachInput
{
    public string SubjectId { get; set; } = string.Empty;
    public string EffectiveDate { get; set; } = string.Empty;
    public IncomeData IncomeData { get; set; } = new();
    public CapitalizationRateInput CapitalizationRate { get; set; } = new();
    public IncomeAnalysisParameters? AnalysisParameters { get; set; }
}

public class IncomeData
{
    public long PotentialGrossIncome { get; set; }
    public double? VacancyRate { get; set; }
    public long? OtherIncome { get; set; }
    public OperatingExpenseBreakdown? OperatingExpenses { get; set; }
}

public class OperatingExpenseBreakdown
{
    public long Taxes { get; set; }
    public long Insurance { get; set; }
    public long Utilities { get; set; }
    public long Maintenance { get; set; }
    public long Management { get; set; }
    public long Reserves { get; set; }
    public long Other { get; set; }

    public long Total => Taxes + Insurance + Utilities + Maintenance + Management + Reserves + Other;
}

public class CapitalizationRateInput
{
    public double Rate { get; set; }
    public string? Source { get; set; }
    public List<CapRateComparable>? SupportingData { get; set; }
}

public class CapRateComparable
{
    public string? PropertyId { get; set; }
    public long SalePrice { get; set; }
    public long Noi { get; set; }
    public double? ExtractedRate { get; set; }
}

public class IncomeAnalysisParameters
{
    public bool? ExpenseRatioCheck { get; set; }
    public double? TypicalExpenseRatioMin { get; set; }
    public double? TypicalExpenseRatioMax { get; set; }
}

public class IncomeApproachOutput
{
    public string SubjectId { get; set; } = string.Empty;
    public string EffectiveDate { get; set; } = string.Empty;
    public long IndicatedValue { get; set; }
    public IncomeAnalysisDetail IncomeAnalysis { get; set; } = new();
    public IncomeQualityIndicators QualityIndicators { get; set; } = new();
    public string Explanation { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
}

public class IncomeAnalysisDetail
{
    public long PotentialGrossIncome { get; set; }
    public long VacancyLoss { get; set; }
    public long OtherIncome { get; set; }
    public long EffectiveGrossIncome { get; set; }
    public OperatingExpenseBreakdown OperatingExpenseBreakdown { get; set; } = new();
    public long TotalOperatingExpenses { get; set; }
    public long NetOperatingIncome { get; set; }
    public double CapitalizationRate { get; set; }
    public double ExpenseRatio { get; set; }
}

public class IncomeQualityIndicators
{
    public string ConfidenceLevel { get; set; } = "medium";
    public string DataQuality { get; set; } = "verified";
    public List<string> Warnings { get; set; } = new();
    public string CapRateSupport { get; set; } = "moderate";
}

public class IncomeApproachResult
{
    public IncomeApproachOutput Output { get; set; } = new();
}
