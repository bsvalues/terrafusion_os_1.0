using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Enums;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services;

public sealed class RuntimeModuleService : IModuleService
{
    private readonly IModuleLoaderService _moduleLoader;
    private readonly ILogger<RuntimeModuleService> _logger;

    public RuntimeModuleService(
        IModuleLoaderService moduleLoader,
        ILogger<RuntimeModuleService> logger)
    {
        _moduleLoader = moduleLoader;
        _logger = logger;
    }

    public async Task<IEnumerable<ModuleDto>> GetAllModulesAsync()
    {
        var modules = await _moduleLoader.LoadDiscoveredModulesAsync();
        return modules.Select(MapToDto);
    }

    public async Task<ModuleDto?> GetModuleByIdAsync(int id)
    {
        var modules = await _moduleLoader.LoadDiscoveredModulesAsync();
        var module = modules.FirstOrDefault(candidate => candidate.Id == id);
        return module is null ? null : MapToDto(module);
    }

    public async Task<ModuleDto?> GetModuleByNameAsync(string name)
    {
        var module = await _moduleLoader.LoadModuleAsync(name);
        return module is null ? null : MapToDto(module);
    }

    public Task<ModuleDto> CreateModuleAsync(CreateModuleDto createDto)
    {
        throw new NotSupportedException(
            "The Development module catalog is derived from filesystem runtime manifests. Creating database-backed modules is not supported by this API.");
    }

    public Task<ModuleDto?> UpdateModuleAsync(int id, UpdateModuleDto updateDto)
    {
        throw new NotSupportedException(
            "The Development module catalog is derived from filesystem runtime manifests. Updating database-backed modules is not supported by this API.");
    }

    public Task<bool> DeleteModuleAsync(int id)
    {
        throw new NotSupportedException(
            "The Development module catalog is derived from filesystem runtime manifests. Deleting database-backed modules is not supported by this API.");
    }

    public Task<bool> LaunchModuleAsync(int id)
    {
        throw new NotSupportedException(
            "The Development module catalog is derived from filesystem runtime manifests. Launch state is determined by runtime packaging, not database mutation.");
    }

    public Task<bool> StopModuleAsync(int id)
    {
        throw new NotSupportedException(
            "The Development module catalog is derived from filesystem runtime manifests. Stop state is determined by runtime packaging, not database mutation.");
    }

    public async Task<IEnumerable<ModuleDto>> GetModulesByTierAsync(string tier)
    {
        if (!Enum.TryParse<ModuleTier>(tier, true, out var tierEnum))
        {
            return Array.Empty<ModuleDto>();
        }

        var modules = await _moduleLoader.LoadDiscoveredModulesAsync();
        return modules
            .Where(module => module.Tier == tierEnum)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<IEnumerable<ModuleDto>> GetActiveModulesAsync()
    {
        var modules = await _moduleLoader.LoadActiveModulesAsync();
        return modules.Select(MapToDto).ToList();
    }

    public async Task<ModuleHealthDto> GetModuleHealthAsync(int id)
    {
        var modules = await _moduleLoader.LoadDiscoveredModulesAsync();
        var module = modules.FirstOrDefault(candidate => candidate.Id == id);
        if (module is null)
        {
            throw new ArgumentException($"Module with ID {id} not found", nameof(id));
        }

        return new ModuleHealthDto
        {
            ModuleId = new Guid(id.ToString().PadLeft(32, '0')),
            ModuleName = module.Name,
            Status = MapHealthStatus(module.Status),
            CpuUsage = 0,
            MemoryUsage = 0,
            LastHealthCheck = DateTime.UtcNow,
            IsResponding = module.Status == ModuleStatus.Active,
            ErrorMessage = module.Status switch
            {
                ModuleStatus.ValidationFailed => module.Description ?? "Invalid module packaging.",
                ModuleStatus.Error => module.Description ?? "Module runtime error.",
                ModuleStatus.Disabled => "Module is disabled.",
                _ => null,
            }
        };
    }

    private static ModuleDto MapToDto(Module module)
    {
        return new ModuleDto
        {
            Id = module.Id,
            Name = module.Name,
            DisplayName = module.DisplayName,
            Description = module.Description,
            Version = module.Version,
            Status = module.Status,
            Tier = module.Tier,
            IconPath = module.IconPath,
            LaunchPath = module.LaunchPath,
            IsCore = module.IsCore,
            Priority = module.Priority,
            CreatedAt = module.CreatedAt,
            UpdatedAt = module.UpdatedAt,
            LastLaunchedAt = module.LastLaunchedAt,
        };
    }

    private static HealthStatus MapHealthStatus(ModuleStatus status)
    {
        return status switch
        {
            ModuleStatus.Active => HealthStatus.Healthy,
            ModuleStatus.Loading or ModuleStatus.Updating => HealthStatus.Warning,
            ModuleStatus.Inactive or ModuleStatus.Disabled => HealthStatus.Offline,
            ModuleStatus.ValidationFailed or ModuleStatus.Error or ModuleStatus.RegistrationFailed => HealthStatus.Critical,
            _ => HealthStatus.Degraded,
        };
    }
}
