using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Audit finding for a parcel or taxing district.
/// Write-lane: audit.
/// </summary>
public class AuditFinding
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [StringLength(50)]
    public string? ParcelId { get; set; }

    [Required] [StringLength(50)]
    public string FindingType { get; set; } = string.Empty;

    [Required] [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(20)]
    public string Severity { get; set; } = "medium";

    [StringLength(20)]
    public string Status { get; set; } = "submitted";

    public int TaxYear { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Cross-office financial reconciliation run.
/// Write-lane: audit.
/// </summary>
public class AuditReconciliation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public int TaxYear { get; set; }

    [StringLength(500)]
    public string Offices { get; set; } = "assessor,treasurer";

    [StringLength(20)]
    public string Status { get; set; } = "completed";

    public int Discrepancies { get; set; }
    public decimal TotalReconciled { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
