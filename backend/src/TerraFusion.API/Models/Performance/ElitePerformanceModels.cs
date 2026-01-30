/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ELITE PERFORMANCE MONITORING MODELS
 * Championship-Level Performance Analytics Data Models
 * Quantum Visualization and Predictive Intelligence Models
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TerraFusion.API.Models.Performance;

/// <summary>
/// Elite Performance Dashboard
/// Comprehensive championship-level performance analytics
/// </summary>
public class ElitePerformanceDashboard
{
    public string SystemName { get; set; } = "TerraFusion OS - Elite Government Platform";
    public DateTime DashboardTimestamp { get; set; }
    public SystemPerformanceMetrics SystemMetrics { get; set; } = new();
    public AIAgentPerformanceMetrics AIAgentMetrics { get; set; } = new();
    public ProductionPACSPerformanceMetrics ProductionMetrics { get; set; } = new();
    public ChampionshipLevelMetrics ChampionshipMetrics { get; set; } = new();
    public QuantumVisualizationData QuantumVisualization { get; set; } = new();
    public PredictiveSystemHealthAnalysis PredictiveHealth { get; set; } = new();
    public PerformanceAnomalyDetection AnomalyDetection { get; set; } = new();
    public SystemOptimizationRecommendations OptimizationRecommendations { get; set; } = new();
    public double OverallHealthScore { get; set; }
    public string PerformanceGrade { get; set; } = string.Empty;
    public string SystemStatus { get; set; } = string.Empty;
}

