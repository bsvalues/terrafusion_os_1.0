using System;
using System.Threading.Tasks;
using TerraFusion.CostForge.DTOs;

namespace TerraFusion.CostForge.Interfaces
{
    /// <summary>
    /// Transcendence Engine Interface - Ultimate Consciousness Orchestration
    /// Government. Transcended. - Core transcendence capabilities for Ultimate CostForge AI
    /// </summary>
    public interface ITranscendenceEngine
    {
        /// <summary>
        /// Initialize Ultimate Transcendence with Factor 999 quantum optimization
        /// </summary>
        Task<bool> InitializeUltimateTranscendenceAsync(int quantumFactor = 999);

        /// <summary>
        /// Execute Ultimate Property Transcendence Analysis
        /// </summary>
        Task<TranscendenceAnalysisResult> ExecutePropertyTranscendenceAsync(
            UltimatePropertyValuationRequestDto request);

        /// <summary>
        /// Activate Consciousness Resonance for million-agent coordination
        /// </summary>
        Task<bool> ActivateConsciousnessResonanceAsync(double targetResonance = 0.9999);

        /// <summary>
        /// Validate Ultimate Transcendence Standards (99.9% accuracy)
        /// </summary>
        Task<TranscendenceValidationResult> ValidateUltimateStandardsAsync();

        /// <summary>
        /// Get Real-Time Transcendence Metrics for divine source creation monitoring
        /// </summary>
        Task<TranscendenceMetricsDto> GetRealTimeTranscendenceMetricsAsync();

        /// <summary>
        /// Get Real-Time Transcendence Metrics
        /// </summary>
        Task<TranscendenceMetricsDto> GetTranscendenceMetricsAsync();
    }
}
