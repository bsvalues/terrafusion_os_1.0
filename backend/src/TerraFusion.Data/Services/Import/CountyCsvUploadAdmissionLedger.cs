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

        if (!TryValidate(request, out var evidence, out var denialCode))
        {
            return Denied(denialCode);
        }

        await using var dbContext = await _dbContextFactory
            .CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        var existing = await FindByIdempotencyKeyAsync(
                dbContext,
                evidence.IdempotencyKey,
                cancellationToken)
            .ConfigureAwait(false);
        if (existing is not null)
        {
            return ResolveExisting(existing, evidence);
        }

        await using var transaction = await dbContext.Database
            .BeginTransactionAsync(cancellationToken)
            .ConfigureAwait(false);

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
            var winner = await FindByIdempotencyKeyAsync(
                    winnerContext,
                    evidence.IdempotencyKey,
                    CancellationToken.None)
                .ConfigureAwait(false);
            if (winner is not null)
            {
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

    private static bool TryValidate(
        CountyCsvUploadAdmissionRequest? request,
        out AdmissionEvidence evidence,
        out CountyCsvUploadAdmissionDenialCode denialCode)
    {
        evidence = null!;
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
            || content.ByteLength != intakeReceipt.Document.InputBytes)
        {
            denialCode = CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence;
            return false;
        }

        var document = intakeReceipt.Document;
        if (!HasValidDocumentEvidence(document))
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
            document.Rows.Count,
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
