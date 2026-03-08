using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Persistent evidence record linking to documents or property data.
/// Write-lane owner: Dossier.
/// Tracks evidence items with integrity status for audit compliance.
/// </summary>
public class DossierEvidence
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required]
  [StringLength(50)]
  public string ParcelId { get; set; } = string.Empty;

  [Required]
  [StringLength(200)]
  public string Title { get; set; } = string.Empty;

  /// <summary>field-inspection | valuation-record | legal-document | tax-record | correspondence | photo</summary>
  [Required]
  [StringLength(50)]
  public string EvidenceType { get; set; } = string.Empty;

  /// <summary>pending | verified | disputed</summary>
  [Required]
  [StringLength(20)]
  public string Integrity { get; set; } = "pending";

  /// <summary>Optional link to a DossierDocument.</summary>
  public Guid? DocumentId { get; set; }
  public DossierDocument? Document { get; set; }

  public Guid CountyId { get; set; }
  public County County { get; set; } = null!;

  [StringLength(200)]
  public string CreatedBy { get; set; } = string.Empty;

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
