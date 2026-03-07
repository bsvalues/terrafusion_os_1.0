using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Document attachment for a parcel dossier — deeds, photos, appraisals, sketches, etc.
/// Write-lane owner: Dossier.
/// Blob content stored on filesystem (production: blob storage via DI swap).
/// Chain-of-custody tracked via append-only ChainEvents.
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
    public string DocumentType { get; set; } = "report";

    [Required]
    [StringLength(100)]
    public string MimeType { get; set; } = "application/octet-stream";

    /// <summary>File size in bytes.</summary>
    public long SizeBytes { get; set; }

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "active";

    /// <summary>SHA-256 hash of the file content for integrity verification.</summary>
    [Required]
    [StringLength(64)]
    public string ContentHash { get; set; } = string.Empty;

    /// <summary>
    /// Storage reference — relative path or blob URI.
    /// Not exposed to API consumers.
    /// </summary>
    [Required]
    [StringLength(500)]
    public string StorageRef { get; set; } = string.Empty;

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    // Audit fields (auto-populated for FISMA compliance)
    [StringLength(200)]
    public string UploadedBy { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Append-only chain-of-custody event for a dossier document.
/// Enables tamper-evident audit trail for regulatory handoff.
/// </summary>
public class DocumentChainEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DocumentId { get; set; }
    public DossierDocument Document { get; set; } = null!;

    [Required]
    [StringLength(50)]
    public string Action { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Actor { get; set; } = string.Empty;

    /// <summary>SHA-256 hash at time of event — proves state at that point.</summary>
    [Required]
    [StringLength(64)]
    public string Hash { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
