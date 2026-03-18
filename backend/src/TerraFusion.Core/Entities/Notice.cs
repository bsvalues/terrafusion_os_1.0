using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Outbound notice record — tracks generation, queuing, and delivery
/// of statutory notices (value change, exemption decision, etc.).
/// Write-lane owner: Dais.
/// </summary>
public class Notice
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string TemplateId { get; set; } = string.Empty;

    /// <summary>mail | email | certified_mail</summary>
    [Required]
    [StringLength(30)]
    public string DeliveryMethod { get; set; } = "mail";

    /// <summary>generated | queued | sent | failed | sealed</summary>
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "generated";

    public DateTime? SentAt { get; set; }

    /// <summary>JSON-serialized template field replacements.</summary>
    public string? Fields { get; set; }

    /// <summary>RCW statutory reference for this notice type.</summary>
    [StringLength(20)]
    public string? RcwReference { get; set; }

    public string? FailureReason { get; set; }

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
