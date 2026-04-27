using System.Text.Json;
using FluentAssertions;
using Microsoft.Data.SqlClient;
using TerraFusion.Integration.Tests.Sync.Fixtures;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Atlas;

/// <summary>
/// Integration tests for <see cref="SqlServerDeepProfileReader"/> against a
/// live SQL Server in Docker (Slice B2.6). Mirrors the B1.6 pattern:
/// <c>SqlServerFixture</c> spins up azure-sql-edge, seeds the
/// <c>dbo.ParcelDeepProfileFixture</c> table, and these tests run the reader
/// against it end-to-end.
///
/// Skip in environments without Docker:
///   <c>dotnet test --filter "Category!=DockerRequired"</c>
///
/// Filter to just this slice's Docker tests:
///   <c>dotnet test --filter "Category=DockerRequired&amp;FullyQualifiedName~DeepProfile"</c>
///
/// The fixture seeds 100 rows total: the 4 illustrative rows from the slice
/// card (P-1001..P-1004) plus 96 deterministic fill rows that round out the
/// distinct-value vocabulary so the locked 5% code-candidate threshold is
/// actually testable. See the fixture's `SeedDeepProfileFixtureAsync` for
/// the distribution math.
/// </summary>
[Collection(nameof(SqlServerFixtureCollection))]
[Trait("Category", "DockerRequired")]
public class SqlServerDeepProfileReaderIntegrationTests
{
    private const string Schema = "dbo";
    private const string Table  = "ParcelDeepProfileFixture";

    private readonly SqlServerFixture _fixture;

    public SqlServerDeepProfileReaderIntegrationTests(SqlServerFixture fixture)
    {
        _fixture = fixture;
    }

    /// <summary>The full ColumnRef list for ParcelDeepProfileFixture in ordinal order.</summary>
    private static IReadOnlyList<ColumnRef> AllColumns() => new[]
    {
        new ColumnRef("ParcelId",         "int",      IsNullable: false),
        new ColumnRef("ParcelNumber",     "nvarchar", IsNullable: false),
        new ColumnRef("PropertyClass",    "nvarchar", IsNullable: false),
        new ColumnRef("NeighborhoodCode", "nvarchar", IsNullable: true),
        new ColumnRef("LandValue",        "decimal",  IsNullable: false),
        new ColumnRef("ImprovementValue", "decimal",  IsNullable: true),
        new ColumnRef("CreatedUtc",       "datetime2", IsNullable: false),
    };

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_ProducesTableStatsForFullPlan()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        // 100 rows is well below the FullThresholdRowCount (100_000), so the
        // reader chooses the Full sampling plan and returns an exact count.
        result.Table.SchemaName.Should().Be(Schema);
        result.Table.TableName.Should().Be(Table);
        result.Table.RowCount.Should().Be(100L);
        result.Table.RowCountIsExact.Should().BeTrue();
        result.Table.SampleRowCount.Should().Be(100);
        result.Table.SamplingMethod.Should().Be("Full");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_HighCardinalityColumn_DistinctMatchesRowCount()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        var parcelNumber = result.Columns.Single(c => c.ColumnName == "ParcelNumber");
        parcelNumber.NullCount.Should().Be(0);
        parcelNumber.NullPct.Should().Be(0m);
        parcelNumber.DistinctCount.Should().Be(100);
        parcelNumber.DistinctCountIsExact.Should().BeTrue();
        parcelNumber.ParentRowCount.Should().Be(100);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_LowCardinalityColumn_DistinctReflectsValueSet()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        // PropertyClass vocabulary is {RES, COM, AGR, MFG} — 4 distinct values.
        var propertyClass = result.Columns.Single(c => c.ColumnName == "PropertyClass");
        propertyClass.NullCount.Should().Be(0);
        propertyClass.DistinctCount.Should().Be(4);
        propertyClass.DistinctCountIsExact.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_NullableColumns_ReportNullCounts()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        // NeighborhoodCode: 1 NULL in card rows + 24 NULLs in fill rows
        // (every 4th of the 96 fill rows) = 25 NULLs total.
        var neighborhood = result.Columns.Single(c => c.ColumnName == "NeighborhoodCode");
        neighborhood.NullCount.Should().Be(25);
        neighborhood.NullPct.Should().Be(25.0m);

