namespace TerraFusion.Core.Entities;

/// <summary>
/// HITL Phase 10 — an AI-proposed assessment action awaiting human approval.
/// HumanApproverId must be set before any write operation is executed.
/// </summary>
public class PilotDraft
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>The county this draft belongs to. Required for county isolation.</summary>
    public string CountyId { get; set; } = string.Empty;

    /// <summary>The actor (AI or user) that proposed this draft.</summary>
    public string ProposedBy { get; set; } = string.Empty;

    /// <summary>Human-readable summary of the proposed action.</summary>
    public string ActionSummary { get; set; } = string.Empty;

    /// <summary>JSON payload of the proposed operation. Opaque to the draft layer.</summary>
    public string ActionPayloadJson { get; set; } = string.Empty;

    /// <summary>Current status: Pending, Approved, Rejected.</summary>
    public DraftStatus Status { get; set; } = DraftStatus.Pending;

    /// <summary>
    /// REQUIRED for approval. HumanApproverId is the TruthGate —
    /// no write operation may proceed without this field set.
    /// </summary>
    public string? HumanApproverId { get; set; }

    /// <summary>Optional rejection reason when Status = Rejected.</summary>
    public string? RejectionReason { get; set; }

    // FISMA audit fields — auto-populated by AuditableEntityInterceptor
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
}

public enum DraftStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
}
