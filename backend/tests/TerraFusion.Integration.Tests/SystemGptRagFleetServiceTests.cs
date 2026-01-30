// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TerraFusion RAG Fleet Readiness Tests
// Phase 27: Multi-County RAG Fleet Readiness & Drift Detection
// "Detect when one county's valuation knowledge falls behind another's."
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 27: Integration tests for SystemGptRagFleetService - Multi-County RAG Drift Detection.
/// Tests drift detection logic, county comparisons, and advisory generation.
/// </summary>
public class SystemGptRagFleetServiceTests
{
    private readonly Mock<ILogger<SystemGptRagFleetService>> _mockLogger;
    private readonly Mock<IBentonRagReadinessService> _mockBentonRagService;

    public SystemGptRagFleetServiceTests()
    {
        _mockLogger = new Mock<ILogger<SystemGptRagFleetService>>();
        _mockBentonRagService = new Mock<IBentonRagReadinessService>();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SERVICE INSTANTIATION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Constructor_WithNullBentonService_DoesNotThrow()
    {
        // Arrange & Act
        var service = new SystemGptRagFleetService(
            _mockLogger.Object,
            bentonRagService: null);

        // Assert
        Assert.NotNull(service);
    }

    [Fact]
    public void Constructor_WithBentonService_DoesNotThrow()
    {
        // Arrange & Act
        var service = new SystemGptRagFleetService(
            _mockLogger.Object,
            _mockBentonRagService.Object);

        // Assert
        Assert.NotNull(service);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // GET FLEET READINESS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetFleetReadinessAsync_ReturnsAllCounties()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        Assert.NotNull(result);
        Assert.True(result.TotalCounties >= 1); // At least Benton
        Assert.NotNull(result.Counties);
        Assert.True(result.Counties.Count >= 1);
    }

    [Fact]
    public async Task GetFleetReadinessAsync_ReturnsValidTimestamp()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var before = DateTimeOffset.UtcNow;
        var result = await service.GetFleetReadinessAsync();
        var after = DateTimeOffset.UtcNow;

        // Assert
        Assert.True(result.GeneratedAtUtc >= before);
        Assert.True(result.GeneratedAtUtc <= after);
    }

