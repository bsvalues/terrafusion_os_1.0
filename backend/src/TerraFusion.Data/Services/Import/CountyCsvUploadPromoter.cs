using System.Data;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TerraFusion.Core.Counties;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Import;
using TerraFusion.Core.Import;

namespace TerraFusion.Data.Services.Import;

/// <summary>
/// Promotes only validated Sales staging rows into TerraForge comparable-sale truth. Every query
/// and write is bound to the authenticated county; the immutable promotion receipt makes retries
/// converge without duplicating sales.
/// </summary>
public sealed class CountyCsvUploadPromoter : ICountyCsvUploadPromoter
{
    private const int MaximumSerializationAttempts = 3;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IDbContextFactory<TerraFusionDbContext> _dbContextFactory;
    private readonly TimeProvider _timeProvider;

    public CountyCsvUploadPromoter(
        IDbContextFactory<TerraFusionDbContext> dbContextFactory,
        TimeProvider? timeProvider = null)
    {
        _dbContextFactory = dbContextFactory ?? throw new ArgumentNullException(nameof(dbContextFactory));
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<CountyCsvUploadPromotionResult> PromoteAsync(
        CountyCsvUploadPromotionRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();
        if (!TryAuthority(request.CountyContext, out var countyId, out var actorId)
            || request.BatchId == Guid.Empty)
        {
            return Denied(CountyCsvUploadPromotionDenialCode.InvalidAuthority);
        }

        for (var attempt = 1; attempt <= MaximumSerializationAttempts; attempt++)
        {
            try
            {
                return await PromoteAttemptAsync(
                    request.BatchId,
                    countyId,
                    actorId,
                    cancellationToken).ConfigureAwait(false);
            }
            catch (Exception exception) when (
                attempt < MaximumSerializationAttempts
                && (IsTransientStoreFailure(exception)
                    || exception is CrossBatchPromotionContentionException))
            {
                cancellationToken.ThrowIfCancellationRequested();
            }
        }

        throw new InvalidOperationException("County CSV promotion retry control reached an invalid state.");
    }

    public async Task<CountyCsvUploadPromotionAvailability> GetAvailabilityAsync(
        AuthenticatedCanonicalCountyContextResult countyContext,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!TryAuthority(countyContext, out var countyId, out _))
        {
            throw new InvalidOperationException("County CSV promotion availability authority is invalid.");
        }

        await using var dbContext = await _dbContextFactory
            .CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        var promotedSalesQuery = dbContext.ComparableSales
            .AsNoTracking()
            .Where(sale => sale.CountyId == countyId
                && sale.IngestedBy == "county-upload"
                && sale.VerificationSource != null
                && sale.VerificationSource.StartsWith("county-upload:"));
        var latestSaleTimestamp = await promotedSalesQuery
            .MaxAsync(sale => (DateTime?)sale.SaleDate, cancellationToken)
            .ConfigureAwait(false);
        if (latestSaleTimestamp is null)
        {
            return new(countyId, ICountyCsvUploadPromoter.ContractId, 0, null, null, false);
        }

        var latestSaleDate = DateOnly.FromDateTime(latestSaleTimestamp.Value);
        var recommendedStudyYear = latestSaleDate.Year + 1;
        var lookbackStart = new DateTime(
            recommendedStudyYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd = new DateTime(
            recommendedStudyYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var promotedSales = await promotedSalesQuery
            .CountAsync(
                sale => sale.SaleDate >= lookbackStart && sale.SaleDate < lookbackEnd,
                cancellationToken)
            .ConfigureAwait(false);
        return new(
            countyId,
            ICountyCsvUploadPromoter.ContractId,
            promotedSales,
            latestSaleDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            recommendedStudyYear,
            promotedSales > 0);
    }

    private async Task<CountyCsvUploadPromotionResult> PromoteAttemptAsync(
        Guid batchId,
        Guid countyId,
        string actorId,
        CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory
            .CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        await using var transaction = await dbContext.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
            .ConfigureAwait(false);
        try
        {
            var existing = await FindPromotionAsync(dbContext, batchId, countyId, cancellationToken)
                .ConfigureAwait(false);
            if (existing is not null)
            {
                await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
                return Accepted(CountyCsvUploadPromotionDisposition.Duplicate, existing);
            }

            var batch = await dbContext.CountyCsvUploadBatches
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    candidate => candidate.BatchId == batchId && candidate.CountyId == countyId,
                    cancellationToken).ConfigureAwait(false);
            if (batch is null)
            {
                await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
                return Denied(CountyCsvUploadPromotionDenialCode.BatchNotFound);
            }
            if (!string.Equals(batch.Dataset, nameof(CountyCsvDataset.Sales), StringComparison.Ordinal))
            {
                await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
                return Denied(CountyCsvUploadPromotionDenialCode.UnsupportedDataset);
            }

            var stage = await dbContext.CountyCsvUploadRowStages
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    candidate => candidate.BatchId == batchId && candidate.CountyId == countyId,
                    cancellationToken).ConfigureAwait(false);
            if (stage is null)
            {
                await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
                return Denied(CountyCsvUploadPromotionDenialCode.StagingNotFound);
            }

            var stagedRows = DeserializeRows(stage, batch);
            if (stagedRows is null)
            {
                await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
                return Denied(CountyCsvUploadPromotionDenialCode.InvalidStaging);
            }
            if (stagedRows.Length == 0)
            {
                await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
                return Denied(CountyCsvUploadPromotionDenialCode.NoPromotableRows);
            }

            var promotedAtUtc = _timeProvider.GetUtcNow();
            var candidates = stagedRows
                .Select(row => new PromotionCandidate(
                    row,
                    CreateComparableSale(batch, row, promotedAtUtc.UtcDateTime)))
                .GroupBy(candidate => candidate.Sale.Id)
                .Select(group => group.First())
                .ToArray();
            var existingSales = await LoadExistingSalesAsync(
                dbContext,
                candidates.Select(candidate => candidate.Sale.Id),
                cancellationToken).ConfigureAwait(false);
            foreach (var candidate in candidates.Where(candidate => existingSales.ContainsKey(candidate.Sale.Id)))
            {
                if (!SameSaleIdentity(candidate.Sale, existingSales[candidate.Sale.Id]))
                {
                    throw new InvalidOperationException(
                        "A stable county Sales identity collided with a different comparable sale.");
                }
            }
            var additions = candidates
                .Where(candidate => !existingSales.ContainsKey(candidate.Sale.Id))
                .ToArray();
            var sales = additions.Select(candidate => candidate.Sale).ToArray();
            var traceCandidates = additions
                .Select(candidate => CreatePromotionTrace(batch, candidate, actorId, promotedAtUtc))
                .ToArray();
            var existingTraces = await LoadExistingTracesAsync(
                dbContext,
                traceCandidates.Select(trace => trace.Id),
                cancellationToken).ConfigureAwait(false);
            foreach (var trace in traceCandidates.Where(trace => existingTraces.ContainsKey(trace.Id)))
            {
                if (!SamePromotionTraceIdentity(trace, existingTraces[trace.Id]))
                {
                    throw new InvalidOperationException(
                        "A stable county Sales promotion trace identity collided with a different event.");
                }
            }
            var tracesToAppend = traceCandidates
                .Select(trace => existingTraces.ContainsKey(trace.Id)
                    ? CreateReapplicationTrace(trace, actorId, promotedAtUtc)
                    : trace)
                .ToArray();
            var latestSaleDate = stagedRows
                .Select(row => row.SaleDate!)
                .OrderByDescending(value => value, StringComparer.Ordinal)
                .First();
            var promotion = new CountyCsvUploadPromotion(
                batchId,
                countyId,
                actorId,
                ICountyCsvUploadPromoter.ContractId,
                sales.Length,
                JsonSerializer.Serialize(sales.Select(sale => sale.Id).ToArray(), JsonOptions),
                latestSaleDate,
                promotedAtUtc);

            dbContext.ComparableSales.AddRange(sales);
            dbContext.CountyCsvUploadPromotions.Add(promotion);
            dbContext.AuditEvents.AddRange(tracesToAppend);
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
            return Accepted(CountyCsvUploadPromotionDisposition.Promoted, promotion);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            await using var winnerContext = await _dbContextFactory
                .CreateDbContextAsync(CancellationToken.None).ConfigureAwait(false);
            var winner = await FindPromotionAsync(
                winnerContext, batchId, countyId, CancellationToken.None).ConfigureAwait(false);
            if (winner is not null)
            {
                return Accepted(CountyCsvUploadPromotionDisposition.Duplicate, winner);
            }
            throw new CrossBatchPromotionContentionException(exception);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    private static CountyCsvStagedRow[]? DeserializeRows(
        CountyCsvUploadRowStage stage,
        CountyCsvUploadBatch batch)
    {
        if (!string.Equals(stage.ContractId, TerraFusion.Core.Interfaces.ICountyCsvUploadRowStager.ContractId, StringComparison.Ordinal)
            || !string.Equals(stage.SchemaVersion, CountyCsvUploadRowValidator.SchemaVersion, StringComparison.Ordinal)
            || !string.Equals(stage.Dataset, nameof(CountyCsvDataset.Sales), StringComparison.Ordinal)
            || stage.CountyId != batch.CountyId
            || !string.Equals(stage.ContentSha256, batch.ContentSha256, StringComparison.Ordinal)
            || stage.TotalRowCount != batch.AcceptedRowCount)
        {
            return null;
        }

        CountyCsvStagedRow[]? rows;
        try
        {
            rows = JsonSerializer.Deserialize<CountyCsvStagedRow[]>(stage.StagedRowsJson, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
        if (rows is null || rows.Length != stage.StagedRowCount)
        {
            return null;
        }
        var sourceRows = new HashSet<int>();
        foreach (var row in rows)
        {
            if (row.SourceRowNumber < 2
                || !sourceRows.Add(row.SourceRowNumber)
                || row.SourceRowNumber > stage.TotalRowCount + 1
                || string.IsNullOrWhiteSpace(row.ParcelId)
                || row.ParcelId.Length > 50
                || row.SitusAddress is not null
                || row.SalePrice is null or <= 0
                || row.SaleDate is null
                || !DateOnly.TryParseExact(
                    row.SaleDate,
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out _))
            {
                return null;
            }
        }
        return rows;
    }

    private static ComparableSale CreateComparableSale(
        CountyCsvUploadBatch batch,
        CountyCsvStagedRow row,
        DateTime ingestedAtUtc)
    {
        var saleDate = DateOnly.ParseExact(row.SaleDate!, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        return new ComparableSale
        {
            Id = DeterministicSaleId(batch.CountyId, row),
            CountyId = batch.CountyId,
            ParcelId = row.ParcelId,
            SaleDate = DateTime.SpecifyKind(saleDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc),
            SalePrice = row.SalePrice!.Value,
            PropertyType = "unknown",
            // A source sale date is not a DOR ratio-study assignment. Keep the assignment unknown
            // so Sales Review applies its bounded two-year study window.
            SalesYear = null,
            IsVerified = false,
            VerificationSource = $"county-upload:{batch.BatchId:D}:{row.SourceRowNumber}",
            IngestedBy = "county-upload",
            IngestedAt = ingestedAtUtc,
        };
    }

    private static Guid DeterministicSaleId(Guid countyId, CountyCsvStagedRow row)
    {
        var stableIdentity = string.Join(
            '|',
            ICountyCsvUploadPromoter.ContractId,
            countyId.ToString("D", CultureInfo.InvariantCulture),
            NormalizeParcelIdentity(row.ParcelId!),
            row.SaleDate,
            row.SalePrice!.Value.ToString("G29", CultureInfo.InvariantCulture));
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(
            stableIdentity));
        var guidBytes = bytes[..16];
        guidBytes[7] = (byte)((guidBytes[7] & 0x0F) | 0x50);
        guidBytes[8] = (byte)((guidBytes[8] & 0x3F) | 0x80);
        return new Guid(guidBytes);
    }

    private static async Task<Dictionary<Guid, ComparableSale>> LoadExistingSalesAsync(
        TerraFusionDbContext dbContext,
        IEnumerable<Guid> candidateIds,
        CancellationToken cancellationToken)
    {
        var existing = new Dictionary<Guid, ComparableSale>();
        foreach (var chunk in candidateIds.Distinct().Chunk(500))
        {
            var rows = await dbContext.ComparableSales
                .AsNoTracking()
                .Where(sale => chunk.Contains(sale.Id))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            foreach (var row in rows)
            {
                existing.Add(row.Id, row);
            }
        }
        return existing;
    }

    private static async Task<Dictionary<string, AuditEvent>> LoadExistingTracesAsync(
        TerraFusionDbContext dbContext,
        IEnumerable<string> candidateIds,
        CancellationToken cancellationToken)
    {
        var existing = new Dictionary<string, AuditEvent>(StringComparer.Ordinal);
        foreach (var chunk in candidateIds.Distinct(StringComparer.Ordinal).Chunk(500))
        {
            var rows = await dbContext.AuditEvents
                .AsNoTracking()
                .Where(trace => chunk.Contains(trace.Id))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            foreach (var row in rows)
            {
                existing.Add(row.Id, row);
            }
        }
        return existing;
    }

    private static AuditEvent CreatePromotionTrace(
        CountyCsvUploadBatch batch,
        PromotionCandidate candidate,
        string actorId,
        DateTimeOffset promotedAtUtc) => new()
    {
        Id = $"county-upload-promotion:{batch.BatchId:D}:{candidate.Row.SourceRowNumber}",
        Type = AuditEventType.Create,
        // AuditTrailMapper derives the canonical category from Entity and exposes
        // EntityId as ParcelId. Keep the exact sale ID in immutable details.
        Entity = "ValuationComparableSale",
        EntityId = candidate.Row.ParcelId!,
        UserId = actorId,
        Action = "valuation.sales-promoted",
        DetailsJson = JsonSerializer.Serialize(new
        {
            category = "valuation",
            contractId = ICountyCsvUploadPromoter.ContractId,
            batchId = batch.BatchId,
            sourceRowNumber = candidate.Row.SourceRowNumber,
            comparableSaleId = candidate.Sale.Id,
        }, JsonOptions),
        Timestamp = promotedAtUtc.UtcDateTime,
        CountyId = batch.CountyId,
    };

    private static string NormalizeParcelIdentity(string parcelId) => parcelId.ToUpperInvariant();

    private static AuditEvent CreateReapplicationTrace(
        AuditEvent original,
        string actorId,
        DateTimeOffset promotedAtUtc) => new()
    {
        Id = $"{original.Id}:reapply:{promotedAtUtc.UtcDateTime.Ticks.ToString(CultureInfo.InvariantCulture)}",
        Type = AuditEventType.Create,
        Entity = original.Entity,
        EntityId = original.EntityId,
        UserId = actorId,
        Action = original.Action,
        DetailsJson = JsonSerializer.Serialize(new
        {
            category = "valuation",
            contractId = ICountyCsvUploadPromoter.ContractId,
            reappliesTraceId = original.Id,
        }, JsonOptions),
        Timestamp = promotedAtUtc.UtcDateTime,
        CountyId = original.CountyId,
    };

    private static bool SameSaleIdentity(ComparableSale candidate, ComparableSale existing) =>
        candidate.CountyId == existing.CountyId
        && string.Equals(
            NormalizeParcelIdentity(candidate.ParcelId),
            NormalizeParcelIdentity(existing.ParcelId),
            StringComparison.Ordinal)
        && candidate.SaleDate == existing.SaleDate
        && candidate.SalePrice == existing.SalePrice;

    private static bool SamePromotionTraceIdentity(AuditEvent candidate, AuditEvent existing) =>
        candidate.CountyId == existing.CountyId
        && candidate.Type == existing.Type
        && string.Equals(candidate.Entity, existing.Entity, StringComparison.Ordinal)
        && string.Equals(candidate.EntityId, existing.EntityId, StringComparison.Ordinal)
        && string.Equals(candidate.Action, existing.Action, StringComparison.Ordinal)
        && string.Equals(candidate.DetailsJson, existing.DetailsJson, StringComparison.Ordinal);

    private static bool TryAuthority(
        AuthenticatedCanonicalCountyContextResult? context,
        out Guid countyId,
        out string actorId)
    {
        countyId = Guid.Empty;
        actorId = string.Empty;
        if (context is null
            || context.Decision != AuthenticatedCanonicalCountyContextDecision.Established
            || context.CountyId is null
            || context.CountyId == Guid.Empty
            || context.County is null
            || string.IsNullOrWhiteSpace(context.ActorId)
            || WashingtonCountyRegistry.Counties.All(county => county != context.County))
        {
            return false;
        }
        countyId = context.CountyId.Value;
        actorId = context.ActorId;
        return true;
    }

    private static Task<CountyCsvUploadPromotion?> FindPromotionAsync(
        TerraFusionDbContext dbContext,
        Guid batchId,
        Guid countyId,
        CancellationToken cancellationToken) =>
        dbContext.CountyCsvUploadPromotions.AsNoTracking().SingleOrDefaultAsync(
            promotion => promotion.BatchId == batchId && promotion.CountyId == countyId,
            cancellationToken);

    private static CountyCsvUploadPromotionResult Accepted(
        CountyCsvUploadPromotionDisposition disposition,
        CountyCsvUploadPromotion promotion) =>
        new(disposition, CountyCsvUploadPromotionDenialCode.None, Summary(promotion));

    private static CountyCsvUploadPromotionResult Denied(
        CountyCsvUploadPromotionDenialCode code) =>
        new(CountyCsvUploadPromotionDisposition.Denied, code, null);

    internal static CountyCsvUploadPromotionSummary Summary(CountyCsvUploadPromotion promotion) =>
        new(
            promotion.BatchId,
            promotion.CountyId,
            promotion.ContractId,
            promotion.PromotedRowCount,
            promotion.LatestSaleDate,
            promotion.PromotedAtUtc);

    private static bool IsTransientStoreFailure(Exception exception)
    {
        var postgres = FindPostgresException(exception);
        if (postgres?.SqlState == PostgresErrorCodes.SerializationFailure) return true;
        var sqlite = FindSqliteException(exception);
        return sqlite?.SqliteErrorCode is 5 or 6;
    }

    private static bool IsUniqueViolation(Exception exception)
    {
        var postgres = FindPostgresException(exception);
        if (postgres?.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return true;
        }
        return FindSqliteException(exception)?.SqliteExtendedErrorCode is 1555 or 2067;
    }

    private static PostgresException? FindPostgresException(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is PostgresException postgres) return postgres;
        }
        return null;
    }

    private static SqliteException? FindSqliteException(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqliteException sqlite) return sqlite;
        }
        return null;
    }

    private sealed record PromotionCandidate(CountyCsvStagedRow Row, ComparableSale Sale);

    private sealed class CrossBatchPromotionContentionException : Exception
    {
        public CrossBatchPromotionContentionException(Exception innerException)
            : base("A concurrent county Sales batch won the stable sale identity.", innerException)
        {
        }
    }
}
