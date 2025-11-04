namespace TerraFusion.API.Models.DTOs
{
    /// <summary>
    /// Agent Orchestration Request/Response DTO
    /// </summary>
    public class AgentOrchestrationDto
    {
        // Request properties
        public string CountyCode { get; set; } = string.Empty;
        public int AgentCount { get; set; }
        public string OrchestrationMode { get; set; } = "Balanced";
        public Dictionary<string, object> Parameters { get; set; } = new();

        // Response properties
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int TotalAgentsInitialized { get; set; }
        public int TargetAgents { get; set; }
        public int SuccessfulCounties { get; set; }
        public int TotalCounties { get; set; }
        public bool Factor949Applied { get; set; }
        public bool LoadBalancingActive { get; set; }
        public bool PredictiveScalingActive { get; set; }
        public bool AutonomousHealingActive { get; set; }
        public double InitializationRate { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Load Balancing Request/Response DTO
    /// </summary>
    public class LoadBalancingDto
    {
        // Request properties
        public string Strategy { get; set; } = "RoundRobin";
        public int MaxAgentsPerNode { get; set; } = 100;
        public Dictionary<string, object> Parameters { get; set; } = new();

        // Response properties
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ClustersAnalyzed { get; set; }
        public int RebalancingActionsExecuted { get; set; }
        public int SuccessfulActions { get; set; }
        public double OverallLoadBalance { get; set; }
        public long ExecutionTimeMs { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Predictive Scaling Request/Response DTO
    /// </summary>
    public class PredictiveScalingDto
    {
        // Request properties
        public bool Enabled { get; set; } = true;
        public int TargetAgentCount { get; set; }
        public string ScalingStrategy { get; set; } = "Predictive";
        public Dictionary<string, object> Parameters { get; set; } = new();

        // Response properties
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int CurrentAgentCount { get; set; }
        public int RecommendedAgentCount { get; set; }
        public int ScalingActionsExecuted { get; set; }
        public double PredictionAccuracy { get; set; }
        public bool AutoScalingActive { get; set; }
        public List<string> ScalingRecommendations { get; set; } = new();
        public int SuccessfulScalingActions { get; set; }
        public int TotalAgentsAfterScaling { get; set; }
        public DateTime Timestamp { get; set; }
    }    /// <summary>
    /// Autonomous Healing Request/Response DTO
    /// </summary>
    public class AutonomousHealingDto
    {
        // Request properties
        public bool AutoHealingEnabled { get; set; }
        public int HealthCheckIntervalSeconds { get; set; }
        public List<string> HealingStrategies { get; set; } = new();

        // Response properties
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int UnhealthyAgentsDetected { get; set; }
        public int HealingStrategiesGenerated { get; set; }
        public int HealingActionsExecuted { get; set; }
        public int SuccessfulHealingActions { get; set; }
        public int AgentsHealed { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Agent Swarm Health Status DTO
    /// </summary>
    public class AgentSwarmHealthDto
    {
        public string OverallHealth { get; set; } = string.Empty;
        public int TotalAgents { get; set; }
        public int HealthyAgents { get; set; }
        public int UnhealthyAgents { get; set; }
        public double HealthPercentage { get; set; }
        public double OverallHealthPercentage { get; set; }
        public int ActiveClusters { get; set; }
        public int CountiesCovered { get; set; }
        public double SwarmUptimeMinutes { get; set; }
        public double AverageResponseTimeMs { get; set; }
        public double SystemThroughput { get; set; }
        public double LoadBalanceScore { get; set; }
        public int TotalLoadBalancingOperations { get; set; }
        public int TotalHealingOperations { get; set; }
        public int TotalScalingOperations { get; set; }
        public bool Factor949Active { get; set; }
        public string ComplianceStatus { get; set; } = string.Empty;
        public double OptimizationLevel { get; set; }
        public DateTime LastHealthCheck { get; set; }
        public Dictionary<string, int> HealthByCategory { get; set; } = new();
    }

    /// <summary>
    /// Factor 949 Quantum Optimization Request/Response DTO
    /// </summary>
    public class Factor949OptimizationDto
    {
        // Request properties
        public bool QuantumOptimizationEnabled { get; set; }
        public int QuantumFactor { get; set; } = 949;
        public double OptimizationLevel { get; set; }
        public Dictionary<string, double> QuantumParameters { get; set; } = new();

        // Response properties
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ClustersOptimized { get; set; }
        public int TotalClusters { get; set; }
        public double OptimizationGain { get; set; }
        public double AverageOptimizationGain { get; set; }
        public bool CoordinationOptimizationApplied { get; set; }
        public double CoordinationOptimizationGain { get; set; }
        public bool Factor949Active { get; set; }
        public double OptimizationRate { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Agent Distribution Across Counties DTO
    /// </summary>
    public class AgentDistributionDto
    {
        public Dictionary<string, int> CountyAgentCounts { get; set; } = new();
        public int TotalAgentsDeployed { get; set; }
        public string DistributionStrategy { get; set; } = string.Empty;
    }

    /// <summary>
    /// Performance Analytics Summary DTO
    /// </summary>
    public class PerformanceAnalyticsDto
    {
        public double AverageResponseTimeMs { get; set; }
        public double P95ResponseTimeMs { get; set; }
        public double P99ResponseTimeMs { get; set; }
        public double ThroughputRequestsPerSecond { get; set; }
        public double AccuracyPercentage { get; set; }
        public Dictionary<string, object> DetailedMetrics { get; set; } = new();
    }

    /// <summary>
    /// County Agent Status DTO
    /// </summary>
    public class CountyAgentStatusDto
    {
        public string CountyCode { get; set; } = string.Empty;
        public int ActiveAgents { get; set; }
        public int IdleAgents { get; set; }
        public double AgentUtilization { get; set; }
        public DateTime LastUpdateUtc { get; set; }
        
        // Additional county agent monitoring properties
        public string CountyId { get; set; } = string.Empty;
        public string CountyName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int TotalAgents { get; set; }
        public int HealthyAgents { get; set; }
        public int UnhealthyAgents { get; set; }
        public double HealthPercentage { get; set; }
        public double AverageResponseTimeMs { get; set; }
        public double ThroughputOpsPerSec { get; set; }
        public DateTime LastHealthCheck { get; set; }
    }

    /// <summary>
    /// Emergency Protocol Configuration DTO
    /// </summary>
    public class EmergencyProtocolDto
    {
        public string ProtocolName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int Priority { get; set; }
        public List<string> ActivationTriggers { get; set; } = new();
        public Dictionary<string, object> ProtocolActions { get; set; } = new();
    }
}
