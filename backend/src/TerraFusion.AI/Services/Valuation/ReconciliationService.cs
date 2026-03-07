using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services.Valuation;

/// <summary>
/// USPAP-aligned Reconciliation service combining Sales, Income, and Cost approaches.
/// Ported from quarantine: applications/terraforge-suite/harness/src/approaches/reconcile.ts
/// Produces final opinion of value with property-type-specific weighting.
/// </summary>
public class ReconciliationService
{
    private readonly ILogger<ReconciliationService> _logger;

    /// <summary>
    /// Default weight distributions by property type (USPAP standard practice).
    /// </summary>
    private static readonly Dictionary<string, Dictionary<string, double>> DefaultWeights = new()
    {
        ["residential"] = new() { ["sales"] = 0.6, ["income"] = 0.1, ["cost"] = 0.3 },
        ["commercial"] = new() { ["sales"] = 0.3, ["income"] = 0.5, ["cost"] = 0.2 },
        ["industrial"] = new() { ["sales"] = 0.25, ["income"] = 0.45, ["cost"] = 0.3 },
        ["agricultural"] = new() { ["sales"] = 0.4, ["income"] = 0.4, ["cost"] = 0.2 },
        ["special_purpose"] = new() { ["sales"] = 0.2, ["income"] = 0.2, ["cost"] = 0.6 },
    };

    private static readonly Dictionary<string, double> ConfidenceMultipliers = new()
    {
        ["high"] = 1.0,
        ["medium"] = 0.75,
        ["low"] = 0.5,
    };

    public ReconciliationService(ILogger<ReconciliationService> logger)
    {
        _logger = logger;
    }

    public ReconciliationResult RunReconciliation(ReconciliationInput input)
    {
        var approaches = new Dictionary<string, ApproachValue>();
        if (input.Sales is not null) approaches["sales"] = input.Sales;
        if (input.Income is not null) approaches["income"] = input.Income;
        if (input.Cost is not null) approaches["cost"] = input.Cost;

        if (approaches.Count == 0)
            throw new ArgumentException("At least one approach value is required for reconciliation");

        var propertyType = input.PropertyType ?? "residential";
        var method = input.ReconciliationMethod ?? "weighted_average";
        var forcedWeights = input.ForcedWeights;

        // Calculate weights
        var weights = CalculateWeights(approaches, propertyType, forcedWeights);

        // Calculate weighted values
        var approachSummary = new Dictionary<string, ApproachSummaryItem>();
        long totalWeightedValue = 0;
        var values = new List<long>();

        foreach (var (key, approach) in approaches)
        {
            var weight = weights.GetValueOrDefault(key, 0);
            var contributedValue = (long)Math.Round(approach.IndicatedValue * weight);
            approachSummary[key] = new ApproachSummaryItem
            {
                IndicatedValue = approach.IndicatedValue,
                Weight = weight,
                ContributedValue = contributedValue,
            };
            totalWeightedValue += contributedValue;
            values.Add(approach.IndicatedValue);
        }

        // Final value based on method
        long finalOpinionOfValue = method switch
        {
            "bracketed" => CalculateBracketedValue(values),
            "primary_approach" => GetPrimaryApproachValue(approaches, weights),
            _ => totalWeightedValue,
        };

        // Range statistics
        var minValue = values.Min();
        var maxValue = values.Max();
        var avgValue = values.Average();
        var spreadPercentage = avgValue > 0
            ? Math.Round((maxValue - minValue) / avgValue * 10000) / 100
            : 0;

        // Determine primary approach (highest weight)
        string? primaryApproach = null;
        double maxWeight = 0;
        foreach (var (key, _) in approaches)
        {
            var w = weights.GetValueOrDefault(key, 0);
            if (w > maxWeight)
            {
                maxWeight = w;
                primaryApproach = key;
            }
        }

        // Quality indicators
        var warnings = new List<string>();
        var approachAgreement = "strong";

        if (spreadPercentage > 20)
        {
            warnings.Add($"Large value spread ({spreadPercentage:F1}%) between approaches");
            approachAgreement = "weak";
        }
        else if (spreadPercentage > 10)
        {
            approachAgreement = "moderate";
        }

        if (approaches.Count == 1)
        {
            warnings.Add("Only one approach available - limited reconciliation possible");
            approachAgreement = "weak";
        }

        var confidences = approaches.Values.Select(a => a.ConfidenceLevel ?? "medium").ToList();
        var lowCount = confidences.Count(c => c == "low");
        var confidenceLevel = "high";

        if (lowCount > 0 || approachAgreement == "weak")
            confidenceLevel = "low";
        else if (approachAgreement == "moderate")
            confidenceLevel = "medium";

        var explanation = GenerateExplanation(input, approachSummary, finalOpinionOfValue, weights, primaryApproach, spreadPercentage, propertyType, method);

        var output = new ReconciliationOutput
        {
            SubjectId = input.SubjectId,
            EffectiveDate = input.EffectiveDate,
            FinalOpinionOfValue = finalOpinionOfValue,
            ApproachSummary = approachSummary,
            ReconciliationAnalysis = new ReconciliationAnalysis
            {
                Method = method,
                ValueRange = new ValueRange { Min = minValue, Max = maxValue },
                SpreadPercentage = spreadPercentage,
                PrimaryApproach = primaryApproach,
                WeightsNormalized = true,
            },
            QualityIndicators = new ReconciliationQualityIndicators
            {
                ConfidenceLevel = confidenceLevel,
                Warnings = warnings,
                ApproachAgreement = approachAgreement,
            },
            Explanation = explanation,
            GeneratedAt = DateTime.UtcNow,
        };

        _logger.LogInformation(
            "Reconciliation completed for {SubjectId}: {ApproachCount} approaches, final value {Value}, method {Method}, confidence {Confidence}",
            input.SubjectId, approaches.Count, finalOpinionOfValue, method, confidenceLevel);

        return new ReconciliationResult { Output = output };
    }

