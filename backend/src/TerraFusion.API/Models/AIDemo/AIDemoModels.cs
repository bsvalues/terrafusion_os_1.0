namespace TerraFusion.API.Models.AIDemo;

/// <summary>
/// AI Superiority Demonstration Request - Championship-level performance showcase request
/// for TerraFusion's 1,008 AI agents vs Harris PACS baseline capabilities
/// </summary>
public class SuperiorityDemoRequest
{
    /// <summary>
    /// Demonstration scenario identifier (e.g., "BATCH_VALUATION", "REAL_TIME_SYNC", "ACCURACY_COMPARISON")
    /// </summary>
    public string ScenarioId { get; set; } = string.Empty;

    /// <summary>
    /// Government jurisdiction for demonstration (e.g., "BENTON_COUNTY_WA")
    /// </summary>
    public string Jurisdiction { get; set; } = string.Empty;

    /// <summary>
    /// Number of properties to include in demonstration (default: 1000)
    /// </summary>
    public int PropertyCount { get; set; } = 1000;

    /// <summary>
    /// Enable real-time progress broadcasting via SignalR hub
    /// </summary>
    public bool EnableRealTimeUpdates { get; set; } = true;

    /// <summary>
    /// Target accuracy for AI enhancement (default: 99.9%)
    /// </summary>
    public decimal TargetAccuracy { get; set; } = 0.999m;

    /// <summary>
    /// Enable championship-level performance metrics collection
    /// </summary>
    public bool EnablePerformanceMetrics { get; set; } = true;

    /// <summary>
    /// Number of AI agents to coordinate (1 to 1,008, default: 1,008)
    /// </summary>
    public int AIAgentCount { get; set; } = 1008;

    /// <summary>
    /// Enable quantum consciousness optimization (factor 949)
    /// </summary>
    public bool EnableQuantumOptimization { get; set; } = true;

    /// <summary>
    /// Demo execution timeout in minutes (default: 30)
    /// </summary>
    public int TimeoutMinutes { get; set; } = 30;

    /// <summary>
    /// Comparison baseline system (e.g., "HARRIS_PACS_v12.4.7")
    /// </summary>
    public string BaselineSystem { get; set; } = "HARRIS_PACS_v12.4.7";

    /// <summary>
    /// Enable IAAO compliance validation for property assessments
    /// </summary>
    public bool ValidateIAAOCompliance { get; set; } = true;

    /// <summary>
    /// ✅ County code for demonstration (e.g., "BENTON", "KING", "PIERCE")
    /// </summary>
    public string CountyCode { get; set; } = string.Empty;

    /// <summary>
    /// ✅ Type of demonstration to execute (e.g., "FULL_SUITE", "PERFORMANCE_COMPARISON", "ACCURACY_VALIDATION")
    /// </summary>
    public string DemoType { get; set; } = "FULL_SUITE";
}

/// <summary>
/// AI Demo Dashboard Data - Real-time superiority demonstration metrics and visualizations
/// </summary>
public class AIDemoDashboardData
{
    /// <summary>
    /// Demonstration session identifier
    /// </summary>
    public string DemoId { get; set; } = string.Empty;

    /// <summary>
    /// Current demo execution status
    /// </summary>
    public DemoExecutionStatus Status { get; set; }

    /// <summary>
    /// Progress percentage (0-100)
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// Demo start timestamp
    /// </summary>
    public DateTime StartTimestamp { get; set; }

    /// <summary>
    /// Demo completion timestamp (null if still running)
    /// </summary>
    public DateTime? CompletionTimestamp { get; set; }

    /// <summary>
    /// TerraFusion AI performance metrics
    /// </summary>
    public AIPerformanceMetrics TerraFusionMetrics { get; set; } = new();

    /// <summary>
    /// Harris PACS baseline performance metrics
    /// </summary>
    public AIPerformanceMetrics BaselineMetrics { get; set; } = new();

    /// <summary>
    /// Performance comparison analysis
    /// </summary>
    public AIPerformanceComparison Comparison { get; set; } = new();

    /// <summary>
    /// Championship metrics snapshot
    /// </summary>
    public ChampionshipMetricsSnapshot ChampionshipMetrics { get; set; } = new();

