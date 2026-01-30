// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30: SystemGPT Swarm State Store
// In-memory V1 state store for county Swarm states
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 30: Swarm State Store.
/// Thread-safe in-memory store for county Swarm states.
/// V1 implementation - consider Redis in Phase 32.
/// </summary>
public class SystemGptSwarmStateStore : ISystemGptSwarmStateStore
{
    private readonly ConcurrentDictionary<string, SwarmStateSnapshot> _states;
    private readonly ILogger<SystemGptSwarmStateStore> _logger;
    private readonly object _updateLock = new();

    // Default values for new counties
    private const int DefaultCapacity = 50;
    private const int DefaultMinCapacity = 10;
    private const int DefaultMaxCapacity = 100;
    private const int CapacityStep = 10;

    public SystemGptSwarmStateStore(ILogger<SystemGptSwarmStateStore> logger)
    {
        _states = new ConcurrentDictionary<string, SwarmStateSnapshot>(StringComparer.OrdinalIgnoreCase);
        _logger = logger;
    }

    /// <summary>
    /// Get the current state for a county.
    /// Returns a default state if the county doesn't exist.
    /// </summary>
    public SwarmStateSnapshot GetState(string countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            throw new ArgumentException("County ID cannot be null or empty", nameof(countyId));
        }

        var normalizedId = countyId.ToLowerInvariant();

        if (_states.TryGetValue(normalizedId, out var state))
        {
            return state;
        }

