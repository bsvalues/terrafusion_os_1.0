using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public interface IExemptionService
{
    Task<Exemption> CreateAsync(Exemption entity);
    Task<Exemption?> GetByIdAsync(Guid id, Guid countyId);
    Task<List<Exemption>> GetByParcelAsync(string parcelId, Guid countyId);
    Task<Exemption> UpdateStatusAsync(Guid id, string status, Guid countyId);
}

public class ExemptionService : IExemptionService
{
    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<ExemptionService> _logger;

    public ExemptionService(ITerraFusionDbContext context, ILogger<ExemptionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Exemption> CreateAsync(Exemption entity)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        _context.Exemptions.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created exemption {ExemptionId} for parcel {ParcelId} in county {CountyId}, program {ProgramCode}",
            entity.Id, entity.ParcelId, entity.CountyId, entity.ProgramCode);

        return entity;
    }

    public async Task<Exemption?> GetByIdAsync(Guid id, Guid countyId)
    {
        return await _context.Exemptions
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.CountyId == countyId);
    }

    public async Task<List<Exemption>> GetByParcelAsync(string parcelId, Guid countyId)
    {
        return await _context.Exemptions
            .AsNoTracking()
            .Where(e => e.ParcelId == parcelId && e.CountyId == countyId)
            .OrderByDescending(e => e.ApplicationDate)
            .ToListAsync();
    }

    public async Task<Exemption> UpdateStatusAsync(Guid id, string status, Guid countyId)
    {
        var entity = await _context.Exemptions
            .FirstOrDefaultAsync(e => e.Id == id && e.CountyId == countyId);

        if (entity is null)
            throw new KeyNotFoundException($"Exemption {id} not found in county {countyId}.");

        entity.Status = status;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Updated exemption {ExemptionId} status to {Status} in county {CountyId}",
            id, status, countyId);

        return entity;
    }
}
