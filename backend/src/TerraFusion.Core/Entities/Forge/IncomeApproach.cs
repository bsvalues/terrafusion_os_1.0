namespace TerraFusion.Core.Entities.Forge;

/// <summary>Inputs to the TF income approach (direct capitalization).</summary>
public sealed record IncomeApproachInput(string IncomePropertyClass, decimal NetOperatingIncome);

/// <summary>Income-approach result. A miss carries an explanation and no value.</summary>
public sealed record IncomeApproachResult(
    bool Found,
    decimal NetOperatingIncome,
    decimal CapRate,
    decimal IndicatedValue,
    string Explanation);

/// <summary>
/// Deterministic TF-native income approach (D-VAL-1): IndicatedValue = NOI ÷ cap rate, the cap rate
/// resolved from the TF CapRateSet by income class. Pure function; invalid/missing rate is explicit.
/// </summary>
public static class IncomeApproachCalculator
{
    /// <summary>Computes the income indicated value (deterministic, explained).</summary>
    public static IncomeApproachResult Compute(IncomeApproachInput input, CapRateSet capRates)
    {
        var rate = capRates.ResolveCapRate(input.IncomePropertyClass);
        if (!rate.Found)
            return new IncomeApproachResult(false, input.NetOperatingIncome, rate.CapitalizationRate, 0m,
                $"Income approach incomplete: {rate.Explanation}");

        var value = input.NetOperatingIncome / rate.CapitalizationRate;
        return new IncomeApproachResult(true, input.NetOperatingIncome, rate.CapitalizationRate, value,
            $"Income value {value} (= NOI {input.NetOperatingIncome} ÷ cap rate {rate.CapitalizationRate}, class '{input.IncomePropertyClass}').");
    }
}
