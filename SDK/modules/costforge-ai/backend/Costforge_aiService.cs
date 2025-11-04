using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AutoMapper;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Models;

namespace TerraFusion.Modules.Costforge_ai.Services;

public interface ICostforge_aiService
{
    Task<Costforge_aiDto> GetByIdAsync(Guid id);
    Task<PagedResult<Costforge_aiDto>> GetAllAsync(int page, int pageSize);
    Task<Costforge_aiDto> CreateAsync(CreateCostforge_aiDto createDto);
    Task<Costforge_aiDto> UpdateAsync(Guid id, UpdateCostforge_aiDto updateDto);
    Task<bool> DeleteAsync(Guid id);
    Task<HealthStatus> GetHealthAsync();
}

public class Costforge_aiService : ICostforge_aiService
{
    private readonly ITerraFusionDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<Costforge_aiService> _logger;

    public Costforge_aiService(
        ITerraFusionDbContext context,
        IMapper mapper,
        ILogger<Costforge_aiService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Costforge_aiDto> GetByIdAsync(Guid id)
    {
        var entity = await _context.Costforge_ais
            .FirstOrDefaultAsync(e => e.Id == id);

        return entity != null ? _mapper.Map<Costforge_aiDto>(entity) : null;
    }

    public async Task<PagedResult<Costforge_aiDto>> GetAllAsync(int page, int pageSize)
    {
        var totalCount = await _context.Costforge_ais.CountAsync();
        
        var entities = await _context.Costforge_ais
            .OrderBy(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = _mapper.Map<List<Costforge_aiDto>>(entities);

        return new PagedResult<Costforge_aiDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<Costforge_aiDto> CreateAsync(CreateCostforge_aiDto createDto)
    {
        var entity = _mapper.Map<Costforge_ai>(createDto);
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        _context.Costforge_ais.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created {EntityType} with ID {EntityId}", 
            nameof(Costforge_ai), entity.Id);

        return _mapper.Map<Costforge_aiDto>(entity);
    }

    public async Task<Costforge_aiDto> UpdateAsync(Guid id, UpdateCostforge_aiDto updateDto)
    {
        var entity = await _context.Costforge_ais
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entity == null)
            return null;

        _mapper.Map(updateDto, entity);
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated {EntityType} with ID {EntityId}", 
            nameof(Costforge_ai), entity.Id);

        return _mapper.Map<Costforge_aiDto>(entity);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _context.Costforge_ais
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entity == null)
            return false;

        _context.Costforge_ais.Remove(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted {EntityType} with ID {EntityId}", 
            nameof(Costforge_ai), entity.Id);

        return true;
    }

    public async Task<HealthStatus> GetHealthAsync()
    {
        try
        {
            // Check database connectivity
            await _context.Database.CanConnectAsync();
            
            // Check basic functionality
            var count = await _context.Costforge_ais.CountAsync();
            
            return new HealthStatus
            {
                IsHealthy = true,
                Message = $"Module healthy. {count} records available.",
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed for {ModuleName}", "costforge-ai");
            
            return new HealthStatus
            {
                IsHealthy = false,
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            };
        }
    }
}