    private static Dictionary<string, double> CalculateWeights(
        Dictionary<string, ApproachValue> approaches, string propertyType, bool forcedWeights)
    {
        var defaults = DefaultWeights.GetValueOrDefault(propertyType, DefaultWeights["residential"])!;
        var weights = new Dictionary<string, double> { ["sales"] = 0, ["income"] = 0, ["cost"] = 0 };

        if (forcedWeights)
        {
            foreach (var (key, approach) in approaches)
            {
                if (approach.Weight.HasValue)
                    weights[key] = approach.Weight.Value;
            }
        }
        else
        {
            foreach (var (key, approach) in approaches)
            {
                var baseWeight = defaults.GetValueOrDefault(key, 0);
                var confidence = approach.ConfidenceLevel ?? "medium";
                var multiplier = ConfidenceMultipliers.GetValueOrDefault(confidence, 1);
                weights[key] = baseWeight * multiplier;
            }
        }

        // Normalize to sum to 1.0
        var totalWeight = weights.Values.Sum();
        if (totalWeight > 0)
        {
            foreach (var key in weights.Keys.ToList())
                weights[key] = Math.Round(weights[key] / totalWeight * 10000) / 10000;

            // Ensure exact sum of 1.0
            var sum = weights.Values.Sum();
            if (Math.Abs(sum - 1.0) > 0.0001)
            {
                var largest = approaches.Keys.OrderByDescending(k => weights.GetValueOrDefault(k, 0)).First();
                weights[largest] = Math.Round((weights[largest] + (1.0 - sum)) * 10000) / 10000;
            }
        }

        return weights;
    }

    private static long CalculateBracketedValue(List<long> values)
    {
        return (long)Math.Round((values.Min() + values.Max()) / 2.0);
    }

