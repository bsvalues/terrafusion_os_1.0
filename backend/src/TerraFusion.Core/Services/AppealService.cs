using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public sealed record CreateAppealCommand(
    string ParcelId,
    string? AppealGround,
    string? PetitionerName,
    decimal CurrentValue,
    decimal RequestedValue,
    int TaxYear);

public interface IAppealService
{
    Task<Appeal> CreateAsync(Appeal entity);
    Task<Appeal> CreateAsync(Guid countyId, CreateAppealCommand request, string? createdBy = null, DateTime? utcNow = null);
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
        var now = DateTime.UtcNow;
        PrepareForCreate(entity, now);

        _context.Appeals.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created appeal {AppealId} for parcel {ParcelId} in county {CountyId}, ground {AppealGround}, tax year {TaxYear}",
            entity.Id, entity.ParcelId, entity.CountyId, entity.AppealGround, entity.TaxYear);

        return entity;
    }

    public Task<Appeal> CreateAsync(Guid countyId, CreateAppealCommand request, string? createdBy = null, DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var entity = new Appeal
        {
            ParcelId = request.ParcelId,
            AppealGround = request.AppealGround ?? "MARKET_VALUE",
            PetitionerName = request.PetitionerName,
            CurrentValue = request.CurrentValue,
            RequestedValue = request.RequestedValue,
            TaxYear = request.TaxYear > 0 ? request.TaxYear : now.Year,
            FiledDate = now,
            Status = "filed",
            CountyId = countyId,
            CreatedBy = createdBy,
            UpdatedBy = createdBy,
        };

        return CreateAsync(entity);
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

    private static void PrepareForCreate(Appeal entity, DateTime now)
    {
        if (entity.Id == Guid.Empty)
            entity.Id = Guid.NewGuid();

        entity.AppealGround = string.IsNullOrWhiteSpace(entity.AppealGround) ? "MARKET_VALUE" : entity.AppealGround;
        entity.Status = string.IsNullOrWhiteSpace(entity.Status) ? "filed" : entity.Status;
        entity.FiledDate = entity.FiledDate == default ? now : entity.FiledDate;
        entity.TaxYear = entity.TaxYear > 0 ? entity.TaxYear : now.Year;
        entity.CreatedAt = entity.CreatedAt == default ? now : entity.CreatedAt;
        entity.UpdatedAt = now;
    }
}
