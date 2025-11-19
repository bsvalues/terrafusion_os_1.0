namespace TerraFusion.Abstractions.DTOs.Responses;

/// <summary>
/// Base performance metrics DTO
/// TERRA-CRITICAL-003: Consolidated performance metrics following Single Source of Truth pattern
/// </summary>
public class PerformanceMetricsDto
{
  public double AverageResponseTime { get; set; }
  public double ThroughputPerSecond { get; set; }
  public double ErrorRate { get; set; }
  public double MemoryUsage { get; set; }
  public double CpuUsage { get; set; }
  public Dictionary<string, object>? CustomMetrics { get; set; }
  public List<PerformanceDataPointDto>? HistoricalData { get; set; }
}

/// <summary>
/// Time-series performance data point
/// </summary>
public class PerformanceDataPointDto
{
  public DateTime Timestamp { get; set; }
  public double Value { get; set; }
  public string? MetricName { get; set; }
}

/// <summary>
/// CostForge-specific performance metrics
/// </summary>
public class CostForgePerformanceMetricsDto : PerformanceMetricsDto
{
  public double CostOptimizationScore { get; set; }
  public double SavingsGenerated { get; set; }
  public int RecommendationsCount { get; set; }
  public double AverageImplementationTime { get; set; }
}

/// <summary>
/// Quantum Consciousness-specific performance metrics
/// </summary>
public class QuantumPerformanceMetricsDto : PerformanceMetricsDto
{
  public double QuantumCoherenceScore { get; set; }
  public int EntanglementStatesActive { get; set; }
  public double SuperpositionEfficiency { get; set; }
  public double ConsciousnessIntegrationLevel { get; set; }

  // Properties used by QuantumConsciousnessController
  public int ThroughputOps { get; set; }
  public double LatencyMs { get; set; }
  public double ResourceUtilization { get; set; }
  public double AccuracyScore { get; set; }
  public double UptimePercentage { get; set; }
}
