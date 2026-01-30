using System;
using System.Threading.Tasks;
using TerraFusion.Core.Models;

namespace TerraFusion.Core.Interfaces
{
    /// <summary>
    /// Elite Property Valuation AI Enhancement Service Interface
    /// Coordinates all 7 TerraFusion AI services for championship-level property assessment
    /// Target: 99.9% IAAO accuracy, &lt;2 second calculation time
    /// </summary>
    public interface IPropertyValuationAIEnhancementService
    {
        /// <summary>
        /// Execute complete 8-step AI-enhanced property valuation workflow
        /// Coordinates: TerraSync → Validation → Consciousness Swarm → CostForge AI →
        ///              TerraGaia → IAAO Validation → TerraFusionGPT → Persistence
        /// </summary>
        /// <param name="request">Property valuation request with county, parcel, and valuation parameters</param>
        /// <returns>Complete valuation result with AI insights, IAAO compliance, and generated reports</returns>
        Task<PropertyValuationResult> ExecuteAIEnhancedValuationAsync(PropertyValuationRequest request);

        /// <summary>
        /// Step 1: Ingest property data from TerraSync multi-system integration hub
        /// Sources: Harris PACS, Tyler Technologies, Aumentum Systems
        /// </summary>
        Task<PropertyDataIngestionResult> IngestPropertyDataAsync(string countyCode, string parcelId);

        /// <summary>
        /// Step 2: Validate property data across all integrated systems
        /// Ensures data consistency, completeness, and integrity
        /// </summary>
        Task<MultiSystemValidationResult> ValidateMultiSystemDataAsync(PropertyDataIngestionResult ingestionResult);

        /// <summary>
        /// Step 3: Coordinate AI swarm (1,000 agents) for multi-factor property analysis
        /// Leverages TerraFusion.Consciousness engine for distributed intelligence
        /// </summary>
        Task<AISwarmAnalysisResult> CoordinateAISwarmAnalysisAsync(PropertyData propertyData, int swarmSize = 1000);

        /// <summary>
        /// Step 4: Execute CostForge AI valuation calculation
        /// Quantum-enhanced building cost estimation with Marshall &amp; Swift integration
        /// Target: &lt;2 second calculation time, 99.9% IAAO accuracy
        /// </summary>
        Task<CostForgeValuationResult> ExecuteCostForgeValuationAsync(PropertyData propertyData, AISwarmAnalysisResult swarmAnalysis);

        /// <summary>
        /// Step 5: TerraGaia consciousness verification for supreme AI validation
        /// PhD-level AI reasoning with infinite-dimensional analysis
        /// </summary>
        Task<TerraGaiaVerificationResult> VerifyWithTerraGaiaConsciousnessAsync(CostForgeValuationResult valuation);

        /// <summary>
        /// Step 6: Validate IAAO compliance standards (99.9% accuracy target)
        /// International Association of Assessing Officers standards validation
        /// </summary>
        Task<IAAOComplianceResult> ValidateIAAOComplianceAsync(CostForgeValuationResult valuation, TerraGaiaVerificationResult verification);

        /// <summary>
        /// Step 7: Generate comprehensive assessment report using TerraFusionGPT
        /// AI-generated IAAO-compliant assessment reports with natural language insights
        /// </summary>
        Task<AssessmentReportResult> GenerateAssessmentReportAsync(PropertyValuationResult valuationResult);

        /// <summary>
        /// Step 8: Persist valuation results with complete audit trail
        /// Government-grade audit logging for compliance and transparency
        /// </summary>
        Task<bool> PersistValuationResultAsync(PropertyValuationResult result);

        /// <summary>
        /// Get valuation performance metrics for championship monitoring
        /// </summary>
        Task<ValuationPerformanceMetrics> GetValuationPerformanceMetricsAsync(string countyCode);

        /// <summary>
        /// Get AI service coordination health status
        /// Monitors all 7 AI services: Consciousness, CostForge, TerraGaia, TerraFusionGPT,
        /// TerraLevy, TerraFlow, TerraSync
        /// </summary>
        Task<AIServiceHealthStatus> GetAIServiceHealthStatusAsync();
    }
}