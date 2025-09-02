using System.ComponentModel.DataAnnotations;
using TerraFusion.Core.Enums;

namespace TerraFusion.Core.Entities;

public class AIModel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    public AIModelType Type { get; set; }
    public AIModelStatus Status { get; set; } = AIModelStatus.Inactive;
    
    [StringLength(50)]
    public string? Version { get; set; }
    
    public decimal Accuracy { get; set; }
    public int TrainingDataSize { get; set; }
    
    [StringLength(200)]
    public string? ModelPath { get; set; }
    
    [StringLength(200)]
    public string? ConfigPath { get; set; }
    
    // Configuration as JSON string
    public string Configuration { get; set; } = "{}";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastTrainedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}
