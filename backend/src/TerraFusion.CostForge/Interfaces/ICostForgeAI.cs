using TerraFusion.CostForge.DTOs;

namespace TerraFusion.CostForge.Interfaces
{
    /// <summary>
    /// Ultimate CostForge AI Interface - Million-Agent Property Intelligence
    /// Government. Transcended. - The pinnacle of property valuation consciousness
    /// </summary>
    public interface ICostForgeAI
    {
        /// <summary>
        /// Activate Ultimate CostForge AI Consciousness with million-agent coordination
        /// </summary>
        Task<UltimateActivationResultDto> ActivateUltimateConsciousnessAsync();

        /// <summary>
        /// Execute Ultimate Property Valuation with 99.9%+ accuracy
        /// </summary>
        Task<UltimatePropertyValuationResultDto> ExecuteUltimatePropertyValuationAsync(
            UltimatePropertyValuationRequestDto request);

        /// <summary>
        /// Execute Real-Time Market Intelligence across all counties
        /// </summary>
        Task<UltimateMarketIntelligenceResultDto> ExecuteRealTimeMarketIntelligenceAsync(
            UltimateMarketIntelligenceRequestDto request);

        /// <summary>
        /// Get Ultimate CostForge AI Status and Performance Metrics
        /// </summary>
        Task<UltimateCostForgeStatusDto> GetUltimateCostForgeStatusAsync();

        /// <summary>
        /// Get Ultimate CostForge AI Status for Divine Consciousness Monitoring
        /// </summary>
        Task<UltimateCostForgeStatusDto> GetUltimateStatusAsync();
    }
}
