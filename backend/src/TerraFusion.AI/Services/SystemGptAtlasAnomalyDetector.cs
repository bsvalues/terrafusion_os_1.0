// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 PHASE 31: SystemGPT Atlas Anomaly Detector Service
// Analyzes telemetry snapshots and detects anomalies using configurable thresholds
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Interface for anomaly detection on Atlas telemetry data.
/// </summary>
public interface ISystemGptAtlasAnomalyDetector
{
    /// <summary>
    /// Analyzes input metrics and returns any detected anomalies.
    /// </summary>
    /// <param name="input">Snapshot containing current and historical metrics.</param>
    /// <returns>List of detected anomalies (may be empty).</returns>
    IList<SystemGptAtlasAnomalyEventDto> DetectAnomalies(AtlasAnomalyDetectionInput input);
}

/// <summary>
/// Detects anomalies in Atlas telemetry using statistical thresholds.
/// </summary>
public class SystemGptAtlasAnomalyDetector : ISystemGptAtlasAnomalyDetector
{
    private readonly ILogger<SystemGptAtlasAnomalyDetector> _logger;
    private readonly AtlasAnomalyDetectionOptions _options;

    public SystemGptAtlasAnomalyDetector(
        ILogger<SystemGptAtlasAnomalyDetector> logger,
        IOptions<AtlasAnomalyDetectionOptions> options)
    {
        _logger = logger;
        _options = options.Value;
    }

    /// <inheritdoc />
    public IList<SystemGptAtlasAnomalyEventDto> DetectAnomalies(AtlasAnomalyDetectionInput input)
    {
        var anomalies = new List<SystemGptAtlasAnomalyEventDto>();
        var timestamp = DateTimeOffset.UtcNow;

        // Check for latency spike
        var latencyAnomaly = DetectLatencySpike(input, timestamp);
        if (latencyAnomaly != null)
            anomalies.Add(latencyAnomaly);

        // Check for error spike
        var errorAnomaly = DetectErrorSpike(input, timestamp);
        if (errorAnomaly != null)
            anomalies.Add(errorAnomaly);

        // Check for guardrail burst
        var guardrailAnomaly = DetectGuardrailBurst(input, timestamp);
        if (guardrailAnomaly != null)
            anomalies.Add(guardrailAnomaly);

        // Check for capacity flap
        var capacityAnomaly = DetectCapacityFlap(input, timestamp);
        if (capacityAnomaly != null)
            anomalies.Add(capacityAnomaly);

        // Check for offline pattern
        var offlineAnomaly = DetectOfflinePattern(input, timestamp);
        if (offlineAnomaly != null)
            anomalies.Add(offlineAnomaly);

        if (anomalies.Count > 0)
        {
            _logger.LogInformation(
                "Detected {Count} anomalies for county {CountyId}: {Kinds}",
                anomalies.Count,
                input.CountyId,
                string.Join(", ", anomalies.Select(a => a.Kind)));
        }

        return anomalies;
    }

    /// <summary>
    /// Detects latency spike: P95 > threshold multiplier × median of history.
    /// </summary>
    private SystemGptAtlasAnomalyEventDto? DetectLatencySpike(
        AtlasAnomalyDetectionInput input,
        DateTimeOffset timestamp)
    {
        if (input.LatencyHistory.Count == 0)
            return null;

        var medianLatency = CalculateMedian(input.LatencyHistory);
        var threshold = medianLatency * _options.LatencySpikeMultiplier;

        if (input.CurrentLatencyP95 > threshold)
        {
            var severity = ClassifyLatencySpikeSeverity(input.CurrentLatencyP95, medianLatency);

            return new SystemGptAtlasAnomalyEventDto
            {
                Id = Guid.NewGuid(),
                CountyId = input.CountyId,
                Kind = AtlasAnomalyKind.LatencySpike,
                Severity = severity,
                Timestamp = timestamp,
                Reason = $"P95 latency {input.CurrentLatencyP95:F1}ms exceeds {_options.LatencySpikeMultiplier}× median ({medianLatency:F1}ms)",
                MetricValue = input.CurrentLatencyP95,
                ThresholdValue = threshold,
                Context = new Dictionary<string, object>
                {
                    ["medianLatency"] = medianLatency,
                    ["multiplier"] = _options.LatencySpikeMultiplier
                }
            };
        }

        return null;
    }

