// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29: SystemGPT Atlas Health Classifier
// Transforms raw metrics into health states and alerts
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Options;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 29: Classifies raw metrics into HealthState and generates ActiveAlerts.
/// Uses configurable thresholds via IOptions pattern.
/// </summary>
public sealed class SystemGptAtlasClassifier
{
    private readonly SystemGptAtlasThresholds _thresholds;

    public SystemGptAtlasClassifier(SystemGptAtlasThresholds thresholds)
    {
        _thresholds = thresholds ?? throw new ArgumentNullException(nameof(thresholds));
    }

    public SystemGptAtlasClassifier(IOptions<SystemGptAtlasThresholds> options)
        : this(options?.Value ?? throw new ArgumentNullException(nameof(options)))
    {
    }

    /// <summary>
    /// Classifies metrics into a health state and generates appropriate alerts.
    /// </summary>
    /// <param name="healthScore">Overall health score (0.0 to 1.0)</param>
    /// <param name="errorRatePercent">Error rate as percentage</param>
    /// <param name="p95Ms">P95 latency in milliseconds</param>
    /// <returns>Classification result with state and alerts</returns>
    public ClassificationResult Classify(double healthScore, double errorRatePercent, double p95Ms)
    {
        var alerts = new List<string>();
        var state = DetermineHealthState(healthScore, errorRatePercent, p95Ms, alerts);

        return new ClassificationResult
        {
            HealthState = state,
            ActiveAlerts = alerts.AsReadOnly()
        };
    }

    /// <summary>
    /// Classifies raw county metrics into a health state and generates appropriate alerts.
    /// </summary>
    public ClassificationResult Classify(RawCountyMetrics metrics)
    {
        if (metrics == null) throw new ArgumentNullException(nameof(metrics));
        
        return Classify(
            healthScore: metrics.HealthScore,
            errorRatePercent: metrics.ErrorRatePercent,
            p95Ms: metrics.P95LatencyMs
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Implementation
    // ─────────────────────────────────────────────────────────────────────────

    private string DetermineHealthState(
        double healthScore, 
        double errorRatePercent, 
        double p95Ms, 
        List<string> alerts)
    {
        // Special case: Offline detection (score <= 0 or negative)
        if (healthScore <= 0)
        {
            alerts.Add("System offline: No health score reported");
            return HealthStates.Offline;
        }

        // Evaluate each metric independently for alerts
        var healthScoreState = ClassifyHealthScore(healthScore, alerts);
        var errorRateState = ClassifyErrorRate(errorRatePercent, alerts);
        var latencyState = ClassifyLatency(p95Ms, alerts);

        // Return the worst state (Critical > Warning > Healthy)
        return GetWorstState(healthScoreState, errorRateState, latencyState);
    }

    private string ClassifyHealthScore(double healthScore, List<string> alerts)
    {
        if (healthScore <= _thresholds.CriticalHealthScore)
        {
            alerts.Add($"Critical health score: {healthScore:P0} (threshold: {_thresholds.CriticalHealthScore:P0})");
            return HealthStates.Critical;
        }

        if (healthScore <= _thresholds.WarningHealthScore)
        {
            alerts.Add($"Low health score: {healthScore:P0} (threshold: {_thresholds.WarningHealthScore:P0})");
            return HealthStates.Warning;
        }

        return HealthStates.Healthy;
    }

    private string ClassifyErrorRate(double errorRatePercent, List<string> alerts)
    {
        if (errorRatePercent >= _thresholds.CriticalErrorRatePercent)
        {
            alerts.Add($"Critical error rate: {errorRatePercent:F1}% (threshold: {_thresholds.CriticalErrorRatePercent:F1}%)");
            return HealthStates.Critical;
        }

        if (errorRatePercent >= _thresholds.WarningErrorRatePercent)
        {
            alerts.Add($"Elevated error rate: {errorRatePercent:F1}% (threshold: {_thresholds.WarningErrorRatePercent:F1}%)");
            return HealthStates.Warning;
        }

        return HealthStates.Healthy;
    }

    private string ClassifyLatency(double p95Ms, List<string> alerts)
    {
        if (p95Ms >= _thresholds.CriticalP95Ms)
        {
            alerts.Add($"Critical latency: {p95Ms:F0}ms (threshold: {_thresholds.CriticalP95Ms:F0}ms)");
            return HealthStates.Critical;
        }

        if (p95Ms >= _thresholds.WarningP95Ms)
        {
            alerts.Add($"High latency: {p95Ms:F0}ms (threshold: {_thresholds.WarningP95Ms:F0}ms)");
            return HealthStates.Warning;
        }

        return HealthStates.Healthy;
    }

    private static string GetWorstState(params string[] states)
    {
        // Priority order: Offline > Critical > Warning > Healthy
        if (states.Contains(HealthStates.Offline)) return HealthStates.Offline;
        if (states.Contains(HealthStates.Critical)) return HealthStates.Critical;
        if (states.Contains(HealthStates.Warning)) return HealthStates.Warning;
        return HealthStates.Healthy;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Standard health state string values for consistency.
    /// </summary>
    public static class HealthStates
    {
        public const string Healthy = "healthy";
        public const string Warning = "warning";
        public const string Critical = "critical";
        public const string Offline = "offline";
    }
}
