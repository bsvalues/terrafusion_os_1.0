using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Recorded document in the county clerk's recording system.
/// Write-lane: clerk.
/// </summary>
public class ClerkDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string RecordingNumber { get; set; } = string.Empty;

    [Required] [StringLength(50)]
    public string DocumentType { get; set; } = string.Empty;

    [StringLength(50)]
    public string? ParcelId { get; set; }

    [Required] [StringLength(200)]
    public string Grantor { get; set; } = string.Empty;

    [Required] [StringLength(200)]
    public string Grantee { get; set; } = string.Empty;

    [Range(0, (double)decimal.MaxValue)]
    public decimal Consideration { get; set; }

    [Range(0, (double)decimal.MaxValue)]
    public decimal Fees { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Chain-of-title entry linking a document to a parcel transfer.
/// Write-lane: clerk.
/// </summary>
public class TitleChainEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    public Guid DocumentId { get; set; }
    public ClerkDocument Document { get; set; } = null!;

    [Required] [StringLength(50)]
    public string TransferType { get; set; } = string.Empty;

    [Required] [StringLength(200)]
    public string FromParty { get; set; } = string.Empty;

    [Required] [StringLength(200)]
    public string ToParty { get; set; } = string.Empty;

    public DateTime TransferDate { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Lien recorded against a parcel.
/// Write-lane: clerk.
/// </summary>
public class ClerkLien
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [Required] [StringLength(50)]
    public string LienType { get; set; } = string.Empty;

    [Required] [StringLength(200)]
    public string LienHolder { get; set; } = string.Empty;

    [Range(0.01, (double)decimal.MaxValue)]
    public decimal Amount { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = "active";

    public DateTime? ReleasedAt { get; set; }

    [StringLength(200)]
    public string? ReleaseReason { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
