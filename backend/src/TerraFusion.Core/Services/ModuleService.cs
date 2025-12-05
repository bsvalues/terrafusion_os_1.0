using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AutoMapper;
using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Enums;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public class ModuleService : IModuleService
{
    private readonly ITerraFusionDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ModuleService> _logger;

    public ModuleService(ITerraFusionDbContext context, IMapper mapper, ILogger<ModuleService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<ModuleDto>> GetAllModulesAsync()
    {
        var modules = await _context.Modules
            .OrderBy(m => m.Priority)
            .ThenBy(m => m.Name)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ModuleDto>>(modules);
    }

    public async Task<ModuleDto?> GetModuleByIdAsync(int id)
    {
        var module = await _context.Modules.FindAsync(id);
        return module != null ? _mapper.Map<ModuleDto>(module) : null;
    }

    public async Task<ModuleDto?> GetModuleByNameAsync(string name)
    {
        var module = await _context.Modules
            .FirstOrDefaultAsync(m => m.Name == name);
        
        return module != null ? _mapper.Map<ModuleDto>(module) : null;
    }

    public async Task<ModuleDto> CreateModuleAsync(CreateModuleDto createDto)
    {
        var module = _mapper.Map<Module>(createDto);
        module.Status = ModuleStatus.Inactive;
        module.CreatedAt = DateTime.UtcNow;
        module.UpdatedAt = DateTime.UtcNow;

        _context.Modules.Add(module);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created module {ModuleName} with ID {ModuleId}", module.Name, module.Id);

        return _mapper.Map<ModuleDto>(module);
    }

    public async Task<ModuleDto?> UpdateModuleAsync(int id, UpdateModuleDto updateDto)
    {
        var module = await _context.Modules.FindAsync(id);
        if (module == null) return null;

        _mapper.Map(updateDto, module);
        module.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated module {ModuleName} with ID {ModuleId}", module.Name, module.Id);

        return _mapper.Map<ModuleDto>(module);
    }

    public async Task<bool> DeleteModuleAsync(int id)
    {
        var module = await _context.Modules.FindAsync(id);
        if (module == null) return false;

        _context.Modules.Remove(module);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted module {ModuleName} with ID {ModuleId}", module.Name, module.Id);

        return true;
    }

    public async Task<bool> LaunchModuleAsync(int id)
    {
        var module = await _context.Modules.FindAsync(id);
        if (module == null) return false;

        module.Status = ModuleStatus.Active;
        module.LastLaunchedAt = DateTime.UtcNow;
        module.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Launched module {ModuleName} with ID {ModuleId}", module.Name, module.Id);

        return true;
    }

    public async Task<bool> StopModuleAsync(int id)
    {
        var module = await _context.Modules.FindAsync(id);
        if (module == null) return false;

        module.Status = ModuleStatus.Inactive;
        module.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Stopped module {ModuleName} with ID {ModuleId}", module.Name, module.Id);

        return true;
    }

    public async Task<IEnumerable<ModuleDto>> GetModulesByTierAsync(string tier)
    {
        if (!Enum.TryParse<ModuleTier>(tier, true, out var tierEnum))
        {
            return new List<ModuleDto>();
        }

        var modules = await _context.Modules
            .Where(m => m.Tier == tierEnum)
            .OrderBy(m => m.Priority)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ModuleDto>>(modules);
    }

    public async Task<IEnumerable<ModuleDto>> GetActiveModulesAsync()
    {
        var modules = await _context.Modules
            .Where(m => m.Status == ModuleStatus.Active)
            .OrderBy(m => m.Priority)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ModuleDto>>(modules);
    }

    public async Task<ModuleHealthDto> GetModuleHealthAsync(int id)
    {
        var module = await _context.Modules.FindAsync(id);
        if (module == null)
        {
            throw new ArgumentException($"Module with ID {id} not found");
        }

        // Simulate health check - in real implementation, this would check actual module status
        return new ModuleHealthDto
        {
            ModuleId = new Guid(module.Id.ToString().PadLeft(32, '0')),
            ModuleName = module.Name,
            Status = (HealthStatus)module.Status,
            CpuUsage = Random.Shared.NextDouble() * 20, // 0-20% CPU
            MemoryUsage = Random.Shared.NextInt64(10_000_000, 100_000_000), // 10-100MB
            LastHealthCheck = DateTime.UtcNow,
            IsResponding = module.Status == ModuleStatus.Active,
            ErrorMessage = module.Status == ModuleStatus.Error ? "Module encountered an error" : null
        };
    }
}
