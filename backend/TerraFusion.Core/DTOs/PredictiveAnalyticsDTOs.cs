using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    public class RevenueForecastResult
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public int ForecastPeriod { get; set; }
        public ForecastScenario Scenario { get; set; }
        public DateTime GeneratedAt { get; set; }
        public EnsembleForecast Forecast { get; set; } = new();
        public List<ConfidenceInterval> ConfidenceIntervals { get; set; } = new();
        public RiskMetrics RiskMetrics { get; set; } = new();
        public List<ForecastInsight> Insights { get; set; } = new();
        public ModelPerformanceMetrics ModelPerformance { get; set; } = new();
    }

    public class EnsembleForecast
    {
        public List<ForecastPoint> Predictions { get; set; } = new();
        public double OverallConfidence { get; set; }
        public string EnsembleMethod { get; set; } = string.Empty;
        public Dictionary<string, double> ModelWeights { get; set; } = new();
        public List<string> ModelContributions { get; set; } = new();
    }

    public class ForecastPoint
    {
        public DateTime Date { get; set; }
        public double Value { get; set; }
        public double LowerBound { get; set; }
        public double UpperBound { get; set; }
        public float Confidence { get; set; }
        public Dictionary<string, double> ComponentBreakdown { get; set; } = new();
    }

    public class TimeSeriesForecastResult
    {
        public List<ForecastPoint> Predictions { get; set; } = new();
        public double Accuracy { get; set; }
        public string ModelType { get; set; } = string.Empty;
        public bool SeasonalityDetected { get; set; }
        public TrendDirection TrendDirection { get; set; }
        public Dictionary<string, double> ModelParameters { get; set; } = new();
    }

    public class RegressionForecastResult
    {
        public List<ForecastPoint> Predictions { get; set; } = new();
        public double Accuracy { get; set; }
        public string ModelType { get; set; } = string.Empty;
        public Dictionary<string, double> FeatureImportance { get; set; } = new();
        public double RSquared { get; set; }
        public double MeanAbsoluteError { get; set; }
    }

    public class SwarmOptimizedForecastResult
    {
        public List<ForecastPoint> Predictions { get; set; } = new();
        public double OptimizationScore { get; set; }
        public List<EmergentPattern> EmergentPatterns { get; set; } = new();
        public double SwarmConsensus { get; set; }
        public List<RevenueOpportunity> RevenueOpportunities { get; set; } = new();
        public SwarmPerformanceMetrics SwarmMetrics { get; set; } = new();
    }

    public class EmergentPattern
    {
        public string PatternType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public DateTime DetectedAt { get; set; }
        public Dictionary<string, object> Parameters { get; set; } = new();
        public List<string> AffectedRevenueStreams { get; set; } = new();
    }

    public class RevenueOpportunity
    {
        public string OpportunityType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double PotentialIncrease { get; set; }
        public double ImplementationCost { get; set; }
        public double ROI { get; set; }
        public int ImplementationTimeMonths { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public List<string> RequiredActions { get; set; } = new();
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

    public class ConfidenceInterval
    {
        public DateTime Date { get; set; }
        public double LowerBound { get; set; }
        public double UpperBound { get; set; }
        public double ConfidenceLevel { get; set; }
        public string IntervalType { get; set; } = string.Empty;
    }

    public class RiskMetrics
    {
        public double VolatilityScore { get; set; }
        public double DownsideRisk { get; set; }
        public double UpsideRisk { get; set; }
        public double ValueAtRisk { get; set; }
        public double ConditionalValueAtRisk { get; set; }
        public List<RiskFactor> RiskFactors { get; set; } = new();
        public string OverallRiskLevel { get; set; } = string.Empty;
    }

    public class RiskFactor
    {
        public string FactorName { get; set; } = string.Empty;
        public double Impact { get; set; }
        public double Probability { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<string> MitigationStrategies { get; set; } = new();
    }

    public class ForecastInsight
    {
        public string InsightType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string Priority { get; set; } = string.Empty;
        public List<string> RecommendedActions { get; set; } = new();
        public Dictionary<string, object> SupportingData { get; set; } = new();
    }

    public class ModelPerformanceMetrics
    {
        public double TimeSeriesAccuracy { get; set; }
        public double RegressionAccuracy { get; set; }
        public double SwarmOptimizationScore { get; set; }
        public double EnsembleConfidence { get; set; }
        public Dictionary<string, double> IndividualModelScores { get; set; } = new();
        public string BestPerformingModel { get; set; } = string.Empty;
    }

    public class TrendAnalysisResult
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public DateRange AnalysisTimeRange { get; set; } = new();
        public DateTime GeneratedAt { get; set; }
        public List<TrendInsight> Trends { get; set; } = new();
        public List<CrossCorrelation> CrossCorrelations { get; set; } = new();
        public List<Anomaly> Anomalies { get; set; } = new();
        public List<KeyInsight> KeyInsights { get; set; } = new();
        public List<RecommendedAction> RecommendedActions { get; set; } = new();
    }

    public class TrendAnalysisRequest
    {
        [Required]
        public string Jurisdiction { get; set; } = string.Empty;
        [Required]
        public DateRange TimeRange { get; set; } = new();
        public bool AnalyzeRevenueCategories { get; set; } = true;
        public bool AnalyzePropertyValues { get; set; } = true;
        public bool AnalyzeEconomicIndicators { get; set; } = true;
        public bool AnalyzeDemographics { get; set; } = false;
        public List<string> CustomMetrics { get; set; } = new List<string>();
    }

    public class TrendInsight
    {
        public string Category { get; set; } = string.Empty;
        public string MetricName { get; set; } = string.Empty;
        public TrendDirection Direction { get; set; }
        public double Magnitude { get; set; }
        public double Confidence { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<TrendBreakpoint> Breakpoints { get; set; } = new();
        public Dictionary<string, double> Statistics { get; set; } = new();
    }

    public class TrendBreakpoint
    {
        public DateTime Date { get; set; }
        public double ValueBefore { get; set; }
        public double ValueAfter { get; set; }
        public string ChangeType { get; set; } = string.Empty;
        public double Significance { get; set; }
        public string PossibleCause { get; set; } = string.Empty;
    }

    public class CrossCorrelation
    {
        public string Metric1 { get; set; } = string.Empty;
        public string Metric2 { get; set; } = string.Empty;
        public double CorrelationCoefficient { get; set; }
        public double PValue { get; set; }
        public int LagDays { get; set; }
        public string RelationshipType { get; set; } = string.Empty;
        public string Interpretation { get; set; } = string.Empty;
    }

    public class Anomaly
    {
        public DateTime Date { get; set; }
        public string MetricName { get; set; } = string.Empty;
        public double ActualValue { get; set; }
        public double ExpectedValue { get; set; }
        public double AnomalyScore { get; set; }
        public string AnomalyType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> PossibleCauses { get; set; } = new();
        public bool RequiresInvestigation { get; set; }
    }

    public class KeyInsight
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public double Impact { get; set; }
        public double Confidence { get; set; }
        public List<string> SupportingEvidence { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class RecommendedAction
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public double ExpectedImpact { get; set; }
        public int ImplementationTimeWeeks { get; set; }
        public double EstimatedCost { get; set; }
        public List<string> Prerequisites { get; set; } = new();
        public List<string> RiskFactors { get; set; } = new();
        public string ResponsibleDepartment { get; set; } = string.Empty;
    }

    public class PredictiveInsightsResult
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public List<PredictiveInsight> Insights { get; set; } = new();
        public List<StrategicRecommendation> StrategicRecommendations { get; set; } = new();
        public double ConfidenceScore { get; set; }
        public List<ActionPriority> ActionPriorities { get; set; } = new();
        public ExpectedImpactSummary ExpectedImpact { get; set; } = new();
    }

    public class PredictiveInsightsRequest
    {
        [Required]
        public string Jurisdiction { get; set; } = string.Empty;
        public DateRange AnalysisTimeRange { get; set; } = new();
        public int ForecastHorizonMonths { get; set; } = 12;
        public List<string> FocusAreas { get; set; } = new List<string>();
        public bool IncludeRiskAssessment { get; set; } = true;
        public bool IncludeMarketAnalysis { get; set; } = true;
        public bool IncludeEfficiencyAnalysis { get; set; } = true;
    }

    public class PredictiveInsight
    {
        public string InsightId { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public double PotentialImpact { get; set; }
        public DateTime PredictedTimeframe { get; set; }
        public List<string> KeyFactors { get; set; } = new();
        public Dictionary<string, double> Metrics { get; set; } = new();
        public List<string> RecommendedActions { get; set; } = new();
    }

    public class StrategicRecommendation
    {
        public string RecommendationId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string StrategicArea { get; set; } = string.Empty;
        public double ExpectedROI { get; set; }
        public int ImplementationTimeMonths { get; set; }
        public double InvestmentRequired { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public List<string> Dependencies { get; set; } = new();
        public List<string> SuccessMetrics { get; set; } = new();
    }

    public class ActionPriority
    {
        public string ActionId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int Priority { get; set; }
        public double UrgencyScore { get; set; }
        public double ImpactScore { get; set; }
        public double FeasibilityScore { get; set; }
        public double CompositeScore { get; set; }
        public string Rationale { get; set; } = string.Empty;
    }

    public class ExpectedImpactSummary
    {
        public double TotalRevenueImpact { get; set; }
        public double CostSavings { get; set; }
        public double EfficiencyGains { get; set; }
        public double RiskReduction { get; set; }
        public Dictionary<string, double> CategoryImpacts { get; set; } = new();
        public string OverallAssessment { get; set; } = string.Empty;
    }

    public class ScenarioAnalysisResult
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public List<ScenarioForecast> Scenarios { get; set; } = new();
        public EnsembleForecast WeightedForecast { get; set; } = new();
        public ScenarioRiskAnalysis RiskAnalysis { get; set; } = new();
        public OptimalStrategy RecommendedStrategy { get; set; } = new();
        public List<ContingencyPlan> ContingencyPlans { get; set; } = new();
    }

    public class ScenarioForecast
    {
        public ForecastScenario Scenario { get; set; }
        public RevenueForecastResult Forecast { get; set; } = new();
        public double ProbabilityWeight { get; set; }
        public ScenarioImpactAssessment ImpactAssessment { get; set; } = new();
    }

    public class ScenarioRiskAnalysis
    {
        public double WorstCaseRevenue { get; set; }
        public double BestCaseRevenue { get; set; }
        public double MostLikelyRevenue { get; set; }
        public double StandardDeviation { get; set; }
        public List<ScenarioRisk> Risks { get; set; } = new();
        public string OverallRiskProfile { get; set; } = string.Empty;
    }

    public class ScenarioRisk
    {
        public string RiskName { get; set; } = string.Empty;
        public double Probability { get; set; }
        public double Impact { get; set; }
        public List<ForecastScenario> AffectedScenarios { get; set; } = new();
        public List<string> MitigationOptions { get; set; } = new();
    }

    public class ScenarioImpactAssessment
    {
        public double RevenueVariance { get; set; }
        public double ServiceImpact { get; set; }
        public double BudgetaryImpact { get; set; }
        public List<string> KeyImplications { get; set; } = new();
        public string AdaptationStrategy { get; set; } = string.Empty;
    }

    public class OptimalStrategy
    {
        public string StrategyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> KeyComponents { get; set; } = new();
        public double ExpectedOutcome { get; set; }
        public double ConfidenceLevel { get; set; }
        public List<string> CriticalSuccessFactors { get; set; } = new();
        public Dictionary<string, string> ImplementationSteps { get; set; } = new();
    }

    public class ContingencyPlan
    {
        public string PlanName { get; set; } = string.Empty;
        public string TriggerCondition { get; set; } = string.Empty;
        public List<string> Actions { get; set; } = new();
        public string ResponsibleParty { get; set; } = string.Empty;
        public int ActivationTimeframe { get; set; }
        public double EstimatedCost { get; set; }
        public string ExpectedOutcome { get; set; } = string.Empty;
    }

    public class DateRange
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        // Legacy compatibility properties
        public DateTime Start { get => StartDate; set => StartDate = value; }
        public DateTime End { get => EndDate; set => EndDate = value; }
    }

    public enum ForecastScenario
    {
        Base,
        Optimistic,
        Pessimistic,
        Conservative,
        Aggressive,
        Economic_Downturn,
        Economic_Growth,
        Policy_Change,
        Market_Disruption
    }

    public enum TrendDirection
    {
        Increasing,
        Decreasing,
        Stable,
        Volatile,
        Cyclical
    }
}