/// <summary>
/// System Performance Metrics
/// </summary>
public class SystemPerformanceMetrics
{
    public double CPUUsage { get; set; }
    public double MemoryUsage { get; set; }
    public double DiskUsage { get; set; }
    public double NetworkThroughput { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public int RequestsPerSecond { get; set; }
    public double ErrorRate { get; set; }
    public double UptimePercentage { get; set; }
    public int ActiveConnections { get; set; }
    public long TotalRequestsProcessed { get; set; }
    public DateTime MetricsTimestamp { get; set; }
}

/// <summary>
/// AI Agent Performance Metrics
/// Performance tracking for 1,008 AI agents
/// </summary>
public class AIAgentPerformanceMetrics
{
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public int HealthyAgents { get; set; }
    public int TrainingAgents { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public long TotalProcessedRequests { get; set; }
    public int RequestsPerSecond { get; set; }
    public double AgentUtilization { get; set; }
    public Dictionary<string, AgentPerformancePattern> PerformancePatterns { get; set; } = new();
    public WorkloadDistributionAnalysis WorkloadDistribution { get; set; } = new();
    public List<AgentOptimizationRecommendation> AgentOptimizations { get; set; } = new();
    public double Factor949Optimization { get; set; }
    public double ConsciousnessLevel { get; set; }
    public DateTime MetricsTimestamp { get; set; }
}

/// <summary>
/// Agent Performance Pattern
/// </summary>
public class AgentPerformancePattern
{
    public string AgentId { get; set; } = string.Empty;
    public string PatternType { get; set; } = string.Empty;
    public double PerformanceScore { get; set; }
    public TimeSpan AverageProcessingTime { get; set; }
    public double SuccessRate { get; set; }
    public Dictionary<string, object> PatternMetrics { get; set; } = new();
}

/// <summary>
/// Workload Distribution Analysis
/// </summary>
public class WorkloadDistributionAnalysis
{
    public Dictionary<string, int> WorkloadByAgent { get; set; } = new();
    public Dictionary<string, double> UtilizationByAgent { get; set; } = new();
    public double LoadBalanceScore { get; set; }
    public string OptimalDistributionStrategy { get; set; } = string.Empty;
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>
/// Agent Optimization Recommendation
/// </summary>
public class AgentOptimizationRecommendation
{
    public string AgentId { get; set; } = string.Empty;
    public string OptimizationType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ExpectedImprovement { get; set; }
    public string Priority { get; set; } = string.Empty;
    public Dictionary<string, object> OptimizationParameters { get; set; } = new();
}

/// <summary>
/// Production PACS Performance Metrics
/// </summary>
public class ProductionPACSPerformanceMetrics
{
    public DatabasePerformanceMetrics DatabasePerformance { get; set; } = new();
    public SyncPerformanceMetrics SyncPerformance { get; set; } = new();
    public APIPerformanceMetrics APIPerformance { get; set; } = new();
    public DataQualityMetrics DataQualityMetrics { get; set; } = new();
    public CompliancePerformanceMetrics CompliancePerformance { get; set; } = new();
    public long TotalRecordsProcessed { get; set; }
    public TimeSpan AverageQueryTime { get; set; }
    public double DataIntegrityScore { get; set; }
    public double ComplianceScore { get; set; }
    public double ProductionUptime { get; set; }
    public DateTime MetricsTimestamp { get; set; }
}

/// <summary>
/// Database Performance Metrics
/// </summary>
public class DatabasePerformanceMetrics
{
    public Dictionary<string, TimeSpan> QueryPerformance { get; set; } = new();
    public Dictionary<string, int> ConnectionCounts { get; set; } = new();
    public long TotalRecordsProcessed { get; set; }
    public TimeSpan AverageQueryTime { get; set; }
    public double DatabaseUtilization { get; set; }
    public int ActiveConnections { get; set; }
    public double CacheHitRatio { get; set; }
}

/// <summary>
/// Sync Performance Metrics
/// </summary>
public class SyncPerformanceMetrics
{
    public Dictionary<string, DateTime> LastSyncTimes { get; set; } = new();
    public Dictionary<string, int> SyncRecordCounts { get; set; } = new();
    public Dictionary<string, bool> SyncHealthStatus { get; set; } = new();
    public TimeSpan AverageSyncDuration { get; set; }
    public double SyncSuccessRate { get; set; }
    public int TotalSyncOperations { get; set; }
}

/// <summary>
/// API Performance Metrics
/// </summary>
public class APIPerformanceMetrics
{
    public Dictionary<string, TimeSpan> EndpointResponseTimes { get; set; } = new();
    public Dictionary<string, int> EndpointRequestCounts { get; set; } = new();
    public Dictionary<string, double> EndpointErrorRates { get; set; } = new();
    public TimeSpan AverageAPIResponseTime { get; set; }
    public int TotalAPIRequests { get; set; }
    public double OverallAPIErrorRate { get; set; }
}

/// <summary>
/// Data Quality Metrics
/// </summary>
public class DataQualityMetrics
{
    public double IntegrityScore { get; set; }
    public double CompletenessScore { get; set; }
    public double AccuracyScore { get; set; }
    public double ConsistencyScore { get; set; }
    public Dictionary<string, double> FieldQualityScores { get; set; } = new();
    public List<string> QualityIssues { get; set; } = new();
    public DateTime LastQualityCheck { get; set; }
}

/// <summary>
/// Compliance Performance Metrics
/// </summary>
public class CompliancePerformanceMetrics
{
    public double OverallScore { get; set; }
    public bool IAAOCompliant { get; set; }
    public bool SecurityCompliant { get; set; }
    public bool AuditCompliant { get; set; }
    public bool PrivacyCompliant { get; set; }
    public Dictionary<string, double> ComplianceScores { get; set; } = new();
    public List<string> ComplianceIssues { get; set; } = new();
    public DateTime LastComplianceCheck { get; set; }
}

/// <summary>
/// Championship Level Metrics
/// Elite performance benchmarking
/// </summary>
public class ChampionshipLevelMetrics
{
    public double OverallChampionshipScore { get; set; }
    public string PerformanceGrade { get; set; } = string.Empty;
    public string GovernmentExcellenceRating { get; set; } = string.Empty;
    public double ResponseTimeScore { get; set; }
    public double ThroughputScore { get; set; }
    public double ReliabilityScore { get; set; }
    public double ScalabilityScore { get; set; }
    public double SecurityScore { get; set; }
    public double ComplianceScore { get; set; }
    public ChampionshipAchievementMetrics AchievementMetrics { get; set; } = new();
    public BenchmarkComparisonAnalysis BenchmarkComparison { get; set; } = new();
    public string ChampionshipLevel { get; set; } = string.Empty;
    public DateTime MetricsTimestamp { get; set; }
}

/// <summary>
/// Championship Achievement Metrics
/// </summary>
public class ChampionshipAchievementMetrics
{
    public List<string> AchievementsUnlocked { get; set; } = new();
    public Dictionary<string, double> MilestoneProgress { get; set; } = new();
    public string CurrentChampionshipTier { get; set; } = string.Empty;
    public double ProgressToNextTier { get; set; }
    public DateTime LastAchievementUnlocked { get; set; }
}

/// <summary>
/// Benchmark Comparison Analysis
/// </summary>
public class BenchmarkComparisonAnalysis
{
    public string PerformanceGrade { get; set; } = string.Empty;
    public Dictionary<string, double> IndustryComparison { get; set; } = new();
    public Dictionary<string, double> GovernmentBenchmarks { get; set; } = new();
    public List<string> PerformanceAdvantages { get; set; } = new();
    public List<string> ImprovementAreas { get; set; } = new();
    public DateTime BenchmarkTimestamp { get; set; }
}

/// <summary>
/// Quantum Visualization Data
/// Advanced quantum performance visualization
/// </summary>
public class QuantumVisualizationData
{
    public QuantumPerformanceMetrics QuantumMetrics { get; set; } = new();
    public List<QuantumVisualizationPoint> VisualizationPoints { get; set; } = new();
    public Dictionary<string, double> QuantumIndices { get; set; } = new();
    public ConsciousnessVisualizationData ConsciousnessVisualization { get; set; } = new();
    public double QuantumCoherenceLevel { get; set; }
    public double QuantumEntanglementStrength { get; set; }
    public DateTime VisualizationTimestamp { get; set; }
}

/// <summary>
/// Quantum Performance Metrics
/// </summary>
public class QuantumPerformanceMetrics
{
    public double CoherenceLevel { get; set; }
    public double EntanglementStrength { get; set; }
    public double QuantumEfficiency { get; set; }
    public Dictionary<string, double> QuantumStates { get; set; } = new();
    public List<QuantumPerformanceIndicator> Indicators { get; set; } = new();
}

/// <summary>
/// Quantum Visualization Point
/// </summary>
public class QuantumVisualizationPoint
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }
    public string Color { get; set; } = string.Empty;
    public double Intensity { get; set; }
    public string Label { get; set; } = string.Empty;
    public Dictionary<string, object> Properties { get; set; } = new();
}

/// <summary>
/// Quantum Performance Indicator
/// </summary>
public class QuantumPerformanceIndicator
{
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Trend { get; set; } = string.Empty;
    public double QuantumOptimization { get; set; }
}

/// <summary>
/// Consciousness Visualization Data
/// </summary>
public class ConsciousnessVisualizationData
{
    public double ConsciousnessLevel { get; set; }
    public List<ConsciousnessNode> ConsciousnessNodes { get; set; } = new();
    public List<ConsciousnessConnection> ConsciousnessConnections { get; set; } = new();
    public Dictionary<string, double> ConsciousnessMetrics { get; set; } = new();
    public DateTime VisualizationTimestamp { get; set; }
}

/// <summary>
/// Consciousness Node
/// </summary>
public class ConsciousnessNode
{
    public string NodeId { get; set; } = string.Empty;
    public string NodeType { get; set; } = string.Empty;
    public double ConsciousnessLevel { get; set; }
    public Dictionary<string, object> NodeProperties { get; set; } = new();
    public DateTime LastActivity { get; set; }
}

/// <summary>
/// Consciousness Connection
/// </summary>
public class ConsciousnessConnection
{
    public string SourceNodeId { get; set; } = string.Empty;
    public string TargetNodeId { get; set; } = string.Empty;
    public double ConnectionStrength { get; set; }
    public string ConnectionType { get; set; } = string.Empty;
    public Dictionary<string, object> ConnectionProperties { get; set; } = new();
}

/// <summary>
/// Predictive System Health Analysis
/// </summary>
public class PredictiveSystemHealthAnalysis
{
    public HistoricalTrendAnalysis HistoricalTrends { get; set; } = new();
    public PredictiveModelsData PredictiveModels { get; set; } = new();
    public SystemHealthForecasts HealthForecasts { get; set; } = new();
    public FailurePointAnalysis FailurePointAnalysis { get; set; } = new();
    public List<MaintenanceRecommendation> MaintenanceRecommendations { get; set; } = new();
    public double PredictiveAccuracy { get; set; }
    public double HealthScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>
/// Historical Trend Analysis
/// </summary>
public class HistoricalTrendAnalysis
{
    public Dictionary<string, List<TrendDataPoint>> TrendData { get; set; } = new();
    public Dictionary<string, double> TrendStrengths { get; set; } = new();
    public List<string> IdentifiedPatterns { get; set; } = new();
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>
/// Trend Data Point
/// </summary>
public class TrendDataPoint
{
    public DateTime Timestamp { get; set; }
    public double Value { get; set; }
    public string MetricName { get; set; } = string.Empty;
    public Dictionary<string, object> AdditionalData { get; set; } = new();
}

/// <summary>
/// Predictive Models Data
/// </summary>
public class PredictiveModelsData
{
    public Dictionary<string, PredictiveModel> Models { get; set; } = new();
    public double AverageAccuracy { get; set; }
    public string BestPerformingModel { get; set; } = string.Empty;
    public DateTime LastTrainingTimestamp { get; set; }
}

/// <summary>
/// Predictive Model
/// </summary>
public class PredictiveModel
{
    public string ModelName { get; set; } = string.Empty;
    public string ModelType { get; set; } = string.Empty;
    public double Accuracy { get; set; }
    public Dictionary<string, object> ModelParameters { get; set; } = new();
    public DateTime TrainingTimestamp { get; set; }
}

/// <summary>
/// System Health Forecasts
/// </summary>
public class SystemHealthForecasts
{
    public Dictionary<string, HealthForecast> Forecasts { get; set; } = new();
    public double OverallHealthScore { get; set; }
    public List<HealthAlert> PredictedAlerts { get; set; } = new();
    public DateTime ForecastTimestamp { get; set; }
}

/// <summary>
/// Health Forecast
/// </summary>
public class HealthForecast
{
    public string MetricName { get; set; } = string.Empty;
    public List<ForecastPoint> ForecastPoints { get; set; } = new();
    public double ConfidenceLevel { get; set; }
    public string TrendDirection { get; set; } = string.Empty;
}

/// <summary>
/// Forecast Point
/// </summary>
public class ForecastPoint
{
    public DateTime Timestamp { get; set; }
    public double PredictedValue { get; set; }
    public double ConfidenceInterval { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
}

/// <summary>
/// Health Alert
/// </summary>
public class HealthAlert
{
    public string AlertType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime PredictedTimestamp { get; set; }
    public string Severity { get; set; } = string.Empty;
    public double Probability { get; set; }
}

/// <summary>
/// Failure Point Analysis
/// </summary>
public class FailurePointAnalysis
{
    public List<PotentialFailurePoint> FailurePoints { get; set; } = new();
    public Dictionary<string, double> FailureRisks { get; set; } = new();
    public List<string> CriticalComponents { get; set; } = new();
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>
/// Potential Failure Point
/// </summary>
public class PotentialFailurePoint
{
    public string ComponentName { get; set; } = string.Empty;
    public string FailureType { get; set; } = string.Empty;
    public double FailureRisk { get; set; }
    public DateTime EstimatedFailureTime { get; set; }
    public string Impact { get; set; } = string.Empty;
    public List<string> PreventiveMeasures { get; set; } = new();
}

/// <summary>
/// Maintenance Recommendation
/// </summary>
public class MaintenanceRecommendation
{
    public string Component { get; set; } = string.Empty;
    public string MaintenanceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime RecommendedTimestamp { get; set; }
    public string Priority { get; set; } = string.Empty;
    public TimeSpan EstimatedDuration { get; set; }
}

/// <summary>
/// Performance Anomaly Detection
/// </summary>
public class PerformanceAnomalyDetection
{
    public List<PerformanceAnomaly> SystemAnomalies { get; set; } = new();
    public List<PerformanceAnomaly> AgentAnomalies { get; set; } = new();
    public List<PerformanceAnomaly> ProductionAnomalies { get; set; } = new();
    public AnomalySeverityAnalysis SeverityAnalysis { get; set; } = new();
    public List<AnomalyResolutionRecommendation> ResolutionRecommendations { get; set; } = new();
    public int TotalAnomaliesDetected { get; set; }
    public int CriticalAnomalies { get; set; }
    public string AnomalyTrend { get; set; } = string.Empty;
    public DateTime DetectionTimestamp { get; set; }
}

/// <summary>
/// Performance Anomaly
/// </summary>
public class PerformanceAnomaly
{
    public string AnomalyId { get; set; } = string.Empty;
    public string AnomalyType { get; set; } = string.Empty;
    public string Component { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Severity { get; set; }
    public DateTime DetectedTimestamp { get; set; }
    public Dictionary<string, object> AnomalyMetrics { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Anomaly Severity Analysis
/// </summary>
public class AnomalySeverityAnalysis
{
    public int CriticalAnomalies { get; set; }
    public int HighAnomalies { get; set; }
    public int MediumAnomalies { get; set; }
    public int LowAnomalies { get; set; }
    public double AverageSeverity { get; set; }
    public string OverallRiskLevel { get; set; } = string.Empty;
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>
/// Anomaly Resolution Recommendation
/// </summary>
public class AnomalyResolutionRecommendation
{
    public string AnomalyId { get; set; } = string.Empty;
    public string ResolutionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Steps { get; set; } = new();
    public string Priority { get; set; } = string.Empty;
    public TimeSpan EstimatedResolutionTime { get; set; }
}

/// <summary>
/// System Optimization Recommendations
/// </summary>
public class SystemOptimizationRecommendations
{
    public List<OptimizationOpportunity> OptimizationOpportunities { get; set; } = new();
    public List<ResourceOptimization> ResourceOptimizations { get; set; } = new();
    public List<AgentOptimizationRecommendation> AgentOptimizations { get; set; } = new();
    public List<ProductionOptimization> ProductionOptimizations { get; set; } = new();
    public PerformanceImprovementAnalysis PerformanceImprovements { get; set; } = new();
    public List<OptimizationRecommendation> PriorityRecommendations { get; set; } = new();
    public double ExpectedROI { get; set; }
    public string ImplementationComplexity { get; set; } = string.Empty;
    public DateTime RecommendationsTimestamp { get; set; }
}

/// <summary>
/// Optimization Opportunity
/// </summary>
public class OptimizationOpportunity
{
    public string OpportunityId { get; set; } = string.Empty;
    public string OpportunityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double PotentialImprovement { get; set; }
    public string Complexity { get; set; } = string.Empty;
    public double ROI { get; set; }
}

/// <summary>
/// Resource Optimization
/// </summary>
public class ResourceOptimization
{
    public string ResourceType { get; set; } = string.Empty;
    public string OptimizationType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double CurrentUsage { get; set; }
    public double OptimalUsage { get; set; }
    public double ExpectedSavings { get; set; }
}

/// <summary>
/// Production Optimization
/// </summary>
public class ProductionOptimization
{
    public string Component { get; set; } = string.Empty;
    public string OptimizationType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ExpectedImprovement { get; set; }
    public string Priority { get; set; } = string.Empty;
    public List<string> ImplementationSteps { get; set; } = new();
}

/// <summary>
/// Performance Improvement Analysis
/// </summary>
public class PerformanceImprovementAnalysis
{
    public double OverallROI { get; set; }
    public Dictionary<string, double> ImprovementsByCategory { get; set; } = new();
    public TimeSpan EstimatedImplementationTime { get; set; }
    public string ExpectedPerformanceGain { get; set; } = string.Empty;
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>
/// Optimization Recommendation - Aligned with IPerformanceMonitor interface
/// </summary>
public class OptimizationRecommendation
{
    public string RecommendationId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RecommendationType { get; set; } = string.Empty; // ✅ Added for interface compatibility
    public int Priority { get; set; } // ✅ Changed from string to int to match IPerformanceMonitor
    public decimal ExpectedImprovement { get; set; } // ✅ Changed from double to decimal to match IPerformanceMonitor
    public string Complexity { get; set; } = string.Empty;
    public List<string> ImplementationSteps { get; set; } = new();

    // Additional optimization properties
    public string Type { get; set; } = string.Empty;
    public double EstimatedImpact { get; set; }
    public string Implementation { get; set; } = string.Empty;
    public bool AutoApprove { get; set; }
    public double ImpactScore { get; set; } // ✅ Added for AdvancedAIAgentOrchestrator compatibility
}

/// <summary>
/// Emergency Performance Protocol
/// </summary>
public class EmergencyPerformanceProtocol
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string[] ActionsPerformed { get; set; } = Array.Empty<string>();
    public SystemDiagnosticResult DiagnosticResult { get; set; } = new();
    public AIAgentHealthCheckResult AgentHealthCheck { get; set; } = new();
    public ProductionStabilizationResult StabilizationResult { get; set; } = new();
    public PerformanceRecoveryResult RecoveryResult { get; set; } = new();
    public DateTime ExecutionTimestamp { get; set; }
}

/// <summary>
/// System Diagnostic Result
/// </summary>
public class SystemDiagnosticResult
{
    public bool Success { get; set; }
    public string Status { get; set; } = string.Empty;
    public Dictionary<string, string> ComponentStatuses { get; set; } = new();
    public List<string> Issues { get; set; } = new();
    public DateTime DiagnosticTimestamp { get; set; }
}

/// <summary>
/// AI Agent Health Check Result
/// </summary>
public class AIAgentHealthCheckResult
{
    public bool Success { get; set; }
    public int TotalAgents { get; set; }
    public int HealthyAgents { get; set; }
    public int UnhealthyAgents { get; set; }
    public List<string> UnhealthyAgentIds { get; set; } = new();
    public DateTime HealthCheckTimestamp { get; set; }
}

/// <summary>
/// Production Stabilization Result
/// </summary>
public class ProductionStabilizationResult
{
    public bool Success { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<string> StabilizationActions { get; set; } = new();
    public Dictionary<string, bool> ComponentStability { get; set; } = new();
    public DateTime StabilizationTimestamp { get; set; }
}

/// <summary>
/// Performance Recovery Result
/// </summary>
public class PerformanceRecoveryResult
{
    public bool Success { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<string> RecoveryActions { get; set; } = new();
    public Dictionary<string, double> RecoveryMetrics { get; set; } = new();
    public DateTime RecoveryTimestamp { get; set; }
}

/// <summary>
/// Performance Thresholds
/// Championship-level performance targets
/// </summary>
public class PerformanceThresholds
{
    public TimeSpan MaxResponseTime { get; set; }
    public int MinThroughput { get; set; }
    public double MaxErrorRate { get; set; }
    public double MinUptime { get; set; }
    public double MaxCPUUsage { get; set; }
    public int MinMemoryAvailable { get; set; }
    public double MaxDiskUsage { get; set; }
    public int MinNetworkThroughput { get; set; }
}

/// <summary>
/// Performance Metric
/// </summary>
public class PerformanceMetric
{
    public string MetricName { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> AdditionalData { get; set; } = new();
}

/// <summary>
/// System Health Metric
/// </summary>
public class SystemHealthMetric
{
    public string Component { get; set; } = string.Empty;
    public double HealthScore { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> HealthData { get; set; } = new();
}

/// <summary>
/// Production Metric
/// </summary>
public class ProductionMetric
{
    public string MetricType { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Component { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> MetricData { get; set; } = new();
}
