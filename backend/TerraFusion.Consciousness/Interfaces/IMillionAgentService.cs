using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Million Agent Service interface for massive-scale AI coordination
    /// Manages up to 1,000,000+ AI agents across TerraFusion OS
    /// Government. Transcended.
    /// </summary>
    public interface IMillionAgentService
    {
        /// <summary>
        /// Initialize the million agent system
        /// </summary>
        Task<MillionAgentInitializationResultDto> InitializeAsync();

        /// <summary>
        /// Scale to specified number of agents with government-grade reliability
        /// </summary>
        Task<MillionAgentScalingResultDto> ScaleToAgentsAsync(int targetAgentCount);

        /// <summary>
        /// Execute coordinated operations across all active agents
        /// </summary>
        Task<MillionAgentOperationResultDto> ExecuteCoordinatedOperationsAsync(CoordinatedOperationRequestDto request);

        /// <summary>
        /// Get comprehensive system status and agent metrics
        /// </summary>
        Task<MillionAgentStatusDto> GetSystemStatusAsync();

        /// <summary>
        /// Optimize quantum coherence across agent mesh
        /// </summary>
        Task<QuantumCoherenceOptimizationResultDto> OptimizeQuantumCoherenceAsync();

        /// <summary>
        /// Coordinate million agents in real-time
        /// </summary>
        Task<MillionAgentCoordinationResultDto> CoordinateMillionAgentsAsync(MillionAgentCoordinationRequestDto request);

        /// <summary>
        /// Get agent system health metrics
        /// </summary>
        Task<AgentSystemHealthDto> GetAgentSystemHealthAsync();
    }
}
