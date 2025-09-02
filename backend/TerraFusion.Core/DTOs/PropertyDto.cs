using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs;

public class PropertyDto
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;
    
    [Required]
    [StringLength(500)]
    public string Address { get; set; } = string.Empty;
    
    [StringLength(200)]
    public string? OwnerName { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal AssessedValue { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal LandValue { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal ImprovementValue { get; set; }
    
    [Required]
    public int CountyId { get; set; }
    
    [Required]
    [StringLength(100)]
    public string CountyName { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ValuationDto
{
    public int Id { get; set; }
    
    [Required]
    public int PropertyId { get; set; }
    
    [Required]
    public int AIModelId { get; set; }
    
    [Required]
    [StringLength(100)]
    public string AIModelName { get; set; } = string.Empty;
    
    [Range(0, double.MaxValue)]
    public decimal EstimatedValue { get; set; }
    
    [Range(0, 1)]
    public decimal Confidence { get; set; }
    
    [StringLength(100)]
    public string? Method { get; set; }
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    
    [StringLength(100)]
    public string? ReviewedBy { get; set; }
}

public class CreateValuationDto
{
    [Required]
    public int PropertyId { get; set; }
    
    [Required]
    public int AIModelId { get; set; }
    
    [Required]
    [Range(0, double.MaxValue)]
    public decimal EstimatedValue { get; set; }
    
    [Required]
    [Range(0, 1)]
    public decimal Confidence { get; set; }
    
    [StringLength(100)]
    public string? Method { get; set; }
    
    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class ImportPropertyDto
{
    [Required]
    [StringLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;
    
    [Required]
    [StringLength(500)]
    public string Address { get; set; } = string.Empty;
    
    [StringLength(200)]
    public string? OwnerName { get; set; }
    
    [Required]
    [Range(0, double.MaxValue)]
    public decimal AssessedValue { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal LandValue { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal ImprovementValue { get; set; }
    
    [Required]
    public int CountyId { get; set; }
}

public class PropertyStatsDto
{
    public int TotalProperties { get; set; }
    public decimal TotalAssessedValue { get; set; }
    public decimal AverageAssessedValue { get; set; }
    public int CountiesCount { get; set; }
    public Dictionary<string, int> PropertiesByCounty { get; set; } = new();
    public int TotalPermits { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
