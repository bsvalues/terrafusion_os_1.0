using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Tax roll certification workflow step — tracks completion of each
/// milestone in the annual certification pipeline.
/// Write-lane owner: Dais.
/// </summary>
public class CertificationStep
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public int TaxYear { get; set; }

    /// <summary>PRELIMINARY_ROLL | FINAL_VALUES | TAX_ROLL_CERTIFICATION | etc.</summary>
    [Required]
    [StringLength(50)]
    public string StepCode { get; set; } = string.Empty;

    /// <summary>pending | in_progress | completed | blocked</summary>
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "pending";

    [StringLength(200)]
    public string? CompletedBy { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? Notes { get; set; }

    /// <summary>Optional FK to a prior step this step depends on.</summary>
    public Guid? DependsOnStepId { get; set; }

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
