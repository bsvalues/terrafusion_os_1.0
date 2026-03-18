// BIV-063 — Configuration records for the market analysis agent
namespace TerraFusion.AI.Types;

/// <summary>
/// Configuration for trend-analysis routines including smoothing and seasonality.
/// </summary>
/// <param name="SmoothingFactor">Exponential smoothing alpha (0-1). Higher = more responsive.</param>
/// <param name="SeasonalAdjustment">Apply seasonal adjustment to price series.</param>
/// <param name="SeasonalPeriodMonths">Period length for seasonal decomposition.</param>
/// <param name="MinSampleSize">Minimum sales count required for a valid trend calculation.</param>
/// <param name="OutlierStdDevThreshold">Standard deviations beyond which a sale is considered an outlier.</param>
public sealed record TrendAnalysisConfig(
    double SmoothingFactor = 0.30,
    bool SeasonalAdjustment = true,
    int SeasonalPeriodMonths = 12,
    int MinSampleSize = 20,
    double OutlierStdDevThreshold = 2.5)
{
    /// <summary>Default trend analysis settings.</summary>
    public static TrendAnalysisConfig Default { get; } = new();
}

/// <summary>
/// Top-level configuration for the market analysis agent.
/// </summary>
/// <param name="DefaultSearchRadiusMiles">Default radius when searching for comparables.</param>
/// <param name="MaxComparables">Maximum comparable properties to return.</param>
/// <param name="DefaultDateWindowMonths">Default look-back period in months for sales data.</param>
/// <param name="MinSimilarityScore">Minimum similarity score to include a comparable (0-1).</param>
/// <param name="Trend">Trend analysis sub-configuration.</param>
/// <param name="PricePerSqftFloor">Minimum plausible price per sqft (filters bad data).</param>
/// <param name="PricePerSqftCeiling">Maximum plausible price per sqft (filters bad data).</param>
public sealed record MarketAgentConfig(
    double DefaultSearchRadiusMiles = 3.0,
    int MaxComparables = 15,
    int DefaultDateWindowMonths = 12,
    double MinSimilarityScore = 0.40,
    TrendAnalysisConfig? Trend = null,
    decimal PricePerSqftFloor = 30m,
    decimal PricePerSqftCeiling = 1500m)
{
    /// <summary>Default market agent configuration.</summary>
    public static MarketAgentConfig Default { get; } = new(
        Trend: TrendAnalysisConfig.Default);
}
