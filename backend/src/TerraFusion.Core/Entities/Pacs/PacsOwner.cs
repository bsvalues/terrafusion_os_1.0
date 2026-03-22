using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Owner record from PACS owner table joined with account.file_as_name.
/// Ownership percentages, type of interest, homestead status, and mailing address.
/// NOTE: No SSN, DL number, or date of birth — PII excluded by design.
/// </summary>
[Table("pacs_owners")]
[Index(nameof(PacsPropId), nameof(OwnerTaxYear), nameof(PacsOwnerId), Name = "IX_PacsOwner_Natural", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsOwner_ParcelId")]
[Index(nameof(FileAsName), Name = "IX_PacsOwner_Name")]
public class PacsOwner
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PacsOwnerId { get; set; }
    public decimal OwnerTaxYear { get; set; }
    public int SupNum { get; set; }

    /// <summary>Owner display name from account.file_as_name (joined at ETL)</summary>
    [MaxLength(70)] public string? FileAsName { get; set; }

    /// <summary>First name from account.first_name</summary>
    [MaxLength(30)] public string? FirstName { get; set; }

    /// <summary>Last name from account.last_name</summary>
    [MaxLength(30)] public string? LastName { get; set; }

    /// <summary>Percent of ownership (owner.pct_ownership)</summary>
    [Column(TypeName = "decimal(5,2)")] public decimal? PctOwnership { get; set; }

    /// <summary>Type of interest code: FEE, LIFE, etc. (owner.type_of_int)</summary>
    [MaxLength(5)] public string? TypeOfInterest { get; set; }

    /// <summary>Homestead property flag (owner.hs_prop)</summary>
    [MaxLength(1)] public string? HsProp { get; set; }

    /// <summary>Over-65 deferral flag (owner.over_65_defer)</summary>
    [MaxLength(1)] public string? Over65Defer { get; set; }

    /// <summary>Ag application filed flag (owner.ag_app_filed)</summary>
    [MaxLength(1)] public string? AgAppFiled { get; set; }

    // ── Ownership Percentages by Value Type ──────────────────────────────
    [Column(TypeName = "decimal(5,4)")] public decimal? PctImprvHs { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctImprvNhs { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctLandHs { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctLandNhs { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctAgUse { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctAgMkt { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctTimUse { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctTimMkt { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? PctPersProp { get; set; }

    /// <summary>Owner comment (owner.owner_cmnt)</summary>
    [MaxLength(255)] public string? OwnerComment { get; set; }

    /// <summary>Linked code (owner.linked_cd)</summary>
    [MaxLength(10)] public string? LinkedCd { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
