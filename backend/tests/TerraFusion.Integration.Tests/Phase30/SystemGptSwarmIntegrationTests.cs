// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30 TESTS: E2E Integration Tests - Decision Flow
// TDD Red Phase: Write tests BEFORE implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using System.Text.Json;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase30;

/// <summary>
/// Phase 30: End-to-End Integration Tests.
/// Tests the complete decision flow from Atlas telemetry to Swarm action.
///
/// Test Plan Section 3-D:
/// - Atlas → Policy → Bridge → StateStore flow
/// - Multiple county scenarios
/// - State persistence across decisions
/// </summary>
public class SystemGptSwarmIntegrationTests
{
    private readonly Mock<ILogger<SystemGptSwarmPolicyService>> _policyLoggerMock;
    private readonly Mock<ILogger<SystemGptSwarmBridgeService>> _bridgeLoggerMock;
    private readonly Mock<ILogger<SystemGptSwarmStateStore>> _storeLoggerMock;
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;

    public SystemGptSwarmIntegrationTests()
    {
        _policyLoggerMock = new Mock<ILogger<SystemGptSwarmPolicyService>>();
        _bridgeLoggerMock = new Mock<ILogger<SystemGptSwarmBridgeService>>();
        _storeLoggerMock = new Mock<ILogger<SystemGptSwarmStateStore>>();
        _httpClientFactoryMock = new Mock<IHttpClientFactory>();
    }

    private (SystemGptSwarmPolicyService Policy, SystemGptSwarmBridgeService Bridge, SystemGptSwarmStateStore Store)
        CreateServices(MockHttpMessageHandler? messageHandler = null)
    {
        var policyOptions = Options.Create(new SwarmPolicyOptions
        {
            CriticalErrorRateThreshold = 5.0,
            CriticalLatencyThresholdMs = 1000,
            HealthyIntervalsForRecovery = 3,
            CapacityStep = 10
        });

        var bridgeOptions = Options.Create(new SwarmBridgeOptions
        {
            SwarmControlPlaneUrl = "http://localhost:9000/swarm",
            TimeoutSeconds = 30,
            MaxRetries = 3
        });

        var handler = messageHandler ?? new MockHttpMessageHandler(HttpStatusCode.OK, "{}");
        // Return a new HttpClient each time to avoid "already started" errors when setting Timeout
        _httpClientFactoryMock
            .Setup(f => f.CreateClient(It.IsAny<string>()))
            .Returns(() => new HttpClient(handler));

        var policy = new SystemGptSwarmPolicyService(policyOptions, _policyLoggerMock.Object);
        var bridge = new SystemGptSwarmBridgeService(_httpClientFactoryMock.Object, bridgeOptions, _bridgeLoggerMock.Object);
        var store = new SystemGptSwarmStateStore(_storeLoggerMock.Object);

        return (policy, bridge, store);
    }

    #region Complete Decision Flow

    [Fact]
    public async Task DecisionFlow_CriticalErrorRate_EnablesSafeMode()
    {
        // Arrange
        var (policy, bridge, store) = CreateServices();
        var input = new SwarmPolicyInput
        {
            CountyId = "benton",
            HealthState = "critical",
            HealthScore = 0.45,
            ErrorRatePercent = 8.0, // Critical
            P95LatencyMs = 200,
            ActiveRequests = 50,
            GuardrailTriggered = true,
            CurrentSwarmState = store.GetState("benton")
        };

        // Act - Flow: Policy → Bridge → Store
        var decision = policy.EvaluatePolicy(input);
        var result = await bridge.ExecuteActionAsync(decision);
        if (result.Success) store.ApplyAction(result);

        // Assert
        Assert.Equal(SwarmActionKind.EnableSafeMode, decision.Action);
        Assert.True(result.Success);

        var finalState = store.GetState("benton");
        Assert.True(finalState.SafeModeEnabled);
        Assert.Equal(SwarmMode.SafeMode, finalState.Mode);
    }

    [Fact]
    public async Task DecisionFlow_CriticalLatency_IncreasesCapacity()
    {
        // Arrange
        var (policy, bridge, store) = CreateServices();
        var initialState = new SwarmStateSnapshot
        {
            CountyId = "yakima",
            CurrentCapacity = 50,
            MaxCapacity = 100,
            SafeModeEnabled = false,
            Mode = SwarmMode.Normal
        };
        store.UpdateState(initialState);

        var input = new SwarmPolicyInput
        {
            CountyId = "yakima",
            HealthState = "critical",
            HealthScore = 0.55,
            ErrorRatePercent = 2.0, // Below SafeMode threshold
            P95LatencyMs = 1500, // Critical latency
            ActiveRequests = 80,
            GuardrailTriggered = false,
            CurrentSwarmState = store.GetState("yakima")
        };

        // Act
        var decision = policy.EvaluatePolicy(input);
        var result = await bridge.ExecuteActionAsync(decision);
        if (result.Success) store.ApplyAction(result);

        // Assert
        Assert.Equal(SwarmActionKind.IncreaseCapacity, decision.Action);

        var finalState = store.GetState("yakima");
        Assert.Equal(60, finalState.CurrentCapacity); // +10
    }

