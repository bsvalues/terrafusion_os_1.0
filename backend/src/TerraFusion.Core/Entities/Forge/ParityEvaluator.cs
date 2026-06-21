namespace TerraFusion.Core.Entities.Forge;

/// <summary>One TF-vs-baseline comparison for the parity run. RP-5 carries an exact-lineage flag.</summary>
public sealed record ParityComparison(
    string Rp,
    string PropertyClass,
    decimal TfValue,
    decimal ComparisonValue,
    bool? Rp5LineageExact = null);

/// <summary>An evidence row (matches evidence/parity/parity_evidence.schema.json). Ungated when WithinTolerance is null.</summary>
public sealed record ParityEvidenceRow(
    string Rp,
    string PropertyClass,
    decimal TfValue,
    decimal ComparisonValue,
    decimal Delta,
    decimal DeltaFraction,
    bool? WithinTolerance,
    decimal? ToleranceUsed,
    bool? Rp5LineageExact);

/// <summary>Per-RP rollup. GatePass is null when ungated (no tolerance/agreed-rate, or unknown lineage).</summary>
public sealed record RpSummary(
    string Rp,
    int N,
    int WithinCount,
    decimal? PassRate,
    decimal? AgreedRate,
    bool? GatePass);

/// <summary>Result of a parity evaluation: evidence rows + per-RP summaries.</summary>
public sealed record ParityEvaluation(
    IReadOnlyList<ParityEvidenceRow> Rows,
    IReadOnlyList<RpSummary> Summaries);

/// <summary>
/// Assessor-supplied gate configuration. Tolerances are fractions (0.01 = ±1%); agreed rates are
/// minimum sample pass rates. A missing entry (and no "Default") yields null → that RP stays ungated.
/// Values are county inputs and are NEVER invented in code.
/// </summary>
public sealed class ParityGateConfig
{
    public Dictionary<(string Rp, string PropertyClass), decimal> Tolerances { get; init; } = new();
    public Dictionary<string, decimal> AgreedRates { get; init; } = new();

    public decimal? ToleranceFor(string rp, string propertyClass)
        => Tolerances.TryGetValue((rp, propertyClass), out var t) ? t
         : Tolerances.TryGetValue((rp, "Default"), out var d) ? d
         : null;

    public decimal? AgreedRateFor(string rp)
        => AgreedRates.TryGetValue(rp, out var r) ? r
         : AgreedRates.TryGetValue("Default", out var d) ? d
         : null;
}

/// <summary>
/// Deterministic parity evaluator (read-only, shadow). Compares TF shadow values to internal
/// TruthPacs baselines and rolls up per-RP gate status. STRUCTURAL HONESTY: gating is null whenever
/// a tolerance/agreed-rate is unset (or RP-5 lineage is unknown), so an un-approved run can never
/// report a G1 pass. RP-5 gates on exact lineage, not tolerance.
/// </summary>
public static class ParityEvaluator
{
    public static ParityEvaluation Evaluate(IEnumerable<ParityComparison> comparisons, ParityGateConfig config)
    {
        var rows = new List<ParityEvidenceRow>();
        foreach (var c in comparisons)
        {
            var delta = c.TfValue - c.ComparisonValue;
            var fraction = c.ComparisonValue == 0m
                ? (c.TfValue == 0m ? 0m : 1m)
                : Math.Abs(delta) / Math.Abs(c.ComparisonValue);

            if (c.Rp == "RP-5")
            {
                rows.Add(new ParityEvidenceRow(c.Rp, c.PropertyClass, c.TfValue, c.ComparisonValue,
                    delta, fraction, c.Rp5LineageExact, null, c.Rp5LineageExact));
            }
            else
            {
                var tol = config.ToleranceFor(c.Rp, c.PropertyClass);
                bool? within = tol is decimal t ? fraction <= t : null;
                rows.Add(new ParityEvidenceRow(c.Rp, c.PropertyClass, c.TfValue, c.ComparisonValue,
                    delta, fraction, within, tol, null));
            }
        }

        var summaries = rows
            .GroupBy(r => r.Rp)
            .Select(g => Summarize(g.Key, g.ToList(), config))
            .OrderBy(s => s.Rp, StringComparer.Ordinal)
            .ToList();

        return new ParityEvaluation(rows, summaries);
    }

    private static RpSummary Summarize(string rp, IReadOnlyList<ParityEvidenceRow> rows, ParityGateConfig config)
    {
        var n = rows.Count;

        if (rp == "RP-5")
        {
            var within = rows.Count(r => r.Rp5LineageExact == true);
            bool? gate = rows.All(r => r.Rp5LineageExact != null)
                ? rows.All(r => r.Rp5LineageExact == true)
                : null; // unknown lineage anywhere → ungated
            return new RpSummary(rp, n, within, n == 0 ? null : (decimal)within / n, null, gate);
        }

        var withinCount = rows.Count(r => r.WithinTolerance == true);
        decimal? passRate = n == 0 ? null : (decimal)withinCount / n;
        var agreedRate = config.AgreedRateFor(rp);
        var anyUngated = rows.Any(r => r.WithinTolerance == null);
        bool? gatePass = (anyUngated || agreedRate is null) ? null : passRate >= agreedRate;

        return new RpSummary(rp, n, withinCount, passRate, agreedRate, gatePass);
    }
}
