using Microsoft.Data.SqlClient;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// SQL Server <see cref="IDeepProfileReaderFactory"/>. Builds the connection
/// string via the locked B1.6.5 path (reuses
/// <see cref="SqlServerMetadataReaderFactory.BuildConnectionString"/>) so
/// SQL Auth passwords and AdditionalOptions handling — including the
/// forbidden-credential-key drop policy — stay consistent with the structural
/// metadata reader. There is no "second copy" of auth resolution; both
/// readers go through the same resolver.
/// </summary>
public sealed class SqlServerDeepProfileReaderFactory : IDeepProfileReaderFactory
{
    private readonly ISecretResolver _secretResolver;

    public SqlServerDeepProfileReaderFactory(ISecretResolver secretResolver)
    {
        ArgumentNullException.ThrowIfNull(secretResolver);
        _secretResolver = secretResolver;
    }

    public async Task<IDeepProfileReaderSession> OpenAsync(
        SyncSourceConnection connection,
        DeepProfileTimeoutBudget? timeoutBudget = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(connection);

        if (!string.Equals(connection.ConnectionType, "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException(
                $"SqlServerDeepProfileReaderFactory cannot handle ConnectionType '{connection.ConnectionType}'.");
        }

        // FIX-B2.7E: Plumb the per-command-class timeout budget into the
        // reader so MIN/MAX/sample materialization use the long
        // (Materialization/Aggregation) ceilings while metadata roundtrips
        // keep the short (Metadata) ceiling.
        var effectiveBudget = (timeoutBudget ?? DeepProfileTimeoutBudget.Default).Validate();

        var connectionString = SqlServerMetadataReaderFactory.BuildConnectionString(connection, _secretResolver);
        var sqlConnection = new SqlConnection(connectionString);
        try
        {
            await sqlConnection.OpenAsync(ct);
            var reader = new SqlServerDeepProfileReader(sqlConnection, effectiveBudget);
            return new SqlServerDeepProfileSession(sqlConnection, reader);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await sqlConnection.DisposeAsync();
            throw new InvalidOperationException(
                $"Failed to open SQL Server connection for deep profile to '{connection.Server}/{connection.Database}': {ex.Message}",
                ex);
        }
    }

    private sealed class SqlServerDeepProfileSession : IDeepProfileReaderSession
    {
        private readonly SqlConnection _connection;
        public IDeepProfileReader Reader { get; }

        public SqlServerDeepProfileSession(SqlConnection connection, IDeepProfileReader reader)
        {
            _connection = connection;
            Reader = reader;
        }

        public async ValueTask DisposeAsync()
        {
            await _connection.DisposeAsync();
        }
    }
}