    private static long GetPrimaryApproachValue(
        Dictionary<string, ApproachValue> approaches, Dictionary<string, double> weights)
    {
        double maxWeight = 0;
        long primaryValue = 0;
        foreach (var (key, approach) in approaches)
        {
            var w = weights.GetValueOrDefault(key, 0);
            if (w > maxWeight)
            {
                maxWeight = w;
                primaryValue = approach.IndicatedValue;
            }
        }
        return primaryValue;
    }

    private static string GenerateExplanation(
        ReconciliationInput input,
        Dictionary<string, ApproachSummaryItem> summary,
        long finalValue,
        Dictionary<string, double> weights,
        string? primaryApproach,
        double spreadPercentage,
        string propertyType,
        string method)
    {
        var lines = new List<string>
        {
            "RECONCILIATION ANALYSIS",
            $"Subject: {input.SubjectId}",
            $"Effective Date: {input.EffectiveDate}",
            $"Property Type: {propertyType}",
            "",
            "APPROACH VALUES:",
        };

        if (summary.TryGetValue("sales", out var salesSummary))
            lines.Add($"  Sales Comparison: ${salesSummary.IndicatedValue:N0} x {weights.GetValueOrDefault("sales", 0) * 100:F1}% = ${salesSummary.ContributedValue:N0}");
        if (summary.TryGetValue("income", out var incomeSummary))
            lines.Add($"  Income Approach:  ${incomeSummary.IndicatedValue:N0} x {weights.GetValueOrDefault("income", 0) * 100:F1}% = ${incomeSummary.ContributedValue:N0}");
        if (summary.TryGetValue("cost", out var costSummary))
            lines.Add($"  Cost Approach:    ${costSummary.IndicatedValue:N0} x {weights.GetValueOrDefault("cost", 0) * 100:F1}% = ${costSummary.ContributedValue:N0}");

        lines.Add("");
        lines.Add($"RECONCILED VALUE: ${finalValue:N0}");
        lines.Add("");
        lines.Add($"Method: {method}");
        if (primaryApproach is not null)
            lines.Add($"Primary Approach: {primaryApproach}");
        lines.Add($"Value Spread: {spreadPercentage:F1}%");

        return string.Join("\n", lines);
    }
}

// ============================================================
// DTOs
// ============================================================

public class ApproachValue
{
    public long IndicatedValue { get; set; }
    public string? ConfidenceLevel { get; set; }
    public double? Weight { get; set; }
}

public class ReconciliationInput
{
    public string SubjectId { get; set; } = string.Empty;
    public string EffectiveDate { get; set; } = string.Empty;
    public ApproachValue? Sales { get; set; }
    public ApproachValue? Income { get; set; }
    public ApproachValue? Cost { get; set; }
    public string? PropertyType { get; set; }
    public string? ReconciliationMethod { get; set; }
    public bool ForcedWeights { get; set; }
}

public class ApproachSummaryItem
{
    public long IndicatedValue { get; set; }
    public double Weight { get; set; }
    public long ContributedValue { get; set; }
}

public class ReconciliationOutput
{
    public string SubjectId { get; set; } = string.Empty;
    public string EffectiveDate { get; set; } = string.Empty;
    public long FinalOpinionOfValue { get; set; }
    public Dictionary<string, ApproachSummaryItem> ApproachSummary { get; set; } = new();
    public ReconciliationAnalysis ReconciliationAnalysis { get; set; } = new();
    public ReconciliationQualityIndicators QualityIndicators { get; set; } = new();
    public string Explanation { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
}

public class ReconciliationAnalysis
{
    public string Method { get; set; } = "weighted_average";
    public ValueRange ValueRange { get; set; } = new();
    public double SpreadPercentage { get; set; }
    public string? PrimaryApproach { get; set; }
    public bool WeightsNormalized { get; set; }
}

public class ReconciliationQualityIndicators
{
    public string ConfidenceLevel { get; set; } = "medium";
    public List<string> Warnings { get; set; } = new();
    public string ApproachAgreement { get; set; } = "moderate";
}

public class ReconciliationResult
{
    public ReconciliationOutput Output { get; set; } = new();
}
