using TerraFusion.Core.Enums;

namespace TerraFusion.Core.DTOs;

public class ModuleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Version { get; set; } = string.Empty;
    public ModuleStatus Status { get; set; }
    public ModuleTier Tier { get; set; }
    public string? IconPath { get; set; }
    public string? LaunchPath { get; set; }
    public bool IsCore { get; set; }
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLaunchedAt { get; set; }
}

public class CreateModuleDto
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Version { get; set; } = string.Empty;
    public ModuleTier Tier { get; set; }
    public string? IconPath { get; set; }
    public string? LaunchPath { get; set; }
    public bool IsCore { get; set; }
    public int Priority { get; set; }
}

public class UpdateModuleDto
{
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Version { get; set; }
    public ModuleStatus? Status { get; set; }
    public ModuleTier? Tier { get; set; }
    public string? IconPath { get; set; }
    public string? LaunchPath { get; set; }
    public bool? IsCore { get; set; }
    public int? Priority { get; set; }
}
