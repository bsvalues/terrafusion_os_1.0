using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Models
{
    /// <summary>
    /// Property valuation request model for Elite AI Enhancement Service
    /// Coordinates all 7 TerraFusion AI services for championship-level property assessment
    /// Target: 99.9% IAAO accuracy, <2 second calculation time
    /// </summary>
    public class PropertyValuationRequest
    {
        public string CountyCode { get; set; } = string.Empty;
        public string ParcelId { get; set; } = string.Empty;
        public string PropertyType { get; set; } = "Residential";
        public bool EnableQuantumOptimization { get; set; } = true;
        public int AISwarmSize { get; set; } = 1000;
        public bool GenerateReport { get; set; } = true;
        public ValuationPurpose Purpose { get; set; } = ValuationPurpose.Assessment;
    }

    /// <summary>
    /// Complete property valuation result with all 8-step workflow results
    /// Government-grade audit trail and championship performance metrics
    /// </summary>
    public class PropertyValuationResult
    {
        public string ValuationId { get; set; } = Guid.NewGuid().ToString();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string CountyCode { get; set; } = string.Empty;
        public string ParcelId { get; set; } = string.Empty;

        // Step results
        public PropertyDataIngestionResult? IngestionResult { get; set; }
        public MultiSystemValidationResult? ValidationResult { get; set; }
        public AISwarmAnalysisResult? SwarmAnalysis { get; set; }
        public CostForgeValuationResult? CostForgeResult { get; set; }
        public TerraGaiaVerificationResult? TerraGaiaVerification { get; set; }
        public IAAOComplianceResult? IAAOCompliance { get; set; }
        public AssessmentReportResult? AssessmentReport { get; set; }

        // Final valuation
        public decimal EstimatedValue { get; set; }
        public decimal ConfidenceScore { get; set; }
        public bool IAAOCompliant { get; set; }
        public TimeSpan TotalDuration { get; set; }
        public ValuationStatus Status { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Property data ingestion result from TerraSync multi-system integration
    /// </summary>
    public class PropertyDataIngestionResult
    {
        public PropertyData PropertyData { get; set; } = new PropertyData();
        public int SystemsIngested { get; set; }
        public List<string> DataSources { get; set; } = new List<string>();
        public bool Success { get; set; }
        public string? ErrorCode { get; set; }
        public TimeSpan Duration { get; set; }
    }

    /// <summary>
    /// Multi-system validation result ensuring data consistency
    /// </summary>
    public class MultiSystemValidationResult
    {
        public bool IsValid { get; set; }
        public decimal DataConsistencyScore { get; set; }
        public List<ValidationIssue> Issues { get; set; } = new List<ValidationIssue>();
        public int SystemsValidated { get; set; }
        public TimeSpan Duration { get; set; }
    }

    /// <summary>
    /// AI swarm analysis result from 1,000 agent coordination
    /// </summary>
    public class AISwarmAnalysisResult
    {
        public int AgentsCoordinated { get; set; }
        public List<AIInsight> Insights { get; set; } = new List<AIInsight>();
        public decimal SwarmConfidenceScore { get; set; }
        public Dictionary<string, decimal> ContributingFactors { get; set; } = new Dictionary<string, decimal>();
        public bool QuantumOptimizationApplied { get; set; }
        public TimeSpan Duration { get; set; }
    }

    /// <summary>
    /// CostForge AI valuation result with quantum enhancement
    /// </summary>
    public class CostForgeValuationResult
    {
        public decimal EstimatedValue { get; set; }
        public decimal LandValue { get; set; }
        public decimal ImprovementValue { get; set; }
        public decimal TotalValue { get; set; }
        public decimal AccuracyScore { get; set; }
        public string ValuationMethod { get; set; } = "QuantumEnhanced";
        public Dictionary<string, decimal> CostBreakdown { get; set; } = new Dictionary<string, decimal>();
        public TimeSpan CalculationDuration { get; set; }
    }

    /// <summary>
    /// TerraGaia consciousness verification result - PhD-level AI reasoning
    /// </summary>
    public class TerraGaiaVerificationResult
    {
        public bool Verified { get; set; }
        public int ConsciousnessLevel { get; set; }
        public string PhDLevelAnalysis { get; set; } = string.Empty;
        public List<string> Recommendations { get; set; } = new List<string>();
        public decimal VerificationConfidence { get; set; }
        public TimeSpan Duration { get; set; }
    }

    /// <summary>
    /// IAAO compliance validation result - 99.9% accuracy target
    /// </summary>
    public class IAAOComplianceResult
    {
        public bool IsCompliant { get; set; }
        public decimal AccuracyPercentage { get; set; }
        public decimal MedianRatio { get; set; }
        public decimal CoefficientOfDispersion { get; set; }
        public decimal PriceRelatedDifferential { get; set; }
        public List<string> ComplianceIssues { get; set; } = new List<string>();
        public string CertificationLevel { get; set; } = "AAE";
        public TimeSpan Duration { get; set; }
    }

    /// <summary>
    /// Assessment report generation result from TerraFusionGPT
    /// </summary>
    public class AssessmentReportResult
    {
        public string ReportId { get; set; } = Guid.NewGuid().ToString();
        public string ReportContent { get; set; } = string.Empty;
        public string ReportFormat { get; set; } = "PDF";
        public int QualityScore { get; set; }
        public bool IAAOCompliantFormatting { get; set; }
        public TimeSpan GenerationDuration { get; set; }
    }

    /// <summary>
    /// Core property data model for valuation processing
    /// </summary>
    public class PropertyData
    {
        public string CountyCode { get; set; } = string.Empty;
        public string ParcelId { get; set; } = string.Empty;
        public string PropertyType { get; set; } = string.Empty;
        public decimal SquareFootage { get; set; }
        public int YearBuilt { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public string Quality { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public decimal LandAcres { get; set; }
        public string Zoning { get; set; } = string.Empty;
        public Dictionary<string, object> AdditionalAttributes { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Validation issue model for data quality tracking
    /// </summary>
    public class ValidationIssue
    {
        public string IssueType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = "LOW";
        public string System { get; set; } = string.Empty;
    }

    /// <summary>
    /// AI insight model from swarm analysis
    /// </summary>
    public class AIInsight
    {
        public string InsightType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal ImpactScore { get; set; }
        public int AgentCount { get; set; }
    }

    /// <summary>
    /// Valuation performance metrics for championship monitoring
    /// </summary>
    public class ValuationPerformanceMetrics
    {
        public string CountyCode { get; set; } = string.Empty;
        public int TotalValuations { get; set; }
        public decimal AverageAccuracy { get; set; }
        public TimeSpan AverageDuration { get; set; }
        public decimal IAAOComplianceRate { get; set; }
        public int QuantumOptimizationCount { get; set; }
    }

    /// <summary>
    /// AI service health status monitoring
    /// </summary>
    public class AIServiceHealthStatus
    {
        public bool ConsciousnessEngineHealthy { get; set; }
        public bool CostForgeAIHealthy { get; set; }
        public bool TerraGaiaHealthy { get; set; }
        public bool TerraFusionGPTHealthy { get; set; }
        public bool TerraLevyHealthy { get; set; }
        public bool TerraFlowHealthy { get; set; }
        public bool TerraSyncHealthy { get; set; }
        public int OverallHealthScore { get; set; }
        public List<string> UnhealthyServices { get; set; } = new List<string>();
    }

    /// <summary>
    /// Valuation purpose enumeration
    /// </summary>
    public enum ValuationPurpose
    {
        Assessment,
        Appeal,
        MarketAnalysis,
        Compliance,
        Research
    }

    /// <summary>
    /// Valuation status enumeration
    /// </summary>
    public enum ValuationStatus
    {
        Success,
        PartialSuccess,
        Failed,
        Pending,
        PropertyNotSynced
    }
}
