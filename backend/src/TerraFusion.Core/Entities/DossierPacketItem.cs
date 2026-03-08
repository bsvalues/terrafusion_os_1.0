using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Line item within a DossierPacket — tracks whether each required document type is satisfied.
/// Write-lane owner: Dossier.
/// </summary>
public class DossierPacketItem
{
  public Guid Id { get; set; } = Guid.NewGuid();

  public Guid PacketId { get; set; }
  public DossierPacket Packet { get; set; } = null!;

  /// <summary>Required document type from template (e.g., "deed", "appraisal", "appeal").</summary>
  [Required]
  [StringLength(50)]
  public string DocumentType { get; set; } = string.Empty;

  /// <summary>Matched document, if found.</summary>
  public Guid? DocumentId { get; set; }
  public DossierDocument? Document { get; set; }

  public bool Required { get; set; } = true;
  public bool Satisfied { get; set; }

  public DateTime? SatisfiedAt { get; set; }
}
