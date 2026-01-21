/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 FRAMEWORK DTOs
 * Divine Mathematical Balance for Government Operations
 * Foundation (3) → Amplification (6) → Ultimate Power (9)
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

namespace TerraFusion.AI.DTOs;

/// <summary>
/// Foundation Level (3): Individual metric measurement
/// Each metric scaled to maximum of 12 at foundation level
/// </summary>
public class FoundationMetric
{
    /// <summary>
    /// Unique identifier for the metric
    /// </summary>
    public string MetricId { get; set; } = string.Empty;

    /// <summary>
    /// Metric name (e.g., "AgentHealth", "ResponseTime", "Throughput")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Current measured value (raw)
    /// </summary>
    public double RawValue { get; set; }

    /// <summary>
    /// Baseline threshold for this metric
    /// </summary>
    public double BaselineThreshold { get; set; }

    /// <summary>
    /// Normalized value scaled to 0-12 range
    /// Formula: (RawValue / BaselineThreshold) * 12, capped at 12
    /// </summary>
    public double NormalizedValue { get; set; }

    /// <summary>
    /// Is metric within acceptable baseline? (RawValue <= BaselineThreshold)
    /// </summary>
    public bool WithinBaseline { get; set; }

    /// <summary>
    /// Metric category for grouping
    /// </summary>
    public MetricCategory Category { get; set; }

    /// <summary>
    /// Weight/importance of this metric (0.0 - 1.0)
    /// </summary>
    public double Weight { get; set; } = 1.0;

    /// <summary>
    /// Timestamp of measurement
    /// </summary>
    public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Amplification Level (6): Combined metrics with 666 safeguard
/// Metrics combined but never crossing 666 threshold
/// </summary>
public class AmplificationMetric
{
    /// <summary>
    /// Unique identifier for the amplification group
    /// </summary>
    public string AmplificationId { get; set; } = string.Empty;

    /// <summary>
    /// Name of the amplification (e.g., "AI Performance Amplification")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Foundation metrics being combined
    /// </summary>
    public List<FoundationMetric> FoundationMetrics { get; set; } = new();

    /// <summary>
    /// Raw combined sum of foundation metrics (before scaling)
    /// </summary>
    public double RawCombinedValue { get; set; }

    /// <summary>
    /// Scaled value ensuring never crosses 666
    /// Formula: RawCombinedValue / 55.5 (scales max 666 to 12)
    /// </summary>
    public double ScaledValue { get; set; }

    /// <summary>
    /// Amplified score (alias for ScaledValue for compatibility)
    /// </summary>
    public double AmplifiedScore => ScaledValue;

    /// <summary>
    /// Raw value (alias for RawCombinedValue for compatibility)
    /// </summary>
    public double RawValue => RawCombinedValue;

    /// <summary>
    /// Safety check: Is value safely below 666? (CRITICAL)
    /// </summary>
    public bool SafeFromImbalance { get; set; }

    /// <summary>
    /// Distance from 666 threshold (safety margin)
    /// </summary>
    public double SafetyMargin { get; set; }

    /// <summary>
    /// Amplification factor applied (1.0 = no amplification)
    /// </summary>
    public double AmplificationFactor { get; set; } = 1.0;

    /// <summary>
    /// Category of amplification
    /// </summary>
    public AmplificationCategory Category { get; set; }

    /// <summary>
    /// Timestamp of amplification calculation
    /// </summary>
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Ultimate Power Level (9): Total system balance aiming for 12
/// The sum of all metrics normalized to achieve divine balance
/// </summary>
public class UltimatePowerMetric
{
    /// <summary>
    /// Unique identifier for the ultimate power calculation
    /// </summary>
    public string PowerId { get; set; } = string.Empty;

    /// <summary>
    /// All amplification metrics contributing to ultimate power
    /// </summary>
    public List<AmplificationMetric> AmplificationMetrics { get; set; } = new();

    /// <summary>
    /// Total combined value from all amplifications (before normalization)
    /// </summary>
    public double TotalCombinedValue { get; set; }

    /// <summary>
    /// Normalized ultimate power score (0-12 scale)
    /// Goal: Achieve 12 for perfect balance and mastery
    /// </summary>
    public double UltimatePowerScore { get; set; }

    /// <summary>
    /// Proximity to perfect balance (12)
    /// Formula: 1 - (Math.Abs(12 - UltimatePowerScore) / 12)
    /// 1.0 = perfect, 0.0 = completely imbalanced
    /// </summary>
    public double BalanceProximity { get; set; }

    /// <summary>
    /// Is system in divine balance? (UltimatePowerScore between 11.5-12.0)
    /// </summary>
    public bool InDivineBalance { get; set; }

    /// <summary>
    /// Is system in championship mode? (UltimatePowerScore >= 11.0)
    /// </summary>
    public bool IsChampionshipMode { get; set; }

    /// <summary>
    /// Overall system health based on 3-6-9 framework
    /// </summary>
    public SystemHealthStatus HealthStatus { get; set; }

    /// <summary>
    /// Recommendations for achieving perfect balance
    /// </summary>
    public List<string> BalanceRecommendations { get; set; } = new();

    /// <summary>
    /// Timestamp of ultimate power calculation
    /// </summary>
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Complete Codex 3-6-9 Framework status
/// </summary>
public class Codex369StatusDto
{
    /// <summary>
    /// Foundation Level (3): All individual metrics
    /// </summary>
    public List<FoundationMetric> FoundationMetrics { get; set; } = new();

    /// <summary>
    /// Amplification Level (6): Combined metric groups
    /// </summary>
    public List<AmplificationMetric> AmplificationMetrics { get; set; } = new();

