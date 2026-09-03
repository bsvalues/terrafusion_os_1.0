using System.Data;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities.Import;
using TerraFusion.Core.Import;

namespace TerraFusion.Data.Services.Import;

/// <summary>
/// EF-backed upload admission ledger. Each operation owns a dedicated context, and its explicit
/// transaction covers both entity persistence and TerraFusionDbContext's second audit-log save.
/// </summary>
public sealed class CountyCsvUploadAdmissionLedger :
    ICountyCsvUploadAdmissionLedger,
    ICountyCsvUploadHistoryReader
{
    private const int MaximumActorIdCharacters = 200;
    private const int MaximumFileNameCharacters = 255;
    private const int MaximumDataRows = 100_000;
    private const int MaximumFieldsPerRow = 512;
    private const int MaximumCharactersPerField = 65_536;

    private readonly IDbContextFactory<TerraFusionDbContext> _dbContextFactory;
    private readonly TimeProvider _timeProvider;

    public CountyCsvUploadAdmissionLedger(
        IDbContextFactory<TerraFusionDbContext> dbContextFactory,
        TimeProvider? timeProvider = null)
    {
        _dbContextFactory = dbContextFactory
            ?? throw new ArgumentNullException(nameof(dbContextFactory));
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<CountyCsvUploadAdmissionResult> AdmitAsync(
        CountyCsvUploadAdmissionRequest? request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!TryValidate(
                request,
                out var evidence,
                out var claimedDocumentShape,
                out var denialCode))
        {
            return Denied(denialCode);
        }

        var contentRevalidation = await RevalidateAdmittedContentAsync(
                request!.AdmittedContent,
                request.IntakeReceipt!,
                claimedDocumentShape,
                cancellationToken)
            .ConfigureAwait(false);
        if (contentRevalidation.DenialCode != CountyCsvUploadAdmissionDenialCode.None)
        {
            return Denied(contentRevalidation.DenialCode);
        }

        evidence = evidence with { AcceptedRowCount = contentRevalidation.AcceptedRowCount };

        await using var dbContext = await _dbContextFactory
            .CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var transaction = await dbContext.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
            .ConfigureAwait(false);

        if (!await MatchesPersistedCanonicalCountyAsync(
                dbContext,
                evidence.CountyId,
                evidence.County,
                cancellationToken)
            .ConfigureAwait(false))
        {
            return Denied(CountyCsvUploadAdmissionDenialCode.CountyMismatch);
        }

        var existing = await FindByIdempotencyKeyAsync(
                dbContext,
                evidence.IdempotencyKey,
                cancellationToken)
            .ConfigureAwait(false);
        if (existing is not null)
        {
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
            return ResolveExisting(existing, evidence);
        }

        var batch = evidence.CreateBatch(
            Guid.NewGuid(),
            _timeProvider.GetUtcNow());
        dbContext.CountyCsvUploadBatches.Add(batch);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

            return Accepted(CountyCsvUploadAdmissionDisposition.FirstSeen, batch);
        }
        catch (DbUpdateException updateException)
        {
            await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            dbContext.ChangeTracker.Clear();

            await using var winnerContext = await _dbContextFactory
                .CreateDbContextAsync(CancellationToken.None)
                .ConfigureAwait(false);
            await using var winnerTransaction = await winnerContext.Database
                .BeginTransactionAsync(IsolationLevel.Serializable, CancellationToken.None)
                .ConfigureAwait(false);
            if (!await MatchesPersistedCanonicalCountyAsync(
                    winnerContext,
                    evidence.CountyId,
                    evidence.County,
                    CancellationToken.None)
                .ConfigureAwait(false))
            {
                return Denied(CountyCsvUploadAdmissionDenialCode.CountyMismatch);
            }

            var winner = await FindByIdempotencyKeyAsync(
                    winnerContext,
                    evidence.IdempotencyKey,
                    CancellationToken.None)
                .ConfigureAwait(false);
            if (winner is not null)
            {
                await winnerTransaction
                    .CommitAsync(CancellationToken.None)
                    .ConfigureAwait(false);
                return ResolveExisting(winner, evidence);
            }

            throw new InvalidOperationException(
                "County CSV upload admission failed without a durable idempotency winner.",
                updateException);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    public async Task<IReadOnlyList<CountyCsvUploadBatchSummary>> ListRecentAsync(
        Guid countyId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("County ID must be non-empty.", nameof(countyId));
        }

        if (limit is <= 0 or > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(limit));
        }

        cancellationToken.ThrowIfCancellationRequested();
        await using var dbContext = await _dbContextFactory
            .CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);

        // SQLite cannot translate DateTimeOffset ordering through LINQ. Both SQLite and the
        // launch PostgreSQL provider persist this UTC value in a database-sortable representation,
        // so keep the county predicate parameterized and perform the ordering in provider SQL.
        return await dbContext.CountyCsvUploadBatches
            .FromSqlInterpolated($@"
                SELECT *
                FROM ""CountyCsvUploadBatches""
                WHERE ""CountyId"" = {countyId}
                ORDER BY ""ReceivedAtUtc"" DESC, ""BatchId"" DESC")
            .AsNoTracking()
            .Take(limit)
            .Select(batch => new CountyCsvUploadBatchSummary(
                batch.BatchId,
                batch.CountyId,
                batch.Dataset,
                batch.SourceFileName,
                batch.ContentSha256,
                batch.ContentByteLength,
                batch.AcceptedRowCount,
                batch.Status,
                batch.ReceivedAtUtc))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    private static async Task<CountyCsvUploadBatch?> FindByIdempotencyKeyAsync(
        TerraFusionDbContext dbContext,
        string idempotencyKey,
        CancellationToken cancellationToken) =>
        await dbContext.CountyCsvUploadBatches
            .AsNoTracking()
            .SingleOrDefaultAsync(
                batch => batch.IdempotencyKey == idempotencyKey,
                cancellationToken)
            .ConfigureAwait(false);

    private static Task<bool> MatchesPersistedCanonicalCountyAsync(
        TerraFusionDbContext dbContext,
        Guid countyId,
        WashingtonCountyIdentity canonicalCounty,
        CancellationToken cancellationToken) =>
        dbContext.Counties
            .AsNoTracking()
            .AnyAsync(
                county => county.Id == countyId
                    && county.Name == canonicalCounty.Name
                    && county.State == canonicalCounty.State
                    && county.FipsCode == canonicalCounty.FipsCode,
                cancellationToken);

    private static bool TryValidate(
        CountyCsvUploadAdmissionRequest? request,
        out AdmissionEvidence evidence,
        out ClaimedDocumentShape claimedDocumentShape,
        out CountyCsvUploadAdmissionDenialCode denialCode)
    {
        evidence = null!;
        claimedDocumentShape = default;
        denialCode = CountyCsvUploadAdmissionDenialCode.InvalidApiContract;

        if (request is null
            || !string.Equals(
                request.ApiAdmissionContractId,
                ICountyCsvUploadAdmissionLedger.AuthenticatedCsvApiAdmissionContractId,
                StringComparison.Ordinal))
        {
            return false;
        }

        var context = request.CountyContext;
        if (context is null
            || context.Decision != AuthenticatedCanonicalCountyContextDecision.Established
            || context.CountyId is null
            || context.CountyId == Guid.Empty
            || context.County is null)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidCountyContext;
            return false;
        }

        if (!IsBoundedActorId(context.ActorId))
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidActor;
            return false;
        }

        var canonicalCounty = WashingtonCountyRegistry.Counties
            .FirstOrDefault(county => county == context.County);
        if (canonicalCounty is null)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.NonCanonicalCounty;
            return false;
        }

        var receipt = request.IntakeReceipt;
        if (receipt is null
            || receipt.Binding is null
            || receipt.IntakeReceipt is null
            || receipt.IntakeReceipt.Content is null
            || receipt.IntakeReceipt.Document is null
            || !string.Equals(
                receipt.ContractId,
                CountyCsvCountyBoundIntake.ContractId,
                StringComparison.Ordinal)
            || !string.Equals(
                receipt.IntakeReceipt.ContractId,
                CountyCsvIntakeEnvelope.ContractId,
                StringComparison.Ordinal))
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidReceipt;
            return false;
        }

        if (receipt.Binding.County != canonicalCounty)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.CountyMismatch;
            return false;
        }

        if (receipt.Binding.Dataset is not CountyCsvDataset.Parcels and not CountyCsvDataset.Sales)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.UnsupportedDataset;
            return false;
        }

        if (receipt.Binding.DataMode != CountyDataMode.CountyProvided
            || receipt.Binding.Exposure != CountyDataExposure.Protected
            || receipt.Binding.Action != CountyDataAction.Operate)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidBindingPosture;
            return false;
        }

        var intakeReceipt = receipt.IntakeReceipt;
        if (!TryCaptureDocumentShape(intakeReceipt.Document, out claimedDocumentShape))
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence;
            return false;
        }

        if (!IsSafeCsvDeclaration(
                intakeReceipt.FileName,
                intakeReceipt.Format,
                intakeReceipt.MediaType))
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidDeclaration;
            return false;
        }

        var content = intakeReceipt.Content;
        if (!IsLowercaseSha256(content.Sha256)
            || content.ByteLength <= 0
            || content.ByteLength > ICountyCsvUploadAdmissionLedger.MaximumAuthenticatedCsvUploadBytes
            || content.ByteLength != claimedDocumentShape.InputBytes)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence;
            return false;
        }

        var identity = request.Identity;
        if (identity is null
            || identity.Content is null
            || !string.Equals(
                identity.ContractId,
                CountyCsvIntakeIdempotency.ContractId,
                StringComparison.Ordinal))
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidIdentity;
            return false;
        }

        if (identity.County != canonicalCounty || identity.Dataset != receipt.Binding.Dataset)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.CountyMismatch;
            return false;
        }

        CountyCsvIntakeIdempotencyIdentity recomputedIdentity;
        try
        {
            recomputedIdentity = CountyCsvIntakeIdempotency.Create(receipt);
        }
        catch (CountyCsvIntakeIdempotencyException)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidIdentity;
            return false;
        }

        if (!IsLowercaseSha256(identity.IdempotencyKey)
            || !string.Equals(
                identity.IdempotencyKey,
                recomputedIdentity.IdempotencyKey,
                StringComparison.Ordinal)
            || identity.Content.ByteLength != recomputedIdentity.Content.ByteLength
            || !string.Equals(
                identity.Content.Sha256,
                recomputedIdentity.Content.Sha256,
                StringComparison.Ordinal))
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.IdempotencyKeyMismatch;
            return false;
        }

        evidence = new AdmissionEvidence(
            context.CountyId.Value,
            context.ActorId!,
            canonicalCounty,
            receipt.Binding.Dataset,
            intakeReceipt.FileName,
            intakeReceipt.Format,
            intakeReceipt.MediaType,
            content.Sha256,
            content.ByteLength,
            0,
            identity.IdempotencyKey,
            request.ApiAdmissionContractId);
        denialCode = CountyCsvUploadAdmissionDenialCode.None;
        return true;
    }

    private static bool IsBoundedActorId(string? value) =>
        !string.IsNullOrWhiteSpace(value)
        && value.Length <= MaximumActorIdCharacters
        && string.Equals(value, value.Trim(), StringComparison.Ordinal)
        && !value.Any(char.IsControl);

    private static bool IsSafeCsvDeclaration(
        string? fileName,
        string? format,
        string? mediaType) =>
        !string.IsNullOrWhiteSpace(fileName)
        && fileName.Length <= MaximumFileNameCharacters
        && string.Equals(fileName, fileName.Trim(), StringComparison.Ordinal)
        && fileName is not "." and not ".."
        && fileName.IndexOfAny(['/', '\\', ':']) < 0
        && !fileName.Any(char.IsControl)
        && fileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)
        && fileName.Length > ".csv".Length
        && string.Equals(format, "csv", StringComparison.Ordinal)
        && string.Equals(mediaType, "text/csv", StringComparison.Ordinal);

    private static async Task<ContentRevalidationResult> RevalidateAdmittedContentAsync(
        ReadOnlyMemory<byte> admittedContent,
        CountyCsvCountyBoundIntakeReceipt claimedReceipt,
        ClaimedDocumentShape claimedDocumentShape,
        CancellationToken cancellationToken)
    {
        var claimedIntake = claimedReceipt.IntakeReceipt;
        if (admittedContent.Length != claimedIntake.Content.ByteLength)
        {
            return ContentRevalidationResult.Denied(
                CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence);
        }

        cancellationToken.ThrowIfCancellationRequested();
        var contentSnapshot = admittedContent.ToArray();
        cancellationToken.ThrowIfCancellationRequested();
        if (!string.Equals(
                Convert.ToHexString(SHA256.HashData(contentSnapshot)).ToLowerInvariant(),
                claimedIntake.Content.Sha256,
                StringComparison.Ordinal))
        {
            return ContentRevalidationResult.Denied(
                CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence);
        }

        CountyCsvCountyBoundIntakeReceipt regeneratedReceipt;
        try
        {
            var intake = new CountyCsvCountyBoundIntake(
                new CountyCsvParserOptions
                {
                    Delimiter = ',',
                    MaxInputBytes = ICountyCsvUploadAdmissionLedger
                        .MaximumAuthenticatedCsvUploadBytes,
                    MaxDataRows = MaximumDataRows,
                    MaxFieldsPerRow = MaximumFieldsPerRow,
                    MaxCharactersPerField = MaximumCharactersPerField,
                });
            regeneratedReceipt = await intake.AdmitAsync(
                    new CountyCsvCountyBoundIntakeRequest(
                        claimedReceipt.Binding.County,
                        claimedReceipt.Binding.County,
                        claimedReceipt.Binding.Dataset,
                        new CountyCsvIntakeDeclaration
                        {
                            FileName = claimedIntake.FileName,
                            Format = claimedIntake.Format,
                            MediaType = claimedIntake.MediaType,
                        },
                        contentSnapshot),
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception exception) when (
            exception is CountyCsvParseException
                or CountyCsvIntakeException
                or CountyCsvCountyBoundIntakeException)
        {
            return ContentRevalidationResult.Denied(
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence);
        }

        return DocumentsMatch(
                regeneratedReceipt.IntakeReceipt.Document,
                claimedIntake.Document,
                claimedDocumentShape)
            ? ContentRevalidationResult.Accepted(
                regeneratedReceipt.IntakeReceipt.Document.Rows.Count)
            : ContentRevalidationResult.Denied(
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence);
    }

    private static bool TryCaptureDocumentShape(
        CountyCsvDocument document,
        out ClaimedDocumentShape shape)
    {
        shape = default;
        try
        {
            if (document.Headers is null || document.Rows is null)
            {
                return false;
            }

            var headerCount = document.Headers.Count;
            var rowCount = document.Rows.Count;
            if (headerCount is <= 0 or > MaximumFieldsPerRow
                || rowCount is < 0 or > MaximumDataRows)
            {
                return false;
            }

            shape = new ClaimedDocumentShape(headerCount, rowCount, document.InputBytes);
            return true;
        }
        catch (Exception exception) when (IsNonFatalCollectionAccessException(exception))
        {
            return false;
        }
    }

    private static bool DocumentsMatch(
        CountyCsvDocument regenerated,
        CountyCsvDocument claimed,
        ClaimedDocumentShape claimedShape)
    {
        try
        {
            if (claimed.Headers is null
                || claimed.Rows is null
                || regenerated.InputBytes != claimedShape.InputBytes
                || claimed.InputBytes != claimedShape.InputBytes
                || regenerated.Headers.Count != claimedShape.HeaderCount
                || claimed.Headers.Count != claimedShape.HeaderCount
                || regenerated.Rows.Count != claimedShape.RowCount
                || claimed.Rows.Count != claimedShape.RowCount)
            {
                return false;
            }

            for (var index = 0; index < regenerated.Headers.Count; index++)
            {
                if (!string.Equals(
                        regenerated.Headers[index],
                        claimed.Headers[index],
                        StringComparison.Ordinal))
                {
                    return false;
                }
            }

            for (var rowIndex = 0; rowIndex < regenerated.Rows.Count; rowIndex++)
            {
                var regeneratedRow = regenerated.Rows[rowIndex];
                var claimedRow = claimed.Rows[rowIndex];
                var claimedFieldCount = claimedRow?.Count ?? -1;
                if (claimedRow is null
                    || claimedFieldCount < 0
                    || claimedFieldCount > MaximumFieldsPerRow
                    || claimedFieldCount != regeneratedRow.Count)
                {
                    return false;
                }

                for (var fieldIndex = 0; fieldIndex < regeneratedRow.Count; fieldIndex++)
                {
                    if (!string.Equals(
                            regeneratedRow[fieldIndex],
                            claimedRow[fieldIndex],
                            StringComparison.Ordinal))
                    {
                        return false;
                    }
                }
            }

            return true;
        }
        catch (Exception exception) when (IsNonFatalCollectionAccessException(exception))
        {
            return false;
        }
    }

    private static bool IsNonFatalCollectionAccessException(Exception exception) =>
        exception is not OutOfMemoryException
            and not StackOverflowException
            and not AccessViolationException;

    private static bool IsLowercaseSha256(string? value) =>
        value is { Length: 64 }
        && value.All(character =>
            character is >= '0' and <= '9' or >= 'a' and <= 'f');

    private static CountyCsvUploadAdmissionResult ResolveExisting(
        CountyCsvUploadBatch existing,
        AdmissionEvidence evidence) =>
        evidence.Matches(existing)
            ? Accepted(CountyCsvUploadAdmissionDisposition.Duplicate, existing)
            : Denied(CountyCsvUploadAdmissionDenialCode.KeyCollision);

    private static CountyCsvUploadAdmissionResult Accepted(
        CountyCsvUploadAdmissionDisposition disposition,
        CountyCsvUploadBatch batch) =>
        new(
            ICountyCsvUploadAdmissionLedger.ContractId,
            disposition,
            CountyCsvUploadAdmissionDenialCode.None,
            batch);

    private static CountyCsvUploadAdmissionResult Denied(
        CountyCsvUploadAdmissionDenialCode denialCode) =>
        new(
            ICountyCsvUploadAdmissionLedger.ContractId,
            CountyCsvUploadAdmissionDisposition.Denied,
            denialCode,
            null);

    private sealed record ContentRevalidationResult(
        CountyCsvUploadAdmissionDenialCode DenialCode,
        int AcceptedRowCount)
    {
        public static ContentRevalidationResult Accepted(int acceptedRowCount) =>
            new(CountyCsvUploadAdmissionDenialCode.None, acceptedRowCount);

        public static ContentRevalidationResult Denied(
            CountyCsvUploadAdmissionDenialCode denialCode) =>
            new(denialCode, 0);
    }

    private readonly record struct ClaimedDocumentShape(
        int HeaderCount,
        int RowCount,
        long InputBytes);

    private sealed record AdmissionEvidence(
        Guid CountyId,
        string ActorId,
        WashingtonCountyIdentity County,
        CountyCsvDataset Dataset,
        string SourceFileName,
        string Format,
        string MediaType,
        string ContentSha256,
        long ContentByteLength,
        int AcceptedRowCount,
        string IdempotencyKey,
        string ApiAdmissionContractId)
    {
        public CountyCsvUploadBatch CreateBatch(Guid batchId, DateTimeOffset receivedAtUtc) =>
            new(
                batchId,
                CountyId,
                ActorId,
                Dataset,
                SourceFileName,
                Format,
                MediaType,
                ContentSha256,
                ContentByteLength,
                AcceptedRowCount,
                IdempotencyKey,
                ApiAdmissionContractId,
                AuthenticatedCanonicalCountyContext.ContractId,
                CountyCsvCountyBoundIntake.ContractId,
                CountyCsvIntakeEnvelope.ContractId,
                CountyCsvStreamParser.ContractId,
                CountyCsvIntakeIdempotency.ContractId,
                ICountyCsvUploadAdmissionLedger.ContractId,
                receivedAtUtc);

        public bool Matches(CountyCsvUploadBatch batch) =>
            batch.CountyId == CountyId
            && string.Equals(batch.ActorId, ActorId, StringComparison.Ordinal)
            && string.Equals(batch.Dataset, Dataset.ToString(), StringComparison.Ordinal)
            && string.Equals(batch.SourceFileName, SourceFileName, StringComparison.Ordinal)
            && string.Equals(batch.Format, Format, StringComparison.Ordinal)
            && string.Equals(batch.MediaType, MediaType, StringComparison.Ordinal)
            && string.Equals(batch.ContentSha256, ContentSha256, StringComparison.Ordinal)
            && batch.ContentByteLength == ContentByteLength
            && batch.AcceptedRowCount == AcceptedRowCount
            && string.Equals(batch.IdempotencyKey, IdempotencyKey, StringComparison.Ordinal)
            && string.Equals(
                batch.ApiAdmissionContractId,
                ApiAdmissionContractId,
                StringComparison.Ordinal)
            && string.Equals(
                batch.CountyContextContractId,
                AuthenticatedCanonicalCountyContext.ContractId,
                StringComparison.Ordinal)
            && string.Equals(
                batch.CountyBoundIntakeContractId,
                CountyCsvCountyBoundIntake.ContractId,
                StringComparison.Ordinal)
            && string.Equals(
                batch.EnvelopeContractId,
                CountyCsvIntakeEnvelope.ContractId,
                StringComparison.Ordinal)
            && string.Equals(
                batch.ParserContractId,
                CountyCsvStreamParser.ContractId,
                StringComparison.Ordinal)
            && string.Equals(
                batch.IdempotencyContractId,
                CountyCsvIntakeIdempotency.ContractId,
                StringComparison.Ordinal)
            && string.Equals(
                batch.LedgerContractId,
                ICountyCsvUploadAdmissionLedger.ContractId,
                StringComparison.Ordinal)
            && string.Equals(
                batch.Status,
                CountyCsvUploadBatch.AdmittedStatus,
                StringComparison.Ordinal);
    }
}
