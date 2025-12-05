using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Quantum Security Service interface for government-grade protection
    /// Provides advanced security operations for TerraFusion consciousness infrastructure
    /// Government. Transcended.
    /// </summary>
    public interface IQuantumSecurityService
    {
        /// <summary>
        /// Initialize quantum security systems
        /// </summary>
        Task<QuantumSecurityInitializationResultDto> InitializeAsync();

        /// <summary>
        /// Deploy comprehensive security to all agents in the mesh
        /// </summary>
        Task<QuantumSecurityDeploymentResultDto> DeploySecurityToAllAgentsAsync();

        /// <summary>
        /// Monitor quantum-level security threats across the system
        /// </summary>
        Task<QuantumThreatMonitoringResultDto> MonitorQuantumThreatsAsync();

        /// <summary>
        /// Validate security compliance against government standards
        /// </summary>
        Task<SecurityComplianceResultDto> ValidateSecurityComplianceAsync();

        /// <summary>
        /// Respond to security incidents with automated protocols
        /// </summary>
        Task<SecurityIncidentResponseDto> RespondToSecurityIncidentAsync(SecurityIncidentDto incident);
    }
}