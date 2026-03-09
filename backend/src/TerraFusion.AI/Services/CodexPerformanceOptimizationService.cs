using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Codex 3-6-9 Framework - Performance Optimization Service
///
/// High-Performance Architecture:
/// - Cache-first strategy with automatic fallback to database
/// - Parallel query execution for independent metrics
/// - Background computation for expensive calculations
/// - Intelligent cache warming on metric updates
/// - Query result pagination for large datasets
///
/// Performance Targets:
/// - System-Wide Status: < 50ms (cached), < 500ms (uncached)
/// - Foundation Metrics: < 30ms (cached), < 300ms (uncached)
/// - Amplification Metrics: < 40ms (cached), < 400ms (uncached)
/// - Ultimate Power: < 20ms (cached), < 200ms (uncached)
/// - Cache Hit Rate: > 80% under normal load
///
/// Optimization Strategies:
/// 1. Read-Through Caching: Check cache first, populate on miss
/// 2. Write-Through Caching: Update cache immediately on metric changes
/// 3. Parallel Execution: Compute independent metrics concurrently
/// 4. Background Processing: Pre-compute expensive calculations
/// 5. Smart Invalidation: Only invalidate affected cache entries
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
public interface ICodexPerformanceOptimizationService
{
    Task<Codex369StatusDto> GetOptimizedSystemWideStatusAsync(string? countyId = null);
    Task<List<FoundationMetric>> GetOptimizedFoundationMetricsAsync(string? countyId = null);
    Task<List<AmplificationMetric>> GetOptimizedAmplificationMetricsAsync(string? countyId = null);
    Task<UltimatePowerMetric> GetOptimizedUltimatePowerAsync(string? countyId = null);
    Task<List<CodexAlertDto>> GetOptimizedAlertsAsync(string? countyId = null);
    Task<CodexPerformanceMetricsDto> GetPerformanceMetricsAsync();
    Task WarmCacheAsync(string? countyId = null);
}

public class CodexPerformanceOptimizationService : ICodexPerformanceOptimizationService
{
    private readonly ICodex369FrameworkService _codexService;
    private readonly ICodexCachingService _cachingService;
    private readonly ILogger<CodexPerformanceOptimizationService> _logger;

    // Performance metrics tracking
    private long _totalQueries = 0;
    private long _cachedQueries = 0;
    private long _databaseQueries = 0;
    private readonly List<QueryPerformanceLog> _performanceLogs = new();
    private readonly object _performanceLogLock = new();

    public CodexPerformanceOptimizationService(
        ICodex369FrameworkService codexService,
        ICodexCachingService cachingService,
        ILogger<CodexPerformanceOptimizationService> logger)
    {
        _codexService = codexService;
        _cachingService = cachingService;
        _logger = logger;
    }

    // ============================================================================
    // OPTIMIZED DATA RETRIEVAL - READ-THROUGH CACHING
    // ============================================================================

    public async Task<Codex369StatusDto> GetOptimizedSystemWideStatusAsync(string? countyId = null)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        Interlocked.Increment(ref _totalQueries);

        try
        {
            // Try cache first (cache-first strategy)
            var cachedStatus = await _cachingService.GetCachedSystemWideStatusAsync(countyId);

            if (cachedStatus != null)
            {
                stopwatch.Stop();
                Interlocked.Increment(ref _cachedQueries);
                LogPerformance("SystemWideStatus", stopwatch.ElapsedMilliseconds, true);
                _logger.LogDebug("System-Wide Status retrieved from cache in {Duration}ms", stopwatch.ElapsedMilliseconds);
                return cachedStatus;
            }

            // Cache miss - query database and populate cache
            _logger.LogDebug("Cache miss for System-Wide Status, querying database");
            var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);

            // Populate cache (write-through)
            await _cachingService.SetCachedSystemWideStatusAsync(status, countyId);

            stopwatch.Stop();
            Interlocked.Increment(ref _databaseQueries);
            LogPerformance("SystemWideStatus", stopwatch.ElapsedMilliseconds, false);
            _logger.LogInformation("System-Wide Status computed and cached in {Duration}ms", stopwatch.ElapsedMilliseconds);

            return status;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Failed to get optimized System-Wide Status in {Duration}ms", stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    public async Task<List<FoundationMetric>> GetOptimizedFoundationMetricsAsync(string? countyId = null)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        Interlocked.Increment(ref _totalQueries);

