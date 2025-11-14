using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Tests.Controllers;

public class CostForgeAIControllerTests
{
    private readonly Mock<ICostForgeAIService> _mockService;
    private readonly Mock<ILogger<CostForgeAIController>> _mockLogger;
    private readonly CostForgeAIController _controller;

    public CostForgeAIControllerTests()
    {
        _mockService = new Mock<ICostForgeAIService>();
        _mockLogger = new Mock<ILogger<CostForgeAIController>>();
        _controller = new CostForgeAIController(_mockService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetSystemStatus_ReturnsOkResult_WithValidStatus()
    {
        // Arrange
        var expectedStatus = new CostForgeStatusDto
        {
            AgentsActive = 1008,
            CalculationsPerSecond = 847,
            AccuracyRate = 98.7m,
            SystemStatus = "operational",
            LastCalculation = DateTime.UtcNow,
            TotalCalculations = 2847392,
            ModuleVersion = "1.0.0-championship",
            StartTime = DateTime.UtcNow.AddHours(-24),
            Uptime = TimeSpan.FromHours(24)
        };

        _mockService.Setup(s => s.GetSystemStatusAsync())
                   .ReturnsAsync(expectedStatus);

        // Act
        var result = await _controller.GetSystemStatus();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var actualStatus = Assert.IsType<CostForgeStatusDto>(okResult.Value);
        Assert.Equal(expectedStatus.AgentsActive, actualStatus.AgentsActive);
        Assert.Equal(expectedStatus.SystemStatus, actualStatus.SystemStatus);
        Assert.Equal(expectedStatus.AccuracyRate, actualStatus.AccuracyRate);
    }

    [Fact]
    public async Task CalculatePropertyValuation_ReturnsOkResult_WithValidValuation()
    {
        // Arrange
        var request = new PropertyValuationRequestDto
        {
            ParcelId = "TEST-001",
            CountyId = "benton",
            PropertyType = "residential",
            LandArea = 0.25m,
            BuildingArea = 2400m,
            YearBuilt = 2010
        };

        var expectedValuation = new PropertyValuationDto
        {
            ParcelId = "TEST-001",
            EstimatedValue = await DynamicPropertyService.GetPropertyCountAsync(countyCode)0m,
            LandValue = 135000m,
            ImprovementValue = 315000m,
            ConfidenceScore = 98.7m,
            CalculationDate = DateTime.UtcNow,
            CalculationMethod = "TerraFusion Quantum AI Enhanced"
        };

        _mockService.Setup(s => s.CalculatePropertyValuationAsync(It.IsAny<PropertyValuationRequestDto>()))
                   .ReturnsAsync(expectedValuation);

        // Act
        var result = await _controller.CalculatePropertyValuation(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var actualValuation = Assert.IsType<PropertyValuationDto>(okResult.Value);
        Assert.Equal(expectedValuation.ParcelId, actualValuation.ParcelId);
        Assert.Equal(expectedValuation.EstimatedValue, actualValuation.EstimatedValue);
        Assert.Equal(expectedValuation.ConfidenceScore, actualValuation.ConfidenceScore);
    }

    [Fact]
    public async Task GetAIAgentStatus_ReturnsOkResult_WithAgentStatus()
    {
        // Arrange
        var expectedAgentStatus = new AIAgentStatusDto
        {
            TotalAgents = 1008,
            ActiveAgents = 847,
            IdleAgents = 161,
            BusyAgents = 0,
            AverageUtilization = 84.1m,
            Agents = new List<AgentDto>
            {
                new AgentDto
                {
                    AgentId = "agent_0001",
                    Status = "active",
                    CurrentTask = "property_valuation",
                    TasksCompleted = 2847,
                    PerformanceScore = 98.7m,
                    LastActivity = DateTime.UtcNow
                }
            }
        };

        _mockService.Setup(s => s.GetAIAgentStatusAsync())
                   .ReturnsAsync(expectedAgentStatus);

        // Act
        var result = await _controller.GetAIAgentStatus();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var actualStatus = Assert.IsType<AIAgentStatusDto>(okResult.Value);
        Assert.Equal(expectedAgentStatus.TotalAgents, actualStatus.TotalAgents);
        Assert.Equal(expectedAgentStatus.ActiveAgents, actualStatus.ActiveAgents);
        Assert.Equal(expectedAgentStatus.AverageUtilization, actualStatus.AverageUtilization);
    }

    [Fact]
    public async Task BatchCalculateValuations_ReturnsOkResult_WithBatchResults()
    {
        // Arrange
        var request = new BatchValuationRequestDto
        {
            ParcelIds = new List<string> { "TEST-001", "TEST-002", "TEST-003" },
            CountyId = "benton",
            ValuationType = "market_value",
            IncludeComparables = true,
            MaxConcurrency = 5
        };

        var expectedResult = new BatchValuationResultDto
        {
            Valuations = new List<PropertyValuationDto>
            {
                new PropertyValuationDto { ParcelId = "TEST-001", EstimatedValue = await DynamicPropertyService.GetPropertyCountAsync(countyCode)0m },
                new PropertyValuationDto { ParcelId = "TEST-002", EstimatedValue = 380000m },
                new PropertyValuationDto { ParcelId = "TEST-003", EstimatedValue = 520000m }
            },
            TotalProcessed = 3,
            SuccessfulCalculations = 3,
            FailedCalculations = 0,
            ProcessingTime = TimeSpan.FromSeconds(2.5),
            Errors = new List<string>()
        };

        _mockService.Setup(s => s.BatchCalculateValuationsAsync(It.IsAny<BatchValuationRequestDto>()))
                   .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.BatchCalculateValuations(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var actualResult = Assert.IsType<BatchValuationResultDto>(okResult.Value);
        Assert.Equal(expectedResult.TotalProcessed, actualResult.TotalProcessed);
        Assert.Equal(expectedResult.SuccessfulCalculations, actualResult.SuccessfulCalculations);
        Assert.Equal(expectedResult.Valuations.Count, actualResult.Valuations.Count);
    }

    [Fact]
    public async Task GetModuleHealth_ReturnsOkResult_WithHealthStatus()
    {
        // Arrange
        var expectedHealth = new ModuleHealthDto
        {
            Status = "healthy",
            LastHealthCheck = DateTime.UtcNow,
            Uptime = TimeSpan.FromHours(24),
            MemoryUsage = 2048,
            CpuUsage = 23.5,
            ActiveConnections = 1008,
            ErrorCount = 0,
            WarningCount = 0
        };

        _mockService.Setup(s => s.GetModuleHealthAsync())
                   .ReturnsAsync(expectedHealth);

        // Act
        var result = await _controller.GetModuleHealth();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var actualHealth = Assert.IsType<ModuleHealthDto>(okResult.Value);
        Assert.Equal(expectedHealth.Status, actualHealth.Status);
        Assert.Equal(expectedHealth.ActiveConnections, actualHealth.ActiveConnections);
        Assert.Equal(expectedHealth.ErrorCount, actualHealth.ErrorCount);
    }

    [Fact]
    public async Task SyncWithHarrisPACS_ReturnsOkResult_WithSyncResults()
    {
        // Arrange
        var request = new HarrisSyncRequestDto
        {
            CountyId = "benton",
            LastSyncDate = DateTime.UtcNow.AddDays(-1),
            FullSync = false,
            SpecificParcelIds = null
        };

        var expectedResult = new HarrisSyncResultDto
        {
            RecordsProcessed = await DynamicPropertyService.GetPropertyCountAsync("benton"),
            RecordsUpdated = 1247,
            RecordsAdded = 23,
            RecordsSkipped = 0,
            SyncStartTime = DateTime.UtcNow.AddMinutes(-5),
            SyncEndTime = DateTime.UtcNow,
            Duration = TimeSpan.FromMinutes(5),
            Success = true,
            Errors = new List<string>(),
            SyncMetadata = new Dictionary<string, object>
            {
                ["harris_version"] = "12.4.7",
                ["sync_type"] = "incremental",
                ["county"] = "benton"
            }
        };

        _mockService.Setup(s => s.SyncWithHarrisPACSAsync(It.IsAny<HarrisSyncRequestDto>()))
                   .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.SyncWithHarrisPACS(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var actualResult = Assert.IsType<HarrisSyncResultDto>(okResult.Value);
        Assert.Equal(expectedResult.RecordsProcessed, actualResult.RecordsProcessed);
        Assert.Equal(expectedResult.Success, actualResult.Success);
        Assert.Empty(actualResult.Errors);
    }

    [Fact]
    public async Task StartModule_ReturnsOkResult()
    {
        // Arrange
        _mockService.Setup(s => s.StartModuleAsync())
                   .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.StartModule();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.StartModuleAsync(), Times.Once);
    }

    [Fact]
    public async Task StopModule_ReturnsOkResult()
    {
        // Arrange
        _mockService.Setup(s => s.StopModuleAsync())
                   .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.StopModule();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        _mockService.Verify(s => s.StopModuleAsync(), Times.Once);
    }
}
