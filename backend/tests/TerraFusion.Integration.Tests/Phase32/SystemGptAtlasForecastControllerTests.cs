// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Atlas Forecast Controller Tests
// TDD: Tests written FIRST before implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Controllers;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase32;

/// <summary>
/// Phase 32: Unit tests for the Atlas Forecast Controller.
/// Tests REST API endpoints for forecast queries.
/// </summary>
public class SystemGptAtlasForecastControllerTests
{
    private readonly Mock<ISystemGptAtlasForecastStore> _storeMock;
    private readonly Mock<ILogger<SystemGptAtlasForecastController>> _loggerMock;

    public SystemGptAtlasForecastControllerTests()
    {
        _storeMock = new Mock<ISystemGptAtlasForecastStore>();
        _loggerMock = new Mock<ILogger<SystemGptAtlasForecastController>>();
    }

    private SystemGptAtlasForecastController CreateController()
    {
        return new SystemGptAtlasForecastController(_storeMock.Object, _loggerMock.Object);
    }

    #region GET /api/gpt/system/atlas/forecasts

    [Fact]
    public async Task GetForecasts_ReturnsOkWithForecasts()
    {
        // Arrange
        var forecasts = new List<AtlasForecastRecord>
        {
            CreateForecast("benton", AtlasRiskLevel.High),
            CreateForecast("yakima", AtlasRiskLevel.Moderate)
        };
        _storeMock.Setup(s => s.GetRecentAsync(null, null, 100))
            .ReturnsAsync(forecasts);

        var controller = CreateController();

        // Act
        var result = await controller.GetForecasts();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IEnumerable<AtlasForecastRecord>>(okResult.Value);
        Assert.Equal(2, returned.Count());
    }

    [Fact]
    public async Task GetForecasts_WithCountyFilter_PassesFilterToStore()
    {
        // Arrange
        var forecasts = new List<AtlasForecastRecord>
        {
            CreateForecast("benton", AtlasRiskLevel.High)
        };
        _storeMock.Setup(s => s.GetRecentAsync("benton", null, 100))
            .ReturnsAsync(forecasts);

        var controller = CreateController();

        // Act
        var result = await controller.GetForecasts(countyId: "benton");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IEnumerable<AtlasForecastRecord>>(okResult.Value);
        Assert.Single(returned);
        Assert.All(returned, f => Assert.Equal("benton", f.CountyId));
    }

    [Fact]
    public async Task GetForecasts_WithSinceFilter_PassesFilterToStore()
    {
        // Arrange
        var since = DateTimeOffset.UtcNow.AddHours(-1);
        var forecasts = new List<AtlasForecastRecord>
        {
            CreateForecast("benton", AtlasRiskLevel.High)
        };
        _storeMock.Setup(s => s.GetRecentAsync(null, since, 100))
            .ReturnsAsync(forecasts);

        var controller = CreateController();

        // Act
        var result = await controller.GetForecasts(since: since);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        _storeMock.Verify(s => s.GetRecentAsync(null, since, 100), Times.Once);
    }

    [Fact]
    public async Task GetForecasts_WithLimitFilter_PassesLimitToStore()
    {
        // Arrange
        var forecasts = new List<AtlasForecastRecord>
        {
            CreateForecast("benton", AtlasRiskLevel.High)
        };
        _storeMock.Setup(s => s.GetRecentAsync(null, null, 10))
            .ReturnsAsync(forecasts);

        var controller = CreateController();

        // Act
        var result = await controller.GetForecasts(limit: 10);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        _storeMock.Verify(s => s.GetRecentAsync(null, null, 10), Times.Once);
    }

    [Fact]
    public async Task GetForecasts_EmptyStore_ReturnsOkWithEmptyList()
    {
        // Arrange
        _storeMock.Setup(s => s.GetRecentAsync(null, null, 100))
            .ReturnsAsync(new List<AtlasForecastRecord>());

        var controller = CreateController();

        // Act
        var result = await controller.GetForecasts();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IEnumerable<AtlasForecastRecord>>(okResult.Value);
        Assert.Empty(returned);
    }

    #endregion

    #region GET /api/gpt/system/atlas/forecasts/summary

    [Fact]
    public async Task GetSummary_ReturnsOkWithSummaries()
    {
        // Arrange
        var summaries = new List<AtlasForecastSummary>
        {
            new AtlasForecastSummary
            {
                CountyId = "benton",
                LatestOverallRisk = AtlasRiskLevel.High,
                HighestDimension = AtlasRiskDimension.Latency,
                LastUpdated = DateTimeOffset.UtcNow,
                ForecastCount = 5,
                RecommendedAction = SwarmActionKind.IncreaseCapacity
            },
            new AtlasForecastSummary
            {
                CountyId = "yakima",
                LatestOverallRisk = AtlasRiskLevel.Low,
                HighestDimension = AtlasRiskDimension.ErrorRate,
                LastUpdated = DateTimeOffset.UtcNow,
                ForecastCount = 3,
                RecommendedAction = null
            }
        };
        _storeMock.Setup(s => s.GetSummaryAsync())
            .ReturnsAsync(summaries);

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IEnumerable<AtlasForecastSummary>>(okResult.Value);
        Assert.Equal(2, returned.Count());
    }

    [Fact]
    public async Task GetSummary_EmptyStore_ReturnsOkWithEmptyList()
    {
        // Arrange
        _storeMock.Setup(s => s.GetSummaryAsync())
            .ReturnsAsync(new List<AtlasForecastSummary>());

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IEnumerable<AtlasForecastSummary>>(okResult.Value);
        Assert.Empty(returned);
    }

    [Fact]
    public async Task GetSummary_IncludesRecommendedActions()
    {
        // Arrange
        var summaries = new List<AtlasForecastSummary>
        {
            new AtlasForecastSummary
            {
                CountyId = "benton",
                LatestOverallRisk = AtlasRiskLevel.Critical,
                HighestDimension = AtlasRiskDimension.Offline,
                LastUpdated = DateTimeOffset.UtcNow,
                ForecastCount = 1,
                RecommendedAction = SwarmActionKind.EnableSafeMode
            }
        };
        _storeMock.Setup(s => s.GetSummaryAsync())
            .ReturnsAsync(summaries);

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsAssignableFrom<IEnumerable<AtlasForecastSummary>>(okResult.Value).ToList();
        Assert.Single(returned);
        Assert.Equal(SwarmActionKind.EnableSafeMode, returned[0].RecommendedAction);
    }

    #endregion

    #region Error Handling

    [Fact]
    public async Task GetForecasts_StoreThrows_Returns500()
    {
        // Arrange
        _storeMock.Setup(s => s.GetRecentAsync(null, null, 100))
            .ThrowsAsync(new InvalidOperationException("Store failure"));

        var controller = CreateController();

        // Act
        var result = await controller.GetForecasts();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetSummary_StoreThrows_Returns500()
    {
        // Arrange
        _storeMock.Setup(s => s.GetSummaryAsync())
            .ThrowsAsync(new InvalidOperationException("Store failure"));

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    #endregion

    #region Helper Methods

    private static AtlasForecastRecord CreateForecast(string countyId, AtlasRiskLevel overallRisk)
    {
        return new AtlasForecastRecord
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            Timestamp = DateTimeOffset.UtcNow,
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
