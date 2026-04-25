using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum SetStatus
{
    Draft,
    Simulating,
    PendingApproval,
    Approved,
    Applied,
    Reverted,
    Discarded,
}

public class AdjustmentSet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    public SetStatus Status { get; set; } = SetStatus.Draft;

    public Guid OwnerUserId { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public DateTime? AppliedAt { get; set; }
    public Guid? AppliedRunId { get; set; }

    public ICollection<AdjustmentProposal> Proposals { get; set; } = new List<AdjustmentProposal>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
