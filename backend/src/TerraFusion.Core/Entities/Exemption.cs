using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Property tax exemption record (senior/disabled, current use, historic, etc.).
/// Write-lane owner: Dais.
/// </summary>
public class Exemption
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    /// <summary>SENIOR_DISABLED | CURRENT_USE | HISTORIC | etc.</summary>
    [Required]
    [StringLength(30)]
    public string ProgramCode { get; set; } = string.Empty;

    /// <summary>pending | approved | denied | expired</summary>
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "pending";

    [StringLength(200)]
    public string? ApplicantName { get; set; }

    public DateTime ApplicationDate { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpirationDate { get; set; }

    public decimal ExemptionAmount { get; set; }

    /// <summary>RCW statutory reference, e.g. "84.36.381"</summary>
    [StringLength(20)]
    public string? RcwReference { get; set; }

    public string? DenialReason { get; set; }
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
