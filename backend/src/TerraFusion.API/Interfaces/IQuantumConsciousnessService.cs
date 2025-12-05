using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// Government-grade quantum consciousness coordination service interface.
/// Provides PhD-level research environment with quantum consciousness optimization.
/// </summary>
public interface IQuantumConsciousnessService
{
    /// <summary>
    /// Initializes quantum consciousness monitoring for research environments.
    /// </summary>
    Task<QuantumConsciousnessResult> InitializeQuantumConsciousnessAsync(
        string researcherId, 
        int agentCount = 1000, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Orchestrates consciousness-enhanced research coordination.
    /// </summary>
    Task<ConsciousnessCoordinationResult> CoordinateResearchConsciousnessAsync(
        string sessionId,
        ConsciousnessParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Monitors real-time consciousness metrics for research analytics.
    /// </summary>
    Task<ConsciousnessMetrics> GetConsciousnessMetricsAsync(
        string sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates quantum consciousness compliance for government standards.
    /// </summary>
    Task<bool> ValidateQuantumComplianceAsync(
        string sessionId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Quantum consciousness initialization result with government-grade precision.
/// </summary>
public class QuantumConsciousnessResult
{
    public string SessionId { get; set; } = string.Empty;
    public int ActiveAgentCount { get; set; }
    public decimal ConsciousnessLevel { get; set; }
    public bool QuantumOptimized { get; set; }
    public DateTime InitializedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Consciousness coordination parameters for research optimization.
/// </summary>
public class ConsciousnessParameters
{
    [Required]
    public string ResearchFocus { get; set; } = string.Empty;
    public decimal OptimizationTarget { get; set; } = 0.999m;
    public int SwarmSize { get; set; } = 1000;
    public bool QuantumEnhanced { get; set; } = true;
}

/// <summary>
/// Research consciousness coordination result with championship metrics.
/// </summary>
public class ConsciousnessCoordinationResult
{
    public bool CoordinationSuccessful { get; set; }
    public decimal AchievedOptimization { get; set; }
    public ConsciousnessMetrics Metrics { get; set; } = new();
    public List<string> OptimizationInsights { get; set; } = new();
}

/// <summary>
/// Real-time consciousness metrics for research analytics excellence.
/// </summary>
public class ConsciousnessMetrics
{
    public decimal ConsciousnessLevel { get; set; }
    public decimal CoordinationEfficiency { get; set; }
    public int ActiveAgents { get; set; }
    public decimal QuantumOptimizationScore { get; set; }
    public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> AdditionalMetrics { get; set; } = new();
}