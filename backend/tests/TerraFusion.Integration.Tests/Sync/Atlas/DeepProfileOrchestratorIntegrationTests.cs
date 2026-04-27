using FluentAssertions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using TerraFusion.Integration.Tests.Sync.Fixtures;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Atlas;

/// <summary>
/// End-to-end integration test for <see cref="DeepProfileOrchestrator"/>
/// (Slice B2.6). Source side: live SQL Server via the
/// <see cref="SqlServerFixture"/>; destination side: in-memory EF
/// <see cref="TerraFusionDbContext"/> (same convention as the unit tests
/// for the orchestrator and the persistence service).
///
/// Proves the full chain works against a real SQL engine:
///   reader → ProfileTableAsync (TABLESAMPLE / temp table / aggregation
///   / sample / top-N) → DeepProfilePersistenceService.PersistAsync →
///   B2.1 stats rows materialize for the operator-supplied SyncBatch.
///
/// Skip in environments without Docker:
///   <c>dotnet test --filter "Category!=DockerRequired"</c>
/// </summary>
[Collection(nameof(SqlServerFixtureCollection))]
[Trait("Category", "DockerRequired")]
public class DeepProfileOrchestratorIntegrationTests
{
    private const string Schema = "dbo";
    private const string Table  = "ParcelDeepProfileFixture";

    private readonly SqlServerFixture _fixture;

    public DeepProfileOrchestratorIntegrationTests(SqlServerFixture fixture)
    {
        _fixture = fixture;
    }

    private static TerraFusionDbContext CreateTerraFusionContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    private static async System.Threading.Tasks.Task<(County county, SyncSourceConnection conn, SyncBatch batch)>
        SeedScopeAsync(TerraFusionDbContext db, string sourceConnectionString)
    {
        var county = new County
        {
            Id       = Guid.NewGuid(),
            Name     = "Benton",
            State    = "WA",
            FipsCode = "53005",
        };
        db.Counties.Add(county);

        // The factory will rebuild the connection string from these fields,
        // so we have to splice the live container's host/port back into a
        // SyncSourceConnection that BuildConnectionString understands. The
        // Docker fixture publishes via SqlConnectionStringBuilder so we can
        // round-trip cleanly.
        var b = new SqlConnectionStringBuilder(sourceConnectionString);

        var conn = new SyncSourceConnection
        {
            Id              = Guid.NewGuid(),
            CountyId        = county.Id,
            Name            = "DeepProfileFixture",
            SourceSystem    = "PACS",
            ConnectionType  = "SqlServer",
            Server          = b.DataSource,
            Database        = b.InitialCatalog,
            // Mirror the fixture's connection-string credentials. The fixture
            // uses SQL Auth (azure-sql-edge doesn't ship Windows Integrated).
            // The B1.6.5 secret resolver looks up the password by env-var
            // name SYNCATLAS_SECRET_<connection-id-no-dashes-uppercase>; we
            // set that env var below before calling Open.
            AuthMode        = "SqlAuth",
            Username        = b.UserID,
            // AdditionalOptions carries the TrustServerCertificate flag that
            // the fixture's connection string sets — the secret-resolver
            // path is doctrine-bound to NEVER read or store passwords here.
            AdditionalOptions = "TrustServerCertificate=True;Encrypt=False",
            IsActive        = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId       = county.Id,
            SourceSystem   = "PACS",
            Mode           = "profile",
            Status         = "completed",
            StartedAtUtc   = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount      = 0,
        };
        db.SyncBatches.Add(batch);
        await db.SaveChangesAsync();

        // Set the env-var the resolver reads — clean up after the test.
        var secretName = SyncAtlasSecretNames.ForSqlAuthPassword(conn.Id);
        Environment.SetEnvironmentVariable(secretName, b.Password);

        return (county, conn, batch);
    }

