using TerraFusion.API.Models;
using TerraFusion.API.Services;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// Advanced AI Orchestrator Interface - Elite Government AI Coordination
///
/// Coordinates 1,008+ AI agents for property assessment enhancement, quantum optimization,
/// and championship-level analysis across Harris PACS and TerraFusion integrations.
/// </summary>
public interface IAdvancedAIOrchestrator
{
    /// <summary>
    /// Activates AI enhancement swarm for property assessment operations
    /// </summary>
    /// <param name="config">AI swarm configuration parameters</param>
    /// <returns>Swarm activation result with agent coordination status</returns>
    Task<AISwarmActivationResult> ActivateEnhancementSwarmAsync(AISwarmConfig config);

    /// <summary>
    /// Enhances property assessment with AI-powered analysis and valuation optimization
    /// </summary>
    /// <param name="request">Property assessment enhancement request</param>
    /// <returns>Enhanced property assessment with AI insights</returns>
    Task<EnhancedPropertyAssessment> EnhancePropertyAssessmentAsync(AIEnhancementRequest request);

    /// <summary>
    /// Applies quantum optimization algorithms to property valuation calculations
    /// </summary>
    /// <param name="data">Property data for quantum optimization</param>
    /// <param name="parameters">Quantum optimization parameters</param>
    /// <returns>Quantum-optimized valuation result</returns>
    Task<QuantumOptimizationResult> ApplyQuantumOptimizationAsync(object data, object parameters);

    /// <summary>
    /// Performs comparative analysis between Harris PACS and TerraFusion valuations
    /// </summary>
    /// <param name="request">Comparative analysis request</param>
    /// <returns>Comparative analysis with accuracy metrics</returns>
    Task<ComparativeAnalysisResult> PerformComparativeAnalysisAsync(ComparativeAnalysisRequest request);
}

// Supporting types for AI Orchestrator
public class AISwarmConfig
{
    public int AgentCount { get; set; } = 1008;
    public string Mode { get; set; } = "PropertyEnhancement";
    public string CountyId { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
}

public class AISwarmActivationResult
{
    public bool Success { get; set; }
    public int ActivatedAgents { get; set; }
    public string SwarmId { get; set; } = string.Empty;
    public DateTime ActivatedAt { get; set; }
    public Dictionary<string, object> ConsciousnessParameters { get; set; } = new();
}

public class AIEnhancementRequest
{
    public string PropertyId { get; set; } = string.Empty;
    public string CountyId { get; set; } = string.Empty;
    public Dictionary<string, object> PropertyData { get; set; } = new();
    public List<string> EnhancementTypes { get; set; } = new();
}

public class EnhancedPropertyAssessment
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal EnhancedValue { get; set; }
    public decimal ConfidenceScore { get; set; }
    public List<string> AIInsights { get; set; } = new();
    public Dictionary<string, object> Metrics { get; set; } = new();
}

public class QuantumOptimizationResult
{
    public decimal OptimizedValue { get; set; }
    public decimal QuantumFactor { get; set; }
    public string OptimizationMethod { get; set; } = string.Empty;
    public Dictionary<string, object> Metrics { get; set; } = new();
}

public class ComparativeAnalysisRequest
{
    public string PropertyId { get; set; } = string.Empty;
    public string CountyId { get; set; } = string.Empty;
    public Dictionary<string, object> HarrisPACSData { get; set; } = new();
    public Dictionary<string, object> TerraFusionData { get; set; } = new();
    public Dictionary<string, object> BaselineData { get; set; } = new();
    public Dictionary<string, object> EnhancementData { get; set; } = new();
    public AnalysisDepth AnalysisDepth { get; set; }
    public List<string> FocusAreas { get; set; } = new();
}

public class ComparativeAnalysisResult
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal AccuracyImprovement { get; set; }
    public decimal ValueDifference { get; set; }
    public List<string> KeyDifferences { get; set; } = new();
    public Dictionary<string, object> Metrics { get; set; } = new();
}
