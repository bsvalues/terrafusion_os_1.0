using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services;

/// <summary>
/// USPAP-aligned three-approach reconciliation.
/// Combines cost, income, and sales comparison into a final opinion of value.
/// Benton County default weights from CAMA production data.
/// </summary>
public class ReconciliationService : IReconciliationService
{
  private readonly ILogger<ReconciliationService> _logger;

  // ── Benton County Default Weights by Property Type ──
  // Source: TerraForge harness reconcile.ts + forgeService.ts (identical)
  private static readonly Dictionary<string, (decimal Sales, decimal Income, decimal Cost)> DefaultWeights = new()
  {
    ["residential"] = (0.60m, 0.10m, 0.30m),
    ["commercial"] = (0.30m, 0.50m, 0.20m),
    ["industrial"] = (0.25m, 0.45m, 0.30m),
    ["agricultural"] = (0.40m, 0.40m, 0.20m),
    ["special_purpose"] = (0.20m, 0.20m, 0.60m),
  };

  // ── Confidence Multipliers ──
  private static readonly Dictionary<string, decimal> ConfidenceMultipliers = new()
  {
    ["high"] = 1.0m,
    ["medium"] = 0.75m,
    ["low"] = 0.5m,
  };

  public ReconciliationService(ILogger<ReconciliationService> logger)
  {
    _logger = logger;
  }

  public Task<ReconciliationResultDto> ReconcileAsync(ReconciliationRequest request)
  {
    var approaches = new Dictionary<string, ApproachValueDto>();
    if (request.SalesApproach is { IndicatedValue: > 0 })
      approaches["sales"] = request.SalesApproach;
    if (request.IncomeApproach is { IndicatedValue: > 0 })
      approaches["income"] = request.IncomeApproach;
    if (request.CostApproach is { IndicatedValue: > 0 })
      approaches["cost"] = request.CostApproach;

    if (approaches.Count == 0)
      throw new ArgumentException("At least one approach with a positive indicated value is required.");

    // Resolve base weights
    var propertyType = (request.PropertyType ?? "residential").ToLowerInvariant();
    if (!DefaultWeights.TryGetValue(propertyType, out var baseWeightTuple))
      baseWeightTuple = DefaultWeights["residential"];

    var baseWeights = new Dictionary<string, decimal>
    {
      ["sales"] = baseWeightTuple.Sales,
      ["income"] = baseWeightTuple.Income,
      ["cost"] = baseWeightTuple.Cost,
    };

    // Calculate adjusted weights (base × confidence multiplier)
    var adjustedWeights = new Dictionary<string, decimal>();
    foreach (var (key, approach) in approaches)
    {
      var baseWeight = request.ForcedWeights && approach.Weight.HasValue
          ? approach.Weight.Value
          : baseWeights.GetValueOrDefault(key, 0m);

      var confidence = (approach.ConfidenceLevel ?? "medium").ToLowerInvariant();
      var multiplier = ConfidenceMultipliers.GetValueOrDefault(confidence, 0.75m);

      adjustedWeights[key] = baseWeight * multiplier;
    }

    // Normalize to sum = 1.0
    var totalWeight = adjustedWeights.Values.Sum();
    if (totalWeight <= 0)
      totalWeight = 1m;

    var normalizedWeights = new Dictionary<string, decimal>();
    foreach (var (key, w) in adjustedWeights)
      normalizedWeights[key] = Math.Round(w / totalWeight, 4);

    // Remainder correction on largest weight
    var remainder = 1m - normalizedWeights.Values.Sum();
    if (remainder != 0 && normalizedWeights.Count > 0)
    {
      var largest = normalizedWeights.MaxBy(kv => kv.Value).Key;
      normalizedWeights[largest] += remainder;
    }

    // Calculate final value by method
    var method = (request.ReconciliationMethod ?? "weighted_average").ToLowerInvariant();
    var values = approaches.Select(kv => kv.Value.IndicatedValue).ToList();
    var minVal = values.Min();
    var maxVal = values.Max();
    var avgVal = values.Average();
    var spread = avgVal > 0 ? (maxVal - minVal) / avgVal * 100m : 0m;

    decimal finalValue;
    string? primaryApproach = null;

    switch (method)
    {
      case "bracketed":
        finalValue = Math.Round((minVal + maxVal) / 2m, 0);
        break;

      case "primary_approach":
        var primary = normalizedWeights.MaxBy(kv => kv.Value);
        primaryApproach = primary.Key;
        finalValue = approaches[primary.Key].IndicatedValue;
        break;

      default: // weighted_average
        finalValue = Math.Round(
            approaches.Sum(kv => kv.Value.IndicatedValue * normalizedWeights[kv.Key]),
            0);
        break;
    }

    // Build approach summary
    var summary = new Dictionary<string, ApproachSummaryItemDto>();
    foreach (var (key, approach) in approaches)
    {
      summary[key] = new ApproachSummaryItemDto
      {
        IndicatedValue = approach.IndicatedValue,
        ConfidenceLevel = approach.ConfidenceLevel ?? "medium",
        BaseWeight = baseWeights.GetValueOrDefault(key, 0m),
        AdjustedWeight = normalizedWeights[key],
        ContributedValue = Math.Round(approach.IndicatedValue * normalizedWeights[key], 0),
      };
    }

    // Quality indicators
    var warnings = new List<string>();
    string agreement;
    string confidenceLevel;

    if (approaches.Count == 1)
    {
      agreement = "weak";
      warnings.Add("Only one approach provided — reconciliation reliability is limited");
    }
    else if (spread <= 10m)
    {
      agreement = "strong";
    }
    else if (spread <= 20m)
    {
      agreement = "moderate";
    }
    else
    {
      agreement = "weak";
      warnings.Add($"Approach spread of {spread:F1}% exceeds 20% — review approach values");
    }

    // Final confidence: if any input is low → final is low; if spread weak → degrade
    var hasLowConfidence = approaches.Values.Any(a =>
        (a.ConfidenceLevel ?? "medium").Equals("low", StringComparison.OrdinalIgnoreCase));

    if (hasLowConfidence || agreement == "weak")
      confidenceLevel = "low";
    else if (agreement == "moderate" || approaches.Values.Any(a =>
        (a.ConfidenceLevel ?? "medium").Equals("medium", StringComparison.OrdinalIgnoreCase)))
      confidenceLevel = "medium";
    else
      confidenceLevel = "high";

    // Generate explanation narrative
    var explanation = GenerateExplanation(approaches, normalizedWeights, method, finalValue, spread, agreement);

    var result = new ReconciliationResultDto
    {
      SubjectId = request.SubjectId,
      EffectiveDate = request.EffectiveDate,
      FinalOpinionOfValue = finalValue,
      ApproachSummary = summary,
      Analysis = new ReconciliationAnalysisDto
      {
        Method = method,
        MinValue = minVal,
        MaxValue = maxVal,
        SpreadPercentage = Math.Round(spread, 2),
        PrimaryApproach = primaryApproach,
        WeightsNormalized = true,
      },
      QualityIndicators = new QualityIndicatorsDto
      {
        ConfidenceLevel = confidenceLevel,
        Warnings = warnings,
        ApproachAgreement = agreement,
      },
      Explanation = explanation,
      GeneratedAt = DateTime.UtcNow,
    };

    _logger.LogInformation(
        "Reconciliation completed for {SubjectId}: final value {FinalValue:C0}, method={Method}, agreement={Agreement}",
        request.SubjectId, finalValue, method, agreement);

    return Task.FromResult(result);
  }