    /// <summary>
    /// Seeds the structural rows that DeepProfileOrchestrator expects to
    /// already be in place from a successful B1 pass. Mirrors the actual
    /// shape AtlasProfiler would write for the fixture table.
    /// </summary>
    private static async System.Threading.Tasks.Task SeedStructuralAtlasAsync(
        TerraFusionDbContext db, Guid countyId, Guid batchId)
    {
        db.SyncProfileTables.Add(new SyncProfileTable
        {
            CountyId         = countyId,
            SyncBatchId      = batchId,
            SourceSystem     = "PACS",
            SchemaName       = Schema,
            TableName        = Table,
            IsView           = false,
            RowCountEstimate = 100,
            ColumnCount      = 7,
        });

        var columns = new (string Name, int Ordinal, string Type, bool Nullable)[]
        {
            ("ParcelId",         1, "int",       false),
            ("ParcelNumber",     2, "nvarchar",  false),
            ("PropertyClass",    3, "nvarchar",  false),
            ("NeighborhoodCode", 4, "nvarchar",  true),
            ("LandValue",        5, "decimal",   false),
            ("ImprovementValue", 6, "decimal",   true),
            ("CreatedUtc",       7, "datetime2", false),
        };
        foreach (var col in columns)
        {
            db.SyncProfileColumns.Add(new SyncProfileColumn
            {
                CountyId        = countyId,
                SyncBatchId     = batchId,
                SourceSystem    = "PACS",
                SchemaName      = Schema,
                TableName       = Table,
                ColumnName      = col.Name,
                OrdinalPosition = col.Ordinal,
                DataType        = col.Type,
                IsNullable      = col.Nullable,
            });
        }
        await db.SaveChangesAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_LiveSqlServer_PersistsTableStatsAndColumnStats()
    {
        await using var db = CreateTerraFusionContext($"deep-orch-int-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db, _fixture.ConnectionString);
        try
        {
            await SeedStructuralAtlasAsync(db, county.Id, batch.Id);

            var orchestrator = new DeepProfileOrchestrator(
                db,
                new SqlServerDeepProfileReaderFactory(new EnvironmentSecretResolver()),
                new DeepProfilePersistenceService(db));

            var result = await orchestrator.RunAsync(
                batch.Id, county.Id, conn.Id, "integration-test", CancellationToken.None);

            // The orchestrator hits the one fixture table; views are skipped
            // by design.
            result.TablesAttempted.Should().Be(1);
            result.TablesProfiled.Should().Be(1);
            result.TablesFailed.Should().Be(0);
            result.TablesSkipped.Should().Be(0);
            result.Failures.Should().BeEmpty();

            // SyncProfileTableStats: one row, RowCount = 100, Full plan.
            var tableStats = await db.SyncProfileTableStats.SingleAsync();
            tableStats.SchemaName.Should().Be(Schema);
            tableStats.TableName.Should().Be(Table);
            tableStats.RowCount.Should().Be(100L);
            tableStats.RowCountIsExact.Should().BeTrue();
            tableStats.SamplingMethod.Should().Be("Full");

            // SyncProfileColumnStats: one row per ColumnRef (7 columns).
            var columnStats = await db.SyncProfileColumnStats.ToListAsync();
            columnStats.Should().HaveCount(7);

            // Sanity-pin the live computation against fixture math:
            //   ParcelNumber → 100 distinct, no nulls.
            //   PropertyClass → 4 distinct.
            //   NeighborhoodCode → 25 nulls.
            //   ImprovementValue → 33 nulls.
            //   LandValue Min/Max → 75_000 / 500_000.
            var byCol = columnStats.ToDictionary(c => c.ColumnName);
            byCol["ParcelNumber"].DistinctCount.Should().Be(100);
            byCol["ParcelNumber"].NullCount.Should().Be(0);
            byCol["PropertyClass"].DistinctCount.Should().Be(4);
            byCol["NeighborhoodCode"].NullCount.Should().Be(25);
            byCol["ImprovementValue"].NullCount.Should().Be(33);

            decimal.Parse(byCol["LandValue"].MinValue!).Should().Be(75000m);
            decimal.Parse(byCol["LandValue"].MaxValue!).Should().Be(500000m);
        }
        finally
        {
            Environment.SetEnvironmentVariable(
                SyncAtlasSecretNames.ForSqlAuthPassword(conn.Id), null);
        }
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_LiveSqlServer_DetectsCodeCandidate()
    {
        await using var db = CreateTerraFusionContext($"deep-orch-int-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db, _fixture.ConnectionString);
        try
        {
            await SeedStructuralAtlasAsync(db, county.Id, batch.Id);

            var orchestrator = new DeepProfileOrchestrator(
                db,
                new SqlServerDeepProfileReaderFactory(new EnvironmentSecretResolver()),
                new DeepProfilePersistenceService(db));

            await orchestrator.RunAsync(
                batch.Id, county.Id, conn.Id, "integration-test", CancellationToken.None);

            // PropertyClass: 4 distinct / 100 rows = 4% < 5% threshold + nvarchar
            // → qualifies as code candidate. ParcelNumber: 100 / 100 → does NOT.
            var candidates = await db.SyncProfileCodeCandidates.ToListAsync();
            candidates.Should().ContainSingle(c => c.ColumnName == "PropertyClass");

            var propertyClass = candidates.Single(c => c.ColumnName == "PropertyClass");
            propertyClass.DistinctCount.Should().Be(4);
            propertyClass.SampleSize.Should().Be(100);
            propertyClass.DistinctRatio.Should().Be(0.04m);
            propertyClass.Reason.Should().Be("low_cardinality_string");
            propertyClass.CandidateCodesJson.Should().NotBeNullOrEmpty();
            propertyClass.CandidateCodesJson.Should().Contain("RES");
            propertyClass.CandidateCodesJson.Should().Contain("COM");
            propertyClass.CandidateCodesJson.Should().Contain("AGR");
            propertyClass.CandidateCodesJson.Should().Contain("MFG");

            candidates.Should().NotContain(c => c.ColumnName == "ParcelNumber");
        }
        finally
        {
            Environment.SetEnvironmentVariable(
                SyncAtlasSecretNames.ForSqlAuthPassword(conn.Id), null);
        }
    }
}
