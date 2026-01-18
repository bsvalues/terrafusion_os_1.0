/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 HISTORICAL TREND ANALYSIS
 * Track Divine Balance Over Time
 * Predictive Forecasting & Pattern Recognition
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Historical data point for trend analysis
/// </summary>
public class HistoricalBalancePoint
{
    public DateTime Timestamp { get; set; }
    public double UltimatePowerScore { get; set; }
    public double BalanceProximity { get; set; }
    public bool InDivineBalance { get; set; }
    public SystemHealthStatus HealthStatus { get; set; }
    public int TotalFoundationMetrics { get; set; }
    public int MetricsWithinBaseline { get; set; }
    public int SafeAmplifications { get; set; }
    public int TotalAmplifications { get; set; }
}

/// <summary>
/// Trend analysis result
/// </summary>
public class TrendAnalysisResult
{
    public string TrendDirection { get; set; } = "Stable"; // Improving, Declining, Stable
    public double TrendSlope { get; set; } // Rate of change
    public double AverageScore { get; set; }
    public double MinScore { get; set; }
    public double MaxScore { get; set; }
    public double StandardDeviation { get; set; }
    public int DataPoints { get; set; }
    public TimeSpan AnalysisWindow { get; set; }
    public List<HistoricalBalancePoint> History { get; set; } = new();
    public List<string> Insights { get; set; } = new();
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Forecast result
/// </summary>
public class BalanceForecast
{
    public DateTime ForecastTime { get; set; }
    public double PredictedScore { get; set; }
    public double ConfidenceLevel { get; set; }
    public double LowerBound { get; set; }
    public double UpperBound { get; set; }
    public bool PredictedDivineBalance { get; set; }
    public List<string> Recommendations { get; set; } = new();
}

/// <summary>
/// Service for analyzing historical trends and forecasting future balance
/// </summary>
public interface ICodex369TrendAnalysisService
{
    /// <summary>
    /// Record current balance for historical tracking
    /// </summary>
    Task RecordBalancePointAsync(Codex369StatusDto status);

    /// <summary>
    /// Get historical balance data
    /// </summary>
    Task<List<HistoricalBalancePoint>> GetHistoricalDataAsync(TimeSpan window);

    /// <summary>
    /// Analyze trends over time window
    /// </summary>
    Task<TrendAnalysisResult> AnalyzeTrendsAsync(TimeSpan window);

    /// <summary>
    /// Forecast future balance
    /// </summary>
    Task<BalanceForecast> ForecastBalanceAsync(TimeSpan forecastAhead);

    /// <summary>
    /// Get balance statistics
    /// </summary>
    Task<BalanceStatistics> GetStatisticsAsync(TimeSpan window);
}

public class Codex369TrendAnalysisService : ICodex369TrendAnalysisService
{
    private readonly ILogger<Codex369TrendAnalysisService> _logger;
    private readonly List<HistoricalBalancePoint> _history = new();
    private readonly object _lock = new();
    private const int MAX_HISTORY_POINTS = 10000; // Keep last 10k data points

    public Codex369TrendAnalysisService(ILogger<Codex369TrendAnalysisService> logger)
    {
        _logger = logger;
    }

    public Task RecordBalancePointAsync(Codex369StatusDto status)
    {
        var point = new HistoricalBalancePoint
        {
            Timestamp = status.StatusTimestamp,
            UltimatePowerScore = status.CurrentPowerScore,
            BalanceProximity = status.UltimatePower.BalanceProximity,
            InDivineBalance = status.UltimatePower.InDivineBalance,
            HealthStatus = status.UltimatePower.HealthStatus,
            TotalFoundationMetrics = status.TotalFoundationMetrics,
            MetricsWithinBaseline = status.FoundationMetrics.Count(m => m.WithinBaseline),
            SafeAmplifications = status.AmplificationMetrics.Count(a => a.SafeFromImbalance),
            TotalAmplifications = status.TotalAmplifications
        };

        lock (_lock)
        {
            _history.Add(point);

            // Keep only recent history
            if (_history.Count > MAX_HISTORY_POINTS)
            {
                _history.RemoveRange(0, _history.Count - MAX_HISTORY_POINTS);
            }
        }

        return Task.CompletedTask;
    }

    public Task<List<HistoricalBalancePoint>> GetHistoricalDataAsync(TimeSpan window)
    {
        var cutoff = DateTime.UtcNow - window;

        lock (_lock)
        {
            return Task.FromResult(_history
                .Where(h => h.Timestamp >= cutoff)
                .OrderBy(h => h.Timestamp)
                .ToList());
        }
    }

