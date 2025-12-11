// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Atlas Forecast Store Tests
// TDD: Tests written FIRST before implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase32;

/// <summary>
/// Phase 32: Unit tests for the Atlas Forecast Store.
/// Tests forecast persistence and query operations.
/// </summary>
public class SystemGptAtlasForecastStoreTests
{
    private readonly Mock<ILogger<SystemGptAtlasForecastStore>> _loggerMock;

    public SystemGptAtlasForecastStoreTests()
    {
        _loggerMock = new Mock<ILogger<SystemGptAtlasForecastStore>>();
    }

    private SystemGptAtlasForecastStore CreateStore()
    {
        return new SystemGptAtlasForecastStore(_loggerMock.Object);
    }

    #region Save Operations

    [Fact]
    public async Task SaveAsync_PersistsForecast()
    {
        // Arrange
        var store = CreateStore();
        var forecast = CreateForecast("benton", AtlasRiskLevel.Moderate);

        // Act
        await store.SaveAsync(forecast);
        var result = await store.GetRecentAsync("benton");

        // Assert
        Assert.Single(result);
        Assert.Equal(forecast.Id, result[0].Id);
        Assert.Equal("benton", result[0].CountyId);
    }

    [Fact]
    public async Task SaveAsync_MultipleSameCounty_AllPersisted()
    {
        // Arrange
        var store = CreateStore();
        var forecast1 = CreateForecast("benton", AtlasRiskLevel.Low);
        var forecast2 = CreateForecast("benton", AtlasRiskLevel.Moderate);
        var forecast3 = CreateForecast("benton", AtlasRiskLevel.High);

        // Act
        await store.SaveAsync(forecast1);
        await store.SaveAsync(forecast2);
        await store.SaveAsync(forecast3);
        var result = await store.GetRecentAsync("benton");

        // Assert
        Assert.Equal(3, result.Count);
    }

    [Fact]
    public async Task SaveBatchAsync_PersistsAllForecasts()
    {
        // Arrange
        var store = CreateStore();
        var forecasts = new[]
        {
            CreateForecast("benton", AtlasRiskLevel.Low),
            CreateForecast("yakima", AtlasRiskLevel.Moderate),
            CreateForecast("spokane", AtlasRiskLevel.High)
        };

        // Act
        await store.SaveBatchAsync(forecasts);

        // Assert
        var benton = await store.GetRecentAsync("benton");
        var yakima = await store.GetRecentAsync("yakima");
        var spokane = await store.GetRecentAsync("spokane");

        Assert.Single(benton);
        Assert.Single(yakima);
        Assert.Single(spokane);
    }

    #endregion

    #region GetRecent Operations

    [Fact]
    public async Task GetRecentAsync_ReturnsAllForecasts_SortedByTimestampDescending()
    {
        // Arrange
        var store = CreateStore();
        var older = CreateForecast("benton", AtlasRiskLevel.Low, DateTimeOffset.UtcNow.AddHours(-2));
        var middle = CreateForecast("benton", AtlasRiskLevel.Moderate, DateTimeOffset.UtcNow.AddHours(-1));
        var newer = CreateForecast("benton", AtlasRiskLevel.High, DateTimeOffset.UtcNow);

        await store.SaveAsync(older);
        await store.SaveAsync(newer);
        await store.SaveAsync(middle);

        // Act
        var result = await store.GetRecentAsync();

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(newer.Id, result[0].Id); // Newest first
        Assert.Equal(middle.Id, result[1].Id);
        Assert.Equal(older.Id, result[2].Id);
    }

