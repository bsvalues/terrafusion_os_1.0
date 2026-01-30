// ─────────────────────────────────────────────────────────────────────────────
// TerraFusion OS — Phase 34: Atlas Forecast DI & Integration Tests
// ─────────────────────────────────────────────────────────────────────────────
// Tests for DI registration, service resolution, and end-to-end forecast flow.
// ─────────────────────────────────────────────────────────────────────────────

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.AI.Extensions;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase34;

/// <summary>
/// Phase 34: Tests for Atlas Forecast DI registration and service resolution.
/// </summary>
public class AtlasForecastDIRegistrationTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AddAtlasForecastCore Tests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AddAtlasForecastCore_RegistersForecastEngine()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Act
        services.AddAtlasForecastCore();
        var provider = services.BuildServiceProvider();

        // Assert
        var engine = provider.GetService<ISystemGptAtlasForecastEngine>();
        Assert.NotNull(engine);
        Assert.IsType<SystemGptAtlasForecastEngine>(engine);
    }

    [Fact]
    public void AddAtlasForecastCore_RegistersForecastStore()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Act
        services.AddAtlasForecastCore();
        var provider = services.BuildServiceProvider();

        // Assert
        var store = provider.GetService<ISystemGptAtlasForecastStore>();
        Assert.NotNull(store);
        Assert.IsType<SystemGptAtlasForecastStore>(store);
    }

    [Fact]
    public void AddAtlasForecastCore_EngineIsSingleton()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAtlasForecastCore();
        var provider = services.BuildServiceProvider();

        // Act
        var engine1 = provider.GetService<ISystemGptAtlasForecastEngine>();
        var engine2 = provider.GetService<ISystemGptAtlasForecastEngine>();

        // Assert
        Assert.Same(engine1, engine2);
    }

    [Fact]
    public void AddAtlasForecastCore_StoreIsSingleton()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAtlasForecastCore();
        var provider = services.BuildServiceProvider();

        // Act
        var store1 = provider.GetService<ISystemGptAtlasForecastStore>();
        var store2 = provider.GetService<ISystemGptAtlasForecastStore>();

        // Assert
        Assert.Same(store1, store2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AddAtlasForecastServices Tests (with Orchestrator)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AddAtlasForecastServices_RegistersHostedService()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Add required dependencies for orchestrator
        services.AddSingleton(Mock.Of<ISystemGptAtlasTelemetrySource>());
        services.AddSingleton(Mock.Of<ISystemGptAtlasAnomalyStore>());
        services.AddSingleton(Mock.Of<ISystemGptSwarmStateStore>());

        // Act
        services.AddAtlasForecastServices();
        var provider = services.BuildServiceProvider();

        // Assert - Check that hosted services include our orchestrator
        var hostedServices = provider.GetServices<IHostedService>();
        Assert.Contains(hostedServices, hs => hs is SystemGptAtlasForecastOrchestrator);
    }

    [Fact]
    public void AddAtlasForecastServices_ConfiguresDefaultOptions()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Add required dependencies
        services.AddSingleton(Mock.Of<ISystemGptAtlasTelemetrySource>());
        services.AddSingleton(Mock.Of<ISystemGptAtlasAnomalyStore>());
        services.AddSingleton(Mock.Of<ISystemGptSwarmStateStore>());

        // Act
        services.AddAtlasForecastServices();
        var provider = services.BuildServiceProvider();

        // Assert
        var options = provider.GetRequiredService<IOptions<AtlasForecastOrchestratorOptions>>();
        Assert.NotNull(options.Value);
        Assert.Equal(30, options.Value.IntervalSeconds); // Default
        Assert.Equal(TimeSpan.FromHours(1), options.Value.MaxForecastAge); // Default
    }

    [Fact]
    public void AddAtlasForecastServices_WithCustomOptions_ConfiguresCorrectly()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Add required dependencies
        services.AddSingleton(Mock.Of<ISystemGptAtlasTelemetrySource>());
        services.AddSingleton(Mock.Of<ISystemGptAtlasAnomalyStore>());
        services.AddSingleton(Mock.Of<ISystemGptSwarmStateStore>());

        // Act
        services.AddAtlasForecastServices(options =>
        {
            options.IntervalSeconds = 60;
            options.MaxForecastAge = TimeSpan.FromHours(2);
            options.CleanupIntervalTicks = 5;
        });
        var provider = services.BuildServiceProvider();

        // Assert
        var options = provider.GetRequiredService<IOptions<AtlasForecastOrchestratorOptions>>();
        Assert.Equal(60, options.Value.IntervalSeconds);
        Assert.Equal(TimeSpan.FromHours(2), options.Value.MaxForecastAge);
        Assert.Equal(5, options.Value.CleanupIntervalTicks);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Service Resolution Chain Tests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AddAtlasForecastServices_OrchestratorResolvesEngineAndStore()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Add required dependencies
        services.AddSingleton(Mock.Of<ISystemGptAtlasTelemetrySource>());
        services.AddSingleton(Mock.Of<ISystemGptAtlasAnomalyStore>());
        services.AddSingleton(Mock.Of<ISystemGptSwarmStateStore>());

        // Act
        services.AddAtlasForecastServices();
        var provider = services.BuildServiceProvider();

        // Assert - Orchestrator should be resolvable (which means all its deps are too)
        var orchestrator = provider.GetServices<IHostedService>()
            .OfType<SystemGptAtlasForecastOrchestrator>()
            .FirstOrDefault();

        Assert.NotNull(orchestrator);
    }

    [Fact]
    public void AddAtlasForecastServices_AllServicesShareSameStoreInstance()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Add required dependencies
        services.AddSingleton(Mock.Of<ISystemGptAtlasTelemetrySource>());
        services.AddSingleton(Mock.Of<ISystemGptAtlasAnomalyStore>());
        services.AddSingleton(Mock.Of<ISystemGptSwarmStateStore>());

        // Act
        services.AddAtlasForecastServices();
        var provider = services.BuildServiceProvider();

        // Get store directly
        var store = provider.GetRequiredService<ISystemGptAtlasForecastStore>();

        // Get store via controller (if we had one injected)
        var storeAgain = provider.GetRequiredService<ISystemGptAtlasForecastStore>();

        // Assert
        Assert.Same(store, storeAgain);
    }
}

