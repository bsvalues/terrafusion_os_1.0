// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 PHASE 31: SystemGPT Atlas Anomaly Controller Tests
// TDD: Tests written FIRST before implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Controllers;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase31;

/// <summary>
/// Phase 31: Unit tests for the Atlas Anomaly Controller.
/// Tests REST API endpoints for anomaly retrieval and summary.
/// </summary>
public class SystemGptAtlasAnomalyControllerTests
{
    private readonly Mock<ISystemGptAtlasAnomalyStore> _storeMock;
    private readonly Mock<ILogger<SystemGptAtlasAnomalyController>> _loggerMock;

    public SystemGptAtlasAnomalyControllerTests()
    {
        _storeMock = new Mock<ISystemGptAtlasAnomalyStore>();
        _loggerMock = new Mock<ILogger<SystemGptAtlasAnomalyController>>();
    }

    private SystemGptAtlasAnomalyController CreateController()
    {
        return new SystemGptAtlasAnomalyController(_storeMock.Object, _loggerMock.Object);
    }

    #region GET /api/gpt/system/atlas/anomalies

    [Fact]
    public async Task GetAnomalies_ReturnsOkWithAnomalies()
    {
        // Arrange
        var anomalies = new List<SystemGptAtlasAnomalyEventDto>
        {
            CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike),
            CreateAnomaly("yakima", AtlasAnomalyKind.ErrorSpike)
        };
        _storeMock.Setup(s => s.GetRecent(null, null, null, null))
            .Returns(anomalies);

        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedAnomalies = Assert.IsAssignableFrom<IList<SystemGptAtlasAnomalyEventDto>>(okResult.Value);
        Assert.Equal(2, returnedAnomalies.Count);
    }

    [Fact]
    public async Task GetAnomalies_FiltersByCountyId()
    {
        // Arrange
        var bentonAnomalies = new List<SystemGptAtlasAnomalyEventDto>
        {
            CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike)
        };
        _storeMock.Setup(s => s.GetRecent("benton", null, null, null))
            .Returns(bentonAnomalies);

        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies(countyId: "benton");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedAnomalies = Assert.IsAssignableFrom<IList<SystemGptAtlasAnomalyEventDto>>(okResult.Value);
        Assert.Single(returnedAnomalies);
        Assert.Equal("benton", returnedAnomalies[0].CountyId);
    }

    [Fact]
    public async Task GetAnomalies_FiltersBySince()
    {
        // Arrange
        var since = DateTimeOffset.UtcNow.AddHours(-1);
        var recentAnomalies = new List<SystemGptAtlasAnomalyEventDto>
        {
            CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike)
        };
        _storeMock.Setup(s => s.GetRecent(null, since, null, null))
            .Returns(recentAnomalies);

        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies(since: since);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        _storeMock.Verify(s => s.GetRecent(null, since, null, null), Times.Once);
    }

    [Fact]
    public async Task GetAnomalies_FiltersBySeverity()
    {
        // Arrange
        var criticalAnomalies = new List<SystemGptAtlasAnomalyEventDto>
        {
            CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike,
                severity: AtlasAnomalySeverity.Critical)
        };
        _storeMock.Setup(s => s.GetRecent(null, null, AtlasAnomalySeverity.Critical, null))
            .Returns(criticalAnomalies);

        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies(minSeverity: "Critical");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedAnomalies = Assert.IsAssignableFrom<IList<SystemGptAtlasAnomalyEventDto>>(okResult.Value);
        Assert.All(returnedAnomalies, a => Assert.Equal(AtlasAnomalySeverity.Critical, a.Severity));
    }

    [Fact]
    public async Task GetAnomalies_RespectsLimit()
    {
        // Arrange
        var limitedAnomalies = Enumerable.Range(0, 10)
            .Select(_ => CreateAnomaly("benton", AtlasAnomalyKind.LatencySpike))
            .ToList();
        _storeMock.Setup(s => s.GetRecent(null, null, null, 10))
            .Returns(limitedAnomalies);

        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies(limit: 10);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedAnomalies = Assert.IsAssignableFrom<IList<SystemGptAtlasAnomalyEventDto>>(okResult.Value);
        Assert.Equal(10, returnedAnomalies.Count);
    }

    [Fact]
    public async Task GetAnomalies_InvalidSeverity_ReturnsBadRequest()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies(minSeverity: "InvalidSeverity");

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetAnomalies_EmptyStore_ReturnsEmptyList()
    {
        // Arrange
        _storeMock.Setup(s => s.GetRecent(null, null, null, null))
            .Returns(new List<SystemGptAtlasAnomalyEventDto>());

        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedAnomalies = Assert.IsAssignableFrom<IList<SystemGptAtlasAnomalyEventDto>>(okResult.Value);
        Assert.Empty(returnedAnomalies);
    }

    #endregion

    #region GET /api/gpt/system/atlas/anomalies/summary

    [Fact]
    public async Task GetSummary_ReturnsOkWithSummaries()
    {
        // Arrange
        var summaries = new List<SystemGptAtlasAnomalySummaryDto>
        {
            new SystemGptAtlasAnomalySummaryDto
            {
                CountyId = "benton",
                TotalCount = 5,
                InfoCount = 1,
                WarningCount = 2,
                CriticalCount = 2
            }
        };
        _storeMock.Setup(s => s.GetSummary(null))
            .Returns(summaries);

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSummaries = Assert.IsAssignableFrom<IList<SystemGptAtlasAnomalySummaryDto>>(okResult.Value);
        Assert.Single(returnedSummaries);
        Assert.Equal("benton", returnedSummaries[0].CountyId);
        Assert.Equal(5, returnedSummaries[0].TotalCount);
    }

    [Fact]
    public async Task GetSummary_FiltersBySince()
    {
        // Arrange
        var since = DateTimeOffset.UtcNow.AddHours(-1);
        var summaries = new List<SystemGptAtlasAnomalySummaryDto>();
        _storeMock.Setup(s => s.GetSummary(since))
            .Returns(summaries);

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary(since: since);

        // Assert
        _storeMock.Verify(s => s.GetSummary(since), Times.Once);
    }

    [Fact]
    public async Task GetSummary_EmptyStore_ReturnsEmptyList()
    {
        // Arrange
        _storeMock.Setup(s => s.GetSummary(null))
            .Returns(new List<SystemGptAtlasAnomalySummaryDto>());

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSummaries = Assert.IsAssignableFrom<IList<SystemGptAtlasAnomalySummaryDto>>(okResult.Value);
        Assert.Empty(returnedSummaries);
    }

    #endregion

    #region GET /api/gpt/system/atlas/anomalies/{countyId}/summary

    [Fact]
    public async Task GetCountySummary_ReturnsOkWithSummary()
    {
        // Arrange
        var summary = new SystemGptAtlasAnomalySummaryDto
        {
            CountyId = "benton",
            TotalCount = 3,
            InfoCount = 0,
            WarningCount = 2,
            CriticalCount = 1
        };
        _storeMock.Setup(s => s.GetSummaryByCounty("benton"))
            .Returns(summary);

        var controller = CreateController();

        // Act
        var result = await controller.GetCountySummary("benton");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSummary = Assert.IsType<SystemGptAtlasAnomalySummaryDto>(okResult.Value);
        Assert.Equal("benton", returnedSummary.CountyId);
        Assert.Equal(3, returnedSummary.TotalCount);
    }

    [Fact]
    public async Task GetCountySummary_NonExistentCounty_ReturnsEmptySummary()
    {
        // Arrange
        var summary = new SystemGptAtlasAnomalySummaryDto
        {
            CountyId = "nonexistent",
            TotalCount = 0,
            InfoCount = 0,
            WarningCount = 0,
            CriticalCount = 0
        };
        _storeMock.Setup(s => s.GetSummaryByCounty("nonexistent"))
            .Returns(summary);

        var controller = CreateController();

        // Act
        var result = await controller.GetCountySummary("nonexistent");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSummary = Assert.IsType<SystemGptAtlasAnomalySummaryDto>(okResult.Value);
        Assert.Equal(0, returnedSummary.TotalCount);
    }

    #endregion

    #region Error Handling

    [Fact]
    public async Task GetAnomalies_StoreThrows_Returns500()
    {
        // Arrange
        _storeMock.Setup(s => s.GetRecent(null, null, null, null))
            .Throws(new InvalidOperationException("Store error"));

        var controller = CreateController();

        // Act
        var result = await controller.GetAnomalies();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetSummary_StoreThrows_Returns500()
    {
        // Arrange
        _storeMock.Setup(s => s.GetSummary(null))
            .Throws(new InvalidOperationException("Store error"));

        var controller = CreateController();

        // Act
        var result = await controller.GetSummary();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    #endregion

    #region Helper Methods

    private static SystemGptAtlasAnomalyEventDto CreateAnomaly(
        string countyId,
        AtlasAnomalyKind kind,
        AtlasAnomalySeverity severity = AtlasAnomalySeverity.Warning,
        DateTimeOffset? timestamp = null)
    {
        return new SystemGptAtlasAnomalyEventDto
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            Kind = kind,
            Severity = severity,
            Timestamp = timestamp ?? DateTimeOffset.UtcNow,
            Reason = $"Test anomaly: {kind}",
            MetricValue = 100.0,
            ThresholdValue = 50.0
        };
    }

    #endregion
}
