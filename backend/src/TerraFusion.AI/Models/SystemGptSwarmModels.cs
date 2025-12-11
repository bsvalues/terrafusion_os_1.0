// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30: SystemGPT Atlas → AI Swarm Bridge Models
// Transforms Atlas telemetry into active Swarm control actions
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models;

/// <summary>
/// Phase 30: Enumeration of possible Swarm control actions.
/// Each action maps to a specific AI Swarm control-plane operation.
/// </summary>
public enum SwarmActionKind
{
    /// <summary>No action required - system is operating normally.</summary>
    None = 0,

    /// <summary>Increase processing capacity (scale up agents/workers).</summary>
    IncreaseCapacity,

    /// <summary>Decrease processing capacity (scale down to conserve resources).</summary>
    DecreaseCapacity,

    /// <summary>Route requests to safe/fallback model.</summary>
    RouteToSafeModel,

    /// <summary>Enable safe mode for this county.</summary>
    EnableSafeMode,

    /// <summary>Disable safe mode and return to normal operation.</summary>
    DisableSafeMode,

    /// <summary>Throttle incoming requests to prevent overload.</summary>
    ThrottleRequests,

    /// <summary>Relax throttling and allow normal request flow.</summary>
    RelaxThrottle
}

/// <summary>
/// Phase 30: Operating mode of the Swarm for a county.
/// </summary>
public enum SwarmMode
{
    /// <summary>Normal operation - all features enabled.</summary>
    Normal = 0,

    /// <summary>Safe mode - limited features, fallback model.</summary>
    SafeMode,

    /// <summary>Throttled - rate limiting in effect.</summary>
    Throttled,

    /// <summary>Offline - Swarm not responding.</summary>
    Offline
}

/// <summary>
/// Phase 30: Decision from the Swarm Policy Engine.
/// Contains the recommended action based on telemetry analysis.
/// </summary>
public sealed record SwarmPolicyDecision
{
    /// <summary>The county this decision applies to.</summary>
    public required string CountyId { get; init; }

    /// <summary>The recommended action to take.</summary>
    public required SwarmActionKind Action { get; init; }

    /// <summary>Human-readable reason for this decision.</summary>
    public required string Reason { get; init; }

    /// <summary>Confidence level (0.0 to 1.0) in this decision.</summary>
    public double Confidence { get; init; } = 1.0;

    /// <summary>When this decision was made.</summary>
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Input metrics that triggered this decision.</summary>
    public SwarmPolicyInput? InputMetrics { get; init; }
}

/// <summary>
/// Phase 30: Input metrics for policy evaluation.
/// Aggregated from Atlas telemetry.
/// </summary>
public sealed record SwarmPolicyInput
{
    /// <summary>County identifier.</summary>
    public required string CountyId { get; init; }

    /// <summary>Current health score (0.0 to 1.0).</summary>
    public double HealthScore { get; init; }

    /// <summary>Classified health state from Atlas.</summary>
    public required string HealthState { get; init; }

    /// <summary>Current error rate percentage.</summary>
    public double ErrorRatePercent { get; init; }

    /// <summary>P95 latency in milliseconds.</summary>
    public double P95LatencyMs { get; init; }

    /// <summary>Number of active requests.</summary>
    public int ActiveRequests { get; init; }

    /// <summary>Whether guardrail was recently triggered.</summary>
    public bool GuardrailTriggered { get; init; }

    /// <summary>Current active alerts from Atlas.</summary>
    public IReadOnlyList<string> ActiveAlerts { get; init; } = Array.Empty<string>();

    /// <summary>Current Swarm state for hysteresis decisions.</summary>
    public SwarmStateSnapshot? CurrentSwarmState { get; init; }
}

/// <summary>
/// Phase 30: Result of executing a Swarm action via the bridge.
/// </summary>
public sealed record SwarmActionResult
{
    /// <summary>Whether the action was executed successfully.</summary>
    public required bool Success { get; init; }

    /// <summary>The action that was executed.</summary>
    public required SwarmActionKind Action { get; init; }

    /// <summary>County affected by this action.</summary>
    public required string CountyId { get; init; }

