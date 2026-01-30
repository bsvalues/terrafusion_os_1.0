namespace TerraFusion.Core.DTOs
{
    public class PerformanceMetrics
    {
        // Existing core timing metrics
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

        // Additional properties for AISuperiorityController compatibility
        public double AverageResponseTime { get; set; }
        public double Throughput { get; set; }
        public decimal Accuracy { get; set; }
        public decimal ErrorRate { get; set; }
        public string SystemVersion { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Database Performance Metrics (required by HarrisPACSProductionService)
        public int DatabaseConnections { get; set; }
        public double AverageQueryResponseTime { get; set; }
        public decimal DataSyncSuccessRate { get; set; }

        // AI Performance Metrics (required by HarrisPACSProductionService)
        public decimal AITrainingAccuracy { get; set; }
        public decimal IAAOComplianceScore { get; set; }
        public int ActiveAgents { get; set; }
        public int TotalAgents { get; set; }
        public decimal AgentEfficiencyScore { get; set; }

        // System Performance Metrics (enhanced for championship monitoring)
        public double SystemThroughput { get; set; }
        public decimal UptimePercentage { get; set; }
        public DateTime MetricsTimestamp { get; set; } = DateTime.UtcNow;
        public string? ErrorMessage { get; set; }

        // Response Time Percentiles (championship SLA tracking)
        public double P50ResponseTime { get; set; }
        public double P95ResponseTime { get; set; }
        public double P99ResponseTime { get; set; }

        // Government Compliance Metrics
        public decimal ComplianceScore { get; set; }
        public bool IsFISMACompliant { get; set; }
        public bool IsIAAOCompliant { get; set; }

        // Additional metrics for HarrisPACS Enhancement Controller
        public decimal AverageAccuracy { get; set; }
        public decimal AverageProcessingTime { get; set; }
        public decimal ComplianceRate { get; set; }

        // 3-6-9-12 Framework Metrics (Foundation + Amplification)
        public decimal TypeSafetyScore { get; set; } // Foundation - 0-12 scale
        public decimal InterfaceCompletenessScore { get; set; } // Foundation - 0-12 scale
        public decimal ParameterConsistencyScore { get; set; } // Foundation - 0-12 scale
        public decimal AmplificationScore { get; set; } // Amplification - 0-12 scale
        public decimal UltimatePowerScore { get; set; } // Ultimate Power (9) - 0-12 scale

        // Computed Properties for Championship Excellence
        public bool IsChampionshipPerformance =>
            AITrainingAccuracy >= 0.995m &&
            DataSyncSuccessRate >= 0.995m &&
            ErrorRate <= 0.005m &&
            UptimePercentage >= 99.99m &&
            P95ResponseTime <= 10.0;

        public bool IsGovernmentTranscended =>
            UltimatePowerScore >= 12.0m &&
            IsFISMACompliant &&
            IsIAAOCompliant &&
            IsChampionshipPerformance;

        // 3-6-9-12 Framework Calculation Methods
        public decimal CalculateUltimatePowerScore()
        {
            // Foundation score (average of 3 foundation metrics)
            var foundationScore = (TypeSafetyScore + InterfaceCompletenessScore + ParameterConsistencyScore) / 3;

            // Ultimate Power = (Foundation + Amplification) / 2
            UltimatePowerScore = (foundationScore + AmplificationScore) / 2;
            return UltimatePowerScore;
        }

        // Factory method for championship defaults
        public static PerformanceMetrics CreateDefault()
        {
            return new PerformanceMetrics
            {
                DatabaseConnections = 100,
                AverageQueryResponseTime = 5.0,
                DataSyncSuccessRate = 0.999m,
                AITrainingAccuracy = 0.995m,
                IAAOComplianceScore = 0.995m,
                ActiveAgents = 1008,
                TotalAgents = 1008,
                AgentEfficiencyScore = 0.999m,
                SystemThroughput = 1000000.0,
                ErrorRate = 0.001m,
                UptimePercentage = 99.999m,
                P50ResponseTime = 1.0,
                P95ResponseTime = 10.0,
                P99ResponseTime = 50.0,
                ComplianceScore = 0.999m,
                IsFISMACompliant = true,
                IsIAAOCompliant = true,
                TypeSafetyScore = 12.0m,
                InterfaceCompletenessScore = 12.0m,
                ParameterConsistencyScore = 12.0m,
                AmplificationScore = 12.0m,
                UltimatePowerScore = 12.0m,
                Timestamp = DateTime.UtcNow,
                MetricsTimestamp = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
        }
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
