// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30 TESTS: SystemGptSwarmStateStore Unit Tests
// TDD Red Phase: Write tests BEFORE implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase30;

/// <summary>
/// Phase 30: Swarm State Store tests.
/// Tests the in-memory V1 state store for Swarm county states.
///
/// Test Plan Section 3-C:
/// - CRUD operations per county
/// - Thread safety
/// - State transitions
/// - Healthy interval tracking
/// </summary>
public class SystemGptSwarmStateStoreTests
{
    private readonly Mock<ILogger<SystemGptSwarmStateStore>> _loggerMock;

    public SystemGptSwarmStateStoreTests()
    {
        _loggerMock = new Mock<ILogger<SystemGptSwarmStateStore>>();
    }

    private SystemGptSwarmStateStore CreateStore()
    {
        return new SystemGptSwarmStateStore(_loggerMock.Object);
    }

    #region Get State

    [Fact]
    public void GetState_NewCounty_ReturnsDefaultState()
    {
        // Arrange
        var store = CreateStore();

        // Act
        var state = store.GetState("new_county");

        // Assert
        Assert.NotNull(state);
        Assert.Equal("new_county", state.CountyId);
        Assert.Equal(SwarmMode.Normal, state.Mode);
        Assert.False(state.SafeModeEnabled);
        Assert.False(state.ThrottleEnabled);
        Assert.Equal(50, state.CurrentCapacity); // Default capacity
    }

    [Fact]
    public void GetState_ExistingCounty_ReturnsSavedState()
    {
        // Arrange
        var store = CreateStore();
        var initialState = new SwarmStateSnapshot
        {
            CountyId = "benton",
            Mode = SwarmMode.SafeMode,
            SafeModeEnabled = true,
            CurrentCapacity = 80
        };
        store.UpdateState(initialState);

        // Act
        var retrievedState = store.GetState("benton");

        // Assert
        Assert.Equal(SwarmMode.SafeMode, retrievedState.Mode);
        Assert.True(retrievedState.SafeModeEnabled);
        Assert.Equal(80, retrievedState.CurrentCapacity);
    }

    [Fact]
    public void GetState_CaseInsensitive_ReturnsState()
    {
        // Arrange
        var store = CreateStore();
        var state = new SwarmStateSnapshot
        {
            CountyId = "benton",
            CurrentCapacity = 75
        };
        store.UpdateState(state);

        // Act
        var retrieved1 = store.GetState("BENTON");
        var retrieved2 = store.GetState("Benton");
        var retrieved3 = store.GetState("benton");

        // Assert
        Assert.Equal(75, retrieved1.CurrentCapacity);
        Assert.Equal(75, retrieved2.CurrentCapacity);
        Assert.Equal(75, retrieved3.CurrentCapacity);
    }

    #endregion

    #region Update State

    [Fact]
    public void UpdateState_NewCounty_CreatesState()
    {
        // Arrange
        var store = CreateStore();
        var newState = new SwarmStateSnapshot
        {
            CountyId = "yakima",
            Mode = SwarmMode.Normal,
            CurrentCapacity = 60
        };

        // Act
        store.UpdateState(newState);
        var retrieved = store.GetState("yakima");

        // Assert
        Assert.Equal("yakima", retrieved.CountyId);
        Assert.Equal(60, retrieved.CurrentCapacity);
    }

