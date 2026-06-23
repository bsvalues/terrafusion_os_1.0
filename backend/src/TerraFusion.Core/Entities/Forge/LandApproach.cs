namespace TerraFusion.Core.Entities.Forge;

/// <summary>Inputs to the TF land approach for one parcel's land.</summary>
public sealed record LandApproachInput(string Neighborhood, decimal LandSizeUnits, bool CurrentUse = false);

/// <summary>Land-approach result with breakdown. A miss carries an explanation and no value.</summary>
public sealed record LandApproachResult(
    bool Found,
    decimal MarketValue,
    decimal? CurrentUseValue,
    decimal IndicatedValue,
    string Explanation);

/// <summary>
/// Deterministic TF-native land approach (D-VAL-1). IndicatedValue = unit value × size; when
/// current-use/ag is requested it uses the TF current-use unit value (WA reduced assessment) and
/// fails explicitly if no current-use rate exists. Pure function of inputs + TF-owned schedule.
/// </summary>
public static class LandApproachCalculator
{
    /// <summary>Computes the land indicated value (deterministic, explained).</summary>
    public static LandApproachResult Compute(LandApproachInput input, LandScheduleSet schedule)
    {
        var rate = schedule.ResolveRate(input.Neighborhood);
        if (!rate.Found)
            return new LandApproachResult(false, 0m, null, 0m, $"Land approach incomplete: {rate.Explanation}");

        var marketValue = rate.MarketUnitValue * input.LandSizeUnits;

        if (input.CurrentUse)
        {
            if (rate.CurrentUseUnitValue is not decimal cuUnit)
                return new LandApproachResult(false, marketValue, null, 0m,
                    $"Land approach incomplete: current-use requested but no TF current-use rate for '{input.Neighborhood}'.");

            var currentUseValue = cuUnit * input.LandSizeUnits;
            return new LandApproachResult(true, marketValue, currentUseValue, currentUseValue,
                $"WA current-use land value {currentUseValue} (= {cuUnit}/unit × {input.LandSizeUnits}); market would be {marketValue}.");
        }

        return new LandApproachResult(true, marketValue, null, marketValue,
            $"Market land value {marketValue} (= {rate.MarketUnitValue}/unit × {input.LandSizeUnits} units, '{input.Neighborhood}').");
    }
}
