using Microsoft.Data.SqlClient;
using Testcontainers.MsSql;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Fixtures;

/// <summary>
/// xUnit collection fixture: spins up SQL Server 2022 in Docker, creates a dedicated
/// test database, and seeds a minimal schema (tables, views, procs, UDFs, triggers,
/// constraints) for <see cref="SqlServerMetadataReaderIntegrationTests"/>.
///
/// Tests using this fixture require Docker. Tag them with
/// <c>[Trait("Category", "DockerRequired")]</c> so CI without Docker can filter them out:
///   <c>dotnet test --filter "Category!=DockerRequired"</c>
///
/// Container startup is ~30s on first run; subsequent runs reuse the cached image.
/// </summary>
public sealed class SqlServerFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _container;

    public SqlServerFixture()
    {
        // azure-sql-edge starts in ~5-10s vs mcr.microsoft.com/mssql/server:2022-latest
        // which routinely takes 60+ seconds and sometimes never reaches readiness on
        // resource-constrained hosts. Same SQL engine surface, same sys.* catalog views,
        // suitable for metadata-reader testing.
        _container = new MsSqlBuilder()
            .WithImage("mcr.microsoft.com/azure-sql-edge:latest")
            .WithPassword("Test_Password_123!")
            .Build();
    }

    public string ConnectionString { get; private set; } = string.Empty;
    public const string TestDatabaseName = "sync_atlas_test";

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        var masterConnStr = _container.GetConnectionString();

        // Create dedicated test database (master is fine for connection but cluttered
        // with system objects — using our own DB keeps profile output predictable).
        // SQL Edge can take 30-90s before DDL is responsive even after the readiness
        // probe succeeds (the engine accepts SELECT 1 but internal init may still be
        // running). Bumping the command timeout avoids racing those internals.
        await using (var masterConn = new SqlConnection(masterConnStr))
        {
            await masterConn.OpenAsync();
            await using var cmd = masterConn.CreateCommand();
            cmd.CommandTimeout = 180;  // seconds
            cmd.CommandText = $"CREATE DATABASE [{TestDatabaseName}];";
            await cmd.ExecuteNonQueryAsync();
        }

        var builder = new SqlConnectionStringBuilder(masterConnStr)
        {
            InitialCatalog = TestDatabaseName
        };
        ConnectionString = builder.ConnectionString;

        await SeedSchemaAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    /// <summary>
    /// Open a fresh connection to the test database. Caller owns disposal.
    /// </summary>
    public async Task<SqlConnection> OpenConnectionAsync(CancellationToken ct = default)
    {
        var conn = new SqlConnection(ConnectionString);
        await conn.OpenAsync(ct);
        return conn;
    }

    private async Task SeedSchemaAsync()
    {
        await using var conn = new SqlConnection(ConnectionString);
        await conn.OpenAsync();

        // Each batch must be a separate ExecuteNonQuery (CREATE PROC/VIEW/TRIGGER/FN
        // must each be the only statement in their batch).
        await ExecAsync(conn, @"
CREATE TABLE dbo.test_property (
    prop_id INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_test_property PRIMARY KEY,
    geo_id VARCHAR(50) NULL,
    address NVARCHAR(500) NOT NULL CONSTRAINT DF_test_property_address DEFAULT 'unknown'
);");

        await ExecAsync(conn, @"
CREATE TABLE dbo.test_assessment (
    assessment_id INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_test_assessment PRIMARY KEY,
    prop_id INT NOT NULL,
    market_value DECIMAL(14,2) NULL,
    CONSTRAINT FK_test_assessment_property FOREIGN KEY (prop_id)
        REFERENCES dbo.test_property(prop_id),
    CONSTRAINT CK_test_assessment_value_nonnegative CHECK (market_value >= 0)
);");

        await ExecAsync(conn, @"
CREATE VIEW dbo.vw_test_active_properties AS
    SELECT prop_id, geo_id, address FROM dbo.test_property;");

        await ExecAsync(conn, @"
CREATE PROCEDURE dbo.usp_test_get_property
    @PropId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT prop_id, geo_id, address FROM dbo.test_property WHERE prop_id = @PropId;
END;");

        await ExecAsync(conn, @"
CREATE FUNCTION dbo.fn_test_normalize(@input NVARCHAR(500))
RETURNS NVARCHAR(500)
AS
BEGIN
    RETURN UPPER(LTRIM(RTRIM(ISNULL(@input, ''))));
END;");

        await ExecAsync(conn, @"
CREATE TRIGGER dbo.trg_test_property_audit
    ON dbo.test_property
    AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- no-op fixture trigger
END;");

        // Seed a few rows so RowCountEstimate is non-zero (system updates stats lazily,
        // so the count may still be NULL in some runs — tests should be lenient).
        await ExecAsync(conn, @"
INSERT INTO dbo.test_property (geo_id, address) VALUES
    ('GEO-1', '101 Main St'),
    ('GEO-2', '202 Oak Ave'),
    ('GEO-3', '303 Pine Rd');");
    }

    private static async Task ExecAsync(SqlConnection conn, string sql)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandTimeout = 180;  // seconds — generous for SQL Edge first-startup latency
        cmd.CommandText = sql;
        await cmd.ExecuteNonQueryAsync();
    }
}

[CollectionDefinition(nameof(SqlServerFixtureCollection))]
public sealed class SqlServerFixtureCollection : ICollectionFixture<SqlServerFixture>
{
    // Marker only.
}
