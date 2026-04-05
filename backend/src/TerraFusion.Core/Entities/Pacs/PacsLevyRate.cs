using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// PACS levy rate record. Mirrors dbo.levy (pacs_oltp).
///
/// Each row is one levy code (taxing authority + fund) for one year.
/// <see cref="LevyRate"/> is the certified rate per $1,000 of assessed value.
///
/// Levy bill arithmetic (WA State standard):
///   amount = (assessedValue / 1000) * <see cref="LevyRate"/>
///   totalBill = SUM(amount) for all levy codes that apply to a parcel's tax area
///
/// Join path to discover which levy codes apply to a given parcel:
///   parcel → PacsTaxArea.TaxAreaNumber
///   → PacsLevyTaxAreaAssoc.TaxAreaNumber (filter on same Year)
///   → PacsLevyRate (match on Year + TaxDistrictId + LevyCd)
///
/// Source: pacs_oltp.dbo.levy
/// County context: scoped at the API/seeder layer by Benton County ID;
///   not stored as a column on this entity (county-neutral PACS mirror).
/// </summary>
[Table("pacs_levy_rates")]
[Index(nameof(Year), Name = "IX_PacsLevyRate_Year")]
[Index(nameof(Year), nameof(TaxDistrictId), nameof(LevyCd), IsUnique = true,
    Name = "UQ_PacsLevyRate_YearDistrictCode")]
public class PacsLevyRate
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Tax year this levy rate applies to (e.g. 2026).</summary>
    public int Year { get; set; }

    /// <summary>PACS internal tax district ID (levy.tax_district_id).</summary>
    public int TaxDistrictId { get; set; }

    /// <summary>
    /// Levy code — identifies the taxing authority + levy fund within the district
    /// (e.g. "COUNTY", "ROAD", "STATE", "STATE2", "FIRE1", "KENN", "SD116DS").
    /// </summary>
    [MaxLength(20)]
    public string LevyCd { get; set; } = null!;

    /// <summary>
    /// Certified levy rate per $1,000 of assessed value.
    /// Levy bill arithmetic: amount = (assessedValue / 1_000) * LevyRate.
    /// Always stored as decimal — never promote to double.
    /// </summary>
    [Column(TypeName = "numeric(14,10)")]
    public decimal LevyRate { get; set; }

    /// <summary>
    /// Levy type code (levy.levy_type_cd):
    ///   REG   — regular (within constitutional 1% limit)
    ///   EXC   — excess/voted levy (above constitutional limit)
    ///   DEBT  — bond debt service
    ///   CP    — capital projects
    ///   STATE — state school part 1
    ///   STATE2 — state school part 2
    /// </summary>
    [MaxLength(10)]
    public string? LevyTypeCd { get; set; }

    /// <summary>Human-readable description of this levy (levy.levy_description).</summary>
    [MaxLength(200)]
    public string? LevyDescription { get; set; }

    /// <summary>Whether this levy is included in the DOR levy certification run.</summary>
    public bool IncludeInCertification { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
