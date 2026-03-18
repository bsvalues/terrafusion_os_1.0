using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public interface IAppealService
{
    Task<Appeal> CreateAsync(Appeal entity);
    Task<Appeal?> GetByIdAsync(Guid id, Guid countyId);
    Task<List<Appeal>> GetByParcelAsync(string parcelId, Guid countyId);
    Task<Appeal> UpdateStatusAsync(Guid id, string status, Guid countyId, string? decisionNotes = null, decimal? decidedValue = null);
    Task<List<Appeal>> GetByTaxYearAsync(int taxYear, Guid countyId);
}

public class AppealService : IAppealService
{
    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<AppealService> _logger;

    public AppealService(ITerraFusionDbContext context, ILogger<AppealService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Appeal> CreateAsync(Appeal entity)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        _context.Appeals.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created appeal {AppealId} for parcel {ParcelId} in county {CountyId}, ground {AppealGround}, tax year {TaxYear}",
            entity.Id, entity.ParcelId, entity.CountyId, entity.AppealGround, entity.TaxYear);

        return entity;
    }

    public async Task<Appeal?> GetByIdAsync(Guid id, Guid countyId)
    {
        return await _context.Appeals
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && a.CountyId == countyId);
    }

    public async Task<List<Appeal>> GetByParcelAsync(string parcelId, Guid countyId)
    {
        return await _context.Appeals
            .AsNoTracking()
            .Where(a => a.ParcelId == parcelId && a.CountyId == countyId)
            .OrderByDescending(a => a.FiledDate)
            .ToListAsync();
    }

    public async Task<Appeal> UpdateStatusAsync(Guid id, string status, Guid countyId, string? decisionNotes = null, decimal? decidedValue = null)
    {
        var entity = await _context.Appeals
            .FirstOrDefaultAsync(a => a.Id == id && a.CountyId == countyId);

        if (entity is null)
            throw new KeyNotFoundException($"Appeal {id} not found in county {countyId}.");

        entity.Status = status;
        entity.UpdatedAt = DateTime.UtcNow;

        if (decisionNotes is not null)
            entity.DecisionNotes = decisionNotes;

        if (decidedValue.HasValue)
        {
            entity.DecidedValue = decidedValue.Value;
            entity.DecisionDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Updated appeal {AppealId} status to {Status} in county {CountyId}",
            id, status, countyId);

        return entity;
    }

    public async Task<List<Appeal>> GetByTaxYearAsync(int taxYear, Guid countyId)
    {
        return await _context.Appeals
            .AsNoTracking()
            .Where(a => a.TaxYear == taxYear && a.CountyId == countyId)
            .OrderByDescending(a => a.FiledDate)
            .ToListAsync();
    }
}
