using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: contested-authority writes await human review
/// here. Created when a sync attempt's <c>FieldAuthority.ConflictStrategy</c>
/// is <c>MANUAL_REVIEW</c> and the proposed value differs from the
/// current value.
///
/// <para>v1 only enqueues. The conflict review UI lives in Phase 2+.</para>
/// </summary>
public sealed class ConflictQueue
{
    public Guid ConflictId { get; set; } = Guid.NewGuid();

    public Guid LoadBatchId { get; set; }
    public string TfEntityType { get; set; } = string.Empty;
    public Guid TfEntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string DomainName { get; set; } = string.Empty;

    public string? ProposedValue { get; set; }
    public string? CurrentValue { get; set; }
    public string ConflictStrategy { get; set; } = string.Empty;

    /// <summary>'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_RESOLVED'.</summary>
    public string ResolutionStatus { get; set; } = "PENDING";

    public string? ResolvedValue { get; set; }
    public string? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
