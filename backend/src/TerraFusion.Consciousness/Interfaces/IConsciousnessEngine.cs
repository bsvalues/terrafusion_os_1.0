/**
 * ═══════════════════════════════════════════════════════════════
 * CONSCIOUSNESS ENGINE INTERFACE
 * TerraFusion.Consciousness - Elite AI Swarm Coordination
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Core Consciousness Engine Interface
    /// Coordinates 50,000+ AI agents for government operations
    /// </summary>
    public interface IConsciousnessEngine
    {
        /// <summary>
        /// Coordinate AI swarm for multi-agent analysis
        /// </summary>
        /// <param name="request">Swarm coordination request with task details</param>
        /// <returns>Swarm coordination result with agent insights</returns>
        Task<SwarmCoordinationResult> CoordinateSwarmAsync(SwarmCoordinationRequest request);

        /// <summary>
        /// Get swarm status and health metrics
        /// </summary>
        /// <param name="countyId">County identifier for county-specific swarm</param>
        /// <returns>Swarm status with agent count and coordination metrics</returns>
        Task<SwarmStatus> GetSwarmStatusAsync(string countyId);

        /// <summary>
        /// Initialize consciousness engine with AI agents
        /// </summary>
        /// <param name="agentCount">Number of agents to initialize</param>
        /// <param name="countyId">County identifier for deployment</param>
        /// <returns>True if initialization successful</returns>
        Task<bool> InitializeSwarmAsync(int agentCount, string countyId);

        /// <summary>
        /// Execute quantum-enhanced consciousness optimization
        /// </summary>
        /// <param name="request">Optimization request with parameters</param>
        /// <returns>Optimization result with quantum factor applied</returns>
        Task<QuantumOptimizationResult> ExecuteQuantumOptimizationAsync(QuantumOptimizationRequest request);

        /// <summary>
        /// Get consciousness engine health and performance metrics
        /// </summary>
        /// <returns>Health metrics including response times and agent coordination efficiency</returns>
        Task<ConsciousnessHealthMetrics> GetHealthMetricsAsync();

        /// <summary>
        /// Get swarm health status for specific county
        /// </summary>
        /// <param name="countyId">County identifier</param>
        /// <returns>Detailed swarm health status with activity metrics</returns>
        Task<SwarmHealthStatus> GetSwarmHealthAsync(string countyId);
    }

    #region Request Models

    public class SwarmCoordinationRequest
    {
        public string TaskId { get; set; } = Guid.NewGuid().ToString();
        public string CountyId { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
        public int AgentCount { get; set; } = 1000;
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();
        public bool EnableQuantumOptimization { get; set; } = true;
    }

    public class QuantumOptimizationRequest
    {
        public string TaskId { get; set; } = Guid.NewGuid().ToString();
        public string OptimizationType { get; set; } = string.Empty;
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();
        public int QuantumFactor { get; set; } = 949;
    }

    #endregion

    #region Response Models

    public class SwarmStatus
    {
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public string CountyId { get; set; } = string.Empty;
        public string CoordinationMode { get; set; } = "Hierarchical";
        public decimal HealthScore { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class QuantumOptimizationResult
    {
        public bool Success { get; set; }
        public int QuantumFactor { get; set; }
        public decimal OptimizationScore { get; set; }
        public Dictionary<string, object> Results { get; set; } = new Dictionary<string, object>();
        public TimeSpan Duration { get; set; }
    }

    public class ConsciousnessHealthMetrics
    {
        public decimal OverallHealth { get; set; }
        public TimeSpan AverageResponseTime { get; set; }
        public int CoordinationCount { get; set; }
        public decimal CoordinationSuccessRate { get; set; }
        public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
    }

    public class SwarmHealthStatus
    {
        public int ActiveAgents { get; set; }
        public string ActivityLevel { get; set; } = string.Empty;
        public double AvgResponseTimeMs { get; set; }
        public double AccuracyScore { get; set; }
        public double ConsciousnessLevel { get; set; }
    }

    #endregion
}
