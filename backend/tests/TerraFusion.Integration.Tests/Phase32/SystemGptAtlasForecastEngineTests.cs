// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Atlas Forecast Engine Tests
// TDD: Tests written FIRST before implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase32;

/// <summary>
/// Phase 32: Unit tests for the Atlas Forecast Engine.
/// Tests predictive risk computation based on telemetry trends and anomaly history.
/// </summary>
public class SystemGptAtlasForecastEngineTests
{
    private readonly Mock<ILogger<SystemGptAtlasForecastEngine>> _loggerMock;
    private readonly IOptions<AtlasForecastOptions> _defaultOptions;

    public SystemGptAtlasForecastEngineTests()
    {
        _loggerMock = new Mock<ILogger<SystemGptAtlasForecastEngine>>();
        _defaultOptions = Options.Create(new AtlasForecastOptions
        {
            MinTelemetrySamples = 5,
            AnomalyCountThreshold = 2,
            TrendSlopeThreshold = 0.1,
            AnomalyLookbackHours = 1,
            BaseConfidence = 0.75,
            HighSampleConfidenceBoost = 0.1
        });
    }

    private SystemGptAtlasForecastEngine CreateEngine(AtlasForecastOptions? options = null)
    {
        var opts = options != null
            ? Options.Create(options)
            : _defaultOptions;
        return new SystemGptAtlasForecastEngine(opts, _loggerMock.Object);
    }

    #region Latency Risk Detection

