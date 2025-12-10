// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30 TESTS: SystemGptSwarmPolicyService Unit Tests
// TDD Red Phase: Write tests BEFORE implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase30;

/// <summary>
/// Phase 30: Swarm Policy Service tests.
/// Tests deterministic policy rules that map Atlas telemetry to Swarm actions.
///
/// Test Plan Section 3-A:
/// - Critical error rate → EnableSafeMode
/// - Critical latency → IncreaseCapacity
/// - Already in SafeMode + critical → IncreaseCapacity (until max)
/// - Warning → No action unless specific alerts
/// - Healthy for N intervals → DisableSafeMode, RelaxThrottle
/// - Hysteresis to prevent flapping
/// </summary>
public class SystemGptSwarmPolicyServiceTests
{
    private readonly Mock<ILogger<SystemGptSwarmPolicyService>> _loggerMock;
    private readonly SwarmPolicyOptions _defaultOptions;

    public SystemGptSwarmPolicyServiceTests()
    {
        _loggerMock = new Mock<ILogger<SystemGptSwarmPolicyService>>();
        _defaultOptions = new SwarmPolicyOptions
        {
            CriticalErrorRateThreshold = 5.0,
            CriticalLatencyThresholdMs = 1000,
            CriticalHealthScoreThreshold = 0.60,
            HealthyIntervalsForRecovery = 3,
            CapacityStep = 10,
            CapacityChangeHysteresisIntervals = 2
        };
    }

    private SystemGptSwarmPolicyService CreateService(SwarmPolicyOptions? options = null)
    {
        var opts = Options.Create(options ?? _defaultOptions);
        return new SystemGptSwarmPolicyService(opts, _loggerMock.Object);
    }

    #region Critical Error Rate → EnableSafeMode

