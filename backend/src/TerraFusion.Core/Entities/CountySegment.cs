// backend/src/TerraFusion.Core/Entities/CountySegment.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum SegmentType { Residential, Commercial, Agricultural, Industrial, MixedUse, Rural }

public class CountySegment
{
    public Guid SegmentId { get; set; } = Guid.NewGuid();
    public Guid SegmentSetId { get; set; }
    public Guid CountyId { get; set; }

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    public SegmentType SegmentType { get; set; } = SegmentType.Residential;

    // Rule definition for how this segment is defined (JSON)
    public string? RuleDefinition { get; set; }

    // Reference to geography (neighborhood code, geometry ID, etc.)
    [StringLength(100)]
    public string? GeographyRef { get; set; }

    // Computed metrics — persisted after calculation run
    public int ParcelCount { get; set; }
    public decimal? MedianRatio { get; set; }
    public decimal? CoefficientOfDispersion { get; set; }     // COD
    public decimal? PriceRelatedDifferential { get; set; }   // PRD
    public decimal StabilityScore { get; set; }              // 0-100
    public decimal RiskScore { get; set; }                   // 0-100
    public int ExceptionCount { get; set; }

    // Navigation
    public CountySegmentSet? SegmentSet { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