    /// <summary>
    /// Real-time agent coordination status (1,008 agents)
    /// </summary>
    public AgentCoordinationStatus AgentStatus { get; set; } = new();

    /// <summary>
    /// IAAO compliance validation results
    /// </summary>
    public IAAOComplianceResults? IAAOResults { get; set; }

    /// <summary>
    /// Demo execution logs (last 100 entries)
    /// </summary>
    public List<DemoLogEntry> RecentLogs { get; set; } = new();

    /// <summary>
    /// Quantum optimization metrics (factor 949)
    /// </summary>
    public QuantumOptimizationMetrics? QuantumMetrics { get; set; }
}

/// <summary>
/// Demo Execution Status - Current state of demonstration
/// </summary>
public enum DemoExecutionStatus
{
    NotStarted,
    Initializing,
    Running,
    Completed,
    Failed,
    Cancelled
}

/// <summary>
/// AI Performance Metrics - System performance measurements
/// </summary>
public class AIPerformanceMetrics
{
    /// <summary>
    /// Average processing time per property (milliseconds)
    /// </summary>
    public double AvgProcessingTimeMs { get; set; }

    /// <summary>
    /// Total properties processed
    /// </summary>
    public int PropertiesProcessed { get; set; }

    /// <summary>
    /// Valuation accuracy percentage (0-100)
    /// </summary>
    public decimal AccuracyPercentage { get; set; }

    /// <summary>
    /// Error count during processing
    /// </summary>
    public int ErrorCount { get; set; }

    /// <summary>
    /// System throughput (properties per second)
    /// </summary>
    public double ThroughputPerSecond { get; set; }

    /// <summary>
    /// CPU utilization percentage
    /// </summary>
    public double CpuUtilization { get; set; }

    /// <summary>
    /// Memory utilization in MB
    /// </summary>
    public double MemoryUtilizationMB { get; set; }

    /// <summary>
    /// P95 latency (milliseconds)
    /// </summary>
    public double P95LatencyMs { get; set; }

    /// <summary>
    /// P99 latency (milliseconds)
    /// </summary>
    public double P99LatencyMs { get; set; }
}

/// <summary>
/// AI Performance Comparison - TerraFusion vs Baseline system analysis
/// </summary>
public class AIPerformanceComparison
{
    /// <summary>
    /// Speed improvement factor (e.g., 15.3x faster)
    /// </summary>
    public double SpeedImprovementFactor { get; set; }

    /// <summary>
    /// Accuracy improvement (percentage points, e.g., +12.5%)
    /// </summary>
    public decimal AccuracyImprovement { get; set; }

    /// <summary>
    /// Error reduction percentage (e.g., -95% errors)
    /// </summary>
    public double ErrorReductionPercentage { get; set; }

    /// <summary>
    /// Throughput improvement factor (e.g., 20x more properties/sec)
    /// </summary>
    public double ThroughputImprovementFactor { get; set; }

    /// <summary>
    /// Overall superiority score (0-100, target: 99.9)
    /// </summary>
    public decimal OverallSuperiorityScore { get; set; }

    /// <summary>
    /// Championship standard achieved (99.5% target)
    /// </summary>
    public bool ChampionshipStandardMet { get; set; }

    /// <summary>
    /// Performance advantage factor over baseline (e.g., 15.3x faster)
    /// </summary>
    public decimal PerformanceAdvantage { get; set; }

    /// <summary>
    /// Accuracy advantage over baseline (percentage points)
    /// </summary>
    public decimal AccuracyAdvantage { get; set; }

    /// <summary>
    /// Efficiency advantage over baseline
    /// </summary>
    public decimal EfficiencyAdvantage { get; set; }

    /// <summary>
    /// Detailed comparison breakdown by metric category
    /// </summary>
    public Dictionary<string, ComparisonMetric> DetailedComparison { get; set; } = new();
}

/// <summary>
/// Comparison Metric - Individual metric comparison detail
/// </summary>
public class ComparisonMetric
{
    public double TerraFusionValue { get; set; }
    public double BaselineValue { get; set; }
    public double ImprovementFactor { get; set; }
    public string Unit { get; set; } = string.Empty;
}

