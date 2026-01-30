// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Atlas Forecast Models
// Predictive Autoscaling & Trend Forecast Engine
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models;

/// <summary>
/// Risk dimensions tracked by the forecast engine.
/// </summary>
public enum AtlasRiskDimension
{
    /// <summary>Latency risk - response times trending upward.</summary>
    Latency,

    /// <summary>Error rate risk - failures trending upward.</summary>
    ErrorRate,

    /// <summary>Offline risk - agents going offline or becoming unresponsive.</summary>
    Offline,

    /// <summary>Capacity risk - swarm capacity under pressure.</summary>
    Capacity
}

/// <summary>
/// Risk severity levels for forecasts.
/// </summary>
public enum AtlasRiskLevel
{
    /// <summary>Low risk - no intervention needed.</summary>
    Low = 0,

    /// <summary>Moderate risk - monitoring recommended.</summary>
    Moderate = 1,

    /// <summary>High risk - preemptive action recommended.</summary>
    High = 2,

    /// <summary>Critical risk - immediate action required.</summary>
    Critical = 3
}

/// <summary>
/// Forecast time horizon.
/// </summary>
public enum AtlasForecastHorizon
{
    /// <summary>Short-term forecast (5-15 minutes).</summary>
    ShortTerm,

    /// <summary>Medium-term forecast (15-60 minutes).</summary>
    MediumTerm
}

/// <summary>
/// A single forecast record representing predicted risk for a county.
/// </summary>
public record AtlasForecastRecord
{
    /// <summary>Unique identifier for this forecast.</summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>County this forecast applies to.</summary>
    public required string CountyId { get; init; }

    /// <summary>Timestamp when forecast was generated.</summary>
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Forecast time horizon.</summary>
    public AtlasForecastHorizon Horizon { get; init; } = AtlasForecastHorizon.ShortTerm;

    /// <summary>Overall risk level (max of all dimensions).</summary>
    public AtlasRiskLevel OverallRisk { get; init; }

    /// <summary>Risk levels per dimension.</summary>
    public required Dictionary<AtlasRiskDimension, AtlasRiskLevel> DimensionRisks { get; init; }

    /// <summary>Recommended preemptive action, if any.</summary>
    public SwarmActionKind? RecommendedAction { get; init; }

    /// <summary>Confidence score (0.0 to 1.0).</summary>
    public double Confidence { get; init; }

    /// <summary>Human-readable reasoning for this forecast.</summary>
    public string Reasoning { get; init; } = string.Empty;
}

/// <summary>
/// Summary of forecasts for a county - used for dashboard/API responses.
/// </summary>
public record AtlasForecastSummary
{
    /// <summary>County identifier.</summary>
    public required string CountyId { get; init; }

    /// <summary>Latest overall risk level.</summary>
    public AtlasRiskLevel LatestOverallRisk { get; init; }

    /// <summary>Dimension with highest risk.</summary>
    public AtlasRiskDimension HighestDimension { get; init; }

    /// <summary>When the latest forecast was generated.</summary>
    public DateTimeOffset LastUpdated { get; init; }

    /// <summary>Number of forecasts in the summary window.</summary>
    public int ForecastCount { get; init; }

    /// <summary>Current recommended preemptive action, if any.</summary>
    public SwarmActionKind? RecommendedAction { get; init; }
}

/// <summary>
/// Input data for forecast computation.
/// </summary>
public record AtlasForecastInput
{
    /// <summary>County to forecast.</summary>
    public required string CountyId { get; init; }

    /// <summary>Recent telemetry snapshots.</summary>
    public IReadOnlyList<AtlasTelemetrySnapshot> TelemetryHistory { get; init; } = [];

    /// <summary>Recent anomalies detected.</summary>
    public IReadOnlyList<AtlasAnomaly> RecentAnomalies { get; init; } = [];

    /// <summary>Current swarm state.</summary>
    public SwarmState? SwarmState { get; init; }

    /// <summary>Forecast horizon to compute.</summary>
    public AtlasForecastHorizon Horizon { get; init; } = AtlasForecastHorizon.ShortTerm;
}

/// <summary>
/// Simplified telemetry snapshot for forecast analysis.
/// Compatible with SystemGptAtlasLiveDto.
/// </summary>
public record AtlasTelemetrySnapshot
{
    /// <summary>Timestamp of this snapshot.</summary>
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>P95 latency in milliseconds.</summary>
    public double P95LatencyMs { get; init; }

    /// <summary>Error rate percentage.</summary>
    public double ErrorRate { get; init; }

    /// <summary>Active request count.</summary>
    public int ActiveRequests { get; init; }

    /// <summary>Health state classification.</summary>
    public string HealthState { get; init; } = "healthy";
}

