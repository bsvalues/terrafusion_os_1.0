using System.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities.Import;
using TerraFusion.Core.Import;

namespace TerraFusion.Data.Services.Import;

/// <summary>
/// Persists one immutable normalized staging document per admitted batch. Replays converge on the
/// same batch result, and every read/write predicate includes the authenticated county ID.
/// </summary>
public sealed class CountyCsvUploadRowStager : ICountyCsvUploadRowStager
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IDbContextFactory<TerraFusionDbContext> _dbContextFactory;
    private readonly TimeProvider _timeProvider;

    public CountyCsvUploadRowStager(
        IDbContextFactory<TerraFusionDbContext> dbContextFactory,
        TimeProvider? timeProvider = null)
    {
        _dbContextFactory = dbContextFactory ?? throw new ArgumentNullException(nameof(dbContextFactory));
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<CountyCsvUploadRowStagingSummary> StageAsync(
        CountyCsvUploadRowStagingRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        var context = request.CountyContext;
        var batch = request.Batch;
        var document = request.Document;
        if (context is null
            || context.Decision != AuthenticatedCanonicalCountyContextDecision.Established
            || context.CountyId is null
            || context.CountyId == Guid.Empty
            || context.County is null
            || batch is null
            || document is null
            || batch.CountyId != context.CountyId
            || !string.Equals(batch.ActorId, context.ActorId, StringComparison.Ordinal)
            || !string.Equals(batch.Status, CountyCsvUploadBatch.AdmittedStatus, StringComparison.Ordinal)
            || !Enum.TryParse<CountyCsvDataset>(batch.Dataset, out var dataset)
            || dataset is not CountyCsvDataset.Parcels and not CountyCsvDataset.Sales
            || batch.AcceptedRowCount != document.Rows.Count
            || batch.ContentByteLength != document.InputBytes
            || WashingtonCountyRegistry.Counties.All(candidate => candidate != context.County))
        {
            throw new InvalidOperationException("County CSV row staging authority or lineage is invalid.");
        }

        var validation = CountyCsvUploadRowValidator.Validate(dataset, document);
        var validatedAtUtc = _timeProvider.GetUtcNow();
        var entity = new CountyCsvUploadRowStage(
            batch.BatchId,
            batch.CountyId,
            batch.Dataset,
            ICountyCsvUploadRowStager.ContractId,
            validation.SchemaVersion,
            validation.TotalRowCount,
            validation.StagedRowCount,
            validation.QuarantinedRowCount,
            JsonSerializer.Serialize(validation.StagedRows, JsonOptions),
            JsonSerializer.Serialize(validation.QuarantinedRows, JsonOptions),
            JsonSerializer.Serialize(validation.ReasonCounts, JsonOptions),
            validatedAtUtc);

        await using var dbContext = await _dbContextFactory
            .CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var transaction = await dbContext.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
            .ConfigureAwait(false);

        var existing = await FindAsync(dbContext, batch.BatchId, batch.CountyId, cancellationToken)
            .ConfigureAwait(false);
        if (existing is not null)
        {
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
            return RequireMatching(existing, entity);
        }

        if (!await MatchesBatchAndCountyAsync(dbContext, batch, context.County, cancellationToken)
            .ConfigureAwait(false))
        {
            throw new InvalidOperationException("The admitted batch is not bound to the authenticated county.");
        }

        dbContext.CountyCsvUploadRowStages.Add(entity);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
            return Summary(entity);
        }
        catch (DbUpdateException exception)
        {
            await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            dbContext.ChangeTracker.Clear();
            await using var winnerContext = await _dbContextFactory
                .CreateDbContextAsync(CancellationToken.None)
                .ConfigureAwait(false);
            var winner = await FindAsync(
                    winnerContext,
                    batch.BatchId,
                    batch.CountyId,
                    CancellationToken.None)
                .ConfigureAwait(false);
            return winner is null
                ? throw new InvalidOperationException(
                    "County CSV row staging failed without an idempotent winner.", exception)
                : RequireMatching(winner, entity);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    private static Task<CountyCsvUploadRowStage?> FindAsync(
        TerraFusionDbContext dbContext,
        Guid batchId,
        Guid countyId,
        CancellationToken cancellationToken) =>
        dbContext.CountyCsvUploadRowStages
            .AsNoTracking()
            .SingleOrDefaultAsync(
                stage => stage.BatchId == batchId && stage.CountyId == countyId,
                cancellationToken);

    private static async Task<bool> MatchesBatchAndCountyAsync(
        TerraFusionDbContext dbContext,
        CountyCsvUploadBatch batch,
        WashingtonCountyIdentity county,
        CancellationToken cancellationToken)
    {
        var batchMatches = await dbContext.CountyCsvUploadBatches
            .AsNoTracking()
            .AnyAsync(
                persisted => persisted.BatchId == batch.BatchId
                    && persisted.CountyId == batch.CountyId
                    && persisted.Dataset == batch.Dataset
                    && persisted.ActorId == batch.ActorId
                    && persisted.ContentSha256 == batch.ContentSha256
                    && persisted.ContentByteLength == batch.ContentByteLength
                    && persisted.AcceptedRowCount == batch.AcceptedRowCount
                    && persisted.Status == CountyCsvUploadBatch.AdmittedStatus,
                cancellationToken)
            .ConfigureAwait(false);
        return batchMatches
            && await dbContext.Counties.AsNoTracking().AnyAsync(
                persisted => persisted.Id == batch.CountyId
                    && persisted.Name == county.Name
                    && persisted.State == county.State
                    && persisted.FipsCode == county.FipsCode,
                cancellationToken)
                .ConfigureAwait(false);
    }

    private static CountyCsvUploadRowStagingSummary RequireMatching(
        CountyCsvUploadRowStage existing,
        CountyCsvUploadRowStage candidate)
    {
        if (existing.CountyId != candidate.CountyId
            || !string.Equals(existing.Dataset, candidate.Dataset, StringComparison.Ordinal)
            || !string.Equals(existing.ContractId, candidate.ContractId, StringComparison.Ordinal)
            || !string.Equals(existing.SchemaVersion, candidate.SchemaVersion, StringComparison.Ordinal)
            || existing.TotalRowCount != candidate.TotalRowCount
            || existing.StagedRowCount != candidate.StagedRowCount
            || existing.QuarantinedRowCount != candidate.QuarantinedRowCount
            || !string.Equals(existing.StagedRowsJson, candidate.StagedRowsJson, StringComparison.Ordinal)
            || !string.Equals(existing.QuarantinedRowsJson, candidate.QuarantinedRowsJson, StringComparison.Ordinal)
            || !string.Equals(existing.ReasonCountsJson, candidate.ReasonCountsJson, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("The existing staging result does not match this batch replay.");
        }
        return Summary(existing);
    }

    internal static CountyCsvUploadRowStagingSummary Summary(CountyCsvUploadRowStage stage) =>
        SummaryFromMetadata(
            stage.BatchId,
            stage.CountyId,
            stage.ContractId,
            stage.SchemaVersion,
            stage.TotalRowCount,
            stage.StagedRowCount,
            stage.QuarantinedRowCount,
            stage.ReasonCountsJson,
            stage.ValidatedAtUtc);

    internal static CountyCsvUploadRowStagingSummary SummaryFromMetadata(
        Guid batchId,
        Guid countyId,
        string contractId,
        string schemaVersion,
        int totalRowCount,
        int stagedRowCount,
        int quarantinedRowCount,
        string reasonCountsJson,
        DateTimeOffset validatedAtUtc)
    {
        var reasons = JsonSerializer.Deserialize<CountyCsvQuarantineReasonCount[]>(
                reasonCountsJson,
                JsonOptions)
            ?? [];
        return new(
            batchId,
            countyId,
            contractId,
            schemaVersion,
            totalRowCount,
            stagedRowCount,
            quarantinedRowCount,
            reasons,
            validatedAtUtc);
    }
}
