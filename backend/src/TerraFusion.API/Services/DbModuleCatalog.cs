using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

public sealed class DbModuleCatalog : IModuleCatalog
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DbModuleCatalog> _logger;

    public DbModuleCatalog(TerraFusionDbContext db, ILogger<DbModuleCatalog> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<Module>> GetAllAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("Fetching all modules from database");
        
        var modules = await _db.Modules
            .AsNoTracking()
            .OrderBy(m => m.Tier)
            .ThenBy(m => m.Priority)
            .ThenBy(m => m.Name)
            .ToListAsync(ct);
            
        _logger.LogInformation("Retrieved {Count} modules from database", modules.Count);
        return modules;
    }

    public async Task<IReadOnlyList<Module>> GetEnabledAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("Fetching enabled modules from database");
        
        var modules = await _db.Modules
            .AsNoTracking()
            .Where(m => m.Status == Core.Enums.ModuleStatus.Active)
            .OrderBy(m => m.Tier)
            .ThenBy(m => m.Priority)
            .ThenBy(m => m.Name)
            .ToListAsync(ct);
            
        _logger.LogInformation("Retrieved {Count} enabled modules from database", modules.Count);
        return modules;
    }

    public async Task<Module?> GetByNameAsync(string name, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(name))
            return null;
            
        _logger.LogDebug("Fetching module by name: {Name}", name);
        
        return await _db.Modules
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Name == name, ct);
    }

    public async Task<int> GetCountAsync(bool enabledOnly = false, CancellationToken ct = default)
    {
        var query = _db.Modules.AsNoTracking();
        
        if (enabledOnly)
        {
            query = query.Where(m => m.Status == Core.Enums.ModuleStatus.Active);
        }
        
        return await query.CountAsync(ct);
    }

    public async Task<Dictionary<string, Module>> GetByNamesAsync(IEnumerable<string> names, CancellationToken ct = default)
    {
        var nameList = names?.ToList() ?? new List<string>();
        if (!nameList.Any())
            return new Dictionary<string, Module>();
            
        _logger.LogDebug("Fetching {Count} modules by name", nameList.Count);
        
        var modules = await _db.Modules
            .AsNoTracking()
            .Where(m => nameList.Contains(m.Name))
            .ToDictionaryAsync(m => m.Name, StringComparer.OrdinalIgnoreCase, ct);
            
        return modules;
    }
}
