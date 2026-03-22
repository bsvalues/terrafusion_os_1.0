using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Tax code area assignment per property per year, joined with tax_area description.
/// From PACS property_tax_area JOIN tax_area tables.
/// Links each parcel to its levy code area for a given appraisal year.
/// </summary>
[Table("pacs_tax_areas")]
[Index(nameof(PacsPropId), nameof(TaxYear), Name = "IX_PacsTaxArea_PropYear", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsTaxArea_ParcelId")]
[Index(nameof(TaxAreaNumber), Name = "IX_PacsTaxArea_AreaNumber")]
public class PacsTaxArea
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public decimal TaxYear { get; set; }
    public int SupNum { get; set; }
    public int PacsTaxAreaId { get; set; }

    /// <summary>Tax code area number — the human-readable levy area identifier (tax_area.tax_area_number)</summary>
    [MaxLength(23)]
    public string? TaxAreaNumber { get; set; }

    /// <summary>State associated with tax area (tax_area.tax_area_state)</summary>
    [MaxLength(50)]
    public string? TaxAreaState { get; set; }

    /// <summary>Description of the tax code area (tax_area.tax_area_description)</summary>
    [MaxLength(255)]
    public string? TaxAreaDescription { get; set; }

    /// <summary>Comment on the tax area (tax_area.comment)</summary>
    [MaxLength(2048)]
    public string? Comment { get; set; }

    /// <summary>Pending reassignment tax area ID (property_tax_area.tax_area_id_pending)</summary>
    public int? TaxAreaIdPending { get; set; }

    /// <summary>Effective date of this area assignment (property_tax_area.effective_date)</summary>
    public DateTime? EffectiveDate { get; set; }

    /// <summary>Annexation value flag (property_tax_area.is_annex_value)</summary>
    public bool? IsAnnexValue { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
