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
        // We parse manually: SqlConnectionStringBuilder.Keys enumerates ALL known
        // keywords, not just keys present in the input string, so naively iterating
        // it would overwrite UserID / Password / IntegratedSecurity with their
        // default values and break the SqlAuth path. We split on ';' and only apply
        // keys that the operator explicitly set in AdditionalOptions.
        //
        // Defense in depth: even if AdditionalOptions accidentally contains a
        // credential keyword, we silently drop it. Credentials are doctrine-bound
        // to the resolver path; AdditionalOptions is for benign tuning only.
        if (!string.IsNullOrWhiteSpace(connection.AdditionalOptions))
        {
            ApplyAdditionalOptions(builder, connection.AdditionalOptions);
        }

        return builder.ConnectionString;
    }

    private static readonly HashSet<string> ForbiddenAdditionalOptionKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "User ID", "UserID", "User Id", "uid",
        "Password", "pwd",
        "Integrated Security", "IntegratedSecurity",
        "Trusted_Connection"
    };

    private static void ApplyAdditionalOptions(SqlConnectionStringBuilder builder, string additionalOptions)
    {
        foreach (var raw in additionalOptions.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var sep = raw.IndexOf('=');
            if (sep <= 0) continue;

            var key = raw[..sep].Trim();
            var value = raw[(sep + 1)..].Trim();

            if (string.IsNullOrEmpty(key)) continue;
            if (ForbiddenAdditionalOptionKeys.Contains(key)) continue;

            try
            {
                builder[key] = value;
            }
            catch (ArgumentException)
            {
                // Unknown / malformed keyword — silently skip; the operator will see
                // the resulting connection string and can fix the AdditionalOptions value.
            }
        }
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
