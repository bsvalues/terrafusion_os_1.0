namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// TF-owned calibration acceptance thresholds (IAAO-style; county-settable). Defaults are common
/// IAAO guidance: level (median) near 1.0, COD uniformity ceiling, PRD vertical-equity band.
/// </summary>
public sealed record CalibrationThresholds(
    decimal MedianMin = 0.90m,
    decimal MedianMax = 1.10m,
    decimal CodMax = 15.0m,
    decimal PrdMin = 0.98m,
    decimal PrdMax = 1.03m,
    int MinSampleSize = 5);

/// <summary>Calibration outcome: pass/fail with human-readable findings.</summary>
public sealed record CalibrationStatus(bool Passed, IReadOnlyList<string> Findings, string Summary);

/// <summary>
/// Deterministic TF-native calibration/QC gate (pack criterion 6). Flags out-of-tolerance models on
/// appraisal level (median), uniformity (COD) and vertical equity (PRD), plus insufficient samples.
/// Pure function over a ratio study — informational/QC, not an automatic value change.
/// </summary>
public static class CalibrationGate
{
    /// <summary>Evaluates a ratio study against thresholds (deterministic, explained).</summary>
    public static CalibrationStatus Evaluate(RatioStudyResult study, CalibrationThresholds thresholds)
    {
        var findings = new List<string>();

        if (!study.Found || study.Count == 0)
        {
            findings.Add("No qualified sales: ratio study could not be computed (model not calibratable).");
            return new CalibrationStatus(false, findings, "FAIL: no qualified sales.");
        }

        if (study.Count < thresholds.MinSampleSize)
            findings.Add($"Insufficient sample: {study.Count} qualified sales < minimum {thresholds.MinSampleSize}.");

        if (study.MedianRatio < thresholds.MedianMin || study.MedianRatio > thresholds.MedianMax)
            findings.Add($"Appraisal level (median {study.MedianRatio}) outside [{thresholds.MedianMin}, {thresholds.MedianMax}].");

        if (study.Cod > thresholds.CodMax)
            findings.Add($"Uniformity (COD {study.Cod}) exceeds maximum {thresholds.CodMax}.");

        if (study.Prd < thresholds.PrdMin || study.Prd > thresholds.PrdMax)
            findings.Add($"Vertical equity (PRD {study.Prd}) outside [{thresholds.PrdMin}, {thresholds.PrdMax}].");

        var passed = findings.Count == 0;
        var summary = passed
            ? $"PASS: median {study.MedianRatio}, COD {study.Cod}, PRD {study.Prd} over {study.Count} sales."
            : $"FLAGGED ({findings.Count}): " + string.Join(" ", findings);

        return new CalibrationStatus(passed, findings, summary);
    }
}
