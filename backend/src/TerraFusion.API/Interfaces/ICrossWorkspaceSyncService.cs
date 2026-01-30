using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// Cross-workspace synchronization service for unified research environments.
/// Coordinates research activities between TerraSync and Property Workbench quantum systems.
/// </summary>
public interface ICrossWorkspaceSyncService
{
    /// <summary>
    /// Establishes quantum consciousness bridge between workspaces.
    /// </summary>
    Task<WorkspaceSyncResult> EstablishCrossWorkspaceBridgeAsync(
        WorkspaceSyncRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronizes research data across unified environments.
    /// </summary>
    Task<DataSyncResult> SynchronizeResearchDataAsync(
        string bridgeId,
        SyncParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Monitors cross-workspace research coordination status.
    /// </summary>
    Task<WorkspaceCoordinationStatus> GetCoordinationStatusAsync(
        string bridgeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates cross-workspace integration compliance.
    /// </summary>
    Task<IntegrationComplianceResult> ValidateIntegrationComplianceAsync(
        string bridgeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves cross-workspace research data for analysis.
    /// </summary>
    Task<object> GetCrossWorkspaceDataAsync(
        string bridgeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets current synchronization status across workspaces.
    /// </summary>
    Task<object> GetSyncStatusAsync(
        string bridgeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Triggers manual synchronization between workspaces.
    /// </summary>
    Task<object> ManualSyncAsync(
        string bridgeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Initializes cross-workspace synchronization with quantum consciousness coordination.
    /// </summary>
    Task<object> InitializeCrossWorkspaceSyncAsync(
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Workspace synchronization request for cross-environment coordination.
/// </summary>
public class WorkspaceSyncRequest
{
    [Required]
    public string SourceWorkspace { get; set; } = string.Empty;

    [Required]
    public string TargetWorkspace { get; set; } = string.Empty;

    public SyncConfiguration Configuration { get; set; } = new();
    public ResearcherCredentials Credentials { get; set; } = new();
}

/// <summary>
/// Synchronization configuration for cross-workspace coordination.
/// </summary>
public class SyncConfiguration
{
    public SyncMode Mode { get; set; } = SyncMode.Bidirectional;
    public bool QuantumEnhanced { get; set; } = true;
    public decimal SyncAccuracy { get; set; } = 0.999m;
    public List<string> DataCategories { get; set; } = new();
    public Dictionary<string, object> AdvancedSettings { get; set; } = new();
}

/// <summary>
/// Researcher credentials for workspace access validation.
/// </summary>
public class ResearcherCredentials
{
    [Required]
    public string ResearcherId { get; set; } = string.Empty;

    public string Institution { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public ResearchLevel Level { get; set; } = ResearchLevel.PhD;
    public List<string> Permissions { get; set; } = new();
}

/// <summary>
/// Workspace synchronization result with quantum coordination metrics.
/// </summary>
public class WorkspaceSyncResult
{
    public string BridgeId { get; set; } = Guid.NewGuid().ToString();
    public bool SyncEstablished { get; set; }
    public WorkspaceCoordinationStatus Status { get; set; } = new();
    public DateTime EstablishedAt { get; set; } = DateTime.UtcNow;
    public List<string> CoordinationInsights { get; set; } = new();
}

/// <summary>
/// Synchronization parameters for data coordination excellence.
/// </summary>
public class SyncParameters
{
    public bool RealTimeSync { get; set; } = true;
    public TimeSpan SyncInterval { get; set; } = TimeSpan.FromSeconds(1);
    public decimal ConflictResolutionAccuracy { get; set; } = 0.999m;
    public bool ValidateIntegrity { get; set; } = true;
    public Dictionary<string, object> CustomParameters { get; set; } = new();
}

/// <summary>
/// Data synchronization result with comprehensive validation.
/// </summary>
public class DataSyncResult
{
    public bool SyncSuccessful { get; set; }
    public int RecordsSynced { get; set; }
    public List<string> SyncedCategories { get; set; } = new();
    public SyncValidationMetrics Validation { get; set; } = new();
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Cross-workspace coordination status with real-time metrics.
/// </summary>
public class WorkspaceCoordinationStatus
{
    public CoordinationState State { get; set; } = CoordinationState.Active;
    public decimal CoordinationEfficiency { get; set; }
    public int ActiveConnections { get; set; }
    public QuantumCoordinationMetrics QuantumMetrics { get; set; } = new();
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Integration compliance validation result.
/// </summary>
public class IntegrationComplianceResult
{
    public bool IsCompliant { get; set; }
    public decimal ComplianceScore { get; set; }
    public List<ComplianceValidation> Validations { get; set; } = new();
    public bool GovernmentGradeCompliant { get; set; }
}

/// <summary>
/// Sync validation metrics for data integrity assurance.
/// </summary>
public class SyncValidationMetrics
{
    public decimal DataIntegrityScore { get; set; }
    public int ValidationErrors { get; set; }
    public bool ConsistencyValidated { get; set; }
    public Dictionary<string, decimal> CategoryAccuracy { get; set; } = new();
}

/// <summary>
/// Quantum coordination metrics for cross-workspace excellence.
/// </summary>
public class QuantumCoordinationMetrics
{
    public decimal QuantumCoherence { get; set; }
    public decimal EntanglementStrength { get; set; }
    public int QuantumChannels { get; set; }
    public bool QuantumOptimized { get; set; }
}

/// <summary>
/// Compliance validation details for integration standards.
/// </summary>
public class ComplianceValidation
{
    public string ValidationCategory { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public decimal Score { get; set; }
    public List<string> Details { get; set; } = new();
}

/// <summary>
/// Synchronization mode options for cross-workspace coordination.
/// </summary>
public enum SyncMode
{
    Unidirectional,
    Bidirectional,
    MasterSlave,
    PeerToPeer
}

/// <summary>
/// Research level classification for credential validation.
/// </summary>
public enum ResearchLevel
{
    Graduate,
    PhD,
    PostDoc,
    Professor,
    Elite
}

/// <summary>
/// Coordination state enumeration for status tracking.
/// </summary>
public enum CoordinationState
{
    Initializing,
    Active,
    Synchronized,
    Error,
    Disconnected
}