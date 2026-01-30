using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface IModuleService
{
    Task<IEnumerable<ModuleDto>> GetAllModulesAsync();
    Task<ModuleDto?> GetModuleByIdAsync(int id);
    Task<ModuleDto?> GetModuleByNameAsync(string name);
    Task<ModuleDto> CreateModuleAsync(CreateModuleDto createDto);
    Task<ModuleDto?> UpdateModuleAsync(int id, UpdateModuleDto updateDto);
    Task<bool> DeleteModuleAsync(int id);
    Task<bool> LaunchModuleAsync(int id);
    Task<bool> StopModuleAsync(int id);
    Task<IEnumerable<ModuleDto>> GetModulesByTierAsync(string tier);
    Task<IEnumerable<ModuleDto>> GetActiveModulesAsync();
    Task<ModuleHealthDto> GetModuleHealthAsync(int id);
}
