using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Models
{
    /// <summary>
    /// STRATEGIC BRIDGE MODELS: Harris PACS ↔ TerraFusion Enhancement Data Models
    ///
    /// These models support the strategic bridge between Harris PACS legacy systems
    /// and TerraFusion's championship AI capabilities, enabling seamless enhancement
    /// while maintaining familiar county workflows.
    /// </summary>

    public class HarrisPACSEnhancementMetrics
    {
        public string SessionId { get; set; } = "";
        public string CountyCode { get; set; } = "";
        public DateTime StartTime { get; set; }
        public BaselineMetrics BaselineMetrics { get; set; } = new();
        public EnhancementTargets TargetMetrics { get; set; } = new();
        public RealTimeEnhancementMetrics RealTimeMetrics { get; set; } = new();
        public List<EnhancementMilestone> Milestones { get; set; } = new List<EnhancementMilestone>();
    }

    public class BaselineMetrics
    {
        public decimal CurrentAccuracy { get; set; }
        public decimal CurrentPerformance { get; set; }
        public decimal CurrentCompliance { get; set; }
        public TimeSpan AverageProcessingTime { get; set; }
        public int DailyAssessmentVolume { get; set; }
        public decimal ErrorRate { get; set; }
        public Dictionary<string, decimal> DetailedMetrics { get; set; } = new Dictionary<string, decimal>();
    }

    public class EnhancementTargets
    {
        [Range(0, 100)]
        public decimal AccuracyTarget { get; set; } = 99.9m; // 99.9% accuracy target

        [Range(0, 100)]
        public decimal PerformanceTarget { get; set; } = 95.0m; // 95% performance improvement

        [Range(0, 100)]
        public decimal ComplianceTarget { get; set; } = 100.0m; // 100% compliance target

        public TimeSpan MaxProcessingTime { get; set; } = TimeSpan.FromSeconds(10); // <10 second response
        public decimal MaxErrorRate { get; set; } = 0.1m; // <0.1% error rate
    }

    public class RealTimeEnhancementMetrics
    {
        public int TotalEnhancements { get; set; }
        public decimal AverageAccuracyImprovement { get; set; }
        public decimal AverageComplianceScore { get; set; }
        public TimeSpan AverageProcessingTime { get; set; }
        public decimal CurrentErrorRate { get; set; }
        public DateTime LastUpdateTime { get; set; }
        public Dictionary<string, decimal> HourlyMetrics { get; set; } = new Dictionary<string, decimal>();
    }

    public class EnhancementMilestone
    {
        public string MilestoneId { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime AchievedTime { get; set; }
        public decimal MetricValue { get; set; }
        public string MetricType { get; set; } = "";
    }

    public class PropertyAssessmentEnhancementRequest
    {
        [Required]
        public string ParcelId { get; set; } = "";

        public EnhancementTargets EnhancementTargets { get; set; } = new();
        public AIAnalysisDepth AIAnalysisDepth { get; set; } = AIAnalysisDepth.Comprehensive;
        public bool IncludeComparativeAnalysis { get; set; } = true;
        public bool IncludeVisualization { get; set; } = true;
        public List<string> FocusAreas { get; set; } = new List<string>();
    }

    public enum AIAnalysisDepth
    {
        Basic,
        Standard,
        Comprehensive,
        Championship
    }

    public class PropertyAssessmentEnhancementResult
    {
        public bool Success { get; set; }
        public string EnhancementId { get; set; } = "";
        public EnhancedPropertyAssessment EnhancedAssessment { get; set; } = new();
        public EnhancementPerformanceMetrics PerformanceMetrics { get; set; } = new();
        public string Message { get; set; } = "";
        public string ErrorMessage { get; set; } = "";
        public string ErrorDetails { get; set; } = "";
    }

    public class EnhancedPropertyAssessment
    {
        public string EnhancementId { get; set; } = "";
        public string SessionId { get; set; } = "";
        public string ParcelId { get; set; } = "";
        public string CountyCode { get; set; } = "";
        public DateTime EnhancementTimestamp { get; set; }

        // Harris PACS Baseline Data
        public HarrisPACSAssessment BaselineAssessment { get; set; } = new();

        // TerraFusion AI Enhancement Results
        public PropertyAIEnhancementResult AIEnhancement { get; set; } = new();
        public QuantumOptimizationResult QuantumOptimization { get; set; } = new();
        public IAAOValidationResult IAAOValidation { get; set; } = new();

        // Enhancement Performance Metrics
        public decimal AccuracyImprovement { get; set; }
        public decimal ComplianceScore { get; set; }
        public decimal ConfidenceLevel { get; set; }
        public TimeSpan ProcessingTime { get; set; }

        // Comparative Analysis
        public PropertyAssessmentComparison Comparison { get; set; } = new();
        public List<EnhancementInsight> Insights { get; set; } = new List<EnhancementInsight>();
    }

    public class HarrisPACSAssessment
    {
        public string ParcelId { get; set; } = "";
        public decimal AssessedValue { get; set; }
        public decimal LandValue { get; set; }
        public decimal ImprovementValue { get; set; }
        public DateTime AssessmentDate { get; set; }
        public string AssessmentMethod { get; set; } = "";
        public Dictionary<string, object> AdditionalData { get; set; } = new Dictionary<string, object>();
    }

    public class PropertyAIEnhancementResult
    {
        public decimal EnhancedAssessedValue { get; set; }
        public decimal EnhancedLandValue { get; set; }
        public decimal EnhancedImprovementValue { get; set; }
        public decimal ConfidenceScore { get; set; }
        public List<AIAnalysisFactor> ContributingFactors { get; set; } = new List<AIAnalysisFactor>();
        public MarketAnalysis MarketAnalysis { get; set; } = new();
        public ComparablePropertiesAnalysis ComparableAnalysis { get; set; } = new();
    }

    public class AIAnalysisFactor
    {
        public string FactorName { get; set; } = "";
        public decimal Impact { get; set; }
        public decimal Weight { get; set; }
        public string Description { get; set; } = "";
        public string DataSource { get; set; } = "";
    }

    public class MarketAnalysis
    {
        public decimal MarketTrend { get; set; }
        public decimal LocationFactor { get; set; }
        public decimal SeasonalAdjustment { get; set; }
        public List<MarketIndicator> Indicators { get; set; } = new List<MarketIndicator>();
    }

    public class MarketIndicator
    {
        public string IndicatorName { get; set; } = "";
        public decimal Value { get; set; }
        public string Trend { get; set; } = "";
        public DateTime LastUpdated { get; set; }
    }

    public class ComparablePropertiesAnalysis
    {
        public List<ComparableProperty> Comparables { get; set; } = new List<ComparableProperty>();
        public decimal AdjustmentFactor { get; set; }
        public decimal ReliabilityScore { get; set; }
    }

    public class ComparableProperty
    {
        public string ParcelId { get; set; } = "";
        public decimal SalePrice { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal SimilarityScore { get; set; }
        public List<PropertyAdjustment> Adjustments { get; set; } = new List<PropertyAdjustment>();
    }

    public class PropertyAdjustment
    {
        public string AdjustmentType { get; set; } = "";
        public decimal AdjustmentValue { get; set; }
        public string Reason { get; set; } = "";
    }

    public class QuantumOptimizationResult
    {
        public decimal OptimizedValue { get; set; }
        public decimal QuantumFactor { get; set; }
        public decimal ConfidenceLevel { get; set; }
        public ConsciousnessParameters ConsciousnessParameters { get; set; } = new();
        public List<QuantumOptimizationStep> OptimizationSteps { get; set; } = new List<QuantumOptimizationStep>();
    }

    public class ConsciousnessParameters
    {
        public decimal ConsciousnessLevel { get; set; }
        public decimal CoordinationFactor { get; set; }
        public int ActiveAgentCount { get; set; }
        public List<ConsciousnessMetric> Metrics { get; set; } = new List<ConsciousnessMetric>();
    }

    public class ConsciousnessMetric
    {
        public string MetricName { get; set; } = "";
        public decimal Value { get; set; }
        public string Unit { get; set; } = "";
    }

    public class QuantumOptimizationStep
    {
        public string StepName { get; set; } = "";
        public decimal InputValue { get; set; }
        public decimal OutputValue { get; set; }
        public decimal ImprovementFactor { get; set; }
        public string Algorithm { get; set; } = "";
    }

    public class IAAOValidationResult
    {
        public bool IsCompliant { get; set; }
        public decimal ComplianceScore { get; set; }
        public List<IAAOStandardResult> StandardResults { get; set; } = new List<IAAOStandardResult>();
        public List<ComplianceRecommendation> Recommendations { get; set; } = new List<ComplianceRecommendation>();
    }

    public class IAAOStandardResult
    {
        public string StandardName { get; set; } = "";
        public bool Passed { get; set; }
        public decimal Score { get; set; }
        public string Details { get; set; } = "";
        public decimal Threshold { get; set; }
    }

    public class ComplianceRecommendation
    {
        public string RecommendationType { get; set; } = "";
        public string Description { get; set; } = "";
        public string Priority { get; set; } = "";
        public decimal ImpactEstimate { get; set; }
    }

    public class PropertyAssessmentComparison
    {
        public decimal BaselineValue { get; set; }
        public decimal EnhancedValue { get; set; }
        public decimal ImprovementPercentage { get; set; }
        public List<ComparisonMetric> Metrics { get; set; } = new List<ComparisonMetric>();
        public string RecommendedAction { get; set; } = "";
    }

    public class ComparisonMetric
    {
        public string MetricName { get; set; } = "";
        public decimal BaselineValue { get; set; }
        public decimal EnhancedValue { get; set; }
        public decimal ImprovementPercentage { get; set; }
        public string Unit { get; set; } = "";
    }

    public class EnhancementInsight
    {
        public string InsightType { get; set; } = "";
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal ImpactScore { get; set; }
        public string ActionRecommendation { get; set; } = "";
        public Dictionary<string, object> AdditionalData { get; set; } = new Dictionary<string, object>();
    }

    public class EnhancementPerformanceMetrics
    {
        public TimeSpan ProcessingTime { get; set; }
        public decimal AccuracyScore { get; set; }
        public decimal PerformanceScore { get; set; }
        public int AIAgentsUtilized { get; set; }
        public Dictionary<string, decimal> DetailedMetrics { get; set; } = new Dictionary<string, decimal>();
    }

    public class HarrisPACSComparisonReport
    {
        public string ReportId { get; set; } = Guid.NewGuid().ToString();
        public string SessionId { get; set; } = "";
        public string CountyCode { get; set; } = "";
        public DateTime ReportTimestamp { get; set; }
        public AnalysisPeriod AnalysisPeriod { get; set; } = new();

        // Data Collections
        public BaselinePerformanceData HarrisBaselineData { get; set; } = new();
        public EnhancementPerformanceData TerraFusionEnhancementData { get; set; } = new();

        // Analysis Results
        public ComparativeAnalysisResult ComparativeAnalysis { get; set; } = new();
        public ROIAnalysisResult ROIAnalysis { get; set; } = new();
        public ComparisonVisualizationData VisualizationData { get; set; } = new();

        // Report Sections
        public ExecutiveSummary ExecutiveSummary { get; set; } = new();
        public List<KeyFinding> KeyFindings { get; set; } = new List<KeyFinding>();
        public List<RecommendedAction> RecommendedActions { get; set; } = new List<RecommendedAction>();
    }

    public class AnalysisPeriod
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = "";
    }

    public class BaselinePerformanceData
    {
        public int TotalAssessments { get; set; }
        public decimal AverageAccuracy { get; set; }
        public TimeSpan AverageProcessingTime { get; set; }
        public decimal ErrorRate { get; set; }
        public decimal ComplianceRate { get; set; }
        public Dictionary<string, decimal> MonthlyMetrics { get; set; } = new Dictionary<string, decimal>();
    }

    public class EnhancementPerformanceData
    {
        public int TotalEnhancements { get; set; }
        public decimal AverageAccuracyImprovement { get; set; }
        public TimeSpan AverageProcessingTime { get; set; }
        public decimal ErrorRate { get; set; }
        public decimal ComplianceRate { get; set; }
        public Dictionary<string, decimal> MonthlyMetrics { get; set; } = new Dictionary<string, decimal>();
    }

    public class ComparativeAnalysisResult
    {
        public decimal AccuracyImprovement { get; set; }
        public decimal PerformanceImprovement { get; set; }
        public decimal ComplianceImprovement { get; set; }
        public decimal ErrorReduction { get; set; }
        public List<MetricComparison> DetailedComparisons { get; set; } = new List<MetricComparison>();
    }

    public class MetricComparison
    {
        public string MetricName { get; set; } = "";
        public decimal BaselineValue { get; set; }
        public decimal EnhancedValue { get; set; }
        public decimal ImprovementPercentage { get; set; }
        public string Significance { get; set; } = "";
    }

    public class ROIAnalysisResult
    {
        public decimal InvestmentCost { get; set; }
        public decimal AnnualSavings { get; set; }
        public decimal ROIPercentage { get; set; }
        public DateTime AnalysisTimestamp { get; set; }
        public decimal AnnualROIProjection { get; set; }
        public decimal CostSavingsAnnual { get; set; }
        public decimal RevenueImprovementAnnual { get; set; }
        public TimeSpan PaybackPeriod { get; set; }
        public List<ROIComponent> ROIComponents { get; set; } = new List<ROIComponent>();
    }

    public class ROIComponent
    {
        public string ComponentName { get; set; } = "";
        public decimal AnnualValue { get; set; }
        public string Description { get; set; } = "";
        public string Category { get; set; } = "";
    }

    public class ComparisonVisualizationData
    {
        public List<ChartData> AccuracyTrendChart { get; set; } = new List<ChartData>();
        public List<ChartData> PerformanceTrendChart { get; set; } = new List<ChartData>();
        public List<ChartData> ROIProjectionChart { get; set; } = new List<ChartData>();
        public Dictionary<string, object> AdditionalCharts { get; set; } = new Dictionary<string, object>();
    }

    public class ChartData
    {
        public string Label { get; set; } = "";
        public decimal Value { get; set; }
        public DateTime Timestamp { get; set; }
        public string Category { get; set; } = "";
    }

    public class ExecutiveSummary
    {
        public string CountyName { get; set; } = "";
        public string SummaryText { get; set; } = "";
        public List<string> KeyHighlights { get; set; } = new List<string>();
        public Dictionary<string, decimal> CriticalMetrics { get; set; } = new Dictionary<string, decimal>();
        public string OverallRecommendation { get; set; } = "";
    }

    public class KeyFinding
    {
        public string FindingId { get; set; } = "";
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal ImpactScore { get; set; }
        public string Category { get; set; } = "";
        public List<string> SupportingData { get; set; } = new List<string>();
    }

    public class RecommendedAction
    {
        public string ActionId { get; set; } = "";
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Priority { get; set; } = "";
        public string Timeline { get; set; } = "";
        public string ExpectedImpact { get; set; } = "";
        public TimeSpan EstimatedImplementationTime { get; set; }
        public decimal EstimatedImpact { get; set; }
        public List<string> Prerequisites { get; set; } = new List<string>();
    }

    public class ComparisonReportRequest
    {
        public AnalysisPeriod AnalysisPeriod { get; set; } = new();
        public List<string> FocusAreas { get; set; } = new List<string>();
        public bool IncludeROIAnalysis { get; set; } = true;
        public bool IncludeVisualization { get; set; } = true;
        public ComparisonDepth AnalysisDepth { get; set; } = ComparisonDepth.Comprehensive;
    }

    public enum ComparisonDepth
    {
        Basic,
        Standard,
        Comprehensive,
        Executive
    }

    // Enhancement Request Base Classes
    public abstract class EnhancementRequest
    {
        public string RequestId { get; set; } = Guid.NewGuid().ToString();
        public string SessionId { get; set; } = "";
        public EnhancementRequestType Type { get; set; }
        public DateTime RequestTime { get; set; } = DateTime.UtcNow;
        public string ParcelId { get; set; } = "";
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();
    }

    public enum EnhancementRequestType
    {
        PropertyAssessment,
        ComplianceValidation,
        PerformanceOptimization,
        MarketAnalysis,
        Reporting
    }

    public class ComplianceEnhancementRequest : EnhancementRequest
    {
        public List<string> ComplianceStandards { get; set; } = new List<string>();
        public bool IncludeRecommendations { get; set; } = true;
    }

    public class PerformanceEnhancementRequest : EnhancementRequest
    {
        public PerformanceTarget TargetLevel { get; set; }
        public List<string> OptimizationAreas { get; set; } = new List<string>();
    }

    public enum PerformanceTarget
    {
        Standard,
        Enhanced,
        Championship,
        Elite
    }
}
