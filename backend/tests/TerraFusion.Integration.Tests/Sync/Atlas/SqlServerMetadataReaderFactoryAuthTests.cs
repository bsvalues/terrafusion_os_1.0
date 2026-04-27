using FluentAssertions;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Atlas;

/// <summary>
/// Tests for <see cref="SqlServerMetadataReaderFactory.BuildConnectionString"/>
/// covering the B1.6.5 SQL Auth secret-resolver path. Verifies:
///   - SqlAuth resolves password from <see cref="ISecretResolver"/>, not from the entity.
///   - Missing secret env var fails with a clear, name-bearing message.
///   - Windows Integrated path is unchanged (no resolver lookup).
///   - Username is required for SqlAuth.
///   - Unknown AuthMode is rejected.
/// </summary>
public class SqlServerMetadataReaderFactoryAuthTests
{
    [Fact]
    public void BuildConnectionString_UsesEnvironmentSecret_ForSqlAuth()
    {
        var connectionId = Guid.NewGuid();
        var secretName = SyncAtlasSecretNames.ForSqlAuthPassword(connectionId);
        Environment.SetEnvironmentVariable(secretName, "resolved-password");
        try
        {
            var connection = new SyncSourceConnection
            {
                Id = connectionId,
                CountyId = Guid.NewGuid(),
                Name = "Benton PACS Training",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "localhost,1433",
                Database = "PACS_Training",
                AuthMode = "SqlAuth",
                Username = "sa"
            };

            var connectionString = SqlServerMetadataReaderFactory.BuildConnectionString(
                connection,
                new EnvironmentSecretResolver());

            connectionString.Should().Contain("User ID=sa");
            connectionString.Should().Contain("Password=resolved-password");
            connectionString.Should().NotContain("Integrated Security=True");
        }
        finally
        {
            Environment.SetEnvironmentVariable(secretName, null);
        }
    }

    [Fact]
    public void BuildConnectionString_Throws_WhenSqlAuthSecretMissing()
    {
        var connection = new SyncSourceConnection
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.NewGuid(),
            Name = "Test connection",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "localhost,1433",
            Database = "PACS_Training",
            AuthMode = "SqlAuth",
            Username = "sa"
        };

