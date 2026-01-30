namespace TerraFusion.API.Models.Modules;

/// <summary>
/// Module Definition - Core module metadata
/// </summary>
public class ModuleDefinition
{
    /// <summary>
    /// Unique module identifier
    /// </summary>
    public string ModuleId { get; set; } = string.Empty;

    /// <summary>
    /// Module name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Module version (e.g., "1.0.0")
    /// </summary>
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// Module description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Module status
    /// </summary>
    public ModuleStatus Status { get; set; }

    /// <summary>
    /// Module type
    /// </summary>
    public ModuleType Type { get; set; }

    /// <summary>
    /// Module dependencies
    /// </summary>
    public List<string> Dependencies { get; set; } = new();

    /// <summary>
    /// Module configuration
    /// </summary>
    public Dictionary<string, object> Configuration { get; set; } = new();

    /// <summary>
    /// Required permissions
    /// </summary>
    public List<string> RequiredPermissions { get; set; } = new();

    /// <summary>
    /// Is module enabled
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Module registration timestamp
    /// </summary>
    public DateTime RegisteredAt { get; set; }

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime? LastUpdated { get; set; }

    /// <summary>
    /// Module author/publisher
    /// </summary>
    public string Publisher { get; set; } = string.Empty;
}

/// <summary>
/// Module Activation Result
/// </summary>
public class ModuleActivationResult
{
    /// <summary>
    /// Module ID
    /// </summary>
    public string ModuleId { get; set; } = string.Empty;

    /// <summary>
    /// Activation success flag
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Activation timestamp
    /// </summary>
    public DateTime ActivatedAt { get; set; }

    /// <summary>
    /// Activation duration
    /// </summary>
    public TimeSpan ActivationDuration { get; set; }

    /// <summary>
    /// Error message if activation failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Warning messages
    /// </summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>
    /// Module status after activation
    /// </summary>
    public ModuleStatus Status { get; set; }

    /// <summary>
    /// Initialized components
    /// </summary>
    public List<string> InitializedComponents { get; set; } = new();
}

/// <summary>
/// Module Status Enumeration
/// </summary>
public enum ModuleStatus
{
    /// <summary>
    /// Module is registered but not activated
    /// </summary>
    Registered = 0,

    /// <summary>
    /// Module is currently activating
    /// </summary>
    Activating = 1,

    /// <summary>
    /// Module is active and running
    /// </summary>
    Active = 2,

    /// <summary>
    /// Module is deactivating
    /// </summary>
    Deactivating = 3,

    /// <summary>
    /// Module is inactive
    /// </summary>
    Inactive = 4,

    /// <summary>
    /// Module has errors
    /// </summary>
    Error = 5,

    /// <summary>
    /// Module is disabled
    /// </summary>
    Disabled = 6
}

/// <summary>
/// Module Type Enumeration
/// </summary>
public enum ModuleType
{
    /// <summary>
    /// Core system module
    /// </summary>
    Core = 0,

    /// <summary>
    /// Government integration module
    /// </summary>
    GovernmentIntegration = 1,

    /// <summary>
    /// AI/ML module
    /// </summary>
    ArtificialIntelligence = 2,

    /// <summary>
    /// Data processing module
    /// </summary>
    DataProcessing = 3,

    /// <summary>
    /// Analytics module
    /// </summary>
    Analytics = 4,

    /// <summary>
    /// Security/Compliance module
    /// </summary>
    SecurityCompliance = 5,

    /// <summary>
    /// UI/Dashboard module
    /// </summary>
    UserInterface = 6,

    /// <summary>
    /// Third-party integration module
    /// </summary>
    ThirdPartyIntegration = 7
}
