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
    Task<CertificationStep> CompleteStepAsync(string stepReference, string completedBy, string? notes, int taxYear, Guid countyId);
}

public class CertificationService : ICertificationService
{
    private const string ServiceActor = "certification-service";
    private const string CanonicalizerActor = "pacs-canonicalizer";
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
            .Where(s => s.TaxYear == taxYear && s.CountyId == countyId)
            .ToListAsync();

        if (steps.Count == 0)
            steps = await InitializeCanonicalStepsAsync(taxYear, countyId);
        else if (await ReconcileCanonicalStepsAsync(steps, taxYear, countyId))
            await _context.SaveChangesAsync();

        return OrderCanonicalSteps(steps);
    }

    public async Task<CertificationStep> CompleteStepAsync(Guid id, string completedBy, Guid countyId)
    {
        return await CompleteStepInternalAsync(
            s => s.Id == id && s.CountyId == countyId,
            id.ToString(),
            completedBy,
            notes: null,
            countyId);
    }

    public async Task<CertificationStep> CompleteStepAsync(string stepReference, string completedBy, string? notes, int taxYear, Guid countyId)
    {
        await GetByTaxYearAsync(taxYear, countyId);

        if (Guid.TryParse(stepReference, out var stepId))
        {
            return await CompleteStepInternalAsync(
                s => s.Id == stepId && s.CountyId == countyId,
                stepReference,
                completedBy,
                notes,
                countyId);
        }

        var normalizedStepCode = NormalizeStepCode(stepReference);
        return await CompleteStepInternalAsync(
            s => s.CountyId == countyId &&
                s.TaxYear == taxYear &&
                s.StepCode == normalizedStepCode,
            normalizedStepCode,
            completedBy,
            notes,
            countyId);
    }

    private async Task<CertificationStep> CompleteStepInternalAsync(
        System.Linq.Expressions.Expression<Func<CertificationStep, bool>> predicate,
        string stepReference,
        string completedBy,
        string? notes,
        Guid countyId)
    {
        var entity = await _context.CertificationSteps
            .FirstOrDefaultAsync(predicate);

        if (entity is null)
            throw new KeyNotFoundException($"CertificationStep {stepReference} not found in county {countyId}.");

        if (string.Equals(entity.Status, "blocked", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"CertificationStep {entity.StepCode} is blocked and cannot be completed yet.");

        if (entity.DependsOnStepId is Guid dependencyId)
        {
            var dependency = await _context.CertificationSteps
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == dependencyId && s.CountyId == countyId);
            if (dependency is null || !IsCompleted(dependency.Status))
            {
                var dependencyCode = dependency?.StepCode ?? dependencyId.ToString();
                throw new InvalidOperationException($"CertificationStep {entity.StepCode} depends on {dependencyCode}, which is not completed.");
            }
        }

        var now = DateTime.UtcNow;
        entity.Status = "completed";
        entity.CompletedBy = completedBy;
        entity.CompletedAt = now;
        entity.UpdatedAt = now;
        entity.UpdatedBy = completedBy;
        if (!string.IsNullOrWhiteSpace(notes))
            entity.Notes = MergeWorkflowNote(entity.Notes, notes.Trim());

        var nextStep = await _context.CertificationSteps
            .FirstOrDefaultAsync(s => s.CountyId == countyId && s.DependsOnStepId == entity.Id);
        if (nextStep is not null && string.Equals(nextStep.Status, "pending", StringComparison.OrdinalIgnoreCase))
        {
            nextStep.Status = "in_progress";
            nextStep.UpdatedAt = now;
            nextStep.UpdatedBy = ServiceActor;
            nextStep.Notes = MergeWorkflowNote(
                nextStep.Notes,
                $"{nextStep.StepCode} is now actionable because {entity.StepCode} was completed by {completedBy} on {now:O}.");
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Completed certification step {StepId} ({StepCode}) by {CompletedBy} in county {CountyId}",
            entity.Id, entity.StepCode, completedBy, countyId);

        return entity;
    }

    private async Task<List<CertificationStep>> InitializeCanonicalStepsAsync(int taxYear, Guid countyId)
    {
        var now = DateTime.UtcNow;
        var createdSteps = new List<CertificationStep>(CanonicalStepCodes.Length);
        var stepPlans = await BuildLevyBackedStepPlansAsync(taxYear, countyId);
        Guid? previousStepId = null;

        foreach (var stepPlan in stepPlans)
        {
            var step = new CertificationStep
            {
                TaxYear = taxYear,
                StepCode = stepPlan.StepCode,
                CountyId = countyId,
                DependsOnStepId = previousStepId,
                CreatedAt = now,
                UpdatedAt = now,
            };

            PrepareForCreate(step, now);
            ApplyPlan(step, stepPlan, preserveHumanCompletion: false, now);
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

    private async Task<bool> ReconcileCanonicalStepsAsync(List<CertificationStep> steps, int taxYear, Guid countyId)
    {
        var changed = false;
        var now = DateTime.UtcNow;
        var existingByCode = steps.ToDictionary(s => s.StepCode, StringComparer.OrdinalIgnoreCase);
        var stepPlans = await BuildLevyBackedStepPlansAsync(taxYear, countyId);
        Guid? previousStepId = null;

        foreach (var stepPlan in stepPlans)
        {
            if (!existingByCode.TryGetValue(stepPlan.StepCode, out var step))
            {
                step = new CertificationStep
                {
                    TaxYear = taxYear,
                    CountyId = countyId,
                    StepCode = stepPlan.StepCode,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                PrepareForCreate(step, now);
                _context.CertificationSteps.Add(step);
                steps.Add(step);
                existingByCode.Add(step.StepCode, step);
                changed = true;
            }

            if (step.DependsOnStepId != previousStepId)
            {
                step.DependsOnStepId = previousStepId;
                step.UpdatedAt = now;
                step.UpdatedBy = ServiceActor;
                changed = true;
            }

            if (ApplyPlan(step, stepPlan, preserveHumanCompletion: true, now))
                changed = true;

            previousStepId = step.Id;
        }

        return changed;
    }

    private async Task<IReadOnlyList<CertificationStepPlan>> BuildLevyBackedStepPlansAsync(int taxYear, Guid countyId)
    {
        var summary = await SummarizeLevyCertificationsAsync(taxYear, countyId);
        var levyDataReady = summary.Total > 0;
        var levyImportComplete = levyDataReady && summary.Certified == summary.Total;
        var limitReviewComplete = levyImportComplete &&
            summary.ConstitutionalOk == summary.Total &&
            summary.AggregateOk == summary.Total;

        var validationNotes = levyDataReady
            ? $"Levy oracle sync verified {summary.Total} canonical levy certifications for tax year {taxYear}; {summary.Certified} carry status 'certified'."
            : $"No canonical levy certifications exist for tax year {taxYear}. Run TerraFusion Sync levy certification ingestion before county certification can begin.";

        var ratioNotes = levyDataReady
            ? $"Limit review reconciled {summary.ConstitutionalOk}/{summary.Total} constitutional passes, {summary.AggregateOk}/{summary.Total} aggregate passes, and {summary.Reduced} reduced districts from canonical levy truth."
            : "Waiting on DATA_VALIDATION because no levy certification truth is present in TerraFusion.";

        var reviewNotes = levyDataReady
            ? summary.Reduced > 0
                ? $"Ready for supervisory review. {summary.Reduced} district certification(s) were reduced and require leadership confirmation before sign-off."
                : "Ready for supervisory review. Canonical levy certifications imported with no reductions."
            : "Blocked until canonical levy certification data is present.";

        return
        [
            new CertificationStepPlan(
                "DATA_VALIDATION",
                levyImportComplete ? "completed" : "blocked",
                validationNotes,
                levyImportComplete ? CanonicalizerActor : null,
                levyImportComplete ? summary.LatestCreatedAt : null,
                true),
            new CertificationStepPlan(
                "RATIO_STUDY",
                limitReviewComplete ? "completed" : (levyDataReady ? "in_progress" : "blocked"),
                ratioNotes,
                limitReviewComplete ? CanonicalizerActor : null,
                limitReviewComplete ? summary.LatestCreatedAt : null,
                true),
            new CertificationStepPlan(
                "SUPERVISORY_REVIEW",
                levyDataReady ? "in_progress" : "blocked",
                reviewNotes,
                null,
                null,
                false),
            new CertificationStepPlan(
                "ASSESSOR_SIGNOFF",
                levyDataReady ? "pending" : "blocked",
                levyDataReady
                    ? "Awaiting county assessor sign-off after supervisory review of canonical levy certifications."
                    : "Blocked until supervisory review can start from canonical levy truth.",
                null,
                null,
                false),
            new CertificationStepPlan(
                "DOR_SUBMISSION",
                levyDataReady ? "pending" : "blocked",
                levyDataReady
                    ? "Awaiting assessor sign-off before Department of Revenue submission."
                    : "Blocked until county certification workflow advances from canonical levy truth.",
                null,
                null,
                false),
            new CertificationStepPlan(
                "DOR_ACCEPTANCE",
                levyDataReady ? "pending" : "blocked",
                levyDataReady
                    ? "Awaiting Department of Revenue acceptance after submission."
                    : "Blocked until levy certification workflow reaches DOR submission.",
                null,
                null,
                false),
        ];
    }

    private async Task<LevyCertificationSummary> SummarizeLevyCertificationsAsync(int taxYear, Guid countyId)
    {
        var levyCertifications = await _context.LevyCertifications
            .AsNoTracking()
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear)
            .Select(c => new
            {
                c.Status,
                c.WithinConstitutionalLimit,
                c.WithinAggregateLimit,
                c.WasReduced,
                c.CreatedAt,
            })
            .ToListAsync();

        return new LevyCertificationSummary(
            levyCertifications.Count,
            levyCertifications.Count(c => string.Equals(c.Status, "certified", StringComparison.OrdinalIgnoreCase)),
            levyCertifications.Count(c => c.WithinConstitutionalLimit),
            levyCertifications.Count(c => c.WithinAggregateLimit),
            levyCertifications.Count(c => c.WasReduced),
            levyCertifications.Max(c => (DateTime?)c.CreatedAt));
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
        entity.CreatedBy ??= ServiceActor;
        entity.UpdatedBy = ServiceActor;
        entity.UpdatedAt = now;
    }

    private static bool IsCompleted(string? status) =>
        string.Equals(status, "complete", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, "completed", StringComparison.OrdinalIgnoreCase);

    private static string NormalizeStepCode(string stepReference) =>
        stepReference.Trim().Replace("-", "_", StringComparison.Ordinal).ToUpperInvariant();

    private static string MergeWorkflowNote(string? existingNotes, string addition)
    {
        if (string.IsNullOrWhiteSpace(existingNotes))
            return addition;
        if (existingNotes.Contains(addition, StringComparison.Ordinal))
            return existingNotes;
        return $"{existingNotes}{Environment.NewLine}{addition}";
    }

    private static bool ApplyPlan(
        CertificationStep entity,
        CertificationStepPlan plan,
        bool preserveHumanCompletion,
        DateTime now)
    {
        var changed = false;

        if (!string.Equals(entity.StepCode, plan.StepCode, StringComparison.Ordinal))
        {
            entity.StepCode = plan.StepCode;
            changed = true;
        }

        var preserveStatus = preserveHumanCompletion &&
            string.Equals(entity.Status, "completed", StringComparison.OrdinalIgnoreCase) &&
            !plan.IsSystemManaged;

        if (!preserveStatus && !string.Equals(entity.Status, plan.Status, StringComparison.OrdinalIgnoreCase))
        {
            entity.Status = plan.Status;
            changed = true;
        }

        var notesAreServiceOwned = string.IsNullOrWhiteSpace(entity.UpdatedBy) ||
            string.Equals(entity.UpdatedBy, ServiceActor, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(entity.UpdatedBy, CanonicalizerActor, StringComparison.OrdinalIgnoreCase);
        if ((notesAreServiceOwned || string.IsNullOrWhiteSpace(entity.Notes)) &&
            !string.Equals(entity.Notes, plan.Notes, StringComparison.Ordinal))
        {
            entity.Notes = plan.Notes;
            changed = true;
        }

        if (plan.IsSystemManaged || !preserveHumanCompletion || !string.Equals(entity.Status, "completed", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(entity.CompletedBy, plan.CompletedBy, StringComparison.Ordinal))
            {
                entity.CompletedBy = plan.CompletedBy;
                changed = true;
            }

            if (entity.CompletedAt != plan.CompletedAt)
            {
                entity.CompletedAt = plan.CompletedAt;
                changed = true;
            }
        }

        if (changed)
        {
            entity.UpdatedAt = now;
            entity.UpdatedBy = ServiceActor;
        }

        return changed;
    }

    private sealed record CertificationStepPlan(
        string StepCode,
        string Status,
        string Notes,
        string? CompletedBy,
        DateTime? CompletedAt,
        bool IsSystemManaged);

    private sealed record LevyCertificationSummary(
        int Total,
        int Certified,
        int ConstitutionalOk,
        int AggregateOk,
        int Reduced,
        DateTime? LatestCreatedAt);
}
