// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30 TESTS: Swarm State API Endpoint Tests
// TDD Red Phase: Write tests BEFORE implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using TerraFusion.AI.Controllers;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase30;

/// <summary>
/// Phase 30: API Endpoint Tests for Swarm State.
/// Tests GET /api/gpt/system/swarm/state endpoint.
///
/// Test Plan Section 3-E:
/// - API response structure
/// - JSON serialization
/// - Error handling
/// </summary>
public class SystemGptSwarmControllerTests
{
    private readonly Mock<ISystemGptSwarmStateStore> _storeServiceMock;
    private readonly Mock<ILogger<SystemGptSwarmController>> _loggerMock;

    public SystemGptSwarmControllerTests()
    {
        _storeServiceMock = new Mock<ISystemGptSwarmStateStore>();
        _loggerMock = new Mock<ILogger<SystemGptSwarmController>>();
    }

    private SystemGptSwarmController CreateController()
    {
        return new SystemGptSwarmController(_storeServiceMock.Object, _loggerMock.Object);
    }

    #region GET /api/gpt/system/swarm/state

    [Fact]
    public async Task GetState_NoCounties_ReturnsEmptyList()
    {
        // Arrange
        _storeServiceMock
            .Setup(s => s.GetAllStates())
            .Returns(new List<SwarmStateSnapshot>());
        var controller = CreateController();

        // Act
        var result = await controller.GetSwarmState();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<SwarmStateResponseDto>(okResult.Value);
        Assert.Empty(response.Counties);
        Assert.Equal("1.0", response.Version);
    }

    [Fact]
    public async Task GetState_MultipleCounties_ReturnsAll()
    {
        // Arrange
        var counties = new List<SwarmStateSnapshot>
        {
            new() { CountyId = "benton", Mode = SwarmMode.Normal, CurrentCapacity = 50 },
            new() { CountyId = "yakima", Mode = SwarmMode.SafeMode, SafeModeEnabled = true, CurrentCapacity = 80 },
            new() { CountyId = "king", Mode = SwarmMode.Throttled, ThrottleEnabled = true, CurrentCapacity = 60 }
        };
        _storeServiceMock
            .Setup(s => s.GetAllStates())
            .Returns(counties);
        var controller = CreateController();

        // Act
        var result = await controller.GetSwarmState();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<SwarmStateResponseDto>(okResult.Value);
        Assert.Equal(3, response.Counties.Count);
    }

    [Fact]
    public async Task GetState_IncludesGeneratedTimestamp()
    {
        // Arrange
        _storeServiceMock
            .Setup(s => s.GetAllStates())
            .Returns(new List<SwarmStateSnapshot>());
        var controller = CreateController();
        var beforeCall = DateTimeOffset.UtcNow;

        // Act
        var result = await controller.GetSwarmState();
        var afterCall = DateTimeOffset.UtcNow;

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<SwarmStateResponseDto>(okResult.Value);
        Assert.True(response.GeneratedAt >= beforeCall);
        Assert.True(response.GeneratedAt <= afterCall);
    }

    #endregion

    #region GET /api/gpt/system/swarm/state/{countyId}

    [Fact]
    public async Task GetStateByCounty_ExistingCounty_ReturnsState()
    {
        // Arrange
        var expectedState = new SwarmStateSnapshot
        {
            CountyId = "benton",
            Mode = SwarmMode.SafeMode,
            SafeModeEnabled = true,
            CurrentCapacity = 75,
            LastAction = SwarmActionKind.EnableSafeMode,
            LastActionReason = "High error rate detected"
        };
        _storeServiceMock
            .Setup(s => s.GetState("benton"))
            .Returns(expectedState);
        var controller = CreateController();

        // Act
        var result = await controller.GetSwarmStateByCounty("benton");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var state = Assert.IsType<SwarmStateSnapshot>(okResult.Value);
        Assert.Equal("benton", state.CountyId);
        Assert.True(state.SafeModeEnabled);
    }

