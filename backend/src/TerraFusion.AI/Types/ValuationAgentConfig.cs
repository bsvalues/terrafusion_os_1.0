// BIV-062 — Configuration records for valuation agents
namespace TerraFusion.AI.Types;

/// <summary>
/// Configuration for a single valuation methodology
/// (sales comparison, cost approach, income, mass appraisal, AVM).
/// </summary>
/// <param name="Name">Methodology identifier (e.g. "SalesComparison", "MassAppraisal_OLS").</param>
/// <param name="Enabled">Whether this methodology is active.</param>
/// <param name="Weight">Reconciliation weight when combining approaches (0-1).</param>
/// <param name="MinComparables">Minimum comparable sales required (0 for non-comp methods).</param>
/// <param name="MaxComparables">Maximum comparables to consider.</param>
/// <param name="MaxAdjustmentPct">Maximum net adjustment percentage for comparables.</param>
public sealed record ValuationMethodConfig(
    string Name,
    bool Enabled = true,
    double Weight = 0.25,
    int MinComparables = 3,
    int MaxComparables = 10,
    double MaxAdjustmentPct = 25.0);

/// <summary>
/// Confidence-score thresholds used to classify valuation reliability.
/// </summary>
/// <param name="High">Score at or above this value is high confidence.</param>
/// <param name="Medium">Score at or above this value (but below High) is medium confidence.</param>
/// <remarks>
/// Any score below <see cref="Medium"/> is considered low confidence.
/// Defaults: high >= 0.85, medium >= 0.70, low &lt; 0.70.
/// </remarks>
public sealed record ConfidenceThresholds(
    double High = 0.85,
    double Medium = 0.70)
{
    /// <summary>Standard IAAO-aligned thresholds.</summary>
    public static ConfidenceThresholds Default { get; } = new();

    /// <summary>Classify a raw confidence score.</summary>
    public string Classify(double score) => score switch
    {
        _ when score >= High => "High",
        _ when score >= Medium => "Medium",
        _ => "Low"
    };
}

/// <summary>
/// Top-level configuration for the valuation agent subsystem.
/// </summary>
/// <param name="PrimaryMethodology">Default methodology to run when not specified.</param>
/// <param name="Methods">Available valuation methodologies and their settings.</param>
/// <param name="Confidence">Confidence-score classification thresholds.</param>
/// <param name="ReconciliationStrategy">How to combine multiple approach results: "WeightedAverage" | "HighestConfidence" | "Median".</param>
/// <param name="MaxParallelApproaches">Max concurrent methodology executions.</param>
public sealed record ValuationAgentConfig(
    string PrimaryMethodology = "MassAppraisal_OLS",
    ValuationMethodConfig[]? Methods = null,
    ConfidenceThresholds? Confidence = null,
    string ReconciliationStrategy = "WeightedAverage",
    int MaxParallelApproaches = 5)
{
    /// <summary>Default configuration with all five methodologies enabled.</summary>
    public static ValuationAgentConfig Default { get; } = new(
        PrimaryMethodology: "MassAppraisal_OLS",
        Methods: new[]
        {
            new ValuationMethodConfig("SalesComparison", Weight: 0.30, MinComparables: 3, MaxComparables: 10, MaxAdjustmentPct: 25),
            new ValuationMethodConfig("CostApproach",    Weight: 0.20, MinComparables: 0, MaxComparables: 0,  MaxAdjustmentPct: 0),
            new ValuationMethodConfig("IncomeApproach",  Weight: 0.15, MinComparables: 0, MaxComparables: 0,  MaxAdjustmentPct: 0),
            new ValuationMethodConfig("MassAppraisal_OLS", Weight: 0.20, MinComparables: 0, MaxComparables: 0,  MaxAdjustmentPct: 0),
            new ValuationMethodConfig("AVM",             Weight: 0.15, MinComparables: 5, MaxComparables: 20, MaxAdjustmentPct: 30)
        },
        Confidence: ConfidenceThresholds.Default);
}
