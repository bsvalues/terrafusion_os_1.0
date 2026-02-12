using System;
using System.Collections.Generic;

namespace TerraFusion.Native.Shell.Models.AI
{
    #region Phase 4D: Autonomous Decision Engine Event Arguments

    /// <summary>
    /// Event arguments for autonomous decision events
    /// </summary>
    public class AutonomousDecisionEventArgs : EventArgs
    {
        public string SessionId { get; set; } = string.Empty;
        public string DecisionType { get; set; } = string.Empty;
        public string DecisionOutcome { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public bool QuantumEnhancementApplied { get; set; }
        public bool AutonomousCapabilitiesActivated { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public List<string> DecisionFactors { get; set; } = new();
    }

    /// <summary>
    /// Event arguments for predictive analytics events
    /// </summary>
    public class PredictiveAnalyticsEventArgs : EventArgs
    {
        public string SessionId { get; set; } = string.Empty;
        public string AnalysisDomain { get; set; } = string.Empty;
        public TimeSpan PredictionHorizon { get; set; }
        public double AccuracyScore { get; set; }
        public bool QuantumForecastingApplied { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public List<string> PredictionInsights { get; set; } = new();
    }

    /// <summary>
    /// Event arguments for policy recommendation events
    /// </summary>
    public class PolicyRecommendationEventArgs : EventArgs
    {
        public string SessionId { get; set; } = string.Empty;
        public string PolicyDomain { get; set; } = string.Empty;
        public string PolicyScope { get; set; } = string.Empty;
        public double RecommendationStrength { get; set; }
        public bool TranscendentAnalysisApplied { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public List<string> PolicyInsights { get; set; } = new();
    }

    /// <summary>
    /// Event arguments for decision confidence events
    /// </summary>
    public class DecisionConfidenceEventArgs : EventArgs
    {
        public string SessionId { get; set; } = string.Empty;
        public int FactorCount { get; set; }
        public double ConfidenceScore { get; set; }
        public bool MultiDimensionalAnalysisApplied { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string RiskAssessment { get; set; } = string.Empty;
    }

    #endregion

    #region Phase 4D: Request and Result Models

    /// <summary>
    /// Request model for autonomous decisions
    /// </summary>
    public class DecisionRequest
    {
        public string DecisionType { get; set; } = string.Empty;
        public string ProblemDescription { get; set; } = string.Empty;
        public DecisionPriority Priority { get; set; }
        public bool EnableQuantumEnhancement { get; set; } = true;
        public List<string> DecisionConstraints { get; set; } = new();
        public Dictionary<string, object> DecisionContext { get; set; } = new();
        public TimeSpan MaxDecisionTime { get; set; } = TimeSpan.FromMinutes(5);
        public double MinConfidenceThreshold { get; set; } = 0.95;
    }

    /// <summary>
    /// Result model for autonomous decisions
    /// </summary>
    public class AutonomousDecisionResult
    {
        public bool Success { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string DecisionOutcome { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public List<DecisionFactor> DecisionFactors { get; set; } = new();
        public double QuantumEnhancementLevel { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public Dictionary<string, double> DecisionMetrics { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Request model for predictive analytics
    /// </summary>
    public class PredictiveRequest
    {
        public string AnalysisDomain { get; set; } = string.Empty;
        public TimeSpan PredictionHorizon { get; set; }
        public PredictiveAnalysisType AnalysisType { get; set; }
        public bool EnableQuantumForecasting { get; set; } = true;
        public List<string> DataSources { get; set; } = new();
        public Dictionary<string, object> AnalysisParameters { get; set; } = new();
        public double MinAccuracyThreshold { get; set; } = 0.95;
    }

    /// <summary>
    /// Result model for predictive analytics
    /// </summary>
    public class PredictiveAnalyticsResult
    {
        public bool Success { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public List<string> Predictions { get; set; } = new();
        public double AccuracyScore { get; set; }
        public Dictionary<string, double> ConfidenceIntervals { get; set; } = new();
        public double QuantumForecastingLevel { get; set; }
        public DateTime PredictedCompletionTime { get; set; }
        public Dictionary<string, double> ForecastingMetrics { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Request model for policy recommendations
    /// </summary>
    public class PolicyRequest
    {
        public string PolicyDomain { get; set; } = string.Empty;
        public string PolicyScope { get; set; } = string.Empty;
        public PolicyType PolicyType { get; set; }
        public bool EnableTranscendentAnalysis { get; set; } = true;
        public List<string> PolicyObjectives { get; set; } = new();
        public Dictionary<string, object> PolicyContext { get; set; } = new();
        public TimeSpan ImplementationHorizon { get; set; } = TimeSpan.FromDays(90);
    }

    /// <summary>
    /// Result model for policy recommendations
    /// </summary>
    public class PolicyRecommendationResult
    {
        public bool Success { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public List<string> PolicyRecommendations { get; set; } = new();
        public double RecommendationStrength { get; set; }
        public Dictionary<string, double> ImpactAnalysis { get; set; } = new();
        public TimeSpan ImplementationTimeline { get; set; }
        public List<string> RiskFactors { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Result model for decision confidence
    /// </summary>
    public class DecisionConfidenceResult
    {
        public bool Success { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public Dictionary<string, double> ConfidenceFactors { get; set; } = new();
        public string RiskAssessment { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
        public Dictionary<string, double> RiskMetrics { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Result model for pattern recognition
    /// </summary>
    public class PatternRecognitionResult
    {
        public bool Success { get; set; }
        public string AnalysisId { get; set; } = string.Empty;
        public List<string> RecognizedPatterns { get; set; } = new();
        public double PatternConfidence { get; set; }
        public Dictionary<string, double> TrendAnalysis { get; set; } = new();
        public List<string> AnomalyDetection { get; set; } = new();
        public Dictionary<string, double> PatternMetrics { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }

    #endregion

    #region Phase 4D: Session and State Models

    /// <summary>
    /// Autonomous decision session model
    /// </summary>
    public class AutonomousDecisionSession
    {
        public string SessionId { get; set; } = string.Empty;
        public DecisionRequest Request { get; set; } = new();
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public double DecisionProgress { get; set; }
        public DecisionStatus Status { get; set; }
        public bool QuantumEnhancementActive { get; set; }
        public int FactorsAnalyzed { get; set; }
        public List<string> DecisionSteps { get; set; } = new();
        public Dictionary<string, double> SessionMetrics { get; set; } = new();
    }

    /// <summary>
    /// Predictive analytics session model
    /// </summary>
    public class PredictiveAnalyticsSession
    {
        public string SessionId { get; set; } = string.Empty;
        public PredictiveRequest Request { get; set; } = new();
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public double AnalysisProgress { get; set; }
        public PredictiveStatus Status { get; set; }
        public bool QuantumForecasting { get; set; }
        public List<string> AnalysisSteps { get; set; } = new();
        public Dictionary<string, double> ForecastingMetrics { get; set; } = new();
    }

    /// <summary>
    /// Policy recommendation session model
    /// </summary>
    public class PolicyRecommendationSession
    {
        public string SessionId { get; set; } = string.Empty;
        public PolicyRequest Request { get; set; } = new();
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public double RecommendationProgress { get; set; }
        public PolicyStatus Status { get; set; }
        public bool TranscendentAnalysis { get; set; }
        public List<string> AnalysisSteps { get; set; } = new();
        public Dictionary<string, double> PolicyMetrics { get; set; } = new();
    }

    /// <summary>
    /// Predictive model for decision support
    /// </summary>
    public class PredictiveModel
    {
        public string ModelId { get; set; } = string.Empty;
        public string ModelType { get; set; } = string.Empty;
        public double Accuracy { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastOptimized { get; set; }
        public Dictionary<string, double> ModelParameters { get; set; } = new();
        public List<string> SupportedDomains { get; set; } = new();
    }

    /// <summary>
    /// Decision pattern model
    /// </summary>
    public class DecisionPattern
    {
        public string PatternId { get; set; } = string.Empty;
        public string PatternType { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public DateTime IdentifiedAt { get; set; }
        public List<string> PatternIndicators { get; set; } = new();
        public Dictionary<string, double> PatternMetrics { get; set; } = new();
    }

    /// <summary>
    /// Decision factor model
    /// </summary>
    public class DecisionFactor
    {
        public string FactorName { get; set; } = string.Empty;
        public double Weight { get; set; }
        public double Score { get; set; }
        public string Description { get; set; } = string.Empty;
        public FactorType Type { get; set; }
        public Dictionary<string, object> FactorData { get; set; } = new();
    }

    /// <summary>
    /// Data point for pattern analysis
    /// </summary>
    public class DataPoint
    {
        public DateTime Timestamp { get; set; }
        public double Value { get; set; }
        public string Category { get; set; } = string.Empty;
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    #endregion

    #region Phase 4D: Metrics and Monitoring Models

    /// <summary>
    /// Comprehensive decision system metrics
    /// </summary>
    public class DecisionMetrics
    {
        public int TotalActiveDecisionSessions { get; set; }
        public int TotalActivePredictiveSessions { get; set; }
        public int TotalActivePolicySession { get; set; }
        public int TotalPredictiveModels { get; set; }
        public int TotalRecognizedPatterns { get; set; }
        public double AverageDecisionConfidence { get; set; }
        public double PredictiveAccuracy { get; set; }
        public double PolicyRecommendationStrength { get; set; }
        public double AutonomousDecisionRate { get; set; }
        public double QuantumEnhancementEfficiency { get; set; }
        public int PatternRecognitionCapacity { get; set; }
        public string DecisionProcessingSpeed { get; set; } = string.Empty;
        public TimeSpan SystemUptime { get; set; }
        public DateTime LastOptimization { get; set; }
    }

    /// <summary>
    /// Active decision session for monitoring
    /// </summary>
    public class ActiveDecisionSession
    {
        public string SessionId { get; set; } = string.Empty;
        public DecisionSessionType SessionType { get; set; }
        public DateTime StartedAt { get; set; }
        public double Progress { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool QuantumEnhanced { get; set; }
        public Dictionary<string, object> SessionData { get; set; } = new();
    }

    /// <summary>
    /// Predictive model health assessment
    /// </summary>
    public class PredictiveModelHealth
    {
        public double OverallHealthScore { get; set; }
        public int TotalModels { get; set; }
        public double ModelAccuracy { get; set; }
        public double PredictionReliability { get; set; }
        public double ModelStability { get; set; }
        public int ForecastingCapacity { get; set; }
        public string ProcessingSpeed { get; set; } = string.Empty;
        public double MemoryEfficiency { get; set; }
        public double ModelConvergence { get; set; }
        public DateTime LastHealthCheck { get; set; }
        public HealthTrend HealthTrend { get; set; }
        public List<string> CriticalIssues { get; set; } = new();
    }

    /// <summary>
    /// Decision history report model
    /// </summary>
    public class DecisionHistoryReport
    {
        public string SessionId { get; set; } = string.Empty;
        public string DecisionType { get; set; } = string.Empty;
        public string DecisionOutcome { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public int FactorsAnalyzed { get; set; }
        public bool QuantumEnhancement { get; set; }
        public DateTime DecisionTimestamp { get; set; } = DateTime.UtcNow;
        public List<string> KeyInsights { get; set; } = new();
    }

    #endregion

    #region Phase 4D: Enumerations

    /// <summary>
    /// Decision priority levels
    /// </summary>
    public enum DecisionPriority
    {
        Low,
        Medium,
        High,
        Critical,
        Emergency,
        Transcendent
    }

    /// <summary>
    /// Predictive analysis types
    /// </summary>
    public enum PredictiveAnalysisType
    {
        Trend,
        Forecast,
        Classification,
        Regression,
        Clustering,
        AnomalyDetection,
        Quantum
    }

    /// <summary>
    /// Policy types
    /// </summary>
    public enum PolicyType
    {
        Operational,
        Strategic,
        Regulatory,
        Emergency,
        Innovation,
        Transcendent
    }

    /// <summary>
    /// Decision session types
    /// </summary>
    public enum DecisionSessionType
    {
        AutonomousDecision,
        PredictiveAnalytics,
        PolicyRecommendation,
        PatternRecognition,
        ConfidenceAnalysis
    }

    /// <summary>
    /// Decision status
    /// </summary>
    public enum DecisionStatus
    {
        Pending,
        Analyzing,
        Processing,
        Optimizing,
        Completed,
        Transcendent
    }

    /// <summary>
    /// Predictive status
    /// </summary>
    public enum PredictiveStatus
    {
        Initializing,
        Processing,
        Forecasting,
        Validating,
        Completed,
        Transcendent
    }

    /// <summary>
    /// Policy status
    /// </summary>
    public enum PolicyStatus
    {
        Analyzing,
        Evaluating,
        Optimizing,
        Recommending,
        Completed,
        Transcendent
    }

    /// <summary>
    /// Decision factor types
    /// </summary>
    public enum FactorType
    {
        Risk,
        Benefit,
        Resource,
        Timeline,
        Impact,
        Compliance,
        Quantum
    }

    #endregion
}
