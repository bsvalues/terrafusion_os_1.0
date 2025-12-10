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

        // Phase 21: Compute capacity prediction
        var capacity = ComputeCapacityPrediction(series, requestsPerMinute, errorRate);

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
            Series = series,
            Capacity = capacity
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
            Series = Array.Empty<SystemGptMetricSeries>(),
            Capacity = new SystemGptCapacityPredictionDto
            {
                SaturationRisk = "Low",
                PredictedRequestsPerMinuteIn5Min = 0,
                LatencyIncreasing = false,
                ErrorRateIncreasing = false,
                RagLatencyIncreasing = false,
                Advisory = "Insufficient data for prediction."
            }
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

    // ─────────────────────────────────────────────────────────────────────
    // Phase 21: Capacity Prediction & Advisory
    // ─────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Phase 21: Compute capacity prediction based on time series trends.
    /// Uses simple linear regression over recent data points (no ML required).
    /// </summary>
    private static SystemGptCapacityPredictionDto ComputeCapacityPrediction(
        IReadOnlyList<SystemGptMetricSeries> series,
        double currentRpm,
        double currentErrorRate)
    {
        // Find relevant series
        var rpmSeries = series.FirstOrDefault(s => s.Name == "requests_per_minute");
        var latencySeries = series.FirstOrDefault(s => s.Name == "gpt_latency_ms_avg");
        var errorSeries = series.FirstOrDefault(s => s.Name == "error_rate_percent");

        // Calculate trend flags (20%+ increase from first half to second half = trending up)
        var latencyIncreasing = IsSeriesTrendingUp(latencySeries);
        var errorRateIncreasing = IsSeriesTrendingUp(errorSeries);
        var rpmIncreasing = IsSeriesTrendingUp(rpmSeries);

        // RAG latency isn't tracked separately in series currently,
        // so we approximate from GPT latency trend (they correlate)
        var ragLatencyIncreasing = latencyIncreasing;

        // Predict RPM in 5 minutes using linear extrapolation
        var predictedRpm = PredictValueIn5Minutes(rpmSeries, currentRpm);

        // Determine saturation risk level based on thresholds
        var (riskLevel, advisory) = DetermineRiskAndAdvisory(
            currentRpm, predictedRpm,
            currentErrorRate, errorRateIncreasing,
            latencyIncreasing, rpmIncreasing);

        return new SystemGptCapacityPredictionDto
        {
            SaturationRisk = riskLevel.ToString(),
            PredictedRequestsPerMinuteIn5Min = Math.Round(predictedRpm, 2),
            LatencyIncreasing = latencyIncreasing,
            ErrorRateIncreasing = errorRateIncreasing,
            RagLatencyIncreasing = ragLatencyIncreasing,
            Advisory = advisory
        };
    }

    /// <summary>
    /// Phase 21: Determine if a series is trending upward.
    /// Compares average of first half to second half - 20%+ increase = trending up.
    /// </summary>
    private static bool IsSeriesTrendingUp(SystemGptMetricSeries? series)
    {
        if (series?.Points == null || series.Points.Count < 4)
            return false;

        var points = series.Points.OrderBy(p => p.TimestampUtc).ToArray();
        var midpoint = points.Length / 2;

        var firstHalfAvg = points.Take(midpoint).Average(p => p.Value);
        var secondHalfAvg = points.Skip(midpoint).Average(p => p.Value);

        // Avoid division by zero; if first half is ~0, only flag if second half is significant
        if (firstHalfAvg < 0.01)
            return secondHalfAvg > 1.0;

        var percentChange = (secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100;
        return percentChange >= 20.0; // 20%+ increase = trending up
    }

    /// <summary>
    /// Phase 21: Predict value 5 minutes from now using simple linear extrapolation.
    /// </summary>
    private static double PredictValueIn5Minutes(SystemGptMetricSeries? series, double currentValue)
    {
        if (series?.Points == null || series.Points.Count < 2)
            return currentValue; // No data for prediction

        var points = series.Points.OrderBy(p => p.TimestampUtc).ToArray();

        // Use last few points to calculate trend (slope)
        var recentPoints = points.TakeLast(Math.Min(5, points.Length)).ToArray();
        if (recentPoints.Length < 2)
            return currentValue;

        // Simple linear regression: calculate slope
        var firstTime = recentPoints.First().TimestampUtc;
        var xValues = recentPoints.Select(p => (p.TimestampUtc - firstTime).TotalMinutes).ToArray();
        var yValues = recentPoints.Select(p => p.Value).ToArray();

        // Calculate slope (rise/run)
        var n = recentPoints.Length;
        var sumX = xValues.Sum();
        var sumY = yValues.Sum();
        var sumXY = xValues.Zip(yValues, (x, y) => x * y).Sum();
        var sumX2 = xValues.Sum(x => x * x);

        var denominator = n * sumX2 - sumX * sumX;
        if (Math.Abs(denominator) < 0.0001)
            return currentValue; // Avoid division by zero (flat or insufficient data)

        var slope = (n * sumXY - sumX * sumY) / denominator;
        var intercept = (sumY - slope * sumX) / n;

        // Predict 5 minutes ahead
        var lastX = xValues.Last();
        var predicted = intercept + slope * (lastX + 5.0);

        // Don't predict negative values
        return Math.Max(0, predicted);
    }

    /// <summary>
    /// Phase 21: Determine risk level and advisory based on current metrics and trends.
    /// </summary>
    private static (SaturationRiskLevel Risk, string Advisory) DetermineRiskAndAdvisory(
        double currentRpm,
        double predictedRpm,
        double errorRate,
        bool errorRateIncreasing,
        bool latencyIncreasing,
        bool rpmIncreasing)
    {
        // Thresholds (configurable in production)
        const double HighRpmThreshold = 100.0;       // High load
        const double MediumRpmThreshold = 50.0;      // Moderate load
        const double HighErrorThreshold = 5.0;       // 5% error rate is concerning
        const double MediumErrorThreshold = 1.0;     // 1% error rate needs attention

        // Count concerning signals
        var concernSignals = 0;
        var advisoryPoints = new List<string>();

        // RPM-based concerns
        if (predictedRpm >= HighRpmThreshold || currentRpm >= HighRpmThreshold)
        {
            concernSignals += 2;
            advisoryPoints.Add($"request rate approaching capacity ({predictedRpm:F0} RPM predicted)");
        }
        else if (predictedRpm >= MediumRpmThreshold || currentRpm >= MediumRpmThreshold)
        {
            concernSignals += 1;
            if (rpmIncreasing)
            {
                advisoryPoints.Add("request rate rising");
            }
        }

        // Error rate concerns
        if (errorRate >= HighErrorThreshold)
        {
            concernSignals += 2;
            advisoryPoints.Add($"error rate elevated at {errorRate:F1}%");
        }
        else if (errorRate >= MediumErrorThreshold || errorRateIncreasing)
        {
            concernSignals += 1;
            if (errorRateIncreasing)
            {
                advisoryPoints.Add("error rate trending upward");
            }
        }

        // Latency concerns
        if (latencyIncreasing)
        {
            concernSignals += 1;
            advisoryPoints.Add("GPT latency increasing");
        }

        // Determine risk level
        SaturationRiskLevel risk;
        string advisory;

        if (concernSignals >= 3)
        {
            risk = SaturationRiskLevel.High;
            advisory = $"⚠️ HIGH RISK: {string.Join(", ", advisoryPoints)}. " +
                       "Consider scaling resources or rate-limiting non-critical operations.";
        }
        else if (concernSignals >= 1)
        {
            risk = SaturationRiskLevel.Medium;
            advisory = $"⚡ MODERATE: {string.Join(", ", advisoryPoints)}. " +
                       "Continue monitoring; prepare contingency if trends persist.";
        }
        else
        {
            risk = SaturationRiskLevel.Low;
            advisory = "✅ System operating within normal parameters. No action required.";
        }

        return (risk, advisory);
    }
}
