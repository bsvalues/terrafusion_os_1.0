using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Joins tax areas to the levy codes that apply within them for a given year.
/// Mirrors dbo.tax_area_fund_assoc JOIN dbo.tax_area (pacs_oltp).
///
/// Usage: to compute a parcel's levy bill —
///   1. Find the parcel's TaxAreaNumber from PacsTaxArea.
///   2. Query PacsLevyTaxAreaAssoc for all rows where TaxAreaNumber matches and Year matches.
///   3. Join each row to PacsLevyRate on (Year, TaxDistrictId, LevyCd) to get the rate.
///   4. amount = (assessedValue / 1000) * LevyRate.
///
/// Source: pacs_oltp.dbo.tax_area_fund_assoc JOIN dbo.tax_area
/// County context: scoped at API/seeder layer; not stored on row.
/// </summary>
[Table("pacs_levy_tax_area_assocs")]
[Index(nameof(Year), nameof(TaxAreaNumber), Name = "IX_PacsLevyTaxAreaAssoc_YearArea")]
[Index(nameof(Year), nameof(TaxDistrictId), nameof(LevyCd), nameof(TaxAreaId), IsUnique = true,
    Name = "UQ_PacsLevyTaxAreaAssoc_Composite")]
public class PacsLevyTaxAreaAssoc
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Tax year (tax_area_fund_assoc.year).</summary>
    public int Year { get; set; }

    /// <summary>PACS tax district ID (tax_area_fund_assoc.tax_district_id).</summary>
    public int TaxDistrictId { get; set; }

    /// <summary>Levy code (tax_area_fund_assoc.levy_cd), matches PacsLevyRate.LevyCd.</summary>
    [MaxLength(20)]
    public string LevyCd { get; set; } = null!;

    /// <summary>PACS tax_area.tax_area_id (integer PK on the tax_area table).</summary>
    public int TaxAreaId { get; set; }

    /// <summary>
    /// Tax area number — the human-readable code used on tax statements
    /// (e.g. "1210", "1212"). Matches PacsTaxArea.TaxAreaNumber.
    /// Null if the source join produced no tax_area_number for this row.
    /// </summary>
    [MaxLength(23)]
    public string? TaxAreaNumber { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
