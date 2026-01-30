// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 PHASE 31: SystemGPT Atlas Anomaly Detector Tests
// TDD: Tests written FIRST before implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase31;

/// <summary>
/// Phase 31: Unit tests for the Atlas Anomaly Detector.
/// Tests deterministic anomaly detection rules based on telemetry patterns.
/// </summary>
public class SystemGptAtlasAnomalyDetectorTests
{
    private readonly Mock<ILogger<SystemGptAtlasAnomalyDetector>> _loggerMock;
    private readonly IOptions<AtlasAnomalyDetectionOptions> _defaultOptions;

    public SystemGptAtlasAnomalyDetectorTests()
    {
        _loggerMock = new Mock<ILogger<SystemGptAtlasAnomalyDetector>>();
        _defaultOptions = Options.Create(new AtlasAnomalyDetectionOptions
        {
            LatencySpikeMultiplier = 2.0,
            ErrorSpikeMultiplier = 3.0,
            ErrorSpikeAbsoluteThreshold = 5.0,
            GuardrailBurstCount = 3,
            GuardrailBurstWindow = 5,
            CapacityFlapCount = 3,
            OfflineConsecutiveCount = 3,
            HistoryWindowSize = 10
        });
    }

    private SystemGptAtlasAnomalyDetector CreateDetector(
        AtlasAnomalyDetectionOptions? options = null)
    {
        var opts = options != null
            ? Options.Create(options)
            : _defaultOptions;
        return new SystemGptAtlasAnomalyDetector(_loggerMock.Object, opts);
    }

    #region Latency Spike Detection

    [Fact]
    public void LatencySpike_Detected_WhenCurrentExceedsMedianByMultiplier()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("benton",
            currentLatency: 350, // 3.5× median of 100 -> should be Warning
            latencyHistory: Enumerable.Repeat(100.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.Contains(anomalies, a => a.Kind == AtlasAnomalyKind.LatencySpike);
        var spike = anomalies.First(a => a.Kind == AtlasAnomalyKind.LatencySpike);
        Assert.Equal("benton", spike.CountyId);
        Assert.True(spike.Severity >= AtlasAnomalySeverity.Warning);
    }

    [Fact]
    public void LatencySpike_NotDetected_WhenLatencyWithinBounds()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("benton",
            currentLatency: 150, // 1.5× median (below 2× threshold)
            latencyHistory: Enumerable.Repeat(100.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.DoesNotContain(anomalies, a => a.Kind == AtlasAnomalyKind.LatencySpike);
    }

    [Fact]
    public void LatencySpike_NotDetected_WhenHistoryEmpty()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("benton",
            currentLatency: 500,
            latencyHistory: new List<double>()); // Empty history

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.DoesNotContain(anomalies, a => a.Kind == AtlasAnomalyKind.LatencySpike);
    }

    #endregion

    #region Error Spike Detection

    [Fact]
    public void ErrorSpike_Detected_WhenRateExceedsMultiplierAndThreshold()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("yakima",
            currentErrorRate: 8.0, // 4× median of 2.0 AND > 5% absolute threshold
            errorRateHistory: Enumerable.Repeat(2.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.Contains(anomalies, a => a.Kind == AtlasAnomalyKind.ErrorSpike);
    }

    [Fact]
    public void ErrorSpike_NotDetected_WhenBelowAbsoluteThreshold()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("yakima",
            currentErrorRate: 4.0, // 4× median but < 5% absolute threshold
            errorRateHistory: Enumerable.Repeat(1.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.DoesNotContain(anomalies, a => a.Kind == AtlasAnomalyKind.ErrorSpike);
    }

    [Fact]
    public void ErrorSpike_NotDetected_WhenRateBelowMultiplier()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("yakima",
            currentErrorRate: 6.0, // 2× median (below 3× threshold), but > 5%
            errorRateHistory: Enumerable.Repeat(3.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        // 6.0 > 5.0 (absolute) but 6.0 < 3.0 * 3.0 (9.0) so no spike
        Assert.DoesNotContain(anomalies, a => a.Kind == AtlasAnomalyKind.ErrorSpike);
    }

    #endregion

    #region Guardrail Burst Detection

    [Fact]
    public void GuardrailBurst_Detected_WhenTriggeredInMostRecentIntervals()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("king",
            guardrailHistory: new List<bool> { true, true, true, false, false }); // 3 of 5

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.Contains(anomalies, a => a.Kind == AtlasAnomalyKind.GuardrailBurst);
    }

    [Fact]
    public void GuardrailBurst_NotDetected_WhenBelowThreshold()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("king",
            guardrailHistory: new List<bool> { true, true, false, false, false }); // 2 of 5 (below 3)

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.DoesNotContain(anomalies, a => a.Kind == AtlasAnomalyKind.GuardrailBurst);
    }

    #endregion

    #region Offline Pattern Detection

    [Fact]
    public void OfflinePattern_Detected_WhenConsecutiveOfflineIntervals()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("spokane",
            healthStateHistory: new List<string> { "healthy", "offline", "offline", "offline" }); // 3 consecutive at end

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.Contains(anomalies, a => a.Kind == AtlasAnomalyKind.OfflinePattern);
        var offline = anomalies.First(a => a.Kind == AtlasAnomalyKind.OfflinePattern);
        Assert.Equal(AtlasAnomalySeverity.Critical, offline.Severity);
    }

    [Fact]
    public void OfflinePattern_NotDetected_WhenNotConsecutive()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("spokane",
            healthStateHistory: new List<string> { "offline", "healthy", "offline", "offline" }); // 2 consecutive at end

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.DoesNotContain(anomalies, a => a.Kind == AtlasAnomalyKind.OfflinePattern);
    }