        // ImprovementValue: 1 NULL in card rows + 32 NULLs in fill rows
        // (every 3rd of the 96 fill rows) = 33 NULLs total.
        var improvement = result.Columns.Single(c => c.ColumnName == "ImprovementValue");
        improvement.NullCount.Should().Be(33);
        improvement.NullPct.Should().Be(33.0m);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_NumericColumn_ReturnsMinAndMax()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        // LandValue range: 75000 (card AGR row) → 500000 (card COM row).
        // Fill rows all use 200000 so they don't shift the extrema.
        var landValue = result.Columns.Single(c => c.ColumnName == "LandValue");
        landValue.MinValue.Should().NotBeNull();
        landValue.MaxValue.Should().NotBeNull();
        decimal.Parse(landValue.MinValue!).Should().Be(75000m);
        decimal.Parse(landValue.MaxValue!).Should().Be(500000m);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_LowCardinalityColumn_BecomesCodeCandidate()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        // PropertyClass: 4 distinct over 100 rows = 4% < 5% threshold + nvarchar
        // type → qualifies.
        var candidate = result.CodeCandidates
            .SingleOrDefault(c => c.ColumnName == "PropertyClass");
        candidate.Should().NotBeNull();
        candidate!.DistinctCount.Should().Be(4);
        candidate.SampleSize.Should().Be(100);
        candidate.DistinctRatio.Should().Be(0.04m);
        candidate.Reason.Should().Be("low_cardinality_string");

        // CandidateCodesJson surfaces the top-N frequency from a real
        // GROUP BY over the materialized sample. Should include all 4
        // class codes; total counts must sum to 100 (no NULLs in
        // PropertyClass) and the leader-board order is
        // RES (26) → COM (25) ≈ AGR (25) → MFG (24).
        candidate.CandidateCodesJson.Should().NotBeNull();
        var top = JsonDocument.Parse(candidate.CandidateCodesJson!);
        var values = new HashSet<string>();
        var totalCount = 0;
        foreach (var entry in top.RootElement.EnumerateArray())
        {
            values.Add(entry.GetProperty("Value").GetString()!);
            totalCount += entry.GetProperty("Count").GetInt32();
        }
        values.Should().BeEquivalentTo(new[] { "RES", "COM", "AGR", "MFG" });
        totalCount.Should().Be(100);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_HighCardinalityColumn_DoesNotBecomeCodeCandidate()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        // ParcelNumber: 100 distinct over 100 rows = 100% > 5% AND > 100-cap.
        // Heuristic correctly rejects.
        result.CodeCandidates
            .Should().NotContain(c => c.ColumnName == "ParcelNumber");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_AllColumns_ProduceColumnStatsRows()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var result = await sut.ProfileTableAsync(Schema, Table, AllColumns());

        // Reader returns one ColumnStatsRecord per supplied ColumnRef.
        result.Columns.Should().HaveCount(7);
        result.Columns.Select(c => c.ColumnName).Should().BeEquivalentTo(new[]
        {
            "ParcelId", "ParcelNumber", "PropertyClass", "NeighborhoodCode",
            "LandValue", "ImprovementValue", "CreatedUtc",
        });