        Action act = () => SqlServerMetadataReaderFactory.BuildConnectionString(
            connection,
            new EnvironmentSecretResolver());

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SYNCATLAS_SECRET_*");
    }

    [Fact]
    public void BuildConnectionString_Throws_WhenSqlAuthMissingUsername()
    {
        var connectionId = Guid.NewGuid();
        var secretName = SyncAtlasSecretNames.ForSqlAuthPassword(connectionId);
        Environment.SetEnvironmentVariable(secretName, "anything");
        try
        {
            var connection = new SyncSourceConnection
            {
                Id = connectionId,
                CountyId = Guid.NewGuid(),
                Name = "Missing username",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "localhost,1433",
                Database = "PACS_Training",
                AuthMode = "SqlAuth",
                Username = null
            };

            Action act = () => SqlServerMetadataReaderFactory.BuildConnectionString(
                connection,
                new EnvironmentSecretResolver());

            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*Username*");
        }
        finally
        {
            Environment.SetEnvironmentVariable(secretName, null);
        }
    }

    [Fact]
    public void BuildConnectionString_PreservesWindowsIntegratedMode()
    {
        var connection = new SyncSourceConnection
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.NewGuid(),
            Name = "Win Auth conn",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "jcharrispacs",
            Database = "pacs_training",
            AuthMode = "WindowsIntegrated"
        };

        var connectionString = SqlServerMetadataReaderFactory.BuildConnectionString(
            connection,
            new ThrowingSecretResolver());  // resolver MUST NOT be called

        connectionString.Should().Contain("Integrated Security=True");
        connectionString.Should().NotContain("Password=");
    }

    [Fact]
    public void BuildConnectionString_DefaultsToWindowsIntegrated_WhenAuthModeIsNull()
    {
        var connection = new SyncSourceConnection
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.NewGuid(),
            Name = "Defaulted",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "jcharrispacs",
            Database = "pacs_training",
            AuthMode = null!  // exercise the null-fallback branch
        };

        var connectionString = SqlServerMetadataReaderFactory.BuildConnectionString(
            connection,
            new ThrowingSecretResolver());

        connectionString.Should().Contain("Integrated Security=True");
    }

    [Fact]
    public void BuildConnectionString_Throws_OnUnknownAuthMode()
    {
        var connection = new SyncSourceConnection
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.NewGuid(),
            Name = "Unknown auth",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "host",
            Database = "db",
            AuthMode = "TelepathicHandshake"
        };

        Action act = () => SqlServerMetadataReaderFactory.BuildConnectionString(
            connection,
            new EnvironmentSecretResolver());

        act.Should().Throw<NotSupportedException>()
            .WithMessage("*TelepathicHandshake*");
    }

    [Fact]
    public void BuildConnectionString_PasswordIsResolved_NotReadFromEntity()
    {
        // Confirms structurally that no password lives on SyncSourceConnection. If a
        // future change adds a password property, this test (paired with the
        // HasNoPasswordColumn test in SyncSourceConnectionSchemaTests) calls it out.
        var properties = typeof(SyncSourceConnection)
            .GetProperties(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public)
            .Select(p => p.Name)
            .ToList();

        properties.Should().NotContain("Password");
        properties.Should().NotContain("PasswordHash");
        properties.Should().NotContain("Secret");
    }

    [Fact]
    public void BuildConnectionString_AdditionalOptions_DoNotClobberSqlAuthCredentials()
    {
        // Regression: SqlConnectionStringBuilder.Keys enumerates ALL supported keywords
        // (including unset ones), so a naive overlay loop would reset UserID/Password
        // to defaults. Verify the manual parser preserves credentials.
        var connectionId = Guid.NewGuid();
        var secretName = SyncAtlasSecretNames.ForSqlAuthPassword(connectionId);
        Environment.SetEnvironmentVariable(secretName, "preserved-password");
        try
        {
            var connection = new SyncSourceConnection
            {
                Id = connectionId,
                CountyId = Guid.NewGuid(),
                Name = "With AdditionalOptions",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "localhost,1433",
                Database = "PACS_Training",
                AuthMode = "SqlAuth",
                Username = "sa",
                AdditionalOptions = "TrustServerCertificate=True;Encrypt=False"
            };

            var connectionString = SqlServerMetadataReaderFactory.BuildConnectionString(
                connection,
                new EnvironmentSecretResolver());

            connectionString.Should().Contain("User ID=sa");
            connectionString.Should().Contain("Password=preserved-password");
            connectionString.Should().Contain("Trust Server Certificate=True");
        }
        finally
        {
            Environment.SetEnvironmentVariable(secretName, null);
        }
    }

    [Fact]
    public void BuildConnectionString_AdditionalOptions_StripsForbiddenCredentialKeys()
    {
        // Defense in depth: even if AdditionalOptions accidentally contains "Password=..."
        // or "User ID=...", they must be silently dropped — credentials are doctrine-bound
        // to the ISecretResolver path.
        var connectionId = Guid.NewGuid();
        var secretName = SyncAtlasSecretNames.ForSqlAuthPassword(connectionId);
        Environment.SetEnvironmentVariable(secretName, "real-password");
        try
        {
            var connection = new SyncSourceConnection
            {
                Id = connectionId,
                CountyId = Guid.NewGuid(),
                Name = "AdditionalOptions with sneaky creds",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "localhost,1433",
                Database = "PACS_Training",
                AuthMode = "SqlAuth",
                Username = "sa",
                AdditionalOptions = "Password=leaked-via-options;User ID=evil-user;TrustServerCertificate=True"
            };

            var connectionString = SqlServerMetadataReaderFactory.BuildConnectionString(
                connection,
                new EnvironmentSecretResolver());

            connectionString.Should().Contain("User ID=sa");
            connectionString.Should().Contain("Password=real-password");
            connectionString.Should().NotContain("evil-user");
            connectionString.Should().NotContain("leaked-via-options");
            connectionString.Should().Contain("Trust Server Certificate=True");
        }
        finally
        {
            Environment.SetEnvironmentVariable(secretName, null);
        }
    }

    /// <summary>Test double: throws if invoked. Used to verify Win-auth path skips resolver.</summary>
    private sealed class ThrowingSecretResolver : ISecretResolver
    {
        public string ResolveRequired(string secretName)
            => throw new InvalidOperationException(
                "Secret resolver was invoked for a non-SqlAuth connection — should never happen.");
    }
}
