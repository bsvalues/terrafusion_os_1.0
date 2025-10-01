using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Models
{
    /// <summary>
    /// Request model for Golden Ratio Engine property scoring
    /// </summary>
    public class GREScoreRequest
    {
        [Required]
        public string? SubjectId { get; set; }
        
        [Required]
        public List<PropertyComparable>? Comparables { get; set; }
        
        public GREParameters? Parameters { get; set; }
        
        public bool IncludeExplanations { get; set; } = true;
        
        public string? County { get; set; }
        
        public string? AssetClass { get; set; }
    }

    /// <summary>
    /// Property comparable for φ-analysis
    /// </summary>
    public class PropertyComparable
    {
        public string? Id { get; set; }
        public double? DistanceMiles { get; set; }
        public int? DaysOld { get; set; }
        public double? PricePerSF { get; set; }
        public int? Beds { get; set; }
        public int? Baths { get; set; }
        public double? LivingSF { get; set; }
        public string? Quality { get; set; }
        public Dictionary<string, object>? AdditionalFeatures { get; set; }
    }

    /// <summary>
    /// Golden Ratio Engine parameters for φ-kernels
    /// </summary>
    public class GREParameters
    {
        // Space kernel parameters
        public double SpaceLambdaMiles { get; set; } = 0.75;
        public double SpaceAlpha { get; set; } = 0.4812; // φ - 1
        public double SpaceBeta { get; set; } = 0.12;
        
        // Time kernel parameters  
        public double TimeTauDays { get; set; } = 90;
        public double TimeGamma { get; set; } = 0.4812;
        
        // Feature weights
        public Dictionary<string, FeatureConfig>? FeatureWeights { get; set; }
        
        // Composite parameters
        public double SpacePower { get; set; } = 1.0;
        public double TimePower { get; set; } = 1.0;
        
        // Safety bounds
        public double MinWeight { get; set; } = 0.02;
        public int MaxComps { get; set; } = 50;
    }

    /// <summary>
    /// Feature configuration for φ-weighting
    /// </summary>
    public class FeatureConfig
    {
        public double Scale { get; set; }
        public double Alpha { get; set; } = 0.4812;
        public double Weight { get; set; } = 1.0;
        public bool IsCategorical { get; set; } = false;
    }

    /// <summary>
    /// Response model for Golden Ratio Engine scoring
    /// </summary>
    public class GREScoreResponse
    {
        public string? SubjectId { get; set; }
        public List<GREScore>? Scores { get; set; }
        public GREStatistics? Statistics { get; set; }
        public List<PhiRing>? PhiRings { get; set; }
        public GREDiagnostics? Diagnostics { get; set; }
        public double ProcessingTimeMs { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Individual φ-weighted score for a comparable
    /// </summary>
    public class GREScore
    {
        public string? ComparableId { get; set; }
        public double PhiWeight { get; set; }
        public double SpaceWeight { get; set; }
        public double TimeWeight { get; set; }
        public Dictionary<string, double>? FeatureWeights { get; set; }
        public int PhiRingIndex { get; set; }
        public string? Explanation { get; set; }
        public bool IsInformative { get; set; } = true;
    }

    /// <summary>
    /// Statistical summary of φ-analysis
    /// </summary>
    public class GREStatistics
    {
        public int TotalComparables { get; set; }
        public int PhiRingsUsed { get; set; }
        public double AverageWeight { get; set; }
        public double CoverageScore { get; set; }
        public double HarmonyIndex { get; set; }
        public Dictionary<string, double>? DistributionMetrics { get; set; }
    }

    /// <summary>
    /// φ-ring definition for spatial analysis
    /// </summary>
    public class PhiRing
    {
        public int RingIndex { get; set; }
        public double MinDistanceMiles { get; set; }
        public double MaxDistanceMiles { get; set; }
        public int ComparableCount { get; set; }
        public double AverageWeight { get; set; }
        public bool IsSufficient { get; set; } = true;
    }

    /// <summary>
    /// Diagnostic information for φ-kernel processing
    /// </summary>
    public class GREDiagnostics
    {
        public bool ConvergenceAchieved { get; set; }
        public List<string>? GuardrailsTriggered { get; set; }
        public Dictionary<string, double>? ParameterDrift { get; set; }
        public string? FallbackKernel { get; set; }
        public List<string>? Warnings { get; set; }
    }

    /// <summary>
    /// Request for Golden Ratio Engine parameter tuning
    /// </summary>
    public class GRETuneRequest
    {
        [Required]
        public string? County { get; set; }
        
        [Required]
        public string? AssetClass { get; set; }
        
        public List<PropertyComparable>? TrainingData { get; set; }
        
        public ParameterBounds? Bounds { get; set; }
        
        public int GridSearchIterations { get; set; } = 100;
        
        public int KFoldSplits { get; set; } = 5;
        
        public List<string>? TargetMetrics { get; set; }
    }

    /// <summary>
    /// Parameter bounds for optimization
    /// </summary>
    public class ParameterBounds
    {
        public (double Min, double Max) LambdaRange { get; set; } = (0.3, 1.5);
        public (double Min, double Max) AlphaRange { get; set; } = (0.3, 0.8);
        public (double Min, double Max) BetaRange { get; set; } = (0.0, 0.2);
        public (double Min, double Max) TauRange { get; set; } = (30, 180);
        public (double Min, double Max) GammaRange { get; set; } = (0.3, 0.8);
    }

    /// <summary>
    /// Response for parameter tuning operation
    /// </summary>
    public class GRETuneResponse
    {
        public GREParameters? OptimalParameters { get; set; }
        public PerformanceMetrics? PerformanceMetrics { get; set; }
        public ValidationResults? ValidationResults { get; set; }
        public ConvergenceInfo? Convergence { get; set; }
        public double ProcessingTimeMs { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Performance metrics for tuned parameters
    /// </summary>
    public class PerformanceMetrics
    {
        public double MAE { get; set; }
        public double RMSE { get; set; }
        public double R2 { get; set; }
        public double MAPE { get; set; }
        public double ImprovementPercent { get; set; }
        public Dictionary<string, double>? MetricsByAssetClass { get; set; }
    }

    /// <summary>
    /// K-fold validation results
    /// </summary>
    public class ValidationResults
    {
        public List<FoldResult>? FoldResults { get; set; }
        public double CrossValidationScore { get; set; }
        public double StandardDeviation { get; set; }
        public bool IsStable { get; set; }
    }

    /// <summary>
    /// Individual fold validation result
    /// </summary>
    public class FoldResult
    {
        public int FoldIndex { get; set; }
        public double MAE { get; set; }
        public double RMSE { get; set; }
        public double R2 { get; set; }
        public int TrainingSamples { get; set; }
        public int TestSamples { get; set; }
    }

    /// <summary>
    /// Convergence information for optimization
    /// </summary>
    public class ConvergenceInfo
    {
        public bool Converged { get; set; }
        public int Iterations { get; set; }
        public double FinalTolerance { get; set; }
        public string? StoppingCriterion { get; set; }
        public Dictionary<string, double>? ParameterStability { get; set; }
    }

    /// <summary>
    /// Request for golden section optimization
    /// </summary>
    public class GoldenSectionRequest
    {
        [Required]
        public string? FunctionType { get; set; }
        
        public Dictionary<string, object>? Parameters { get; set; }
        
        public (double Min, double Max) Bounds { get; set; }
        
        public double Tolerance { get; set; } = 1e-6;
        
        public int MaxIterations { get; set; } = 100;
    }

    /// <summary>
    /// Result from golden section optimization
    /// </summary>
    public class GoldenSectionResult
    {
        public double OptimalValue { get; set; }
        public double OptimalPoint { get; set; }
        public int Iterations { get; set; }
        public bool Convergence { get; set; }
        public double ProcessingTimeMs { get; set; }
        public List<IterationStep>? IterationHistory { get; set; }
    }

    /// <summary>
    /// Individual iteration step in golden section search
    /// </summary>
    public class IterationStep
    {
        public int Step { get; set; }
        public double LowerBound { get; set; }
        public double UpperBound { get; set; }
        public double TestPoint1 { get; set; }
        public double TestPoint2 { get; set; }
        public double Value1 { get; set; }
        public double Value2 { get; set; }
        public double Tolerance { get; set; }
    }

    // Internal result types for FFI integration
    internal class GREScoreResult
    {
        public List<GREScore> Scores { get; set; } = new();
        public GREStatistics Statistics { get; set; } = new();
        public List<PhiRing> PhiRings { get; set; } = new();
        public GREDiagnostics Diagnostics { get; set; } = new();
        public double ProcessingTimeMs { get; set; }
    }

    internal class GRETuneResult
    {
        public GREParameters OptimalParameters { get; set; } = new();
        public PerformanceMetrics PerformanceMetrics { get; set; } = new();
        public ValidationResults ValidationResults { get; set; } = new();
        public ConvergenceInfo Convergence { get; set; } = new();
        public double ProcessingTimeMs { get; set; }
    }
}