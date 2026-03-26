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
    private static readonly string[] CanonicalStepCodes =
    {
        "DATA_VALIDATION",
        "RATIO_STUDY",
        "SUPERVISORY_REVIEW",
        "ASSESSOR_SIGNOFF",
        "DOR_SUBMISSION",
        "DOR_ACCEPTANCE",
    };

    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<CertificationService> _logger;

    public CertificationService(ITerraFusionDbContext context, ILogger<CertificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CertificationStep> CreateAsync(CertificationStep entity)
    {
        var now = DateTime.UtcNow;
        PrepareForCreate(entity, now);

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
        var steps = await _context.CertificationSteps
            .AsNoTracking()
            .Where(s => s.TaxYear == taxYear && s.CountyId == countyId)
            .ToListAsync();

        if (steps.Count == 0)
            steps = await InitializeCanonicalStepsAsync(taxYear, countyId);

        return OrderCanonicalSteps(steps);
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

    private async Task<List<CertificationStep>> InitializeCanonicalStepsAsync(int taxYear, Guid countyId)
    {
        var now = DateTime.UtcNow;
        var createdSteps = new List<CertificationStep>(CanonicalStepCodes.Length);
        Guid? previousStepId = null;

        foreach (var stepCode in CanonicalStepCodes)
        {
            var step = new CertificationStep
            {
                TaxYear = taxYear,
                StepCode = stepCode,
                Status = "pending",
                CountyId = countyId,
                DependsOnStepId = previousStepId,
                CreatedAt = now,
                UpdatedAt = now,
            };

            PrepareForCreate(step, now);
            createdSteps.Add(step);
            previousStepId = step.Id;
        }

        _context.CertificationSteps.AddRange(createdSteps);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Initialized {Count} certification steps for tax year {TaxYear} in county {CountyId}",
            createdSteps.Count, taxYear, countyId);

        return createdSteps;
    }

    private static List<CertificationStep> OrderCanonicalSteps(IEnumerable<CertificationStep> steps)
    {
        var order = CanonicalStepCodes
            .Select((code, index) => new { code, index })
            .ToDictionary(x => x.code, x => x.index, StringComparer.OrdinalIgnoreCase);

        return steps
            .OrderBy(s => order.TryGetValue(s.StepCode, out var index) ? index : int.MaxValue)
            .ThenBy(s => s.CreatedAt)
            .ToList();
    }

    private static void PrepareForCreate(CertificationStep entity, DateTime now)
    {
        if (entity.Id == Guid.Empty)
            entity.Id = Guid.NewGuid();

        entity.Status = string.IsNullOrWhiteSpace(entity.Status) ? "pending" : entity.Status;
        entity.CreatedAt = entity.CreatedAt == default ? now : entity.CreatedAt;
        entity.UpdatedAt = now;
    }
}
