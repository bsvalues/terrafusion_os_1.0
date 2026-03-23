using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Owner-level tax area association from PACS wash_prop_owner_tax_area_assoc.
/// Links each property-owner combination to its tax area for a given year.
/// Composite natural key: (prop_id, year, sup_num, owner_id, tax_area_id).
/// </summary>
[Table("pacs_tax_area_assocs")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(SupNum), nameof(PacsOwnerId), nameof(TaxAreaId),
    Name = "IX_PacsTaxAreaAssoc_PropYearSupOwnerArea", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsTaxAreaAssoc_ParcelId")]
public class PacsTaxAreaAssoc
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int SupNum { get; set; }
    public int PacsOwnerId { get; set; }

    /// <summary>PACS tax_area_id — FK to tax_area in PACS</summary>
    [MaxLength(50)]
    public string TaxAreaId { get; set; } = string.Empty;

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
