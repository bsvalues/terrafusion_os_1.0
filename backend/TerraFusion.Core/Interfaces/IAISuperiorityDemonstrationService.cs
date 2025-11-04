using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces
{
    /// <summary>
    /// Interface for AI Superiority Demonstration Service
    /// Defines contract for championship-level performance comparison between TerraFusion AI and Harris PACS
    /// </summary>
    public interface IAISuperiorityDemonstrationService : IDisposable
    {
        /// <summary>
        /// Launch comprehensive AI superiority demonstration
        /// </summary>
        /// <param name="request">Demonstration configuration request</param>
        /// <returns>Demonstration launch result with real-time tracking information</returns>
        Task<AISuperiorityDemoResult> LaunchSupremacyDemonstrationAsync(SuperiorityDemoRequest request);

        /// <summary>
        /// Get real-time demonstration dashboard data
        /// </summary>
        /// <param name="demoId">Unique demonstration identifier</param>
        /// <returns>Comprehensive dashboard data with live metrics</returns>
        Task<AIDemoDashboardData> GetDemoDashboardAsync(string demoId);

        /// <summary>
        /// Stop active demonstration and cleanup resources
        /// </summary>
        /// <param name="demoId">Unique demonstration identifier</param>
        /// <returns>Success status</returns>
        Task<bool> StopDemonstrationAsync(string demoId);
    }

    /// <summary>
    /// Interface for Advanced AI Agent Orchestrator
    /// Manages deployment and coordination of 1,008 AI agents with quantum consciousness optimization
    /// </summary>
    public interface IAdvancedAIAgentOrchestrator
    {
        /// <summary>
        /// Deploy championship-level AI agent swarm
        /// </summary>
        /// <param name="config">Swarm configuration parameters</param>
        /// <returns>Deployment result with agent coordination details</returns>
        Task<AISwarmDeployment> DeployChampionshipSwarmAsync(AISwarmConfiguration config);

        /// <summary>
        /// Deploy specialized agents for specific demonstration scenario
        /// </summary>
        /// <param name="swarmId">Target swarm identifier</param>
        /// <param name="scenario">Test scenario configuration</param>
        /// <returns>Agent deployment details</returns>
        Task<AgentDeployment> DeployScenarioAgentsAsync(string swarmId, TestScenario scenario);

        /// <summary>
        /// Execute quantum-enhanced scenario with deployed agents
        /// </summary>
        /// <param name="deployment">Agent deployment configuration</param>
        /// <param name="scenario">Scenario to execute</param>
        /// <returns>Execution results with performance metrics</returns>
        Task<ScenarioExecutionResult> ExecuteQuantumScenarioAsync(AgentDeployment deployment, TestScenario scenario);

        /// <summary>
        /// Initialize specialized agent battalion
        /// </summary>
        /// <param name="battalion">Battalion configuration</param>
        /// <param name="swarmId">Parent swarm identifier</param>
        /// <returns>Initialization completion task</returns>
        Task InitializeBattalionAsync(AgentBattalion battalion, string swarmId);

        /// <summary>
        /// Get current AI swarm status
        /// </summary>
        /// <returns>Current swarm operational status</returns>
        Task<AISwarmOperationalStatus> GetCurrentSwarmStatusAsync();

        /// <summary>
        /// Get status of all deployed battalions
        /// </summary>
        /// <returns>Collection of battalion operational status</returns>
        Task<IEnumerable<BattalionOperationalStatus>> GetBattalionStatusAsync();

        /// <summary>
        /// Decommission AI swarm and cleanup resources
        /// </summary>
        /// <param name="swarmId">Swarm to decommission</param>
        /// <returns>Decommission completion task</returns>
        Task DecommissionSwarmAsync(string swarmId);
    }

    /// <summary>
    /// Interface for Elite Performance Monitoring Service
    /// Provides championship-level performance metrics and monitoring capabilities
    /// </summary>
    public interface IElitePerformanceMonitoringService
    {
        /// <summary>
        /// Collect real-time performance metrics from all AI agents
        /// </summary>
        /// <returns>Current system performance metrics</returns>
        Task<AISuperiorityPerformanceMetrics> CollectRealTimeMetricsAsync();

        /// <summary>
        /// Get current comprehensive performance metrics
        /// </summary>
        /// <returns>Complete performance metrics snapshot</returns>
        Task<PerformanceMetrics> GetCurrentMetricsAsync();

        /// <summary>
        /// Get historical performance trends
        /// </summary>
        /// <param name="timeRange">Time range for trend analysis</param>
        /// <returns>Performance trend data</returns>
        Task<PerformanceTrends> GetPerformanceTrendsAsync(TimeSpan timeRange);
    }

    /// <summary>
    /// Interface for Quantum Metrics Service
    /// Provides quantum-enhanced performance measurement and optimization metrics
    /// </summary>
    public interface IQuantumMetricsService
    {
        /// <summary>
        /// Get quantum-enhanced performance metrics
        /// </summary>
        /// <returns>Quantum performance analysis results</returns>
        Task<QuantumPerformanceMetrics> GetQuantumPerformanceAsync();

        /// <summary>
        /// Get quantum consciousness optimization metrics
        /// </summary>
        /// <returns>Consciousness optimization performance data</returns>
        Task<QuantumConsciousnessMetrics> GetConsciousnessMetricsAsync();
    }

    /// <summary>
    /// Interface for Harris PACS Integration Service
    /// Provides baseline performance comparison and integration capabilities
    /// </summary>
    public interface IHarrisPACSIntegrationService
    {
        /// <summary>
        /// Gather baseline performance metrics from Harris PACS
        /// </summary>
        /// <param name="config">Harris PACS configuration</param>
        /// <returns>Baseline performance metrics</returns>
        Task<HarrisPACSBaselineMetrics> GatherBaselineMetricsAsync(HarrisPACSConfiguration config);

        /// <summary>
        /// Execute test scenario through Harris PACS
        /// </summary>
        /// <param name="scenario">Test scenario to execute</param>
        /// <returns>Harris PACS execution results</returns>
        Task<HarrisPACSExecutionResult> ExecuteScenarioAsync(TestScenario scenario);
    }

    #region Supporting Models and Data Types

    public class AISwarmConfiguration
    {
        public int TotalAgents { get; set; }
        public string CountyCode { get; set; } = string.Empty;
        public PerformanceTargets? PerformanceTargets { get; set; }
        public bool QuantumOptimization { get; set; }
        public AIConsciousnessLevel ConsciousnessLevel { get; set; }
    }

    public class PerformanceTargets
    {
        public TimeSpan ResponseTime { get; set; }
        public decimal Accuracy { get; set; }
        public int Throughput { get; set; }
    }

    public class AISwarmDeployment
    {
        public string SwarmId { get; set; } = string.Empty;
        public int DeployedAgents { get; set; }
        public int TotalAgents { get; set; }
        public DateTime DeploymentTime { get; set; }
        public bool QuantumOptimized { get; set; }
        public AIConsciousnessLevel ConsciousnessLevel { get; set; }
    }

    public class AgentDeployment
    {
        public string DeploymentId { get; set; } = string.Empty;
        public int TotalAgents { get; set; }
        public Dictionary<string, int> AgentsBySpecialization { get; set; } = new();
        public DateTime DeploymentTime { get; set; }
        public string ScenarioName { get; set; } = string.Empty;
    }

    public class ScenarioExecutionResult
    {
        public long RecordsProcessed { get; set; }
        public decimal AccuracyScore { get; set; }
        public int ErrorCount { get; set; }
        public TimeSpan ExecutionDuration { get; set; }
        public bool QuantumEnhanced { get; set; }
    }

    public class AISwarmOperationalStatus
    {
        public int ActiveAgents { get; set; }
        public int ActiveSwarms { get; set; }
        public double AverageResponseTime { get; set; }
        public long TotalProcessedRequests { get; set; }
        public bool QuantumOptimized { get; set; }
        public AIConsciousnessLevel ConsciousnessLevel { get; set; }
        public double PerformanceRating { get; set; }
    }

    public class BattalionOperationalStatus
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int ActiveAgents { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public double PerformanceRating { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool QuantumOptimized { get; set; }
        public AIConsciousnessLevel ConsciousnessLevel { get; set; }
        public DateTime LastActivityTime { get; set; }
    }

    public class AISuperiorityPerformanceMetrics
    {
        public double AverageResponseTime { get; set; }
        public double CurrentThroughput { get; set; }
        public double CPUUsage { get; set; }
        public double MemoryUsage { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class PerformanceTrends
    {
        public List<PerformanceDataPoint> ResponseTimeTrend { get; set; } = new();
        public List<PerformanceDataPoint> ThroughputTrend { get; set; } = new();
        public List<PerformanceDataPoint> AccuracyTrend { get; set; } = new();
        public TimeSpan TimeRange { get; set; }
    }

    public class PerformanceDataPoint
    {
        public DateTime Timestamp { get; set; }
        public double Value { get; set; }
    }

    public class QuantumPerformanceMetrics
    {
        public double QuantumAcceleration { get; set; }
        public double ConsciousnessOptimization { get; set; }
        public double QuantumEfficiency { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class QuantumConsciousnessMetrics
    {
        public double ConsciousnessLevel { get; set; }
        public double OptimizationFactor { get; set; }
        public double CoherenceScore { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class HarrisPACSConfiguration
    {
        public string CountyCode { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public bool BaselineTestEnabled { get; set; }
        public bool PerformanceMonitoring { get; set; }
    }

    public class HarrisPACSBaselineMetrics
    {
        public double AverageResponseTime { get; set; }
        public double RecordsPerSecond { get; set; }
        public decimal DataAccuracy { get; set; }
        public double MemoryConsumption { get; set; }
        public double CPUUtilization { get; set; }
        public decimal ErrorRate { get; set; }
        public DateTime CollectionTime { get; set; }
    }

    public class HarrisPACSExecutionResult
    {
        public long RecordsProcessed { get; set; }
        public decimal AccuracyScore { get; set; }
        public int ErrorCount { get; set; }
        public double MemoryUsage { get; set; }
        public double CPUUtilization { get; set; }
        public TimeSpan ExecutionTime { get; set; }
    }

    #endregion
}