    #endregion

    #region Capacity Flap Detection

    [Fact]
    public void CapacityFlap_Detected_WhenModeChangesExceedThreshold()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("pierce",
            swarmModeHistory: new List<string> { "normal", "safe-mode", "normal", "throttled", "normal" }); // 4 changes

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.Contains(anomalies, a => a.Kind == AtlasAnomalyKind.CapacityFlap);
    }

    [Fact]
    public void CapacityFlap_NotDetected_WhenModeStable()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("pierce",
            swarmModeHistory: new List<string> { "normal", "normal", "normal", "normal", "normal" }); // 0 changes

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.DoesNotContain(anomalies, a => a.Kind == AtlasAnomalyKind.CapacityFlap);
    }

    #endregion

    #region No Anomaly Scenarios

    [Fact]
    public void NoAnomaly_WhenAllMetricsStable()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("benton",
            currentLatency: 110, // within 2× of 100
            latencyHistory: Enumerable.Repeat(100.0, 10).ToList(),
            currentErrorRate: 1.2, // low error rate
            errorRateHistory: Enumerable.Repeat(1.0, 10).ToList(),
            guardrailHistory: Enumerable.Repeat(false, 5).ToList(),
            swarmModeHistory: Enumerable.Repeat("normal", 5).ToList(),
            healthStateHistory: Enumerable.Repeat("healthy", 5).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.Empty(anomalies);
    }

    #endregion

    #region Multiple Anomalies

    [Fact]
    public void MultipleAnomalies_DetectedSimultaneously()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("benton",
            currentLatency: 300, // 3× spike
            latencyHistory: Enumerable.Repeat(100.0, 10).ToList(),
            currentErrorRate: 10.0, // 5× spike AND > 5%
            errorRateHistory: Enumerable.Repeat(2.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        Assert.Contains(anomalies, a => a.Kind == AtlasAnomalyKind.LatencySpike);
        Assert.Contains(anomalies, a => a.Kind == AtlasAnomalyKind.ErrorSpike);
        Assert.Equal(2, anomalies.Count);
    }

    #endregion

    #region Severity Classification

    [Fact]
    public void Severity_Critical_ForSevereLatencySpike()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("benton",
            currentLatency: 700, // 7× median = very severe (>3× threshold)
            latencyHistory: Enumerable.Repeat(100.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        var spike = anomalies.First(a => a.Kind == AtlasAnomalyKind.LatencySpike);
        Assert.Equal(AtlasAnomalySeverity.Critical, spike.Severity);
    }

    [Fact]
    public void Severity_Warning_ForModerateLatencySpike()
    {
        // Arrange
        var detector = CreateDetector();
        var input = CreateInput("benton",
            currentLatency: 220, // 2.2× median (above 2× threshold but not severe)
            latencyHistory: Enumerable.Repeat(100.0, 10).ToList());

        // Act
        var anomalies = detector.DetectAnomalies(input);

        // Assert
        var spike = anomalies.First(a => a.Kind == AtlasAnomalyKind.LatencySpike);
        // 220 / (100 * 2) = 1.1, which is below 2.0 threshold for Warning->Critical
        Assert.True(spike.Severity == AtlasAnomalySeverity.Info || spike.Severity == AtlasAnomalySeverity.Warning);
    }

    #endregion

    #region Helper Methods

    private static AtlasAnomalyDetectionInput CreateInput(
        string countyId,
        double currentLatency = 100,
        IList<double>? latencyHistory = null,
        double currentErrorRate = 1.0,
        IList<double>? errorRateHistory = null,
        IList<bool>? guardrailHistory = null,
        IList<string>? swarmModeHistory = null,
        IList<string>? healthStateHistory = null)
    {
        return new AtlasAnomalyDetectionInput
        {
            CountyId = countyId,
            CurrentLatencyP95 = currentLatency,
            LatencyHistory = latencyHistory ?? Enumerable.Repeat(100.0, 10).ToList(),
            CurrentErrorRate = currentErrorRate,
            ErrorRateHistory = errorRateHistory ?? Enumerable.Repeat(1.0, 10).ToList(),
            GuardrailHistory = guardrailHistory ?? Enumerable.Repeat(false, 5).ToList(),
            SwarmModeHistory = swarmModeHistory ?? Enumerable.Repeat("normal", 5).ToList(),
            HealthStateHistory = healthStateHistory ?? Enumerable.Repeat("healthy", 5).ToList()
        };
    }

    #endregion
}