    [Fact]
    public async Task DecisionFlow_Recovery_DisablesSafeMode()
    {
        // Arrange
        var (policy, bridge, store) = CreateServices();

        // Setup: County in SafeMode with enough healthy intervals
        var initialState = new SwarmStateSnapshot
        {
            CountyId = "king",
            SafeModeEnabled = true,
            Mode = SwarmMode.SafeMode,
            CurrentCapacity = 80,
            HealthyIntervalCount = 3 // Met recovery threshold
        };
        store.UpdateState(initialState);

        var input = new SwarmPolicyInput
        {
            CountyId = "king",
            HealthState = "healthy",
            HealthScore = 0.95,
            ErrorRatePercent = 0.5,
            P95LatencyMs = 100,
            ActiveRequests = 20,
            GuardrailTriggered = false,
            CurrentSwarmState = store.GetState("king")
        };

        // Act
        var decision = policy.EvaluatePolicy(input);
        var result = await bridge.ExecuteActionAsync(decision);
        if (result.Success) store.ApplyAction(result);

        // Assert
        Assert.Equal(SwarmActionKind.DisableSafeMode, decision.Action);

        var finalState = store.GetState("king");
        Assert.False(finalState.SafeModeEnabled);
        Assert.Equal(SwarmMode.Normal, finalState.Mode);
    }

    #endregion

    #region Multiple County Scenarios

    [Fact]
    public async Task MultipleCounties_IndependentStates()
    {
        // Arrange - This test mirrors DecisionFlow_CriticalLatency_IncreasesCapacity
        var (policy, bridge, store) = CreateServices();

        var initialState = new SwarmStateSnapshot
        {
            CountyId = "yakima",
            CurrentCapacity = 50,
            MaxCapacity = 100,
            SafeModeEnabled = false,
            Mode = SwarmMode.Normal
        };
        store.UpdateState(initialState);

        var input = new SwarmPolicyInput
        {
            CountyId = "yakima",
            HealthState = "critical",
            HealthScore = 0.9,
            ErrorRatePercent = 2.0,
            P95LatencyMs = 1500,
            ActiveRequests = 30,
            GuardrailTriggered = false,
            CurrentSwarmState = store.GetState("yakima")
        };

        // Act
        var decision = policy.EvaluatePolicy(input);
        var result = await bridge.ExecuteActionAsync(decision);
        if (result.Success) store.ApplyAction(result);

        // Assert
        Assert.Equal(SwarmActionKind.IncreaseCapacity, decision.Action);
        var finalState = store.GetState("yakima");
        Assert.Equal(60, finalState.CurrentCapacity);
    }
    [Fact]
    public async Task MultipleDecisionCycles_StateEvolution()
    {
        // Arrange
        var (policy, bridge, store) = CreateServices();
        var countyId = "pierce";

        // Setup initial state
        var initialState = new SwarmStateSnapshot
        {
            CountyId = countyId,
            CurrentCapacity = 50,
            MaxCapacity = 100,
            SafeModeEnabled = false,
            Mode = SwarmMode.Normal
        };
        store.UpdateState(initialState);

        // Cycle 1: Critical error rate → SafeMode
        var input1 = new SwarmPolicyInput
        {
            CountyId = countyId,
            HealthState = "critical",
            ErrorRatePercent = 10.0,
            P95LatencyMs = 500,
            CurrentSwarmState = store.GetState(countyId)
        };
        var decision1 = policy.EvaluatePolicy(input1);
        var result1 = await bridge.ExecuteActionAsync(decision1);
        if (result1.Success) store.ApplyAction(result1);

        Assert.Equal(SwarmActionKind.EnableSafeMode, decision1.Action);
        Assert.True(store.GetState(countyId).SafeModeEnabled);

        // Cycle 2: Still critical with high latency → IncreaseCapacity (already in SafeMode)
        store.RecordCriticalInterval(countyId);
        var input2 = new SwarmPolicyInput
        {
            CountyId = countyId,
            HealthState = "critical",
            ErrorRatePercent = 7.0, // Still above threshold but already in SafeMode
            P95LatencyMs = 1200,    // High latency triggers capacity increase
            CurrentSwarmState = store.GetState(countyId)
        };
        var decision2 = policy.EvaluatePolicy(input2);
        var result2 = await bridge.ExecuteActionAsync(decision2);
        if (result2.Success) store.ApplyAction(result2);

        // After cycle 2, SafeMode should still be enabled
        var afterCycle2 = store.GetState(countyId);
        Assert.True(afterCycle2.SafeModeEnabled);

        // Cycle 3-5: Record 3 healthy intervals to meet recovery threshold
        for (int i = 0; i < 3; i++)
        {
            store.RecordHealthyInterval(countyId);
        }

        // Verify healthy intervals were recorded
        var afterHealthy = store.GetState(countyId);
        Assert.Equal(3, afterHealthy.HealthyIntervalCount);
        Assert.True(afterHealthy.SafeModeEnabled); // Still in SafeMode

        var input3 = new SwarmPolicyInput
        {
            CountyId = countyId,
            HealthState = "healthy",
            ErrorRatePercent = 0.5,
            P95LatencyMs = 80,
            CurrentSwarmState = store.GetState(countyId)  // Get fresh state with HealthyIntervalCount=3
        };
        var decision3 = policy.EvaluatePolicy(input3);
        var result3 = await bridge.ExecuteActionAsync(decision3);

        // Verify result and apply
        Assert.True(result3.Success, $"Bridge execution failed: {result3.FailureReason}");
        store.ApplyAction(result3);

        // Assert final state: recovered
        Assert.Equal(SwarmActionKind.DisableSafeMode, decision3.Action);
        var finalState = store.GetState(countyId);
        Assert.False(finalState.SafeModeEnabled);
    }