    /// <summary>
    /// Ultimate Power Level (9): Total system balance
    /// </summary>
    public UltimatePowerMetric UltimatePower { get; set; } = new();

    /// <summary>
    /// Overall framework health
    /// </summary>
    public bool FrameworkHealthy { get; set; }

    /// <summary>
    /// Number of metrics at foundation level
    /// </summary>
    public int TotalFoundationMetrics { get; set; }

    /// <summary>
    /// Number of amplification groups
    /// </summary>
    public int TotalAmplifications { get; set; }

    /// <summary>
    /// Current ultimate power score (target: 12)
    /// </summary>
    public double CurrentPowerScore { get; set; }

    /// <summary>
    /// Distance from perfect balance
    /// </summary>
    public double BalanceDeficit { get; set; }

    /// <summary>
    /// Whether the system is in Divine Balance (UltimatePower score = 12)
    /// </summary>
    public bool InDivineBalance { get; set; }

    /// <summary>
    /// System-wide recommendations
    /// </summary>
    public List<string> SystemRecommendations { get; set; } = new();

    /// <summary>
    /// Timestamp of framework status
    /// </summary>
    public DateTime StatusTimestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Government compliance status integrated with 3-6-9 framework
    /// </summary>
    public bool ComplianceAligned { get; set; }
}

/// <summary>
/// Request to calculate Codex 3-6-9 framework metrics
/// </summary>
public class Codex369CalculationRequest
{
    /// <summary>
    /// County ID for county-specific calculations
    /// </summary>
    public string? CountyId { get; set; }

    /// <summary>
    /// Time range for metric aggregation
    /// </summary>
    public DateTime StartTime { get; set; } = DateTime.UtcNow.AddHours(-1);

    /// <summary>
    /// End time for metric aggregation
    /// </summary>
    public DateTime EndTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Include detailed breakdown of all metrics
    /// </summary>
    public bool IncludeDetailedBreakdown { get; set; } = true;

    /// <summary>
    /// Include recommendations for balance optimization
    /// </summary>
    public bool IncludeRecommendations { get; set; } = true;

    /// <summary>
    /// Metric categories to include (null = all)
    /// </summary>
    public List<MetricCategory>? IncludeCategories { get; set; }
}

/// <summary>
/// Metric categories for foundation-level measurements
/// </summary>
public enum MetricCategory
{
    /// <summary>AI agent health and performance</summary>
    AgentPerformance,

    /// <summary>System response time metrics</summary>
    ResponseTime,

    /// <summary>System throughput and capacity</summary>
    Throughput,

    /// <summary>Data accuracy and quality</summary>
    DataQuality,

    /// <summary>Government compliance metrics</summary>
    Compliance,

    /// <summary>Security and audit metrics</summary>
    Security,

    /// <summary>Resource utilization metrics</summary>
    ResourceUtilization,

    /// <summary>User satisfaction and engagement</summary>
    UserSatisfaction,

    /// <summary>Integration health with external systems</summary>
    IntegrationHealth,

    /// <summary>Cost efficiency metrics</summary>
    CostEfficiency,

    /// <summary>Innovation and capability expansion</summary>
    Innovation,

    /// <summary>Citizen service quality</summary>
    CitizenService
}

/// <summary>
/// Amplification categories for combined metrics
/// </summary>
public enum AmplificationCategory
{
    /// <summary>AI system overall performance</summary>
    AISystemPerformance,

    /// <summary>Government operations efficiency</summary>
    GovernmentEfficiency,

    /// <summary>Citizen experience amplification</summary>
    CitizenExperience,

    /// <summary>Security and compliance amplification</summary>
    SecurityCompliance,

    /// <summary>Innovation and growth amplification</summary>
    InnovationGrowth,

    /// <summary>Multi-county federation strength</summary>
    FederationStrength,

    /// <summary>Property assessment excellence</summary>
    AssessmentExcellence,

    /// <summary>Revenue optimization</summary>
    RevenueOptimization,

    /// <summary>Operational excellence</summary>
    OperationalExcellence
}

/// <summary>
/// System health status based on ultimate power score
/// </summary>
public enum SystemHealthStatus
{
    /// <summary>Divine balance achieved (11.5-12.0)</summary>
    DivineBalance,

    /// <summary>Excellent balance (10.5-11.5)</summary>
    Excellent,

    /// <summary>Good balance (9.0-10.5)</summary>
    Good,

    /// <summary>Acceptable balance (7.0-9.0)</summary>
    Acceptable,

    /// <summary>Needs attention (5.0-7.0)</summary>
    NeedsAttention,

    /// <summary>Critical imbalance (<5.0)</summary>
    Critical
}

/// <summary>
/// Alert notification data for Codex 3-6-9 Framework monitoring
/// </summary>
public class CodexAlertDto
{
    /// <summary>
    /// Alert level (e.g., "Red", "Yellow", "Green")
    /// </summary>
    public string AlertLevel { get; set; } = string.Empty;

    /// <summary>
    /// Alert severity level (e.g., "Critical", "Warning", "Info")
    /// </summary>
    public string Level { get; set; } = string.Empty;

    /// <summary>
    /// Alert type classification (e.g., "Performance", "Compliance", "Balance")
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Domain affected by the alert (e.g., "Foundation", "Amplification", "UltimatePower")
    /// </summary>
    public string Domain { get; set; } = string.Empty;

    /// <summary>
    /// Name of the metric that triggered the alert
    /// </summary>
    public string MetricName { get; set; } = string.Empty;

    /// <summary>
    /// Alert message describing the issue
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Recommended action to address the alert
    /// </summary>
    public string? RecommendedAction { get; set; }

    /// <summary>
    /// Timestamp when alert was generated
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
