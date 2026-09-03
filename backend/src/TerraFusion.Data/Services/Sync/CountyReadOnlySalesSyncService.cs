using System.Data;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Counties;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.PACS;
using TerraFusion.Core.Sync;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Data.Services.Sync;

/// <summary>
/// Reads sales from one authenticated county's registered PACS connection and writes only to
/// TerraFusion. It never exposes an external write operation and fails closed on source ambiguity,
/// identity drift, invalid contract proof, malformed rows, or a development adapter.
/// </summary>
public sealed class CountyReadOnlySalesSyncService : ICountyReadOnlySalesSyncService
{
    private const int PageSize = 500;
    private const int MaximumSourceRows = 100_000;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IDbContextFactory<TerraFusionDbContext> _dbContextFactory;
    private readonly IPacsAdapter _pacsAdapter;
    private readonly TimeProvider _timeProvider;

    public CountyReadOnlySalesSyncService(
        IDbContextFactory<TerraFusionDbContext> dbContextFactory,
        IPacsAdapter pacsAdapter,
        TimeProvider? timeProvider = null)
    {
        _dbContextFactory = dbContextFactory ?? throw new ArgumentNullException(nameof(dbContextFactory));
        _pacsAdapter = pacsAdapter ?? throw new ArgumentNullException(nameof(pacsAdapter));
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<CountyReadOnlySalesSyncResult> SyncAsync(
        CountyReadOnlySalesSyncRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();
        if (!TryAuthority(request.CountyContext, out var countyId, out var actorId))
        {
            return Denied(CountyReadOnlySalesSyncDenialCode.InvalidAuthority);
        }

        await using var lookup = await _dbContextFactory.CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        var connections = await lookup.SyncSourceConnections.AsNoTracking()
            .Where(connection => connection.CountyId == countyId && connection.IsActive)
            .OrderBy(connection => connection.Id)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        if (connections.Count == 0)
        {
            return Denied(CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured);
        }
        if (connections.Count != 1)
        {
            return Denied(CountyReadOnlySalesSyncDenialCode.ConnectionAmbiguous);
        }

        var connection = connections[0];
        if (!IsReadOnlyPacsConnection(connection))
        {
            return Denied(CountyReadOnlySalesSyncDenialCode.ConnectionNotReadOnly);
        }
        if (_pacsAdapter is not IExternalReadOnlyPacsAdapter externalAdapter)
        {
            return Denied(CountyReadOnlySalesSyncDenialCode.ExternalAdapterRequired);
        }
        if (!externalAdapter.MatchesSource(connection.Server!, connection.Database!))
        {
            await RecordConnectionFailureAsync(
                connection.Id, "SOURCE_IDENTITY_MISMATCH", cancellationToken).ConfigureAwait(false);
            return Denied(CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch);
        }

        try
        {
            var status = await _pacsAdapter.GetConnectionStatusAsync(cancellationToken)
                .ConfigureAwait(false);
            if (!status.IsConnected
                || !string.Equals(status.DatabaseName, connection.Database, StringComparison.OrdinalIgnoreCase))
            {
                await RecordConnectionFailureAsync(
                    connection.Id, "SOURCE_IDENTITY_MISMATCH", cancellationToken).ConfigureAwait(false);
                return Denied(CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch);
            }

            var proof = await _pacsAdapter.ValidateContractAsync(cancellationToken)
                .ConfigureAwait(false);
            if (!proof.IsValid || !string.Equals(proof.ContractId, "pacscontract.v1", StringComparison.Ordinal))
            {
                await RecordConnectionFailureAsync(
                    connection.Id, "SOURCE_CONTRACT_INVALID", cancellationToken).ConfigureAwait(false);
                return Denied(CountyReadOnlySalesSyncDenialCode.SourceContractInvalid);
            }

            var sourceRows = await ReadAllSalesAsync(cancellationToken).ConfigureAwait(false);
            if (sourceRows is null)
            {
                await RecordConnectionFailureAsync(
                    connection.Id, "SOURCE_RECORD_LIMIT_EXCEEDED", cancellationToken).ConfigureAwait(false);
                return Denied(CountyReadOnlySalesSyncDenialCode.SourceRecordLimitExceeded);
            }
            if (!ValidateRows(sourceRows))
            {
                await RecordConnectionFailureAsync(
                    connection.Id, "SOURCE_DATA_INVALID", cancellationToken).ConfigureAwait(false);
                return Denied(CountyReadOnlySalesSyncDenialCode.SourceDataInvalid);
            }

            return await PersistAsync(
                connection,
                countyId,
                actorId,
                sourceRows,
                cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            await RecordConnectionFailureAsync(
                connection.Id, "READ_ONLY_SYNC_FAILED", CancellationToken.None).ConfigureAwait(false);
            return new(
                CountyReadOnlySalesSyncDisposition.Failed,
                CountyReadOnlySalesSyncDenialCode.None,
                null);
        }
    }

    public async Task<CountyReadOnlySalesSyncAvailability> GetAvailabilityAsync(
        AuthenticatedCanonicalCountyContextResult countyContext,
        CancellationToken cancellationToken = default)
    {
        if (!TryAuthority(countyContext, out var countyId, out _))
        {
            throw new InvalidOperationException("County read-only sync authority is invalid.");
        }

        return await GetAvailabilityForCountyAsync(countyId, cancellationToken).ConfigureAwait(false);
    }

    private async Task<CountyReadOnlySalesSyncAvailability> GetAvailabilityForCountyAsync(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        var connections = await db.SyncSourceConnections.AsNoTracking()
            .Where(connection => connection.CountyId == countyId && connection.IsActive)
            .OrderBy(connection => connection.Id)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        var connection = connections.Count == 1 ? connections[0] : null;
        var registrationConfigured = connection is not null && IsReadOnlyPacsConnection(connection);
        var sourceIdentityMatches = registrationConfigured
            && _pacsAdapter is IExternalReadOnlyPacsAdapter externalAdapter
            && externalAdapter.MatchesSource(connection!.Server!, connection.Database!);
        var configured = registrationConfigured && sourceIdentityMatches;
        var connectionPrefix = connection is null
            ? "county-readonly-sync:unavailable:"
            : $"county-readonly-sync:{connection.Id:D}:";
        var salesQuery = db.ComparableSales.AsNoTracking()
            .Where(sale => sale.CountyId == countyId
                && sale.IngestedBy == "county-readonly-sync"
                && sale.VerificationSource != null
                && sale.VerificationSource.StartsWith(connectionPrefix));
        var latestTimestamp = await salesQuery.MaxAsync(sale => (DateTime?)sale.SaleDate, cancellationToken)
            .ConfigureAwait(false);
        DateOnly? latest = latestTimestamp is null
            ? null
            : DateOnly.FromDateTime(latestTimestamp.Value);
        var studyYear = latest?.Year + 1;
        var count = 0;
        if (studyYear is not null)
        {
            var start = new DateTime(studyYear.Value - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = new DateTime(studyYear.Value, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            count = await salesQuery.CountAsync(
                sale => sale.SaleDate >= start && sale.SaleDate < end,
                cancellationToken).ConfigureAwait(false);
        }

        var lastSyncFailed = configured
            && connection!.LastConnectionErrorAtUtc is not null
            && (connection.LastSuccessfulConnectionAtUtc is null
                || connection.LastConnectionErrorAtUtc > connection.LastSuccessfulConnectionAtUtc);
        var status = connections.Count switch
        {
            0 => "not-configured",
            > 1 => "ambiguous-connections",
            _ when !registrationConfigured => "read-only-authority-invalid",
            _ when !sourceIdentityMatches => "source-identity-mismatch",
            _ when lastSyncFailed => "last-sync-failed",
            _ when count > 0 => "connected-sales-available",
            _ => "connected-no-sales",
        };
        return new(
            ICountyReadOnlySalesSyncService.ContractId,
            countyId,
            configured ? connection!.Id : null,
            configured,
            configured ? connection!.SourceSystem : null,
            configured ? connection!.LastSuccessfulConnectionAtUtc : null,
            count,
            latest?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            studyYear,
            status == "connected-sales-available",
            status);
    }

    private async Task<IReadOnlyList<PacsComparableSale>?> ReadAllSalesAsync(
        CancellationToken cancellationToken)
    {
        var rows = new List<PacsComparableSale>();
        for (var page = 1; ; page++)
        {
            var result = await _pacsAdapter.GetComparableSalesAsync(page, PageSize, cancellationToken)
                .ConfigureAwait(false);
            if (result.Page != page || result.PageSize is <= 0 or > PageSize || result.TotalCount < 0)
            {
                throw new InvalidDataException("The PACS sales page contract is invalid.");
            }
            if (result.Items.Count > result.PageSize || (result.HasMore && result.Items.Count == 0))
            {
                throw new InvalidDataException("The PACS sales page cannot make bounded progress.");
            }
            if (result.TotalCount > MaximumSourceRows || rows.Count + result.Items.Count > MaximumSourceRows)
            {
                return null;
            }
            rows.AddRange(result.Items);
            if (rows.Count > result.TotalCount)
            {
                throw new InvalidDataException("The PACS sales page exceeded its declared total.");
            }
            if (!result.HasMore)
            {
                if (rows.Count != result.TotalCount)
                {
                    throw new InvalidDataException("The PACS sales page total changed during the sync.");
                }
                break;
            }
        }
        return rows;
    }

    private async Task<CountyReadOnlySalesSyncResult> PersistAsync(
        SyncSourceConnection connection,
        Guid countyId,
        string actorId,
        IReadOnlyList<PacsComparableSale> sourceRows,
        CancellationToken cancellationToken)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var transaction = await db.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken).ConfigureAwait(false);
        var completedAt = _timeProvider.GetUtcNow();
        var candidates = sourceRows
            .GroupBy(row => DeterministicSaleId(connection.Id, row))
            .Select(group => new { Id = group.Key, Row = group.First() })
            .ToArray();
        var ids = candidates.Select(candidate => candidate.Id).ToArray();
        var existing = new Dictionary<Guid, ComparableSale>();
        foreach (var chunk in ids.Chunk(500))
        {
            var sales = await db.ComparableSales
                .Where(sale => chunk.Contains(sale.Id))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            foreach (var sale in sales) existing.Add(sale.Id, sale);
        }

        var added = 0;
        var updated = 0;
        foreach (var candidate in candidates)
        {
            if (!existing.TryGetValue(candidate.Id, out var sale))
            {
                sale = new ComparableSale { Id = candidate.Id, CountyId = countyId };
                db.ComparableSales.Add(sale);
                added++;
            }
            else if (sale.CountyId != countyId
                || !string.Equals(sale.IngestedBy, "county-readonly-sync", StringComparison.Ordinal))
            {
                throw new InvalidOperationException("A connected-source sale identity collided with foreign data.");
            }
            else
            {
                updated++;
            }
            Apply(sale, connection.Id, candidate.Row, completedAt.UtcDateTime);
        }

        var profile = await db.SyncSourceConnections.SingleAsync(
            candidate => candidate.Id == connection.Id && candidate.CountyId == countyId,
            cancellationToken).ConfigureAwait(false);
        profile.LastSuccessfulConnectionAtUtc = completedAt;
        profile.LastConnectionErrorAtUtc = null;
        profile.LastConnectionErrorMessage = null;
        profile.UpdatedAt = completedAt.UtcDateTime;
        profile.UpdatedBy = actorId;

        var receiptId = Guid.NewGuid();
        db.AuditEvents.Add(new AuditEvent
        {
            Id = $"county-readonly-sales-sync:{receiptId:N}",
            Type = AuditEventType.Create,
            Entity = "ValuationComparableSale",
            EntityId = connection.Id.ToString("D", CultureInfo.InvariantCulture),
            UserId = actorId,
            Action = "valuation.readonly-sales-synced",
            DetailsJson = JsonSerializer.Serialize(new
            {
                contractId = ICountyReadOnlySalesSyncService.ContractId,
                receiptId,
                connectionId = connection.Id,
                sourceSystem = connection.SourceSystem,
                sourceRows = sourceRows.Count,
                addedSales = added,
                updatedSales = updated,
                externalWrites = 0,
            }, JsonOptions),
            Timestamp = completedAt.UtcDateTime,
            CountyId = countyId,
        });
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

        var availability = await GetAvailabilityForCountyAsync(countyId, cancellationToken)
            .ConfigureAwait(false);
        return new(
            CountyReadOnlySalesSyncDisposition.Completed,
            CountyReadOnlySalesSyncDenialCode.None,
            new(
                ICountyReadOnlySalesSyncService.ContractId,
                receiptId,
                countyId,
                connection.Id,
                connection.SourceSystem,
                sourceRows.Count,
                added,
                updated,
                0,
                availability.AvailableSales,
                availability.LatestSaleDate,
                availability.RecommendedStudyYear,
                completedAt));
    }

    private async Task RecordConnectionFailureAsync(
        Guid connectionId,
        string code,
        CancellationToken cancellationToken)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);
        var connection = await db.SyncSourceConnections.SingleOrDefaultAsync(
            candidate => candidate.Id == connectionId,
            cancellationToken).ConfigureAwait(false);
        if (connection is null) return;
        var now = _timeProvider.GetUtcNow();
        connection.LastConnectionErrorAtUtc = now;
        connection.LastConnectionErrorMessage = code;
        connection.UpdatedAt = now.UtcDateTime;
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static bool IsReadOnlyPacsConnection(SyncSourceConnection connection) =>
        string.Equals(connection.SourceSystem, "PACS", StringComparison.OrdinalIgnoreCase)
        && string.Equals(connection.ConnectionType, "SqlServer", StringComparison.OrdinalIgnoreCase)
        && !string.IsNullOrWhiteSpace(connection.Server)
        && !string.IsNullOrWhiteSpace(connection.Database)
        && connection.AdditionalOptions?.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(option => string.Equals(
                option.Replace(" ", string.Empty, StringComparison.Ordinal),
                "ApplicationIntent=ReadOnly",
                StringComparison.OrdinalIgnoreCase)) == true;

    private static bool ValidateRows(IReadOnlyList<PacsComparableSale> rows)
    {
        var identities = new HashSet<string>(StringComparer.Ordinal);
        foreach (var row in rows)
        {
            if (row.PropId <= 0
                || string.IsNullOrWhiteSpace(row.GeoId)
                || row.GeoId.Length > 50
                || row.GeoId != row.GeoId.Trim()
                || row.GeoId.Any(char.IsControl)
                || row.SaleDate == default
                || row.SaleDate.Year is < 1800 or > 9998
                || row.SaleDate.Kind == DateTimeKind.Local
                || row.SalePrice <= 0
                || row.SalePrice > 10_000_000_000m
                || !identities.Add(SourceIdentity(row)))
            {
                return false;
            }
        }
        return true;
    }

    private static void Apply(
        ComparableSale sale,
        Guid connectionId,
        PacsComparableSale source,
        DateTime ingestedAt)
    {
        sale.ParcelId = source.GeoId;
        sale.SaleDate = DateTime.SpecifyKind(source.SaleDate.Date, DateTimeKind.Utc);
        sale.SalePrice = source.SalePrice;
        sale.PropertyType = Bounded(source.PropTypeCd, 30) ?? "unknown";
        sale.Address = Bounded(source.SitusAddr, 200);
        sale.Neighborhood = Bounded(source.Neighborhood, 50);
        sale.RawRatioTypeCd = Bounded(source.SaleRatioTypeCd, 10);
        sale.RawSaleTypeCode = Bounded(source.DeedTypeCd, 5);
        sale.RawComment = Bounded(source.Consideration, 500);
        sale.IsVerified = false;
        sale.VerificationSource = $"county-readonly-sync:{connectionId:D}:{source.PropId.ToString(CultureInfo.InvariantCulture)}";
        sale.IngestedBy = "county-readonly-sync";
        sale.IngestedAt = ingestedAt;
    }

    private static string? Bounded(string? value, int maximum)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var canonical = value.Trim();
        if (canonical.Any(char.IsControl)) return null;
        return canonical.Length <= maximum ? canonical : canonical[..maximum];
    }

    private static Guid DeterministicSaleId(Guid connectionId, PacsComparableSale row)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(string.Join(
            '|',
            ICountyReadOnlySalesSyncService.ContractId,
            connectionId.ToString("D", CultureInfo.InvariantCulture),
            SourceIdentity(row))));
        var bytes = hash[..16];
        bytes[7] = (byte)((bytes[7] & 0x0F) | 0x50);
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80);
        return new Guid(bytes);
    }

    private static string SourceIdentity(PacsComparableSale row) => string.Join(
        '|',
        row.PropId.ToString(CultureInfo.InvariantCulture),
        row.GeoId.ToUpperInvariant(),
        row.SaleDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));

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

    private static CountyReadOnlySalesSyncResult Denied(CountyReadOnlySalesSyncDenialCode code) =>
        new(CountyReadOnlySalesSyncDisposition.Denied, code, null);
}
