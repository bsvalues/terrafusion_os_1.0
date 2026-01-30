using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// Advanced predictive modeling service for government-grade forecasting excellence.
/// Provides quantum-enhanced predictive analytics with championship-level accuracy.
/// </summary>
public interface IPredictiveModelingService
{
    /// <summary>
    /// Generates predictive models with quantum enhancement for government operations.
    /// </summary>
    Task<PredictiveModelResult> GeneratePredictiveModelAsync(
        PredictiveModelRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs forecasting analysis with championship-level precision.
    /// </summary>
    Task<ForecastResult> GenerateForecastAsync(
        string modelId,
        ForecastParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates predictive model accuracy against government standards.
    /// </summary>
    Task<ModelValidationResult> ValidatePredictiveModelAsync(
        string modelId,
        ValidationParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs real-time predictive analytics for operational excellence.
    /// </summary>
    Task<RealTimePredictionResult> PerformRealTimePredictionAsync(
        string modelId,
        RealTimePredictionRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets research models for advanced analytics.
    /// </summary>
    Task<object> GetResearchModelsAsync(object parameters);

    /// <summary>
    /// Trains quantum-enhanced models with championship accuracy.
    /// </summary>
    Task<object> TrainQuantumEnhancedModelAsync(object request);

    /// <summary>
    /// Generates predictions using trained models.
    /// </summary>
    Task<object> GeneratePredictionAsync(object request);
}

/// <summary>
/// Predictive model generation request with comprehensive parameters.
/// </summary>
public class PredictiveModelRequest
{
    [Required]
    public string DatasetId { get; set; } = string.Empty;
    
    [Required]
    public PredictiveModelType ModelType { get; set; } = PredictiveModelType.QuantumForecasting;
    
    public ModelConfiguration Configuration { get; set; } = new();
    public TrainingParameters TrainingParameters { get; set; } = new();
    public bool QuantumEnhanced { get; set; } = true;
}

/// <summary>
/// Model configuration for predictive analytics excellence.
/// </summary>
public class ModelConfiguration
{
    public string TargetVariable { get; set; } = string.Empty;
    public List<string> PredictorVariables { get; set; } = new();
    public TimeGranularity TimeGranularity { get; set; } = TimeGranularity.Daily;
    public int ForecastHorizon { get; set; } = 30;
    public decimal AccuracyTarget { get; set; } = 0.95m;
    public Dictionary<string, object> AdvancedSettings { get; set; } = new();
}

/// <summary>
/// Training parameters for model optimization.
/// </summary>
public class TrainingParameters
{
    public double TrainingDataSplit { get; set; } = 0.8;
    public int MaxEpochs { get; set; } = 1000;
    public double LearningRate { get; set; } = 0.001;
    public bool EarlyStoppingEnabled { get; set; } = true;
    public ValidationStrategy ValidationStrategy { get; set; } = ValidationStrategy.CrossValidation;
    public int ValidationFolds { get; set; } = 5;
}

/// <summary>
/// Predictive model generation result with performance metrics.
/// </summary>
public class PredictiveModelResult
{
    public string ModelId { get; set; } = Guid.NewGuid().ToString();
    public bool ModelGenerationSuccessful { get; set; }
    public ModelPerformanceMetrics Performance { get; set; } = new();
    public ModelCharacteristics Characteristics { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<string> ModelInsights { get; set; } = new();
}

/// <summary>
/// Comprehensive model performance metrics.
/// </summary>
public class ModelPerformanceMetrics
{
    public decimal Accuracy { get; set; }
    public decimal MeanAbsoluteError { get; set; }
    public decimal MeanSquaredError { get; set; }
    public decimal RootMeanSquaredError { get; set; }
    public decimal MeanAbsolutePercentageError { get; set; }
    public decimal RSquared { get; set; }
    public bool ExceedsAccuracyTarget { get; set; }
}

/// <summary>
/// Model characteristics and metadata.
/// </summary>
public class ModelCharacteristics
{
    public PredictiveModelType Type { get; set; }
    public int FeatureCount { get; set; }
    public int TrainingDataPoints { get; set; }
    public TimeSpan TrainingDuration { get; set; }
    public bool QuantumOptimized { get; set; }
    public Dictionary<string, object> TechnicalDetails { get; set; } = new();
}

/// <summary>
/// Forecast generation parameters for predictive analytics.
/// </summary>
public class ForecastParameters
{
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public int ForecastPeriods { get; set; } = 30;
    public decimal ConfidenceLevel { get; set; } = 0.95m;
    public bool IncludeConfidenceIntervals { get; set; } = true;
    public bool QuantumEnhanced { get; set; } = true;
    public Dictionary<string, object> ScenarioParameters { get; set; } = new();
}

/// <summary>
/// Forecast result with comprehensive predictions and confidence metrics.
/// </summary>
public class ForecastResult
{
    public string ForecastId { get; set; } = Guid.NewGuid().ToString();
    public bool ForecastSuccessful { get; set; }
    public List<ForecastDataPoint> Predictions { get; set; } = new();
    public ForecastQualityMetrics Quality { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Individual forecast data point with confidence intervals.
/// </summary>
public class ForecastDataPoint
{
    public DateTime Date { get; set; }
    public decimal PredictedValue { get; set; }
    public decimal LowerConfidenceBound { get; set; }
    public decimal UpperConfidenceBound { get; set; }
    public decimal ConfidenceScore { get; set; }
    public Dictionary<string, object> AdditionalMetrics { get; set; } = new();
}

/// <summary>
/// Forecast quality assessment metrics.
/// </summary>
public class ForecastQualityMetrics
{
    public decimal OverallConfidence { get; set; }
    public decimal TrendReliability { get; set; }
    public decimal SeasonalityCapture { get; set; }
    public decimal UncertaintyQuantification { get; set; }
    public bool HighQualityForecast { get; set; }
}

/// <summary>
/// Model validation parameters for accuracy assessment.
/// </summary>
public class ValidationParameters
{
    public ValidationMethod Method { get; set; } = ValidationMethod.HoldoutValidation;
    public double ValidationDataSplit { get; set; } = 0.2;
    public int CrossValidationFolds { get; set; } = 5;
    public decimal AccuracyThreshold { get; set; } = 0.90m;
    public bool ComprehensiveValidation { get; set; } = true;
}

/// <summary>
/// Model validation result with detailed assessment.
/// </summary>
public class ModelValidationResult
{
    public bool ValidationPassed { get; set; }
    public ValidationMetrics Metrics { get; set; } = new();
    public List<ValidationTest> Tests { get; set; } = new();
    public decimal OverallValidationScore { get; set; }
    public List<string> ValidationRecommendations { get; set; } = new();
}

/// <summary>
/// Comprehensive validation metrics for model assessment.
/// </summary>
public class ValidationMetrics
{
    public decimal ValidationAccuracy { get; set; }
    public decimal ValidationLoss { get; set; }
    public decimal Overfitting { get; set; }
    public decimal Underfitting { get; set; }
    public decimal Generalizability { get; set; }
    public bool RobustnessValidated { get; set; }
}

/// <summary>
/// Individual validation test result.
/// </summary>
public class ValidationTest
{
    public string TestName { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public decimal Score { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> Details { get; set; } = new();
}

/// <summary>
/// Real-time prediction request for operational analytics.
/// </summary>
public class RealTimePredictionRequest
{
    [Required]
    public Dictionary<string, object> InputData { get; set; } = new();
    
    public bool IncludeConfidenceScore { get; set; } = true;
    public bool IncludeFeatureImportance { get; set; } = false;
    public int PredictionHorizon { get; set; } = 1;
    public Dictionary<string, object> ContextualParameters { get; set; } = new();
}

/// <summary>
/// Real-time prediction result with immediate analytics.
/// </summary>
public class RealTimePredictionResult
{
    public bool PredictionSuccessful { get; set; }
    public List<PredictionValue> Predictions { get; set; } = new();
    public decimal OverallConfidence { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public DateTime PredictedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Individual prediction value with confidence metrics.
/// </summary>
public class PredictionValue
{
    public string Variable { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal Confidence { get; set; }
    public Dictionary<string, decimal> FeatureImportance { get; set; } = new();
}

/// <summary>
/// Predictive model types for government analytics.
/// </summary>
public enum PredictiveModelType
{
    LinearRegression,
    LogisticRegression,
    RandomForest,
    NeuralNetwork,
    TimeSeriesARIMA,
    QuantumForecasting,
    EnsembleModel,
    DeepLearning
}

/// <summary>
/// Time granularity options for temporal modeling.
/// </summary>
public enum TimeGranularity
{
    Hourly,
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly
}

/// <summary>
/// Validation strategy options for model assessment.
/// </summary>
public enum ValidationStrategy
{
    HoldoutValidation,
    CrossValidation,
    BootstrapValidation,
    TimeSeriesValidation,
    StratifiedValidation
}

/// <summary>
/// Validation method types for model testing.
/// </summary>
public enum ValidationMethod
{
    HoldoutValidation,
    KFoldCrossValidation,
    LeaveOneOutValidation,
    TimeSeriesSplit,
    StratifiedKFold,
    ComprehensiveValidation
}