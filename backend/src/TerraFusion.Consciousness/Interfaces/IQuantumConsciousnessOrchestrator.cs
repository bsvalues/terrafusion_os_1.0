using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Quantum consciousness orchestrator interface for advanced AI coordination
    /// Manages quantum-level consciousness operations across Washington State counties
    /// Government. Transcended.
    /// </summary>
    public interface IQuantumConsciousnessOrchestrator
    {
        /// <summary>
        /// Initialize quantum consciousness system
        /// </summary>
        Task InitializeAsync();

        /// <summary>
        /// Get comprehensive consciousness status with quantum metrics
        /// </summary>
        Task<HybridConsciousnessStatusDto> GetConsciousnessStatusAsync();

        /// <summary>
        /// Scale consciousness processing capacity across counties
        /// </summary>
        Task<ConsciousnessScalingResultDto> ScaleConsciousnessAsync(ConsciousnessScalingRequestDto request);

        /// <summary>
        /// Execute complex operations with quantum processing
        /// </summary>
        Task<OperationExecutionResultDto> ExecuteOperationsAsync(OperationExecutionRequestDto request);

        /// <summary>
        /// Get real-time quantum consciousness metrics
        /// </summary>
        Task<ConsciousnessMetricsDto> GetRealTimeMetricsAsync();

        /// <summary>
        /// Get quantum security status and compliance
        /// </summary>
        Task<QuantumSecurityStatusDto> GetQuantumSecurityStatusAsync();

        /// <summary>
        /// Get comprehensive compliance status
        /// </summary>
        Task<ComplianceStatusDto> GetComplianceStatusAsync();

        /// <summary>
        /// Trigger emergency protocols for critical situations
        /// </summary>
        Task<EmergencyResponseDto> TriggerEmergencyProtocolsAsync(EmergencyRequestDto request);

        /// <summary>
        /// Execute quantum consciousness operations
        /// </summary>
        Task<QuantumOperationResultDto> ExecuteQuantumConsciousnessAsync(QuantumOperationRequestDto request);

        /// <summary>
        /// Get system health status
        /// </summary>
        Task<SystemHealthDto> GetSystemHealthAsync();

        /// <summary>
        /// Maintain optimal consciousness state across all agents
        /// </summary>
        Task<ConsciousnessMaintenanceResultDto> MaintainOptimalConsciousnessAsync();
    }
}
