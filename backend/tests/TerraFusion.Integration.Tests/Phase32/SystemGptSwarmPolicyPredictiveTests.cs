// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Swarm Policy Predictive Tests
// TDD: Tests written FIRST before implementation
// Tests predictive swarm actions driven by forecast risk
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
/// Phase 32: Unit tests for predictive swarm actions based on forecasts.
/// Tests integration between Forecast Engine and Swarm Policy Service.
/// </summary>
public class SystemGptSwarmPolicyPredictiveTests
{
    private readonly Mock<ISystemGptAtlasForecastEngine> _forecastEngineMock;
    private readonly Mock<ISystemGptSwarmStateStore> _stateStoreMock;
    private readonly Mock<ILogger<SystemGptSwarmPolicyService>> _loggerMock;

    public SystemGptSwarmPolicyPredictiveTests()
    {
        _forecastEngineMock = new Mock<ISystemGptAtlasForecastEngine>();
        _stateStoreMock = new Mock<ISystemGptSwarmStateStore>();
        _loggerMock = new Mock<ILogger<SystemGptSwarmPolicyService>>();
    }

    private SystemGptSwarmPolicyService CreatePolicyService(SwarmPolicyOptions? options = null)
    {
        var opts = Options.Create(options ?? new SwarmPolicyOptions
        {
            PredictiveActionsEnabled = true,
            PredictiveCooldownMinutes = 5
        });

        return new SystemGptSwarmPolicyService(
            _stateStoreMock.Object,
            _forecastEngineMock.Object,
            opts,
            _loggerMock.Object);
    }

    #region Predictive Action Trigger

    [Fact]
    public async Task EvaluatePredictiveAsync_HighLatencyRisk_ReturnsIncreaseCapacityDecision()
    {
        // Arrange
        var forecast = CreateForecast("benton", AtlasRiskLevel.High, AtlasRiskDimension.Latency);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync(forecast);

        var service = CreatePolicyService();

        // Act
        var decision = await service.EvaluatePredictiveAsync("benton");

        // Assert
        Assert.NotNull(decision);
        Assert.True(decision.IsPredictive);
        Assert.Equal(SwarmActionKind.IncreaseCapacity, decision.RecommendedAction);
        Assert.Contains("forecast", decision.Reasoning.ToLower());
    }

    [Fact]
    public async Task EvaluatePredictiveAsync_HighErrorRisk_ReturnsRouteToSafeModelDecision()
    {
        // Arrange
        var forecast = CreateForecast("benton", AtlasRiskLevel.High, AtlasRiskDimension.ErrorRate);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync(forecast);

        var service = CreatePolicyService();

        // Act
        var decision = await service.EvaluatePredictiveAsync("benton");

        // Assert
        Assert.NotNull(decision);
        Assert.True(decision.IsPredictive);
        Assert.Equal(SwarmActionKind.RouteToSafeModel, decision.RecommendedAction);
    }

    [Fact]
    public async Task EvaluatePredictiveAsync_CriticalOfflineRisk_ReturnsEnableSafeModeDecision()
    {
        // Arrange
        var forecast = CreateForecast("benton", AtlasRiskLevel.Critical, AtlasRiskDimension.Offline);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync(forecast);

        var service = CreatePolicyService();

        // Act
        var decision = await service.EvaluatePredictiveAsync("benton");

        // Assert
        Assert.NotNull(decision);
        Assert.True(decision.IsPredictive);
        Assert.Equal(SwarmActionKind.EnableSafeMode, decision.RecommendedAction);
    }

    [Fact]
    public async Task EvaluatePredictiveAsync_LowRisk_ReturnsNoActionDecision()
    {
        // Arrange
        var forecast = CreateForecast("benton", AtlasRiskLevel.Low, AtlasRiskDimension.Latency);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync(forecast);

        var service = CreatePolicyService();

        // Act
        var decision = await service.EvaluatePredictiveAsync("benton");

        // Assert
        Assert.NotNull(decision);
        Assert.True(decision.IsPredictive);
        Assert.Null(decision.RecommendedAction);
    }

    #endregion

    #region Predictive Cooldown

    [Fact]
    public async Task EvaluatePredictiveAsync_WithinCooldown_SkipsAction()
    {
        // Arrange
        var forecast = CreateForecast("benton", AtlasRiskLevel.High, AtlasRiskDimension.Latency);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync(forecast);

        var service = CreatePolicyService(new SwarmPolicyOptions
        {
            PredictiveActionsEnabled = true,
            PredictiveCooldownMinutes = 5
        });

        // Act - first call should succeed
        var firstDecision = await service.EvaluatePredictiveAsync("benton");

        // Act - second call within cooldown should skip
        var secondDecision = await service.EvaluatePredictiveAsync("benton");

        // Assert
        Assert.NotNull(firstDecision);
        Assert.Equal(SwarmActionKind.IncreaseCapacity, firstDecision.RecommendedAction);

        Assert.NotNull(secondDecision);
        Assert.True(secondDecision.IsSkippedDueToCooldown);
        Assert.Null(secondDecision.RecommendedAction);
    }

