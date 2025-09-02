using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.Enums;

namespace TerraFusion.AI.DTOs
{
    // Core AI DTOs
    public class EmergentBehavior
    {
        public string BehaviorId { get; set; } = string.Empty;
        public EmergentBehaviorType Type { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Parameters { get; set; } = new();
        public double Confidence { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime FirstObserved { get; set; } = DateTime.UtcNow;
        public int Frequency { get; set; }
        public List<string> InvolvedAgents { get; set; } = new();
    }

    public class EmergentPattern
    {
        public string PatternId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public PatternType Type { get; set; }
        public List<EmergentBehavior> Behaviors { get; set; } = new();
        public double Strength { get; set; }
        public DateTime DetectedAt { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<string> SourceBehaviors { get; set; } = new();
        public double SignificanceScore { get; set; }
        public bool IsBeneficial { get; set; }
    }

    public class SwarmHealthMetrics
    {
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public double OverallPerformance { get; set; }
        public Dictionary<string, int> AgentsByType { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class AITaskDto
    {
        public string TaskId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public Dictionary<string, object> Parameters { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public string? Result { get; set; }
    }

    // Analytics DTOs
    public class AnalyticsRequest
    {
        public string Domain { get; set; } = string.Empty;
        public AnalyticsType Type { get; set; }
        public DateTime TimeRange { get; set; }
        public Dictionary<string, object> Parameters { get; set; } = new();
    }

    public class PredictiveInsights
    {
        public string InsightId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public InsightType Type { get; set; }
        public List<string> AffectedSystems { get; set; } = new();
        public Dictionary<string, object> Predictions { get; set; } = new();
        public List<string> RecommendedActions { get; set; } = new();
        public DateTime ValidUntil { get; set; }
        public InsightSeverity Severity { get; set; }
    }

    public class AnalyticsPattern
    {
        public string PatternId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public PatternType Type { get; set; }
        public double Confidence { get; set; }
        public DateTime DetectedAt { get; set; }
    }

    public class PerformanceForecast
    {
        public string TargetSystem { get; set; } = string.Empty;
        public int ForecastDays { get; set; }
        public DateTime GeneratedAt { get; set; }
        public List<ForecastPoint> Forecast { get; set; } = new();
        public double Accuracy { get; set; }
        public List<string> IdentifiedRisks { get; set; } = new();
    }

    public class ForecastPoint
    {
        public DateTime Date { get; set; }
        public double PredictedValue { get; set; }
        public double ConfidenceInterval { get; set; }
        public Dictionary<string, double> Factors { get; set; } = new();
        public double Value { get; set; }
        public double LowerBound { get; set; }
        public double UpperBound { get; set; }
        public float Confidence { get; set; }
    }

    public class RiskAssessment
    {
        public string ComponentId { get; set; } = string.Empty;
        public DateTime AssessmentDate { get; set; }
        public List<IdentifiedRisk> Risks { get; set; } = new();
        public List<Mitigation> Mitigations { get; set; } = new();
        public double OverallRiskScore { get; set; }
        public RiskLevel Level { get; set; }
    }

    public class IdentifiedRisk
    {
        public string RiskId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public RiskSeverity Severity { get; set; }
        public double Probability { get; set; }
        public double Impact { get; set; }
        public List<string> MitigationOptions { get; set; } = new();
    }

    public class Mitigation
    {
        public string MitigationId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public MitigationPriority Priority { get; set; }
        public int EstimatedDays { get; set; }
        public double EffectivenessRating { get; set; }
    }

    public class AnalyticsDashboardData
    {
        public DateTime LastUpdated { get; set; }
        public Dictionary<string, object> HealthMetrics { get; set; } = new();
        public Dictionary<string, List<double>> Trends { get; set; } = new();
        public List<AlertData> Alerts { get; set; } = new();
        public Dictionary<string, object> Performance { get; set; } = new();
        public List<PredictiveInsights> RecentInsights { get; set; } = new();
        public Dictionary<string, double> KPIs { get; set; } = new();
    }

    public class AlertData
    {
        public string AlertId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public AlertSeverity Severity { get; set; }
        public DateTime Timestamp { get; set; }
        public string Source { get; set; } = string.Empty;
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class Recommendation
    {
        public string RecommendationId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public RecommendationType Type { get; set; }
        public double PotentialImpact { get; set; }
        public RecommendationPriority Priority { get; set; }
        public List<string> Steps { get; set; } = new();
        public int EstimatedDays { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class TrainingData
    {
        public List<Dictionary<string, object>> Features { get; set; } = new();
        public List<object> Labels { get; set; } = new();
        public string ModelType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class AnalyticsMetrics
    {
        public int TotalAnalyses { get; set; }
        public int ModelsActive { get; set; }
        public int PatternsDetected { get; set; }
        public DateTime LastModelTraining { get; set; }
        public double AverageAccuracy { get; set; }
        public Dictionary<string, int> AnalyticsByType { get; set; } = new();
    }

    // Swarm DTOs
    public class SwarmOptimizationRequest
    {
        public string RequestId { get; set; } = string.Empty;
        public string Jurisdiction { get; set; } = string.Empty;
        public string OptimizationType { get; set; } = string.Empty;
        public List<object> HistoricalData { get; set; } = new();
        public int ForecastHorizon { get; set; }
        public SwarmConfiguration Configuration { get; set; } = new();
    }

    public class SwarmOptimizationResult
    {
        public List<decimal> ForecastPredictions { get; set; } = new();
        public double OptimizationScore { get; set; }
        public List<string> EmergentPatterns { get; set; } = new();
        public double SwarmConsensus { get; set; }
        public List<string> RevenueOpportunities { get; set; } = new();
        public string RequestId { get; set; } = string.Empty;
        public string OptimizationType { get; set; } = string.Empty;
        public bool Success { get; set; }
        public double ImprovementPercentage { get; set; }
        public Dictionary<string, object> OptimizedConfiguration { get; set; } = new();
        public TimeSpan ProcessingTime { get; set; }
    }

    public class SwarmConfiguration
    {
        public int AgentCount { get; set; }
        public int Scouts { get; set; }
        public int Workers { get; set; }
        public int Queens { get; set; }
        public int Sentinels { get; set; }
        public int Communicators { get; set; }
    }

    // Cost DTOs
    public class CostMatrixDto
    {
        public string BuildingType { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public decimal BaseCostPerSquareFoot { get; set; }
        public Dictionary<string, double> QualityFactors { get; set; } = new();
        public Dictionary<string, double> LocationFactors { get; set; } = new();
        public DateTime LastUpdated { get; set; }
    }

    public class UpdateCostMatrixDto
    {
        public decimal? BaseCostPerSquareFoot { get; set; }
        public Dictionary<string, double>? QualityFactors { get; set; }
        public Dictionary<string, double>? LocationFactors { get; set; }
        public string? Description { get; set; }
    }

    public class CostForgeStatsDto
    {
        public int TotalValuations { get; set; }
        public int SuccessfulValuations { get; set; }
        public int FailedValuations { get; set; }
        public TimeSpan AverageValuationTime { get; set; }
        public double AverageAccuracy { get; set; }
        public int TotalCostMatrices { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public Dictionary<string, double> TopPerformingRegions { get; set; } = new();
        public double AverageConfidence { get; set; }
        public int TotalProperties { get; set; }
        public int ActiveModels { get; set; }
        public int RecentValuations { get; set; }
        public TimeSpan SystemUptime { get; set; }
        public string ProcessingSpeed { get; set; } = string.Empty;
    }

    public class TrainingDataDto
    {
        public List<Dictionary<string, object>> Features { get; set; } = new();
        public List<object> Labels { get; set; } = new();
        public string ModelType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class ValuationDto
    {
        public int PropertyId { get; set; }
        public decimal EstimatedValue { get; set; }
        public double Confidence { get; set; }
        public DateTime ValuationDate { get; set; }
        public string Method { get; set; } = string.Empty;
        public Dictionary<string, object> Factors { get; set; } = new();
    }

    // Note: AdvancedAIRequest and AdvancedAIMetrics already exist elsewhere

    // Enums
    public enum EmergentBehaviorType
    {
        Optimization = 1,
        Adaptation = 2,
        Learning = 3,
        Coordination = 4,
        Emergence = 5
    }

    public enum PatternType
    {
        Seasonal = 1,
        Trend = 2,
        Anomaly = 3,
        Correlation = 4,
        Cyclic = 5,
        Coordination = 6,
        Emergence = 7
    }

    public enum TrainingStatus
    {
        NotStarted,
        InProgress,
        Completed,
        Failed
    }

    public enum AnalyticsType
    {
        Descriptive = 1,
        Diagnostic = 2,
        Predictive = 3,
        Prescriptive = 4
    }

    public enum InsightType
    {
        Performance = 1,
        Risk = 2,
        Opportunity = 3,
        Security = 4,
        Compliance = 5
    }

    public enum InsightSeverity
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum RiskLevel
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum RiskSeverity
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum MitigationPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum AlertSeverity
    {
        Info = 1,
        Warning = 2,
        Error = 3,
        Critical = 4
    }

    public enum RecommendationType
    {
        General = 1,
        Optimization = 2,
        Security = 3,
        Performance = 4,
        Compliance = 5
    }

    public enum RecommendationPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    // Additional DTOs for interface implementations
    public class PredictionResult
    {
        public int ModelId { get; set; }
        public bool Success { get; set; }
        public double Confidence { get; set; }
        public string Result { get; set; } = string.Empty;
        public int ProcessingTimeMs { get; set; }
    }

    public class PredictionInputDto
    {
        public Dictionary<string, object> Features { get; set; } = new();
        public string InputType { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class PredictionResultDto
    {
        public string PredictionId { get; set; } = Guid.NewGuid().ToString();
        public int ModelId { get; set; }
        public bool Success { get; set; }
        public double Confidence { get; set; }
        public Dictionary<string, object> Results { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class BatchPredictionResultDto
    {
        public string BatchId { get; set; } = Guid.NewGuid().ToString();
        public int ModelId { get; set; }
        public int TotalPredictions { get; set; }
        public int SuccessfulPredictions { get; set; }
        public List<PredictionResultDto> Results { get; set; } = new();
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    }

    public class AICommandStats
    {
        public int TotalCommands { get; set; }
        public int SuccessfulCommands { get; set; }
        public int FailedCommands { get; set; }
        public double AverageResponseTime { get; set; }
        public int ActiveModels { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class AICommandStatsDto
    {
        public int TotalCommands { get; set; }
        public int SuccessfulCommands { get; set; }
        public int FailedCommands { get; set; }
        public double AverageResponseTime { get; set; }
        public int ActiveModels { get; set; }
        public Dictionary<string, int> CommandTypeBreakdown { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class AIModelDto
    {
        public int ModelId { get; set; }
        public string ModelName { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public ModelStatus Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Configuration { get; set; } = new();
    }

    public class AIModelHealthDto
    {
        public int ModelId { get; set; }
        public string ModelName { get; set; } = string.Empty;
        public bool IsHealthy { get; set; }
        public double ResponseTime { get; set; }
        public string LastError { get; set; } = string.Empty;
        public DateTime LastChecked { get; set; } = DateTime.UtcNow;
    }

    public class MarketTrendRequest
    {
        public string Region { get; set; } = string.Empty;
        public TimeRange TimeRange { get; set; } = new();
        public List<string> PropertyTypes { get; set; } = new();
        public Dictionary<string, object> Filters { get; set; } = new();
    }

    public class MarketTrendAnalysis
    {
        public string Region { get; set; } = string.Empty;
        public TimeRange TimeRange { get; set; } = new();
        public TrendDirection TrendDirection { get; set; }
        public double ConfidenceScore { get; set; }
        public double PriceGrowthRate { get; set; }
        public double VolatilityIndex { get; set; }
        public MarketHealthStatus MarketHealth { get; set; }
        public List<string> KeyInsights { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class EmergentIntelligenceMetrics
    {
        public int ActiveAgents { get; set; }
        public double SwarmCoherence { get; set; }
        public double CollectiveIntelligenceScore { get; set; }
        public int EmergentCapabilities { get; set; }
        public Dictionary<string, double> MetricBreakdown { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    // Duplicate removed - definition already exists above

    public enum ModelStatus
    {
        Created,
        Training,
        Deployed,
        Retired,
        Failed
    }

    public enum TrendDirection
    {
        Upward,
        Downward,
        Stable,
        Volatile
    }

    // Removed duplicate MarketHealthStatus enum - using the complete version below

    public class TimeRange
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public TimeRangeType Type { get; set; }
    }

    public enum TimeRangeType
    {
        Days,
        Weeks,
        Months,
        Quarters,
        Years
    }

    public class TrainingConfigDto
    {
        public string ModelName { get; set; } = string.Empty;
        public Dictionary<string, object> Parameters { get; set; } = new();
        public int Epochs { get; set; } = 10;
        public double LearningRate { get; set; } = 0.001;
        public int BatchSize { get; set; } = 32;
        public string ValidationSplit { get; set; } = "0.2";
        public List<string> Metrics { get; set; } = new();
    }

    public class TrainingStatusDto
    {
        public int ModelId { get; set; }
        public TrainingStatus Status { get; set; }
        public double Progress { get; set; }
        public int EpochsCompleted { get; set; }
        public int TotalEpochs { get; set; }
        public double CurrentLoss { get; set; }
        public double CurrentAccuracy { get; set; }
        public TimeSpan EstimatedTimeRemaining { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    // Revenue Data Service Interface
    public interface IRevenueDataService
    {
        Task<List<RevenueData>> GetHistoricalRevenueDataAsync(string jurisdiction, int months);
        Task<RevenueData> GetCurrentRevenueAsync(string jurisdiction);
    }

    public class RevenueData
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
    }

    public class RevenueDataPoint
    {
        public DateTime Date { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal PropertyTaxRevenue { get; set; }
        public decimal BusinessLicenseRevenue { get; set; }
        public decimal PermitRevenue { get; set; }
        public decimal UtilityRevenue { get; set; }
    }

    public class AISwarmStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public int IdleAgents { get; set; }
        public int BusyAgents { get; set; }
        public double AverageLoad { get; set; }
        public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
        public List<TerraFusion.Abstractions.DTOs.AIAgentStatusDto> AgentStatuses { get; set; } = new();
    }

    public class ROIPredictionResult
    {
        public int PropertyId { get; set; }
        public double PredictedROI { get; set; }
        public double Confidence { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public List<string> InfluencingFactors { get; set; } = new();
        public DateTime PredictionDate { get; set; } = DateTime.UtcNow;
    }

    public class ROIPredictionRequest
    {
        public int PropertyId { get; set; }
        public decimal PropertyValue { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public Dictionary<string, object> PropertyFeatures { get; set; } = new();
    }

    public class EthicalConcern
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime IdentifiedAt { get; set; } = DateTime.UtcNow;
    }

    public class AICommandResultDto
    {
        public Guid CommandId { get; set; } = Guid.NewGuid();
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Dictionary<string, object> Results { get; set; } = new();
        public double ExecutionTimeMs { get; set; }
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
        public Guid ExecutedByAgentId { get; set; } = Guid.NewGuid();
    }

    // Forecast Result Types
    public class TimeSeriesForecastResult
    {
        public double Accuracy { get; set; }
        public List<decimal> Predictions { get; set; } = new();
        public double Confidence { get; set; }
    }

    public class RegressionForecastResult
    {
        public double Accuracy { get; set; }
        public List<decimal> Predictions { get; set; } = new();
        public double Confidence { get; set; }
    }

    public class ForecastResult
    {
        public double OverallConfidence { get; set; }
        public List<decimal> Predictions { get; set; } = new();
    }

    public class ConfidenceInterval
    {
        public decimal LowerBound { get; set; }
        public decimal UpperBound { get; set; }
        public double Confidence { get; set; }
    }

    public class RiskMetrics
    {
        public double VolatilityScore { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
    }

    public class ForecastInsight
    {
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public class SwarmOptimizedForecastResult
    {
        public List<decimal> Predictions { get; set; } = new();
        public List<ForecastPoint> ForecastPoints { get; set; } = new();
        public List<ForecastPoint> ForecastPredictions { get; set; } = new();
        public double OptimizationScore { get; set; }
        public List<string> EmergentPatterns { get; set; } = new();
        public double SwarmConsensus { get; set; }
        public List<string> RevenueOpportunities { get; set; } = new();
        public SwarmPerformanceMetrics SwarmMetrics { get; set; } = new();
    }

    public class ModelPerformanceMetrics
    {
        public double TimeSeriesAccuracy { get; set; }
        public double RegressionAccuracy { get; set; }
        public double SwarmOptimizationScore { get; set; }
        public double EnsembleConfidence { get; set; }
    }

    public class RevenueForecastResult
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public int ForecastPeriod { get; set; }
        public ForecastScenario Scenario { get; set; }
        public DateTime GeneratedAt { get; set; }
        public ForecastResult Forecast { get; set; } = new();
        public List<ConfidenceInterval> ConfidenceIntervals { get; set; } = new();
        public RiskMetrics RiskMetrics { get; set; } = new();
        public List<ForecastInsight> Insights { get; set; } = new();
        public ModelPerformanceMetrics ModelPerformance { get; set; } = new();
    }

    public enum ForecastScenario
    {
        Base,
        Optimistic,
        Pessimistic,
        Conservative
    }

    // Note: TimeRange is already defined earlier in this file

    public class ScenarioForecast
    {
        public ForecastScenario Scenario { get; set; }
        public List<decimal> Predictions { get; set; } = new();
        public double Confidence { get; set; }
        public object Forecast { get; set; } = new();
        public double ProbabilityWeight { get; set; }
        public object ImpactAssessment { get; set; } = new();
    }

    // Marketplace DTOs
    public class PluginSubmissionDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
        public string PublicKeyPem { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }

    // LLM Response DTOs
    public class LLMResponse
    {
        public string Content { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public double ProcessingTimeMs { get; set; }
        public string ModelUsed { get; set; } = string.Empty;
        public string ModelTier { get; set; } = string.Empty;
        public Dictionary<string, object> MultiModalComponents { get; set; } = new();
        public string Reasoning { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string ResponseId { get; set; } = string.Empty;
        public string TextResponse { get; set; } = string.Empty;
        public List<string> Sources { get; set; } = new();
    }

    public class SwarmPerformanceMetrics
    {
        public int ActiveAgents { get; set; }
        public double CollectiveIntelligence { get; set; }
        public double EmergentBehaviorScore { get; set; }
        public double ConsensusLevel { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public int PatternsDiscovered { get; set; }
    }

    public class DateRange
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int DurationDays => (EndDate - StartDate).Days;
    }

    public class MarketTrendsResult
    {
        public string Region { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public double PredictedGrowth { get; set; }
        public List<string> MarketFactors { get; set; } = new();
        public DateTime AnalysisDate { get; set; } = DateTime.UtcNow;
        public string TrendDirection { get; set; } = string.Empty;
    }

    public enum MarketHealthStatus
    {
        Poor,
        Fair,
        Good,
        Strong,
        Excellent
    }
    
    public class EnsembleForecastResult
    {
        public List<decimal> Predictions { get; set; } = new();
        public double Confidence { get; set; }
        public double OverallConfidence { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }
    
    public class AIAgentStatusDto
    {
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public int IdleAgents { get; set; }
        public int BusyAgents { get; set; }
        public double AverageUtilization { get; set; }
        public List<object> Agents { get; set; } = new();
    }
    
    public class ModelPerformance
    {
        public string ModelId { get; set; } = string.Empty;
        public double Accuracy { get; set; }
        public double ResponseTime { get; set; }
        public bool IsAvailable { get; set; }
    }
    
    // Note: AdvancedAI DTOs moved to AdvancedAIDtos.cs to avoid duplicates
}