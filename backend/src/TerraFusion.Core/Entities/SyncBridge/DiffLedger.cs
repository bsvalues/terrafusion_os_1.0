using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: per-load diff log. Records what changed between
/// the previous load batch and the current one for each entity /
/// field. Used by the diff engine and by the rollback packager.
/// </summary>
public sealed class DiffLedger
{
    public long DiffId { get; set; }

    public Guid LoadBatchId { get; set; }
    public string TfEntityType { get; set; } = string.Empty;
    public Guid TfEntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;

    /// <summary>'INSERT' | 'UPDATE' | 'DELETE' | 'NO_CHANGE'.</summary>
    public string DiffKind { get; set; } = string.Empty;

    public string? BeforeValue { get; set; }
    public string? AfterValue { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
