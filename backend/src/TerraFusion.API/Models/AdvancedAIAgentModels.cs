/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ADVANCED AI AGENT ORCHESTRATION MODELS
 * Championship-Level AI Orchestration Data Models
 * Load Balancing, Scaling, and Performance Optimization Models
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

namespace TerraFusion.API.Models;

/// <summary>
/// Load Balancing Metrics for AI Agent Distribution
/// </summary>
public class LoadBalancingMetrics
{
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public double AverageLoad { get; set; }
    public double MaxLoad { get; set; }
    public double MinLoad { get; set; }
    public List<AgentLoadMetric> AgentLoads { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Individual Agent Load Metric
/// </summary>
public class AgentLoadMetric
{
    public string AgentId { get; set; } = string.Empty;
    public double Load { get; set; }
    public int ActiveTasks { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Date Range for Time-Series Queries
/// </summary>
public class DateRange
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public DateRange()
    {
        StartDate = DateTime.UtcNow.AddDays(-7);
        EndDate = DateTime.UtcNow;
    }
}

/// <summary>
/// AI Superiority Demonstration Request
/// </summary>
public class SuperiorityDemoRequest
{
    public string DemoType { get; set; } = string.Empty;
    public string CountyCode { get; set; } = string.Empty;
    public int PropertyCount { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
}

/// <summary>
/// AI Superiority Demo Result
/// </summary>
public class AISuperiorityDemoResult
{
    public string DemoId { get; set; } = Guid.NewGuid().ToString();
    public string DemoType { get; set; } = string.Empty;
    public bool Success { get; set; }
    public decimal AccuracyScore { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public Dictionary<string, object> Results { get; set; } = new();
    public List<string> SuperiorityMetrics { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// AI Demo Dashboard Data
/// </summary>
public class AIDemoDashboardData
{
    public List<AISuperiorityDemoResult> RecentDemos { get; set; } = new();
    public Dictionary<string, decimal> AverageAccuracy { get; set; } = new();
    public Dictionary<string, TimeSpan> AverageProcessingTime { get; set; } = new();
    public int TotalDemosRun { get; set; }
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
}