    #endregion

    #region Bridge Failure Scenarios

    [Fact]
    public async Task BridgeFailure_StateNotUpdated()
    {
        // Arrange
        var failingHandler = new MockHttpMessageHandler(HttpStatusCode.ServiceUnavailable, "{}");
        var (policy, bridge, store) = CreateServices(failingHandler);

        var initialState = new SwarmStateSnapshot
        {
            CountyId = "spokane",
            SafeModeEnabled = false,
            Mode = SwarmMode.Normal
        };
        store.UpdateState(initialState);

        var input = new SwarmPolicyInput
        {
            CountyId = "spokane",
            HealthState = "critical",
            ErrorRatePercent = 15.0,
            CurrentSwarmState = store.GetState("spokane")
        };

        // Act
        var decision = policy.EvaluatePolicy(input);
        var result = await bridge.ExecuteActionAsync(decision);
        if (result.Success) store.ApplyAction(result); // Should not apply

        // Assert
        Assert.Equal(SwarmActionKind.EnableSafeMode, decision.Action);
        Assert.False(result.Success);

        var finalState = store.GetState("spokane");
        Assert.False(finalState.SafeModeEnabled); // Not updated due to failure
    }

    [Fact]
    public async Task NetworkFailure_GracefulDegradation()
    {
        // Arrange
        var networkErrorHandler = new MockHttpMessageHandler(
            new HttpRequestException("Network unreachable"));
        var (policy, bridge, store) = CreateServices(networkErrorHandler);

        var input = new SwarmPolicyInput
        {
            CountyId = "thurston",
            HealthState = "critical",
            ErrorRatePercent = 12.0,
            CurrentSwarmState = store.GetState("thurston")
        };

        // Act
        var decision = policy.EvaluatePolicy(input);
        var result = await bridge.ExecuteActionAsync(decision);

        // Assert - Policy still makes decision, bridge returns failure
        Assert.Equal(SwarmActionKind.EnableSafeMode, decision.Action);
        Assert.False(result.Success);
        Assert.NotNull(result.FailureReason);
    }

    #endregion

    #region State Consistency

    [Fact]
    public void AllStatesResponse_ContainsAllCounties()
    {
        // Arrange
        var (_, _, store) = CreateServices();

        store.UpdateState(new SwarmStateSnapshot { CountyId = "county1", Mode = SwarmMode.Normal });
        store.UpdateState(new SwarmStateSnapshot { CountyId = "county2", Mode = SwarmMode.SafeMode });
        store.UpdateState(new SwarmStateSnapshot { CountyId = "county3", Mode = SwarmMode.Throttled });

        // Act
        var allStates = store.GetAllStates();

        // Assert
        Assert.Equal(3, allStates.Count);
        Assert.Contains(allStates, s => s.CountyId == "county1");
        Assert.Contains(allStates, s => s.CountyId == "county2");
        Assert.Contains(allStates, s => s.CountyId == "county3");
    }

    [Fact]
    public void SwarmStateResponse_SerializesCorrectly()
    {
        // Arrange
        var (_, _, store) = CreateServices();
        store.UpdateState(new SwarmStateSnapshot
        {
            CountyId = "benton",
            Mode = SwarmMode.SafeMode,
            SafeModeEnabled = true,
            CurrentCapacity = 75,
            LastAction = SwarmActionKind.EnableSafeMode,
            LastActionReason = "High error rate"
        });

        // Act
        var response = new SwarmStateResponseDto
        {
            Version = "1.0",
            GeneratedAt = DateTimeOffset.UtcNow,
            Counties = store.GetAllStates()
        };

        var json = JsonSerializer.Serialize(response);
        var deserialized = JsonSerializer.Deserialize<SwarmStateResponseDto>(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.Equal("1.0", deserialized.Version);
        Assert.Single(deserialized.Counties);
        Assert.Equal("benton", deserialized.Counties[0].CountyId);
    }

    #endregion
}
