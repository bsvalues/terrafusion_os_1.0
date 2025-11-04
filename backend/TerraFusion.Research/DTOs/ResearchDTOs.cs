using System;
using System.Collections.Generic;

namespace TerraFusion.Research.DTOs;

/// <summary>
/// Researcher credentials for PhD-level access validation
/// </summary>
public class ResearcherCredentials
{
    public string ResearcherId { get; set; } = string.Empty;
    public string ResearcherName { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public ResearchInstitutionType InstitutionType { get; set; }
    public List<string> Certifications { get; set; } = new();
    public DateTime CredentialIssuedDate { get; set; }
    public DateTime CredentialExpiryDate { get; set; }
}

/// <summary>
/// Research institution classification
/// </summary>
public enum ResearchInstitutionType
{
    HarvardMIT,
    IvyLeague,
    TopTier,
    ResearchUniversity,
    GovernmentLab,
    PrivateIndustry
}

/// <summary>
/// Analysis scope for immersive analytics sessions
/// </summary>
public class AnalysisScope
{
    public string CountyId { get; set; } = string.Empty;
    public List<string> CountyIds { get; set; } = new();
    public PropertyFilter Filters { get; set; } = new();
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public AnalysisFocus Focus { get; set; }
    public int MaxProperties { get; set; } = 100000;
}

/// <summary>
/// Property filtering criteria
/// </summary>
public class PropertyFilter
{
    public List<string> PropertyTypes { get; set; } = new();
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public int? MinSquareFeet { get; set; }
    public int? MaxSquareFeet { get; set; }
    public List<string> QualityLevels { get; set; } = new();
    public List<string> Neighborhoods { get; set; } = new();
}

/// <summary>
/// Analysis focus areas
/// </summary>
public enum AnalysisFocus
{
    PropertyValuation,
    MarketTrends,
    AssessmentAccuracy,
    AIPerformance,
    ConsciousnessOptimization,
    CrossCountyComparison,
    PredictiveModeling
}

/// <summary>
/// Immersive analytics session
/// </summary>
public class ImmersiveAnalyticsSession
{
    public string SessionId { get; set; } = string.Empty;
    public string ResearcherId { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public AccessLevel AccessLevel { get; set; }
    public DateTime InitializedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }

    // Quantum environment configuration
    public QuantumEnvironmentConfig? QuantumEnvironment { get; set; }
    public ConsciousnessAccessConfig? ConsciousnessAccess { get; set; }
    public SwarmCoordinationInterface? SwarmCoordinationInterface { get; set; }

