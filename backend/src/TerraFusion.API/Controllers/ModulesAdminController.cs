using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.API.Services;
using TerraFusion.API.Health;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/modules")]
[Authorize(Roles = "Admin,SystemAdmin")]
public sealed class ModulesAdminController : ControllerBase
{
    private readonly ModuleSeedService _seedService;
    private readonly TerraFusionDbContext _dbContext;
    private readonly ILogger<ModulesAdminController> _logger;

    public ModulesAdminController(
        ModuleSeedService seedService,
        TerraFusionDbContext dbContext,
        ILogger<ModulesAdminController> logger)
    {
        _seedService = seedService ?? throw new ArgumentNullException(nameof(seedService));
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpPost("seed")]
    public async Task<IActionResult> SeedModules(
        [FromQuery] bool truncate = false,
        [FromQuery] bool dryRun = false,
        CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation(
                "Module seed requested by {User} - Truncate: {Truncate}, DryRun: {DryRun}",
                User.Identity?.Name ?? "Unknown",
                truncate,
                dryRun);
                
            // Get the desired module list from the initialization service
            var desired = FullModuleInitializationService.GetAllProductionModules();
            
            if (dryRun)
            {
                // Just return what would happen without making changes
                var existing = await _dbContext.Modules.CountAsync(ct);
                return Ok(new
                {
                    mode = "dry_run",
                    current_count = existing,
                    desired_count = desired.Count,
                    would_truncate = truncate,
                    message = truncate 
                        ? $"Would delete {existing} modules and add {desired.Count} new ones"
                        : $"Would merge {desired.Count} modules with existing {existing}"
                });
            }
            
            if (truncate)
            {
                _logger.LogWarning("Truncating modules table as requested");
                await _dbContext.Database.ExecuteSqlRawAsync("DELETE FROM Modules;", ct);
                await _dbContext.SaveChangesAsync(ct);
            }
            
            var result = await _seedService.SeedAsync(desired, ct);
            
            _logger.LogInformation(
                "Module seed completed - Added: {Added}, Updated: {Updated}, Skipped: {Skipped}, Final: {Final}",
                result.Added,
                result.Updated,
                result.Skipped,
                result.FinalCount);
                
            return Ok(new
            {
                status = result.Success ? "success" : "partial",
                added = result.Added,
                updated = result.Updated,
                skipped = result.Skipped,
                total_processed = result.TotalProcessed,
                final_count = result.FinalCount,
                errors = result.Errors,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during module seed operation");
            return StatusCode(500, new
            {
                error = "Module seed failed",
                message = ex.Message
            });
        }
    }
    
    [HttpGet("consistency")]
    public async Task<IActionResult> CheckConsistency(
        [FromServices] IFileSystemModuleDiscovery fileSystem,
        [FromServices] IOrchestratorView orchestrator,
        CancellationToken ct = default)
    {
        try
        {
            var dbModules = await _dbContext.Modules
                .AsNoTracking()
                .Select(m => m.Name)
                .ToListAsync(ct);
                
            var fsModules = await fileSystem.ListNamesAsync(ct);
            var orchModules = await orchestrator.GetEnabledNamesAsync(ct);
            
            var dbSet = dbModules.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var fsSet = fsModules.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var orchSet = orchModules.ToHashSet(StringComparer.OrdinalIgnoreCase);
            
            return Ok(new
            {
                database = new
                {
                    count = dbSet.Count,
                    modules = dbSet.OrderBy(n => n)
                },
                filesystem = new
                {
                    count = fsSet.Count,
                    modules = fsSet.OrderBy(n => n),
                    only_here = fsSet.Except(dbSet).OrderBy(n => n)
                },
                orchestrator = new
                {
                    count = orchSet.Count,
                    modules = orchSet.OrderBy(n => n),
                    only_here = orchSet.Except(dbSet).OrderBy(n => n)
                },
                discrepancies = new
                {
                    db_only = dbSet.Except(fsSet).Union(dbSet.Except(orchSet)).OrderBy(n => n),
                    fs_only = fsSet.Except(dbSet).OrderBy(n => n),
                    orch_only = orchSet.Except(dbSet).OrderBy(n => n)
                },
                is_consistent = dbSet.SetEquals(fsSet) && dbSet.SetEquals(orchSet),
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking module consistency");
            return StatusCode(500, new
            {
                error = "Consistency check failed",
                message = ex.Message
            });
        }
    }
}
