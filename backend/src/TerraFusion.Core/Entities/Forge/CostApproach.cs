namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// Inputs to the deterministic TF cost approach for one improvement. Functional/economic
/// obsolescence are caller-supplied survivorship fractions (default 0); physical depreciation is
/// resolved from the TF <see cref="DepreciationSchedule"/> by effective age.
/// </summary>
public sealed record CostApproachInput(
    string ImprovementClassCode,
    int SizeSqFt,
    int EffectiveAgeYears,
    decimal LandContribution,
    decimal FunctionalObsolescenceFraction = 0m,
    decimal EconomicObsolescenceFraction = 0m);

/// <summary>
/// Result of the cost approach with a full, explainable breakdown. A miss (<see cref="Found"/> =
/// false) carries an <see cref="Explanation"/> and no computed value — never a silent default.
/// </summary>
public sealed record CostApproachResult(
    bool Found,
    decimal ReplacementCostNew,
    decimal PhysicalDepreciationFraction,
    decimal FunctionalObsolescenceFraction,
    decimal EconomicObsolescenceFraction,
    decimal DepreciatedImprovementValue,
    decimal LandContribution,
    decimal IndicatedValue,
    string Explanation);

/// <summary>
/// Deterministic, TF-native cost approach (D-VAL-1): IndicatedValue = RCN × (1−physical) ×
/// (1−functional) × (1−economic) + land contribution. RCN = TF unit cost × size. Pure function of
/// its inputs and TF-owned reference data — no vendor table, no nondeterministic path.
/// The Forge project exposes this via IValuationApproach and owns the value write (write-lane).
/// </summary>
public static class CostApproachCalculator
{
    /// <summary>Computes the cost-approach indicated value (deterministic, fully explained).</summary>
    public static CostApproachResult Compute(
        CostApproachInput input, CostFactorSet costs, DepreciationSchedule depreciation)
    {
        var f = input.FunctionalObsolescenceFraction;
        var e = input.EconomicObsolescenceFraction;

        var unit = costs.ResolveUnitCost(input.ImprovementClassCode, input.SizeSqFt);
        if (!unit.Found)
            return new CostApproachResult(false, 0m, 0m, f, e, 0m, input.LandContribution, 0m,
                $"Cost approach incomplete: {unit.Explanation}");

        var rcn = unit.UnitCostPerSqFt * input.SizeSqFt;

        var dep = depreciation.ResolveDepreciation(input.EffectiveAgeYears);
        if (!dep.Found)
            return new CostApproachResult(false, rcn, 0m, f, e, 0m, input.LandContribution, 0m,
                $"Cost approach incomplete: {dep.Explanation}");

        var p = dep.Fraction;
        var depreciatedImprovement = rcn * (1m - p) * (1m - f) * (1m - e);
        var indicated = depreciatedImprovement + input.LandContribution;

        var explanation =
            $"RCN {rcn} (= {unit.UnitCostPerSqFt}/sqft × {input.SizeSqFt} sqft, class '{input.ImprovementClassCode}') " +
            $"× (1−physical {p}) × (1−functional {f}) × (1−economic {e}) = improvement {depreciatedImprovement}; " +
            $"+ land {input.LandContribution} = {indicated}.";

        return new CostApproachResult(true, rcn, p, f, e, depreciatedImprovement, input.LandContribution, indicated, explanation);
    }
}
