using System;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Abstractions.Interfaces.Workbench;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;

namespace TerraFusion.Sync.Workbench.Readiness;

/// <summary>
/// Slice OPS-1-A-2: SqlConnection-based implementation of
/// <see cref="IPacsReachabilityProbeService"/>. Opens a SqlConnection
/// using the existing <see cref="SqlServerMetadataReaderFactory"/>
/// connection-string builder + <see cref="EnvironmentSecretResolver"/>
/// pipeline, awaits the open, then closes.
///
/// <para>Sanitization contract: the result NEVER carries the
/// underlying exception's message (which could embed the connection
/// string and resolved password). Only an <c>ErrorCategory</c> is
/// surfaced.</para>
/// </summary>
public sealed class PacsReachabilityProbeService : IPacsReachabilityProbeService
{
    private readonly TerraFusionDbContext _db;
    private readonly ISecretResolver _secretResolver;

    public PacsReachabilityProbeService(
        TerraFusionDbContext db,
        ISecretResolver secretResolver)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(secretResolver);
        _db = db;
        _secretResolver = secretResolver;
    }

    public async Task<PacsReachabilityProbeResult> ProbeAsync(
        Guid countyId,
        Guid sourceConnectionId,
        CancellationToken ct)
    {
        var connection = await _db.SyncSourceConnections
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.Id == sourceConnectionId && c.CountyId == countyId,
                ct)
            .ConfigureAwait(false);

        if (connection is null)
        {
            return new PacsReachabilityProbeResult(
                Reachable: false,
                ServerLabel: string.Empty,
                DatabaseLabel: string.Empty,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: "Other");
        }

        var serverLabel = connection.Server ?? string.Empty;
        var databaseLabel = connection.Database ?? string.Empty;

        if (!string.Equals(connection.ConnectionType, "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            return new PacsReachabilityProbeResult(
                Reachable: false,
                ServerLabel: serverLabel,
                DatabaseLabel: databaseLabel,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: "Other");
        }

        string connectionString;
        try
        {
            connectionString = SqlServerMetadataReaderFactory
                .BuildConnectionString(connection, _secretResolver);
        }
        catch (Exception)
        {
            return new PacsReachabilityProbeResult(
                Reachable: false,
                ServerLabel: serverLabel,
                DatabaseLabel: databaseLabel,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: "AuthFailed");
        }

        try
        {
            await using var sql = new SqlConnection(connectionString);
            await sql.OpenAsync(ct).ConfigureAwait(false);
            // Connection succeeded; no SQL executed beyond the open.
            return new PacsReachabilityProbeResult(
                Reachable: true,
                ServerLabel: serverLabel,
                DatabaseLabel: databaseLabel,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: null);
        }
        catch (SqlException ex) when (ex.Number == -2) // timeout
        {
            return new PacsReachabilityProbeResult(
                Reachable: false,
                ServerLabel: serverLabel,
                DatabaseLabel: databaseLabel,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: "Timeout");
        }
        catch (SqlException ex) when (ex.Number == 18456 || ex.Number == 18452)
        {
            // 18456 = login failed; 18452 = login from untrusted domain.
            return new PacsReachabilityProbeResult(
                Reachable: false,
                ServerLabel: serverLabel,
                DatabaseLabel: databaseLabel,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: "AuthFailed");
        }
        catch (SqlException)
        {
            return new PacsReachabilityProbeResult(
                Reachable: false,
                ServerLabel: serverLabel,
                DatabaseLabel: databaseLabel,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: "ConnectionRefused");
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return new PacsReachabilityProbeResult(
                Reachable: false,
                ServerLabel: serverLabel,
                DatabaseLabel: databaseLabel,
                ProbedAtUtc: DateTime.UtcNow,
                ErrorCategory: "Other");
        }
    }
}