  public Task<ReconciliationParametersDto> GetReconciliationParametersAsync()
  {
    var weightsByType = new Dictionary<string, PropertyTypeWeightsDto>();
    foreach (var (propType, weights) in DefaultWeights)
    {
      weightsByType[propType] = new PropertyTypeWeightsDto
      {
        Sales = weights.Sales,
        Income = weights.Income,
        Cost = weights.Cost,
      };
    }

    var result = new ReconciliationParametersDto
    {
      DefaultWeightsByPropertyType = weightsByType,
      ConfidenceMultipliers = new Dictionary<string, decimal>(ConfidenceMultipliers),
      SupportedMethods = new List<string> { "weighted_average", "bracketed", "primary_approach" },
      SupportedPropertyTypes = DefaultWeights.Keys.ToList(),
      AgreementThresholds = new AgreementThresholdsDto
      {
        StrongMaxSpread = 10m,
        ModerateMaxSpread = 20m,
      },
    };

    return Task.FromResult(result);
  }

  private static string GenerateExplanation(
      Dictionary<string, ApproachValueDto> approaches,
      Dictionary<string, decimal> weights,
      string method,
      decimal finalValue,
      decimal spread,
      string agreement)
  {
    var parts = new List<string>();
    parts.Add($"Reconciliation of {approaches.Count} valuation approach(es) using {method.Replace('_', ' ')} method.");

    foreach (var (key, approach) in approaches)
    {
      var w = weights.GetValueOrDefault(key, 0m) * 100m;
      parts.Add($"  {key}: ${approach.IndicatedValue:N0} (weight: {w:F1}%, confidence: {approach.ConfidenceLevel ?? "medium"})");
    }

    parts.Add($"Value range: ${approaches.Values.Min(a => a.IndicatedValue):N0} – ${approaches.Values.Max(a => a.IndicatedValue):N0} (spread: {spread:F1}%)");
    parts.Add($"Approach agreement: {agreement}");
    parts.Add($"Final opinion of value: ${finalValue:N0}");

    return string.Join("\n", parts);
  }
}
