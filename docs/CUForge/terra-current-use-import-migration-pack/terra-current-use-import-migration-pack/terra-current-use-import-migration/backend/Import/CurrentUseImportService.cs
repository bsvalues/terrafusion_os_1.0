using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Import;

public interface ICurrentUseImportService
{
    Task<CurrentUseImportBatchDto> CreateBatchAsync(
        CreateCurrentUseImportBatchDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseImportBatchDto> ValidateRowsAsync(
        ValidateCurrentUseImportRowsDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseImportBatchDto> CommitBatchAsync(
        Guid importBatchId,
        CommitCurrentUseImportBatchDto request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUseImportBatchDto>> GetBatchesAsync(
        Guid countyId,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseImportService : ICurrentUseImportService
{
    private readonly IReadOnlyList<ICurrentUseImportValidator> _validators;
    private static readonly List<CurrentUseImportBatchDto> Batches = new();

    public CurrentUseImportService(IEnumerable<ICurrentUseImportValidator> validators)
    {
        _validators = validators.ToArray();
    }

    public Task<CurrentUseImportBatchDto> CreateBatchAsync(
        CreateCurrentUseImportBatchDto request,
        CancellationToken cancellationToken)
    {
        var batch = new CurrentUseImportBatchDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ImportType,
            CurrentUseImportStatus.Uploaded,
            request.SourceFileName,
            0,
            0,
            0,
            0,
            Array.Empty<CurrentUseImportValidationIssueDto>(),
            DateTimeOffset.UtcNow,
            request.CreatedBy);

        Batches.Add(batch);
        return Task.FromResult(batch);
    }

    public Task<CurrentUseImportBatchDto> ValidateRowsAsync(
        ValidateCurrentUseImportRowsDto request,
        CancellationToken cancellationToken)
    {
        var existing = FindBatch(request.ImportBatchId);
        var validator = _validators.First(x => x.ImportType == existing.ImportType);
        var issues = validator.Validate(request.Rows);

        var errorRows = issues
            .Where(x => x.Severity == CurrentUseImportSeverity.Error)
            .Select(x => x.RowNumber)
            .Distinct()
            .Count();

        var warningRows = issues
            .Where(x => x.Severity == CurrentUseImportSeverity.Warning)
            .Select(x => x.RowNumber)
            .Distinct()
            .Count();

        var updated = existing with
        {
            Status = errorRows > 0
                ? CurrentUseImportStatus.ValidationFailed
                : CurrentUseImportStatus.ReadyToImport,
            TotalRows = request.Rows.Count,
            ValidRows = request.Rows.Count - errorRows,
            WarningRows = warningRows,
            ErrorRows = errorRows,
            Issues = issues
        };

        Replace(existing, updated);
        return Task.FromResult(updated);
    }

    public Task<CurrentUseImportBatchDto> CommitBatchAsync(
        Guid importBatchId,
        CommitCurrentUseImportBatchDto request,
        CancellationToken cancellationToken)
    {
        var existing = FindBatch(importBatchId);

        if (existing.Status != CurrentUseImportStatus.ReadyToImport)
        {
            throw new InvalidOperationException("Only validated import batches can be committed.");
        }

        var updated = existing with
        {
            Status = request.DryRun
                ? CurrentUseImportStatus.ReadyToImport
                : CurrentUseImportStatus.Imported
        };

        Replace(existing, updated);
        return Task.FromResult(updated);
    }

    public Task<IReadOnlyList<CurrentUseImportBatchDto>> GetBatchesAsync(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseImportBatchDto> result = Batches
            .Where(x => x.CountyId == countyId)
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

        return Task.FromResult(result);
    }

    private static CurrentUseImportBatchDto FindBatch(Guid id)
    {
        return Batches.FirstOrDefault(x => x.ImportBatchId == id)
            ?? throw new InvalidOperationException($"Import batch not found: {id}");
    }

    private static void Replace(CurrentUseImportBatchDto existing, CurrentUseImportBatchDto updated)
    {
        Batches.Remove(existing);
        Batches.Add(updated);
    }
}
