using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class Valuation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    
    public Guid AIModelId { get; set; }
    public AIModel AIModel { get; set; } = null!;
    
    public decimal EstimatedValue { get; set; }
    public decimal Confidence { get; set; }
    
    [StringLength(50)]
    public string? Method { get; set; }
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    
    [StringLength(100)]
    public string? ReviewedBy { get; set; }
}
