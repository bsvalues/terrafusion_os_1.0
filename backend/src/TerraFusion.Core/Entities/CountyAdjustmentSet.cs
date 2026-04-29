// backend/src/TerraFusion.Core/Entities/CountyAdjustmentSet.cs
// NOTE: This is distinct from the existing AdjustmentSet (calibration workbench).
// CountyAdjustmentSet is County Studio's governed output artifact.
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum AdjustmentSetApprovalState
{
    // County Studio's governed workflow stops at Approved. Published
    // and RolledBack remain only for legacy read compatibility with
    // older rows and are not legal transition targets in County Studio.
    Proposed, ReadyForApproval, Approved, Published, RolledBack
}

public class CountyAdjustmentSet
{
    public Guid AdjustmentSetId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid ScenarioId { get; set; }
    public Guid CountyId { get; set; }

    // JSON: { cohortId, segmentIds[], parcelCount }
    [Required]
    public string EffectiveScope { get; set; } = "{}";

    public AdjustmentSetApprovalState ApprovalState { get; set; } = AdjustmentSetApprovalState.Proposed;

    [StringLength(500)]
    public string? ApprovedBy { get; set; }

    // Token used to identify this adjustment set for rollback
    [StringLength(100)]
    public string? RollbackToken { get; set; }

    public DateTime? PublishedAt { get; set; }

    /// <summary>
    /// Reason provided by the user when rolling back a published set.
    /// Required for FISMA audit trail. Populated only when State transitions to RolledBack.
    /// </summary>
    [StringLength(1000)]
    public string? RollbackReason { get; set; }

    // Navigation
    public CountyScenario? Scenario { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
