using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Work-queue item — tracks a discrete task (field inspection, desk review,
/// appeal preparation, etc.) through its lifecycle with SLA enforcement.
/// Write-lane owner: Dais.
/// </summary>
public class QueueItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    /// <summary>FIELD_INSPECTION | DESK_REVIEW | APPEAL_PREPARATION | etc.</summary>
    [Required]
    [StringLength(50)]
    public string TaskType { get; set; } = string.Empty;

    /// <summary>normal | high | urgent</summary>
    [Required]
    [StringLength(20)]
    public string Priority { get; set; } = "normal";

    /// <summary>queued | in_progress | completed | failed | escalated</summary>
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "queued";

    [StringLength(200)]
    public string? AssignedTo { get; set; }

    public int? SlaHours { get; set; }
    public DateTime? SlaDeadline { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public string? Notes { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    // Audit fields (auto-populated for FISMA compliance)
    [StringLength(200)]
    public string? CreatedBy { get; set; }

    [StringLength(200)]
    public string? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
