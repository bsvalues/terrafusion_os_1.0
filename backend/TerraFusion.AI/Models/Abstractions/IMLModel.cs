namespace TerraFusion.AI.Models.Abstractions;

/// <summary>
/// Base interface for all TerraFusion AI models
/// Provides standardized contract for ML.NET and TensorFlow model implementations
/// </summary>
/// <typeparam name="TInput">Input data type for the model</typeparam>
/// <typeparam name="TOutput">Output prediction type from the model</typeparam>
public interface IMLModel<TInput, TOutput>
{
    /// <summary>
    /// Train the machine learning model with government-grade accuracy requirements
    /// </summary>
    /// <param name="trainingDataPath">Path to training data file</param>
    /// <returns>True if training succeeded with required accuracy, false otherwise</returns>
    Task<bool> TrainModelAsync(string trainingDataPath);

    /// <summary>
    /// Generate prediction from trained model
    /// </summary>
    /// <param name="input">Input data for prediction</param>
    /// <returns>Model prediction with confidence metrics</returns>
    Task<TOutput> PredictAsync(TInput input);

    /// <summary>
    /// Save trained model to disk for production deployment
    /// </summary>
    /// <param name="modelPath">Path where model should be saved</param>
    Task SaveModelAsync(string modelPath);

    /// <summary>
    /// Load pre-trained model from disk
    /// </summary>
    /// <param name="modelPath">Path to saved model file</param>
    /// <returns>True if model loaded successfully, false otherwise</returns>
    Task<bool> LoadModelAsync(string modelPath);
}

/// <summary>
/// Government-specific model requirements and compliance interface
/// </summary>
public interface IGovernmentMLModel
{
    /// <summary>
    /// Validate model meets government accuracy standards (typically >95%)
    /// </summary>
    /// <returns>True if model meets government standards</returns>
    Task<bool> ValidateGovernmentStandardsAsync();

    /// <summary>
    /// Generate audit report for government compliance
    /// </summary>
    /// <returns>Comprehensive audit report</returns>
    Task<GovernmentAuditReport> GenerateAuditReportAsync();

    /// <summary>
    /// Check for bias in model predictions
    /// </summary>
    /// <returns>Bias assessment report</returns>
    Task<BiasAssessmentReport> AssessBiasAsync();

    /// <summary>
    /// Verify FISMA/FedRAMP compliance
    /// </summary>
    /// <returns>Compliance status</returns>
    Task<ComplianceStatus> VerifyComplianceAsync();
}

/// <summary>
/// Real-time model performance monitoring interface
/// </summary>
public interface IModelPerformanceMonitor
{
    /// <summary>
    /// Get current model performance metrics
    /// </summary>
    /// <returns>Real-time performance metrics</returns>
    Task<ModelPerformanceMetrics> GetPerformanceMetricsAsync();

    /// <summary>
    /// Monitor model drift over time
    /// </summary>
    /// <returns>Model drift analysis</returns>
    Task<ModelDriftAnalysis> AnalyzeModelDriftAsync();

    /// <summary>
    /// Check if model requires retraining
    /// </summary>
    /// <returns>True if retraining is recommended</returns>
    Task<bool> RequiresRetrainingAsync();
}

/// <summary>
/// Government audit report for ML model compliance
/// </summary>
public class GovernmentAuditReport
{
    public string ModelName { get; set; } = string.Empty;
    public string ModelVersion { get; set; } = string.Empty;
    public DateTime AuditDate { get; set; } = DateTime.UtcNow;
    public float AccuracyRate { get; set; }
    public bool MeetsGovernmentStandards { get; set; }
    public string[] ComplianceFrameworks { get; set; } = Array.Empty<string>();
    public string[] AuditFindings { get; set; } = Array.Empty<string>();
    public string[] Recommendations { get; set; } = Array.Empty<string>();
    public string AuditTrail { get; set; } = string.Empty;
    public bool RequiresManagerialReview { get; set; }
    public DateTime NextAuditDue { get; set; }
}

/// <summary>
/// Bias assessment report for fair AI governance
/// </summary>
public class BiasAssessmentReport
{
    public string ModelName { get; set; } = string.Empty;
    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
    public float OverallBiasScore { get; set; } // 0-1 scale, lower is better
    public BiasType[] DetectedBiases { get; set; } = Array.Empty<BiasType>();
    public string[] BiasDescriptions { get; set; } = Array.Empty<string>();
    public string[] MitigationStrategies { get; set; } = Array.Empty<string>();
    public bool RequiresImmediateAction { get; set; }
    public bool FairHousingCompliant { get; set; }
    public bool EqualOpportunityCompliant { get; set; }
    public string[] RecommendedActions { get; set; } = Array.Empty<string>();
}

public enum BiasType
{
    Age,
    Gender,
    Race,
    Income,
    Geographic,
    Language,
    Disability,
    Historical,
    Algorithmic,
    Selection
}