        // Return default state for new county
        return CreateDefaultState(normalizedId);
    }

    /// <summary>
    /// Get all county states.
    /// </summary>
    public IReadOnlyList<SwarmStateSnapshot> GetAllStates()
    {
        return _states.Values.ToList().AsReadOnly();
    }

    /// <summary>
    /// Update or create state for a county.
    /// </summary>
    public void UpdateState(SwarmStateSnapshot state)
    {
        if (state == null)
        {
            throw new ArgumentNullException(nameof(state));
        }

        var normalizedId = state.CountyId.ToLowerInvariant();
        var normalizedState = state with { CountyId = normalizedId, UpdatedAt = DateTimeOffset.UtcNow };

        _states.AddOrUpdate(
            normalizedId,
            normalizedState,
            (_, _) => normalizedState);

        _logger.LogDebug(
            "Updated state for county {CountyId}: Mode={Mode}, Capacity={Capacity}",
            normalizedId, state.Mode, state.CurrentCapacity);
    }

    /// <summary>
    /// Apply a successful action result to update state.
    /// </summary>
    public void ApplyAction(SwarmActionResult result)
    {
        if (!result.Success)
        {
            _logger.LogDebug(
                "Skipping state update for failed action {Action} on county {CountyId}",
                result.Action, result.CountyId);
            return;
        }

        var normalizedId = result.CountyId.ToLowerInvariant();

        lock (_updateLock)
        {
            var currentState = GetState(normalizedId);
            var updatedState = ApplyActionToState(currentState, result);

            _states.AddOrUpdate(
                normalizedId,
                updatedState,
                (_, _) => updatedState);
        }

        _logger.LogInformation(
            "Applied action {Action} to county {CountyId}",
            result.Action, normalizedId);
    }

    /// <summary>
    /// Record a healthy interval for a county (increments counter, resets critical).
    /// </summary>
    public void RecordHealthyInterval(string countyId)
    {
        var normalizedId = countyId.ToLowerInvariant();

        lock (_updateLock)
        {
            var state = GetState(normalizedId);
            var updated = state with
            {
                HealthyIntervalCount = state.HealthyIntervalCount + 1,
                CriticalIntervalCount = 0, // Reset critical counter
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _states.AddOrUpdate(normalizedId, updated, (_, _) => updated);
        }

        _logger.LogDebug("Recorded healthy interval for county {CountyId}", normalizedId);
    }

    /// <summary>
    /// Record a critical interval for a county (increments counter, resets healthy).
    /// </summary>
    public void RecordCriticalInterval(string countyId)
    {
        var normalizedId = countyId.ToLowerInvariant();

        lock (_updateLock)
        {
            var state = GetState(normalizedId);
            var updated = state with
            {
                CriticalIntervalCount = state.CriticalIntervalCount + 1,
                HealthyIntervalCount = 0, // Reset healthy counter
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _states.AddOrUpdate(normalizedId, updated, (_, _) => updated);
        }

        _logger.LogDebug("Recorded critical interval for county {CountyId}", normalizedId);
    }

    /// <summary>
    /// Clear state for a specific county.
    /// </summary>
    public void ClearState(string countyId)
    {
        var normalizedId = countyId.ToLowerInvariant();
        _states.TryRemove(normalizedId, out _);
        _logger.LogDebug("Cleared state for county {CountyId}", normalizedId);
    }

    /// <summary>
    /// Clear all county states.
    /// </summary>
    public void ClearAllStates()
    {
        _states.Clear();
        _logger.LogDebug("Cleared all county states");
    }

    #region Private Helpers

    private static SwarmStateSnapshot CreateDefaultState(string countyId)
    {
        return new SwarmStateSnapshot
        {
            CountyId = countyId,
            Mode = SwarmMode.Normal,
            SafeModeEnabled = false,
            ThrottleEnabled = false,
            CurrentCapacity = DefaultCapacity,
            MinCapacity = DefaultMinCapacity,
            MaxCapacity = DefaultMaxCapacity,
            LastAction = SwarmActionKind.None,
            LastActionTimestamp = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            HealthyIntervalCount = 0,
            CriticalIntervalCount = 0
        };
    }

    private SwarmStateSnapshot ApplyActionToState(SwarmStateSnapshot state, SwarmActionResult result)
    {
        return result.Action switch
        {
            SwarmActionKind.EnableSafeMode => state with
            {
                SafeModeEnabled = true,
                Mode = SwarmMode.SafeMode,
                LastAction = SwarmActionKind.EnableSafeMode,
                LastActionReason = "SafeMode enabled",
                LastActionTimestamp = result.ExecutedAt,
                UpdatedAt = DateTimeOffset.UtcNow,
                HealthyIntervalCount = 0 // Reset on mode change
            },

            SwarmActionKind.DisableSafeMode => state with
            {
                SafeModeEnabled = false,
                Mode = state.ThrottleEnabled ? SwarmMode.Throttled : SwarmMode.Normal,
                LastAction = SwarmActionKind.DisableSafeMode,
                LastActionReason = "SafeMode disabled - system recovered",
                LastActionTimestamp = result.ExecutedAt,
                UpdatedAt = DateTimeOffset.UtcNow
            },

            SwarmActionKind.IncreaseCapacity => state with
            {
                CurrentCapacity = Math.Min(state.CurrentCapacity + CapacityStep, state.MaxCapacity),
                LastAction = SwarmActionKind.IncreaseCapacity,
                LastActionReason = "Capacity increased",
                LastActionTimestamp = result.ExecutedAt,
                UpdatedAt = DateTimeOffset.UtcNow
            },

            SwarmActionKind.DecreaseCapacity => state with
            {
                CurrentCapacity = Math.Max(state.CurrentCapacity - CapacityStep, state.MinCapacity),
                LastAction = SwarmActionKind.DecreaseCapacity,
                LastActionReason = "Capacity decreased - low load",
                LastActionTimestamp = result.ExecutedAt,
                UpdatedAt = DateTimeOffset.UtcNow
            },

            SwarmActionKind.ThrottleRequests => state with
            {
                ThrottleEnabled = true,
                Mode = SwarmMode.Throttled,
                LastAction = SwarmActionKind.ThrottleRequests,
                LastActionReason = "Throttling enabled",
                LastActionTimestamp = result.ExecutedAt,
                UpdatedAt = DateTimeOffset.UtcNow,
                HealthyIntervalCount = 0 // Reset on mode change
            },

            SwarmActionKind.RelaxThrottle => state with
            {
                ThrottleEnabled = false,
                Mode = state.SafeModeEnabled ? SwarmMode.SafeMode : SwarmMode.Normal,
                LastAction = SwarmActionKind.RelaxThrottle,
                LastActionReason = "Throttle relaxed",
                LastActionTimestamp = result.ExecutedAt,
                UpdatedAt = DateTimeOffset.UtcNow
            },

            SwarmActionKind.RouteToSafeModel => state with
            {
                Mode = SwarmMode.Offline,
                LastAction = SwarmActionKind.RouteToSafeModel,
                LastActionReason = "Routing to safe model - primary offline",
                LastActionTimestamp = result.ExecutedAt,
                UpdatedAt = DateTimeOffset.UtcNow
            },

            _ => state with
            {
                UpdatedAt = DateTimeOffset.UtcNow
            }
        };
    }

    #endregion
}

/// <summary>
/// Interface for Swarm State Store.
/// </summary>
public interface ISystemGptSwarmStateStore
{
    SwarmStateSnapshot GetState(string countyId);
    IReadOnlyList<SwarmStateSnapshot> GetAllStates();
    void UpdateState(SwarmStateSnapshot state);
    void ApplyAction(SwarmActionResult result);
    void RecordHealthyInterval(string countyId);
    void RecordCriticalInterval(string countyId);
    void ClearState(string countyId);
    void ClearAllStates();
}
