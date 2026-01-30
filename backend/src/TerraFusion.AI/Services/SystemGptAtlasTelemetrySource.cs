// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29: SystemGPT Atlas Telemetry Source
// Gathers raw metrics from existing services for live streaming
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 29: Interface for retrieving current county metrics.
/// Abstracted to support different telemetry backends.
/// </summary>
public interface ISystemGptAtlasTelemetrySource
{
    /// <summary>
    /// Retrieves current metrics for all counties.
    /// </summary>
    Task<IReadOnlyList<RawCountyMetrics>> GetCurrentMetricsAsync(CancellationToken cancellationToken);
}

/// <summary>
/// Phase 29: Default telemetry source that aggregates from existing services.
/// Integrates with FederatedOverview, RAG Fleet, and Guardrails services.
/// </summary>
public sealed class SystemGptAtlasTelemetrySource : ISystemGptAtlasTelemetrySource
{
    private readonly ISystemGptAtlasService _atlasService;
    private readonly ILogger<SystemGptAtlasTelemetrySource> _logger;

    // Simulated real-time metrics (in production, would come from Prometheus/metrics store)
    private readonly Random _jitter = new();

    public SystemGptAtlasTelemetrySource(
        ISystemGptAtlasService atlasService,
        ILogger<SystemGptAtlasTelemetrySource> logger)
    {
        _atlasService = atlasService ?? throw new ArgumentNullException(nameof(atlasService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RawCountyMetrics>> GetCurrentMetricsAsync(CancellationToken cancellationToken)
    {
        try
        {
            // Get static atlas data from Phase 28 service
            var atlas = await _atlasService.GetAtlasAsync(cancellationToken);
            
            if (atlas?.Nodes == null || atlas.Nodes.Count == 0)
            {
                _logger.LogWarning("Atlas returned no nodes - returning empty metrics");
                return Array.Empty<RawCountyMetrics>();
            }

            // Transform Phase 28 static nodes into Phase 29 live metrics
            var metrics = new List<RawCountyMetrics>();
            
            foreach (var node in atlas.Nodes)
            {
                var rawMetrics = TransformToRawMetrics(node);
                metrics.Add(rawMetrics);
            }

            _logger.LogDebug("Retrieved metrics for {Count} counties", metrics.Count);
            return metrics.AsReadOnly();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve telemetry metrics");
            throw;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Implementation
    // ─────────────────────────────────────────────────────────────────────────

    private RawCountyMetrics TransformToRawMetrics(SystemGptAtlasNodeDto node)
    {
        // Convert Phase 28 health string to Phase 29 health score
        var healthScore = ConvertHealthToScore(node.Health, node.Configured);

        // Convert RAG status to active boolean
        var ragActive = node.RagStatus == "Ready" || node.RagStatus == "Partial";

        // Simulate real-time metrics with jitter
        // In production, these would come from actual metrics collection
        var (activeRequests, p95LatencyMs, errorRatePercent) = SimulateRealtimeMetrics(node);

        return new RawCountyMetrics
        {
            CountyId = node.CountyId,
            HealthScore = healthScore,
            RagActive = ragActive,
            GuardrailTriggered = node.RecentGuardrailDeny,
            ActiveRequests = activeRequests,
            P95LatencyMs = p95LatencyMs,
            ErrorRatePercent = errorRatePercent
        };
    }

    private double ConvertHealthToScore(string health, bool configured)
    {
        // Unconfigured counties have no health score
        if (!configured) return 0.0;

        return health switch
        {
            "Healthy" => 0.90 + (_jitter.NextDouble() * 0.10),    // 0.90-1.00
            "Degraded" => 0.65 + (_jitter.NextDouble() * 0.15),   // 0.65-0.80
            "Unhealthy" => 0.40 + (_jitter.NextDouble() * 0.20),  // 0.40-0.60
            "Unknown" => 0.50 + (_jitter.NextDouble() * 0.20),    // 0.50-0.70
            _ => 0.50 + (_jitter.NextDouble() * 0.20)             // Default
        };
    }

    private (int activeRequests, double p95Ms, double errorRate) SimulateRealtimeMetrics(
        SystemGptAtlasNodeDto node)
    {
        // Base metrics vary by health status
        var (baseRequests, baseLatency, baseError) = node.Health switch
        {
            "Healthy" => (20, 80.0, 0.1),
            "Degraded" => (15, 250.0, 2.0),
            "Unhealthy" => (5, 800.0, 8.0),
            _ => (10, 150.0, 1.0)
        };

        // Add realistic jitter
        var activeRequests = Math.Max(0, baseRequests + _jitter.Next(-5, 10));
        var p95Ms = Math.Max(10, baseLatency + (_jitter.NextDouble() * 100) - 50);
        var errorRate = Math.Max(0, baseError + (_jitter.NextDouble() * 0.5) - 0.25);

        // Unconfigured counties have minimal activity
        if (!node.Configured)
        {
            activeRequests = 0;
            p95Ms = 0;
            errorRate = 0;
        }

        return (activeRequests, p95Ms, errorRate);
    }
}
