// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 33: SystemGPT Atlas Forecast Orchestrator Tests
// TDD tests for the background service that periodically computes forecasts
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase33;

/// <summary>
/// Phase 33: Tests for the Forecast Orchestrator background service.
/// </summary>
public class SystemGptAtlasForecastOrchestratorTests
{
    private readonly Mock<ISystemGptAtlasTelemetrySource> _telemetrySourceMock;
    private readonly Mock<ISystemGptAtlasAnomalyStore> _anomalyStoreMock;
    private readonly Mock<ISystemGptSwarmStateStore> _swarmStateStoreMock;
    private readonly Mock<ISystemGptAtlasForecastEngine> _forecastEngineMock;
    private readonly Mock<ISystemGptAtlasForecastStore> _forecastStoreMock;
    private readonly Mock<ILogger<SystemGptAtlasForecastOrchestrator>> _loggerMock;
    private readonly AtlasForecastOrchestratorOptions _options;

    public SystemGptAtlasForecastOrchestratorTests()
    {
        _telemetrySourceMock = new Mock<ISystemGptAtlasTelemetrySource>();
        _anomalyStoreMock = new Mock<ISystemGptAtlasAnomalyStore>();
        _swarmStateStoreMock = new Mock<ISystemGptSwarmStateStore>();
        _forecastEngineMock = new Mock<ISystemGptAtlasForecastEngine>();
        _forecastStoreMock = new Mock<ISystemGptAtlasForecastStore>();
        _loggerMock = new Mock<ILogger<SystemGptAtlasForecastOrchestrator>>();

        _options = new AtlasForecastOrchestratorOptions
        {
            IntervalSeconds = 1, // Fast for testing
            MaxForecastAge = TimeSpan.FromHours(1),
            CleanupIntervalTicks = 5
        };
    }

    private SystemGptAtlasForecastOrchestrator CreateOrchestrator()
    {
        return new SystemGptAtlasForecastOrchestrator(
            _telemetrySourceMock.Object,
            _anomalyStoreMock.Object,
            _swarmStateStoreMock.Object,
            _forecastEngineMock.Object,
            _forecastStoreMock.Object,
            Options.Create(_options),
            _loggerMock.Object
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RunOnceAsync Tests (single cycle execution for testability)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RunOnceAsync_WithMultipleCounties_ComputesForecastForEach()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics>
        {
            CreateTestMetrics("benton"),
            CreateTestMetrics("yakima"),
            CreateTestMetrics("spokane")
        };

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent(It.IsAny<string>(), It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        _swarmStateStoreMock
            .Setup(s => s.GetState(It.IsAny<string>()))
            .Returns<string>(id => CreateTestSwarmState(id));

        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync((AtlasForecastInput input) => CreateTestForecast(input.CountyId));

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Returns(Task.CompletedTask);

        var orchestrator = CreateOrchestrator();

        // Act
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Assert
        _forecastEngineMock.Verify(
            e => e.ComputeForecast(It.Is<AtlasForecastInput>(i => i.CountyId == "benton")),
            Times.Once);
        _forecastEngineMock.Verify(
            e => e.ComputeForecast(It.Is<AtlasForecastInput>(i => i.CountyId == "yakima")),
            Times.Once);
        _forecastEngineMock.Verify(
            e => e.ComputeForecast(It.Is<AtlasForecastInput>(i => i.CountyId == "spokane")),
            Times.Once);
    }

    [Fact]
    public async Task RunOnceAsync_SavesForecastsToStore()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics> { CreateTestMetrics("benton") };
        var savedForecasts = new List<AtlasForecastRecord>();

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent(It.IsAny<string>(), It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        _swarmStateStoreMock
            .Setup(s => s.GetState(It.IsAny<string>()))
            .Returns<string>(id => CreateTestSwarmState(id));

        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync((AtlasForecastInput input) => CreateTestForecast(input.CountyId));

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Callback<AtlasForecastRecord>(f => savedForecasts.Add(f))
            .Returns(Task.CompletedTask);

        var orchestrator = CreateOrchestrator();

        // Act
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Assert
        Assert.Single(savedForecasts);
        Assert.Equal("benton", savedForecasts[0].CountyId);
    }

    [Fact]
    public async Task RunOnceAsync_HandlesMissingTelemetryGracefully()
    {
        // Arrange
        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RawCountyMetrics>()); // Empty

        var orchestrator = CreateOrchestrator();

        // Act & Assert - should not throw
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Verify no forecasts attempted
        _forecastEngineMock.Verify(
            e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()),
            Times.Never);
    }

