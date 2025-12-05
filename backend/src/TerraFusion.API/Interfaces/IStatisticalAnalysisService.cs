using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// Advanced statistical analysis service for government-grade research excellence.
/// Provides infinite-dimensional modeling and quantum-enhanced statistical validation.
/// </summary>
public interface IStatisticalAnalysisService
{
    /// <summary>
    /// Performs multi-dimensional statistical analysis with quantum enhancement.
    /// </summary>
    Task<StatisticalAnalysisResult> PerformQuantumStatisticalAnalysisAsync(
        StatisticalAnalysisRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates statistical significance with championship-level precision.
    /// </summary>
    Task<SignificanceValidationResult> ValidateStatisticalSignificanceAsync(
        string analysisId,
        SignificanceParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates infinite-dimensional statistical models.
    /// </summary>
    Task<InfiniteDimensionalModel> GenerateInfiniteDimensionalModelAsync(
        ModelGenerationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs IAAO compliance statistical validation.
    /// </summary>
    Task<IAAOComplianceResult> ValidateIAAOStatisticalComplianceAsync(
        string analysisId,
        IAAOStandards standards,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates comprehensive research insights from multiple data sources.
    /// </summary>
    Task<ResearchInsights> GenerateResearchInsightsAsync(
        object propertyAnalytics,
        object systemPerformance,
        object consciousnessMetrics,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Statistical analysis request with comprehensive parameters.
/// </summary>
public class StatisticalAnalysisRequest
{
    [Required]
    public string DatasetId { get; set; } = string.Empty;
    
    [Required]
    public StatisticalMethod Method { get; set; } = StatisticalMethod.QuantumRegression;
    
    public AnalysisParameters Parameters { get; set; } = new();
    public bool QuantumEnhanced { get; set; } = true;
    public decimal AccuracyTarget { get; set; } = 0.999m;
}

/// <summary>
/// Statistical analysis parameters for government-grade precision.
/// </summary>
public class AnalysisParameters
{
    public decimal ConfidenceLevel { get; set; } = 0.999m;
    public int BootstrapSamples { get; set; } = 10000;
    public bool CrossValidation { get; set; } = true;
    public int ValidationFolds { get; set; } = 10;
    public Dictionary<string, object> AdvancedParameters { get; set; } = new();
}

/// <summary>
/// Statistical analysis result with comprehensive metrics.
/// </summary>
public class StatisticalAnalysisResult
{
    public string AnalysisId { get; set; } = Guid.NewGuid().ToString();
    public bool AnalysisSuccessful { get; set; }
    public StatisticalMetrics Metrics { get; set; } = new();
    public ModelPerformance Performance { get; set; } = new();
    public List<StatisticalInsight> Insights { get; set; } = new();
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Comprehensive statistical metrics for analysis validation.
/// </summary>
public class StatisticalMetrics
{
    public decimal RSquared { get; set; }
    public decimal AdjustedRSquared { get; set; }
    public decimal PValue { get; set; }
    public decimal FStatistic { get; set; }
    public decimal StandardError { get; set; }
    public decimal MeanSquaredError { get; set; }
    public decimal RootMeanSquaredError { get; set; }
    public Dictionary<string, decimal> AdditionalMetrics { get; set; } = new();
}

/// <summary>
/// Model performance evaluation with quantum validation.
/// </summary>
public class ModelPerformance
{
    public decimal Accuracy { get; set; }
    public decimal Precision { get; set; }
    public decimal Recall { get; set; }
    public decimal F1Score { get; set; }
    public decimal QuantumOptimizationScore { get; set; }
    public bool ExceedsTargetAccuracy { get; set; }
}

/// <summary>
/// Statistical insight with significance validation.
/// </summary>
public class StatisticalInsight
{
    public string InsightCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal SignificanceLevel { get; set; }
    public bool StatisticallySignificant { get; set; }
    public Dictionary<string, object> SupportingData { get; set; } = new();
}

/// <summary>
/// Significance validation parameters for statistical testing.
/// </summary>
public class SignificanceParameters
{
    public decimal AlphaLevel { get; set; } = 0.001m;
    public StatisticalTest TestType { get; set; } = StatisticalTest.QuantumTTest;
    public bool BonferroniCorrection { get; set; } = true;
    public int MultipleComparisonCorrection { get; set; } = 1;
}

/// <summary>
/// Statistical significance validation result.
/// </summary>
public class SignificanceValidationResult
{
    public bool IsStatisticallySignificant { get; set; }
    public decimal CalculatedPValue { get; set; }
    public decimal CriticalValue { get; set; }
    public decimal TestStatistic { get; set; }
    public List<string> ValidationNotes { get; set; } = new();
}

/// <summary>
/// Infinite-dimensional model generation request.
/// </summary>
public class ModelGenerationRequest
{
    [Required]
    public string DatasetId { get; set; } = string.Empty;
    
    public ModelComplexity Complexity { get; set; } = ModelComplexity.InfiniteDimensional;
    public int MaxDimensions { get; set; } = int.MaxValue;
    public bool QuantumEnhanced { get; set; } = true;
    public Dictionary<string, object> ModelParameters { get; set; } = new();
}

/// <summary>
/// Infinite-dimensional statistical model with quantum optimization.
/// </summary>
public class InfiniteDimensionalModel
{
    public string ModelId { get; set; } = Guid.NewGuid().ToString();
    public int ActualDimensions { get; set; }
    public decimal ModelAccuracy { get; set; }
    public ModelCoefficients Coefficients { get; set; } = new();
    public QuantumOptimizationMetrics QuantumMetrics { get; set; } = new();
    public bool InfiniteDimensionalCapable { get; set; }
}

/// <summary>
/// Model coefficients with statistical validation.
/// </summary>
public class ModelCoefficients
{
    public Dictionary<string, decimal> Coefficients { get; set; } = new();
    public Dictionary<string, decimal> StandardErrors { get; set; } = new();
    public Dictionary<string, decimal> TValues { get; set; } = new();
    public Dictionary<string, decimal> PValues { get; set; } = new();
}

/// <summary>
/// Quantum optimization metrics for statistical models.
/// </summary>
public class QuantumOptimizationMetrics
{
    public decimal QuantumEnhancementFactor { get; set; }
    public decimal ComputationalEfficiency { get; set; }
    public bool QuantumSupremacyAchieved { get; set; }
    public int QuantumGates { get; set; }
}

/// <summary>
/// IAAO standards configuration for compliance validation.
/// </summary>
public class IAAOStandards
{
    public decimal AssessmentLevelTarget { get; set; } = 1.0m;
    public decimal AssessmentLevelTolerance { get; set; } = 0.1m;
    public decimal CoefficientOfDispersionLimit { get; set; } = 0.15m;
    public decimal PriceRelatedDifferentialRange { get; set; } = 0.05m;
    public bool EnforceAllStandards { get; set; } = true;
}

/// <summary>
/// IAAO compliance validation result with detailed metrics.
/// </summary>
public class IAAOComplianceResult
{
    public bool IsCompliant { get; set; }
    public IAAOMetrics Metrics { get; set; } = new();
    public List<ComplianceValidation> Validations { get; set; } = new();
    public decimal OverallComplianceScore { get; set; }
    public string CertificationLevel { get; set; } = string.Empty;
}

/// <summary>
/// IAAO statistical metrics for assessment validation.
/// </summary>
public class IAAOMetrics
{
    public decimal AssessmentLevel { get; set; }
    public decimal CoefficientOfDispersion { get; set; }
    public decimal PriceRelatedDifferential { get; set; }
    public decimal MedianRatio { get; set; }
    public decimal StandardDeviation { get; set; }
    public bool MeetsIAAOStandards { get; set; }
}

/// <summary>
/// Statistical method enumeration for analysis selection.
/// </summary>
public enum StatisticalMethod
{
    LinearRegression,
    MultipleRegression,
    QuantumRegression,
    BayesianAnalysis,
    MachineLearningHybrid,
    InfiniteDimensionalAnalysis
}

/// <summary>
/// Statistical test types for significance validation.
/// </summary>
public enum StatisticalTest
{
    TTest,
    ChiSquare,
    ANOVA,
    KruskalWallis,
    MannWhitney,
    QuantumTTest
}

/// <summary>
/// Model complexity levels for statistical analysis.
/// </summary>
public enum ModelComplexity
{
    Simple,
    Moderate,
    Complex,
    HighDimensional,
    InfiniteDimensional
}