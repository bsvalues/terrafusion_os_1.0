using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum AdjustmentScope
{
    Neighborhood,
    NeighborhoodQuintile,
    CityRollup,
    FeatureCode,
    ParcelList,
}

public enum AdjustmentKind
{
    PercentOfAV,
    FlatDelta,
    FeatureUnitRate,
    TimeAdjustment,
    RemoveSale,
    ReassignNeighborhood,
    SplitNeighborhood,
}

public enum ProposalStatus
{
    Draft,
    UnderReview,
    Approved,
    Rejected,
    Applied,
    Reverted,
}

public class AdjustmentProposal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }

    public AdjustmentScope Scope { get; set; }
    public AdjustmentKind Kind { get; set; }

    public decimal Magnitude { get; set; }

    [StringLength(50)]
    public string? TargetNeighborhoodCode { get; set; }

    [StringLength(50)]
    public string? TargetFeatureCode { get; set; }

    [StringLength(50)]
    public string? TargetCityCode { get; set; }

    public int? TargetQuintile { get; set; }

    // For ParcelList scope — stored as newline-delimited parcel IDs
    public string? ParcelListJson { get; set; }

    [Required]
    [StringLength(1000)]
    public string Rationale { get; set; } = string.Empty;

    public Guid ProposedByUserId { get; set; }
    public DateTime ProposedAt { get; set; } = DateTime.UtcNow;

    public ProposalStatus Status { get; set; } = ProposalStatus.Draft;

    public Guid? AdjustmentSetId { get; set; }
    public AdjustmentSet? AdjustmentSet { get; set; }

    // Simulation result snapshot (JSON) — populated after simulate call
    public string? SimulationResultJson { get; set; }
    public int? SimulatedParcelsAffected { get; set; }
    public decimal? SimulatedTotalDeltaAV { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