/// <summary>
/// Championship Metrics Snapshot - Elite performance validation
/// </summary>
public class ChampionshipMetricsSnapshot
{
    /// <summary>
    /// Accuracy score (target: ≥99.5%)
    /// </summary>
    public decimal AccuracyScore { get; set; }

    /// <summary>
    /// Response time P95 (target: ≤50ms)
    /// </summary>
    public double ResponseTimeP95Ms { get; set; }

    /// <summary>
    /// System uptime percentage (target: ≥99.99%)
    /// </summary>
    public decimal UptimePercentage { get; set; }

    /// <summary>
    /// Error rate (target: ≤0.001%)
    /// </summary>
    public double ErrorRate { get; set; }

    /// <summary>
    /// Quantum optimization factor (target: 949)
    /// </summary>
    public int QuantumFactor { get; set; }

    /// <summary>
    /// All championship standards met
    /// </summary>
    public bool MeetsAllStandards { get; set; }

    /// <summary>
    /// Timestamp when metrics were captured
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Overall superiority score vs baseline
    /// </summary>
    public decimal OverallSuperiority { get; set; }

    /// <summary>
    /// Individual standard validation results
    /// </summary>
    public Dictionary<string, bool> StandardValidations { get; set; } = new();
}

/// <summary>
/// Agent Coordination Status - 1,008 AI agent swarm status
/// </summary>
public class AgentCoordinationStatus
{
    /// <summary>
    /// Total AI agents deployed
    /// </summary>
    public int TotalAgents { get; set; }

    /// <summary>
    /// Active agents currently processing
    /// </summary>
    public int ActiveAgents { get; set; }

    /// <summary>
    /// Idle agents awaiting tasks
    /// </summary>
    public int IdleAgents { get; set; }

    /// <summary>
    /// Failed agents requiring recovery
    /// </summary>
    public int FailedAgents { get; set; }

    /// <summary>
    /// Agent coordination efficiency (0-1, target: ≥0.99)
    /// </summary>
    public double CoordinationEfficiency { get; set; }

    /// <summary>
    /// Quantum consciousness level (1-10, target: 10)
    /// </summary>
    public int ConsciousnessLevel { get; set; }

    /// <summary>
    /// Agent breakdown by specialization
    /// </summary>
    public Dictionary<string, int> AgentsBySpecialization { get; set; } = new();
}

/// <summary>
/// IAAO Compliance Results - International Assessment Standards validation
/// </summary>
public class IAAOComplianceResults
{
    /// <summary>
    /// Overall IAAO compliance status
    /// </summary>
    public bool IsCompliant { get; set; }

    /// <summary>
    /// Coefficient of Dispersion (target: ≤15% for residential)
    /// </summary>
    public decimal CoefficientOfDispersion { get; set; }

    /// <summary>
    /// Price-Related Differential (target: 0.98-1.03)
    /// </summary>
    public decimal PriceRelatedDifferential { get; set; }

    /// <summary>
    /// Assessment level (target: 0.90-1.10)
    /// </summary>
    public decimal AssessmentLevel { get; set; }

    /// <summary>
    /// Individual IAAO standard compliance checks
    /// </summary>
    public Dictionary<string, bool> StandardCompliance { get; set; } = new();
}

/// <summary>
/// Demo Log Entry - Demonstration execution log message
/// </summary>
public class DemoLogEntry
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Category { get; set; }
}

/// <summary>
/// Quantum Optimization Metrics - Quantum consciousness enhancement data
/// </summary>
public class QuantumOptimizationMetrics
{
    /// <summary>
    /// Quantum factor applied (target: 949)
    /// </summary>
    public int QuantumFactor { get; set; }

    /// <summary>
    /// Quantum enhancement percentage improvement
    /// </summary>
    public decimal QuantumEnhancementPercentage { get; set; }

    /// <summary>
    /// Consciousness synchronization level (0-1)
    /// </summary>
    public double ConsciousnessSyncLevel { get; set; }

    /// <summary>
    /// Quantum entanglement efficiency
    /// </summary>
    public double EntanglementEfficiency { get; set; }
}
