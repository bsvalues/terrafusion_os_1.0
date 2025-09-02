using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class County
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(2)]
    public string State { get; set; } = string.Empty;
    
    [StringLength(10)]
    public string? FipsCode { get; set; }
    
    public int Population { get; set; }
    public double Area { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<Property> Properties { get; set; } = new List<Property>();
}