/// <summary>
/// Phase 34: End-to-end integration tests for forecast flow.
/// </summary>
public class AtlasForecastIntegrationTests
{
    [Fact]
    public async Task ForecastEngine_ComputesAndStoresSaves_EndToEnd()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAtlasForecastCore();

        var provider = services.BuildServiceProvider();
        var engine = provider.GetRequiredService<ISystemGptAtlasForecastEngine>();
        var store = provider.GetRequiredService<ISystemGptAtlasForecastStore>();

        var input = new AtlasForecastInput
        {
            CountyId = "integration-test-county",
            TelemetryHistory = new List<AtlasTelemetrySnapshot>
            {
                new()
                {
                    Timestamp = DateTimeOffset.UtcNow.AddMinutes(-5),
                    P95LatencyMs = 100,
                    ErrorRate = 0.01,
                    HealthState = "healthy"
                }
            },
            RecentAnomalies = new List<AtlasAnomaly>(),
            SwarmState = new SwarmState
            {
                CountyId = "integration-test-county",
                ActiveAgents = 10,
                QueueDepth = 5,
                SafeModeEnabled = false,
                ModeHistory = new List<SwarmMode>()
            }
        };

        // Act
        var forecast = await engine.ComputeForecast(input);
        await store.SaveAsync(forecast);
        var retrieved = await store.GetRecentAsync("integration-test-county", null);

        // Assert
        Assert.NotNull(forecast);
        Assert.Equal("integration-test-county", forecast.CountyId);
        Assert.Single(retrieved);
        Assert.Equal(forecast.Id, retrieved.First().Id);
    }

    [Fact]
    public async Task ForecastStore_GetSummary_ReturnsLatestPerCounty()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAtlasForecastCore();

        var provider = services.BuildServiceProvider();
        var store = provider.GetRequiredService<ISystemGptAtlasForecastStore>();

        // Save multiple forecasts for same county
        var oldForecast = new AtlasForecastRecord
        {
            Id = Guid.NewGuid(),
            CountyId = "summary-test",
            Timestamp = DateTimeOffset.UtcNow.AddMinutes(-10),
            Horizon = AtlasForecastHorizon.ShortTerm,
            DimensionRisks = new Dictionary<AtlasRiskDimension, AtlasRiskLevel>
            {
                { AtlasRiskDimension.Latency, AtlasRiskLevel.Low }
            },
            OverallRisk = AtlasRiskLevel.Low
        };

        var newForecast = new AtlasForecastRecord
        {
            Id = Guid.NewGuid(),
            CountyId = "summary-test",
            Timestamp = DateTimeOffset.UtcNow,
            Horizon = AtlasForecastHorizon.ShortTerm,
            DimensionRisks = new Dictionary<AtlasRiskDimension, AtlasRiskLevel>
            {
                { AtlasRiskDimension.Latency, AtlasRiskLevel.High }
            },
            OverallRisk = AtlasRiskLevel.High
        };

        await store.SaveAsync(oldForecast);
        await store.SaveAsync(newForecast);

        // Act
        var summaries = await store.GetSummaryAsync();

        // Assert
        var summary = summaries.FirstOrDefault(s => s.CountyId == "summary-test");
        Assert.NotNull(summary);
        Assert.Equal(AtlasRiskLevel.High, summary.LatestOverallRisk); // Latest
    }
}
