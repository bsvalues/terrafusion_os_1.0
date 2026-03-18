using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Data.Schemas.Pilt;

/// <summary>
/// EF Core entity representing a Payment In Lieu of Taxes (PILT) record.
/// PILT payments are made by tax-exempt entities (federal, state, tribal, or other)
/// to counties in lieu of property taxes on exempt land.
/// Owner suite: TerraDais (workflow / state management).
/// </summary>
[Table("PiltPayments")]
public class PiltPayment
{
    /// <summary>Primary key.</summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Name of the entity making the payment (e.g. "U.S. Forest Service").</summary>
    [Required]
    [StringLength(300)]
    public string PayingEntityName { get; set; } = string.Empty;

    /// <summary>
    /// Classification of the paying entity.
    /// Expected values: federal, state, tribal, other.
    /// </summary>
    [Required]
    [StringLength(50)]
    public string PayingEntityType { get; set; } = string.Empty;

    /// <summary>Parcel identifier for the property associated with the payment.</summary>
    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    /// <summary>Tax year to which the payment applies.</summary>
    public int TaxYear { get; set; }

    /// <summary>Payment amount in US dollars.</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaymentAmount { get; set; }

    /// <summary>Date the payment was received or recorded.</summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// Federal program code under which the payment was issued (e.g. PILT, Refuge Revenue Sharing).
    /// Null when not applicable or not a federal payment.
    /// </summary>
    [StringLength(100)]
    public string? FederalProgramCode { get; set; }

    /// <summary>County identifier — enforces sovereign county data isolation.</summary>
    [Required]
    [StringLength(50)]
    public string CountyId { get; set; } = string.Empty;

    /// <summary>
    /// Current processing status of the payment.
    /// Expected values: Pending, Recorded, Verified, Distributed, Rejected.
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Pending";

    /// <summary>Free-text notes or remarks about the payment.</summary>
    [StringLength(2000)]
    public string? Notes { get; set; }

    // ── FISMA-required audit fields (auto-populated) ─────────────────

    /// <summary>Timestamp when the record was created (UTC).</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Timestamp when the record was last updated (UTC).</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Identity of the user who created the record.</summary>
    [StringLength(200)]
    public string? CreatedBy { get; set; }

    /// <summary>Identity of the user who last updated the record.</summary>
    [StringLength(200)]
    public string? UpdatedBy { get; set; }
}
