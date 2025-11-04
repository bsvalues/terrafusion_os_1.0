namespace TerraFusion.API.Models.PACS;

/// <summary>
/// Harris PACS Connection Configuration - Championship-level integration settings
/// for Tyler Technologies PACS v12.4.7 (Computer-Assisted Property Appraisal System)
/// </summary>
public class PACSConnectionConfig
{
    /// <summary>
    /// PACS database connection string with sovereign county data isolation
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// PACS API base URL for Harris PACS v12.4.7 integration
    /// </summary>
    public string ApiBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Government jurisdiction identifier (e.g., "BENTON_COUNTY_WA")
    /// </summary>
    public string Jurisdiction { get; set; } = string.Empty;

    /// <summary>
    /// Connection timeout in seconds (default: 30s for government-grade reliability)
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Enable automatic retry with exponential backoff for transient failures
    /// </summary>
    public bool EnableRetry { get; set; } = true;

    /// <summary>
    /// Maximum retry attempts for failed PACS operations
    /// </summary>
    public int MaxRetryAttempts { get; set; } = 3;

    /// <summary>
    /// Enable FISMA-High security compliance logging for all PACS operations
    /// </summary>
    public bool EnableSecurityLogging { get; set; } = true;

    /// <summary>
    /// PACS API authentication token for secure county system integration
    /// </summary>
    public string? AuthenticationToken { get; set; }

    /// <summary>
    /// Enable quantum encryption (CRYSTALS-Kyber 3072-bit) for PACS data transmission
    /// </summary>
    public bool EnableQuantumEncryption { get; set; } = true;

    /// <summary>
    /// Batch size for property data synchronization (default: 1000 parcels per batch)
    /// </summary>
    public int SyncBatchSize { get; set; } = 1000;

    /// <summary>
    /// Enable AI-enhanced property valuation via 1,008 agent coordination
    /// </summary>
    public bool EnableAIEnhancement { get; set; } = true;
}
