using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Board of Equalization appeal record for a property valuation dispute.
/// Write-lane owner: Dais.
/// </summary>
public class Appeal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    /// <summary>MARKET_VALUE | UNIFORMITY | CLASSIFICATION | EXEMPTION_DENIAL | CLERICAL_ERROR</summary>
    [Required]
    [StringLength(30)]
    public string AppealGround { get; set; } = string.Empty;

    /// <summary>filed | scheduled | heard | decided | withdrawn</summary>
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "filed";

    [StringLength(200)]
    public string? PetitionerName { get; set; }

    public DateTime FiledDate { get; set; }
    public DateTime? HearingDate { get; set; }
    public DateTime? DecisionDate { get; set; }

    public decimal CurrentValue { get; set; }
    public decimal RequestedValue { get; set; }
    public decimal? DecidedValue { get; set; }

    public string? DecisionNotes { get; set; }

    public int TaxYear { get; set; }

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
