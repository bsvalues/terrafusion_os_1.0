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

/// <summary>
/// Synchronization result for distributed system operations
/// </summary>
public class SyncResult
{
  public bool Success { get; set; }
  public string? Message { get; set; }
  public DateTime SyncTimestamp { get; set; }
  public int ItemsSynced { get; set; }
  public List<string>? Errors { get; set; }
}

/// <summary>
/// System optimization recommendation
/// </summary>
public class OptimizationRecommendation
{
  public string? Category { get; set; }
  public string? Title { get; set; }
  public string? Description { get; set; }
  public string? Priority { get; set; } // High, Medium, Low
  public double? EstimatedImpact { get; set; }
  public List<string>? ActionItems { get; set; }
}

/// <summary>
/// Compliance violation record for audit trails
/// </summary>
public class ComplianceViolation
{
  public string? ViolationId { get; set; }
  public string? RuleCode { get; set; }
  public string? Severity { get; set; } // Critical, High, Medium, Low
  public string? Description { get; set; }
  public string? AffectedComponent { get; set; }
  public DateTime DetectedAt { get; set; }
  public string? RemediationSteps { get; set; }
  public bool IsResolved { get; set; }
}
