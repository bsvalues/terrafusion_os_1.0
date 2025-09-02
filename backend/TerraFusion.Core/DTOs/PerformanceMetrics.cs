namespace TerraFusion.Core.DTOs
{
    public class PerformanceMetrics
    {
        public double PropertyValuationTime { get; set; }
        public double RevenueCalculationTime { get; set; }
        public double DataProcessingTime { get; set; }
        public double AIInferenceTime { get; set; }
        public double DatabaseQueryTime { get; set; }
        public double MemoryUsage { get; set; }
        public double CPUUtilization { get; set; }
        public double ThroughputRPS { get; set; }
        public long MeasurementDuration { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class OptimizationResult
    {
        public string OptimizationId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime CompletionTime { get; set; }
        public PerformanceMetrics BeforeMetrics { get; set; } = new();
        public PerformanceMetrics AfterMetrics { get; set; } = new();
        public Dictionary<string, double> ImprovementPercentages { get; set; } = new();
        public decimal EstimatedAnnualSavings { get; set; }
        public List<string> OptimizationsApplied { get; set; } = new();
        public TimeSpan OptimizationDuration => CompletionTime - StartTime;
    }

    public class CostSavingsReport
    {
        public decimal AnnualServerCostSavings { get; set; }
        public decimal AnnualOperationalSavings { get; set; }
        public decimal AnnualEfficiencySavings { get; set; }
        public decimal TotalAnnualSavings { get; set; }
        public Dictionary<string, decimal> BreakdownDetails { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string ReportId { get; set; } = Guid.NewGuid().ToString();
    }

    public class ScalingConfiguration
    {
        public int MinReplicas { get; set; } = 2;
        public int MaxReplicas { get; set; } = 50;
        public double TargetCPUUtilization { get; set; } = 70.0;
        public double TargetMemoryUtilization { get; set; } = 80.0;
        public bool AutoScalingEnabled { get; set; } = true;
        public List<string> ScalingTriggers { get; set; } = new();
        public Dictionary<string, object> CustomMetrics { get; set; } = new();
    }

    public class SecurityComplianceReport
    {
        public string ReportId { get; set; } = Guid.NewGuid().ToString();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, bool> ComplianceChecks { get; set; } = new();
        public List<string> SecurityEnhancements { get; set; } = new();
        public double OverallComplianceScore { get; set; }
        public List<string> RecommendedActions { get; set; } = new();
        public Dictionary<string, string> ComplianceStandards { get; set; } = new();
    }

    public class PredictiveMaintenanceReport
    {
        public string ReportId { get; set; } = Guid.NewGuid().ToString();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public List<MaintenanceAlert> Alerts { get; set; } = new();
        public Dictionary<string, double> SystemHealthScores { get; set; } = new();
        public List<string> RecommendedActions { get; set; } = new();
        public DateTime NextMaintenanceWindow { get; set; }
        public double OverallSystemHealth { get; set; }
    }

    public class MaintenanceAlert
    {
        public string AlertId { get; set; } = Guid.NewGuid().ToString();
        public string Component { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty; // Low, Medium, High, Critical
        public string Description { get; set; } = string.Empty;
        public DateTime PredictedFailureTime { get; set; }
        public List<string> RecommendedActions { get; set; } = new();
        public double Confidence { get; set; }
    }
}
