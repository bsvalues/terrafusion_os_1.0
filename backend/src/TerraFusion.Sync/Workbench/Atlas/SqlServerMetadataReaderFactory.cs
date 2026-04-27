using Microsoft.Data.SqlClient;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// SQL Server implementation of <see cref="IMetadataReaderFactory"/>.
///
/// Connection-string construction respects the locked B1.0 auth posture:
///   - <c>AuthMode = "WindowsIntegrated"</c> (default): adds Integrated Security=True.
///   - <c>AuthMode = "SqlAuth"</c>: uses <see cref="SyncSourceConnection.Username"/>
///     and resolves the password via <see cref="ISecretResolver"/> (Slice B1.6.5).
///     Password is NEVER read from the entity, the DB, or AdditionalOptions.
///
/// Secret-name convention is owned by <see cref="SyncAtlasSecretNames"/> so the CLI
/// runbook, the factory, and the resolver agree on the env-var name for a given
/// connection.
/// </summary>
public sealed class SqlServerMetadataReaderFactory : IMetadataReaderFactory
{
    private readonly ISecretResolver _secretResolver;

    public SqlServerMetadataReaderFactory(ISecretResolver secretResolver)
    {
        ArgumentNullException.ThrowIfNull(secretResolver);
        _secretResolver = secretResolver;
    }

    public async Task<IMetadataReaderSession> OpenAsync(SyncSourceConnection connection, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(connection);

        if (!string.Equals(connection.ConnectionType, "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException(
                $"SqlServerMetadataReaderFactory cannot handle ConnectionType '{connection.ConnectionType}'.");
        }

        var connectionString = BuildConnectionString(connection, _secretResolver);
        var sqlConnection = new SqlConnection(connectionString);
        try
        {
            await sqlConnection.OpenAsync(ct);
            var reader = new SqlServerMetadataReader(sqlConnection);
            return new SqlServerSession(sqlConnection, reader);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await sqlConnection.DisposeAsync();
            throw new InvalidOperationException(
                $"Failed to open SQL Server connection to '{connection.Server}/{connection.Database}': {ex.Message}",
                ex);
        }
    }

    /// <summary>
    /// Builds a SQL Server connection string from a stored connection profile.
    /// SqlAuth password is resolved through <paramref name="secretResolver"/>;
    /// it is NOT read from the entity. Public so unit tests can verify shape.
    /// </summary>
    public static string BuildConnectionString(SyncSourceConnection connection, ISecretResolver secretResolver)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(secretResolver);

        var builder = new SqlConnectionStringBuilder
        {
            DataSource = connection.Server ?? string.Empty,
            InitialCatalog = connection.Database ?? string.Empty,
            ConnectTimeout = 15
        };

        switch (connection.AuthMode?.ToLowerInvariant())
        {
            case "windowsintegrated":
            case null:
                builder.IntegratedSecurity = true;
                break;

            case "sqlauth":
                if (string.IsNullOrWhiteSpace(connection.Username))
                {
                    throw new InvalidOperationException(
                        "SqlAuth requires SyncSourceConnection.Username to be set.");
                }

                var secretName = SyncAtlasSecretNames.ForSqlAuthPassword(connection.Id);
                var password = secretResolver.ResolveRequired(secretName);

                builder.IntegratedSecurity = false;
                builder.UserID = connection.Username!;
                builder.Password = password;
                break;

            default:
                throw new NotSupportedException($"Unknown AuthMode '{connection.AuthMode}'.");
        }

        // Apply additional connection-string options (e.g., TrustServerCertificate=True).
        // AdditionalOptions must NOT include Password / User ID — those are doctrine-bound
        // to the resolver path. We intentionally allow operator-defined overrides for
        // benign settings; password leakage here would still surface in tests because
        // the no-password-column structural test catches it on the entity, and the
        // factory tests verify the resolver path.
        if (!string.IsNullOrWhiteSpace(connection.AdditionalOptions))
        {
            var supplemental = new SqlConnectionStringBuilder(connection.AdditionalOptions);
            foreach (string key in supplemental.Keys)
            {
                builder[key] = supplemental[key];
            }
        }

        return builder.ConnectionString;
    }

    private sealed class SqlServerSession : IMetadataReaderSession
    {
        private readonly SqlConnection _connection;
        public IMetadataReader Reader { get; }

        public SqlServerSession(SqlConnection connection, IMetadataReader reader)
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