    public async Task<TrendAnalysisResult> AnalyzeTrendsAsync(TimeSpan window)
    {
        _logger.LogInformation("📈 Analyzing Codex 3-6-9 trends over {Window}",
            window);

        var data = await GetHistoricalDataAsync(window);

        if (!data.Any())
        {
            return new TrendAnalysisResult
            {
                TrendDirection = "Unknown",
                Insights = new() { "Insufficient historical data for trend analysis" },
                AnalysisWindow = window
            };
        }

        // Calculate statistics
        var scores = data.Select(d => d.UltimatePowerScore).ToList();
        var avgScore = scores.Average();
        var minScore = scores.Min();
        var maxScore = scores.Max();
        var stdDev = CalculateStandardDeviation(scores);

        // Calculate trend slope (linear regression)
        var slope = CalculateTrendSlope(data);

        // Determine trend direction
        var trendDirection = slope switch
        {
            > 0.1 => "Improving",
            < -0.1 => "Declining",
            _ => "Stable"
        };

        // Generate insights
        var insights = GenerateInsights(data, avgScore, slope, stdDev);

        var result = new TrendAnalysisResult
        {
            TrendDirection = trendDirection,
            TrendSlope = slope,
            AverageScore = avgScore,
            MinScore = minScore,
            MaxScore = maxScore,
            StandardDeviation = stdDev,
            DataPoints = data.Count,
            AnalysisWindow = window,
            History = data,
            Insights = insights
        };

        _logger.LogInformation("✅ Trend analysis complete: {Direction} trend (slope: {Slope:F4})",
            trendDirection, slope);

        return result;
    }

    public async Task<BalanceForecast> ForecastBalanceAsync(TimeSpan forecastAhead)
    {
        _logger.LogInformation("🔮 Forecasting balance {Hours} hours ahead",
            forecastAhead.TotalHours);

        // Get recent data for forecasting (last 7 days)
        var historicalData = await GetHistoricalDataAsync(TimeSpan.FromDays(7));

        if (!historicalData.Any())
        {
            return new BalanceForecast
            {
                ForecastTime = DateTime.UtcNow + forecastAhead,
                PredictedScore = 0,
                ConfidenceLevel = 0,
                Recommendations = new() { "Insufficient historical data for forecasting" }
            };
        }

        // Simple linear extrapolation (in production, use more sophisticated ML models)
        var slope = CalculateTrendSlope(historicalData);
        var currentScore = historicalData.Last().UltimatePowerScore;

        // Predict score based on trend
        var hoursAhead = forecastAhead.TotalHours;
        var predictedChange = slope * hoursAhead;
        var predictedScore = Math.Max(0, Math.Min(12, currentScore + predictedChange));

        // Calculate confidence based on historical variance
        var scores = historicalData.Select(h => h.UltimatePowerScore).ToList();
        var stdDev = CalculateStandardDeviation(scores);
        var confidence = Math.Max(0, 1.0 - (stdDev / 12.0)); // Lower variance = higher confidence

        // Calculate prediction interval
        var margin = stdDev * 1.96; // 95% confidence interval
        var lowerBound = Math.Max(0, predictedScore - margin);
        var upperBound = Math.Min(12, predictedScore + margin);

        var forecast = new BalanceForecast
        {
            ForecastTime = DateTime.UtcNow + forecastAhead,
            PredictedScore = predictedScore,
            ConfidenceLevel = confidence,
            LowerBound = lowerBound,
            UpperBound = upperBound,
            PredictedDivineBalance = predictedScore >= 11.5,
            Recommendations = GenerateForecastRecommendations(predictedScore, slope)
        };

        _logger.LogInformation("✅ Forecast complete: Predicted score {Score:F2}/12 (confidence: {Confidence:P1})",
            predictedScore, confidence);

        return forecast;
    }

    public async Task<BalanceStatistics> GetStatisticsAsync(TimeSpan window)
    {
        var data = await GetHistoricalDataAsync(window);

        if (!data.Any())
        {
            return new BalanceStatistics { DataPoints = 0 };
        }

        var scores = data.Select(d => d.UltimatePowerScore).ToList();

        return new BalanceStatistics
        {
            DataPoints = data.Count,
            AverageScore = scores.Average(),
            MinScore = scores.Min(),
            MaxScore = scores.Max(),
            MedianScore = CalculateMedian(scores),
            StandardDeviation = CalculateStandardDeviation(scores),
            TimeInDivineBalance = TimeSpan.FromMinutes(
                data.Count(d => d.InDivineBalance) * (window.TotalMinutes / data.Count)
            ),
            PercentTimeInDivineBalance = (double)data.Count(d => d.InDivineBalance) / data.Count,
            TimeAbove10 = TimeSpan.FromMinutes(
                data.Count(d => d.UltimatePowerScore >= 10.0) * (window.TotalMinutes / data.Count)
            ),
            AnalysisWindow = window
        };
    }

    #region Private Helper Methods

