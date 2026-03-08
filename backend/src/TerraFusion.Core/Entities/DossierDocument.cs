using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Persistent document record for the Dossier document-management system.
/// Write-lane owner: Dossier.
/// Tracks metadata for uploaded/registered documents associated with parcels.
/// </summary>
public class DossierDocument
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required]
  [StringLength(50)]
  public string ParcelId { get; set; } = string.Empty;

  [Required]
  [StringLength(200)]
  public string Name { get; set; } = string.Empty;

  [Required]
  [StringLength(50)]
  public string DocumentType { get; set; } = string.Empty;

  /// <summary>active | sealed | archived</summary>
  [Required]
  [StringLength(20)]
  public string Status { get; set; } = "active";

  [Required]
  [StringLength(100)]
  public string MimeType { get; set; } = "application/octet-stream";

  public long SizeBytes { get; set; }

  /// <summary>SHA-256 of file content for tamper detection.</summary>
  [StringLength(64)]
  public string ContentHash { get; set; } = string.Empty;

  [StringLength(500)]
  public string? StoragePath { get; set; }

  [StringLength(500)]
  public string? Description { get; set; }

  /// <summary>Retention class from WA SOS CORE schedule.</summary>
  [StringLength(50)]
  public string? RetentionClass { get; set; }

  public bool EntersCustodyChain { get; set; }

  public Guid CountyId { get; set; }
  public County County { get; set; } = null!;

  [StringLength(200)]
  public string UploadedBy { get; set; } = string.Empty;

  public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

  // Audit fields (auto-populated for FISMA compliance)
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