    // Research tools
    public InfinitePrecisionTools? InfinitePrecisionTools { get; set; }
    public StatisticalValidationSuite? StatisticalValidationSuite { get; set; }
    public QuantumVisualizationEngine? QuantumVisualizationEngine { get; set; }
}

/// <summary>
/// Access level for research operations
/// </summary>
public enum AccessLevel
{
    ReadOnly,
    Standard,
    Advanced,
    Elite,
    PhDLevel,
    Unrestricted
}

/// <summary>
/// Quantum environment configuration
/// </summary>
public class QuantumEnvironmentConfig
{
    public int QuantumCoherenceLevel { get; set; }
    public double EntanglementStrength { get; set; }
    public int OptimizationFactor { get; set; }
    public bool QuantumAccelerationEnabled { get; set; }
    public int MaxDimensions { get; set; }
}

/// <summary>
/// Consciousness access configuration
/// </summary>
public class ConsciousnessAccessConfig
{
    public bool RealTimeMonitoring { get; set; }
    public bool ParameterTuningEnabled { get; set; }
    public bool SwarmCoordinationControl { get; set; }
    public int MaxAgentsControlled { get; set; }
    public List<string> AllowedOperations { get; set; } = new();
}

/// <summary>
/// Swarm coordination interface configuration
/// </summary>
public class SwarmCoordinationInterface
{
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public double CoordinationEfficiency { get; set; }
    public bool RealTimeVisualization { get; set; }
    public List<string> AvailableCommands { get; set; } = new();
}

/// <summary>
/// Infinite-precision tools configuration
/// </summary>
public class InfinitePrecisionTools
{
    public int DecimalPrecision { get; set; }
    public bool ArbitraryPrecisionEnabled { get; set; }
    public List<string> AvailableCalculators { get; set; } = new();
}

/// <summary>
/// Statistical validation suite configuration
/// </summary>
public class StatisticalValidationSuite
{
    public bool IAAOComplianceEnabled { get; set; }
    public bool HypothesisTestingEnabled { get; set; }
    public bool CorrelationAnalysisEnabled { get; set; }
    public bool CausalityAnalysisEnabled { get; set; }
    public List<string> AvailableTests { get; set; } = new();
}

/// <summary>
/// Quantum visualization engine configuration
/// </summary>
public class QuantumVisualizationEngine
{
    public bool ThreeDimensionalEnabled { get; set; }
    public bool MultiDimensionalEnabled { get; set; }
    public int MaxDimensionsRendered { get; set; }
    public bool RealTimeStreamingEnabled { get; set; }
    public List<string> AvailableVisualizations { get; set; } = new();
}

/// <summary>
/// Infinite-dimensional dataset
/// </summary>
public class InfiniteDimensionalDataset
{
    public string CountyId { get; set; } = string.Empty;
    public int PropertyCount { get; set; }
    public int DimensionalityLevel { get; set; }
    public List<FeatureVector> FeatureVectors { get; set; } = new();
    public double QuantumCoherence { get; set; }
    public double ConsciousnessLevel { get; set; }
    public double StatisticalSignificance { get; set; }
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Multi-dimensional feature vector
/// </summary>
public class FeatureVector
{
    public string PropertyId { get; set; } = string.Empty;
    public List<double> Values { get; set; } = new();
    public Dictionary<string, double> NamedFeatures { get; set; } = new();
    public double Magnitude { get; set; }
}

/// <summary>
/// Consciousness optimization result
/// </summary>
public class ConsciousnessOptimizationResult
{
    public ConsciousnessParameters CurrentParameters { get; set; } = new();
    public ConsciousnessParameters OptimizedParameters { get; set; } = new();
    public double PredictedAccuracyGain { get; set; }
    public PerformanceMetrics PredictedPerformanceImpact { get; set; } = new();
    public bool IAAOCompliant { get; set; }
    public List<string> RecommendedActions { get; set; } = new();
    public double ConfidenceScore { get; set; }
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Consciousness parameters
/// </summary>
public class ConsciousnessParameters
{
    public double QuantumCoherence { get; set; }
    public double EntanglementStrength { get; set; }
    public double ConsciousnessLevel { get; set; }
    public int OptimizationFactor { get; set; }
    public int ActiveAgents { get; set; }
    public double CoordinationEfficiency { get; set; }
    public Dictionary<string, object> CustomParameters { get; set; } = new();
}

/// <summary>
/// Performance metrics
/// </summary>
public class PerformanceMetrics
{
    public double ThroughputOps { get; set; }
    public double LatencyMs { get; set; }
    public double ResourceUtilization { get; set; }
    public double AccuracyScore { get; set; }
    public double UptimePercentage { get; set; }
    public DateTime MeasuredAt { get; set; }
}

/// <summary>
/// Predictive impact analysis result
/// </summary>
public class PredictiveImpactAnalysis
{
    public double AccuracyGain { get; set; }
    public PerformanceMetrics PerformanceImpact { get; set; } = new();
    public double CoordinationEfficiency { get; set; }
    public double ThroughputGain { get; set; }
    public double LatencyChange { get; set; }
    public List<string> PotentialIssues { get; set; } = new();
    public double ConfidenceLevel { get; set; }
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Quantum visualization 3D data
/// </summary>
public class QuantumVisualization3D
{
    public string VisualizationId { get; set; } = string.Empty;
    public VisualizationType Type { get; set; }
    public List<DataPoint3D> DataPoints { get; set; } = new();
    public List<ConnectionEdge> Connections { get; set; } = new();
    public VisualizationMetadata Metadata { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Visualization type
/// </summary>
public enum VisualizationType
{
    PropertyClusters,
    ConsciousnessFlow,
    AISwarmCoordination,
    MultiDimensionalProjection,
    CorrelationNetwork,
    PredictiveForecasting
}

/// <summary>
/// 3D data point
/// </summary>
public class DataPoint3D
{
    public string Id { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }
    public string Color { get; set; } = "#00FFFF";
    public double Size { get; set; } = 1.0;
    public string Label { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Connection edge between data points
/// </summary>
public class ConnectionEdge
{
    public string SourceId { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
    public double Strength { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Color { get; set; } = "#00FFFF";
}

/// <summary>
/// Visualization metadata
/// </summary>
public class VisualizationMetadata
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, string> Axes { get; set; } = new();
    public Dictionary<string, object> Statistics { get; set; } = new();
    public List<string> Filters { get; set; } = new();
}

/// <summary>
/// PhD-level statistical analysis result
/// </summary>
public class PhDLevelStatistics
{
    public double Mean { get; set; }
    public double Median { get; set; }
    public double StandardDeviation { get; set; }
    public double Variance { get; set; }
    public double Skewness { get; set; }
    public double Kurtosis { get; set; }
    public double ConfidenceInterval95Lower { get; set; }
    public double ConfidenceInterval95Upper { get; set; }
    public double PValue { get; set; }
    public double TStatistic { get; set; }
    public double FStatistic { get; set; }
    public double ChiSquare { get; set; }
    public Dictionary<string, double> CustomMetrics { get; set; } = new();
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// IAAO compliance analysis result
/// </summary>
public class IAAOComplianceAnalysis
{
    public bool IsCompliant { get; set; }
    public double AssessmentLevel { get; set; }
    public double CoefficientOfDispersion { get; set; }
    public double PriceRelatedDifferential { get; set; }
    public double AccuracyScore { get; set; }
    public List<string> ComplianceIssues { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public CertificationLevel CertificationLevel { get; set; }
    public DateTime AnalyzedAt { get; set; }
}

/// <summary>
/// IAAO certification level
/// </summary>
public enum CertificationLevel
{
    None,
    Basic,
    Standard,
    Advanced,
    Elite,
    Championship
}
