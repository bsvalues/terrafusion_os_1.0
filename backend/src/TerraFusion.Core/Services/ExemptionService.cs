using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public sealed record CreateExemptionCommand(
    string ParcelId,
    string? ProgramCode,
    string? ApplicantName,
    decimal ExemptionAmount,
    string? RcwReference,
    string? Notes);

public interface IExemptionService
{
    Task<Exemption> CreateAsync(Exemption entity);
    Task<Exemption> CreateAsync(Guid countyId, CreateExemptionCommand request, string? createdBy = null, DateTime? utcNow = null);
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
        var now = DateTime.UtcNow;
        PrepareForCreate(entity, now);

        _context.Exemptions.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created exemption {ExemptionId} for parcel {ParcelId} in county {CountyId}, program {ProgramCode}",
            entity.Id, entity.ParcelId, entity.CountyId, entity.ProgramCode);

        return entity;
    }

    public Task<Exemption> CreateAsync(Guid countyId, CreateExemptionCommand request, string? createdBy = null, DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var entity = new Exemption
        {
            ParcelId = request.ParcelId,
            ProgramCode = request.ProgramCode ?? "SENIOR_DISABLED",
            ApplicantName = request.ApplicantName,
            ApplicationDate = now,
            ExemptionAmount = request.ExemptionAmount,
            RcwReference = request.RcwReference,
            Notes = request.Notes,
            Status = "pending",
            CountyId = countyId,
            CreatedBy = createdBy,
            UpdatedBy = createdBy,
        };

        return CreateAsync(entity);
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

    private static void PrepareForCreate(Exemption entity, DateTime now)
    {
        if (entity.Id == Guid.Empty)
            entity.Id = Guid.NewGuid();

        entity.ProgramCode = string.IsNullOrWhiteSpace(entity.ProgramCode) ? "SENIOR_DISABLED" : entity.ProgramCode;
        entity.Status = string.IsNullOrWhiteSpace(entity.Status) ? "pending" : entity.Status;
        entity.ApplicationDate = entity.ApplicationDate == default ? now : entity.ApplicationDate;
        entity.CreatedAt = entity.CreatedAt == default ? now : entity.CreatedAt;
        entity.UpdatedAt = now;
    }
}