/// <summary>
/// Simplified anomaly record for forecast analysis.
/// Compatible with SystemGptAtlasAnomalyEventDto.
/// </summary>
public record AtlasAnomaly
{
    /// <summary>Anomaly kind.</summary>
    public AtlasAnomalyKind Kind { get; init; }

    /// <summary>Severity level.</summary>
    public AtlasAnomalySeverity Severity { get; init; }

    /// <summary>When detected.</summary>
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>County this anomaly relates to.</summary>
    public string CountyId { get; init; } = string.Empty;
}

/// <summary>
/// Configuration options for the forecast engine.
/// </summary>
public class AtlasForecastOptions
{
    /// <summary>Configuration section name.</summary>
    public const string Section = "Atlas:Forecast";

    /// <summary>Minimum telemetry samples required for trend analysis.</summary>
    public int MinTelemetrySamples { get; set; } = 5;

    /// <summary>Anomaly count threshold for elevated risk.</summary>
    public int AnomalyCountThreshold { get; set; } = 2;

    /// <summary>Trend slope threshold for rising risk (positive = rising).</summary>
    public double TrendSlopeThreshold { get; set; } = 0.1;

    /// <summary>Hours to look back for anomaly analysis.</summary>
    public int AnomalyLookbackHours { get; set; } = 1;

    /// <summary>Confidence boost for high sample counts.</summary>
    public double HighSampleConfidenceBoost { get; set; } = 0.1;

    /// <summary>Base confidence when sufficient data available.</summary>
    public double BaseConfidence { get; set; } = 0.75;
}

/// <summary>
/// Swarm state for predictive evaluation (simplified view for forecast engine).
/// </summary>
public record SwarmState
{
    /// <summary>County identifier.</summary>
    public required string CountyId { get; init; }

    /// <summary>Current operating mode.</summary>
    public SwarmMode Mode { get; init; } = SwarmMode.Normal;

    /// <summary>Number of active agents.</summary>
    public int ActiveAgents { get; init; }

    /// <summary>Current queue depth.</summary>
    public int QueueDepth { get; init; }

    /// <summary>Whether safe mode is enabled.</summary>
    public bool SafeModeEnabled { get; init; }

    /// <summary>Recent mode transitions (for stability analysis).</summary>
    public IReadOnlyList<SwarmMode> ModeHistory { get; init; } = [];
}

/// <summary>
/// Extended swarm policy decision with predictive flag (Phase 32 extension).
/// </summary>
public record SwarmPredictiveDecision
{
    /// <summary>County this decision applies to.</summary>
    public required string CountyId { get; init; }

    /// <summary>Whether this is a predictive (forecast-based) decision.</summary>
    public bool IsPredictive { get; init; }

    /// <summary>Recommended swarm action, if any.</summary>
    public SwarmActionKind? RecommendedAction { get; init; }

    /// <summary>Whether this decision was skipped due to cooldown.</summary>
    public bool IsSkippedDueToCooldown { get; init; }

    /// <summary>Reasoning for the decision.</summary>
    public string Reasoning { get; init; } = string.Empty;

    /// <summary>Confidence score (0.0 to 1.0).</summary>
    public double Confidence { get; init; } = 1.0;

    /// <summary>Timestamp when decision was made.</summary>
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// Configuration options for the Forecast Orchestrator background service.
/// </summary>
public class AtlasForecastOrchestratorOptions
{
    /// <summary>Configuration section name.</summary>
    public const string Section = "Atlas:ForecastOrchestrator";

    /// <summary>Interval in seconds between forecast computation cycles.</summary>
    public int IntervalSeconds { get; set; } = 30;

    /// <summary>Maximum age of forecasts before cleanup.</summary>
    public TimeSpan MaxForecastAge { get; set; } = TimeSpan.FromHours(1);

    /// <summary>Number of ticks between cleanup operations.</summary>
    public int CleanupIntervalTicks { get; set; } = 10;

    /// <summary>Hours to look back for anomaly data.</summary>
    public int AnomalyLookbackHours { get; set; } = 1;

    /// <summary>Whether the orchestrator is enabled.</summary>
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// Statistics for monitoring orchestrator health.
/// </summary>
public record AtlasForecastOrchestratorStatistics
{
    /// <summary>Total number of orchestrator runs.</summary>
    public long TotalRuns { get; init; }

    /// <summary>Total forecasts computed across all runs.</summary>
    public long TotalForecastsComputed { get; init; }

    /// <summary>Total errors encountered.</summary>
    public long TotalErrors { get; init; }

    /// <summary>Last successful run time.</summary>
    public DateTimeOffset LastRunTime { get; init; }

    /// <summary>Average time per forecast computation in milliseconds.</summary>
    public double AverageComputeTimeMs { get; init; }

    /// <summary>Total forecasts cleaned up.</summary>
    public long TotalForecastsCleaned { get; init; }
}