/// <summary>
/// Government compliance status for ML models
/// </summary>
public class ComplianceStatus
{
    public bool FISMACompliant { get; set; }
    public bool FedRAMPCompliant { get; set; }
    public bool SOC2Compliant { get; set; }
    public bool NIST80053Compliant { get; set; }
    public bool GDPRCompliant { get; set; }
    public bool AccessibilityCompliant { get; set; }
    public string[] ComplianceGaps { get; set; } = Array.Empty<string>();
    public string[] RequiredActions { get; set; } = Array.Empty<string>();
    public DateTime LastComplianceCheck { get; set; } = DateTime.UtcNow;
    public DateTime NextComplianceCheck { get; set; }
    public string ComplianceOfficer { get; set; } = string.Empty;
}

/// <summary>
/// Real-time model performance metrics
/// </summary>
public class ModelPerformanceMetrics
{
    public string ModelName { get; set; } = string.Empty;
    public DateTime MetricsTimestamp { get; set; } = DateTime.UtcNow;
    public float CurrentAccuracy { get; set; }
    public float PreviousAccuracy { get; set; }
    public float AccuracyTrend { get; set; } // Positive = improving, negative = declining
    public int PredictionsToday { get; set; }
    public int PredictionsThisWeek { get; set; }
    public float AverageResponseTime { get; set; } // Milliseconds
    public float ThroughputRate { get; set; } // Predictions per second
    public float ErrorRate { get; set; }
    public float ConfidenceScore { get; set; }
    public string PerformanceStatus { get; set; } = string.Empty; // Excellent, Good, Warning, Critical
    public string[] PerformanceAlerts { get; set; } = Array.Empty<string>();
}

/// <summary>
/// Model drift analysis for production monitoring
/// </summary>
public class ModelDriftAnalysis
{
    public string ModelName { get; set; } = string.Empty;
    public DateTime AnalysisDate { get; set; } = DateTime.UtcNow;
    public float DriftScore { get; set; } // 0-1 scale, higher indicates more drift
    public DriftType DriftType { get; set; }
    public string[] DriftIndicators { get; set; } = Array.Empty<string>();
    public bool RequiresRetraining { get; set; }
    public DateTime RecommendedRetrainingDate { get; set; }
    public string[] DataQualityIssues { get; set; } = Array.Empty<string>();
    public string[] MitigationActions { get; set; } = Array.Empty<string>();
    public float DriftTrend { get; set; } // Positive = increasing drift
}

public enum DriftType
{
    None,
    ConceptDrift,
    DataDrift,
    PerformanceDrift,
    PopulationDrift,
    SeasonalDrift
}

/// <summary>
/// Quantum-enhanced model insights interface
/// </summary>
public interface IQuantumEnhancedModel
{
    /// <summary>
    /// Apply quantum optimization to model predictions
    /// </summary>
    /// <param name="prediction">Base prediction to enhance</param>
    /// <returns>Quantum-optimized prediction</returns>
    Task<object> ApplyQuantumOptimizationAsync(object prediction);

    /// <summary>
    /// Generate quantum insights for complex decision making
    /// </summary>
    /// <returns>Quantum-derived insights</returns>
    Task<QuantumInsights> GenerateQuantumInsightsAsync();

    /// <summary>
    /// Calculate quantum uncertainty bounds
    /// </summary>
    /// <param name="prediction">Prediction to analyze</param>
    /// <returns>Uncertainty bounds using quantum principles</returns>
    Task<UncertaintyBounds> CalculateQuantumUncertaintyAsync(object prediction);
}

/// <summary>
/// Quantum uncertainty bounds for advanced analytics
/// </summary>
public class UncertaintyBounds
{
    public float LowerBound { get; set; }
    public float UpperBound { get; set; }
    public float ConfidenceLevel { get; set; }
    public string QuantumState { get; set; } = string.Empty;
    public float EntanglementStrength { get; set; }
    public string[] QuantumFactors { get; set; } = Array.Empty<string>();
}

/// <summary>
/// Advanced quantum insights for government decision making
/// </summary>
public class QuantumInsights
{
    public float QuantumAccuracyBoost { get; set; }
    public string[] QuantumOptimizations { get; set; } = Array.Empty<string>();
    public float ComplexityReduction { get; set; }
    public PatternType[] DiscoveredPatterns { get; set; } = Array.Empty<PatternType>();
    public float PredictivePower { get; set; }
    public string[] EmergentBehaviors { get; set; } = Array.Empty<string>();
    public float QuantumCoherence { get; set; }
    public string QuantumState { get; set; } = string.Empty;
}

public enum PatternType
{
    Linear,
    Cyclical,
    Seasonal,
    Trending,
    Chaotic,
    Emergent,
    Anomalous,
    Quantum
}