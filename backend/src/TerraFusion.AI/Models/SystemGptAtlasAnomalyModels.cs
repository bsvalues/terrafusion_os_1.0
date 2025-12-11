// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 PHASE 31: SystemGPT Atlas Anomaly Models
// Defines enums and DTOs for anomaly detection system
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models;

/// <summary>
/// Identifies the category of anomaly detected in Atlas telemetry.
/// </summary>
public enum AtlasAnomalyKind
{
    /// <summary>
    /// P95 latency exceeds threshold multiplier of historical median.
    /// </summary>
    LatencySpike,

    /// <summary>
    /// Error rate exceeds threshold multiplier AND absolute threshold.
    /// </summary>
    ErrorSpike,

    /// <summary>
    /// Guardrail triggered in N of last M intervals.
    /// </summary>
    GuardrailBurst,

    /// <summary>
    /// Swarm mode changed too frequently (capacity flapping).
    /// </summary>
    CapacityFlap,

    /// <summary>
    /// County health state reported offline for N consecutive intervals.
    /// </summary>
    OfflinePattern
}

/// <summary>
/// Severity classification for anomaly events.
/// </summary>
public enum AtlasAnomalySeverity
{
    /// <summary>
    /// Informational anomaly, no immediate action required.
    /// </summary>
    Info = 0,

    /// <summary>
    /// Warning-level anomaly, may require attention.
    /// </summary>
    Warning = 1,

    /// <summary>
    /// Critical anomaly, immediate attention recommended.
    /// </summary>
    Critical = 2
}

/// <summary>
/// Represents a single detected anomaly event in Atlas telemetry.
/// </summary>
public record SystemGptAtlasAnomalyEventDto
{
    /// <summary>
    /// Unique identifier for this anomaly event.
    /// </summary>
    public required Guid Id { get; init; }

    /// <summary>
    /// The county where the anomaly was detected.
    /// </summary>
    public required string CountyId { get; init; }

    /// <summary>
    /// The type of anomaly detected.
    /// </summary>
    public required AtlasAnomalyKind Kind { get; init; }

    /// <summary>
    /// Severity classification of the anomaly.
    /// </summary>
    public required AtlasAnomalySeverity Severity { get; init; }

    /// <summary>
    /// When the anomaly was detected.
    /// </summary>
    public required DateTimeOffset Timestamp { get; init; }

    /// <summary>
    /// Human-readable explanation of why the anomaly was detected.
    /// </summary>
    public required string Reason { get; init; }

    /// <summary>
    /// The actual metric value that triggered the anomaly.
    /// </summary>
    public double MetricValue { get; init; }

    /// <summary>
    /// The threshold value that was exceeded.
    /// </summary>
    public double ThresholdValue { get; init; }

    /// <summary>
    /// Optional additional context about the anomaly.
    /// </summary>
    public Dictionary<string, object>? Context { get; init; }
}

/// <summary>
/// Summary statistics for anomalies grouped by county.
/// </summary>
public record SystemGptAtlasAnomalySummaryDto
{
    /// <summary>
    /// The county identifier.
    /// </summary>
    public required string CountyId { get; init; }

    /// <summary>
    /// Total count of anomalies.
    /// </summary>
    public required int TotalCount { get; init; }

    /// <summary>
    /// Count of Info-severity anomalies.
    /// </summary>
    public required int InfoCount { get; init; }

    /// <summary>
    /// Count of Warning-severity anomalies.
    /// </summary>
    public required int WarningCount { get; init; }

    /// <summary>
    /// Count of Critical-severity anomalies.
    /// </summary>
    public required int CriticalCount { get; init; }

    /// <summary>
    /// Timestamp of the most recent anomaly, if any.
    /// </summary>
    public DateTimeOffset? LatestTimestamp { get; init; }

    /// <summary>
    /// The most recent anomaly kind, if any.
    /// </summary>
    public AtlasAnomalyKind? LatestKind { get; init; }
}

/// <summary>
/// Configuration options for anomaly detection thresholds.
/// </summary>
public class AtlasAnomalyDetectionOptions
{
    /// <summary>
    /// Multiplier for latency spike detection (current > median * multiplier).
    /// Default: 2.0 (P95 > 2× median triggers spike).
    /// </summary>
    public double LatencySpikeMultiplier { get; set; } = 2.0;

    /// <summary>
    /// Multiplier for error spike detection (current > median * multiplier).
    /// Default: 3.0 (error rate > 3× median).
    /// </summary>
    public double ErrorSpikeMultiplier { get; set; } = 3.0;

    /// <summary>
    /// Absolute threshold for error spike (percentage).
    /// Default: 5.0 (5% error rate minimum to trigger).
    /// </summary>
    public double ErrorSpikeAbsoluteThreshold { get; set; } = 5.0;

    /// <summary>
    /// Number of guardrail triggers in recent window to flag burst.
    /// Default: 3 (3 of last 5 intervals).
    /// </summary>
    public int GuardrailBurstCount { get; set; } = 3;

    /// <summary>
    /// Window size for guardrail burst detection.
    /// Default: 5 intervals.
    /// </summary>
    public int GuardrailBurstWindow { get; set; } = 5;

    /// <summary>
    /// Number of mode changes to flag capacity flapping.
    /// Default: 3 mode changes in window.
    /// </summary>
    public int CapacityFlapCount { get; set; } = 3;

    /// <summary>
    /// Number of consecutive offline intervals to flag offline pattern.
    /// Default: 3 consecutive offline readings.
    /// </summary>
    public int OfflineConsecutiveCount { get; set; } = 3;

    /// <summary>
    /// Size of history window for median calculations.
    /// Default: 10 intervals.
    /// </summary>
    public int HistoryWindowSize { get; set; } = 10;

    /// <summary>
    /// How long to retain anomaly events in the store.
    /// Default: 24 hours.
    /// </summary>
    public TimeSpan RetentionPeriod { get; set; } = TimeSpan.FromHours(24);
}

/// <summary>
/// Input snapshot for anomaly detection analysis.
/// Contains current metrics and historical data for comparison.
/// </summary>
public record AtlasAnomalyDetectionInput
{
    /// <summary>
    /// County identifier being analyzed.
    /// </summary>
    public required string CountyId { get; init; }

    /// <summary>
    /// Current P95 latency in milliseconds.
    /// </summary>
    public required double CurrentLatencyP95 { get; init; }

    /// <summary>
    /// Historical P95 latency values for median calculation.
    /// </summary>
    public required IList<double> LatencyHistory { get; init; }

    /// <summary>
    /// Current error rate as percentage (0-100).
    /// </summary>
    public required double CurrentErrorRate { get; init; }

    /// <summary>
    /// Historical error rate values for median calculation.
    /// </summary>
    public required IList<double> ErrorRateHistory { get; init; }

    /// <summary>
    /// Recent guardrail triggered flags (true = triggered).
    /// </summary>
    public required IList<bool> GuardrailHistory { get; init; }

    /// <summary>
    /// Recent swarm mode values for flap detection.
    /// </summary>
    public required IList<string> SwarmModeHistory { get; init; }

    /// <summary>
    /// Recent health states for offline detection.
    /// </summary>
    public required IList<string> HealthStateHistory { get; init; }
}