    [Fact]
    public void UpdateState_ExistingCounty_ReplacesState()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "king",
            Mode = SwarmMode.Normal,
            CurrentCapacity = 50
        };
        store.UpdateState(initial);

        var updated = new SwarmStateSnapshot
        {
            CountyId = "king",
            Mode = SwarmMode.SafeMode,
            SafeModeEnabled = true,
            CurrentCapacity = 90
        };

        // Act
        store.UpdateState(updated);
        var retrieved = store.GetState("king");

        // Assert
        Assert.Equal(SwarmMode.SafeMode, retrieved.Mode);
        Assert.True(retrieved.SafeModeEnabled);
        Assert.Equal(90, retrieved.CurrentCapacity);
    }

    [Fact]
    public void UpdateState_TracksLastAction()
    {
        // Arrange
        var store = CreateStore();
        var state = new SwarmStateSnapshot
        {
            CountyId = "pierce",
            LastAction = SwarmActionKind.EnableSafeMode,
            LastActionReason = "High error rate"
        };

        // Act
        store.UpdateState(state);
        var retrieved = store.GetState("pierce");

        // Assert
        Assert.Equal(SwarmActionKind.EnableSafeMode, retrieved.LastAction);
        Assert.Equal("High error rate", retrieved.LastActionReason);
    }

    #endregion

    #region Apply Action

    [Fact]
    public void ApplyAction_EnableSafeMode_UpdatesState()
    {
        // Arrange
        var store = CreateStore();
        var result = new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.EnableSafeMode,
            CountyId = "benton"
        };

        // Act
        store.ApplyAction(result);
        var state = store.GetState("benton");

        // Assert
        Assert.True(state.SafeModeEnabled);
        Assert.Equal(SwarmMode.SafeMode, state.Mode);
        Assert.Equal(SwarmActionKind.EnableSafeMode, state.LastAction);
    }

    [Fact]
    public void ApplyAction_DisableSafeMode_UpdatesState()
    {
        // Arrange
        var store = CreateStore();
        // First enable safe mode
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.EnableSafeMode,
            CountyId = "benton"
        });

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.DisableSafeMode,
            CountyId = "benton"
        });
        var state = store.GetState("benton");

        // Assert
        Assert.False(state.SafeModeEnabled);
        Assert.Equal(SwarmMode.Normal, state.Mode);
    }

    [Fact]
    public void ApplyAction_IncreaseCapacity_IncrementsCapacity()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "yakima",
            CurrentCapacity = 50,
            MaxCapacity = 100
        };
        store.UpdateState(initial);

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.IncreaseCapacity,
            CountyId = "yakima"
        });
        var state = store.GetState("yakima");

        // Assert
        Assert.Equal(60, state.CurrentCapacity); // +10 step
    }

    [Fact]
    public void ApplyAction_DecreaseCapacity_DecrementsCapacity()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "clark",
            CurrentCapacity = 70,
            MinCapacity = 10
        };
        store.UpdateState(initial);

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.DecreaseCapacity,
            CountyId = "clark"
        });
        var state = store.GetState("clark");

        // Assert
        Assert.Equal(60, state.CurrentCapacity); // -10 step
    }

    [Fact]
    public void ApplyAction_IncreaseCapacity_RespectsMaxCapacity()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "spokane",
            CurrentCapacity = 95,
            MaxCapacity = 100
        };
        store.UpdateState(initial);

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.IncreaseCapacity,
            CountyId = "spokane"
        });
        var state = store.GetState("spokane");

        // Assert
        Assert.Equal(100, state.CurrentCapacity); // Capped at max
    }

    [Fact]
    public void ApplyAction_DecreaseCapacity_RespectsMinCapacity()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "thurston",
            CurrentCapacity = 15,
            MinCapacity = 10
        };
        store.UpdateState(initial);

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.DecreaseCapacity,
            CountyId = "thurston"
        });
        var state = store.GetState("thurston");

        // Assert
        Assert.Equal(10, state.CurrentCapacity); // Capped at min
    }

    [Fact]
    public void ApplyAction_ThrottleRequests_EnablesThrottle()
    {
        // Arrange
        var store = CreateStore();

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.ThrottleRequests,
            CountyId = "snohomish"
        });
        var state = store.GetState("snohomish");

        // Assert
        Assert.True(state.ThrottleEnabled);
        Assert.Equal(SwarmMode.Throttled, state.Mode);
    }

    [Fact]
    public void ApplyAction_RelaxThrottle_DisablesThrottle()
    {
        // Arrange
        var store = CreateStore();
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.ThrottleRequests,
            CountyId = "whatcom"
        });

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = true,
            Action = SwarmActionKind.RelaxThrottle,
            CountyId = "whatcom"
        });
        var state = store.GetState("whatcom");

        // Assert
        Assert.False(state.ThrottleEnabled);
        Assert.Equal(SwarmMode.Normal, state.Mode);
    }

    [Fact]
    public void ApplyAction_FailedAction_DoesNotUpdateState()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "island",
            SafeModeEnabled = false,
            Mode = SwarmMode.Normal
        };
        store.UpdateState(initial);

        // Act
        store.ApplyAction(new SwarmActionResult
        {
            Success = false, // Failed!
            Action = SwarmActionKind.EnableSafeMode,
            CountyId = "island",
            FailureReason = "Swarm unavailable"
        });
        var state = store.GetState("island");

        // Assert
        Assert.False(state.SafeModeEnabled);
        Assert.Equal(SwarmMode.Normal, state.Mode);
    }

    #endregion

    #region Healthy Interval Tracking

    [Fact]
    public void RecordHealthyInterval_IncrementsCounter()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "san_juan",
            HealthyIntervalCount = 0
        };
        store.UpdateState(initial);

        // Act
        store.RecordHealthyInterval("san_juan");
        store.RecordHealthyInterval("san_juan");
        store.RecordHealthyInterval("san_juan");
        var state = store.GetState("san_juan");

        // Assert
        Assert.Equal(3, state.HealthyIntervalCount);
    }

    [Fact]
    public void RecordCriticalInterval_IncrementsCounter()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "kitsap",
            CriticalIntervalCount = 0
        };
        store.UpdateState(initial);

        // Act
        store.RecordCriticalInterval("kitsap");
        store.RecordCriticalInterval("kitsap");
        var state = store.GetState("kitsap");

        // Assert
        Assert.Equal(2, state.CriticalIntervalCount);
    }

    [Fact]
    public void RecordHealthyInterval_ResetsCriticalCounter()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "kitsap",
            CriticalIntervalCount = 5,
            HealthyIntervalCount = 0
        };
        store.UpdateState(initial);

        // Act
        store.RecordHealthyInterval("kitsap");
        var state = store.GetState("kitsap");

        // Assert
        Assert.Equal(1, state.HealthyIntervalCount);
        Assert.Equal(0, state.CriticalIntervalCount); // Reset
    }

    [Fact]
    public void RecordCriticalInterval_ResetsHealthyCounter()
    {
        // Arrange
        var store = CreateStore();
        var initial = new SwarmStateSnapshot
        {
            CountyId = "lewis",
            HealthyIntervalCount = 5,
            CriticalIntervalCount = 0
        };
        store.UpdateState(initial);

        // Act
        store.RecordCriticalInterval("lewis");
        var state = store.GetState("lewis");

        // Assert
        Assert.Equal(1, state.CriticalIntervalCount);
        Assert.Equal(0, state.HealthyIntervalCount); // Reset
    }

    #endregion

    #region Get All States

    [Fact]
    public void GetAllStates_NoCounties_ReturnsEmpty()
    {
        // Arrange
        var store = CreateStore();

        // Act
        var states = store.GetAllStates();

        // Assert
        Assert.Empty(states);
    }

    [Fact]
    public void GetAllStates_MultipleCounties_ReturnsAll()
    {
        // Arrange
        var store = CreateStore();
        store.UpdateState(new SwarmStateSnapshot { CountyId = "benton" });
        store.UpdateState(new SwarmStateSnapshot { CountyId = "yakima" });
        store.UpdateState(new SwarmStateSnapshot { CountyId = "king" });

        // Act
        var states = store.GetAllStates();

        // Assert
        Assert.Equal(3, states.Count);
        Assert.Contains(states, s => s.CountyId == "benton");
        Assert.Contains(states, s => s.CountyId == "yakima");
        Assert.Contains(states, s => s.CountyId == "king");
    }

    [Fact]
    public void GetAllStates_ReturnsImmutableCopy()
    {
        // Arrange
        var store = CreateStore();
        store.UpdateState(new SwarmStateSnapshot { CountyId = "test" });

        // Act
        var states1 = store.GetAllStates();
        store.UpdateState(new SwarmStateSnapshot { CountyId = "new_county" });
        var states2 = store.GetAllStates();

        // Assert
        Assert.Single(states1); // Original unchanged
        Assert.Equal(2, states2.Count); // New list has both
    }

    #endregion

    #region Thread Safety

    [Fact]
    public async Task ConcurrentUpdates_AreThreadSafe()
    {
        // Arrange
        var store = CreateStore();
        var counties = Enumerable.Range(1, 10).Select(i => $"county_{i}").ToList();

        // Act - simulate concurrent updates
        var tasks = counties.Select(async county =>
        {
            for (int i = 0; i < 100; i++)
            {
                store.UpdateState(new SwarmStateSnapshot
                {
                    CountyId = county,
                    CurrentCapacity = i
                });
                await Task.Yield();
            }
        });

        await Task.WhenAll(tasks);

        // Assert - all counties should exist with final state
        var states = store.GetAllStates();
        Assert.Equal(10, states.Count);
    }

    [Fact]
    public async Task ConcurrentReadsAndWrites_AreThreadSafe()
    {
        // Arrange
        var store = CreateStore();
        store.UpdateState(new SwarmStateSnapshot { CountyId = "benton", CurrentCapacity = 50 });
        var exceptions = new List<Exception>();

        // Act - concurrent reads and writes
        var writeTasks = Enumerable.Range(1, 50).Select(async i =>
        {
            try
            {
                store.UpdateState(new SwarmStateSnapshot
                {
                    CountyId = "benton",
                    CurrentCapacity = i
                });
                await Task.Yield();
            }
            catch (Exception ex) { exceptions.Add(ex); }
        });

        var readTasks = Enumerable.Range(1, 50).Select(async _ =>
        {
            try
            {
                var state = store.GetState("benton");
                Assert.NotNull(state);
                await Task.Yield();
            }
            catch (Exception ex) { exceptions.Add(ex); }
        });

        await Task.WhenAll(writeTasks.Concat(readTasks));

        // Assert
        Assert.Empty(exceptions);
    }

    #endregion

    #region Clear State

    [Fact]
    public void ClearState_RemovesCounty()
    {
        // Arrange
        var store = CreateStore();
        store.UpdateState(new SwarmStateSnapshot { CountyId = "temp_county" });

        // Act
        store.ClearState("temp_county");
        var state = store.GetState("temp_county");

        // Assert - should return default state
        Assert.Equal(SwarmMode.Normal, state.Mode);
        Assert.Equal(50, state.CurrentCapacity); // Default
    }

    [Fact]
    public void ClearAllStates_RemovesAllCounties()
    {
        // Arrange
        var store = CreateStore();
        store.UpdateState(new SwarmStateSnapshot { CountyId = "county1" });
        store.UpdateState(new SwarmStateSnapshot { CountyId = "county2" });
        store.UpdateState(new SwarmStateSnapshot { CountyId = "county3" });

        // Act
        store.ClearAllStates();
        var states = store.GetAllStates();

        // Assert
        Assert.Empty(states);
    }

    #endregion
}
