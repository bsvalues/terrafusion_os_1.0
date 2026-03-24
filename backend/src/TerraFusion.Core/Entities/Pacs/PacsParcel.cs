using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>Maps to pacs_oltp.dbo.property. Root entity — all other Pacs entities FK here.</summary>
public class PacsParcel
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>PACS prop_id (int PK in source).</summary>
    public int PropId { get; set; }

    public Guid CountyId { get; set; }

    [StringLength(5)]
    public string PropTypeCd { get; set; } = string.Empty;

    [StringLength(50)]
    public string? GeoId { get; set; }

    [StringLength(50)]
    public string? SimpleGeoId { get; set; }

    [StringLength(5)]
    public string? StateCd { get; set; }

    [StringLength(50)]
    public string? Zoning { get; set; }

    [StringLength(50)]
    public string? Topography { get; set; }

    [StringLength(50)]
    public string? Utilities { get; set; }

    [StringLength(50)]
    public string? RoadAccess { get; set; }

    [StringLength(3000)]
    public string? PropCmnt { get; set; }

    public DateTime? PropCreateDt { get; set; }

    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;

    public County County { get; set; } = null!;
    public ICollection<PacsPropertyProfile> Profiles { get; set; } = new List<PacsPropertyProfile>();
    public ICollection<PacsValuation> Valuations { get; set; } = new List<PacsValuation>();
    public ICollection<PacsImprovementDetail> ImprovementDetails { get; set; } = new List<PacsImprovementDetail>();
    public ICollection<PacsImprovementAttribute> ImprovementAttributes { get; set; } = new List<PacsImprovementAttribute>();
    public ICollection<PacsLandDetail> LandDetails { get; set; } = new List<PacsLandDetail>();
    public ICollection<PacsOwner> Owners { get; set; } = new List<PacsOwner>();
    public ICollection<PacsExemption> Exemptions { get; set; } = new List<PacsExemption>();
    public ICollection<PacsAppeal> Appeals { get; set; } = new List<PacsAppeal>();
    public ICollection<PacsTaxArea> TaxAreas { get; set; } = new List<PacsTaxArea>();
}
