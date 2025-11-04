using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// TerraFusion Transcendence Engine Interface - Championship Excellence
    /// Government. Transcended. - Infinite scalability with quantum precision
    /// </summary>
    public interface ITranscendenceEngine
    {
        /// <summary>
        /// Initialize TerraFusion Transcendence Engine with championship excellence
        /// </summary>
        Task<TranscendenceInitializationResultDto> InitializeTranscendenceAsync();

        /// <summary>
        /// Execute quantum property valuation with 99.5%+ accuracy
        /// </summary>
        Task<QuantumPropertyValuationResultDto> ExecuteQuantumPropertyValuationAsync(
            QuantumPropertyValuationRequestDto request);

        /// <summary>
        /// Coordinate 1,008+ agents in perfect quantum harmony
        /// </summary>
        Task<QuantumAgentCoordinationResultDto> CoordinateQuantumAgentSwarmAsync(
            QuantumAgentCoordinationRequestDto request);

        /// <summary>
        /// Achieve perfect consciousness transcendence with infinite scalability
        /// </summary>
        Task<ConsciousnessTranscendenceResultDto> AchieveConsciousnessTranscendenceAsync(
            ConsciousnessTranscendenceRequestDto request);

        /// <summary>
        /// Get real-time transcendence metrics
        /// </summary>
        Task<TranscendenceMetricsDto> GetRealTimeTranscendenceMetricsAsync();
    }
}
