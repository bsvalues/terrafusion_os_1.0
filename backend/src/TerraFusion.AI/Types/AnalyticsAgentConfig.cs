// BIV-064 — Configuration records for the analytics / prediction agent
namespace TerraFusion.AI.Types;

/// <summary>
/// Configuration for geographic hotspot detection
/// (rapid appreciation or depreciation zones).
/// </summary>
/// <param name="GridCellSizeMiles">Side length of the spatial grid cell.</param>
/// <param name="MinSalesPerCell">Minimum sales in a cell before it is evaluated.</param>
/// <param name="AppreciationThresholdPct">Annual appreciation % to flag as a hot zone.</param>
/// <param name="DepreciationThresholdPct">Annual depreciation % (negative) to flag as a cold zone.</param>
/// <param name="TemporalWindowMonths">Look-back window for change detection.</param>
public sealed record HotspotDetectionConfig(
    double GridCellSizeMiles = 0.5,
    int MinSalesPerCell = 5,
    double AppreciationThresholdPct = 8.0,
    double DepreciationThresholdPct = -3.0,
    int TemporalWindowMonths = 12)
{
    /// <summary>Default hotspot detection settings.</summary>
    public static HotspotDetectionConfig Default { get; } = new();
}

/// <summary>
/// Configuration for investment-potential scoring.
/// </summary>
/// <param name="CashFlowWeight">Weight of cash-flow component in overall score.</param>
/// <param name="AppreciationWeight">Weight of appreciation component.</param>
/// <param name="RiskWeight">Weight of risk component.</param>
/// <param name="MinYieldPct">Minimum gross yield % to qualify as "investable".</param>
/// <param name="MaxRiskScore">Maximum acceptable risk score (0-1).</param>
public sealed record InvestmentScoringConfig(
    double CashFlowWeight = 0.40,
    double AppreciationWeight = 0.35,
    double RiskWeight = 0.25,
    double MinYieldPct = 4.0,
    double MaxRiskScore = 0.70)
{
    /// <summary>Default investment scoring settings.</summary>
    public static InvestmentScoringConfig Default { get; } = new();
}

/// <summary>
/// Top-level configuration for the analytics service / prediction agent.
/// </summary>
/// <param name="PredictionHorizonMonths">How far forward to forecast property values.</param>
/// <param name="FeatureEngineering">Enable automatic feature engineering (interaction terms, polynomial).</param>
/// <param name="IncludeNeighborhoodEmbeddings">Use neighbourhood-code embeddings as features.</param>
/// <param name="IncludeSpatialLag">Include spatial lag of dependent variable as a feature.</param>
/// <param name="CrossValidationFolds">Number of k-fold CV splits for model evaluation.</param>
/// <param name="Hotspot">Hotspot detection sub-configuration.</param>
/// <param name="Investment">Investment scoring sub-configuration.</param>
public sealed record AnalyticsAgentConfig(
    int PredictionHorizonMonths = 12,
    bool FeatureEngineering = true,
    bool IncludeNeighborhoodEmbeddings = true,
    bool IncludeSpatialLag = true,
    int CrossValidationFolds = 5,
    HotspotDetectionConfig? Hotspot = null,
    InvestmentScoringConfig? Investment = null)
{
    /// <summary>Default analytics configuration.</summary>
    public static AnalyticsAgentConfig Default { get; } = new(
        Hotspot: HotspotDetectionConfig.Default,
        Investment: InvestmentScoringConfig.Default);
}
