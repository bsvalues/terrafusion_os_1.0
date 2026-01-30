using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// AI Layer Mesh Orchestrator interface for L1-L5 layer management
    /// Coordinates AI mesh operations with validation rings
    /// Government. Transcended.
    /// </summary>
    public interface IAILayerMeshOrchestrator
    {
        /// <summary>
        /// Initialize the AI layer mesh system
        /// </summary>
        Task<MeshInitializationResultDto> InitializeMeshAsync();

        /// <summary>
        /// Initialize the AI layer mesh system (standard initialization)
        /// </summary>
        Task InitializeAsync();

        /// <summary>
        /// Execute complex mesh operations across all layers
        /// </summary>
        Task<MeshOperationResultDto> ExecuteMeshOperationAsync(MeshOperationRequestDto request);

        /// <summary>
        /// Get validation ring status and consensus metrics
        /// </summary>
        Task<ValidationRingStatusDto> GetValidationRingStatusAsync();

        /// <summary>
        /// Get health status for specific layer
        /// </summary>
        Task<LayerHealthDto> GetLayerHealthAsync(string layerId);

        /// <summary>
        /// Get comprehensive mesh performance metrics
        /// </summary>
        Task<MeshPerformanceDto> GetMeshPerformanceAsync();

        /// <summary>
        /// Update mesh configuration dynamically
        /// </summary>
        Task<MeshConfigurationDto> UpdateMeshConfigurationAsync(MeshConfigurationUpdateDto request);

        /// <summary>
        /// Scale mesh capacity based on demand
        /// </summary>
        Task<MeshScalingResultDto> ScaleMeshAsync(MeshScalingRequestDto request);

        /// <summary>
        /// Get mesh health index for monitoring
        /// </summary>
        Task<double> GetMeshHealthIndexAsync();
    }
}
