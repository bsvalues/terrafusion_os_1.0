using System;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Per-parcel land segment record. Preserves source land-detail identity (year + sup_num),
/// land type code, area metrics, and value. Multiple segments per parcel are normal —
/// agricultural + residential split, multi-class commercial, etc.
/// </summary>
public sealed class LandSegment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string SourceLandSegmentId { get; set; } = null!;

    public int AssessmentYear { get; set; }
    public int SupplementNumber { get; set; }

    public string LandTypeCode { get; set; } = null!;
    public decimal? Acreage { get; set; }
    public decimal? SizeSquareFeet { get; set; }
    public decimal? MarketValue { get; set; }
    public decimal? AssessedValue { get; set; }

    public string? PayloadHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
