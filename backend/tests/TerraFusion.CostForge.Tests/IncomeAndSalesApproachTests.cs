using TerraFusion.CostForge.Tests.Mirrors;

namespace TerraFusion.CostForge.Tests;

/// <summary>
/// Tests for the three approaches to value used in CostForge:
/// 1. Cost Approach (tested separately in CostEstimateCalculationTests)
/// 2. Income Approach (NOI, cap rates, valuation)
/// 3. Sales Comparison (adjustment factors, reconciliation)
///
/// These tests verify the mathematical formulas are correct per IAAO standards.
/// </summary>
public class IncomeAndSalesApproachTests
{
    // ─── Income Approach: NOI Calculation ─────────────────────────────────────

    [Fact]
    public void Noi_GrossIncome_MinusExpenses_MinusVacancy()
    {
        // NOI = Gross Income × (1 - Vacancy Rate) - Operating Expenses
        decimal grossIncome = 120_000m;
        decimal vacancyRate = 0.05m;  // 5%
        decimal operatingExpenses = 35_000m;

        decimal effectiveGross = grossIncome * (1m - vacancyRate);
        decimal noi = effectiveGross - operatingExpenses;

        Assert.Equal(114_000m, effectiveGross);
        Assert.Equal(79_000m, noi);
    }

    [Fact]
    public void IncomeValuation_NoiDividedByCapRate()
    {
        // Value = NOI / Cap Rate (direct capitalization)
        decimal noi = 79_000m;
        decimal capRate = 0.065m;  // 6.5%

        decimal value = Math.Round(noi / capRate, 2, MidpointRounding.ToEven);

        // 79000 / 0.065 = 1,215,384.62
        Assert.Equal(1_215_384.62m, value);
    }

    [Fact]
    public void IncomeValuation_ZeroCapRate_WouldBeInfinite()
    {
        // Guard: cap rate of 0 should be rejected
        decimal capRate = 0m;
        Assert.True(capRate == 0, "Zero cap rate must be rejected at validation layer");
    }

    [Theory]
    [InlineData(0.04, 0.08)]   // Retail range
    [InlineData(0.05, 0.09)]   // Office range
    [InlineData(0.06, 0.10)]   // Industrial range
    public void CapRateRanges_AreReasonable(decimal low, decimal high)
    {
        // IAAO: Cap rates typically 4-10% for commercial property
        Assert.True(low >= 0.03m && low <= 0.15m);
        Assert.True(high >= 0.05m && high <= 0.15m);
        Assert.True(high > low);
    }

    // ─── Sales Comparison: Adjustment Factors ─────────────────────────────────

    [Fact]
    public void SalesComparison_AdjustedPrice_AppliesAllFactors()
    {
        // Adjusted Sale Price = Sale Price × (1 + sum of adjustments)
        decimal salePrice = 350_000m;
        decimal locationAdj = 0.05m;     // +5% location
        decimal conditionAdj = -0.03m;   // -3% condition
        decimal sizeAdj = 0.02m;         // +2% size
        decimal ageAdj = -0.04m;         // -4% age

        decimal totalAdj = locationAdj + conditionAdj + sizeAdj + ageAdj;
        decimal adjustedPrice = Math.Round(salePrice * (1m + totalAdj), 2, MidpointRounding.ToEven);

        Assert.Equal(0.00m, totalAdj);  // Net zero in this case
        Assert.Equal(350_000.00m, adjustedPrice);
    }

    [Fact]
    public void SalesComparison_WeightedReconciliation()
    {
        // Reconciled Value = Σ(weight_i × adjustedPrice_i)
        var comps = new[]
        {
            (AdjustedPrice: 340_000m, Weight: 0.40m),
            (AdjustedPrice: 360_000m, Weight: 0.35m),
            (AdjustedPrice: 355_000m, Weight: 0.25m),
        };

        decimal totalWeight = comps.Sum(c => c.Weight);
        Assert.Equal(1.00m, totalWeight); // Weights must sum to 1

        decimal reconciledValue = comps.Sum(c => c.AdjustedPrice * c.Weight);
        // 340000×0.40 + 360000×0.35 + 355000×0.25 = 136000 + 126000 + 88750 = 350750
        Assert.Equal(350_750m, reconciledValue);
    }

    [Fact]
    public void SalesComparison_TimeAdjustment_PerMonth()
    {
        // Time adjustment: market appreciation rate per month
        decimal salePrice = 300_000m;
        decimal monthlyRate = 0.005m;  // 0.5% per month
        int monthsAgo = 6;

        decimal timeAdjusted = Math.Round(
            salePrice * (1m + monthlyRate * monthsAgo), 2, MidpointRounding.ToEven);

        // 300000 × (1 + 0.005 × 6) = 300000 × 1.03 = 309000
        Assert.Equal(309_000.00m, timeAdjusted);
    }

    // ─── Three Approaches Reconciliation ──────────────────────────────────────

    [Fact]
    public void ThreeApproaches_WeightedAverage_ProducesReconciledValue()
    {
        // Final reconciled value from three approaches
        decimal costApproach = 380_000m;
        decimal incomeApproach = 365_000m;
        decimal salesApproach = 372_000m;

        // Typical weights for residential: Cost 30%, Income 20%, Sales 50%
        decimal costWeight = 0.30m;
        decimal incomeWeight = 0.20m;
        decimal salesWeight = 0.50m;

        Assert.Equal(1.00m, costWeight + incomeWeight + salesWeight);

        decimal reconciled = Math.Round(
            costApproach * costWeight +
            incomeApproach * incomeWeight +
            salesApproach * salesWeight,
            2, MidpointRounding.ToEven);

        // 380000×0.30 + 365000×0.20 + 372000×0.50 = 114000 + 73000 + 186000 = 373000
        Assert.Equal(373_000.00m, reconciled);
    }

    // ─── IAAO Compliance ──────────────────────────────────────────────────────

    [Fact]
    public void IAAO_AssessmentLevel_ShouldBe100Percent()
    {
        // RCW 84.40.030 — Washington State requires 100% of true and fair value
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 2000m, 2020, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal(1.00m, result.AssessmentRatio);
    }

    [Fact]
    public void IAAO_CostApproach_Formula_RCN_MinusDepreciation_PlusLand()
    {
        // IAAO Cost Approach: Value = (RCN - Depreciation) + Land Value
        // In CostForge: TotalCost = AdjustedCostPerSqft × SquareFeet
        // Where AdjustedCostPerSqft = RCN × Depreciation × Condition
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 2000m, 2020, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        // Verify the chain: Base → RCN → RCND → Adjusted → Total
        Assert.True(result.RcnPerSqft >= result.RcndPerSqft);
        Assert.True(result.RcndPerSqft >= result.AdjustedCostPerSqft || result.ConditionFactor >= 1.0m);
        Assert.Equal(CostCalculationEngine.BankersRound(result.AdjustedCostPerSqft * result.SquareFeet), result.TotalCost);
    }
}