    /// <summary>
    /// Detects error spike: error rate > threshold multiplier × median AND > absolute threshold.
    /// </summary>
    private SystemGptAtlasAnomalyEventDto? DetectErrorSpike(
        AtlasAnomalyDetectionInput input,
        DateTimeOffset timestamp)
    {
        // Must exceed absolute threshold first
        if (input.CurrentErrorRate <= _options.ErrorSpikeAbsoluteThreshold)
            return null;

        if (input.ErrorRateHistory.Count == 0)
            return null;

        var medianErrorRate = CalculateMedian(input.ErrorRateHistory);
        var threshold = Math.Max(
            medianErrorRate * _options.ErrorSpikeMultiplier,
            _options.ErrorSpikeAbsoluteThreshold);

        if (input.CurrentErrorRate > threshold)
        {
            var severity = ClassifyErrorSpikeSeverity(input.CurrentErrorRate);

            return new SystemGptAtlasAnomalyEventDto
            {
                Id = Guid.NewGuid(),
                CountyId = input.CountyId,
                Kind = AtlasAnomalyKind.ErrorSpike,
                Severity = severity,
                Timestamp = timestamp,
                Reason = $"Error rate {input.CurrentErrorRate:F1}% exceeds {_options.ErrorSpikeMultiplier}× median ({medianErrorRate:F1}%) and absolute threshold ({_options.ErrorSpikeAbsoluteThreshold}%)",
                MetricValue = input.CurrentErrorRate,
                ThresholdValue = threshold,
                Context = new Dictionary<string, object>
                {
                    ["medianErrorRate"] = medianErrorRate,
                    ["multiplier"] = _options.ErrorSpikeMultiplier,
                    ["absoluteThreshold"] = _options.ErrorSpikeAbsoluteThreshold
                }
            };
        }

        return null;
    }

    /// <summary>
    /// Detects guardrail burst: guardrail triggered in N of last M intervals.
    /// </summary>
    private SystemGptAtlasAnomalyEventDto? DetectGuardrailBurst(
        AtlasAnomalyDetectionInput input,
        DateTimeOffset timestamp)
    {
        var recentGuardrails = input.GuardrailHistory
            .TakeLast(_options.GuardrailBurstWindow)
            .ToList();

        if (recentGuardrails.Count == 0)
            return null;

        var triggeredCount = recentGuardrails.Count(g => g);

        if (triggeredCount >= _options.GuardrailBurstCount)
        {
            return new SystemGptAtlasAnomalyEventDto
            {
                Id = Guid.NewGuid(),
                CountyId = input.CountyId,
                Kind = AtlasAnomalyKind.GuardrailBurst,
                Severity = AtlasAnomalySeverity.Warning,
                Timestamp = timestamp,
                Reason = $"Guardrail triggered {triggeredCount} times in last {recentGuardrails.Count} intervals (threshold: {_options.GuardrailBurstCount})",
                MetricValue = triggeredCount,
                ThresholdValue = _options.GuardrailBurstCount,
                Context = new Dictionary<string, object>
                {
                    ["windowSize"] = recentGuardrails.Count,
                    ["triggeredCount"] = triggeredCount
                }
            };
        }

        return null;
    }