        // Sample-values JSON is populated for every column (10 random rows).
        result.Columns.Should().AllSatisfy(c =>
            c.SampleValuesJson.Should().NotBeNullOrEmpty());
    }

    // ── BIT min/max regression (FIX-B2.7A) ───────────────────────────────
    //
    // B2.7-SMOKE against real PACS_Training surfaced that
    // ProfileTableAsync failed every table with a BIT column with
    // "Operand data type bit is invalid for min operator." This test
    // pins the live-engine fix: BIT must aggregate as tinyint inside
    // MIN/MAX, with the 0/1 domain preserved end-to-end.
    //
    // Self-contained fixture: creates a temp-name dbo.TFB2BitFixture
    // table on the live SQL Server, profiles it, and drops it. Avoids
    // touching the shared `ParcelDeepProfileFixture` schema (the
    // integration-fixture seeder is out of this slice's scope).

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_ProfilesBitColumnWithoutFailure()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        await CreateBitFixtureAsync(conn);

        try
        {
            var sut = new SqlServerDeepProfileReader(conn);

            var result = await sut.ProfileTableAsync(
                "dbo",
                "TFB2BitFixture",
                new[]
                {
                    new ColumnRef("ParcelId",  "int",  IsNullable: false),
                    new ColumnRef("IsActive",  "bit",  IsNullable: true),
                    new ColumnRef("HasLien",   "bit",  IsNullable: false),
                });

            // Table-level: 5 rows, Full sampling.
            result.Table.RowCount.Should().Be(5L);
            result.Table.SampleRowCount.Should().Be(5);
            result.Table.SamplingMethod.Should().Be("Full");

            // Per-column: BIT columns no longer crash. NullCount/DistinctCount
            // come back as expected for the seeded data.
            //
            // Note: the reader's distinct-count uses
            //   SELECT COUNT(*) FROM (SELECT DISTINCT TOP (n) col FROM ...)
            // which counts NULL as a distinct value (unlike COUNT(DISTINCT)).
            // For IsActive that means {0, 1, NULL} → DistinctCount = 3.
            // For HasLien (NOT NULL) the value set is just {0, 1} → 2.
            var isActive = result.Columns.Single(c => c.ColumnName == "IsActive");
            isActive.NullCount.Should().Be(1);          // (3, NULL, …) row
            isActive.DistinctCount.Should().Be(3);      // {0, 1, NULL}
            isActive.DistinctCountIsExact.Should().BeTrue();

            var hasLien = result.Columns.Single(c => c.ColumnName == "HasLien");
            hasLien.NullCount.Should().Be(0);
            hasLien.DistinctCount.Should().Be(2);       // {0, 1}
        }
        finally
        {
            await DropBitFixtureAsync(conn);
        }
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_StoresBitMinMaxAsZeroOneValues()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        await CreateBitFixtureAsync(conn);

        try
        {
            var sut = new SqlServerDeepProfileReader(conn);

            var result = await sut.ProfileTableAsync(
                "dbo",
                "TFB2BitFixture",
                new[]
                {
                    new ColumnRef("ParcelId",  "int",  IsNullable: false),
                    new ColumnRef("IsActive",  "bit",  IsNullable: true),
                    new ColumnRef("HasLien",   "bit",  IsNullable: false),
                });

            // The 0/1 BIT domain serializes through the tinyint promotion
            // and the outer NVARCHAR(MAX) convert as the strings "0"/"1" —
            // exactly what a downstream consumer would see if BIT had been
            // a directly-aggregable type. Confirms no data loss vs. the
            // skipped-column alternative.
            var isActive = result.Columns.Single(c => c.ColumnName == "IsActive");
            isActive.MinValue.Should().Be("0");
            isActive.MaxValue.Should().Be("1");

            var hasLien = result.Columns.Single(c => c.ColumnName == "HasLien");
            hasLien.MinValue.Should().Be("0");
            hasLien.MaxValue.Should().Be("1");
        }
        finally
        {
            await DropBitFixtureAsync(conn);
        }
    }

    private static async System.Threading.Tasks.Task CreateBitFixtureAsync(SqlConnection conn)
    {
        const string ddl = @"
            IF OBJECT_ID('dbo.TFB2BitFixture', 'U') IS NOT NULL
                DROP TABLE dbo.TFB2BitFixture;

            CREATE TABLE dbo.TFB2BitFixture (
                ParcelId  INT     NOT NULL PRIMARY KEY,
                IsActive  BIT     NULL,
                HasLien   BIT     NOT NULL
            );

            INSERT INTO dbo.TFB2BitFixture (ParcelId, IsActive, HasLien) VALUES
                (1, 1, 0),
                (2, 0, 1),
                (3, NULL, 0),
                (4, 1, 1),
                (5, 0, 0);
        ";
        await using var cmd = new SqlCommand(ddl, conn);
        await cmd.ExecuteNonQueryAsync();
    }

    private static async System.Threading.Tasks.Task DropBitFixtureAsync(SqlConnection conn)
    {
        await using var cmd = new SqlCommand(
            "IF OBJECT_ID('dbo.TFB2BitFixture', 'U') IS NOT NULL DROP TABLE dbo.TFB2BitFixture;",
            conn);
        await cmd.ExecuteNonQueryAsync();
    }
}
