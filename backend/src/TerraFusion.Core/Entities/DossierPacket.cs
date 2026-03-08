using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Assessment packet record — a compliance-ready bundle of documents
/// for a specific purpose (BOE appeal, certification, exemption review, etc.).
/// Write-lane owner: Dossier.
/// </summary>
public class DossierPacket
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required]
  [StringLength(50)]
  public string ParcelId { get; set; } = string.Empty;

  /// <summary>boe_appeal | certification | exemption_review | annual_assessment | desk_review</summary>
  [Required]
  [StringLength(50)]
  public string PacketType { get; set; } = string.Empty;

  [Required]
  [StringLength(200)]
  public string Name { get; set; } = string.Empty;

  /// <summary>draft | complete | sealed</summary>
  [Required]
  [StringLength(20)]
  public string Status { get; set; } = "draft";

  public double CompletenessPercent { get; set; }
  public int SatisfiedCount { get; set; }
  public int TotalRequired { get; set; }

  public Guid CountyId { get; set; }
  public County County { get; set; } = null!;

  [StringLength(200)]
  public string CreatedBy { get; set; } = string.Empty;

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

  public ICollection<DossierPacketItem> Items { get; set; } = new List<DossierPacketItem>();
}
