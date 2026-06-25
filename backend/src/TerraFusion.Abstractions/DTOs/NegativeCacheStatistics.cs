namespace TerraFusion.Abstractions.DTOs;

/// <summary>
/// Cache performance statistics. Promoted from TerraFusion.Core.Services
/// (NegativeCachingService.cs) to the canonical shared-contracts home so
/// ICacheStatisticsService can move to Abstractions without inverting the
/// dependency (charter §2). Plain POCO — no Core/EF coupling.
/// </summary>
public class NegativeCacheStatistics
{
    public long TotalRequests { get; set; }
    public long CacheHits { get; set; }
    public long CacheMisses { get; set; }
    public long NegativeCacheHits { get; set; }
    public long MissSentinelsSet { get; set; }
    public long DatabaseQueriesPrevented { get; set; }
    public double HitRatio => TotalRequests > 0 ? (double)CacheHits / TotalRequests * 100 : 0;
    public double NegativeCacheEffectiveness => TotalRequests > 0 ? (double)NegativeCacheHits / TotalRequests * 100 : 0;
    public TimeSpan AverageResponseTime { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime LastReset { get; set; }
    public Dictionary<string, long> ErrorCounts { get; set; } = new();
    public Dictionary<string, double> ResponseTimesByOperation { get; set; } = new();
}
