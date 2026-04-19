using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class AdjustmentRun
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AdjustmentSetId { get; set; }
    public AdjustmentSet? AdjustmentSet { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }

    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public Guid AppliedByUserId { get; set; }
    public Guid ApprovedByUserId { get; set; }   // must differ from AppliedByUserId

    // Serialized NeighborhoodStat arrays (JSON) — immutable snapshots
    [Required]
    public string PreStatsSnapshot { get; set; } = "[]";

    [Required]
    public string PostStatsSnapshot { get; set; } = "[]";

    public int ParcelsAffected { get; set; }
    public decimal TotalDeltaAV { get; set; }

    public bool IsReversion { get; set; }
    public Guid? RevertedRunId { get; set; }   // which run this reverts (if IsReversion)

    public ICollection<ParcelAdjustmentRecord> ParcelChanges { get; set; } = new List<ParcelAdjustmentRecord>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
}

public class ParcelAdjustmentRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AdjustmentRunId { get; set; }
    public AdjustmentRun? AdjustmentRun { get; set; }

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    public decimal PreAV { get; set; }
    public decimal PostAV { get; set; }
    public decimal DeltaAV { get; set; }

    public Guid SourceProposalId { get; set; }
}
