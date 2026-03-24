using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Situs (physical location) addresses from PACS situs table.
/// A parcel can have multiple situs records; primary_situs = 'Y' is the canonical address.
/// </summary>
[Table("pacs_situs")]
[Index(nameof(ParcelId), Name = "IX_PacsSitus_ParcelId")]
[Index(nameof(PacsPropId), nameof(PrimaryFlag), Name = "IX_PacsSitus_PropPrimary")]
public class PacsSitus
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PacsSitusId { get; set; }

    /// <summary>Y = primary/canonical situs address (situs.primary_situs)</summary>
    [MaxLength(1)] public string? PrimaryFlag { get; set; }

    /// <summary>Street number (situs.situs_num)</summary>
    [MaxLength(15)] public string? StreetNum { get; set; }

    /// <summary>Street direction prefix e.g. N, SW (situs.situs_street_prefx)</summary>
    [MaxLength(10)] public string? StreetPrefix { get; set; }

    /// <summary>Street name (situs.situs_street)</summary>
    [MaxLength(50)] public string? StreetName { get; set; }

    /// <summary>Street suffix e.g. ST, AVE, RD (situs.situs_street_sufix)</summary>
    [MaxLength(10)] public string? StreetSuffix { get; set; }

    /// <summary>Unit number (situs.situs_unit)</summary>
    [MaxLength(5)] public string? UnitNum { get; set; }

    /// <summary>City (situs.situs_city)</summary>
    [MaxLength(30)] public string? City { get; set; }

    /// <summary>State abbreviation (situs.situs_state)</summary>
    [MaxLength(2)] public string? State { get; set; }

    /// <summary>ZIP code (situs.situs_zip)</summary>
    [MaxLength(10)] public string? Zip { get; set; }

    /// <summary>Full formatted display address (situs.situs_display)</summary>
    [MaxLength(173)] public string? SitusDisplay { get; set; }

    /// <summary>Building number for multi-building parcels (situs.building_num)</summary>
    [MaxLength(15)] public string? BuildingNum { get; set; }

    /// <summary>Sub-unit number (situs.sub_num)</summary>
    [MaxLength(15)] public string? SubNum { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
