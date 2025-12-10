// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30: SystemGPT Swarm Policy Service
// Deterministic rules that map Atlas telemetry to Swarm control actions
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 30: Swarm Policy Engine.
/// Evaluates Atlas telemetry and decides what Swarm actions to take.
/// Uses deterministic rules with hysteresis to prevent flapping.
/// </summary>
public class SystemGptSwarmPolicyService : ISystemGptSwarmPolicyService
{
    private readonly SwarmPolicyOptions _options;
    private readonly ILogger<SystemGptSwarmPolicyService> _logger;

    // Health state constants (matching Atlas classifier)
    private static class HealthStates
    {
        public const string Healthy = "healthy";
        public const string Warning = "warning";
        public const string Critical = "critical";
        public const string Offline = "offline";
    }

    // Low load thresholds for capacity reduction
    private const int LowActiveRequestsThreshold = 5;
    private const double LowLatencyThresholdMs = 100;
    private const int HighCapacityThreshold = 60;
    private const int MinHealthyIntervalsForDecreaseCapacity = 5;

    // Hysteresis window in seconds
    private const int HysteresisWindowSeconds = 60;

    public SystemGptSwarmPolicyService(
        IOptions<SwarmPolicyOptions> options,
        ILogger<SystemGptSwarmPolicyService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Evaluate policy and return recommended action.
    /// </summary>
    public SwarmPolicyDecision EvaluatePolicy(SwarmPolicyInput input)
    {
        _logger.LogDebug(
            "Evaluating policy for county {CountyId}: State={HealthState}, ErrorRate={ErrorRate}%, Latency={Latency}ms",
            input.CountyId, input.HealthState, input.ErrorRatePercent, input.P95LatencyMs);

        var currentState = input.CurrentSwarmState;

        // Priority 1: Handle offline state
        if (IsOffline(input))
        {
            return CreateDecision(input, SwarmActionKind.RouteToSafeModel,
                "County is offline - routing to safe model", 1.0);
        }

        // Priority 2: Critical error rate → EnableSafeMode (overrides hysteresis)
        if (ShouldEnableSafeMode(input))
        {
            return CreateDecision(input, SwarmActionKind.EnableSafeMode,
                $"Critical error rate ({input.ErrorRatePercent:F1}%) exceeds threshold ({_options.CriticalErrorRateThreshold}%)", 1.0);
        }

        // Priority 3: Already in SafeMode with critical latency → IncreaseCapacity
        if (IsInSafeMode(currentState) && ShouldIncreaseCapacityDueToCriticalLatency(input))
        {
            if (!IsAtMaxCapacity(currentState))
            {
                return CreateDecision(input, SwarmActionKind.IncreaseCapacity,
                    $"SafeMode active with high latency ({input.P95LatencyMs}ms) - increasing capacity", 0.9);
            }
        }

        // Priority 4: Critical latency (not in SafeMode) → IncreaseCapacity (with hysteresis)
        if (!IsInSafeMode(currentState) && ShouldIncreaseCapacityDueToCriticalLatency(input))
        {
            if (!IsAtMaxCapacity(currentState) && HysteresisAllowsCapacityChange(currentState))
            {
                return CreateDecision(input, SwarmActionKind.IncreaseCapacity,
                    $"Critical latency ({input.P95LatencyMs}ms) exceeds threshold ({_options.CriticalLatencyThresholdMs}ms)", 0.95);
            }
        }

        // Priority 5: Warning with latency alert → ThrottleRequests
        if (IsWarningWithLatencyAlert(input) && !IsThrottled(currentState))
        {
            return CreateDecision(input, SwarmActionKind.ThrottleRequests,
                "Warning state with latency alert - enabling throttle", 0.8);
        }

        // Priority 6: Recovery - Healthy for N intervals → DisableSafeMode
        if (IsInSafeMode(currentState) && ShouldRecoverFromSafeMode(currentState))
        {
            return CreateDecision(input, SwarmActionKind.DisableSafeMode,
                $"System recovered - healthy for {currentState?.HealthyIntervalCount ?? 0} intervals", 0.95);
        }

        // Priority 7: Recovery - Healthy for N intervals + throttled → RelaxThrottle
        if (IsThrottled(currentState) && ShouldRelaxThrottle(currentState))
        {
            return CreateDecision(input, SwarmActionKind.RelaxThrottle,
                $"System stable - relaxing throttle after {currentState?.HealthyIntervalCount ?? 0} healthy intervals", 0.9);
        }

        // Priority 8: Low load with high capacity → DecreaseCapacity
        if (ShouldDecreaseCapacity(input, currentState))
        {
            return CreateDecision(input, SwarmActionKind.DecreaseCapacity,
                "Low load detected - decreasing capacity to conserve resources", 0.85);
        }

        // Default: No action needed
        var reason = GetNoActionReason(input, currentState);
        return CreateDecision(input, SwarmActionKind.None, reason, 1.0);
    }

    #region Decision Helpers

    private bool IsOffline(SwarmPolicyInput input)
    {
        return string.Equals(input.HealthState, HealthStates.Offline, StringComparison.OrdinalIgnoreCase);
    }

    private bool ShouldEnableSafeMode(SwarmPolicyInput input)
    {
        // Don't enable if already in SafeMode
        if (IsInSafeMode(input.CurrentSwarmState))
            return false;

        // Enable if error rate exceeds threshold
        return input.ErrorRatePercent > _options.CriticalErrorRateThreshold;
    }

    private bool ShouldIncreaseCapacityDueToCriticalLatency(SwarmPolicyInput input)
    {
        return input.P95LatencyMs > _options.CriticalLatencyThresholdMs;
    }

    private bool IsWarningWithLatencyAlert(SwarmPolicyInput input)
    {
        if (!string.Equals(input.HealthState, HealthStates.Warning, StringComparison.OrdinalIgnoreCase))
            return false;

        return input.ActiveAlerts.Any(a =>
            a.Contains("Latency", StringComparison.OrdinalIgnoreCase));
    }

    private bool ShouldRecoverFromSafeMode(SwarmStateSnapshot? state)
    {
        if (state == null) return false;
        return state.HealthyIntervalCount >= _options.HealthyIntervalsForRecovery;
    }

    private bool ShouldRelaxThrottle(SwarmStateSnapshot? state)
    {
        if (state == null) return false;
        return state.HealthyIntervalCount >= _options.HealthyIntervalsForRecovery;
    }

    private bool ShouldDecreaseCapacity(SwarmPolicyInput input, SwarmStateSnapshot? state)
    {
        if (state == null) return false;

        // Don't decrease if in degraded mode
        if (state.SafeModeEnabled || state.ThrottleEnabled)
            return false;

        // Don't decrease if already at minimum
        if (state.CurrentCapacity <= state.MinCapacity)
            return false;

        // Only decrease if significantly over-provisioned for low load
        if (state.CurrentCapacity <= HighCapacityThreshold)
            return false;

        // Must have sustained healthy state
        if (state.HealthyIntervalCount < MinHealthyIntervalsForDecreaseCapacity)
            return false;

        // Check for low load indicators
        var isLowLoad = input.ActiveRequests <= LowActiveRequestsThreshold
                     && input.P95LatencyMs <= LowLatencyThresholdMs;

        return isLowLoad;
    }

    private bool IsInSafeMode(SwarmStateSnapshot? state)
    {
        return state?.SafeModeEnabled ?? false;
    }

    private bool IsThrottled(SwarmStateSnapshot? state)
    {
        return state?.ThrottleEnabled ?? false;
    }

    private bool IsAtMaxCapacity(SwarmStateSnapshot? state)
    {
        if (state == null) return false;
        return state.CurrentCapacity >= state.MaxCapacity;
    }

    private bool HysteresisAllowsCapacityChange(SwarmStateSnapshot? state)
    {
        if (state == null) return true;

        // If last action was not a capacity change, allow
        if (state.LastAction != SwarmActionKind.IncreaseCapacity
            && state.LastAction != SwarmActionKind.DecreaseCapacity)
        {
            return true;
        }

        // Check if enough time has passed since last capacity change
        var elapsed = DateTimeOffset.UtcNow - state.LastActionTimestamp;
        return elapsed.TotalSeconds >= HysteresisWindowSeconds;
    }

    private string GetNoActionReason(SwarmPolicyInput input, SwarmStateSnapshot? state)
    {
        if (string.Equals(input.HealthState, HealthStates.Healthy, StringComparison.OrdinalIgnoreCase))
        {
            if (state != null && (state.SafeModeEnabled || state.ThrottleEnabled))
            {
                return $"Healthy but waiting for stable recovery ({state.HealthyIntervalCount}/{_options.HealthyIntervalsForRecovery} intervals)";
            }
            return "System healthy - no action required";
        }

        if (string.Equals(input.HealthState, HealthStates.Warning, StringComparison.OrdinalIgnoreCase))
        {
            return "Warning state - monitoring (no critical thresholds breached)";
        }

        if (string.Equals(input.HealthState, HealthStates.Critical, StringComparison.OrdinalIgnoreCase))
        {
            if (state != null && IsAtMaxCapacity(state))
            {
                return "Critical but at maximum capacity - no further scaling possible";
            }
            if (state != null && !HysteresisAllowsCapacityChange(state))
            {
                return "Critical but in hysteresis window - waiting before next capacity change";
            }
        }

        return "No action required at this time";
    }

    private SwarmPolicyDecision CreateDecision(
        SwarmPolicyInput input,
        SwarmActionKind action,
        string reason,
        double confidence)
    {
        _logger.LogInformation(
            "Policy decision for {CountyId}: Action={Action}, Reason={Reason}",
            input.CountyId, action, reason);

        return new SwarmPolicyDecision
        {
            CountyId = input.CountyId,
            Action = action,
            Reason = reason,
            Confidence = confidence,
            Timestamp = DateTimeOffset.UtcNow,
            InputMetrics = input
        };
    }

    #endregion
}

/// <summary>
/// Interface for Swarm Policy Service.
/// </summary>
public interface ISystemGptSwarmPolicyService
{
    SwarmPolicyDecision EvaluatePolicy(SwarmPolicyInput input);
}
