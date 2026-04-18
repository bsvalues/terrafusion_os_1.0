using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class Property
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string PropertyId { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Address { get; set; } = string.Empty;

    [StringLength(200)]
    public string? OwnerName { get; set; }

    [StringLength(20)]
    public string? OwnerSSN { get; set; }

    [StringLength(100)]
    public string? PropertyType { get; set; }

    [StringLength(2000)]
    public string? LegalDescription { get; set; }

    [StringLength(10)]
    public string? Neighborhood { get; set; }

    [StringLength(10)]
    public string? PropertyUseCode { get; set; }

    [StringLength(23)]
    public string? TaxDistrictCode { get; set; }

    [StringLength(255)]
    public string? TaxDistrictName { get; set; }

    [StringLength(30)]
    public string? SitusCity { get; set; }

    [StringLength(2)]
    public string? SitusState { get; set; }

    [StringLength(10)]
    public string? SitusZip { get; set; }

    [StringLength(50)]
    public string? Zoning { get; set; }

    public int? YearBuilt { get; set; }

    public decimal? LotWidthFront { get; set; }
    public decimal? LotDepth { get; set; }

    public decimal AssessedValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public decimal MarketValue { get; set; }

    public DateTime AssessmentDate { get; set; }
    public DateTime LastUpdated { get; set; }
    public int TaxYear { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Valuation> Valuations { get; set; } = new List<Valuation>();
}
