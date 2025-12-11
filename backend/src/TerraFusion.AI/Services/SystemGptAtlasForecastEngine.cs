// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Atlas Forecast Engine
// Predictive Autoscaling & Trend Forecast Engine
// Consumes telemetry + anomalies + swarm state to produce risk forecasts
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Interface for the Atlas Forecast Engine.
/// </summary>
public interface ISystemGptAtlasForecastEngine
{
    /// <summary>
    /// Computes a forecast based on telemetry, anomalies, and swarm state.
    /// </summary>
    Task<AtlasForecastRecord> ComputeForecast(AtlasForecastInput input);
}

/// <summary>
/// Phase 32: Forecast engine that analyzes trends and anomalies to predict risk.
/// Uses statistical trend analysis and anomaly correlation to determine risk levels.
/// </summary>
public sealed class SystemGptAtlasForecastEngine : ISystemGptAtlasForecastEngine
{
    private readonly ILogger<SystemGptAtlasForecastEngine> _logger;
    private readonly AtlasForecastOptions _options;

    public SystemGptAtlasForecastEngine(
        IOptions<AtlasForecastOptions> options,
        ILogger<SystemGptAtlasForecastEngine> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public Task<AtlasForecastRecord> ComputeForecast(AtlasForecastInput input)
    {
        _logger.LogDebug("Computing forecast for county {CountyId}", input.CountyId);

        // Calculate risk for each dimension
        var dimensionRisks = new Dictionary<AtlasRiskDimension, AtlasRiskLevel>
        {
            [AtlasRiskDimension.Latency] = CalculateLatencyRisk(input),
            [AtlasRiskDimension.ErrorRate] = CalculateErrorRateRisk(input),
            [AtlasRiskDimension.Offline] = CalculateOfflineRisk(input),
            [AtlasRiskDimension.Capacity] = CalculateCapacityRisk(input)
        };

        // Overall risk is the max of all dimensions
        var overallRisk = dimensionRisks.Values.Max();

        // Determine highest risk dimension
        var highestDimension = dimensionRisks
            .OrderByDescending(kv => (int)kv.Value)
            .ThenBy(kv => kv.Key) // Deterministic ordering
            .First()
            .Key;

        // Determine recommended action based on highest risk
        var recommendedAction = DetermineRecommendedAction(overallRisk, highestDimension, dimensionRisks);

        // Calculate confidence based on data quality
        var confidence = CalculateConfidence(input);

        // Build reasoning
        var reasoning = BuildReasoning(overallRisk, highestDimension, dimensionRisks, recommendedAction);

        var forecast = new AtlasForecastRecord
        {
            Id = Guid.NewGuid(),
            CountyId = input.CountyId,
            Timestamp = DateTimeOffset.UtcNow,
            Horizon = input.Horizon,
            OverallRisk = overallRisk,
            DimensionRisks = dimensionRisks,
            RecommendedAction = recommendedAction,
            Confidence = confidence,
            Reasoning = reasoning
        };

        _logger.LogInformation(
            "Forecast computed for {CountyId}: Overall={OverallRisk}, Highest={HighestDimension}, Action={Action}",
            input.CountyId, overallRisk, highestDimension, recommendedAction);

        return Task.FromResult(forecast);
    }

    #region Risk Calculation Methods

    private AtlasRiskLevel CalculateLatencyRisk(AtlasForecastInput input)
    {
        // Count latency spike anomalies
        var latencySpikeCount = input.RecentAnomalies
            .Count(a => a.Kind == AtlasAnomalyKind.LatencySpike);

        // Calculate latency trend from telemetry
        var latencyTrend = CalculateLatencyTrend(input.TelemetryHistory);

        // Risk matrix:
        // - Rising trend + frequent spikes = High/Critical
        // - Rising trend OR multiple spikes = Moderate/High
        // - Stable trend + few spikes = Low
        if (latencyTrend > _options.TrendSlopeThreshold * 2 && latencySpikeCount >= 3)
            return AtlasRiskLevel.Critical;

        if (latencyTrend > _options.TrendSlopeThreshold && latencySpikeCount >= _options.AnomalyCountThreshold)
            return AtlasRiskLevel.High;

        if (latencyTrend > _options.TrendSlopeThreshold || latencySpikeCount >= _options.AnomalyCountThreshold)
            return AtlasRiskLevel.Moderate;

        return AtlasRiskLevel.Low;
    }

    private AtlasRiskLevel CalculateErrorRateRisk(AtlasForecastInput input)
    {
        // Count error spike anomalies
        var errorSpikeCount = input.RecentAnomalies
            .Count(a => a.Kind == AtlasAnomalyKind.ErrorSpike);

        // Calculate error rate trend from telemetry
        var errorTrend = CalculateErrorTrend(input.TelemetryHistory);

        // Risk matrix:
        // - Rising trend + frequent spikes = High/Critical
        // - Rising trend OR multiple spikes = Moderate/High
        // - Stable trend + few spikes = Low
        if (errorTrend > _options.TrendSlopeThreshold * 2 && errorSpikeCount >= 3)
            return AtlasRiskLevel.Critical;

        if (errorTrend > _options.TrendSlopeThreshold && errorSpikeCount >= _options.AnomalyCountThreshold)
            return AtlasRiskLevel.High;

        if (errorTrend > _options.TrendSlopeThreshold || errorSpikeCount >= _options.AnomalyCountThreshold)
            return AtlasRiskLevel.Moderate;

        return AtlasRiskLevel.Low;
    }

    private AtlasRiskLevel CalculateOfflineRisk(AtlasForecastInput input)
    {
        // Count offline pattern anomalies
        var offlinePatternCount = input.RecentAnomalies
            .Count(a => a.Kind == AtlasAnomalyKind.OfflinePattern);

        // Offline risk is primarily anomaly-driven
        // Multiple offline patterns indicate imminent failure risk
        if (offlinePatternCount >= 4)
            return AtlasRiskLevel.Critical;

        if (offlinePatternCount >= 3)
            return AtlasRiskLevel.High;

        if (offlinePatternCount >= _options.AnomalyCountThreshold)
            return AtlasRiskLevel.Moderate;

        return AtlasRiskLevel.Low;
    }

    private AtlasRiskLevel CalculateCapacityRisk(AtlasForecastInput input)
    {
        // Count capacity flap anomalies
        var capacityFlapCount = input.RecentAnomalies
            .Count(a => a.Kind == AtlasAnomalyKind.CapacityFlap);

        // Check swarm mode stability
        var modeInstability = CalculateModeInstability(input.SwarmState);

        // Risk matrix:
        // - Frequent flaps + mode instability = High/Critical
        // - Flaps OR instability = Moderate
        // - Stable = Low
        if (capacityFlapCount >= 3 && modeInstability)
            return AtlasRiskLevel.Critical;

        if (capacityFlapCount >= _options.AnomalyCountThreshold && modeInstability)
            return AtlasRiskLevel.High;

        if (capacityFlapCount >= _options.AnomalyCountThreshold || modeInstability)
            return AtlasRiskLevel.Moderate;

        return AtlasRiskLevel.Low;
    }

    #endregion

    #region Trend Calculation Methods

    private double CalculateLatencyTrend(IReadOnlyList<AtlasTelemetrySnapshot> telemetry)
    {
        if (telemetry.Count < _options.MinTelemetrySamples)
            return 0.0;

        // Simple linear regression slope on P95 latency
        var latencies = telemetry.Select(t => t.P95LatencyMs).ToArray();
        return CalculateLinearSlope(latencies);
    }

    private double CalculateErrorTrend(IReadOnlyList<AtlasTelemetrySnapshot> telemetry)
    {
        if (telemetry.Count < _options.MinTelemetrySamples)
            return 0.0;

        // Simple linear regression slope on error rate
        var errorRates = telemetry.Select(t => t.ErrorRate).ToArray();
        return CalculateLinearSlope(errorRates);
    }

    private static double CalculateLinearSlope(double[] values)
    {
        if (values.Length < 2)
            return 0.0;

        // Calculate slope using least squares method
        int n = values.Length;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (int i = 0; i < n; i++)
        {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumX2 += i * i;
        }

        double denominator = n * sumX2 - sumX * sumX;
        if (Math.Abs(denominator) < 0.0001)
            return 0.0;

        return (n * sumXY - sumX * sumY) / denominator;
    }

    private static bool CalculateModeInstability(SwarmState? swarmState)
    {
        if (swarmState?.ModeHistory == null || swarmState.ModeHistory.Count < 2)
            return false;

        // Check for mode transitions in recent history
        var distinctModes = swarmState.ModeHistory.Distinct().Count();
        return distinctModes >= 2; // Mode changed at least once
    }

    #endregion

    #region Action Determination

    private SwarmActionKind? DetermineRecommendedAction(
        AtlasRiskLevel overallRisk,
        AtlasRiskDimension highestDimension,
        Dictionary<AtlasRiskDimension, AtlasRiskLevel> dimensionRisks)
    {
        // No action for low risk
        if (overallRisk == AtlasRiskLevel.Low)
            return null;

        // Critical offline risk → EnableSafeMode
        if (highestDimension == AtlasRiskDimension.Offline && 
            dimensionRisks[AtlasRiskDimension.Offline] >= AtlasRiskLevel.Critical)
            return SwarmActionKind.EnableSafeMode;

        // High error rate risk → RouteToSafeModel
        if (highestDimension == AtlasRiskDimension.ErrorRate && 
            dimensionRisks[AtlasRiskDimension.ErrorRate] >= AtlasRiskLevel.High)
            return SwarmActionKind.RouteToSafeModel;

        // High latency or capacity risk → IncreaseCapacity
        if ((highestDimension == AtlasRiskDimension.Latency || 
             highestDimension == AtlasRiskDimension.Capacity) &&
            dimensionRisks[highestDimension] >= AtlasRiskLevel.High)
            return SwarmActionKind.IncreaseCapacity;

        // Moderate risk - no immediate action, but monitoring advised
        return null;
    }

    #endregion

    #region Confidence & Reasoning

    private double CalculateConfidence(AtlasForecastInput input)
    {
        var confidence = _options.BaseConfidence;

        // Boost confidence if we have enough telemetry samples
        if (input.TelemetryHistory.Count >= _options.MinTelemetrySamples * 2)
            confidence += _options.HighSampleConfidenceBoost;

        // Reduce confidence if no telemetry
        if (input.TelemetryHistory.Count == 0)
            confidence -= 0.2;

        // Reduce confidence if no anomaly data
        if (input.RecentAnomalies.Count == 0 && input.TelemetryHistory.Count == 0)
            confidence -= 0.1;

        return Math.Clamp(confidence, 0.1, 0.99);
    }

    private static string BuildReasoning(
        AtlasRiskLevel overallRisk,
        AtlasRiskDimension highestDimension,
        Dictionary<AtlasRiskDimension, AtlasRiskLevel> dimensionRisks,
        SwarmActionKind? recommendedAction)
    {
        var parts = new List<string>
        {
            $"Overall risk: {overallRisk}",
            $"Highest dimension: {highestDimension} ({dimensionRisks[highestDimension]})"
        };

        if (recommendedAction.HasValue)
            parts.Add($"Recommended preemptive action: {recommendedAction.Value}");
        else if (overallRisk > AtlasRiskLevel.Low)
            parts.Add("Monitoring advised, no immediate action required");
        else
            parts.Add("System operating within normal parameters");

        return string.Join(". ", parts) + ".";
    }

    #endregion
}
