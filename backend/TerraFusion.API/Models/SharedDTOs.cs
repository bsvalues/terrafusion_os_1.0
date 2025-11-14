/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SHARED DATA TRANSFER OBJECTS
 * Common DTOs used across multiple controllers
 * ═══════════════════════════════════════════════════════════════
 */

namespace TerraFusion.API.Models;

/// <summary>
/// Real-time performance metrics for quantum consciousness operations
/// </summary>
public class QuantumPerformanceMetricsDto
{
    public required int ThroughputOps { get; set; }
    public required double LatencyMs { get; set; }
    public required double ResourceUtilization { get; set; }
    public required double AccuracyScore { get; set; }
    public required double UptimePercentage { get; set; }
}

/// <summary>
/// Performance metrics for CostForge calculations
/// </summary>
public class CostForgePerformanceMetricsDto
{
    public double AverageResponseTime { get; set; }
    public int RequestsPerSecond { get; set; }
    public double AccuracyRate { get; set; }
    public int TotalCalculations { get; set; }
    public Dictionary<string, double> DetailedMetrics { get; set; } = new();
}