    /// <summary>When the action was executed.</summary>
    public DateTimeOffset ExecutedAt { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Response message from Swarm (if any).</summary>
    public string? ResponseMessage { get; init; }

    /// <summary>Failure reason (if Success=false).</summary>
    public string? FailureReason { get; init; }

    /// <summary>Time taken to execute in milliseconds.</summary>
    public double ExecutionTimeMs { get; init; }
}

/// <summary>
/// Phase 30: Snapshot of Swarm state for a county.
/// Stored and updated by SwarmStateStore, consumed by Atlas UI.
/// </summary>
public sealed record SwarmStateSnapshot
{
    /// <summary>County identifier.</summary>
    public required string CountyId { get; init; }

    /// <summary>Current operating mode.</summary>
    public SwarmMode Mode { get; init; } = SwarmMode.Normal;

    /// <summary>Whether safe mode is currently enabled.</summary>
    public bool SafeModeEnabled { get; init; }

    /// <summary>Whether throttling is currently enabled.</summary>
    public bool ThrottleEnabled { get; init; }

    /// <summary>Current capacity allocation (1-100 scale).</summary>
    public int CurrentCapacity { get; init; } = 50;

    /// <summary>Maximum capacity allowed.</summary>
    public int MaxCapacity { get; init; } = 100;

    /// <summary>Minimum capacity allowed.</summary>
    public int MinCapacity { get; init; } = 10;

    /// <summary>Last action taken by Swarm.</summary>
    public SwarmActionKind LastAction { get; init; } = SwarmActionKind.None;

    /// <summary>Timestamp of last action.</summary>
    public DateTimeOffset LastActionTimestamp { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Reason for last action.</summary>
    public string? LastActionReason { get; init; }

    /// <summary>When this snapshot was last updated.</summary>
    public DateTimeOffset UpdatedAt { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Number of consecutive healthy intervals.</summary>
    public int HealthyIntervalCount { get; init; }

    /// <summary>Number of consecutive critical intervals.</summary>
    public int CriticalIntervalCount { get; init; }
}

/// <summary>
/// Phase 30: Configuration options for Swarm Policy evaluation.
/// Extended in Phase 32 with predictive action settings.
/// </summary>
public sealed class SwarmPolicyOptions
{
    /// <summary>Configuration section name for appsettings binding.</summary>
    public const string SectionName = "SystemGptSwarm:Policy";

    /// <summary>Error rate threshold that triggers SafeMode.</summary>
    public double CriticalErrorRateThreshold { get; init; } = 5.0;

    /// <summary>P95 latency threshold that triggers IncreaseCapacity.</summary>
    public double CriticalLatencyThresholdMs { get; init; } = 1000;

    /// <summary>Health score threshold for critical state.</summary>
    public double CriticalHealthScoreThreshold { get; init; } = 0.60;

    /// <summary>Number of healthy intervals before disabling SafeMode.</summary>
    public int HealthyIntervalsForRecovery { get; init; } = 3;

    /// <summary>Capacity increment/decrement step.</summary>
    public int CapacityStep { get; init; } = 10;

    /// <summary>Minimum intervals between capacity changes (hysteresis).</summary>
    public int CapacityChangeHysteresisIntervals { get; init; } = 2;

    // ═══════════════════════════════════════════════════════════════════════════════
    // Phase 32: Predictive Action Settings
    // ═══════════════════════════════════════════════════════════════════════════════

    /// <summary>Whether predictive actions based on forecasts are enabled.</summary>
    public bool PredictiveActionsEnabled { get; init; } = true;

    /// <summary>Cooldown in minutes between predictive actions for the same county.</summary>
    public int PredictiveCooldownMinutes { get; init; } = 5;
}

/// <summary>
/// Phase 30: DTO for API response containing all county Swarm states.
/// </summary>
public sealed record SwarmStateResponseDto
{
    /// <summary>Schema version for forward compatibility.</summary>
    public string Version { get; init; } = "1.0";

    /// <summary>When this response was generated.</summary>
    public DateTimeOffset GeneratedAt { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Swarm state for all counties.</summary>
    public IReadOnlyList<SwarmStateSnapshot> Counties { get; init; } = Array.Empty<SwarmStateSnapshot>();
}
