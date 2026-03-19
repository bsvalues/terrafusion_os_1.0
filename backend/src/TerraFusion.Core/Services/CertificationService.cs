using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public interface ICertificationService
{
    Task<CertificationStep> CreateAsync(CertificationStep entity);
    Task<CertificationStep?> GetByIdAsync(Guid id, Guid countyId);
    Task<List<CertificationStep>> GetByTaxYearAsync(int taxYear, Guid countyId);
    Task<CertificationStep> CompleteStepAsync(Guid id, string completedBy, Guid countyId);
}

public class CertificationService : ICertificationService
{
    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<CertificationService> _logger;

    public CertificationService(ITerraFusionDbContext context, ILogger<CertificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CertificationStep> CreateAsync(CertificationStep entity)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        _context.CertificationSteps.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created certification step {StepId} ({StepCode}) for tax year {TaxYear} in county {CountyId}",
            entity.Id, entity.StepCode, entity.TaxYear, entity.CountyId);

        return entity;
    }

    public async Task<CertificationStep?> GetByIdAsync(Guid id, Guid countyId)
    {
        return await _context.CertificationSteps
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id && s.CountyId == countyId);
    }

    public async Task<List<CertificationStep>> GetByTaxYearAsync(int taxYear, Guid countyId)
    {
        return await _context.CertificationSteps
            .AsNoTracking()
            .Where(s => s.TaxYear == taxYear && s.CountyId == countyId)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<CertificationStep> CompleteStepAsync(Guid id, string completedBy, Guid countyId)
    {
        var entity = await _context.CertificationSteps
            .FirstOrDefaultAsync(s => s.Id == id && s.CountyId == countyId);

        if (entity is null)
            throw new KeyNotFoundException($"CertificationStep {id} not found in county {countyId}.");

        entity.Status = "completed";
        entity.CompletedBy = completedBy;
        entity.CompletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Completed certification step {StepId} ({StepCode}) by {CompletedBy} in county {CountyId}",
            id, entity.StepCode, completedBy, countyId);

        return entity;
    }
}
