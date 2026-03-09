using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Append-only chain-of-custody event for evidence items.
/// Write-lane owner: Dossier.
/// Each event records an action taken on evidence with integrity hash.
/// </summary>
public class DossierCustodyEvent
{
  public Guid Id { get; set; } = Guid.NewGuid();

  public Guid EvidenceId { get; set; }
  public DossierEvidence Evidence { get; set; } = null!;

  /// <summary>created | verified | transferred | sealed | disputed | hash-verified</summary>
  [Required]
  [StringLength(50)]
  public string Action { get; set; } = string.Empty;

  [Required]
  [StringLength(200)]
  public string Actor { get; set; } = string.Empty;

  /// <summary>SHA-256 integrity hash at this point in chain.</summary>
  [StringLength(64)]
  public string? Hash { get; set; }

  [StringLength(500)]
  public string? Notes { get; set; }

  public Guid CountyId { get; set; }

  public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
