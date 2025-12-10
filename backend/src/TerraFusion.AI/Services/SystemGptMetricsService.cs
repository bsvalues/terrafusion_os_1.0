// ═══════════════════════════════════════════════════════════════════════════════
// 📈 TerraFusion SystemGPT Metrics Service
// Phase 20: Metrics & Telemetry Console
// "How fast is GPT right now?" "What's our error rate?" "How busy is the AI?"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 20: Internal sample record for metrics collection.
/// Captures timing and outcome of a single GPT request.
/// </summary>
internal sealed class GptRequestSample
{
    public DateTimeOffset TimestampUtc { get; init; }
    public double LatencyMs { get; init; }
    public bool Success { get; init; }
    public int TokensIn { get; init; }
    public int TokensOut { get; init; }
    public double? RagLatencyMs { get; init; }
    public double? EmbeddingLatencyMs { get; init; }
    public string? GptConfigKey { get; init; }
}

/// <summary>
/// Phase 20: Service interface for SystemGPT metrics collection and retrieval.
/// Provides real-time telemetry for the AI Control Center.
/// </summary>
public interface ISystemGptMetricsService
{
    /// <summary>
    /// Record a single GPT request sample for metrics aggregation.
    /// This method is non-blocking and failure-safe.
    /// </summary>
    void RecordSample(
        double latencyMs,
        bool success,
        int tokensIn = 0,
        int tokensOut = 0,
        double? ragLatencyMs = null,
        double? embeddingLatencyMs = null,
        string? gptConfigKey = null);

    /// <summary>
    /// Get a metrics snapshot for the specified time window.
    /// </summary>
    /// <param name="window">Time window to aggregate (e.g., 15 minutes).</param>
    /// <param name="maxSeriesPoints">Maximum data points per time series.</param>
    /// <returns>Aggregated metrics snapshot.</returns>
    SystemGptMetricsSnapshotDto GetSnapshot(TimeSpan window, int maxSeriesPoints = 50);
}

/// <summary>
/// Phase 20: In-memory implementation of SystemGPT metrics collection.
/// Uses a thread-safe bounded buffer with automatic pruning.
/// </summary>
public class SystemGptMetricsService : ISystemGptMetricsService
{
    private readonly ILogger<SystemGptMetricsService> _logger;
    private readonly ConcurrentQueue<GptRequestSample> _samples = new();
    private readonly object _pruneLock = new();

    /// <summary>Maximum samples to retain (1 hour at high load).</summary>
    public const int MaxSampleCapacity = 10000;

    /// <summary>Maximum age for samples (automatic pruning).</summary>
    public static readonly TimeSpan MaxSampleAge = TimeSpan.FromHours(1);

    /// <summary>Default window for metrics snapshot.</summary>
    public static readonly TimeSpan DefaultWindow = TimeSpan.FromMinutes(15);

    /// <summary>Maximum series points allowed.</summary>
    public const int MaxSeriesPointsCap = 200;

    public SystemGptMetricsService(ILogger<SystemGptMetricsService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _logger.LogInformation("Phase 20: SystemGptMetricsService initialized - AI Telemetry ready");
    }

    /// <inheritdoc />
    public void RecordSample(
        double latencyMs,
        bool success,
        int tokensIn = 0,
        int tokensOut = 0,
        double? ragLatencyMs = null,
        double? embeddingLatencyMs = null,
        string? gptConfigKey = null)
    {
        try
        {
            var sample = new GptRequestSample
            {
                TimestampUtc = DateTimeOffset.UtcNow,
                LatencyMs = latencyMs,
                Success = success,
                TokensIn = tokensIn,
                TokensOut = tokensOut,
                RagLatencyMs = ragLatencyMs,
                EmbeddingLatencyMs = embeddingLatencyMs,
                GptConfigKey = gptConfigKey
            };

            _samples.Enqueue(sample);
            PruneIfNeeded();

            _logger.LogTrace(
                "Phase 20: Recorded GPT sample - Latency={LatencyMs}ms, Success={Success}, Config={Config}",
                latencyMs, success, gptConfigKey ?? "unknown");
        }
        catch (Exception ex)
        {
            // Metrics collection should never break GPT responses
            _logger.LogWarning(ex, "Phase 20: Failed to record metrics sample (non-fatal)");
        }
    }

