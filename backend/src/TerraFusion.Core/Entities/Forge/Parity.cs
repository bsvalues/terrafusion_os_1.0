namespace TerraFusion.Core.Entities.Forge;

/// <summary>Acceptance tolerance for a parity comparison (fraction, e.g. 0.01 = ±1%).</summary>
public readonly record struct ParityTolerance(decimal Fraction);

/// <summary>
/// Informational parity report. Parity is a GATE, not a source: the TF value is reported as-is and
/// is never replaced by the comparison (PACS) value.
/// </summary>
public sealed record ParityReport(
    decimal TfValue,
    decimal ComparisonValue,
    decimal Delta,
    decimal DeltaFraction,
    bool WithinTolerance,
    string Explanation);

/// <summary>
/// Read-only TF-vs-comparison parity check (pack V13/V14). Pure function — it computes a delta and
/// a within/outside-tolerance flag and never mutates the TF value or adopts the comparison value.
/// </summary>
public static class ParityComparer
{
    /// <summary>Compares a TF value against a comparison (e.g. PACS) value; read-only.</summary>
    public static ParityReport Compare(decimal tfValue, decimal comparisonValue, ParityTolerance tolerance)
    {
        var delta = tfValue - comparisonValue;
        var deltaFraction = comparisonValue == 0m
            ? (tfValue == 0m ? 0m : 1m)
            : Math.Abs(delta) / Math.Abs(comparisonValue);
        var within = deltaFraction <= tolerance.Fraction;

        var explanation =
            $"TF {tfValue} vs comparison {comparisonValue}: delta {delta} ({deltaFraction:P2}), " +
            $"{(within ? "WITHIN" : "OUTSIDE")} tolerance {tolerance.Fraction:P2}. " +
            "Comparison is informational only; the TF value is the source of truth and is unchanged.";

        return new ParityReport(tfValue, comparisonValue, delta, deltaFraction, within, explanation);
    }

    /// <summary>Compares a TF valuation result against a comparison value (result is unchanged).</summary>
    public static ParityReport Compare(ValuationResult tfResult, decimal comparisonValue, ParityTolerance tolerance)
        => Compare(tfResult.IndicatedValue, comparisonValue, tolerance);
}
