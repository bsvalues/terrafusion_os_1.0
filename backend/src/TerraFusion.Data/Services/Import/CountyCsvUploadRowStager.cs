using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities.Import;
using TerraFusion.Core.Import;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Data.Services.Import;

/// <summary>
/// Persists one immutable normalized staging document per admitted batch. Replays converge on the
/// same batch result, and every read/write predicate includes the authenticated county ID.
/// </summary>
public sealed class CountyCsvUploadRowStager : ICountyCsvUploadRowStager
{
    private const int MaximumSerializationAttempts = 3;
    private const int MaximumDataRows = 100_000;
    private const int MaximumFieldsPerRow = 512;
    private const int MaximumCharactersPerField = 65_536;
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
        if (context is null
            || context.Decision != AuthenticatedCanonicalCountyContextDecision.Established
            || context.CountyId is null
            || context.CountyId == Guid.Empty
            || context.County is null
            || batch is null
            || batch.CountyId != context.CountyId
            || !string.Equals(batch.ActorId, context.ActorId, StringComparison.Ordinal)
            || !string.Equals(batch.Status, CountyCsvUploadBatch.AdmittedStatus, StringComparison.Ordinal)
            || !Enum.TryParse<CountyCsvDataset>(batch.Dataset, out var dataset)
            || dataset is not CountyCsvDataset.Parcels and not CountyCsvDataset.Sales
            || WashingtonCountyRegistry.Counties.All(candidate => candidate != context.County))
        {
            throw new InvalidOperationException("County CSV row staging authority or lineage is invalid.");
        }

        var contentSnapshot = request.AdmittedContent.ToArray();
        if (contentSnapshot.LongLength != batch.ContentByteLength
            || !string.Equals(
                Convert.ToHexString(SHA256.HashData(contentSnapshot)).ToLowerInvariant(),
                batch.ContentSha256,
                StringComparison.Ordinal))
        {
            throw new InvalidOperationException("County CSV row staging content does not match the admitted batch.");
        }

        await using var contentStream = new MemoryStream(contentSnapshot, writable: false);
        var document = await new CountyCsvStreamParser(new CountyCsvParserOptions
        {
            Delimiter = ',',
            MaxInputBytes = ICountyCsvUploadAdmissionLedger.MaximumAuthenticatedCsvUploadBytes,
            MaxDataRows = MaximumDataRows,
            MaxFieldsPerRow = MaximumFieldsPerRow,
            MaxCharactersPerField = MaximumCharactersPerField,
        }).ParseAsync(contentStream, cancellationToken).ConfigureAwait(false);
        if (batch.AcceptedRowCount != document.Rows.Count
            || !string.Equals(document.ContentSha256, batch.ContentSha256, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("County CSV row staging row count does not match the admitted batch.");
        }

        var validation = CountyCsvUploadRowValidator.Validate(dataset, document);
        var validatedAtUtc = _timeProvider.GetUtcNow();
        var entity = CreateStage(batch, validation, validatedAtUtc);

        for (var attempt = 1; attempt <= MaximumSerializationAttempts; attempt++)
        {
            try
            {
                return await StageAttemptAsync(
                        entity,
                        batch,
                        context.County,
                        cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception exception) when (
                attempt < MaximumSerializationAttempts
                && IsTransientStoreFailure(exception))
            {
                cancellationToken.ThrowIfCancellationRequested();
            }
        }

        throw new InvalidOperationException("County CSV row staging retry control reached an invalid state.");
    }

    private async Task<CountyCsvUploadRowStagingSummary> StageAttemptAsync(
        CountyCsvUploadRowStage entity,
        CountyCsvUploadBatch batch,
        WashingtonCountyIdentity county,
        CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory
            .CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var transaction = await dbContext.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
            .ConfigureAwait(false);
        try
        {
            var existing = await FindAsync(dbContext, batch.BatchId, batch.CountyId, cancellationToken)
                .ConfigureAwait(false);
            if (existing is not null)
            {
                await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
                return RequireMatching(existing, entity);
            }

            if (!await MatchesBatchAndCountyAsync(dbContext, batch, county, cancellationToken)
                .ConfigureAwait(false))
            {
                throw new InvalidOperationException(
                    "The admitted batch is not bound to the authenticated county.");
            }

            dbContext.CountyCsvUploadRowStages.Add(entity);
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
            return Summary(entity);
        }
        catch (DbUpdateException exception) when (IsBatchPrimaryKeyViolation(exception))
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
                    "County CSV row staging primary-key race had no idempotent winner.", exception)
                : RequireMatching(winner, entity);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    private static bool IsTransientStoreFailure(Exception exception)
    {
        if (FindPostgresException(exception)?.SqlState == PostgresErrorCodes.SerializationFailure)
        {
            return true;
        }

        var sqlite = FindSqliteException(exception);
        return sqlite?.SqliteErrorCode is 5 or 6;
    }

    private static bool IsBatchPrimaryKeyViolation(Exception exception)
    {
        var postgres = FindPostgresException(exception);
        if (postgres?.SqlState == PostgresErrorCodes.UniqueViolation
            && string.Equals(
                postgres.ConstraintName,
                "PK_CountyCsvUploadRowStages",
                StringComparison.Ordinal))
        {
            return true;
        }

        return FindSqliteException(exception)?.SqliteExtendedErrorCode == 1555;
    }

    private static PostgresException? FindPostgresException(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is PostgresException postgres)
            {
                return postgres;
            }
        }
        return null;
    }

    private static SqliteException? FindSqliteException(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqliteException sqlite)
            {
                return sqlite;
            }
        }
        return null;
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
            || !string.Equals(existing.ContentSha256, candidate.ContentSha256, StringComparison.Ordinal)
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

    internal static CountyCsvUploadRowStage CreateStage(
        CountyCsvUploadBatch batch,
        CountyCsvUploadRowValidationResult validation,
        DateTimeOffset validatedAtUtc) =>
        new(
            batch.BatchId,
            batch.CountyId,
            batch.ContentSha256,
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

    internal static CountyCsvUploadRowStagingSummary RequireMatchingStage(
        CountyCsvUploadRowStage existing,
        CountyCsvUploadRowStage candidate) =>
        RequireMatching(existing, candidate);

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
