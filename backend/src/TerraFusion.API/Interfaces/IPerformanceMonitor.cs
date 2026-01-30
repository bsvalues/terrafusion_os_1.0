using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// Elite performance monitoring service for championship-level system excellence.
/// Provides real-time monitoring with quantum-enhanced analytics and predictive insights.
/// </summary>
public interface IPerformanceMonitor
{
    /// <summary>
    /// Starts a performance activity for tracing and monitoring.
    /// </summary>
    IDisposable StartActivity(string activityName, string? context = null);

    /// <summary>
    /// Initiates real-time performance monitoring with championship-level precision.
    /// </summary>
    Task<PerformanceMonitoringResult> StartPerformanceMonitoringAsync(
        PerformanceMonitoringRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves comprehensive performance metrics with quantum analytics.
    /// </summary>
    Task<PerformanceMetrics> GetPerformanceMetricsAsync(
        string monitoringSessionId,
        MetricsParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs predictive performance analysis for proactive optimization.
    /// </summary>
    Task<PredictivePerformanceResult> GeneratePerformancePredictionsAsync(
        string sessionId,
        PredictionParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates system performance against championship standards.
    /// </summary>
    Task<PerformanceValidationResult> ValidateChampionshipPerformanceAsync(
        string sessionId,
        ChampionshipStandards standards,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Stops performance monitoring and generates comprehensive report.
    /// </summary>
    Task<PerformanceReport> StopPerformanceMonitoringAsync(
        string sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets elite performance metrics with championship-level analysis.
    /// </summary>
    Task<ElitePerformanceMetrics> GetElitePerformanceMetricsAsync(
        string sessionId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Performance monitoring configuration request.
/// </summary>
public class PerformanceMonitoringRequest
{
    [Required]
    public string SystemIdentifier { get; set; } = string.Empty;

    public MonitoringConfiguration Configuration { get; set; } = new();
    public List<PerformanceMetricType> MetricTypes { get; set; } = new();
    public bool QuantumEnhanced { get; set; } = true;
    public TimeSpan MonitoringDuration { get; set; } = TimeSpan.FromHours(24);
}

/// <summary>
/// Monitoring configuration for performance tracking excellence.
/// </summary>
public class MonitoringConfiguration
{
    public TimeSpan SamplingInterval { get; set; } = TimeSpan.FromSeconds(1);
    public bool RealTimeAlerts { get; set; } = true;
    public decimal AlertThreshold { get; set; } = 0.95m;
    public bool PredictiveAnalytics { get; set; } = true;
    public Dictionary<string, object> CustomSettings { get; set; } = new();
}

/// <summary>
/// Performance monitoring initialization result.
/// </summary>
public class PerformanceMonitoringResult
{
    public string SessionId { get; set; } = Guid.NewGuid().ToString();
    public bool MonitoringStarted { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public MonitoringStatus Status { get; set; } = new();
    public List<string> MonitoredComponents { get; set; } = new();
}

/// <summary>
/// Real-time monitoring status with health indicators.
/// </summary>
public class MonitoringStatus
{
    public MonitoringState State { get; set; } = MonitoringState.Active;
    public decimal OverallHealthScore { get; set; }
    public int ActiveMonitors { get; set; }
    public bool AlertsEnabled { get; set; }
    public DateTime LastHealthCheck { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Comprehensive performance metrics with quantum analytics.
/// </summary>
public class PerformanceMetrics
{
    public string SessionId { get; set; } = string.Empty;
    public SystemPerformanceMetrics System { get; set; } = new();
    public ApplicationPerformanceMetrics Application { get; set; } = new();
    public DatabasePerformanceMetrics Database { get; set; } = new();
    public NetworkPerformanceMetrics Network { get; set; } = new();
    public QuantumPerformanceMetrics Quantum { get; set; } = new();
    public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// System-level performance metrics.
/// </summary>
public class SystemPerformanceMetrics
{
    public decimal CpuUtilization { get; set; }
    public decimal MemoryUtilization { get; set; }
    public decimal DiskUtilization { get; set; }
    public decimal SystemLoad { get; set; }
    public int ProcessCount { get; set; }
    public int ThreadCount { get; set; }
    public Dictionary<string, decimal> CustomMetrics { get; set; } = new();
}

/// <summary>
/// Application-level performance metrics.
/// </summary>
public class ApplicationPerformanceMetrics
{
    public decimal ResponseTime { get; set; }
    public decimal Throughput { get; set; }
    public decimal ErrorRate { get; set; }
    public decimal SuccessRate { get; set; }
    public int ConcurrentUsers { get; set; }
    public int ActiveSessions { get; set; }
    public Dictionary<string, decimal> EndpointMetrics { get; set; } = new();
}

/// <summary>
/// Database performance metrics.
/// </summary>
public class DatabasePerformanceMetrics
{
    public decimal QueryExecutionTime { get; set; }
    public decimal ConnectionPoolUtilization { get; set; }
    public int ActiveConnections { get; set; }
    public decimal TransactionThroughput { get; set; }
    public decimal LockWaitTime { get; set; }
    public Dictionary<string, decimal> QueryMetrics { get; set; } = new();
}

/// <summary>
/// Network performance metrics.
/// </summary>
public class NetworkPerformanceMetrics
{
    public decimal Latency { get; set; }
    public decimal Bandwidth { get; set; }
    public decimal PacketLoss { get; set; }
    public decimal Jitter { get; set; }
    public long BytesTransmitted { get; set; }
    public long BytesReceived { get; set; }
}

/// <summary>
/// Quantum-enhanced performance metrics.
/// </summary>
public class QuantumPerformanceMetrics
{
    public decimal QuantumOptimizationFactor { get; set; }
    public decimal CoherenceTime { get; set; }
    public decimal EntanglementEfficiency { get; set; }
    public int QuantumGatesExecuted { get; set; }
    public bool QuantumSupremacyActive { get; set; }
}

/// <summary>
/// Metrics retrieval parameters for customized reporting.
/// </summary>
public class MetricsParameters
{
    public DateTime StartTime { get; set; } = DateTime.UtcNow.AddHours(-1);
    public DateTime EndTime { get; set; } = DateTime.UtcNow;
    public MetricsAggregation Aggregation { get; set; } = MetricsAggregation.Average;
    public List<PerformanceMetricType> SpecificMetrics { get; set; } = new();
    public bool IncludeHistoricalTrends { get; set; } = true;
}

/// <summary>
/// Predictive performance analysis parameters.
/// </summary>
public class PredictionParameters
{
    public TimeSpan PredictionHorizon { get; set; } = TimeSpan.FromHours(4);
    public decimal ConfidenceLevel { get; set; } = 0.95m;
    public bool IncludeAnomalyDetection { get; set; } = true;
    public bool QuantumEnhanced { get; set; } = true;
    public Dictionary<string, object> ModelParameters { get; set; } = new();
}

/// <summary>
/// Predictive performance analysis result.
/// </summary>
public class PredictivePerformanceResult
{
    public bool PredictionSuccessful { get; set; }
    public List<PerformancePrediction> Predictions { get; set; } = new();
    public List<PerformanceAnomaly> PredictedAnomalies { get; set; } = new();
    public List<OptimizationRecommendation> Recommendations { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Individual performance prediction with confidence metrics.
/// </summary>
public class PerformancePrediction
{
    public PerformanceMetricType MetricType { get; set; }
    public DateTime PredictedTime { get; set; }
    public decimal PredictedValue { get; set; }
    public decimal ConfidenceScore { get; set; }
    public decimal LowerBound { get; set; }
    public decimal UpperBound { get; set; }
}

/// <summary>
/// Predicted performance anomaly with severity assessment.
/// </summary>
public class PerformanceAnomaly
{
    public DateTime PredictedTime { get; set; }
    public AnomalySeverity Severity { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal ProbabilityScore { get; set; }
    public List<string> ImpactedComponents { get; set; } = new();
}

/// <summary>
/// Performance optimization recommendation.
/// </summary>
public class OptimizationRecommendation
{
    public string RecommendationType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal ExpectedImprovement { get; set; }
    public int Priority { get; set; }
    public List<string> ImplementationSteps { get; set; } = new();

    // ✅ Additional properties for CognitiveFrameworkOptimizationService and AdvancedAIAgentOrchestrator
    public string Type { get; set; } = string.Empty;
    public double EstimatedImpact { get; set; }
    public string Implementation { get; set; } = string.Empty;
    public bool AutoApprove { get; set; }
    public double ImpactScore { get; set; }
    public string Title { get; set; } = string.Empty;
}

/// <summary>
/// Championship performance standards for validation.
/// </summary>
public class ChampionshipStandards
{
    public decimal MinResponseTime { get; set; } = 50m; // milliseconds
    public decimal MaxErrorRate { get; set; } = 0.001m; // 0.1%
    public decimal MinThroughput { get; set; } = 1000m; // requests/second
    public decimal MinAvailability { get; set; } = 0.9999m; // 99.99%
    public decimal MaxCpuUtilization { get; set; } = 0.80m; // 80%
    public Dictionary<string, decimal> CustomStandards { get; set; } = new();
}

/// <summary>
/// Performance validation result against championship standards.
/// </summary>
public class PerformanceValidationResult
{
    public bool MeetsChampionshipStandards { get; set; }
    public decimal OverallComplianceScore { get; set; }
    public List<StandardValidation> Validations { get; set; } = new();
    public List<PerformanceGap> PerformanceGaps { get; set; } = new();
    public ChampionshipGrade Grade { get; set; }
}

/// <summary>
/// Individual standard validation result.
/// </summary>
public class StandardValidation
{
    public string StandardName { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public decimal ActualValue { get; set; }
    public decimal RequiredValue { get; set; }
    public decimal CompliancePercentage { get; set; }
}

/// <summary>
/// Performance gap identification for improvement planning.
/// </summary>
public class PerformanceGap
{
    public string Component { get; set; } = string.Empty;
    public string GapDescription { get; set; } = string.Empty;
    public decimal GapSeverity { get; set; }
    public List<string> ImprovementActions { get; set; } = new();
}

/// <summary>
/// Comprehensive performance monitoring report.
/// </summary>
public class PerformanceReport
{
    public string SessionId { get; set; } = string.Empty;
    public TimeSpan MonitoringDuration { get; set; }
    public PerformanceSummary Summary { get; set; } = new();
    public List<PerformanceMetrics> HistoricalMetrics { get; set; } = new();
    public List<PerformanceIncident> Incidents { get; set; } = new();
    public List<string> KeyInsights { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Performance summary with aggregate statistics.
/// </summary>
public class PerformanceSummary
{
    public decimal AverageResponseTime { get; set; }
    public decimal PeakThroughput { get; set; }
    public decimal OverallAvailability { get; set; }
    public decimal SystemHealthScore { get; set; }
    public int TotalIncidents { get; set; }
    public ChampionshipGrade PerformanceGrade { get; set; }
}

/// <summary>
/// Performance incident record for analysis.
/// </summary>
public class PerformanceIncident
{
    public DateTime OccurredAt { get; set; }
    public IncidentSeverity Severity { get; set; }
    public string Description { get; set; } = string.Empty;
    public TimeSpan Duration { get; set; }
    public List<string> AffectedComponents { get; set; } = new();
    public string Resolution { get; set; } = string.Empty;
}

/// <summary>
/// Performance metric types for monitoring configuration.
/// </summary>
public enum PerformanceMetricType
{
    ResponseTime,
    Throughput,
    ErrorRate,
    CpuUtilization,
    MemoryUtilization,
    DatabasePerformance,
    NetworkLatency,
    QuantumMetrics,
    CustomMetric
}

/// <summary>
/// Metrics aggregation methods for data analysis.
/// </summary>
public enum MetricsAggregation
{
    Average,
    Maximum,
    Minimum,
    Percentile95,
    Percentile99,
    Sum,
    Count
}

/// <summary>
/// Monitoring state enumeration.
/// </summary>
public enum MonitoringState
{
    Initializing,
    Active,
    Paused,
    Stopped,
    Error
}

/// <summary>
/// Anomaly severity levels for incident classification.
/// </summary>
public enum AnomalySeverity
{
    Low,
    Medium,
    High,
    Critical,
    Championship
}

/// <summary>
/// Championship performance grades for excellence assessment.
/// </summary>
public enum ChampionshipGrade
{
    Failing,
    Basic,
    Good,
    Excellent,
    Championship,
    TranscendentExcellence
}

/// <summary>
/// Performance incident severity classification.
/// </summary>
public enum IncidentSeverity
{
    Informational,
    Warning,
    Minor,
    Major,
    Critical,
    ChampionshipThreat
}

/// <summary>
/// Elite performance metrics with championship-level analysis.
/// </summary>
public class ElitePerformanceMetrics
{
    public string SessionId { get; set; } = string.Empty;
    public decimal OverallPerformanceScore { get; set; }
    public SystemPerformanceMetrics SystemMetrics { get; set; } = new();
    public ApplicationPerformanceMetrics ApplicationMetrics { get; set; } = new();
    public QuantumPerformanceMetrics QuantumMetrics { get; set; } = new();
    public ChampionshipGrade PerformanceGrade { get; set; }
    public List<OptimizationRecommendation> EliteRecommendations { get; set; } = new();
    public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
}