    [Fact]
    public async Task EvaluatePredictiveAsync_DifferentCounties_NoCooldownInterference()
    {
        // Arrange
        var bentonForecast = CreateForecast("benton", AtlasRiskLevel.High, AtlasRiskDimension.Latency);
        var yakimaForecast = CreateForecast("yakima", AtlasRiskLevel.High, AtlasRiskDimension.ErrorRate);

        _forecastEngineMock.Setup(e => e.ComputeForecast(It.Is<AtlasForecastInput>(i => i.CountyId == "benton")))
            .ReturnsAsync(bentonForecast);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.Is<AtlasForecastInput>(i => i.CountyId == "yakima")))
            .ReturnsAsync(yakimaForecast);

        var service = CreatePolicyService();

        // Act
        var bentonDecision = await service.EvaluatePredictiveAsync("benton");
        var yakimaDecision = await service.EvaluatePredictiveAsync("yakima");

        // Assert - both should get actions (different counties)
        Assert.NotNull(bentonDecision);
        Assert.Equal(SwarmActionKind.IncreaseCapacity, bentonDecision.RecommendedAction);
        Assert.False(bentonDecision.IsSkippedDueToCooldown);

        Assert.NotNull(yakimaDecision);
        Assert.Equal(SwarmActionKind.RouteToSafeModel, yakimaDecision.RecommendedAction);
        Assert.False(yakimaDecision.IsSkippedDueToCooldown);
    }

    #endregion

    #region Predictive Actions Disabled

    [Fact]
    public async Task EvaluatePredictiveAsync_Disabled_ReturnsNoAction()
    {
        // Arrange
        var forecast = CreateForecast("benton", AtlasRiskLevel.Critical, AtlasRiskDimension.Offline);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync(forecast);

        var service = CreatePolicyService(new SwarmPolicyOptions
        {
            PredictiveActionsEnabled = false
        });

        // Act
        var decision = await service.EvaluatePredictiveAsync("benton");

        // Assert
        Assert.NotNull(decision);
        Assert.True(decision.IsPredictive);
        Assert.Null(decision.RecommendedAction);
        Assert.Contains("disabled", decision.Reasoning.ToLower());
    }

    #endregion

    #region IsPredictive Flag

    [Fact]
    public async Task EvaluatePredictiveAsync_AlwaysSetsIsPredictiveFlag()
    {
        // Arrange
        var forecast = CreateForecast("benton", AtlasRiskLevel.Moderate, AtlasRiskDimension.Capacity);
        _forecastEngineMock.Setup(e => e.ComputeForecast(It.IsAny<AtlasForecastInput>()))
            .ReturnsAsync(forecast);

        var service = CreatePolicyService();

        // Act
        var decision = await service.EvaluatePredictiveAsync("benton");

        // Assert
        Assert.True(decision.IsPredictive);
    }

    [Fact]
    public async Task EvaluateAsync_ReactiveMode_IsPredictiveFalse()
    {
        // Arrange - set up state for reactive evaluation
        var state = new SwarmStateSnapshot
        {
            CountyId = "benton",
            Mode = SwarmMode.Normal,
            CurrentCapacity = 50
        };
        _stateStoreMock.Setup(s => s.GetState("benton"))
            .Returns(state);

        var service = CreatePolicyService();

        // Act
        var decision = await service.EvaluateAsync("benton");

        // Assert
        Assert.False(decision.IsPredictive);
    }

    #endregion

    #region Helper Methods

    private static AtlasForecastRecord CreateForecast(
        string countyId,
        AtlasRiskLevel overallRisk,
        AtlasRiskDimension highestDimension)
    {
        var dimensionRisks = new Dictionary<AtlasRiskDimension, AtlasRiskLevel>
        {
            [AtlasRiskDimension.Latency] = AtlasRiskLevel.Low,
            [AtlasRiskDimension.ErrorRate] = AtlasRiskLevel.Low,
            [AtlasRiskDimension.Offline] = AtlasRiskLevel.Low,
            [AtlasRiskDimension.Capacity] = AtlasRiskLevel.Low
        };
        dimensionRisks[highestDimension] = overallRisk;

        SwarmActionKind? recommendedAction = overallRisk switch
        {
            AtlasRiskLevel.High when highestDimension == AtlasRiskDimension.Latency => SwarmActionKind.IncreaseCapacity,
            AtlasRiskLevel.High when highestDimension == AtlasRiskDimension.Capacity => SwarmActionKind.IncreaseCapacity,
            AtlasRiskLevel.High when highestDimension == AtlasRiskDimension.ErrorRate => SwarmActionKind.RouteToSafeModel,
            AtlasRiskLevel.Critical when highestDimension == AtlasRiskDimension.Offline => SwarmActionKind.EnableSafeMode,
            _ => null
        };

        return new AtlasForecastRecord
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            Timestamp = DateTimeOffset.UtcNow,
            Horizon = AtlasForecastHorizon.ShortTerm,
            OverallRisk = overallRisk,
            DimensionRisks = dimensionRisks,
            RecommendedAction = recommendedAction,
            Confidence = 0.85,
            Reasoning = $"Test forecast with {highestDimension} at {overallRisk}"
        };
    }

    #endregion
}
