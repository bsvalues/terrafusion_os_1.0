using Microsoft.Data.SqlClient;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// SQL Server implementation of <see cref="IMetadataReaderFactory"/>.
///
/// Connection-string construction respects the locked B1.0 auth posture:
///   - <c>AuthMode = "WindowsIntegrated"</c> (default): adds Integrated Security=True
///   - <c>AuthMode = "SqlAuth"</c>: includes the Username, but the password is
///     resolved from external secret storage at this point (NOT from the entity).
///     Until external secret resolution is wired (post-MVP), SqlAuth throws.
/// </summary>
public sealed class SqlServerMetadataReaderFactory : IMetadataReaderFactory
{
    public async Task<IMetadataReaderSession> OpenAsync(SyncSourceConnection connection, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(connection);

        if (!string.Equals(connection.ConnectionType, "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException(
                $"SqlServerMetadataReaderFactory cannot handle ConnectionType '{connection.ConnectionType}'.");
        }

        var connectionString = BuildConnectionString(connection);
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

    /// <summary>Builds a SQL Server connection string from a stored profile.</summary>
    /// <remarks>Internal-visible for unit tests.</remarks>
    internal static string BuildConnectionString(SyncSourceConnection connection)
    {
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
                throw new NotSupportedException(
                    "SqlAuth requires external secret resolution which is not wired in MVP. "
                    + "Use AuthMode='WindowsIntegrated'.");
            default:
                throw new NotSupportedException($"Unknown AuthMode '{connection.AuthMode}'.");
        }

        // Apply additional connection-string options (e.g., TrustServerCertificate=True).
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
