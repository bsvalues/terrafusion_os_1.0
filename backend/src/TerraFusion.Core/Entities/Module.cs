using System.ComponentModel.DataAnnotations;
using TerraFusion.Core.Enums;

namespace TerraFusion.Core.Entities;

public class Module
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(150)]
    public string DisplayName { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Required]
    [StringLength(20)]
    public string Version { get; set; } = string.Empty;
    
    public ModuleStatus Status { get; set; } = ModuleStatus.Inactive;
    public ModuleTier Tier { get; set; } = ModuleTier.Tier3;
    
    [StringLength(200)]
    public string? IconPath { get; set; }
    
    [StringLength(500)]
    public string? LaunchPath { get; set; }
    
    public bool IsCore { get; set; } = false;
    public int Priority { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLaunchedAt { get; set; }
}
