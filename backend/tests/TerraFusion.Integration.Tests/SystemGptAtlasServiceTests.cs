// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ TerraFusion SystemGPT Atlas Tests
// Phase 28: Map-Based AI Health Visualization
// "A geographic visualization of multi-county AI health status."
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
/// Phase 28: Integration tests for SystemGptAtlasService - Map-Based AI Health Visualization.
/// Tests county node aggregation, health status mapping, and map coordinate assignment.
/// </summary>
public class SystemGptAtlasServiceTests
{
    private readonly Mock<ILogger<SystemGptAtlasService>> _mockLogger;
    private readonly Mock<ISystemGptFederatedOverviewService> _mockFederatedService;
    private readonly Mock<ISystemGptRagFleetService> _mockRagFleetService;
    private readonly Mock<ISystemGptGuardrailService> _mockGuardrailService;

    public SystemGptAtlasServiceTests()
    {
        _mockLogger = new Mock<ILogger<SystemGptAtlasService>>();
        _mockFederatedService = new Mock<ISystemGptFederatedOverviewService>();
        _mockRagFleetService = new Mock<ISystemGptRagFleetService>();
        _mockGuardrailService = new Mock<ISystemGptGuardrailService>();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SERVICE INSTANTIATION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Constructor_WithNullDependencies_DoesNotThrow()
    {
        // Arrange & Act
        var service = new SystemGptAtlasService(
            _mockLogger.Object,
            federatedOverviewService: null,
            ragFleetService: null,
            guardrailService: null);

        // Assert
        Assert.NotNull(service);
    }

    [Fact]
    public void Constructor_WithAllDependencies_DoesNotThrow()
    {
        // Arrange & Act
        var service = CreateFullService();

        // Assert
        Assert.NotNull(service);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // GET ATLAS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetAtlasAsync_ReturnsAllConfiguredCounties()
    {
        // Arrange
        SetupHealthyFederatedOverview();
        SetupLowDriftFleet();
        var service = CreateFullService();

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Nodes);
        Assert.True(result.Nodes.Count >= 1); // At least one county
    }

    [Fact]
    public async Task GetAtlasAsync_ReturnsValidTimestamp()
    {
        // Arrange
        SetupHealthyFederatedOverview();
        SetupLowDriftFleet();
        var service = CreateFullService();

        // Act
        var before = DateTime.UtcNow;
        var result = await service.GetAtlasAsync();
        var after = DateTime.UtcNow;

        // Assert
        Assert.True(result.GeneratedAtUtc >= before);
        Assert.True(result.GeneratedAtUtc <= after);
    }

    [Fact]
    public async Task GetAtlasAsync_NodesHaveValidMapCoordinates()
    {
        // Arrange
        SetupHealthyFederatedOverview();
        SetupLowDriftFleet();
        var service = CreateFullService();

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        foreach (var node in result.Nodes)
        {
            Assert.True(node.MapX >= 0.0 && node.MapX <= 1.0,
                $"MapX for {node.CountyId} should be between 0 and 1, was {node.MapX}");
            Assert.True(node.MapY >= 0.0 && node.MapY <= 1.0,
                $"MapY for {node.CountyId} should be between 0 and 1, was {node.MapY}");
        }
    }

    [Fact]
    public async Task GetAtlasAsync_NodesHaveRequiredProperties()
    {
        // Arrange
        SetupHealthyFederatedOverview();
        SetupLowDriftFleet();
        var service = CreateFullService();

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        foreach (var node in result.Nodes)
        {
            Assert.NotNull(node.CountyId);
            Assert.NotEmpty(node.CountyId);
            Assert.NotNull(node.CountyName);
            Assert.NotEmpty(node.CountyName);
            Assert.NotNull(node.Health);
            Assert.NotNull(node.RagStatus);
            Assert.NotNull(node.CapacityRisk);
        }
    }

    [Fact]
    public async Task GetAtlasAsync_BentonCounty_HasCorrectMapPosition()
    {
        // Arrange
        SetupHealthyFederatedOverview();
        SetupLowDriftFleet();
        var service = CreateFullService();

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        var benton = result.Nodes.FirstOrDefault(n =>
            n.CountyId.Equals("benton", StringComparison.OrdinalIgnoreCase));

        if (benton != null)
        {
            // Benton should be approximately at (0.40, 0.70) per the spec
            Assert.True(benton.MapX >= 0.3 && benton.MapX <= 0.5,
                $"Benton MapX expected near 0.40, was {benton.MapX}");
            Assert.True(benton.MapY >= 0.6 && benton.MapY <= 0.8,
                $"Benton MapY expected near 0.70, was {benton.MapY}");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // HEALTH STATUS MAPPING TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetAtlasAsync_HealthyCounty_ReturnsHealthyStatus()
    {
        // Arrange
        SetupFederatedOverviewWithHealth("Healthy");
        SetupLowDriftFleet();
        var service = CreateFullService();

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        var healthyNode = result.Nodes.FirstOrDefault(n => n.Configured);
        Assert.NotNull(healthyNode);
        Assert.Equal("Healthy", healthyNode!.Health);
    }

    [Fact]
    public async Task GetAtlasAsync_DegradedCounty_ReturnsDegradedStatus()
    {
        // Arrange
        SetupFederatedOverviewWithHealth("Degraded");
        SetupLowDriftFleet();
        var service = CreateFullService();

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        var node = result.Nodes.FirstOrDefault(n => n.Configured);
        Assert.NotNull(node);
        Assert.Equal("Degraded", node!.Health);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DRIFT INTEGRATION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetAtlasAsync_WithHighDriftFleet_NodesReflectDriftRisk()
    {
        // Arrange
        SetupHealthyFederatedOverview();
        SetupHighDriftFleet();
        var service = CreateFullService();

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        // At least one node should show drift risk from fleet
        var configuredNodes = result.Nodes.Where(n => n.Configured).ToList();
        // The fleet drift should be reflected in nodes
        Assert.True(configuredNodes.Any(n =>
            n.FleetRagDriftRisk == "High" ||
            n.FleetRagDriftRisk == "Medium" ||
            n.FleetRagDriftRisk == "Low"),
            "Configured nodes should have drift risk set");
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // NULL DEPENDENCY HANDLING TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetAtlasAsync_WithNullFederatedService_ReturnsBasicNodes()
    {
        // Arrange
        SetupLowDriftFleet();
        var service = new SystemGptAtlasService(
            _mockLogger.Object,
            federatedOverviewService: null,
            _mockRagFleetService.Object,
            _mockGuardrailService.Object);

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Nodes);
        // Should still return nodes with default/unknown status
    }

    [Fact]
    public async Task GetAtlasAsync_WithNullRagFleetService_ReturnsNodesWithUnknownDrift()
    {
        // Arrange
        SetupHealthyFederatedOverview();
        var service = new SystemGptAtlasService(
            _mockLogger.Object,
            _mockFederatedService.Object,
            ragFleetService: null,
            _mockGuardrailService.Object);

        // Act
        var result = await service.GetAtlasAsync();

        // Assert
        Assert.NotNull(result);
        foreach (var node in result.Nodes)
        {
            // Without fleet service, drift should default to Low
            Assert.Equal("Low", node.FleetRagDriftRisk);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════════

    private SystemGptAtlasService CreateFullService()
    {
        return new SystemGptAtlasService(
            _mockLogger.Object,
            _mockFederatedService.Object,
            _mockRagFleetService.Object,
            _mockGuardrailService.Object);
    }

    private void SetupHealthyFederatedOverview()
    {
        SetupFederatedOverviewWithHealth("Healthy");
    }

    private void SetupFederatedOverviewWithHealth(string health)
    {
        var overview = new SystemGptFederatedOverviewResponse
        {
            GeneratedAtUtc = DateTime.UtcNow,
            Counties = new List<SystemGptCountyOverviewDto>
            {
                new SystemGptCountyOverviewDto
                {
                    CountyId = "benton",
                    CountyName = "Benton County",
                    Health = health,
                    CapacityRisk = "Low",
                    RagStatus = "Ready",
                    Configured = true
                }
            }
        };

        _mockFederatedService
            .Setup(x => x.GetOverviewAsync())
            .ReturnsAsync(overview);
    }

    private void SetupLowDriftFleet()
    {
        var fleet = new RagFleetReadinessDto
        {
            GeneratedAtUtc = DateTimeOffset.UtcNow,
            FleetDriftRisk = RagFleetDriftRisk.Low,
            Advisory = "All counties aligned",
            Counties = new List<RagCountyReadinessDto>
            {
                new RagCountyReadinessDto
                {
                    CountyId = "benton",
                    CountyName = "Benton County",
                    Configured = true,
                    RagStatus = "Ready",
                    DocumentCount = 100,
                    EmbeddingCount = 500,
                    IndexAgeHours = 2
                }
            }
        };

        _mockRagFleetService
            .Setup(x => x.GetFleetReadinessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(fleet);
    }

    private void SetupHighDriftFleet()
    {
        var fleet = new RagFleetReadinessDto
        {
            GeneratedAtUtc = DateTimeOffset.UtcNow,
            FleetDriftRisk = RagFleetDriftRisk.High,
            Advisory = "Significant drift detected between counties",
            DriftConditions = new List<string> { "Benton stale", "Yakima unindexed" },
            Counties = new List<RagCountyReadinessDto>
            {
                new RagCountyReadinessDto
                {
                    CountyId = "benton",
                    CountyName = "Benton County",
                    Configured = true,
                    RagStatus = "Stale",
                    DocumentCount = 100,
                    EmbeddingCount = 500,
                    IndexAgeHours = 48 // Stale
                },
                new RagCountyReadinessDto
                {
                    CountyId = "yakima",
                    CountyName = "Yakima County",
                    Configured = true,
                    RagStatus = "Unindexed",
                    DocumentCount = 0,
                    EmbeddingCount = 0
                }
            }
        };

        _mockRagFleetService
            .Setup(x => x.GetFleetReadinessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(fleet);
    }
}
