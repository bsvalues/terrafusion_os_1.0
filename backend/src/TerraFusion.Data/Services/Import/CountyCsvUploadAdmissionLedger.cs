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
public sealed class CountyCsvUploadAdmissionLedger : ICountyCsvUploadAdmissionLedger
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
                out var claimedDocumentSnapshot,
                out var denialCode))
        {
            return Denied(denialCode);
        }

        var contentRevalidation = await RevalidateAdmittedContentAsync(
                request!.AdmittedContent,
                request.IntakeReceipt!,
                claimedDocumentSnapshot,
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
        out CountyCsvDocument claimedDocumentSnapshot,
        out CountyCsvUploadAdmissionDenialCode denialCode)
    {
        evidence = null!;
        claimedDocumentSnapshot = null!;
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
        if (!TrySnapshotDocument(intakeReceipt.Document, out claimedDocumentSnapshot))
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
            || content.ByteLength != claimedDocumentSnapshot.InputBytes)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence;
            return false;
        }

        if (!HasValidDocumentEvidence(claimedDocumentSnapshot))
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence;
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
            claimedDocumentSnapshot.Rows.Count,
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
        CountyCsvDocument claimedDocumentSnapshot,
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
                claimedDocumentSnapshot)
            ? ContentRevalidationResult.Accepted(
                regeneratedReceipt.IntakeReceipt.Document.Rows.Count)
            : ContentRevalidationResult.Denied(
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence);
    }

    private static bool TrySnapshotDocument(
        CountyCsvDocument document,
        out CountyCsvDocument snapshot)
    {
        snapshot = null!;
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

            var headers = new string[headerCount];
            for (var index = 0; index < headers.Length; index++)
            {
                headers[index] = document.Headers[index];
            }

            var rows = new IReadOnlyList<string>[rowCount];
            for (var index = 0; index < rows.Length; index++)
            {
                var row = document.Rows[index];
                if (row is null
                    || row.Count < 0
                    || row.Count > MaximumFieldsPerRow
                    || row.Count != headerCount)
                {
                    return false;
                }

                var fields = new string[row.Count];
                for (var fieldIndex = 0; fieldIndex < fields.Length; fieldIndex++)
                {
                    fields[fieldIndex] = row[fieldIndex];
                }

                rows[index] = Array.AsReadOnly(fields);
            }

            snapshot = new CountyCsvDocument(
                Array.AsReadOnly(headers),
                Array.AsReadOnly(rows),
                document.InputBytes);
            return true;
        }
        catch (Exception exception) when (
            exception is ArgumentException
                or InvalidOperationException
                or IndexOutOfRangeException)
        {
            return false;
        }
    }

    private static bool DocumentsMatch(CountyCsvDocument regenerated, CountyCsvDocument claimed)
    {
        if (regenerated.InputBytes != claimed.InputBytes
            || !regenerated.Headers.SequenceEqual(claimed.Headers, StringComparer.Ordinal)
            || regenerated.Rows.Count != claimed.Rows.Count)
        {
            return false;
        }

        for (var index = 0; index < regenerated.Rows.Count; index++)
        {
            if (!regenerated.Rows[index].SequenceEqual(
                    claimed.Rows[index],
                    StringComparer.Ordinal))
            {
                return false;
            }
        }

        return true;
    }

    private static bool HasValidDocumentEvidence(CountyCsvDocument document)
    {
        if (document.Headers is null
            || document.Headers.Count is <= 0 or > MaximumFieldsPerRow
            || document.Rows is null
            || document.Rows.Count > MaximumDataRows)
        {
            return false;
        }

        var normalizedHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var header in document.Headers)
        {
            if (!IsValidParserFieldShape(header)
                || string.IsNullOrWhiteSpace(header)
                || !normalizedHeaders.Add(header.Trim()))
            {
                return false;
            }
        }

        foreach (var row in document.Rows)
        {
            if (row is null
                || row.Count != document.Headers.Count
                || row.Any(field => !IsValidParserFieldShape(field)))
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsValidParserFieldShape(string? value) =>
        value is not null
        && value.Length <= MaximumCharactersPerField
        && value.All(character =>
            (!char.IsControl(character) || character is '\t' or '\r' or '\n')
            && character is not '\uFEFF' and not '\uFFFE' and not '\uFFFF');

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