    /// <inheritdoc />
    public SystemGptMetricsSnapshotDto GetSnapshot(TimeSpan window, int maxSeriesPoints = 50)
    {
        var now = DateTimeOffset.UtcNow;
        var cutoff = now - window;

        // Clamp series points
        maxSeriesPoints = Math.Clamp(maxSeriesPoints, 1, MaxSeriesPointsCap);

        // Filter samples within window
        var windowSamples = _samples
            .Where(s => s.TimestampUtc >= cutoff)
            .OrderBy(s => s.TimestampUtc)
            .ToList();

        if (windowSamples.Count == 0)
        {
            return CreateEmptySnapshot(now, window);
        }

        // Compute aggregate stats
        var totalRequests = windowSamples.Count;
        var failures = windowSamples.Count(s => !s.Success);
        var errorRate = totalRequests > 0 ? (double)failures / totalRequests * 100.0 : 0.0;
        var requestsPerMinute = window.TotalMinutes > 0 ? totalRequests / window.TotalMinutes : 0.0;

        var totalTokensIn = windowSamples.Sum(s => (long)s.TokensIn);
        var totalTokensOut = windowSamples.Sum(s => (long)s.TokensOut);

        // Compute percentiles for GPT latency
        var latencies = windowSamples.Select(s => s.LatencyMs).OrderBy(x => x).ToArray();
        var gptP50 = ComputePercentile(latencies, 0.50);
        var gptP95 = ComputePercentile(latencies, 0.95);

        // Compute percentiles for RAG latency (only samples with RAG)
        var ragLatencies = windowSamples
            .Where(s => s.RagLatencyMs.HasValue)
            .Select(s => s.RagLatencyMs!.Value)
            .OrderBy(x => x)
            .ToArray();
        var ragP95 = ragLatencies.Length > 0 ? ComputePercentile(ragLatencies, 0.95) : 0.0;

        // Compute percentiles for embedding latency (only samples with embeddings)
        var embeddingLatencies = windowSamples
            .Where(s => s.EmbeddingLatencyMs.HasValue)
            .Select(s => s.EmbeddingLatencyMs!.Value)
            .OrderBy(x => x)
            .ToArray();
        var embeddingP95 = embeddingLatencies.Length > 0 ? ComputePercentile(embeddingLatencies, 0.95) : 0.0;

        // Build time series for charts
        var series = BuildTimeSeries(windowSamples, cutoff, now, maxSeriesPoints);

        return new SystemGptMetricsSnapshotDto
        {
            GeneratedAtUtc = now,
            WindowMinutes = (int)window.TotalMinutes,
            GptLatencyMsP50 = Math.Round(gptP50, 2),
            GptLatencyMsP95 = Math.Round(gptP95, 2),
            RagLatencyMsP95 = Math.Round(ragP95, 2),
            EmbeddingLatencyMsP95 = Math.Round(embeddingP95, 2),
            RequestsPerMinute = Math.Round(requestsPerMinute, 2),
            ErrorRatePercent = Math.Round(errorRate, 2),
            TotalRequests = totalRequests,
            TotalTokensIn = totalTokensIn,
            TotalTokensOut = totalTokensOut,
            Series = series
        };
    }

    private static SystemGptMetricsSnapshotDto CreateEmptySnapshot(DateTimeOffset now, TimeSpan window)
    {
        return new SystemGptMetricsSnapshotDto
        {
            GeneratedAtUtc = now,
            WindowMinutes = (int)window.TotalMinutes,
            GptLatencyMsP50 = 0,
            GptLatencyMsP95 = 0,
            RagLatencyMsP95 = 0,
            EmbeddingLatencyMsP95 = 0,
            RequestsPerMinute = 0,
            ErrorRatePercent = 0,
            TotalRequests = 0,
            TotalTokensIn = 0,
            TotalTokensOut = 0,
            Series = Array.Empty<SystemGptMetricSeries>()
        };
    }

    private static double ComputePercentile(double[] sorted, double percentile)
    {
        if (sorted.Length == 0) return 0.0;
        if (sorted.Length == 1) return sorted[0];

        var index = percentile * (sorted.Length - 1);
        var lower = (int)Math.Floor(index);
        var upper = (int)Math.Ceiling(index);

        if (lower == upper) return sorted[lower];

        // Linear interpolation
        var fraction = index - lower;
        return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
    }