    [Fact]
    public async Task GetFleetReadinessAsync_WithHealthyBenton_ReturnsLowDrift()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        // Note: With only one configured county, drift should be Low (no comparison possible)
        Assert.Equal(RagFleetDriftRisk.Low, result.FleetDriftRisk);
    }

    [Fact]
    public async Task GetFleetReadinessAsync_WhenBentonServiceNull_ReturnsGracefulResponse()
    {
        // Arrange
        var service = new SystemGptRagFleetService(_mockLogger.Object, bentonRagService: null);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Counties);
        // Benton should still appear in list but as Unknown
        var bentonCounty = result.Counties.FirstOrDefault(c =>
            c.CountyId.Equals("benton", StringComparison.OrdinalIgnoreCase));
        Assert.NotNull(bentonCounty);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DRIFT DETECTION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetFleetReadinessAsync_IncludesAdvisoryMessage()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        Assert.False(string.IsNullOrEmpty(result.Advisory));
    }

    [Fact]
    public async Task GetFleetReadinessAsync_IncludesDriftConditions()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        Assert.NotNull(result.DriftConditions);
    }

    [Fact]
    public async Task GetFleetReadinessAsync_WithStaleIndex_DetectsDrift()
    {
        // Arrange
        SetupStaleBentonRag(hoursOld: 72); // 72 hours old = critical
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        // Should have Stale status for Benton
        var bentonCounty = result.Counties.FirstOrDefault(c =>
            c.CountyId.Equals("benton", StringComparison.OrdinalIgnoreCase));
        Assert.NotNull(bentonCounty);
        Assert.Equal("Stale", bentonCounty.RagStatus);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // COUNTY READINESS DETAIL TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetCountyReadinessAsync_ForBenton_ReturnsDetails()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetCountyReadinessAsync("benton");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("benton", result.CountyId);
        Assert.True(result.Configured);
        Assert.Equal("Ready", result.RagStatus);
    }

    [Fact]
    public async Task GetCountyReadinessAsync_ForUnknownCounty_ReturnsNull()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetCountyReadinessAsync("unknown_county_xyz");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetCountyReadinessAsync_IsCaseInsensitive()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var lowerResult = await service.GetCountyReadinessAsync("benton");
        var upperResult = await service.GetCountyReadinessAsync("BENTON");
        var mixedResult = await service.GetCountyReadinessAsync("Benton");

        // Assert
        Assert.NotNull(lowerResult);
        Assert.NotNull(upperResult);
        Assert.NotNull(mixedResult);
        Assert.Equal(lowerResult.CountyId, upperResult.CountyId);
        Assert.Equal(lowerResult.CountyId, mixedResult.CountyId);
    }

    [Fact]
    public async Task GetCountyReadinessAsync_ForConfiguredCounty_IncludesMetrics()
    {
        // Arrange
        SetupHealthyBentonRag(documentCount: 1000, embeddingCount: 5000);
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetCountyReadinessAsync("benton");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1000, result.DocumentCount);
        Assert.Equal(5000, result.EmbeddingCount);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FLEET SUMMARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetFleetSummaryAsync_ReturnsSummary()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetSummaryAsync();

        // Assert
        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.FleetRagSummary));
    }

    [Fact]
    public async Task GetFleetSummaryAsync_TruncatesLongAdvisory()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetSummaryAsync();

        // Assert
        Assert.True(result.FleetRagSummary.Length <= 103); // 100 + "..."
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // COUNTERS AND STATS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetFleetReadinessAsync_CountsConfiguredCountiesCorrectly()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        Assert.True(result.ConfiguredCounties >= 1); // At least Benton is configured
        Assert.True(result.ConfiguredCounties <= result.TotalCounties);
    }

    [Fact]
    public async Task GetFleetReadinessAsync_CountsReadyCountiesCorrectly()
    {
        // Arrange
        SetupHealthyBentonRag();
        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        Assert.True(result.ReadyCounties >= 1); // At least Benton is ready
        Assert.True(result.ReadyCounties <= result.ConfiguredCounties);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INDEX AGE CALCULATION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetCountyReadinessAsync_CalculatesIndexAgeCorrectly()
    {
        // Arrange
        var indexTime = DateTimeOffset.UtcNow.AddHours(-12);
        _mockBentonRagService.Setup(s => s.GetReadinessAsync())
            .ReturnsAsync(new BentonRagReadinessDto
            {
                OverallStatus = BentonRagStatus.Ready,
                DocumentCount = 100,
                EmbeddingCount = 500,
                LastIndexAt = indexTime,
                StatusReason = "Healthy"
            });

        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetCountyReadinessAsync("benton");

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.IndexAgeHours);
        Assert.True(result.IndexAgeHours >= 11.5 && result.IndexAgeHours <= 12.5); // Approximately 12 hours
    }

    [Fact]
    public async Task GetCountyReadinessAsync_NullLastIndex_HasNullIndexAge()
    {
        // Arrange
        _mockBentonRagService.Setup(s => s.GetReadinessAsync())
            .ReturnsAsync(new BentonRagReadinessDto
            {
                OverallStatus = BentonRagStatus.Unindexed,
                DocumentCount = 0,
                EmbeddingCount = 0,
                LastIndexAt = null,
                StatusReason = "Never indexed"
            });

        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetCountyReadinessAsync("benton");

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.IndexAgeHours);
        Assert.Null(result.LastIndexedAtUtc);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ERROR HANDLING TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetCountyReadinessAsync_WhenBentonServiceThrows_ReturnsUnknownState()
    {
        // Arrange
        _mockBentonRagService.Setup(s => s.GetReadinessAsync())
            .ThrowsAsync(new InvalidOperationException("Service unavailable"));

        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetCountyReadinessAsync("benton");

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Configured); // Still marked as configured
        Assert.Equal("Unknown", result.RagStatus); // Error falls back to Unknown
    }

    [Fact]
    public async Task GetFleetReadinessAsync_WhenBentonServiceThrows_ContinuesWithOtherCounties()
    {
        // Arrange
        _mockBentonRagService.Setup(s => s.GetReadinessAsync())
            .ThrowsAsync(new InvalidOperationException("Service unavailable"));

        var service = new SystemGptRagFleetService(_mockLogger.Object, _mockBentonRagService.Object);

        // Act
        var result = await service.GetFleetReadinessAsync();

        // Assert
        Assert.NotNull(result);
        Assert.True(result.TotalCounties >= 1);
        // Benton should be in error state, but result should still be returned
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════════

    private void SetupHealthyBentonRag(int documentCount = 500, int embeddingCount = 2500)
    {
        _mockBentonRagService.Setup(s => s.GetReadinessAsync())
            .ReturnsAsync(new BentonRagReadinessDto
            {
                OverallStatus = BentonRagStatus.Ready,
                DocumentCount = documentCount,
                EmbeddingCount = embeddingCount,
                LastIndexAt = DateTimeOffset.UtcNow.AddHours(-2),
                StatusReason = "All systems operational"
            });
    }

    private void SetupStaleBentonRag(int hoursOld = 48)
    {
        _mockBentonRagService.Setup(s => s.GetReadinessAsync())
            .ReturnsAsync(new BentonRagReadinessDto
            {
                OverallStatus = BentonRagStatus.Stale,
                DocumentCount = 500,
                EmbeddingCount = 2500,
                LastIndexAt = DateTimeOffset.UtcNow.AddHours(-hoursOld),
                StatusReason = $"Index is {hoursOld} hours old"
            });
    }
}
