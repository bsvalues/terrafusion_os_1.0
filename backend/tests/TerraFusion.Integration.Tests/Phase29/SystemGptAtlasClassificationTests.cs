// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29 TEST PLAN: B2 - Threshold Classification Tests
// SystemGPT Atlas Real-Time Telemetry & Alert Engine
// "Write the exam before the course"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System.Collections.Generic;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase29;

/// <summary>
/// B2: Threshold Classification Tests
/// Goal: Verify the classifier maps metrics to HealthState and generates ActiveAlerts.
/// </summary>
public class SystemGptAtlasClassificationTests
{
    // Default thresholds for testing (matches spec):
    // WarningHealthScore: 0.80, CriticalHealthScore: 0.60
    // WarningErrorRatePercent: 1.0, CriticalErrorRatePercent: 5.0
    // WarningP95Ms: 300, CriticalP95Ms: 1000

    // ═══════════════════════════════════════════════════════════════════════════════
    // B2.1 – HealthScore → HealthState
    // ═══════════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData(1.00, "healthy")]
    [InlineData(0.85, "healthy")]
    [InlineData(0.81, "healthy")]
    public void B2_1_HealthScore_AboveWarning_ReturnsHealthy(double healthScore, string expectedState)
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore, errorRatePercent: 0, p95Ms: 50);

        // Assert
        Assert.Equal(expectedState, result.HealthState);
    }

    [Theory]
    [InlineData(0.80, "warning")]
    [InlineData(0.75, "warning")]
    [InlineData(0.61, "warning")]
    public void B2_1_HealthScore_BetweenWarningAndCritical_ReturnsWarning(double healthScore, string expectedState)
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore, errorRatePercent: 0, p95Ms: 50);

        // Assert
        Assert.Equal(expectedState, result.HealthState);
    }

    [Theory]
    [InlineData(0.60, "critical")]
    [InlineData(0.50, "critical")]
    [InlineData(0.01, "critical")]
    public void B2_1_HealthScore_BelowCritical_ReturnsCritical(double healthScore, string expectedState)
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore, errorRatePercent: 0, p95Ms: 50);

        // Assert
        Assert.Equal(expectedState, result.HealthState);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B2.2 – ErrorRate → HealthState escalation
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B2_2_ErrorRate_WarningThreshold_EscalatesToWarning()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act - healthy healthScore but warning-level error rate
        var result = classifier.Classify(healthScore: 0.95, errorRatePercent: 1.5, p95Ms: 50);

        // Assert
        Assert.Equal("warning", result.HealthState);
    }

    [Fact]
    public void B2_2_ErrorRate_CriticalThreshold_EscalatesToCritical()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act - healthy healthScore but critical-level error rate
        var result = classifier.Classify(healthScore: 0.95, errorRatePercent: 6.0, p95Ms: 50);

        // Assert
        Assert.Equal("critical", result.HealthState);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B2.3 – Latency → HealthState escalation
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B2_3_Latency_WarningThreshold_EscalatesToWarning()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act - healthy healthScore but warning-level latency
        var result = classifier.Classify(healthScore: 0.95, errorRatePercent: 0, p95Ms: 350);

        // Assert
        Assert.Equal("warning", result.HealthState);
    }

    [Fact]
    public void B2_3_Latency_CriticalThreshold_EscalatesToCritical()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act - healthy healthScore but critical-level latency
        var result = classifier.Classify(healthScore: 0.95, errorRatePercent: 0, p95Ms: 1200);

        // Assert
        Assert.Equal("critical", result.HealthState);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B2.4 – ActiveAlerts generation
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B2_4_NoIssues_ReturnsEmptyAlerts()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore: 0.95, errorRatePercent: 0, p95Ms: 50);

        // Assert
        Assert.Empty(result.ActiveAlerts);
    }

    [Fact]
    public void B2_4_WarningHealthScore_AddsHealthAlert()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore: 0.70, errorRatePercent: 0, p95Ms: 50);

        // Assert
        Assert.Contains(result.ActiveAlerts, a => a.Contains("health", System.StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void B2_4_HighErrorRate_AddsErrorAlert()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore: 0.95, errorRatePercent: 2.5, p95Ms: 50);

        // Assert
        Assert.Contains(result.ActiveAlerts, a => a.Contains("error", System.StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void B2_4_HighLatency_AddsLatencyAlert()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore: 0.95, errorRatePercent: 0, p95Ms: 500);

        // Assert
        Assert.Contains(result.ActiveAlerts, a => a.Contains("latency", System.StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void B2_4_MultipleIssues_ReturnsMultipleAlerts()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act - everything is bad
        var result = classifier.Classify(healthScore: 0.50, errorRatePercent: 8.0, p95Ms: 1500);

        // Assert
        Assert.True(result.ActiveAlerts.Count >= 2);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B2.5 – Offline state
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B2_5_ZeroHealthScore_ReturnsOffline()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore: 0.0, errorRatePercent: 0, p95Ms: 0);

        // Assert
        Assert.Equal("offline", result.HealthState);
    }

    [Fact]
    public void B2_5_NegativeHealthScore_ReturnsOffline()
    {
        // Arrange
        var classifier = CreateClassifier();

        // Act
        var result = classifier.Classify(healthScore: -1.0, errorRatePercent: 0, p95Ms: 0);

        // Assert
        Assert.Equal("offline", result.HealthState);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B2.6 – Custom thresholds
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B2_6_CustomThresholds_AreRespected()
    {
        // Arrange - very strict thresholds
        var strictThresholds = new SystemGptAtlasThresholds
        {
            WarningHealthScore = 0.99,
            CriticalHealthScore = 0.95,
            WarningErrorRatePercent = 0.1,
            CriticalErrorRatePercent = 0.5,
            WarningP95Ms = 50,
            CriticalP95Ms = 100
        };
        var classifier = new SystemGptAtlasClassifier(strictThresholds);

        // Act - would be healthy with default thresholds
        var result = classifier.Classify(healthScore: 0.96, errorRatePercent: 0, p95Ms: 50);

        // Assert - but warning with strict thresholds
        Assert.Equal("warning", result.HealthState);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Helper: Create classifier with default thresholds
    // ═══════════════════════════════════════════════════════════════════════════════

    private static SystemGptAtlasClassifier CreateClassifier()
    {
        var defaultThresholds = new SystemGptAtlasThresholds
        {
            WarningHealthScore = 0.80,
            CriticalHealthScore = 0.60,
            WarningErrorRatePercent = 1.0,
            CriticalErrorRatePercent = 5.0,
            WarningP95Ms = 300,
            CriticalP95Ms = 1000
        };
        return new SystemGptAtlasClassifier(defaultThresholds);
    }
}
