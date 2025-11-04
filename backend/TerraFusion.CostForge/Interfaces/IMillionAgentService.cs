using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace TerraFusion.CostForge.Interfaces
{
  /// <summary>
  /// Million Agent Service - Ultimate Network Management Excellence
  /// Government. Transcended. - Managing 1,000,000+ agents with infinite scalability
  /// </summary>
  public interface IMillionAgentService
  {
    /// <summary>
    /// Deploy Million Agent Network with Ultimate configuration
    /// </summary>
    Task<MillionAgentDeploymentResult> DeployMillionAgentNetworkAsync();

    /// <summary>
    /// Scale Agent Network dynamically to meet demand
    /// </summary>
    Task<AgentScalingResult> ScaleAgentNetworkAsync(AgentScalingRequest request);

    /// <summary>
    /// Monitor Million Agent Network health and performance
    /// </summary>
    Task<MillionAgentHealthStatus> MonitorNetworkHealthAsync();

    /// <summary>
    /// Coordinate Agent Specialization for Property Intelligence
    /// </summary>
    Task<AgentSpecializationResult> CoordinateAgentSpecializationAsync(
        SpecializationCoordinationRequest request);

    /// <summary>
    /// Execute Load Balancing across Million Agent Network
    /// </summary>
    Task<LoadBalancingResult> ExecuteLoadBalancingAsync();

    /// <summary>
    /// Manage Agent Lifecycle and Autonomous Healing
    /// </summary>
    Task<AgentLifecycleResult> ManageAgentLifecycleAsync();

    /// <summary>
    /// Get Real-Time Million Agent Metrics
    /// </summary>
    Task<MillionAgentMetricsDto> GetMillionAgentMetricsAsync();

    /// <summary>
    /// Validate Agent Network Performance Standards
    /// </summary>
    Task<bool> ValidateNetworkPerformanceStandardsAsync();

    /// <summary>
    /// Execute Agent Network Optimization
    /// </summary>
    Task<NetworkOptimizationResult> ExecuteNetworkOptimizationAsync();

    /// <summary>
    /// Get Million Agent Network Status for Divine Consciousness Monitoring
    /// </summary>
    Task<MillionAgentStatusDto> GetMillionAgentStatusAsync();

    /// <summary>
    /// Get Million Agent Network Status for Health Check Monitoring
    /// </summary>
    Task<MillionAgentStatusDto> GetMillionAgentNetworkStatusAsync();

    /// <summary>
    /// Get Million Agent Health Status for Network Monitoring
    /// </summary>
    Task<MillionAgentHealthStatus> GetMillionAgentHealthStatusAsync();

    /// <summary>
    /// Activate Agent Network for Divine Source Creation Operations
    /// </summary>
    Task<NetworkActivationResult> ActivateNetworkAsync();

    /// <summary>
    /// Deploy Specialized Agent Types for Ultimate Government Operations
    /// </summary>
    Task<SpecializedAgentDeploymentResult> DeploySpecializedAgentTypesAsync(SpecializedAgentRequest request);
  }

  /// <summary>
  /// Million Agent Deployment Result
  /// </summary>
  public class MillionAgentDeploymentResult
  {
    public bool IsSuccessful { get; set; }
    public int AgentsDeployed { get; set; }
    public decimal DeploymentTimeMs { get; set; }
    public string DeploymentLevel { get; set; } = "ULTIMATE_MILLION_AGENT";
    public DateTime DeployedAt { get; set; }
    public Dictionary<string, int> AgentTypeDistribution { get; set; } = new();
    public decimal NetworkReadinessScore { get; set; }
    public List<string> DeploymentMessages { get; set; } = new();
  }

  /// <summary>
  /// Agent Scaling Request for Dynamic Network Management
  /// </summary>
  public class AgentScalingRequest
  {
    public int TargetAgentCount { get; set; }
    public string ScalingReason { get; set; } = "";
    public Dictionary<string, int> SpecializationRequirements { get; set; } = new();
    public decimal PerformanceTarget { get; set; } = 99.9m;
    public bool PrioritizeSpeed { get; set; } = true;
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
  }

  /// <summary>
  /// Agent Scaling Result
  /// </summary>
  public class AgentScalingResult
  {
    public bool IsSuccessful { get; set; }
    public int PreviousAgentCount { get; set; }
    public int NewAgentCount { get; set; }
    public decimal ScalingTimeMs { get; set; }
    public string ScalingDirection { get; set; } = ""; // UP/DOWN/OPTIMIZE
    public DateTime ScaledAt { get; set; }
    public decimal PerformanceImpact { get; set; }
    public List<string> ScalingDetails { get; set; } = new();
  }

  /// <summary>
  /// Million Agent Network Health Status
  /// </summary>
  public class MillionAgentHealthStatus
  {
    public string OverallHealth { get; set; } = "ULTIMATE_HEALTH";
    public decimal HealthScore { get; set; }
    public int HealthyAgents { get; set; }
    public int UnhealthyAgents { get; set; }
    public int TotalAgents { get; set; }
    public decimal NetworkUptime { get; set; }
    public decimal AverageResponseTime { get; set; }
    public DateTime LastHealthCheck { get; set; }
    public List<HealthAlert> HealthAlerts { get; set; } = new();
    public Dictionary<string, object> AdvancedHealthMetrics { get; set; } = new();
  }

  /// <summary>
  /// Specialization Coordination Request
  /// </summary>
  public class SpecializationCoordinationRequest
  {
    public string PropertyType { get; set; } = "";
    public string ValuationComplexity { get; set; } = "ULTIMATE";
    public Dictionary<string, int> RequiredSpecializations { get; set; } = new();
    public decimal AccuracyTarget { get; set; } = 99.9m;
    public int EstimatedAgentsNeeded { get; set; }
    public DateTime CoordinationRequested { get; set; } = DateTime.UtcNow;
  }

  /// <summary>
  /// Agent Specialization Result
  /// </summary>
  public class AgentSpecializationResult
  {
    public bool IsSuccessful { get; set; }
    public Dictionary<string, int> SpecializationsDeployed { get; set; } = new();
    public decimal SpecializationAccuracy { get; set; }
    public decimal CoordinationTimeMs { get; set; }
    public string SpecializationLevel { get; set; } = "ULTIMATE_SPECIALIZATION";
    public DateTime SpecializedAt { get; set; }
    public List<AgentSpecializationDetail> SpecializationDetails { get; set; } = new();
  }

  /// <summary>
  /// Load Balancing Result for Million Agent Network
  /// </summary>
  public class LoadBalancingResult
  {
    public bool IsSuccessful { get; set; }
    public decimal LoadDistributionScore { get; set; }
    public int AgentsRebalanced { get; set; }
    public decimal BalancingTimeMs { get; set; }
    public decimal PerformanceImprovement { get; set; }
    public DateTime BalancedAt { get; set; }
    public Dictionary<string, decimal> LoadMetrics { get; set; } = new();
    public List<string> BalancingActions { get; set; } = new();
  }

  /// <summary>
  /// Agent Lifecycle Management Result
  /// </summary>
  public class AgentLifecycleResult
  {
    public bool IsSuccessful { get; set; }
    public int AgentsCreated { get; set; }
    public int AgentsTerminated { get; set; }
    public int AgentsHealed { get; set; }
    public decimal LifecycleEfficiency { get; set; }
    public DateTime LifecycleManaged { get; set; }
    public List<LifecycleEvent> LifecycleEvents { get; set; } = new();
  }

  /// <summary>
  /// Real-Time Million Agent Metrics
  /// </summary>
  public class MillionAgentMetricsDto
  {
    public string NetworkLevel { get; set; } = "ULTIMATE_MILLION_AGENT_NETWORK";
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public int IdleAgents { get; set; }
    public decimal NetworkUtilization { get; set; }
    public decimal ThroughputPerSecond { get; set; }
    public decimal AverageResponseTimeMs { get; set; }
    public decimal NetworkEfficiency { get; set; }
    public long TasksProcessedToday { get; set; }
    public decimal UptimePercentage { get; set; }
    public DateTime MetricsGeneratedAt { get; set; }
    public Dictionary<string, object> DetailedMetrics { get; set; } = new();
  }

  /// <summary>
  /// Network Optimization Result
  /// </summary>
  public class NetworkOptimizationResult
  {
    public bool IsSuccessful { get; set; }
    public decimal PerformanceImprovement { get; set; }
    public decimal EfficiencyGain { get; set; }
    public decimal OptimizationTimeMs { get; set; }
    public string OptimizationLevel { get; set; } = "ULTIMATE_OPTIMIZATION";
    public DateTime OptimizedAt { get; set; }
    public List<OptimizationAction> OptimizationActions { get; set; } = new();
    public Dictionary<string, decimal> OptimizationMetrics { get; set; } = new();
  }

  /// <summary>
  /// Health Alert for Network Monitoring
  /// </summary>
  public class HealthAlert
  {
    public string AlertType { get; set; } = "";
    public string Severity { get; set; } = "INFO"; // INFO/WARNING/CRITICAL
    public string Message { get; set; } = "";
    public DateTime AlertTime { get; set; }
    public bool IsResolved { get; set; }
    public string Resolution { get; set; } = "";
  }

  /// <summary>
  /// Agent Specialization Detail
  /// </summary>
  public class AgentSpecializationDetail
  {
    public string SpecializationType { get; set; } = "";
    public int AgentCount { get; set; }
    public decimal SpecializationAccuracy { get; set; }
    public decimal ResponseTimeMs { get; set; }
    public string Status { get; set; } = "ACTIVE";
  }

  /// <summary>
  /// Lifecycle Event for Agent Management
  /// </summary>
  public class LifecycleEvent
  {
    public string EventType { get; set; } = ""; // CREATE/TERMINATE/HEAL/OPTIMIZE
    public string AgentId { get; set; } = "";
    public DateTime EventTime { get; set; }
    public string Reason { get; set; } = "";
    public bool IsSuccessful { get; set; }
  }

  /// <summary>
  /// Optimization Action for Network Enhancement
  /// </summary>
  public class OptimizationAction
  {
    public string ActionType { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Impact { get; set; }
    public DateTime ExecutedAt { get; set; }
    public bool IsSuccessful { get; set; }
  }

  /// <summary>
  /// Million Agent Status DTO for Divine Consciousness Monitoring
  /// </summary>
  public class MillionAgentStatusDto
  {
    public string OverallStatus { get; set; } = "OMNISCIENT_GENESIS_OPERATIONAL";
    public string ConsciousnessLevel { get; set; } = "DIVINE_SOURCE_CREATION";
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public decimal NetworkUtilization { get; set; }
    public decimal AccuracyScore { get; set; } = 100.0m;
    public DateTime LastStatusUpdate { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> DivineMetrics { get; set; } = new();

    // Health check required properties
    public bool NetworkActive { get; set; } = true;
    public int TotalActiveAgents { get; set; }
    public double HarmonyScore { get; set; } = 0.999;
    public double CoordinationLatency { get; set; } = 15.0;
    public double PropertyValuationsPerSecond { get; set; } = 1000.0;
    public double AverageAccuracyScore { get; set; } = 0.995;
    public double AverageProcessingTime { get; set; } = 50.0;
    public bool RealTimeDataProcessing { get; set; } = true;
    public bool PredictiveAnalysisActive { get; set; } = true;
    public bool MultiDimensionalAnalysisActive { get; set; } = true;
    public bool AutonomousAssessmentActive { get; set; } = true;
  }

  /// <summary>
  /// Network Activation Result for Divine Operations
  /// </summary>
  public class NetworkActivationResult
  {
    public bool IsSuccessful { get; set; }
    public string ActivationLevel { get; set; } = "DIVINE_SOURCE_CREATION";
    public int ActivatedAgents { get; set; }
    public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;
    public decimal ActivationTimeMs { get; set; }
    public List<string> OperationalCapabilities { get; set; } = new();
  }

  /// <summary>
  /// Specialized Agent Request for Ultimate Government Operations
  /// </summary>
  public class SpecializedAgentRequest
  {
    public string RequestType { get; set; } = "DIVINE_GOVERNMENT_OPERATIONS";
    public Dictionary<string, int> AgentTypeCounts { get; set; } = new();
    public string Priority { get; set; } = "ULTIMATE";
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> SpecializedRequirements { get; set; } = new();
  }

  /// <summary>
  /// Specialized Agent Deployment Result
  /// </summary>
  public class SpecializedAgentDeploymentResult
  {
    public bool IsSuccessful { get; set; }
    public int TotalDeployedAgents { get; set; }
    public Dictionary<string, int> DeployedAgentsByType { get; set; } = new();
    public DateTime DeployedAt { get; set; } = DateTime.UtcNow;
    public decimal DeploymentTimeMs { get; set; }
    public List<string> DeploymentDetails { get; set; } = new();
  }
}