    [Fact]
    public void EvaluatePolicy_CriticalErrorRate_ReturnsSafeModeAction()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "benton",
            HealthState = "critical",
            HealthScore = 0.55,
            ErrorRatePercent = 7.5, // Above 5.0 threshold
            P95LatencyMs = 200,
            ActiveRequests = 10,
            GuardrailTriggered = true,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "benton",
                SafeModeEnabled = false,
                Mode = SwarmMode.Normal
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.NotNull(decision);
        Assert.Equal("benton", decision.CountyId);
        Assert.Equal(SwarmActionKind.EnableSafeMode, decision.Action);
        Assert.Contains("error rate", decision.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(5.1)]
    [InlineData(10.0)]
    [InlineData(50.0)]
    public void EvaluatePolicy_ErrorRateAboveThreshold_EnablesSafeMode(double errorRate)
    {
        // Arrange
        var service = CreateService();
        var input = CreateInputWithErrorRate("yakima", errorRate, safeModeEnabled: false);

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.EnableSafeMode, decision.Action);
    }

    [Fact]
    public void EvaluatePolicy_ErrorRateExactlyAtThreshold_DoesNotEnableSafeMode()
    {
        // Arrange - at 5.0, not above
        var service = CreateService();
        var input = CreateInputWithErrorRate("kitsap", 5.0, safeModeEnabled: false);
        input = input with { HealthState = "warning" };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.NotEqual(SwarmActionKind.EnableSafeMode, decision.Action);
    }

    #endregion

    #region Critical Latency → IncreaseCapacity

    [Fact]
    public void EvaluatePolicy_CriticalLatency_ReturnsIncreaseCapacityAction()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "benton",
            HealthState = "critical",
            HealthScore = 0.65,
            ErrorRatePercent = 2.0, // Below SafeMode threshold
            P95LatencyMs = 1500, // Above 1000 threshold
            ActiveRequests = 50,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "benton",
                SafeModeEnabled = false,
                CurrentCapacity = 50,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.IncreaseCapacity, decision.Action);
        Assert.Contains("latency", decision.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(1001)]
    [InlineData(2000)]
    [InlineData(5000)]
    public void EvaluatePolicy_LatencyAboveThreshold_IncreasesCapacity(double latencyMs)
    {
        // Arrange
        var service = CreateService();
        var input = CreateInputWithLatency("spokane", latencyMs, currentCapacity: 50);

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.IncreaseCapacity, decision.Action);
    }

    #endregion

    #region SafeMode + Critical → IncreaseCapacity (until max)

    [Fact]
    public void EvaluatePolicy_AlreadyInSafeMode_CriticalLatency_IncreasesCapacity()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "benton",
            HealthState = "critical",
            HealthScore = 0.45,
            ErrorRatePercent = 7.0, // Would normally enable SafeMode
            P95LatencyMs = 1500,
            ActiveRequests = 100,
            GuardrailTriggered = true,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "benton",
                SafeModeEnabled = true, // Already in SafeMode
                CurrentCapacity = 50,
                MaxCapacity = 100,
                Mode = SwarmMode.SafeMode
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.IncreaseCapacity, decision.Action);
        Assert.Contains("capacity", decision.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EvaluatePolicy_AlreadyAtMaxCapacity_DoesNotIncreaseCapacity()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "benton",
            HealthState = "critical",
            HealthScore = 0.45,
            ErrorRatePercent = 3.0,
            P95LatencyMs = 1500,
            ActiveRequests = 100,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "benton",
                SafeModeEnabled = true,
                CurrentCapacity = 100, // Already at max
                MaxCapacity = 100,
                Mode = SwarmMode.SafeMode
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.NotEqual(SwarmActionKind.IncreaseCapacity, decision.Action);
    }

    #endregion

    #region Warning State → No Action (unless specific alerts)

    [Fact]
    public void EvaluatePolicy_WarningState_NoAlerts_ReturnsNone()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "pierce",
            HealthState = "warning",
            HealthScore = 0.75,
            ErrorRatePercent = 3.0,
            P95LatencyMs = 500,
            ActiveRequests = 20,
            GuardrailTriggered = false,
            ActiveAlerts = Array.Empty<string>(),
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "pierce",
                SafeModeEnabled = false,
                CurrentCapacity = 50,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.None, decision.Action);
    }

    [Fact]
    public void EvaluatePolicy_WarningState_WithLatencyAlert_ThrottlesRequests()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "king",
            HealthState = "warning",
            HealthScore = 0.72,
            ErrorRatePercent = 2.0,
            P95LatencyMs = 800, // Below critical but high
            ActiveRequests = 80,
            GuardrailTriggered = false,
            ActiveAlerts = new[] { "P95LatencyWarning" },
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "king",
                SafeModeEnabled = false,
                ThrottleEnabled = false,
                CurrentCapacity = 75,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.ThrottleRequests, decision.Action);
    }

    #endregion

    #region Healthy for N Intervals → DisableSafeMode / RelaxThrottle

    [Fact]
    public void EvaluatePolicy_HealthyForNIntervals_InSafeMode_DisablesSafeMode()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "benton",
            HealthState = "healthy",
            HealthScore = 0.95,
            ErrorRatePercent = 0.5,
            P95LatencyMs = 100,
            ActiveRequests = 15,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "benton",
                SafeModeEnabled = true,
                ThrottleEnabled = false,
                CurrentCapacity = 75,
                MaxCapacity = 100,
                Mode = SwarmMode.SafeMode,
                HealthyIntervalCount = 3 // Met threshold
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.DisableSafeMode, decision.Action);
        Assert.Contains("recover", decision.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EvaluatePolicy_HealthyForNIntervals_Throttled_RelaxesThrottle()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "clark",
            HealthState = "healthy",
            HealthScore = 0.92,
            ErrorRatePercent = 0.3,
            P95LatencyMs = 80,
            ActiveRequests = 12,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "clark",
                SafeModeEnabled = false,
                ThrottleEnabled = true,
                CurrentCapacity = 60,
                MaxCapacity = 100,
                Mode = SwarmMode.Throttled,
                HealthyIntervalCount = 4 // Above threshold
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.RelaxThrottle, decision.Action);
    }

    [Fact]
    public void EvaluatePolicy_HealthyButBelowNIntervals_NoRecoveryAction()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "benton",
            HealthState = "healthy",
            HealthScore = 0.90,
            ErrorRatePercent = 1.0,
            P95LatencyMs = 150,
            ActiveRequests = 10,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "benton",
                SafeModeEnabled = true,
                ThrottleEnabled = false,
                CurrentCapacity = 75,
                MaxCapacity = 100,
                Mode = SwarmMode.SafeMode,
                HealthyIntervalCount = 2 // Below 3 threshold
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.None, decision.Action);
        Assert.Contains("stable", decision.Reason, StringComparison.OrdinalIgnoreCase);
    }

    #endregion

    #region Hysteresis (Flapping Prevention)

    [Fact]
    public void EvaluatePolicy_RecentCapacityChange_DoesNotChangeAgain()
    {
        // Arrange
        var service = CreateService();
        var recentTimestamp = DateTimeOffset.UtcNow.AddSeconds(-10);
        var input = new SwarmPolicyInput
        {
            CountyId = "snohomish",
            HealthState = "critical",
            HealthScore = 0.55,
            ErrorRatePercent = 2.0, // Below SafeMode threshold
            P95LatencyMs = 1500, // Would normally trigger IncreaseCapacity
            ActiveRequests = 80,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "snohomish",
                SafeModeEnabled = false,
                CurrentCapacity = 60,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal,
                LastAction = SwarmActionKind.IncreaseCapacity,
                LastActionTimestamp = recentTimestamp, // Very recent
                CriticalIntervalCount = 1
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        // Should not change capacity again due to hysteresis
        Assert.NotEqual(SwarmActionKind.IncreaseCapacity, decision.Action);
    }

    [Fact]
    public void EvaluatePolicy_SufficientTimeElapsed_AllowsCapacityChange()
    {
        // Arrange
        var service = CreateService();
        var oldTimestamp = DateTimeOffset.UtcNow.AddMinutes(-5);
        var input = new SwarmPolicyInput
        {
            CountyId = "whatcom",
            HealthState = "critical",
            HealthScore = 0.50,
            ErrorRatePercent = 2.5,
            P95LatencyMs = 1800,
            ActiveRequests = 90,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "whatcom",
                SafeModeEnabled = false,
                CurrentCapacity = 60,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal,
                LastAction = SwarmActionKind.IncreaseCapacity,
                LastActionTimestamp = oldTimestamp, // Sufficient time elapsed
                CriticalIntervalCount = 3
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.IncreaseCapacity, decision.Action);
    }

    [Fact]
    public void EvaluatePolicy_SafeModeOverridesHysteresis_AlwaysEnables()
    {
        // Arrange - SafeMode is critical and should override hysteresis
        var service = CreateService();
        var recentTimestamp = DateTimeOffset.UtcNow.AddSeconds(-5);
        var input = new SwarmPolicyInput
        {
            CountyId = "thurston",
            HealthState = "critical",
            HealthScore = 0.40,
            ErrorRatePercent = 12.0, // Very high - critical
            P95LatencyMs = 500,
            ActiveRequests = 30,
            GuardrailTriggered = true,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "thurston",
                SafeModeEnabled = false,
                CurrentCapacity = 70,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal,
                LastAction = SwarmActionKind.RelaxThrottle,
                LastActionTimestamp = recentTimestamp
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.EnableSafeMode, decision.Action);
    }

    #endregion

    #region Decrease Capacity (Low Load)

    [Fact]
    public void EvaluatePolicy_HealthyLowLoad_DecreasesCapacity()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "island",
            HealthState = "healthy",
            HealthScore = 0.98,
            ErrorRatePercent = 0.1,
            P95LatencyMs = 50, // Very fast
            ActiveRequests = 2, // Very low
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "island",
                SafeModeEnabled = false,
                ThrottleEnabled = false,
                CurrentCapacity = 80, // High capacity for low load
                MinCapacity = 10,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal,
                HealthyIntervalCount = 10 // Long healthy streak
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.DecreaseCapacity, decision.Action);
    }

    [Fact]
    public void EvaluatePolicy_AtMinCapacity_DoesNotDecrease()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "san_juan",
            HealthState = "healthy",
            HealthScore = 0.99,
            ErrorRatePercent = 0.05,
            P95LatencyMs = 30,
            ActiveRequests = 1,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "san_juan",
                SafeModeEnabled = false,
                ThrottleEnabled = false,
                CurrentCapacity = 10, // Already at min
                MinCapacity = 10,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal,
                HealthyIntervalCount = 20
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.NotEqual(SwarmActionKind.DecreaseCapacity, decision.Action);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public void EvaluatePolicy_NullSwarmState_DefaultsToNormalMode()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "new_county",
            HealthState = "healthy",
            HealthScore = 0.90,
            ErrorRatePercent = 0.5,
            P95LatencyMs = 100,
            ActiveRequests = 10,
            GuardrailTriggered = false,
            CurrentSwarmState = null // New county, no state yet
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.None, decision.Action);
        Assert.Equal("new_county", decision.CountyId);
    }

    [Fact]
    public void EvaluatePolicy_OfflineState_ReturnsRouteToSafeModel()
    {
        // Arrange
        var service = CreateService();
        var input = new SwarmPolicyInput
        {
            CountyId = "offline_county",
            HealthState = "offline",
            HealthScore = 0.0,
            ErrorRatePercent = 100.0,
            P95LatencyMs = 0,
            ActiveRequests = 0,
            GuardrailTriggered = true,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = "offline_county",
                SafeModeEnabled = false,
                Mode = SwarmMode.Normal
            }
        };

        // Act
        var decision = service.EvaluatePolicy(input);

        // Assert
        Assert.Equal(SwarmActionKind.RouteToSafeModel, decision.Action);
    }

    [Fact]
    public void EvaluatePolicy_AlwaysReturnsValidDecision()
    {
        // Arrange
        var service = CreateService();
        var inputs = GenerateEdgeCaseInputs();

        foreach (var input in inputs)
        {
            // Act
            var decision = service.EvaluatePolicy(input);

            // Assert
            Assert.NotNull(decision);
            Assert.NotNull(decision.Reason);
            Assert.Equal(input.CountyId, decision.CountyId);
            Assert.True(decision.Confidence >= 0 && decision.Confidence <= 1);
            Assert.True(Enum.IsDefined(typeof(SwarmActionKind), decision.Action));
        }
    }

    #endregion

    #region Helper Methods

    private static SwarmPolicyInput CreateInputWithErrorRate(string countyId, double errorRate, bool safeModeEnabled)
    {
        return new SwarmPolicyInput
        {
            CountyId = countyId,
            HealthState = errorRate > 5.0 ? "critical" : "warning",
            HealthScore = Math.Max(0.1, 1.0 - (errorRate / 20.0)),
            ErrorRatePercent = errorRate,
            P95LatencyMs = 200,
            ActiveRequests = 25,
            GuardrailTriggered = errorRate > 5.0,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = countyId,
                SafeModeEnabled = safeModeEnabled,
                CurrentCapacity = 50,
                MaxCapacity = 100,
                Mode = safeModeEnabled ? SwarmMode.SafeMode : SwarmMode.Normal
            }
        };
    }

    private static SwarmPolicyInput CreateInputWithLatency(string countyId, double latencyMs, int currentCapacity)
    {
        return new SwarmPolicyInput
        {
            CountyId = countyId,
            HealthState = latencyMs > 1000 ? "critical" : "warning",
            HealthScore = Math.Max(0.3, 1.0 - (latencyMs / 3000.0)),
            ErrorRatePercent = 1.0,
            P95LatencyMs = latencyMs,
            ActiveRequests = 50,
            GuardrailTriggered = false,
            CurrentSwarmState = new SwarmStateSnapshot
            {
                CountyId = countyId,
                SafeModeEnabled = false,
                CurrentCapacity = currentCapacity,
                MaxCapacity = 100,
                Mode = SwarmMode.Normal
            }
        };
    }

    private static IEnumerable<SwarmPolicyInput> GenerateEdgeCaseInputs()
    {
        yield return new SwarmPolicyInput
        {
            CountyId = "edge1",
            HealthState = "healthy",
            HealthScore = 1.0, // Perfect
            ErrorRatePercent = 0,
            P95LatencyMs = 0,
            ActiveRequests = 0
        };

        yield return new SwarmPolicyInput
        {
            CountyId = "edge2",
            HealthState = "critical",
            HealthScore = 0, // Worst
            ErrorRatePercent = 100,
            P95LatencyMs = double.MaxValue,
            ActiveRequests = int.MaxValue
        };

        yield return new SwarmPolicyInput
        {
            CountyId = "edge3",
            HealthState = "warning",
            HealthScore = 0.5,
            ErrorRatePercent = 2.5,
            P95LatencyMs = 500,
            ActiveRequests = 25
        };
    }

    #endregion
}
