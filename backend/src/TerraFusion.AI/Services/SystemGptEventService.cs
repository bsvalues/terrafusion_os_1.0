// ═══════════════════════════════════════════════════════════════════════════════
// 📜 TerraFusion SystemGPT Event Service
// Phase 19: AI Incident Timeline - "What happened to the AI system this week?"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 19: Service interface for SystemGPT event timeline.
/// Provides access to AI system events for auditing and visibility.
/// </summary>
public interface ISystemGptEventService
{
    /// <summary>
    /// Get recent AI system events.
    /// </summary>
    /// <param name="sinceUtc">Optional: only return events after this timestamp.</param>
    /// <param name="limit">Maximum number of events to return.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of events, ordered newest first.</returns>
    Task<IReadOnlyList<SystemGptEventDto>> GetRecentEventsAsync(
        DateTimeOffset? sinceUtc,
        int limit,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Record a new AI system event.
    /// </summary>
    void RecordEvent(SystemGptEventDto evt);

    /// <summary>
    /// Record a new AI system event (convenience overload).
    /// </summary>
    void RecordEvent(
        SystemGptEventKind kind,
        string severity,
        string summary,
        string? details = null,
        string? actor = null,
        string? correlationId = null);
}

/// <summary>
/// Phase 19: In-memory implementation of SystemGPT event service.
/// Events are stored in a bounded ring buffer (no database required).
/// </summary>
public class SystemGptEventService : ISystemGptEventService
{
    private readonly ILogger<SystemGptEventService> _logger;
    private readonly ConcurrentQueue<SystemGptEventDto> _events = new();
    private readonly object _pruneLock = new();

    /// <summary>
    /// Maximum number of events to retain in memory.
    /// </summary>
    public const int MaxEventCapacity = 500;

    /// <summary>
    /// Default limit when not specified.
    /// </summary>
    public const int DefaultLimit = 100;

    /// <summary>
    /// Default lookback period when sinceUtc is not specified.
    /// </summary>
    public static readonly TimeSpan DefaultLookback = TimeSpan.FromDays(7);

    public SystemGptEventService(ILogger<SystemGptEventService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _logger.LogInformation("Phase 19: SystemGptEventService initialized - AI Incident Timeline ready");

        // Record initial startup event
        RecordEvent(
            SystemGptEventKind.Unknown,
            "info",
            "SystemGPT Event Timeline initialized",
            "AI incident tracking is now active.",
            "system");
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<SystemGptEventDto>> GetRecentEventsAsync(
        DateTimeOffset? sinceUtc,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var effectiveLimit = limit > 0 ? limit : DefaultLimit;
        var effectiveSince = sinceUtc ?? DateTimeOffset.UtcNow.Subtract(DefaultLookback);

        var result = _events
            .Where(e => e.TimestampUtc >= effectiveSince)
            .OrderByDescending(e => e.TimestampUtc)
            .Take(effectiveLimit)
            .ToList();

        _logger.LogDebug("Phase 19: Returning {Count} events since {Since}", result.Count, effectiveSince);

        return Task.FromResult<IReadOnlyList<SystemGptEventDto>>(result);
    }

    /// <inheritdoc />
    public void RecordEvent(SystemGptEventDto evt)
    {
        _events.Enqueue(evt);
        _logger.LogDebug("Phase 19: Recorded event [{Kind}] {Summary}", evt.Kind, evt.Summary);

        // Prune if over capacity
        PruneIfNeeded();
    }

    /// <inheritdoc />
    public void RecordEvent(
        SystemGptEventKind kind,
        string severity,
        string summary,
        string? details = null,
        string? actor = null,
        string? correlationId = null)
    {
        RecordEvent(new SystemGptEventDto
        {
            TimestampUtc = DateTimeOffset.UtcNow,
            Kind = kind,
            Severity = severity,
            Summary = summary,
            Details = details,
            Actor = actor,
            CorrelationId = correlationId
        });
    }

    /// <summary>
    /// Remove oldest events if queue exceeds capacity.
    /// </summary>
    private void PruneIfNeeded()
    {
        if (_events.Count <= MaxEventCapacity) return;

        lock (_pruneLock)
        {
            while (_events.Count > MaxEventCapacity)
            {
                _events.TryDequeue(out _);
            }
        }
    }
}
