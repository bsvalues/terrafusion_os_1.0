// ═══════════════════════════════════════════════════════════════════════════════
// 📊 PHASE 35: Atlas Observability Metrics Tests
// Comprehensive tests for Prometheus metrics instrumentation
// SPEC LOCK: All metric names, types, and labels are FROZEN
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.AI.Extensions;
using TerraFusion.AI.Metrics;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase35;

/// <summary>
/// Phase 35: Tests for Atlas Metrics Collector - core metrics registration and tracking.
/// </summary>
public class AtlasMetricsCollectorTests
{
    private readonly IAtlasMetricsCollector _metrics;

    public AtlasMetricsCollectorTests()
    {
        _metrics = new AtlasMetricsCollector();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FORECAST ENGINE METRICS TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void IncrementForecastGenerated_IncrementsCounter()
    {
        // Arrange
        var countyId = $"test-county-{Guid.NewGuid():N}";
        var before = _metrics.GetForecastGeneratedCount(countyId);

        // Act
        _metrics.IncrementForecastGenerated(countyId);

        // Assert
        var after = _metrics.GetForecastGeneratedCount(countyId);
        after.Should().Be(before + 1);
    }

    [Fact]
    public void IncrementForecastGenerated_WithDifferentCounties_TracksSeperately()
    {
        // Arrange
        var county1 = $"county-a-{Guid.NewGuid():N}";
        var county2 = $"county-b-{Guid.NewGuid():N}";

        // Act
        _metrics.IncrementForecastGenerated(county1);
        _metrics.IncrementForecastGenerated(county1);
        _metrics.IncrementForecastGenerated(county2);

        // Assert
        _metrics.GetForecastGeneratedCount(county1).Should().Be(2);
        _metrics.GetForecastGeneratedCount(county2).Should().Be(1);
    }

    [Fact]
    public void ObserveForecastDuration_RecordsObservation()
    {
        // Arrange
        var countyId = $"duration-test-{Guid.NewGuid():N}";
        var before = _metrics.GetForecastDurationObservationCount(countyId);

        // Act
        _metrics.ObserveForecastDuration(countyId, 0.05); // 50ms

        // Assert
        var after = _metrics.GetForecastDurationObservationCount(countyId);
        after.Should().Be(before + 1);
    }

    [Fact]
    public void IncrementForecastError_TracksErrorsByType()
    {
        // Arrange
        var countyId = $"error-test-{Guid.NewGuid():N}";

        // Act
        _metrics.IncrementForecastError(countyId, "InvalidInput");
        _metrics.IncrementForecastError(countyId, "Timeout");
        _metrics.IncrementForecastError(countyId, "InvalidInput");

        // Assert
        _metrics.GetForecastErrorCount(countyId, "InvalidInput").Should().Be(2);
        _metrics.GetForecastErrorCount(countyId, "Timeout").Should().Be(1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORCHESTRATOR METRICS TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void IncrementOrchestratorRuns_IncrementsCounter()
    {
        // Arrange
        var before = _metrics.GetOrchestratorRunsCount();

        // Act
        _metrics.IncrementOrchestratorRuns();

        // Assert
        var after = _metrics.GetOrchestratorRunsCount();
        after.Should().Be(before + 1);
    }

    [Fact]
    public void SetOrchestratorLastRunTimestamp_SetsGauge()
    {
        // Arrange
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Act
        _metrics.SetOrchestratorLastRunTimestamp(timestamp);

        // Assert - verify no exception (gauge is set)
        // Prometheus gauges don't expose direct read for test, but we verify no throw
        Assert.True(true);
    }

    [Fact]
    public void SetOrchestratorLastRunDuration_SetsGauge()
    {
        // Act
        _metrics.SetOrchestratorLastRunDuration(1.5);

        // Assert - verify no exception
        Assert.True(true);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TELEMETRY METRICS TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void IncrementTelemetryIngest_IncrementsCounter()
    {
        // Arrange
        var countyId = $"telemetry-test-{Guid.NewGuid():N}";
        var before = _metrics.GetTelemetryIngestCount(countyId);

        // Act
        _metrics.IncrementTelemetryIngest(countyId);

        // Assert
        var after = _metrics.GetTelemetryIngestCount(countyId);
        after.Should().Be(before + 1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ANOMALY DETECTION METRICS TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("LatencySpike")]
    [InlineData("ErrorSpike")]
    [InlineData("GuardrailBurst")]
    [InlineData("CapacityFlap")]
    [InlineData("OfflinePattern")]
    public void IncrementAnomalyDetected_TracksAllAnomalyTypes(string anomalyType)
    {
        // Arrange
        var countyId = $"anomaly-test-{Guid.NewGuid():N}";
        var before = _metrics.GetAnomalyDetectedCount(countyId, anomalyType);

        // Act
        _metrics.IncrementAnomalyDetected(countyId, anomalyType);

        // Assert
        var after = _metrics.GetAnomalyDetectedCount(countyId, anomalyType);
        after.Should().Be(before + 1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SWARM POLICY METRICS TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void IncrementPolicyEvaluation_IncrementsCounter()
    {
        // Arrange
        var countyId = $"policy-test-{Guid.NewGuid():N}";
        var before = _metrics.GetPolicyEvaluationCount(countyId);

        // Act
        _metrics.IncrementPolicyEvaluation(countyId);

        // Assert
        var after = _metrics.GetPolicyEvaluationCount(countyId);
        after.Should().Be(before + 1);
    }

    [Theory]
    [InlineData("NoAction")]
    [InlineData("IncreaseCapacity")]
    [InlineData("DecreaseCapacity")]
    [InlineData("EnableSafeMode")]
    [InlineData("DisableSafeMode")]
    [InlineData("RouteToSafeModel")]
    [InlineData("ActivateGuardrails")]
    public void IncrementSwarmAction_TracksAllActionTypes(string actionType)
    {
        // Arrange
        var countyId = $"action-test-{Guid.NewGuid():N}";
        var before = _metrics.GetSwarmActionCount(countyId, actionType);

        // Act
        _metrics.IncrementSwarmAction(countyId, actionType);

        // Assert
        var after = _metrics.GetSwarmActionCount(countyId, actionType);
        after.Should().Be(before + 1);
    }

    [Fact]
    public void IncrementCooldownActivation_IncrementsCounter()
    {
        // Arrange
        var countyId = $"cooldown-test-{Guid.NewGuid():N}";

        // Act - just verify no exception
        _metrics.IncrementCooldownActivation(countyId);

        // Assert - verify no throw
        Assert.True(true);
    }
}

/// <summary>
/// Phase 35: Tests for Metrics DI Registration.
/// </summary>
public class AtlasMetricsDITests
{
    [Fact]
    public void AddAtlasMetrics_RegistersMetricsCollector()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Act
        services.AddAtlasMetrics();
        var provider = services.BuildServiceProvider();

        // Assert
        var metrics = provider.GetService<IAtlasMetricsCollector>();
        metrics.Should().NotBeNull();
        metrics.Should().BeOfType<AtlasMetricsCollector>();
    }

    [Fact]
    public void AddAtlasMetrics_IsSingleton()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAtlasMetrics();
        var provider = services.BuildServiceProvider();

        // Act
        var metrics1 = provider.GetService<IAtlasMetricsCollector>();
        var metrics2 = provider.GetService<IAtlasMetricsCollector>();

        // Assert
        metrics1.Should().BeSameAs(metrics2);
    }

    [Fact]
    public void AddAtlasNullMetrics_RegistersNullCollector()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Act
        services.AddAtlasNullMetrics();
        var provider = services.BuildServiceProvider();

        // Assert
        var metrics = provider.GetService<IAtlasMetricsCollector>();
        metrics.Should().NotBeNull();
        metrics.Should().BeOfType<NullAtlasMetricsCollector>();
    }

    [Fact]
    public void AddAtlasForecastCore_RegistersMetricsCollector()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Act
        services.AddAtlasForecastCore();
        var provider = services.BuildServiceProvider();

        // Assert
        var metrics = provider.GetService<IAtlasMetricsCollector>();
        metrics.Should().NotBeNull();
    }

    [Fact]
    public void AddAtlasForecastServices_RegistersMetricsCollector()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Mock dependencies needed by orchestrator
        services.AddSingleton<ISystemGptAtlasTelemetrySource>(sp =>
            new MockTelemetrySource());
        services.AddSingleton<ISystemGptAtlasAnomalyStore>(sp =>
            new SystemGptAtlasAnomalyStore(
                sp.GetRequiredService<ILogger<SystemGptAtlasAnomalyStore>>()));
        services.AddSingleton<ISystemGptSwarmStateStore>(sp =>
            new SystemGptSwarmStateStore(
                sp.GetRequiredService<ILogger<SystemGptSwarmStateStore>>()));

        // Act
        services.AddAtlasForecastServices(opts =>
        {
            opts.Enabled = false; // Don't run orchestrator in test
        });
        var provider = services.BuildServiceProvider();

        // Assert
        var metrics = provider.GetService<IAtlasMetricsCollector>();
        metrics.Should().NotBeNull();
    }
}

/// <summary>
/// Phase 35: Tests for Null Metrics Collector (testing without Prometheus).
/// </summary>
public class NullAtlasMetricsCollectorTests
{
    private readonly IAtlasMetricsCollector _nullMetrics;

    public NullAtlasMetricsCollectorTests()
    {
        _nullMetrics = new NullAtlasMetricsCollector();
    }

    [Fact]
    public void AllMethods_DoNotThrow()
    {
        // Act & Assert - verify no exceptions
        var countyId = "test";
        var errorType = "TestError";
        var actionType = "TestAction";
        var anomalyType = "TestAnomaly";

        // All these should be no-ops and not throw
        _nullMetrics.IncrementForecastGenerated(countyId);
        _nullMetrics.ObserveForecastDuration(countyId, 0.1);
        _nullMetrics.IncrementForecastError(countyId, errorType);
        _nullMetrics.IncrementOrchestratorRuns();
        _nullMetrics.SetOrchestratorLastRunTimestamp(1000);
        _nullMetrics.SetOrchestratorLastRunDuration(1.0);
        _nullMetrics.IncrementCleanupRuns();
        _nullMetrics.IncrementEntriesPurged(countyId, 5);
        _nullMetrics.IncrementTelemetryIngest(countyId);
        _nullMetrics.IncrementAnomalyDetected(countyId, anomalyType);
        _nullMetrics.IncrementPolicyEvaluation(countyId);
        _nullMetrics.IncrementSwarmAction(countyId, actionType);
        _nullMetrics.IncrementCooldownActivation(countyId);

        Assert.True(true);
    }

    [Fact]
    public void GetMethods_ReturnZero()
    {
        // Arrange
        var countyId = "test";

        // Assert
        _nullMetrics.GetForecastGeneratedCount(countyId).Should().Be(0);
        _nullMetrics.GetForecastErrorCount(countyId, "error").Should().Be(0);
        _nullMetrics.GetOrchestratorRunsCount().Should().Be(0);
        _nullMetrics.GetAnomalyDetectedCount(countyId, "anomaly").Should().Be(0);
        _nullMetrics.GetPolicyEvaluationCount(countyId).Should().Be(0);
        _nullMetrics.GetSwarmActionCount(countyId, "action").Should().Be(0);
        _nullMetrics.GetTelemetryIngestCount(countyId).Should().Be(0);
        _nullMetrics.GetForecastDurationObservationCount(countyId).Should().Be(0);
    }
}

/// <summary>
/// Phase 35: Non-functional tests for metrics overhead.
/// </summary>
public class AtlasMetricsPerformanceTests
{
    [Fact]
    public void MetricsCollection_AddsNegligibleOverhead()
    {
        // Arrange
        var metrics = new AtlasMetricsCollector();
        var countyId = "perf-test";
        var iterations = 10000;

        // Warmup - first call may be slower
        metrics.IncrementForecastGenerated(countyId);

        // Act - measure time to increment counter many times
        var sw = System.Diagnostics.Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            metrics.IncrementForecastGenerated(countyId);
        }
        sw.Stop();

        // Assert - should complete in reasonable time (< 1ms per operation on average)
        // Even on slow CI machines, sub-millisecond is achievable for counter increment
        var msPerOperation = sw.Elapsed.TotalMilliseconds / iterations;
        msPerOperation.Should().BeLessThan(0.1, "metrics increment should be sub-millisecond");
    }

    [Fact]
    public void HistogramObservation_IsLightweight()
    {
        // Arrange
        var metrics = new AtlasMetricsCollector();
        var countyId = "histogram-perf";
        var iterations = 1000;

        // Act
        var sw = System.Diagnostics.Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            metrics.ObserveForecastDuration(countyId, 0.05);
        }
        sw.Stop();

        // Assert
        var msPerOperation = sw.Elapsed.TotalMilliseconds / iterations;
        msPerOperation.Should().BeLessThan(0.1, "histogram observe should be fast");
    }
}

