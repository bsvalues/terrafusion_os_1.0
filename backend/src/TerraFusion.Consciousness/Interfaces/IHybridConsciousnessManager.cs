using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Hybrid Consciousness Manager interface for advanced AI fusion
    /// Manages hybrid consciousness modes and session orchestration
    /// Government. Transcended.
    /// </summary>
    public interface IHybridConsciousnessManager
    {
        /// <summary>
        /// Initialize hybrid consciousness management system
        /// </summary>
        Task<HybridInitializationResult> InitializeAsync();

        /// <summary>
        /// Get current consciousness data and metrics
        /// </summary>
        Task<ConsciousnessDataDto> GetConsciousnessDataAsync();

        /// <summary>
        /// Get enhanced consciousness data with quantum processing
        /// </summary>
        Task<EnhancedConsciousnessDataDto> GetEnhancedConsciousnessDataAsync();

        /// <summary>
        /// Switch between different consciousness modes
        /// </summary>
        Task<ConsciousnessModeResultDto> SwitchConsciousnessModeAsync(ConsciousnessModeRequestDto request);

        /// <summary>
        /// Get comprehensive hybrid system status
        /// </summary>
        Task<HybridSystemStatusDto> GetHybridSystemStatusAsync();
    }
}