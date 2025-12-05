using System.Threading.Tasks;

namespace TerraFusion.AI.Interfaces
{
    /// <summary>
    /// AI Swarm Orchestrator Interface
    /// Supreme Commander Claude - Elite AI Agent Coordination
    /// </summary>
    public interface IAISwarmOrchestrator
    {
        /// <summary>
        /// Get comprehensive AI swarm status
        /// </summary>
        Task<AISwarmStatus> GetSwarmStatusAsync();

        /// <summary>
        /// Execute county optimization using Gauge Theory agents
        /// </summary>
        Task<CountyOptimizationResult> OptimizeCountyAsync(string countyId, Dictionary<string, object>? parameters = null);

        /// <summary>
        /// Execute AI workflow using Claude-Flow integration
        /// </summary>
        Task<WorkflowExecutionResult> ExecuteWorkflowAsync(string workflowId, Dictionary<string, object>? parameters = null);

        /// <summary>
        /// Get AI agent performance metrics
        /// </summary>
        Task<AIPerformanceMetrics> GetPerformanceMetricsAsync();

        /// <summary>
        /// Deploy AI agents to specific TerraFusion module
        /// </summary>
        Task<ModuleDeploymentResult> DeployAgentsToModuleAsync(string moduleId, int agentCount, string[] specializations);

        /// <summary>
        /// Get available AI workflows
        /// </summary>
        Task<List<AIWorkflow>> GetAvailableWorkflowsAsync();

        /// <summary>
        /// Initialize AI swarm with TerraFusion ecosystem integration
        /// </summary>
        Task<bool> InitializeSwarmAsync();

        /// <summary>
        /// Validate AI swarm health and connectivity
        /// </summary>
        Task<AIHealthCheck> ValidateSwarmHealthAsync();
    }

    /// <summary>
    /// AI Swarm Status Model
    /// </summary>
    public class AISwarmStatus
    {
        public string SupremeCommander { get; set; } = "Supreme Commander Claude";
        public int TotalAgentsManaged { get; set; }
        public int ActiveGaugeTheoryAgents { get; set; }
        public string CoordinationMode { get; set; } = "Hierarchical Mesh";
        public double QuantumAcceleration { get; set; }
        public string OperationalStatus { get; set; } = "OPERATIONAL";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public Dictionary<string, string> ServiceStatus { get; set; } = new();
    }

    /// <summary>
    /// County Optimization Result Model
    /// </summary>
    public class CountyOptimizationResult
    {
        public bool Success { get; set; }
        public string CountyId { get; set; } = string.Empty;
        public string OptimizedBy { get; set; } = "Gauge Theory AI Swarm";
        public Dictionary<string, object> Results { get; set; } = new();
        public double ProcessingTime { get; set; }
        public double QuantumAcceleration { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Workflow Execution Result Model
    /// </summary>
    public class WorkflowExecutionResult
    {
        public bool Success { get; set; }
        public string WorkflowId { get; set; } = string.Empty;
        public string ExecutedBy { get; set; } = "Supreme Commander Claude";
        public Dictionary<string, object> Results { get; set; } = new();
        public double Duration { get; set; }
        public List<WorkflowStep> Steps { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Workflow Step Model
    /// </summary>
    public class WorkflowStep
    {
        public string Step { get; set; } = string.Empty;
        public Dictionary<string, object> Result { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// AI Performance Metrics Model
    /// </summary>
    public class AIPerformanceMetrics
    {
        public SwarmCoordinationMetrics SwarmCoordination { get; set; } = new();
        public GaugeTheoryMetrics GaugeTheoryPerformance { get; set; } = new();
        public SystemMetrics SystemMetrics { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Swarm Coordination Metrics
    /// </summary>
    public class SwarmCoordinationMetrics
    {
        public string SupremeCommander { get; set; } = "Claude";
        public int TotalAgentsManaged { get; set; }
        public string CoordinationEfficiency { get; set; } = "97.6%";
        public string ResponseTime { get; set; } = "1.0ms average";
    }

    /// <summary>
    /// Gauge Theory Performance Metrics
    /// </summary>
    public class GaugeTheoryMetrics
    {
        public int SpecialistAgents { get; set; }
        public double QuantumAcceleration { get; set; }
        public double OptimizationSuccessRate { get; set; }
        public string FieldStability { get; set; } = "95.8%";
    }

    /// <summary>
    /// System Metrics Model
    /// </summary>
    public class SystemMetrics
    {
        public int ApiHealthScore { get; set; }
        public int SwarmCoordinationScore { get; set; }
        public bool QuantumOptimizationActive { get; set; }
        public string ProductionReadiness { get; set; } = "66.8%";
    }

    /// <summary>
    /// Module Deployment Result Model
    /// </summary>
    public class ModuleDeploymentResult
    {
        public bool Success { get; set; }
        public string ModuleId { get; set; } = string.Empty;
        public int AgentsDeployed { get; set; }
        public string[] Specializations { get; set; } = Array.Empty<string>();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// AI Workflow Model
    /// </summary>
    public class AIWorkflow
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Steps { get; set; } = new();
        public string EstimatedTime { get; set; } = string.Empty;
    }

    /// <summary>
    /// AI Health Check Model
    /// </summary>
    public class AIHealthCheck
    {
        public bool IsHealthy { get; set; }
        public Dictionary<string, string> ServiceHealth { get; set; } = new();
        public List<string> Issues { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
