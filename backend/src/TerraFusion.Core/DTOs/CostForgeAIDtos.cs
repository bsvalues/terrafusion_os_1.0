using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.Core.DTOs;

public class CostForgeStatusDto
{
    public int AgentsActive { get; set; }
    public int CalculationsPerSecond { get; set; }
    public decimal AccuracyRate { get; set; }
    public string SystemStatus { get; set; } = string.Empty;
    public DateTime LastCalculation { get; set; }
    public long TotalCalculations { get; set; }
    public string ModuleVersion { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public TimeSpan Uptime { get; set; }
}

public class PropertyValuationRequestDto
{
    public string ParcelId { get; set; } = string.Empty;
    public string CountyId { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public decimal? LandArea { get; set; }
    public decimal? BuildingArea { get; set; }
    public int? YearBuilt { get; set; }
    public string? ZoningCode { get; set; }
    public Dictionary<string, object>? AdditionalParameters { get; set; }
}

public class PropertyValuationDto
{
    public string ParcelId { get; set; } = string.Empty;
    public decimal EstimatedValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public decimal ConfidenceScore { get; set; }
    public DateTime CalculationDate { get; set; }
    public string CalculationMethod { get; set; } = string.Empty;
    public List<string> FactorsConsidered { get; set; } = new();
    public Dictionary<string, decimal> ComparableProperties { get; set; } = new();
}

public class BatchValuationRequestDto
{
    public List<string> ParcelIds { get; set; } = new();
    public string CountyId { get; set; } = string.Empty;
    public string ValuationType { get; set; } = string.Empty;
    public bool IncludeComparables { get; set; }
    public int MaxConcurrency { get; set; } = 10;
}

public class BatchValuationResultDto
{
    public List<PropertyValuationDto> Valuations { get; set; } = new();
    public int TotalProcessed { get; set; }
    public int SuccessfulCalculations { get; set; }
    public int FailedCalculations { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public List<string> Errors { get; set; } = new();
}

// Moved to TerraFusion.Abstractions.DTOs
// public class AIAgentStatusDto
// {
//     public int TotalAgents { get; set; }
//     public int ActiveAgents { get; set; }
//     public int IdleAgents { get; set; }
//     public int BusyAgents { get; set; }
//     public decimal AverageUtilization { get; set; }
//     public List<AgentDto> Agents { get; set; } = new();
// }

public class AgentDto
{
    public string AgentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CurrentTask { get; set; } = string.Empty;
    public int TasksCompleted { get; set; }
    public decimal PerformanceScore { get; set; }
    public DateTime LastActivity { get; set; }
}

public class ScaleAgentsRequestDto
{
    public int TargetCount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class PerformanceMetricsDto
{
    public decimal AverageResponseTime { get; set; }
    public decimal ThroughputPerSecond { get; set; }
    public decimal ErrorRate { get; set; }
    public decimal MemoryUsage { get; set; }
    public decimal CpuUsage { get; set; }
    public Dictionary<string, decimal> CustomMetrics { get; set; } = new();
    public List<PerformanceDataPointDto> HistoricalData { get; set; } = new();
}

public class PerformanceDataPointDto
{
    public DateTime Timestamp { get; set; }
    public decimal Value { get; set; }
    public string MetricName { get; set; } = string.Empty;
}

public class HarrisSyncRequestDto
{
    public string CountyId { get; set; } = string.Empty;
    public DateTime? LastSyncDate { get; set; }
    public bool FullSync { get; set; }
    public List<string>? SpecificParcelIds { get; set; }
}

public class HarrisSyncResultDto
{
    public int RecordsProcessed { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsAdded { get; set; }
    public int RecordsSkipped { get; set; }
    public DateTime SyncStartTime { get; set; }
    public DateTime SyncEndTime { get; set; }
    public TimeSpan Duration { get; set; }
    public bool Success { get; set; }
    public List<string> Errors { get; set; } = new();
    public Dictionary<string, object> SyncMetadata { get; set; } = new();
}

public class AnalyticsDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public long TotalCalculations { get; set; }
    public decimal AverageAccuracy { get; set; }
    public decimal TotalValueCalculated { get; set; }
    public Dictionary<string, int> CalculationsByType { get; set; } = new();
    public Dictionary<string, decimal> PerformanceTrends { get; set; } = new();
    public List<TopPerformingAgentDto> TopPerformingAgents { get; set; } = new();
}

public class TopPerformingAgentDto
{
    public string AgentId { get; set; } = string.Empty;
    public int TasksCompleted { get; set; }
    public decimal AverageAccuracy { get; set; }
    public decimal PerformanceScore { get; set; }
}
