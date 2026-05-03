using System;

namespace TerraFusion.Core.Entities.Sync;

/// <summary>
/// Operator-defined connection profile for a county's source system (PACS, Ascend, ProVal, etc.).
/// Stores HOW to reach a source, not WHAT the source contains.
///
/// Auth posture (locked at Slice B1.0): default is Windows Integrated. <see cref="Username"/>
/// is only used when <see cref="AuthMode"/> is "SqlAuth", and even then NO PASSWORD is stored
/// here — passwords live in OS-level secret storage (Windows Credential Manager, vault, or env)
/// and are resolved at connection time. This avoids putting plaintext credentials in the
/// TerraFusion DB.
/// </summary>
public sealed class SyncSourceConnection
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    /// <summary>Operator-friendly label, e.g. "Benton PACS Training" or "Benton Ascend 2017 Snapshot".</summary>
    public string Name { get; set; } = null!;

    /// <summary>Logical source system family. Common values: PACS, Ascend, ProVal, Tyler, Aumentum.</summary>
    public string SourceSystem { get; set; } = "PACS";

    /// <summary>Connector implementation type. Common values: SqlServer, FlatFile, Odbc.</summary>
    public string ConnectionType { get; set; } = "SqlServer";

    public string? Server { get; set; }
    public string? Database { get; set; }

    /// <summary>WindowsIntegrated (default) or SqlAuth. SqlAuth password resolution is external.</summary>
    public string AuthMode { get; set; } = "WindowsIntegrated";

    /// <summary>Used only when AuthMode = SqlAuth. Password is NEVER stored here.</summary>
    public string? Username { get; set; }

    /// <summary>Free-form additional connection-string options (e.g., "TrustServerCertificate=True").</summary>
    public string? AdditionalOptions { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset? LastSuccessfulConnectionAtUtc { get; set; }
    public DateTimeOffset? LastConnectionErrorAtUtc { get; set; }
    public string? LastConnectionErrorMessage { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