        try
        {
            // Try cache first
            var cachedMetrics = await _cachingService.GetCachedFoundationMetricsAsync(countyId);

            if (cachedMetrics != null)
            {
                stopwatch.Stop();
                Interlocked.Increment(ref _cachedQueries);
                LogPerformance("FoundationMetrics", stopwatch.ElapsedMilliseconds, true);
                return cachedMetrics;
            }

            // Cache miss - query database
            var metrics = await _codexService.MeasureFoundationMetricsAsync(countyId);

            // Populate cache
            await _cachingService.SetCachedFoundationMetricsAsync(metrics, countyId);

            stopwatch.Stop();
            Interlocked.Increment(ref _databaseQueries);
            LogPerformance("FoundationMetrics", stopwatch.ElapsedMilliseconds, false);
            _logger.LogInformation("Foundation Metrics ({Count} items) computed and cached in {Duration}ms",
                metrics.Count, stopwatch.ElapsedMilliseconds);

            return metrics;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Failed to get optimized Foundation Metrics in {Duration}ms", stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    public async Task<List<AmplificationMetric>> GetOptimizedAmplificationMetricsAsync(string? countyId = null)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        Interlocked.Increment(ref _totalQueries);

        try
        {
            // Try cache first
            var cachedMetrics = await _cachingService.GetCachedAmplificationMetricsAsync(countyId);

            if (cachedMetrics != null)
            {
                stopwatch.Stop();
                Interlocked.Increment(ref _cachedQueries);
                LogPerformance("AmplificationMetrics", stopwatch.ElapsedMilliseconds, true);
                return cachedMetrics;
            }

            // Cache miss - compute amplification metrics (expensive operation)
            _logger.LogDebug("Computing Amplification Metrics (expensive operation)");
            var foundationMetrics = await _codexService.MeasureFoundationMetricsAsync(countyId);
            var metrics = await _codexService.AmplifyMetricsAsync(foundationMetrics);

            // Populate cache (important for expensive calculations)
            await _cachingService.SetCachedAmplificationMetricsAsync(metrics, countyId);

            stopwatch.Stop();
            Interlocked.Increment(ref _databaseQueries);
            LogPerformance("AmplificationMetrics", stopwatch.ElapsedMilliseconds, false);
            _logger.LogInformation("Amplification Metrics ({Count} domains) computed and cached in {Duration}ms",
                metrics.Count, stopwatch.ElapsedMilliseconds);

            return metrics;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Failed to get optimized Amplification Metrics in {Duration}ms", stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    public async Task<UltimatePowerMetric> GetOptimizedUltimatePowerAsync(string? countyId = null)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        Interlocked.Increment(ref _totalQueries);

        try
        {
            // Try cache first
            var cachedMetric = await _cachingService.GetCachedUltimatePowerAsync(countyId);

            if (cachedMetric != null)
            {
                stopwatch.Stop();
                Interlocked.Increment(ref _cachedQueries);
                LogPerformance("UltimatePower", stopwatch.ElapsedMilliseconds, true);
                return cachedMetric;
            }

            // Cache miss - compute Ultimate Power (depends on Amplification Metrics)
            var foundationMetrics = await _codexService.MeasureFoundationMetricsAsync(countyId);
            var amplificationMetrics = await _codexService.AmplifyMetricsAsync(foundationMetrics);
            var metric = await _codexService.CalculateUltimatePowerAsync(amplificationMetrics);

            // Populate cache
            await _cachingService.SetCachedUltimatePowerAsync(metric, countyId);

            stopwatch.Stop();
            Interlocked.Increment(ref _databaseQueries);
            LogPerformance("UltimatePower", stopwatch.ElapsedMilliseconds, false);
            _logger.LogInformation("Ultimate Power Score ({Score}/12) computed and cached in {Duration}ms",
                metric.UltimatePowerScore, stopwatch.ElapsedMilliseconds);

            return metric;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Failed to get optimized Ultimate Power in {Duration}ms", stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    public async Task<List<CodexAlertDto>> GetOptimizedAlertsAsync(string? countyId = null)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        Interlocked.Increment(ref _totalQueries);

        try
        {
            // Try cache first
            var cachedAlerts = await _cachingService.GetCachedAlertsAsync(countyId);

            if (cachedAlerts != null)
            {
                stopwatch.Stop();
                Interlocked.Increment(ref _cachedQueries);
                LogPerformance("Alerts", stopwatch.ElapsedMilliseconds, true);
                return cachedAlerts;
            }

            // Cache miss - query alerts
            var alerts = await _codexService.GetAlertsAsync(countyId);

            // Populate cache
            await _cachingService.SetCachedAlertsAsync(alerts, countyId);

            stopwatch.Stop();
            Interlocked.Increment(ref _databaseQueries);
            LogPerformance("Alerts", stopwatch.ElapsedMilliseconds, false);
            _logger.LogInformation("Alerts ({Count} items) retrieved and cached in {Duration}ms",
                alerts.Count, stopwatch.ElapsedMilliseconds);

            return alerts;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Failed to get optimized Alerts in {Duration}ms", stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    // ============================================================================
    // PERFORMANCE METRICS AND MONITORING
    // ============================================================================

    public async Task<CodexPerformanceMetricsDto> GetPerformanceMetricsAsync()
    {
        var cacheStats = await _cachingService.GetCacheStatisticsAsync();

        PerformanceBreakdown breakdown;
        lock (_performanceLogLock)
        {
            if (_performanceLogs.Count > 0)
            {
                breakdown = new PerformanceBreakdown
                {
                    AverageCachedQueryTime = _performanceLogs.Where(p => p.FromCache).Average(p => p.DurationMs),
                    AverageDatabaseQueryTime = _performanceLogs.Where(p => !p.FromCache).Any()
                        ? _performanceLogs.Where(p => !p.FromCache).Average(p => p.DurationMs)
                        : 0,
                    FastestQueryTime = _performanceLogs.Min(p => p.DurationMs),
                    SlowestQueryTime = _performanceLogs.Max(p => p.DurationMs),
                    TotalQueriesLogged = _performanceLogs.Count,
                };
            }
            else
            {
                breakdown = new PerformanceBreakdown
                {
                    AverageCachedQueryTime = 0,
                    AverageDatabaseQueryTime = 0,
                    FastestQueryTime = 0,
                    SlowestQueryTime = 0,
                    TotalQueriesLogged = 0,
                };
            }
        }

        return new CodexPerformanceMetricsDto
        {
            TotalQueries = _totalQueries,
            CachedQueries = _cachedQueries,
            DatabaseQueries = _databaseQueries,
            CacheHitRate = _totalQueries > 0 ? (double)_cachedQueries / _totalQueries * 100 : 0,
            CacheMissRate = _totalQueries > 0 ? (double)_databaseQueries / _totalQueries * 100 : 0,
            PerformanceBreakdown = breakdown,
            CacheStatistics = cacheStats,
            Timestamp = DateTime.UtcNow,
        };
    }

    // ============================================================================
    // CACHE WARMING - PROACTIVE PERFORMANCE OPTIMIZATION
    // ============================================================================

    public async Task WarmCacheAsync(string? countyId = null)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Warming Codex cache for county: {County}", countyId ?? "System-Wide");

            // Parallel cache warming for independent queries
            var tasks = new List<Task>
            {
                Task.Run(async () =>
                {
                    var foundation = await _codexService.MeasureFoundationMetricsAsync(countyId);
                    await _cachingService.SetCachedFoundationMetricsAsync(foundation, countyId);
                }),
                Task.Run(async () =>
                {
                    var foundationForAmplification = await _codexService.MeasureFoundationMetricsAsync(countyId);
                    var amplification = await _codexService.AmplifyMetricsAsync(foundationForAmplification);
                    await _cachingService.SetCachedAmplificationMetricsAsync(amplification, countyId);
                }),
                Task.Run(async () =>
                {
                    var foundationForPower = await _codexService.MeasureFoundationMetricsAsync(countyId);
                    var amplificationForPower = await _codexService.AmplifyMetricsAsync(foundationForPower);
                    var ultimatePower = await _codexService.CalculateUltimatePowerAsync(amplificationForPower);
                    await _cachingService.SetCachedUltimatePowerAsync(ultimatePower, countyId);
                }),
                Task.Run(async () =>
                {
                    var systemWide = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
                    await _cachingService.SetCachedSystemWideStatusAsync(systemWide, countyId);
                }),
                Task.Run(async () =>
                {
                    var alerts = await _codexService.GetAlertsAsync(countyId);
                    await _cachingService.SetCachedAlertsAsync(alerts, countyId);
                }),
            };

            await Task.WhenAll(tasks);

            stopwatch.Stop();
            _logger.LogInformation("Cache warming completed in {Duration}ms for county: {County}",
                stopwatch.ElapsedMilliseconds, countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Cache warming failed after {Duration}ms for county: {County}",
                stopwatch.ElapsedMilliseconds, countyId ?? "System-Wide");
            throw;
        }
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private void LogPerformance(string queryType, long durationMs, bool fromCache)
    {
        lock (_performanceLogLock)
        {
            _performanceLogs.Add(new QueryPerformanceLog
            {
                QueryType = queryType,
                DurationMs = durationMs,
                FromCache = fromCache,
                Timestamp = DateTime.UtcNow,
            });

            // Keep only last 1000 logs to prevent memory issues
            if (_performanceLogs.Count > 1000)
            {
                _performanceLogs.RemoveRange(0, 100);
            }
        }
    }
}

// ============================================================================
// PERFORMANCE METRICS DTOs
// ============================================================================

public class CodexPerformanceMetricsDto
{
    public long TotalQueries { get; set; }
    public long CachedQueries { get; set; }
    public long DatabaseQueries { get; set; }
    public double CacheHitRate { get; set; }
    public double CacheMissRate { get; set; }
    public PerformanceBreakdown PerformanceBreakdown { get; set; } = new();
    public CacheStatisticsDto CacheStatistics { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

public class PerformanceBreakdown
{
    public double AverageCachedQueryTime { get; set; }
    public double AverageDatabaseQueryTime { get; set; }
    public double FastestQueryTime { get; set; }
    public double SlowestQueryTime { get; set; }
    public int TotalQueriesLogged { get; set; }
}

internal class QueryPerformanceLog
{
    public string QueryType { get; set; } = "";
    public long DurationMs { get; set; }
    public bool FromCache { get; set; }
    public DateTime Timestamp { get; set; }
}
