using System.Text.Json;
using FluentAssertions;
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
}
