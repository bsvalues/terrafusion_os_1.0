using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

public sealed class ModuleSeedService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<ModuleSeedService> _logger;

    public ModuleSeedService(TerraFusionDbContext db, ILogger<ModuleSeedService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<SeedResult> SeedAsync(IEnumerable<Module> desired, CancellationToken ct = default)
    {
        var desiredList = desired?.ToList() ?? new List<Module>();
        _logger.LogInformation("Starting module seed with {Count} desired modules", desiredList.Count);
        
        // Get all existing modules from database
        var existing = await _db.Modules
            .AsNoTracking()
            .ToListAsync(ct);
            
        var existingByName = existing.ToDictionary(m => m.Name, StringComparer.OrdinalIgnoreCase);
        
        int added = 0, updated = 0, skipped = 0;
        var errors = new List<string>();
        
        foreach (var module in desiredList)
        {
            try
            {
                if (existingByName.TryGetValue(module.Name, out var existingModule))
                {
                    // Check if update is needed
                    if (NeedsUpdate(existingModule, module))
                    {
                        // Update existing module
                        var tracked = await _db.Modules.FindAsync(existingModule.Id);
                        if (tracked != null)
                        {
                            tracked.DisplayName = module.DisplayName;
                            tracked.Description = module.Description;
                            tracked.Version = module.Version;
                            tracked.Tier = module.Tier;
                            tracked.Priority = module.Priority;
                            tracked.IsCore = module.IsCore;
                            tracked.Status = module.Status;
                            tracked.UpdatedAt = DateTime.UtcNow;
                            
                            _db.Modules.Update(tracked);
                            updated++;
                            _logger.LogDebug("Updated module: {Name}", module.Name);
                        }
                    }
                    else
                    {
                        skipped++;
                        _logger.LogTrace("Skipped module (no changes): {Name}", module.Name);
                    }
                }
                else
                {
                    // Add new module
                    module.CreatedAt = DateTime.UtcNow;
                    module.UpdatedAt = DateTime.UtcNow;
                    await _db.Modules.AddAsync(module, ct);
                    added++;
                    _logger.LogDebug("Added new module: {Name}", module.Name);
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Error processing module {module.Name}: {ex.Message}");
                _logger.LogError(ex, "Error processing module {Name}", module.Name);
            }
        }
        
        await _db.SaveChangesAsync(ct);
        
        _logger.LogInformation(
            "Module seed completed: Added={Added}, Updated={Updated}, Skipped={Skipped}, Errors={ErrorCount}",
            added, updated, skipped, errors.Count);
            
        return new SeedResult
        {
            Added = added,
            Updated = updated,
            Skipped = skipped,
            TotalProcessed = desiredList.Count,
            FinalCount = await _db.Modules.CountAsync(ct),
            Errors = errors
        };
    }
    
    private bool NeedsUpdate(Module existing, Module desired)
    {
        return existing.DisplayName != desired.DisplayName ||
               existing.Description != desired.Description ||
               existing.Version != desired.Version ||
               existing.Tier != desired.Tier ||
               existing.Priority != desired.Priority ||
               existing.IsCore != desired.IsCore ||
               existing.Status != desired.Status;
    }
}

public class SeedResult
{
    public int Added { get; init; }
    public int Updated { get; init; }
    public int Skipped { get; init; }
    public int TotalProcessed { get; init; }
    public int FinalCount { get; init; }
    public List<string> Errors { get; init; } = new();
    public bool Success => !Errors.Any();
}