    [Fact]
    public async Task GetStateByCounty_NewCounty_ReturnsDefaultState()
    {
        // Arrange
        var defaultState = new SwarmStateSnapshot
        {
            CountyId = "new_county",
            Mode = SwarmMode.Normal,
            SafeModeEnabled = false,
            CurrentCapacity = 50
        };
        _storeServiceMock
            .Setup(s => s.GetState("new_county"))
            .Returns(defaultState);
        var controller = CreateController();

        // Act
        var result = await controller.GetSwarmStateByCounty("new_county");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var state = Assert.IsType<SwarmStateSnapshot>(okResult.Value);
        Assert.Equal("new_county", state.CountyId);
        Assert.Equal(SwarmMode.Normal, state.Mode);
    }

    [Fact]
    public async Task GetStateByCounty_EmptyCountyId_ReturnsBadRequest()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.GetSwarmStateByCounty("");

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetStateByCounty_NullCountyId_ReturnsBadRequest()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.GetSwarmStateByCounty(null!);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    #endregion

    #region JSON Serialization

    [Fact]
    public void SwarmStateResponse_SerializesToValidJson()
    {
        // Arrange
        var response = new SwarmStateResponseDto
        {
            Version = "1.0",
            GeneratedAt = DateTimeOffset.Parse("2024-01-15T10:30:00Z"),
            Counties = new List<SwarmStateSnapshot>
            {
                new()
                {
                    CountyId = "benton",
                    Mode = SwarmMode.SafeMode,
                    SafeModeEnabled = true,
                    ThrottleEnabled = false,
                    CurrentCapacity = 75,
                    MaxCapacity = 100,
                    MinCapacity = 10,
                    LastAction = SwarmActionKind.EnableSafeMode,
                    LastActionReason = "High error rate",
                    HealthyIntervalCount = 0,
                    CriticalIntervalCount = 2
                }
            }
        };

        // Act
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        // Assert
        Assert.Contains("\"version\":", json);
        Assert.Contains("\"generatedAt\":", json);
        Assert.Contains("\"counties\":", json);
        Assert.Contains("\"countyId\":", json);
        Assert.Contains("\"benton\"", json);
        Assert.Contains("\"safeModeEnabled\":", json);
        // Boolean true in JSON is unquoted: "safeModeEnabled": true
        Assert.Contains("true", json.ToLower());
    }

    [Fact]
    public void SwarmStateResponse_DeserializesFromJson()
    {
        // Arrange
        var json = """
        {
            "version": "1.0",
            "generatedAt": "2024-01-15T10:30:00+00:00",
            "counties": [
                {
                    "countyId": "yakima",
                    "mode": 1,
                    "safeModeEnabled": true,
                    "throttleEnabled": false,
                    "currentCapacity": 80,
                    "maxCapacity": 100,
                    "minCapacity": 10,
                    "lastAction": 4,
                    "healthyIntervalCount": 0,
                    "criticalIntervalCount": 3
                }
            ]
        }
        """;

        // Act
        var response = JsonSerializer.Deserialize<SwarmStateResponseDto>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        // Assert
        Assert.NotNull(response);
        Assert.Equal("1.0", response.Version);
        Assert.Single(response.Counties);
        Assert.Equal("yakima", response.Counties[0].CountyId);
        Assert.Equal(SwarmMode.SafeMode, response.Counties[0].Mode);
    }

    #endregion

    #region Error Handling

    [Fact]
    public async Task GetState_StoreThrows_ReturnsServerError()
    {
        // Arrange
        _storeServiceMock
            .Setup(s => s.GetAllStates())
            .Throws(new InvalidOperationException("Store unavailable"));
        var controller = CreateController();

        // Act
        var result = await controller.GetSwarmState();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    #endregion
}
// ISystemGptSwarmStateStore is defined in TerraFusion.AI.Services namespace
