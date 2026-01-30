using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// Elite research analytics service interface for PhD-level statistical analysis.
/// Provides championship-level research coordination and data analysis capabilities.
/// </summary>
public interface IResearchAnalyticsService
{
    /// <summary>
    /// Performs immersive research analytics with quantum-enhanced precision.
    /// </summary>
    Task<ResearchAnalysisResult> PerformResearchAnalysisAsync(
        ResearchAnalysisRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates PhD-level research insights with statistical validation.
    /// </summary>
    Task<ResearchInsights> GenerateResearchInsightsAsync(
        string analysisId,
        InsightParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates research methodology for government-grade compliance.
    /// </summary>
    Task<MethodologyValidationResult> ValidateResearchMethodologyAsync(
        string researcherId,
        ResearchMethodology methodology,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports research analytics with championship-level formatting.
    /// </summary>
    Task<ResearchExportResult> ExportAnalyticsAsync(
        string analysisId,
        ExportFormat format,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets property analytics with quantum-enhanced valuation insights.
    /// </summary>
    Task<PropertyAnalyticsResult> GetPropertyAnalyticsAsync(
        string propertyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Initializes research analytics environment with quantum consciousness coordination.
    /// </summary>
    Task<object> InitializeEnvironmentAsync(
        object analyticsConfig,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Research analysis request with comprehensive parameters.
/// </summary>
public class ResearchAnalysisRequest
{
    [Required]
    public string ResearcherId { get; set; } = string.Empty;

    [Required]
    public string DatasetId { get; set; } = string.Empty;

    public ResearchMethodology Methodology { get; set; } = new();
    public StatisticalParameters Parameters { get; set; } = new();
    public bool QuantumEnhanced { get; set; } = true;
}

/// <summary>
/// Research methodology configuration for government-grade analysis.
/// </summary>
public class ResearchMethodology
{
    public string AnalysisType { get; set; } = "QUANTUM_STATISTICAL";
    public decimal ConfidenceLevel { get; set; } = 0.999m;
    public int SampleSize { get; set; } = 10000;
    public bool CrossValidation { get; set; } = true;
    public List<string> ValidationMethods { get; set; } = new();
}

/// <summary>
/// Statistical analysis parameters for championship-level precision.
/// </summary>
public class StatisticalParameters
{
    public decimal AlphaLevel { get; set; } = 0.001m;
    public int BootstrapIterations { get; set; } = 10000;
    public bool InfiniteDimensionalModeling { get; set; } = true;
    public Dictionary<string, object> CustomParameters { get; set; } = new();
}

/// <summary>
/// Research analysis result with comprehensive insights.
/// </summary>
public class ResearchAnalysisResult
{
    public string AnalysisId { get; set; } = Guid.NewGuid().ToString();
    public bool AnalysisSuccessful { get; set; }
    public ResearchInsights Insights { get; set; } = new();
    public StatisticalValidation Validation { get; set; } = new();
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// PhD-level research insights with statistical significance.
/// </summary>
public class ResearchInsights
{
    public List<string> KeyFindings { get; set; } = new();
    public Dictionary<string, decimal> StatisticalMetrics { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public decimal ConfidenceScore { get; set; }
    public bool StatisticallySignificant { get; set; }

    // Additional properties for PhD-level research
    public decimal StatisticalSignificance { get; set; }
    public decimal ExperimentalVariance { get; set; }
    public Dictionary<string, bool> HypothesisValidation { get; set; } = new();
    public decimal PublicationReadiness { get; set; }
}/// <summary>
/// Insight generation parameters for research excellence.
/// </summary>
public class InsightParameters
{
    public string FocusArea { get; set; } = string.Empty;
    public decimal MinimumConfidence { get; set; } = 0.95m;
    public bool IncludePredictiveInsights { get; set; } = true;
    public int MaxInsights { get; set; } = 50;
}

/// <summary>
/// Research methodology validation result with compliance metrics.
/// </summary>
public class MethodologyValidationResult
{
    public bool IsValid { get; set; }
    public decimal ComplianceScore { get; set; }
    public List<string> ValidationMessages { get; set; } = new();
    public bool GovernmentGradeCompliant { get; set; }
}

/// <summary>
/// Statistical validation metrics for research quality assurance.
/// </summary>
public class StatisticalValidation
{
    public decimal PValue { get; set; }
    public decimal EffectSize { get; set; }
    public decimal PowerAnalysis { get; set; }
    public bool HypothesisSupported { get; set; }
    public Dictionary<string, decimal> ValidationMetrics { get; set; } = new();
}

/// <summary>
/// Research export result with comprehensive formatting options.
/// </summary>
public class ResearchExportResult
{
    public string ExportId { get; set; } = Guid.NewGuid().ToString();
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public bool ExportSuccessful { get; set; }
}

/// <summary>
/// Export format options for research analytics.
/// </summary>
public enum ExportFormat
{
    PDF,
    Excel,
    JSON,
    XML,
    CSV,
    StatisticalReport
}

/// <summary>
/// Property analytics result with quantum-enhanced valuation insights.
/// </summary>
public class PropertyAnalyticsResult
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal EstimatedValue { get; set; }
    public decimal ConfidenceScore { get; set; }
    public List<string> ValuationFactors { get; set; } = new();
    public Dictionary<string, decimal> AnalyticsMetrics { get; set; } = new();
    public bool QuantumEnhanced { get; set; } = true;
    public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;

    // Additional properties for research analytics
    public int TotalProperties { get; set; }
    public decimal AssessmentAccuracy { get; set; }
    public decimal IAAOCompliance { get; set; }
    public decimal QuantumEnhancement { get; set; }
    public Dictionary<string, decimal> MLModelPerformance { get; set; } = new();
}
