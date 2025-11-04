// TERRAFUSION OS - RESEARCH ANALYTICS RESPONSE MODELS
// Elite PhD-Level Research Environment Data Transfer Objects
// Cross-Workspace Integration & Predictive Analytics Models
// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.

namespace TerraFusion.API.Models;

public enum ConsciousnessLevel
{
    Basic,
    Advanced,
    Elite,
    Quantum
}

public class CrossWorkspaceSyncResult
{
    public string SyncId { get; set; } = string.Empty;
    public DateTime InitializedAt { get; set; }
    public bool TerraSyncConnected { get; set; }
    public bool PropertyWorkbenchConnected { get; set; }
    public decimal SyncLatency { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class QuantumConsciousnessConfig
{
    public int AgentCount { get; set; }
    public ConsciousnessLevel ConsciousnessLevel { get; set; }
    public bool ResearchMode { get; set; }
    public bool CrossWorkspaceEnabled { get; set; }
}

public class ResearchAnalyticsConfig
{
    public string ResearcherProfile { get; set; } = string.Empty;
    public string AnalyticsDepth { get; set; } = string.Empty;
    public bool RealTimeSync { get; set; }
    public int PredictionHorizon { get; set; }
}

public class ResearchInitializationResponse
{
    public string EnvironmentId { get; set; } = string.Empty;
    public string ConsciousnessLevel { get; set; } = string.Empty;
    public int AgentCount { get; set; }
    public List<string> AnalyticsCapabilities { get; set; } = new();
    public CrossWorkspaceSyncResult? CrossWorkspaceSync { get; set; }
    public TimeSpan InitializationTime { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ResearchAnalyticsResponse
{
    public PropertyAnalyticsData PropertyAnalytics { get; set; } = new();
    public SystemPerformanceData SystemPerformance { get; set; } = new();
    public ConsciousnessMetricsData ConsciousnessMetrics { get; set; } = new();
    public ResearchInsightsData ResearchInsights { get; set; } = new();
}

public class PropertyAnalyticsData
{
    public int TotalProperties { get; set; }
    public decimal AssessmentAccuracy { get; set; }
    public decimal IAAOCompliance { get; set; }
    public decimal QuantumEnhancement { get; set; }
    public Dictionary<string, decimal> MLModelPerformance { get; set; } = new();
}

public class SystemPerformanceData
{
    public decimal ResponseTime { get; set; }
    public int Throughput { get; set; }
    public decimal Uptime { get; set; }
    public decimal ErrorRate { get; set; }
    public decimal QuantumOptimization { get; set; }
}

public class ConsciousnessMetricsData
{
    public decimal AgentCoordination { get; set; }
    public decimal SwarmIntelligence { get; set; }
    public decimal QuantumCoherence { get; set; }
    public decimal AdaptiveLearning { get; set; }
}

public class ResearchInsightsData
{
    public decimal StatisticalSignificance { get; set; }
    public decimal ExperimentalVariance { get; set; }
    public Dictionary<string, bool> HypothesisValidation { get; set; } = new();
    public decimal PublicationReadiness { get; set; }
}

public class AnalyticsModelResponse
{
    public string ModelId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Accuracy { get; set; }
    public DateTime TrainingDate { get; set; }
    public List<PredictionResponse> Predictions { get; set; } = new();
    public List<decimal> QuantumFactors { get; set; } = new();
    public ResearchMetricsResponse ResearchMetrics { get; set; } = new();
}

public class PredictionResponse
{
    public DateTime Timestamp { get; set; }
    public decimal Value { get; set; }
    public decimal Confidence { get; set; }
    public List<string> Factors { get; set; } = new();
    public decimal QuantumEnhancement { get; set; }
    public decimal? CrossWorkspaceCorrelation { get; set; }
}

public class ResearchMetricsResponse
{
    public decimal StatisticalSignificance { get; set; }
    public decimal[] ConfidenceInterval { get; set; } = new decimal[2];
    public decimal CrossValidationScore { get; set; }
    public Dictionary<string, decimal> FeatureImportance { get; set; } = new();
}

public class CrossWorkspaceDataResponse
{
    public TerraSyncMetricsResponse TerraSyncMetrics { get; set; } = new();
    public PropertyWorkbenchMetricsResponse PropertyWorkbenchMetrics { get; set; } = new();
    public UnifiedMetricsResponse UnifiedMetrics { get; set; } = new();
}

public class TerraSyncMetricsResponse
{
    public bool CountyDataSync { get; set; }
    public int AgentCount { get; set; }
    public string ConsciousnessLevel { get; set; } = string.Empty;
    public decimal SyncLatency { get; set; }
    public decimal DataIntegrity { get; set; }
}

public class PropertyWorkbenchMetricsResponse
{
    public bool AssessmentEngine { get; set; }
    public int AgentCount { get; set; }
    public decimal IAAOCompliance { get; set; }
    public decimal AssessmentAccuracy { get; set; }
    public DateTime LastSync { get; set; }
}

public class UnifiedMetricsResponse
{
    public int TotalAgents { get; set; }
    public decimal CrossWorkspaceLatency { get; set; }
    public decimal DataConsistency { get; set; }
    public decimal QuantumCoherence { get; set; }
}

public class SyncStatusResponse
{
    public bool IsConnected { get; set; }
    public DateTime LastSync { get; set; }
    public string SyncHealth { get; set; } = string.Empty;
    public int OperationsPerMinute { get; set; }
    public decimal DataIntegrity { get; set; }
    public decimal QuantumCoherence { get; set; }
}

public class ModelTrainingResponse
{
    public string ModelId { get; set; } = string.Empty;
    public TimeSpan TrainingDuration { get; set; }
    public decimal FinalAccuracy { get; set; }
    public decimal QuantumEnhancement { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CrossWorkspaceSyncResponse
{
    public TimeSpan SyncDuration { get; set; }
    public long DataTransferred { get; set; }
    public decimal IntegrityValidation { get; set; }
    public string Status { get; set; } = string.Empty;
}

