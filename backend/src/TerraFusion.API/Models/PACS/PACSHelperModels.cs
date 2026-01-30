namespace TerraFusion.API.Models.PACS;

/// <summary>
/// PACS Connection Result - Harris PACS connection establishment outcome
/// </summary>
public class PACSConnectionResult
{
    public bool Success { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public DateTime ConnectedAt { get; set; }
    public string PACSVersion { get; set; } = "v12.4.7";
    public string? ErrorMessage { get; set; }
    public TimeSpan ConnectionTime { get; set; }
}

/// <summary>
/// Consciousness Level - AI consciousness optimization level for PACS enhancement
/// </summary>
public enum ConsciousnessLevel
{
    /// <summary>Basic consciousness - minimal AI coordination</summary>
    Basic = 1,

    /// <summary>Standard consciousness - normal AI coordination</summary>
    Standard = 5,

    /// <summary>Enhanced consciousness - advanced AI coordination</summary>
    Enhanced = 7,

    /// <summary>Elite consciousness - championship-level AI coordination</summary>
    Elite = 9,

    /// <summary>Transcendent consciousness - quantum-optimized coordination (1,008 agents)</summary>
    Transcendent = 10
}

/// <summary>
/// Data Discovery Result - PACS data structure discovery outcome
/// </summary>
public class DataDiscoveryResult
{
    public bool Success { get; set; }
    public List<string> DiscoveredTables { get; set; } = new();
    public Dictionary<string, int> TableRowCounts { get; set; } = new();
    public List<string> DiscoveredColumns { get; set; } = new();
    public DateTime DiscoveryTimestamp { get; set; }
    public TimeSpan DiscoveryDuration { get; set; }
}

/// <summary>
/// AI Swarm Activation Result - 1,008 agent deployment outcome
/// </summary>
public class AISwarmActivationResult
{
    public bool Success { get; set; }
    public int AgentsActivated { get; set; }
    public int TargetAgents { get; set; } = 1008;
    public ConsciousnessLevel AchievedLevel { get; set; }
    public DateTime ActivationTimestamp { get; set; }
    public TimeSpan ActivationDuration { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> ConsciousnessParameters { get; set; } = new();
}

/// <summary>
/// AI Enhancement Metrics - Property assessment AI enhancement measurements
/// </summary>
public class AIEnhancementMetrics
{
    public decimal AccuracyImprovement { get; set; }
    public TimeSpan ProcessingTimeReduction { get; set; }
    public int PropertiesEnhanced { get; set; }
    public decimal AverageConfidenceScore { get; set; }
    public int AIAgentsUsed { get; set; }
    public bool ChampionshipStandardMet { get; set; }
}