    /// <summary>
    /// Detects capacity flap: swarm mode changes >= threshold in window.
    /// </summary>
    private SystemGptAtlasAnomalyEventDto? DetectCapacityFlap(
        AtlasAnomalyDetectionInput input,
        DateTimeOffset timestamp)
    {
        if (input.SwarmModeHistory.Count < 2)
            return null;

        var modeChanges = CountModeChanges(input.SwarmModeHistory);

        if (modeChanges >= _options.CapacityFlapCount)
        {
            return new SystemGptAtlasAnomalyEventDto
            {
                Id = Guid.NewGuid(),
                CountyId = input.CountyId,
                Kind = AtlasAnomalyKind.CapacityFlap,
                Severity = AtlasAnomalySeverity.Warning,
                Timestamp = timestamp,
                Reason = $"Swarm mode changed {modeChanges} times (threshold: {_options.CapacityFlapCount}), indicating capacity instability",
                MetricValue = modeChanges,
                ThresholdValue = _options.CapacityFlapCount,
                Context = new Dictionary<string, object>
                {
                    ["modes"] = input.SwarmModeHistory.ToArray()
                }
            };
        }

        return null;
    }

    /// <summary>
    /// Detects offline pattern: health state == "offline" for N consecutive intervals.
    /// </summary>
    private SystemGptAtlasAnomalyEventDto? DetectOfflinePattern(
        AtlasAnomalyDetectionInput input,
        DateTimeOffset timestamp)
    {
        if (input.HealthStateHistory.Count == 0)
            return null;

        var consecutiveOffline = CountConsecutiveOffline(input.HealthStateHistory);

        if (consecutiveOffline >= _options.OfflineConsecutiveCount)
        {
            return new SystemGptAtlasAnomalyEventDto
            {
                Id = Guid.NewGuid(),
                CountyId = input.CountyId,
                Kind = AtlasAnomalyKind.OfflinePattern,
                Severity = AtlasAnomalySeverity.Critical,
                Timestamp = timestamp,
                Reason = $"County offline for {consecutiveOffline} consecutive intervals (threshold: {_options.OfflineConsecutiveCount})",
                MetricValue = consecutiveOffline,
                ThresholdValue = _options.OfflineConsecutiveCount,
                Context = new Dictionary<string, object>
                {
                    ["consecutiveOffline"] = consecutiveOffline
                }
            };
        }

        return null;
    }

    #region Helper Methods

    private static double CalculateMedian(IList<double> values)
    {
        if (values.Count == 0)
            return 0;

        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;

        if (sorted.Count % 2 == 0)
            return (sorted[mid - 1] + sorted[mid]) / 2.0;

        return sorted[mid];
    }

    private static int CountModeChanges(IList<string> modes)
    {
        var changes = 0;
        for (int i = 1; i < modes.Count; i++)
        {
            if (!string.Equals(modes[i], modes[i - 1], StringComparison.OrdinalIgnoreCase))
                changes++;
        }
        return changes;
    }

    private static int CountConsecutiveOffline(IList<string> states)
    {
        var count = 0;
        // Check from the end (most recent)
        for (int i = states.Count - 1; i >= 0; i--)
        {
            if (string.Equals(states[i], "offline", StringComparison.OrdinalIgnoreCase))
                count++;
            else
                break;
        }
        return count;
    }

    private AtlasAnomalySeverity ClassifyLatencySpikeSeverity(double current, double median)
    {
        // Classify based on multiple of median:
        // >5× median = Critical, >3× = Warning, else Info (but at least above 2× since it passed detection)
        var ratio = current / median;
        if (ratio > 5.0)
            return AtlasAnomalySeverity.Critical;
        if (ratio > 3.0)
            return AtlasAnomalySeverity.Warning;
        return AtlasAnomalySeverity.Info;
    }

    private AtlasAnomalySeverity ClassifyErrorSpikeSeverity(double errorRate)
    {
        // >20% = Critical, >10% = Warning, else Info
        if (errorRate > 20.0)
            return AtlasAnomalySeverity.Critical;
        if (errorRate > 10.0)
            return AtlasAnomalySeverity.Warning;
        return AtlasAnomalySeverity.Info;
    }

    #endregion
}
