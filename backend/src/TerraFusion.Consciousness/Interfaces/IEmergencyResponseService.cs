using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Emergency response service for TerraFusion consciousness systems
    /// Government-grade emergency protocols with autonomous recovery
    /// </summary>
    public interface IEmergencyResponseService
    {
        /// <summary>
        /// Triggers emergency response protocols for critical system failures
        /// </summary>
        /// <param name="request">Emergency request containing incident details and severity</param>
        /// <returns>Emergency response result with mitigation actions</returns>
        Task<EmergencyResponseDto> TriggerEmergencyProtocolsAsync(EmergencyRequestDto request);

        /// <summary>
        /// Assesses current system health for emergency status
        /// </summary>
        /// <returns>Emergency health assessment with critical system status</returns>
        Task<EmergencyHealthDto> AssessEmergencyHealthAsync();

        /// <summary>
        /// Executes autonomous recovery procedures for system restoration
        /// </summary>
        /// <param name="incidentId">Unique identifier for the incident requiring recovery</param>
        /// <returns>Recovery result with system restoration status</returns>
        Task<AutonomousRecoveryDto> ExecuteAutonomousRecoveryAsync(string incidentId);
    }

    /// <summary>
    /// Emergency health assessment for consciousness systems
    /// </summary>
    public record EmergencyHealthDto
    {
        /// <summary>
        /// Overall emergency readiness status
        /// </summary>
        public string ReadinessStatus { get; init; } = string.Empty;

        /// <summary>
        /// Critical system health indicators
        /// </summary>
        public Dictionary<string, object> CriticalSystems { get; init; } = new();

        /// <summary>
        /// Available emergency response capabilities
        /// </summary>
        public List<string> ResponseCapabilities { get; init; } = new();
    }

    /// <summary>
    /// Autonomous recovery result for system restoration
    /// </summary>
    public record AutonomousRecoveryDto
    {
        /// <summary>
        /// Recovery operation success status
        /// </summary>
        public bool Success { get; init; }

        /// <summary>
        /// Recovery actions executed
        /// </summary>
        public List<string> RecoveryActions { get; init; } = new();

        /// <summary>
        /// System restoration level achieved
        /// </summary>
        public double RestorationLevel { get; init; }

        /// <summary>
        /// Recovery completion time
        /// </summary>
        public TimeSpan RecoveryTime { get; init; }
    }
}