    [Fact]
    public async Task RunOnceAsync_HandlesTelemetrySourceException()
    {
        // Arrange
        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Telemetry source unavailable"));

        var orchestrator = CreateOrchestrator();

        // Act & Assert - should not throw, just log error
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Verify no forecasts attempted
        _forecastEngineMock.Verify(
            e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()),
            Times.Never);
    }

    [Fact]
    public async Task RunOnceAsync_ContinuesOnSingleCountyFailure()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics>
        {
            CreateTestMetrics("benton"),
            CreateTestMetrics("yakima")
        };

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent(It.IsAny<string>(), It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        _swarmStateStoreMock
            .Setup(s => s.GetState(It.IsAny<string>()))
            .Returns<string>(id => CreateTestSwarmState(id));

        // First county fails, second succeeds
        var callCount = 0;
        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync((AtlasForecastInput input) =>
            {
                callCount++;
                if (callCount == 1)
                    throw new InvalidOperationException("Simulated failure");
                return CreateTestForecast(input.CountyId);
            });

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Returns(Task.CompletedTask);

        var orchestrator = CreateOrchestrator();

        // Act
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Assert - second county still processed
        _forecastEngineMock.Verify(
            e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()),
            Times.Exactly(2));
        _forecastStoreMock.Verify(
            s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()),
            Times.Once); // Only second one saved
    }

    [Fact]
    public async Task RunOnceAsync_IncludesAnomaliesInForecastInput()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics> { CreateTestMetrics("benton") };
        var anomalies = new List<SystemGptAtlasAnomalyEventDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CountyId = "benton",
                Kind = AtlasAnomalyKind.LatencySpike,
                Severity = AtlasAnomalySeverity.Warning,
                Timestamp = DateTimeOffset.UtcNow,
                Reason = "Test anomaly"
            }
        };

        AtlasForecastInput? capturedInput = null;

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent("benton", It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(anomalies);

        _swarmStateStoreMock
            .Setup(s => s.GetState("benton"))
            .Returns(CreateTestSwarmState("benton"));

        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .Callback<AtlasForecastInput>(input => capturedInput = input)
            .ReturnsAsync((AtlasForecastInput input) => CreateTestForecast(input.CountyId));

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Returns(Task.CompletedTask);

        var orchestrator = CreateOrchestrator();

        // Act
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Assert
        Assert.NotNull(capturedInput);
        Assert.Single(capturedInput.RecentAnomalies);
        Assert.Equal(AtlasAnomalyKind.LatencySpike, capturedInput.RecentAnomalies[0].Kind);
    }

    [Fact]
    public async Task RunOnceAsync_IncludesSwarmStateInForecastInput()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics> { CreateTestMetrics("benton") };
        var swarmState = new SwarmStateSnapshot
        {
            CountyId = "benton",
            Mode = SwarmMode.Throttled,
            CurrentCapacity = 42,
            MaxCapacity = 50,
            SafeModeEnabled = true
        };

        AtlasForecastInput? capturedInput = null;

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent(It.IsAny<string>(), It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        _swarmStateStoreMock
            .Setup(s => s.GetState("benton"))
            .Returns(swarmState);

        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .Callback<AtlasForecastInput>(input => capturedInput = input)
            .ReturnsAsync((AtlasForecastInput input) => CreateTestForecast(input.CountyId));

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Returns(Task.CompletedTask);

        var orchestrator = CreateOrchestrator();

        // Act
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Assert
        Assert.NotNull(capturedInput);
        Assert.NotNull(capturedInput.SwarmState);
        Assert.Equal(SwarmMode.Throttled, capturedInput.SwarmState.Mode);
        Assert.Equal(42, capturedInput.SwarmState.ActiveAgents);
        Assert.True(capturedInput.SwarmState.SafeModeEnabled);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cleanup Tests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RunOnceAsync_WithCleanupTick_ClearsOldForecasts()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics> { CreateTestMetrics("benton") };

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent(It.IsAny<string>(), It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        _swarmStateStoreMock
            .Setup(s => s.GetState(It.IsAny<string>()))
            .Returns<string>(id => CreateTestSwarmState(id));

        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync((AtlasForecastInput input) => CreateTestForecast(input.CountyId));

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Returns(Task.CompletedTask);

        _forecastStoreMock
            .Setup(s => s.ClearOldAsync(It.IsAny<TimeSpan>()))
            .ReturnsAsync(5);

        var orchestrator = CreateOrchestrator();

        // Act - run enough ticks to trigger cleanup
        for (int i = 0; i < _options.CleanupIntervalTicks; i++)
        {
            await orchestrator.RunOnceAsync(CancellationToken.None);
        }

        // Assert
        _forecastStoreMock.Verify(
            s => s.ClearOldAsync(_options.MaxForecastAge),
            Times.Once);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cancellation Tests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RunOnceAsync_RespectsCancellation()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        var orchestrator = CreateOrchestrator();

        // Act & Assert - should throw OperationCanceledException
        await Assert.ThrowsAsync<OperationCanceledException>(
            () => orchestrator.RunOnceAsync(cts.Token));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Metrics Conversion Tests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RunOnceAsync_ConvertsTelemetryToSnapshots()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics>
        {
            new RawCountyMetrics
            {
                CountyId = "benton",
                P95LatencyMs = 150,
                ErrorRatePercent = 2.0, // 2%
                ActiveRequests = 50,
                HealthScore = 0.95,
                RagActive = true,
                GuardrailTriggered = false
            }
        };

        AtlasForecastInput? capturedInput = null;

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent(It.IsAny<string>(), It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        _swarmStateStoreMock
            .Setup(s => s.GetState(It.IsAny<string>()))
            .Returns<string>(id => CreateTestSwarmState(id));

        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .Callback<AtlasForecastInput>(input => capturedInput = input)
            .ReturnsAsync((AtlasForecastInput input) => CreateTestForecast(input.CountyId));

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Returns(Task.CompletedTask);

        var orchestrator = CreateOrchestrator();

        // Act
        await orchestrator.RunOnceAsync(CancellationToken.None);

        // Assert
        Assert.NotNull(capturedInput);
        Assert.Single(capturedInput.TelemetryHistory);
        Assert.Equal(150, capturedInput.TelemetryHistory[0].P95LatencyMs);
        Assert.Equal(0.02, capturedInput.TelemetryHistory[0].ErrorRate, 3); // 2% as ratio
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Statistics Tracking Tests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatistics_ReturnsCorrectCounts()
    {
        // Arrange
        var metrics = new List<RawCountyMetrics>
        {
            CreateTestMetrics("benton"),
            CreateTestMetrics("yakima")
        };

        _telemetrySourceMock
            .Setup(t => t.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(metrics);

        _anomalyStoreMock
            .Setup(a => a.GetRecent(It.IsAny<string>(), It.IsAny<DateTimeOffset?>(), null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        _swarmStateStoreMock
            .Setup(s => s.GetState(It.IsAny<string>()))
            .Returns<string>(id => CreateTestSwarmState(id));

        _forecastEngineMock
            .Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync((AtlasForecastInput input) => CreateTestForecast(input.CountyId));

        _forecastStoreMock
            .Setup(s => s.SaveAsync(It.IsAny<AtlasForecastRecord>()))
            .Returns(Task.CompletedTask);

        var orchestrator = CreateOrchestrator();

        // Act
        await orchestrator.RunOnceAsync(CancellationToken.None);
        var stats = orchestrator.GetStatistics();

        // Assert
        Assert.Equal(1, stats.TotalRuns);
        Assert.Equal(2, stats.TotalForecastsComputed);
        Assert.Equal(0, stats.TotalErrors);
        Assert.True(stats.LastRunTime > DateTimeOffset.MinValue);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static RawCountyMetrics CreateTestMetrics(string countyId)
    {
        return new RawCountyMetrics
        {
            CountyId = countyId,
            P95LatencyMs = 100,
            ErrorRatePercent = 1.0, // 1%
            ActiveRequests = 25,
            HealthScore = 0.95,
            RagActive = true,
            GuardrailTriggered = false
        };
    }

    private static SwarmStateSnapshot CreateTestSwarmState(string countyId)
    {
        return new SwarmStateSnapshot
        {
            CountyId = countyId,
            Mode = SwarmMode.Normal,
            CurrentCapacity = 50,
            MaxCapacity = 100,
            SafeModeEnabled = false
        };
    }

    private static AtlasForecastRecord CreateTestForecast(string countyId)
    {
        return new AtlasForecastRecord
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            Timestamp = DateTimeOffset.UtcNow,
            OverallRisk = AtlasRiskLevel.Low,
            DimensionRisks = new Dictionary<AtlasRiskDimension, AtlasRiskLevel>
            {
                [AtlasRiskDimension.Latency] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.ErrorRate] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.Offline] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.Capacity] = AtlasRiskLevel.Low
            },
            Confidence = 0.9,
            Reasoning = "Test forecast"
        };
    }
}
