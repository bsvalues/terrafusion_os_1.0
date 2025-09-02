using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class Property
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
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
    
    public int? YearBuilt { get; set; }
    
    public decimal AssessedValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public decimal MarketValue { get; set; }
    
    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<Valuation> Valuations { get; set; } = new List<Valuation>();
}