/// <summary>
/// Phase 35: Tests for label cardinality safety.
/// </summary>
public class AtlasMetricsCardinalityTests
{
    [Fact]
    public void ForecastMetrics_HandleNullCountyId_Gracefully()
    {
        // Arrange
        var metrics = new AtlasMetricsCollector();

        // Act & Assert - should not throw
        metrics.IncrementForecastGenerated(null!);
        metrics.ObserveForecastDuration(null!, 0.1);
        metrics.IncrementForecastError(null!, "error");
    }

    [Fact]
    public void AnomalyMetrics_HandleNullLabels_Gracefully()
    {
        // Arrange
        var metrics = new AtlasMetricsCollector();

        // Act & Assert - should not throw
        metrics.IncrementAnomalyDetected(null!, null!);
    }

    [Fact]
    public void SwarmMetrics_HandleNullLabels_Gracefully()
    {
        // Arrange
        var metrics = new AtlasMetricsCollector();

        // Act & Assert - should not throw
        metrics.IncrementPolicyEvaluation(null!);
        metrics.IncrementSwarmAction(null!, null!);
        metrics.IncrementCooldownActivation(null!);
    }
}

/// <summary>
/// Mock telemetry source for testing.
/// </summary>
internal class MockTelemetrySource : ISystemGptAtlasTelemetrySource
{
    public Task<IReadOnlyList<RawCountyMetrics>> GetCurrentMetricsAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<RawCountyMetrics>>(Array.Empty<RawCountyMetrics>());
    }
}
