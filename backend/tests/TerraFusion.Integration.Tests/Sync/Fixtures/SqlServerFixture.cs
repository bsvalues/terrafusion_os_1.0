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

        // ── B2.6 deep-profile fixture ────────────────────────────────────
        //
        // Slice B2.6 spec: prove SqlServerDeepProfileReader against a live
        // SQL Server. The slice card lists 4 specific seed rows for column-
        // level stat assertions (ParcelNumber distinct, NullCount,
        // Min/Max LandValue, etc.) AND requires PropertyClass to qualify as
        // a code-table candidate.
        //
        // Those two requirements are inconsistent with the locked 5%
        // distinct-ratio threshold (B2.0): 3 distinct PropertyClass values
        // over 4 rows is 75%, which the heuristic correctly rejects. The
        // slice card explicitly forbids weakening the threshold.
        //
        // Resolution: keep the card's 4 illustrative rows present
        // (so reader assertions about RowCount-vs-distinct relationships
        // stay grounded), and add 96 additional rows that extend the same
        // value vocabularies. Net effect:
        //   - 100 rows total, all unique ParcelNumber → high-cardinality,
        //     correctly NOT a code candidate.
        //   - 4 distinct PropertyClass values (RES / COM / AGR / MFG) →
        //     ratio 4/100 = 4% < 5% → correctly DOES qualify as candidate.
        //   - NeighborhoodCode has 25 NULLs (every 4th row).
        //   - ImprovementValue has 33 NULLs.
        //   - LandValue spans 75_000 (the card's minimum AGR row) to
        //     500_000 (the card's COM row).
        await SeedDeepProfileFixtureAsync(conn);
    }

    private async Task SeedDeepProfileFixtureAsync(SqlConnection conn)
    {
        await ExecAsync(conn, @"
CREATE TABLE dbo.ParcelDeepProfileFixture (
    ParcelId         INT IDENTITY(1,1) NOT NULL,
    ParcelNumber     NVARCHAR(64) NOT NULL,
    PropertyClass    NVARCHAR(16) NOT NULL,
    NeighborhoodCode NVARCHAR(16) NULL,
    LandValue        DECIMAL(18,2) NOT NULL,
    ImprovementValue DECIMAL(18,2) NULL,
    CreatedUtc       DATETIME2 NOT NULL,
    CONSTRAINT PK_ParcelDeepProfileFixture PRIMARY KEY (ParcelId),
    CONSTRAINT CK_ParcelDeepProfileFixture_LandValue CHECK (LandValue >= 0)
);");

        // The 4 card-specified illustrative rows go in first. They establish
        // the LandValue Min (75000 from AGR row) and Max (500000 from COM
        // row) and the NULL'd NeighborhoodCode + NULL'd ImprovementValue
        // baseline that downstream assertions pin against.
        await ExecAsync(conn, @"
INSERT INTO dbo.ParcelDeepProfileFixture
    (ParcelNumber, PropertyClass, NeighborhoodCode, LandValue, ImprovementValue, CreatedUtc)
VALUES
    ('P-1001', 'RES', 'N01', 100000.00, 250000.00, '2026-01-01T00:00:00'),
    ('P-1002', 'RES', 'N01', 110000.00, NULL,      '2026-01-02T00:00:00'),
    ('P-1003', 'COM', 'N02', 500000.00, 900000.00, '2026-01-03T00:00:00'),
    ('P-1004', 'AGR', NULL,  75000.00,  50000.00,  '2026-01-04T00:00:00');");

        // Generate 96 more deterministic rows. Distribution is fixed (no
        // random seed) so the test assertions are reproducible byte-for-byte
        // across runs:
        //   - PropertyClass cycles through {RES, COM, AGR, MFG} → exactly
        //     24 of each among the 96, plus the card's 2-RES + 1-COM + 1-AGR
        //     in the first batch → final counts: RES=26, COM=25, AGR=25,
        //     MFG=24, distinct = 4.
        //   - Every 4th row gets NULL NeighborhoodCode → 24 NULLs in fill +
        //     1 NULL in card seed (P-1004) = 25 NULL NeighborhoodCode total.
        //   - Every 3rd row gets NULL ImprovementValue → 32 NULLs in fill +
        //     1 NULL in card seed (P-1002) = 33 NULL ImprovementValue total.
        //   - LandValue stays inside [75_000, 500_000] (card-specified
        //     extrema) — fill rows use 200_000 so they don't shift Min/Max.
        var sb = new System.Text.StringBuilder(@"
INSERT INTO dbo.ParcelDeepProfileFixture
    (ParcelNumber, PropertyClass, NeighborhoodCode, LandValue, ImprovementValue, CreatedUtc)
VALUES
");
        var classes = new[] { "RES", "COM", "AGR", "MFG" };
        for (var i = 0; i < 96; i++)
        {
            var parcelNumber  = $"P-2{i:D3}";  // P-2000..P-2095, all unique
            var propertyClass = classes[i % 4];
            var neighborhood  = (i % 4 == 0) ? "NULL" : $"N'N{(i % 9) + 1:D2}'";
            var landValue     = "200000.00";
            var improvementValue = (i % 3 == 0) ? "NULL" : "150000.00";
            var createdUtc    = $"2026-02-{(i % 28) + 1:D2}T00:00:00";

            if (i > 0) sb.Append(",\n");
            sb.Append("    ('").Append(parcelNumber).Append("', N'").Append(propertyClass).Append("', ")
              .Append(neighborhood).Append(", ").Append(landValue).Append(", ")
              .Append(improvementValue).Append(", '").Append(createdUtc).Append("')");
        }
        sb.Append(";");
        await ExecAsync(conn, sb.ToString());
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
