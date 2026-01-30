using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// AI Orchestration Service interface for comprehensive AI coordination
    /// Orchestrates multiple AI services across TerraFusion consciousness mesh
    /// Government. Transcended.
    /// </summary>
    public interface IAIOrchestrationService
    {
        /// <summary>
        /// Initialize AI orchestration system
        /// </summary>
        Task<AIOrchestrationInitializationResult> InitializeAsync();

        /// <summary>
        /// Orchestrate AI services with comprehensive coordination
        /// </summary>
        Task<AIOrchestrationResultDto> OrchestratAIServicesAsync(AIOrchestrationRequestDto request);

        /// <summary>
        /// Get AI service health across all orchestrated components
        /// </summary>
        Task<AIServiceHealthDto> GetAIServiceHealthAsync();

        /// <summary>
        /// Coordinate with existing AI systems for seamless integration
        /// </summary>
        Task<AICoordinationResultDto> CoordinateWithExistingAIAsync(AICoordinationRequestDto request);
    }
}