    [Fact]
    public async Task GetRecentAsync_FiltersByCountyId()
    {
        // Arrange
        var store = CreateStore();
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Low));
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Moderate));
        await store.SaveAsync(CreateForecast("yakima", AtlasRiskLevel.High));

        // Act
        var result = await store.GetRecentAsync("benton");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, f => Assert.Equal("benton", f.CountyId));
    }

    [Fact]
    public async Task GetRecentAsync_FiltersBySince()
    {
        // Arrange
        var store = CreateStore();
        var cutoff = DateTimeOffset.UtcNow.AddHours(-1);

        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Low, DateTimeOffset.UtcNow.AddHours(-2)));
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Moderate, DateTimeOffset.UtcNow.AddMinutes(-30)));
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.High, DateTimeOffset.UtcNow));

        // Act
        var result = await store.GetRecentAsync(since: cutoff);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, f => Assert.True(f.Timestamp >= cutoff));
    }

    [Fact]
    public async Task GetRecentAsync_CombinesFilters()
    {
        // Arrange
        var store = CreateStore();
        var cutoff = DateTimeOffset.UtcNow.AddHours(-1);

        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Low, DateTimeOffset.UtcNow.AddHours(-2)));
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Moderate, DateTimeOffset.UtcNow.AddMinutes(-30)));
        await store.SaveAsync(CreateForecast("yakima", AtlasRiskLevel.High, DateTimeOffset.UtcNow));

        // Act
        var result = await store.GetRecentAsync(countyId: "benton", since: cutoff);

        // Assert
        Assert.Single(result);
        Assert.Equal("benton", result[0].CountyId);
    }

    [Fact]
    public async Task GetRecentAsync_LimitsResults()
    {
        // Arrange
        var store = CreateStore();
        for (int i = 0; i < 10; i++)
        {
            await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Low));
        }

        // Act
        var result = await store.GetRecentAsync(limit: 5);

        // Assert
        Assert.Equal(5, result.Count);
    }

    [Fact]
    public async Task GetRecentAsync_EmptyStore_ReturnsEmptyList()
    {
        // Arrange
        var store = CreateStore();

        // Act
        var result = await store.GetRecentAsync();

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region GetSummary Operations

    [Fact]
    public async Task GetSummaryAsync_ReturnsCurrentSnapshotPerCounty()
    {
        // Arrange
        var store = CreateStore();

        // Benton: multiple forecasts, latest is High
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Low, DateTimeOffset.UtcNow.AddHours(-2)));
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.High, DateTimeOffset.UtcNow));

        // Yakima: single forecast, Moderate
        await store.SaveAsync(CreateForecast("yakima", AtlasRiskLevel.Moderate, DateTimeOffset.UtcNow.AddMinutes(-30)));

        // Act
        var summaries = await store.GetSummaryAsync();

        // Assert
        Assert.Equal(2, summaries.Count);

        var bentonSummary = summaries.First(s => s.CountyId == "benton");
        Assert.Equal(AtlasRiskLevel.High, bentonSummary.LatestOverallRisk);

        var yakimaSummary = summaries.First(s => s.CountyId == "yakima");
        Assert.Equal(AtlasRiskLevel.Moderate, yakimaSummary.LatestOverallRisk);
    }

    [Fact]
    public async Task GetSummaryAsync_IncludesHighestDimension()
    {
        // Arrange
        var store = CreateStore();
        var forecast = CreateForecast("benton", AtlasRiskLevel.High);
        forecast = forecast with
        {
            DimensionRisks = new Dictionary<AtlasRiskDimension, AtlasRiskLevel>
            {
                [AtlasRiskDimension.Latency] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.ErrorRate] = AtlasRiskLevel.Critical,
                [AtlasRiskDimension.Offline] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.Capacity] = AtlasRiskLevel.Moderate
            }
        };
        await store.SaveAsync(forecast);

        // Act
        var summaries = await store.GetSummaryAsync();

        // Assert
        Assert.Single(summaries);
        Assert.Equal(AtlasRiskDimension.ErrorRate, summaries[0].HighestDimension);
    }

    [Fact]
    public async Task GetSummaryAsync_EmptyStore_ReturnsEmptyList()
    {
        // Arrange
        var store = CreateStore();

        // Act
        var summaries = await store.GetSummaryAsync();

        // Assert
        Assert.Empty(summaries);
    }

    #endregion

    #region Cleanup Operations

    [Fact]
    public async Task ClearOldAsync_RemovesExpiredForecasts()
    {
        // Arrange
        var store = CreateStore();
        var maxAge = TimeSpan.FromHours(1);

        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Low, DateTimeOffset.UtcNow.AddHours(-3)));
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Moderate, DateTimeOffset.UtcNow.AddHours(-2)));
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.High, DateTimeOffset.UtcNow.AddMinutes(-30)));

        // Act
        var removed = await store.ClearOldAsync(maxAge);

        // Assert
        Assert.Equal(2, removed);
        var remaining = await store.GetRecentAsync();
        Assert.Single(remaining);
        Assert.Equal(AtlasRiskLevel.High, remaining[0].OverallRisk);
    }

    [Fact]
    public async Task ClearAsync_RemovesAllForecasts()
    {
        // Arrange
        var store = CreateStore();
        await store.SaveAsync(CreateForecast("benton", AtlasRiskLevel.Low));
        await store.SaveAsync(CreateForecast("yakima", AtlasRiskLevel.High));

        // Act
        await store.ClearAsync();
        var result = await store.GetRecentAsync();

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region Helper Methods

    private static AtlasForecastRecord CreateForecast(
        string countyId,
        AtlasRiskLevel overallRisk,
        DateTimeOffset? timestamp = null)
    {
        return new AtlasForecastRecord
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            Timestamp = timestamp ?? DateTimeOffset.UtcNow,
            Horizon = AtlasForecastHorizon.ShortTerm,
            OverallRisk = overallRisk,
            DimensionRisks = new Dictionary<AtlasRiskDimension, AtlasRiskLevel>
            {
                [AtlasRiskDimension.Latency] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.ErrorRate] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.Offline] = AtlasRiskLevel.Low,
                [AtlasRiskDimension.Capacity] = AtlasRiskLevel.Low
            },
            RecommendedAction = null,
            Confidence = 0.85,
            Reasoning = "Test forecast"
        };
    }

    #endregion
}
