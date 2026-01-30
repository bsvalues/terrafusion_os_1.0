using System;
using System.Collections.Generic;

namespace TerraFusion.CostForge.Models
{
    /// <summary>
    /// Swarm Performance Metrics for Elite AI Coordination
    /// </summary>
    public class SwarmPerformanceMetrics
    {
        public string SessionId { get; set; } = "";
        public DateTime SessionStart { get; set; }
        public DateTime SessionEnd { get; set; }
        public TimeSpan TotalDuration => SessionEnd - SessionStart;

        // Core Performance Metrics
        public int TotalAgentsDeployed { get; set; }
        public int ActiveAgents { get; set; }
        public double AverageAgentUtilization { get; set; }

        // Task Metrics
        public int TasksCompleted { get; set; }
        public int TasksFailed { get; set; }
        public double TaskSuccessRate => TasksCompleted > 0 ? (double)TasksCompleted / (TasksCompleted + TasksFailed) : 0;

        // Accuracy Metrics
        public double OverallAccuracy { get; set; }
        public double MinAccuracy { get; set; }
        public double MaxAccuracy { get; set; }
        public double AccuracyStandardDeviation { get; set; }

        // Performance Metrics
        public double TasksPerSecond { get; set; }
        public TimeSpan AverageTaskCompletionTime { get; set; }
        public TimeSpan P95TaskCompletionTime { get; set; }

        // Resource Utilization
        public double CPUUtilization { get; set; }
        public double MemoryUtilization { get; set; }
        public double NetworkUtilization { get; set; }

        // Elite Performance Indicators
        public double ConsciousnessLevel { get; set; }
        public double QuantumOptimizationEfficiency { get; set; }
        public double SwarmIntelligenceIndex { get; set; }

        // Detailed Agent Performance
        public List<AgentPerformanceDetail> AgentDetails { get; set; } = new();

        // Quality Metrics
        public double IAAOComplianceRate { get; set; }
        public int PropertyAssessmentsCompleted { get; set; }
        public double AverageAssessmentAccuracy { get; set; }

        // Optimization Insights
        public List<PerformanceInsight> OptimizationInsights { get; set; } = new();
        public SwarmHealthScore HealthScore { get; set; } = new();

        // Elite Metrics
        public bool ChampionshipLevelAchieved => OverallAccuracy >= 0.999 && TaskSuccessRate >= 0.999;
        public double ElitePerformanceIndex { get; set; }
    }

    /// <summary>
    /// Detailed Performance Information for Individual Agents
    /// </summary>
    public class AgentPerformanceDetail
    {
        public string AgentId { get; set; } = "";
        public string AgentType { get; set; } = "";
        public AgentSpecialization Specialization { get; set; }

        // Performance Metrics
        public int TasksAssigned { get; set; }
        public int TasksCompleted { get; set; }
        public double TaskSuccessRate => TasksAssigned > 0 ? (double)TasksCompleted / TasksAssigned : 0;

        // Timing Metrics
        public TimeSpan TotalActiveTime { get; set; }
        public TimeSpan AverageTaskTime { get; set; }
        public TimeSpan IdleTime { get; set; }

        // Quality Metrics
        public double AccuracyScore { get; set; }
        public double EfficiencyScore { get; set; }
        public double ConsciousnessLevel { get; set; }

        // Resource Usage
        public double CPUUsage { get; set; }
        public double MemoryUsage { get; set; }
        public int QuantumOperations { get; set; }

        // Collaboration Metrics
        public int CollaborativeTasks { get; set; }
        public double TeamworkScore { get; set; }

        // Status
        public AgentStatus Status { get; set; }
        public List<string> SpecializedCapabilities { get; set; } = new();
    }

    /// <summary>
    /// Performance Insight for Optimization
    /// </summary>
    public class PerformanceInsight
    {
        public string Category { get; set; } = "";
        public string Description { get; set; } = "";
        public double ImpactScore { get; set; }
        public InsightPriority Priority { get; set; }
        public List<string> RecommendedActions { get; set; } = new();
        public double ExpectedImprovement { get; set; }
    }

    /// <summary>
    /// Swarm Health Score Assessment
    /// </summary>
    public class SwarmHealthScore
    {
        public double OverallHealth { get; set; }
        public double PerformanceHealth { get; set; }
        public double ResourceHealth { get; set; }
        public double AccuracyHealth { get; set; }
        public double CollaborationHealth { get; set; }

        public HealthStatus Status => OverallHealth switch
        {
            >= 0.95 => HealthStatus.Excellent,
            >= 0.85 => HealthStatus.Good,
            >= 0.70 => HealthStatus.Fair,
            >= 0.50 => HealthStatus.Poor,
            _ => HealthStatus.Critical
        };

        public List<HealthAlert> Alerts { get; set; } = new();
    }

    /// <summary>
    /// Health Alert for Swarm Monitoring
    /// </summary>
    public class HealthAlert
    {
        public AlertSeverity Severity { get; set; }
        public string Message { get; set; } = "";
        public string Component { get; set; } = "";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public List<string> RecommendedActions { get; set; } = new();
    }

    #region Supporting Enumerations

    public enum AgentStatus
    {
        Active,
        Idle,
        Processing,
        Optimizing,
        Maintenance,
        Error,
        Offline
    }

    public enum InsightPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4,
        Emergency = 5
    }

    public enum HealthStatus
    {
        Excellent,
        Good,
        Fair,
        Poor,
        Critical
    }

    public enum AlertSeverity
    {
        Info,
        Warning,
        Error,
        Critical,
        Emergency
    }

    #endregion
}
