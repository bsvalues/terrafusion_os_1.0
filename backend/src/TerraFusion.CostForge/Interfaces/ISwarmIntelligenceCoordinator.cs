using System.Threading.Tasks;
using System.Collections.Generic;
using TerraFusion.CostForge.Models;

namespace TerraFusion.CostForge.Interfaces
{
    /// <summary>
    /// Swarm Intelligence Coordinator Interface
    /// Advanced AI swarm coordination for elite property assessment performance
    /// </summary>
    public interface ISwarmIntelligenceCoordinator
    {
        /// <summary>
        /// Orchestrates elite swarm intelligence coordination for property assessment tasks
        /// </summary>
        /// <param name="task">Property assessment task requiring swarm coordination</param>
        /// <param name="options">Swarm coordination options and performance requirements</param>
        /// <returns>Swarm coordination result with performance metrics</returns>
        Task<SwarmCoordinationResult> CoordinateSwarmIntelligenceAsync(
            PropertyAssessmentTask task,
            SwarmCoordinationOptions options);

        /// <summary>
        /// Implements advanced swarm optimization algorithms for agent performance enhancement
        /// </summary>
        /// <param name="performanceData">Current swarm performance data for optimization</param>
        /// <returns>Swarm optimization result with performance improvements</returns>
        Task<SwarmOptimizationResult> OptimizeSwarmPerformanceAsync(SwarmPerformanceData performanceData);

        /// <summary>
        /// Coordinates multiple agent teams for complex property assessment workflows
        /// </summary>
        /// <param name="agentTeams">List of agent teams to coordinate</param>
        /// <param name="task">Property assessment task requiring team coordination</param>
        /// <returns>Agent team coordination result with efficiency metrics</returns>
        Task<AgentTeamCoordinationResult> CoordinateAgentTeamsAsync(
            List<AgentTeam> agentTeams,
            PropertyAssessmentTask task);
    }
}
