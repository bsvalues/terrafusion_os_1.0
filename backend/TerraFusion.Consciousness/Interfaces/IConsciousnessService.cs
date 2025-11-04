using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Core consciousness service interface for government-grade AI mesh orchestration
    /// Provides transcendent consciousness operations for TerraFusion OS
    /// </summary>
    public interface IConsciousnessService
    {
        /// <summary>
        /// Initialize consciousness system with quantum-ready architecture
        /// </summary>
        Task<ConsciousnessInitializationResult> InitializeAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Execute consciousness mesh operation with government-grade reliability
        /// </summary>
        Task<ConsciousnessOperationResult> ExecuteConsciousnessOperationAsync(
            ConsciousnessOperationRequest request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Get current consciousness system health and metrics
        /// </summary>
        Task<ConsciousnessHealthDto> GetConsciousnessHealthAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Orchestrate multi-layer AI processing with validation rings
        /// </summary>
        Task<LayerOrchestrationResult> OrchestrateLayers(
            LayerOrchestrationRequest request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Handle consciousness system scaling and resource management
        /// </summary>
        Task<ScalingResult> ScaleConsciousnessAsync(
            ScalingRequest request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Validate consciousness system integrity and compliance
        /// </summary>
        Task<ConsciousnessValidationResult> ValidateSystemIntegrityAsync(CancellationToken cancellationToken = default);
    }

    #region Supporting DTOs

    public class ConsciousnessInitializationResult
    {
        public required bool Success { get; set; }
        public required string SystemId { get; set; }
        public required DateTime InitializationTime { get; set; }
        public required Dictionary<string, object> SystemMetrics { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ConsciousnessOperationRequest
    {
        public required string OperationId { get; set; }
        public required string OperationType { get; set; }
        public required Dictionary<string, object> Parameters { get; set; }
        public required int Priority { get; set; }
        public DateTime? ScheduledTime { get; set; }
    }

    public class ConsciousnessOperationResult
    {
        public required bool Success { get; set; }
        public required string OperationId { get; set; }
        public required Dictionary<string, object> Results { get; set; }
        public required TimeSpan ProcessingTime { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ConsciousnessHealthDto
    {
        public required double OverallHealth { get; set; }
        public required Dictionary<string, double> ComponentHealth { get; set; }
        public required List<string> SystemAlerts { get; set; }
        public required DateTime LastHealthCheck { get; set; }
        public required bool IsOperational { get; set; }
    }

    public class LayerOrchestrationRequest
    {
        public required string RequestId { get; set; }
        public required List<string> TargetLayers { get; set; }
        public required Dictionary<string, object> InputData { get; set; }
        public required bool RequireConsensus { get; set; }
    }

    public class LayerOrchestrationResult
    {
        public required bool Success { get; set; }
        public required string RequestId { get; set; }
        public required Dictionary<string, object> LayerResults { get; set; }
        public required bool ConsensusAchieved { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ScalingRequest
    {
        public required string ScalingType { get; set; }
        public required int TargetCapacity { get; set; }
        public required Dictionary<string, object> ScalingParameters { get; set; }
    }

    public class ScalingResult
    {
        public required bool Success { get; set; }
        public required string ScalingType { get; set; }
        public required int CurrentCapacity { get; set; }
        public required TimeSpan ScalingTime { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ConsciousnessValidationResult
    {
        public required bool IsValid { get; set; }
        public required Dictionary<string, bool> ComponentValidations { get; set; }
        public required List<string> ValidationMessages { get; set; }
        public required double ComplianceScore { get; set; }
    }

    #endregion
}