    private static List<SystemGptMetricSeries> BuildTimeSeries(
        List<GptRequestSample> samples,
        DateTimeOffset windowStart,
        DateTimeOffset windowEnd,
        int maxPoints)
    {
        if (samples.Count == 0 || maxPoints <= 0)
            return new List<SystemGptMetricSeries>();

        var windowDuration = windowEnd - windowStart;
        var bucketDuration = TimeSpan.FromTicks(windowDuration.Ticks / maxPoints);

        // Create buckets
        var latencyPoints = new List<SystemGptMetricSeriesPoint>();
        var rpmPoints = new List<SystemGptMetricSeriesPoint>();
        var errorRatePoints = new List<SystemGptMetricSeriesPoint>();

        for (int i = 0; i < maxPoints; i++)
        {
            var bucketStart = windowStart + TimeSpan.FromTicks(bucketDuration.Ticks * i);
            var bucketEnd = bucketStart + bucketDuration;
            var bucketMid = bucketStart + TimeSpan.FromTicks(bucketDuration.Ticks / 2);

            var bucketSamples = samples
                .Where(s => s.TimestampUtc >= bucketStart && s.TimestampUtc < bucketEnd)
                .ToList();

            if (bucketSamples.Count > 0)
            {
                // Average latency in bucket
                var avgLatency = bucketSamples.Average(s => s.LatencyMs);
                latencyPoints.Add(new SystemGptMetricSeriesPoint
                {
                    TimestampUtc = bucketMid,
                    Value = Math.Round(avgLatency, 2)
                });

                // Requests per minute in bucket
                var rpm = bucketDuration.TotalMinutes > 0
                    ? bucketSamples.Count / bucketDuration.TotalMinutes
                    : 0;
                rpmPoints.Add(new SystemGptMetricSeriesPoint
                {
                    TimestampUtc = bucketMid,
                    Value = Math.Round(rpm, 2)
                });

                // Error rate in bucket
                var failures = bucketSamples.Count(s => !s.Success);
                var errorRate = (double)failures / bucketSamples.Count * 100.0;
                errorRatePoints.Add(new SystemGptMetricSeriesPoint
                {
                    TimestampUtc = bucketMid,
                    Value = Math.Round(errorRate, 2)
                });
            }
        }

        var series = new List<SystemGptMetricSeries>();

        if (latencyPoints.Count > 0)
        {
            series.Add(new SystemGptMetricSeries
            {
                Name = "gpt_latency_ms_avg",
                Unit = "ms",
                Points = latencyPoints
            });
        }

        if (rpmPoints.Count > 0)
        {
            series.Add(new SystemGptMetricSeries
            {
                Name = "requests_per_minute",
                Unit = "req/min",
                Points = rpmPoints
            });
        }

        if (errorRatePoints.Count > 0)
        {
            series.Add(new SystemGptMetricSeries
            {
                Name = "error_rate_percent",
                Unit = "%",
                Points = errorRatePoints
            });
        }

        return series;
    }

    private void PruneIfNeeded()
    {
        // Only prune if we're over capacity
        if (_samples.Count <= MaxSampleCapacity) return;

        lock (_pruneLock)
        {
            // Double-check inside lock
            if (_samples.Count <= MaxSampleCapacity) return;

            var cutoff = DateTimeOffset.UtcNow - MaxSampleAge;
            var pruneCount = 0;

            // Remove old samples (FIFO)
            while (_samples.Count > MaxSampleCapacity * 0.9 && _samples.TryPeek(out var oldest))
            {
                if (oldest.TimestampUtc < cutoff || _samples.Count > MaxSampleCapacity)
                {
                    _samples.TryDequeue(out _);
                    pruneCount++;
                }
                else
                {
                    break;
                }
            }

            if (pruneCount > 0)
            {
                _logger.LogDebug("Phase 20: Pruned {Count} old metrics samples", pruneCount);
            }
        }
    }

    /// <summary>
    /// Get current sample count (for diagnostics/testing).
    /// </summary>
    internal int SampleCount => _samples.Count;
}