    private double CalculateTrendSlope(List<HistoricalBalancePoint> data)
    {
        if (data.Count < 2) return 0;

        // Simple linear regression to calculate slope
        var n = data.Count;
        var sumX = 0.0;
        var sumY = 0.0;
        var sumXY = 0.0;
        var sumX2 = 0.0;

        for (int i = 0; i < n; i++)
        {
            var x = i; // Time index
            var y = data[i].UltimatePowerScore;

            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        var slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    private double CalculateStandardDeviation(List<double> values)
    {
        if (!values.Any()) return 0;

        var avg = values.Average();
        var sumOfSquares = values.Sum(v => Math.Pow(v - avg, 2));
        return Math.Sqrt(sumOfSquares / values.Count);
    }

    private double CalculateMedian(List<double> values)
    {
        if (!values.Any()) return 0;

        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;

        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2.0
            : sorted[mid];
    }

    private List<string> GenerateInsights(
        List<HistoricalBalancePoint> data,
        double avgScore,
        double slope,
        double stdDev)
    {
        var insights = new List<string>();

        // Overall performance insight
        if (avgScore >= 11.5)
        {
            insights.Add($"🌟 Excellent: Average score of {avgScore:F2}/12 indicates consistent divine balance");
        }
        else if (avgScore >= 10.0)
        {
            insights.Add($"✅ Good: Average score of {avgScore:F2}/12 shows strong performance");
        }
        else
        {
            insights.Add($"⚠️ Needs Improvement: Average score of {avgScore:F2}/12 below optimal");
        }

        // Trend insight
        if (slope > 0.1)
        {
            insights.Add($"📈 Improving trend: Balance increasing at {slope:F4} points per data point");
        }
        else if (slope < -0.1)
        {
            insights.Add($"📉 Declining trend: Balance decreasing at {Math.Abs(slope):F4} points per data point - investigate causes");
        }
        else
        {
            insights.Add($"➡️ Stable trend: Balance maintaining consistent level");
        }

        // Stability insight
        if (stdDev < 0.5)
        {
            insights.Add($"🎯 High stability: Low variance ({stdDev:F2}) indicates consistent performance");
        }
        else if (stdDev > 1.5)
        {
            insights.Add($"⚠️ High volatility: Variance ({stdDev:F2}) indicates inconsistent performance - review unstable metrics");
        }

        // Divine balance achievement rate
        var divineBalanceRate = (double)data.Count(d => d.InDivineBalance) / data.Count;
        if (divineBalanceRate > 0.9)
        {
            insights.Add($"🌟 Exceptional: Divine balance achieved {divineBalanceRate:P1} of the time");
        }
        else if (divineBalanceRate > 0.5)
        {
            insights.Add($"✅ Moderate: Divine balance achieved {divineBalanceRate:P1} of the time - room for improvement");
        }
        else
        {
            insights.Add($"⚠️ Low: Divine balance achieved only {divineBalanceRate:P1} of the time - optimization needed");
        }

        return insights;
    }

    private List<string> GenerateForecastRecommendations(double predictedScore, double slope)
    {
        var recommendations = new List<string>();

        if (predictedScore >= 11.5)
        {
            recommendations.Add("✅ Forecast: Divine balance predicted - maintain current practices");
        }
        else if (predictedScore >= 10.0)
        {
            recommendations.Add($"⚠️ Forecast: Good performance predicted ({predictedScore:F2}/12) - optimize further for divine balance");
        }
        else
        {
            recommendations.Add($"🚨 Forecast: Below-optimal performance predicted ({predictedScore:F2}/12) - immediate intervention recommended");
        }

        if (slope < -0.05)
        {
            recommendations.Add("⚠️ Declining trend detected - proactive optimization recommended");
        }
        else if (slope > 0.05)
        {
            recommendations.Add("✅ Improving trend - continue current optimization strategies");
        }

        return recommendations;
    }

    #endregion
}

/// <summary>
/// Balance statistics over a time window
/// </summary>
public class BalanceStatistics
{
    public int DataPoints { get; set; }
    public double AverageScore { get; set; }
    public double MinScore { get; set; }
    public double MaxScore { get; set; }
    public double MedianScore { get; set; }
    public double StandardDeviation { get; set; }
    public TimeSpan TimeInDivineBalance { get; set; }
    public double PercentTimeInDivineBalance { get; set; }
    public TimeSpan TimeAbove10 { get; set; }
    public TimeSpan AnalysisWindow { get; set; }
}

/// <summary>
/// Background service to periodically record balance points
/// </summary>
public class Codex369HistoricalRecordingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<Codex369HistoricalRecordingService> _logger;
    private const int RECORD_INTERVAL_SECONDS = 300; // Record every 5 minutes

    public Codex369HistoricalRecordingService(
        IServiceProvider serviceProvider,
        ILogger<Codex369HistoricalRecordingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("📊 Codex 3-6-9 Historical Recording Service started - Records every {Seconds}s",
            RECORD_INTERVAL_SECONDS);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RecordBalancePointAsync();
                await Task.Delay(TimeSpan.FromSeconds(RECORD_INTERVAL_SECONDS), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in historical recording service");
            }
        }

        _logger.LogInformation("⏹️ Codex 3-6-9 Historical Recording Service stopped");
    }

    private async Task RecordBalancePointAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var codexService = scope.ServiceProvider.GetRequiredService<ICodex369FrameworkService>();
        var trendService = scope.ServiceProvider.GetRequiredService<ICodex369TrendAnalysisService>();

        // Get current status
        var status = await codexService.GetRealtimeFrameworkStatusAsync();

        // Record for historical tracking
        await trendService.RecordBalancePointAsync(status);

        _logger.LogDebug("📊 Recorded balance point: {Score:F2}/12", status.CurrentPowerScore);
    }
}
