namespace TerraFusion.Abstractions.DTOs.Shared;

/// <summary>
/// Elite-level performance metrics for government OS operations
/// TERRA-CRITICAL-002: Consolidated shared DTO following Single Source of Truth pattern
/// </summary>
public class ElitePerformanceMetrics
{
  public double AverageResponseTime { get; set; }
  public double ThroughputPerSecond { get; set; }
  public double ErrorRate { get; set; }
  public double MemoryUsage { get; set; }
  public double CpuUsage { get; set; }
  public Dictionary<string, object>? CustomMetrics { get; set; }
  public List<PerformanceDataPoint>? HistoricalData { get; set; }
}

/// <summary>
/// Time-series performance data point
/// </summary>
public class PerformanceDataPoint
{
  public DateTime Timestamp { get; set; }
  public double Value { get; set; }
  public string? MetricName { get; set; }
}

// SyncResult → canonical in TerraFusion.Abstractions.DTOs.Responses.CommonResponses
// OptimizationRecommendation → canonical in TerraFusion.Abstractions.DTOs.Responses.CommonResponses
// ComplianceViolation → canonical in TerraFusion.Abstractions.DTOs.Responses.CommonResponses
