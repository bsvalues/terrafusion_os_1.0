namespace TerraFusion.Core.Entities.Forge;

/// <summary>An approach's indicated value, fed to reconciliation.</summary>
public sealed record ApproachValue(string Approach, decimal IndicatedValue);

/// <summary>One approach's weighted contribution to the reconciled value.</summary>
public sealed record ApproachContribution(string Approach, decimal IndicatedValue, decimal Weight, decimal Contribution);

/// <summary>Assembled inputs for valuing one parcel (canonical approach values + context).</summary>
public sealed record ParcelValuationInput(
    Guid ParcelId,
    int Year,
    Guid CountyId,
    string PropertyType,
    IReadOnlyList<ApproachValue> Approaches,
    string CalibrationStatus = "NotEvaluated");

/// <summary>Explainable valuation result. Serializes to the shape the Workbench/OS Core consumes.</summary>
public sealed record ValuationResult(
    bool Found,
    Guid ParcelId,
    int Year,
    Guid CountyId,
    string PropertyType,
    decimal IndicatedValue,
    IReadOnlyList<ApproachContribution> Breakdown,
    string Explanation,
    string CalibrationStatus);

/// <summary>
/// AI assistance is advisory ONLY (comp suggestions). It can never set the authoritative value;
/// the engine does not consult it in the value path.
/// </summary>
public interface IValuationAdvisory
{
    IReadOnlyList<decimal> SuggestComparables(ParcelValuationInput input);
}

/// <summary>TF-owned reconciliation rule: desired approach weights by property type.</summary>
public static class ReconciliationRule
{
    /// <summary>Desired weights by approach for a property type (TF-owned rule).</summary>
    public static IReadOnlyDictionary<string, decimal> WeightsFor(string propertyType)
    {
        var t = (propertyType ?? string.Empty).Trim().ToLowerInvariant();
        var map = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        switch (t)
        {
            case "residential":
                map["Cost"] = 0.5m; map["Sales"] = 0.5m; break;
            case "incomeproperty":
            case "income":
                map["Income"] = 1m; break;
            case "vacant":
            case "land":
                map["Land"] = 1m; break;
            // default: empty → reconciler falls back to equal weights over available approaches
        }
        return map;
    }
}

/// <summary>Deterministic TF-owned reconciler: weights available approaches and sums contributions.</summary>
public static class ValueReconciler
{
    /// <summary>Reconciles available approaches into a value + breakdown (deterministic, explained).</summary>
    public static (bool Found, decimal Value, IReadOnlyList<ApproachContribution> Breakdown, string Explanation)
        Reconcile(string propertyType, IReadOnlyList<ApproachValue> approaches)
    {
        if (approaches.Count == 0)
            return (false, 0m, Array.Empty<ApproachContribution>(), "No approaches available to reconcile.");

        var desired = ReconciliationRule.WeightsFor(propertyType);
        var sumDesired = approaches.Sum(a => desired.TryGetValue(a.Approach, out var w) ? w : 0m);

        List<(ApproachValue Approach, decimal Weight)> weighted;
        if (sumDesired <= 0m)
        {
            // No rule match (or default) → equal weight over every available approach.
            var equal = 1m / approaches.Count;
            weighted = approaches.Select(a => (a, equal)).ToList();
        }
        else
        {
            // Normalize the rule's weights over the approaches actually present.
            weighted = approaches
                .Select(a => (Approach: a, Weight: (desired.TryGetValue(a.Approach, out var w) ? w : 0m) / sumDesired))
                .Where(x => x.Weight > 0m)
                .ToList();
        }

        var breakdown = weighted
            .Select(x => new ApproachContribution(x.Approach.Approach, x.Approach.IndicatedValue, x.Weight, x.Approach.IndicatedValue * x.Weight))
            .OrderBy(c => c.Approach, StringComparer.Ordinal)
            .ToList();

        var value = breakdown.Sum(c => c.Contribution);
        var explanation = "weighted approaches → " +
            string.Join(" + ", breakdown.Select(c => $"{c.Approach} {c.IndicatedValue}×{c.Weight}={c.Contribution}")) +
            $" = {value}";

        return (true, value, breakdown, explanation);
    }
}

/// <summary>
/// Deterministic TF-native valuation engine (D-VAL-1). Reconciles approach values into an
/// explainable authoritative value. The value path is pure — an optional advisory is accepted but
/// NEVER consulted for the authoritative value.
/// </summary>
public static class ValuationEngine
{
    /// <summary>
    /// Produces the reconciled, explained valuation result. The <paramref name="advisory"/> is
    /// accepted for API symmetry but is intentionally NEVER consulted — the authoritative value is
    /// computed purely by TF-owned deterministic reconciliation (D-VAL-1, pack V2).
    /// </summary>
    public static ValuationResult Value(ParcelValuationInput input, IValuationAdvisory? advisory = null)
    {
        _ = advisory; // advisory is not in the value path, by design

        var (found, value, breakdown, expl) = ValueReconciler.Reconcile(input.PropertyType, input.Approaches);
        if (!found)
            return new ValuationResult(false, input.ParcelId, input.Year, input.CountyId, input.PropertyType,
                0m, Array.Empty<ApproachContribution>(), expl, input.CalibrationStatus);

        var explanation =
            $"Reconciled {input.PropertyType} value {value} for parcel {input.ParcelId} (year {input.Year}, county {input.CountyId}): {expl}.";

        return new ValuationResult(true, input.ParcelId, input.Year, input.CountyId, input.PropertyType,
            value, breakdown, explanation, input.CalibrationStatus);
    }
}
