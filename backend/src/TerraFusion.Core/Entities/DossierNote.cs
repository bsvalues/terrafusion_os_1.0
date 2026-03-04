using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Append-only case note for a parcel dossier.
/// Write-lane owner: Dossier.
/// </summary>
public class DossierNote
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string NoteType { get; set; } = "case_note";

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    // Audit fields (auto-populated for FISMA compliance)
    [StringLength(200)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
