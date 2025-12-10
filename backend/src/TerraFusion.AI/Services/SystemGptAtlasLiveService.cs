// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29: SystemGPT Atlas Live Service
// Streams real-time telemetry events at configurable intervals
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using System.Runtime.CompilerServices;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 29: Interface for live streaming Atlas telemetry.
/// </summary>
public interface ISystemGptAtlasLiveService
{
    /// <summary>
    /// Streams live telemetry events at configured intervals.
    /// Cancellation stops the stream gracefully.
    /// </summary>
    IAsyncEnumerable<SystemGptAtlasLiveEventDto> StreamEventsAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Gets a single snapshot of current live data (for polling fallback).
    /// </summary>
    Task<SystemGptAtlasLiveEventDto> GetCurrentSnapshotAsync(CancellationToken cancellationToken);
}

/// <summary>
/// Phase 29: Live streaming service that generates telemetry events.
/// Combines telemetry source + classifier to produce classified events.
/// </summary>
public sealed class SystemGptAtlasLiveService : ISystemGptAtlasLiveService
{
    private readonly ISystemGptAtlasTelemetrySource _telemetrySource;
    private readonly SystemGptAtlasClassifier _classifier;
    private readonly SystemGptAtlasLiveOptions _options;
    private readonly ILogger<SystemGptAtlasLiveService> _logger;

    public SystemGptAtlasLiveService(
        ISystemGptAtlasTelemetrySource telemetrySource,
        SystemGptAtlasClassifier classifier,
        IOptions<SystemGptAtlasLiveOptions> options,
        ILogger<SystemGptAtlasLiveService> logger)
    {
        _telemetrySource = telemetrySource ?? throw new ArgumentNullException(nameof(telemetrySource));
        _classifier = classifier ?? throw new ArgumentNullException(nameof(classifier));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<SystemGptAtlasLiveEventDto> StreamEventsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting Atlas live stream with interval {IntervalMs}ms", _options.IntervalMs);

        while (!cancellationToken.IsCancellationRequested)
        {
            cancellationToken.ThrowIfCancellationRequested();

            SystemGptAtlasLiveEventDto? evt = null;

            try
            {
                evt = await GenerateEventAsync(cancellationToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogDebug("Stream cancelled during event generation");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating live event, skipping this interval");
                // Continue streaming - don't break the stream on transient errors
            }

            if (evt != null)
            {
                yield return evt;
            }

            try
            {
                await Task.Delay(_options.IntervalMs, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogDebug("Stream cancelled during delay");
                throw;
            }
        }

        _logger.LogInformation("Atlas live stream stopped");
    }

    /// <inheritdoc />
    public async Task<SystemGptAtlasLiveEventDto> GetCurrentSnapshotAsync(CancellationToken cancellationToken)
    {
        return await GenerateEventAsync(cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Implementation
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<SystemGptAtlasLiveEventDto> GenerateEventAsync(CancellationToken cancellationToken)
    {
        // Get raw metrics from telemetry source
        var rawMetrics = await _telemetrySource.GetCurrentMetricsAsync(cancellationToken);

        // Classify each county's metrics
        var classifiedCounties = new List<SystemGptAtlasLiveCountyEventDto>();

        foreach (var raw in rawMetrics)
        {
            var classification = _classifier.Classify(raw);

            classifiedCounties.Add(new SystemGptAtlasLiveCountyEventDto
            {
                CountyId = raw.CountyId,
                HealthScore = raw.HealthScore,
                HealthState = classification.HealthState,
                RagActive = raw.RagActive,
                GuardrailTriggered = raw.GuardrailTriggered,
                ActiveRequests = raw.ActiveRequests,
                P95LatencyMs = raw.P95LatencyMs,
                ErrorRatePercent = raw.ErrorRatePercent,
                ActiveAlerts = classification.ActiveAlerts
            });
        }

        return new SystemGptAtlasLiveEventDto
        {
            Version = "1.0",
            EventType = "atlas_county_batch",
            Timestamp = DateTimeOffset.UtcNow,
            Counties = classifiedCounties.AsReadOnly()
        };
    }
}