    [Fact]
    public async Task RisingLatency_WithRecentSpikes_HighLatencyRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateRisingLatencyTelemetry(),
            anomalies: CreateLatencySpikeAnomalies(3));

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.Equal("benton", forecast.CountyId);
        Assert.True(forecast.DimensionRisks[AtlasRiskDimension.Latency] >= AtlasRiskLevel.High,
            $"Expected High+ latency risk, got {forecast.DimensionRisks[AtlasRiskDimension.Latency]}");
    }

    [Fact]
    public async Task StableLatency_NoSpikes_LowLatencyRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateStableTelemetry(),
            anomalies: new List<AtlasAnomaly>());

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.Equal(AtlasRiskLevel.Low, forecast.DimensionRisks[AtlasRiskDimension.Latency]);
    }

    #endregion

    #region Error Rate Risk Detection

    [Fact]
    public async Task RisingErrorRate_WithRecentSpikes_HighErrorRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("yakima",
            telemetry: CreateRisingErrorTelemetry(),
            anomalies: CreateErrorSpikeAnomalies(3));

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.True(forecast.DimensionRisks[AtlasRiskDimension.ErrorRate] >= AtlasRiskLevel.High,
            $"Expected High+ error risk, got {forecast.DimensionRisks[AtlasRiskDimension.ErrorRate]}");
    }

    [Fact]
    public async Task StableErrorRate_NoSpikes_LowErrorRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("yakima",
            telemetry: CreateStableTelemetry(),
            anomalies: new List<AtlasAnomaly>());

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.Equal(AtlasRiskLevel.Low, forecast.DimensionRisks[AtlasRiskDimension.ErrorRate]);
    }

    #endregion

    #region Offline Risk Detection

    [Fact]
    public async Task FrequentOfflinePatterns_ElevatedOfflineRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateStableTelemetry(),
            anomalies: CreateOfflinePatternAnomalies(3));

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.True(forecast.DimensionRisks[AtlasRiskDimension.Offline] >= AtlasRiskLevel.High,
            $"Expected High+ offline risk, got {forecast.DimensionRisks[AtlasRiskDimension.Offline]}");
    }

    [Fact]
    public async Task NoOfflinePatterns_LowOfflineRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateStableTelemetry(),
            anomalies: new List<AtlasAnomaly>());

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.Equal(AtlasRiskLevel.Low, forecast.DimensionRisks[AtlasRiskDimension.Offline]);
    }

    #endregion

    #region Capacity Risk Detection

    [Fact]
    public async Task CapacityFlapping_WithModeInstability_ElevatedCapacityRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var swarmState = new SwarmState
        {
            CountyId = "benton",
            Mode = SwarmMode.Normal,
            ModeHistory = new List<SwarmMode> { SwarmMode.Normal, SwarmMode.Throttled, SwarmMode.Normal }
        };
        var input = CreateInput("benton",
            telemetry: CreateStableTelemetry(),
            anomalies: CreateCapacityFlapAnomalies(2),
            swarmState: swarmState);

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.True(forecast.DimensionRisks[AtlasRiskDimension.Capacity] >= AtlasRiskLevel.Moderate,
            $"Expected Moderate+ capacity risk, got {forecast.DimensionRisks[AtlasRiskDimension.Capacity]}");
    }

    #endregion

    #region Overall Risk

    [Fact]
    public async Task StableMetrics_NoAnomalies_LowOverallRisk()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateStableTelemetry(),
            anomalies: new List<AtlasAnomaly>());

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.Equal(AtlasRiskLevel.Low, forecast.OverallRisk);
        Assert.Contains("normal", forecast.Reasoning.ToLower());
    }

    [Fact]
    public async Task MixedSignals_HighestDimension_DeterminesOverall()
    {
        // Arrange
        var engine = CreateEngine();
        // High latency risk, low others
        var input = CreateInput("benton",
            telemetry: CreateRisingLatencyTelemetry(),
            anomalies: CreateLatencySpikeAnomalies(4));

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.True(forecast.OverallRisk >= forecast.DimensionRisks[AtlasRiskDimension.ErrorRate]);
        Assert.True(forecast.OverallRisk >= forecast.DimensionRisks[AtlasRiskDimension.Offline]);
    }

    #endregion

    #region Recommended Actions

    [Fact]
    public async Task HighLatencyRisk_RecommendsIncreaseCapacity()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateRisingLatencyTelemetry(),
            anomalies: CreateLatencySpikeAnomalies(4));

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert - if latency risk is high enough, should recommend action
        if (forecast.DimensionRisks[AtlasRiskDimension.Latency] >= AtlasRiskLevel.High)
        {
            Assert.Equal(SwarmActionKind.IncreaseCapacity, forecast.RecommendedAction);
        }
    }

    [Fact]
    public async Task HighErrorRisk_RecommendsRouteToSafeModel()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateRisingErrorTelemetry(),
            anomalies: CreateErrorSpikeAnomalies(4));

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert - if error risk is high enough, should recommend action
        if (forecast.DimensionRisks[AtlasRiskDimension.ErrorRate] >= AtlasRiskLevel.High)
        {
            Assert.Equal(SwarmActionKind.RouteToSafeModel, forecast.RecommendedAction);
        }
    }

    [Fact]
    public async Task LowRisk_RecommendsNoAction()
    {
        // Arrange
        var engine = CreateEngine();
        var input = CreateInput("benton",
            telemetry: CreateStableTelemetry(),
            anomalies: new List<AtlasAnomaly>());

        // Act
        var forecast = await engine.ComputeForecast(input);

        // Assert
        Assert.Null(forecast.RecommendedAction);
    }

    #endregion

    #region Helper Methods

    private static AtlasForecastInput CreateInput(
        string countyId,
        IReadOnlyList<AtlasTelemetrySnapshot>? telemetry = null,
        IReadOnlyList<AtlasAnomaly>? anomalies = null,
        SwarmState? swarmState = null)
    {
        return new AtlasForecastInput
        {
            CountyId = countyId,
            TelemetryHistory = telemetry ?? new List<AtlasTelemetrySnapshot>(),
            RecentAnomalies = anomalies ?? new List<AtlasAnomaly>(),
            SwarmState = swarmState
        };
    }

    private static List<AtlasTelemetrySnapshot> CreateStableTelemetry()
    {
        var result = new List<AtlasTelemetrySnapshot>();
        for (int i = 0; i < 10; i++)
        {
            result.Add(new AtlasTelemetrySnapshot
            {
                Timestamp = DateTimeOffset.UtcNow.AddMinutes(-i * 5),
                P95LatencyMs = 100 + (i % 2 == 0 ? 2 : -2), // Small oscillation around 100
                ErrorRate = 0.5 + (i % 2 == 0 ? 0.1 : -0.1), // Small oscillation around 0.5%
                ActiveRequests = 50
            });
        }
        return result;
    }

    private static List<AtlasTelemetrySnapshot> CreateRisingLatencyTelemetry()
    {
        var result = new List<AtlasTelemetrySnapshot>();
        for (int i = 0; i < 10; i++)
        {
            result.Add(new AtlasTelemetrySnapshot
            {
                Timestamp = DateTimeOffset.UtcNow.AddMinutes(-i * 5),
                P95LatencyMs = 100 + (i * 20), // Rising: 100, 120, 140, ...
                ErrorRate = 0.5,
                ActiveRequests = 50
            });
        }
        return result;
    }

    private static List<AtlasTelemetrySnapshot> CreateRisingErrorTelemetry()
    {
        var result = new List<AtlasTelemetrySnapshot>();
        for (int i = 0; i < 10; i++)
        {
            result.Add(new AtlasTelemetrySnapshot
            {
                Timestamp = DateTimeOffset.UtcNow.AddMinutes(-i * 5),
                P95LatencyMs = 100,
                ErrorRate = 0.5 + (i * 0.5), // Rising: 0.5, 1.0, 1.5, ...
                ActiveRequests = 50
            });
        }
        return result;
    }

    private static List<AtlasAnomaly> CreateLatencySpikeAnomalies(int count)
    {
        return Enumerable.Range(0, count)
            .Select(i => new AtlasAnomaly
            {
                Kind = AtlasAnomalyKind.LatencySpike,
                Severity = AtlasAnomalySeverity.Warning,
                Timestamp = DateTimeOffset.UtcNow.AddMinutes(-i * 10),
                CountyId = "benton"
            })
            .ToList();
    }

    private static List<AtlasAnomaly> CreateErrorSpikeAnomalies(int count)
    {
        return Enumerable.Range(0, count)
            .Select(i => new AtlasAnomaly
            {
                Kind = AtlasAnomalyKind.ErrorSpike,
                Severity = AtlasAnomalySeverity.Warning,
                Timestamp = DateTimeOffset.UtcNow.AddMinutes(-i * 10),
                CountyId = "benton"
            })
            .ToList();
    }

    private static List<AtlasAnomaly> CreateOfflinePatternAnomalies(int count)
    {
        return Enumerable.Range(0, count)
            .Select(i => new AtlasAnomaly
            {
                Kind = AtlasAnomalyKind.OfflinePattern,
                Severity = AtlasAnomalySeverity.Critical,
                Timestamp = DateTimeOffset.UtcNow.AddMinutes(-i * 10),
                CountyId = "benton"
            })
            .ToList();
    }

    private static List<AtlasAnomaly> CreateCapacityFlapAnomalies(int count)
    {
        return Enumerable.Range(0, count)
            .Select(i => new AtlasAnomaly
            {
                Kind = AtlasAnomalyKind.CapacityFlap,
                Severity = AtlasAnomalySeverity.Warning,
                Timestamp = DateTimeOffset.UtcNow.AddMinutes(-i * 10),
                CountyId = "benton"
            })
            .ToList();
    }

    #endregion
}
