using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: every promoted load batch produces a rollback
/// package — a JSON-encoded inverse-operation set that can undo
/// the batch end-to-end.
///
/// <para>v1 only stores packages. Rollback execution lives in
/// Phase 2+.</para>
/// </summary>
public sealed class RollbackPackage
{
    public Guid RollbackPackageId { get; set; } = Guid.NewGuid();

    public Guid LoadBatchId { get; set; }

    /// <summary>JSON-encoded inverse-operation set; jsonb in Postgres.</summary>
    public string PackagePayload { get; set; } = "{}";

    public long PackageSizeBytes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RestorableUntil { get; set; }
    public DateTime? AppliedAt { get; set; }
    public string? AppliedBy { get; set; }

    /// <summary>'AVAILABLE' | 'APPLIED' | 'EXPIRED' | 'CORRUPTED'.</summary>
    public string Status { get; set; } = "AVAILABLE";
}
