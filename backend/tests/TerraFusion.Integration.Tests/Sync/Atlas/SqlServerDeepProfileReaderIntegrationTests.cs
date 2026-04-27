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

    // ── Spatial-skip policy (FIX-B2.7B) ──────────────────────────────────
    //
    // PACS spatial columns are out of lane for SyncAtlas deep profile.
    // Real-engine verification of "skip works" is done two ways:
    //
    //   1. The B2.7-SMOKE run against full SQL Server PACS_Training is
    //      the ultimate proof: tables with real geometry columns now
    //      pass the deep pass instead of failing with "the geometry data
    //      type cannot be selected as DISTINCT because it is not
    //      comparable."
    //
    //   2. These integration tests pin the policy at the live engine
    //      using a ColumnRef declared as "geometry" against an actual
    //      NVARCHAR column on the seeded fixture table. Per ColumnRef's
    //      own doc comment ("the deep-profile reader doesn't re-query
    //      sys.columns for column types") the type is caller-supplied,
    //      so this exercises the spatial-skip filter end-to-end without
    //      requiring spatial CLR support in azure-sql-edge (which it
    //      doesn't have). The "skipped column never appears in the
    //      result.Columns rows" is the live-engine assertion.

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_SpatialColumnDeclared_IsSkippedFromColumnStats()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        // Declare PropertyClass as "geometry" — the reader must skip it,
        // but the live engine must still produce stats for the rest of
        // the table. This is the "skip works at orchestration level" proof.
        var declaredColumns = new[]
        {
            new ColumnRef("ParcelId",         "int",      IsNullable: false),
            new ColumnRef("ParcelNumber",     "nvarchar", IsNullable: false),
            new ColumnRef("PropertyClass",    "geometry", IsNullable: false),  // policy-skip
            new ColumnRef("NeighborhoodCode", "geography",IsNullable: true),   // policy-skip
            new ColumnRef("LandValue",        "decimal",  IsNullable: false),
        };

        var result = await sut.ProfileTableAsync(Schema, Table, declaredColumns);

        // Table-level row still produced — structural row count untouched.
        result.Table.RowCount.Should().Be(100L);
        result.Table.SamplingMethod.Should().Be("Full");

        // Column-stats rows: only the 3 non-spatial columns survive.
        result.Columns.Select(c => c.ColumnName).Should().BeEquivalentTo(new[]
        {
            "ParcelId", "ParcelNumber", "LandValue",
        });

        // Specifically: spatial columns produced zero column-stats rows.
        result.Columns.Should().NotContain(c => c.ColumnName == "PropertyClass");
        result.Columns.Should().NotContain(c => c.ColumnName == "NeighborhoodCode");

        // And no code candidates fired off the skipped columns either.
        result.CodeCandidates.Should().NotContain(c => c.ColumnName == "PropertyClass");
        result.CodeCandidates.Should().NotContain(c => c.ColumnName == "NeighborhoodCode");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_NonSpatialColumnsContinueProfilingNormally()
    {
        // Co-tests the spatial skip against the rest of the table: the
        // surviving columns must produce the SAME stats as the no-skip
        // path. Pins that the filter is purely subtractive — it doesn't
        // alter the SQL shape or numbers for the kept columns.
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var declaredColumns = new[]
        {
            new ColumnRef("ParcelId",         "int",      IsNullable: false),
            new ColumnRef("ParcelNumber",     "nvarchar", IsNullable: false),
            new ColumnRef("PropertyClass",    "geometry", IsNullable: false),  // policy-skip
            new ColumnRef("LandValue",        "decimal",  IsNullable: false),
        };

        var result = await sut.ProfileTableAsync(Schema, Table, declaredColumns);

        // ParcelNumber: 100 distinct rows over 100 sample (high cardinality).
        var parcelNumber = result.Columns.Single(c => c.ColumnName == "ParcelNumber");
        parcelNumber.NullCount.Should().Be(0);
        parcelNumber.DistinctCount.Should().Be(100);

        // LandValue: same min/max as the all-columns test
        // (75000 → 500000, fill rows at 200000 don't shift).
        var landValue = result.Columns.Single(c => c.ColumnName == "LandValue");
        decimal.Parse(landValue.MinValue!).Should().Be(75000m);
        decimal.Parse(landValue.MaxValue!).Should().Be(500000m);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_AllSpatialColumns_ProducesEmptyColumnStatsButTableRow()
    {
        // PACS heritage tables that hold only a parcel-id + geometry
        // collapse to "structural-only" once the spatial filter runs.
        // The reader must not crash, and must still produce a TableStats
        // row so the verify SQL's "did this batch persist anything"
        // probe sees the row.
        await using var conn = await _fixture.OpenConnectionAsync();
        var sut = new SqlServerDeepProfileReader(conn);

        var declaredColumns = new[]
        {
            new ColumnRef("ParcelNumber",     "geometry",  IsNullable: false), // policy-skip
            new ColumnRef("NeighborhoodCode", "geography", IsNullable: true),  // policy-skip
        };

        var result = await sut.ProfileTableAsync(Schema, Table, declaredColumns);

        result.Table.RowCount.Should().Be(100L);
        result.Columns.Should().BeEmpty();
        result.CodeCandidates.Should().BeEmpty();
    }

    // ── Concurrency-token skip policy (FIX-B2.7C) ────────────────────────
    //
    // PACS business tables (property_val, imprv, imprv_detail, land_detail,
    // …) carry a real `timestamp` rowversion column. The reader's
    // CONVERT(NVARCHAR(MAX), MIN(...)) path crashes against it. The fix
    // skips concurrency tokens at the deep-profile level. Unlike the
    // spatial CLR types, azure-sql-edge DOES support `rowversion` /
    // `timestamp` end-to-end — so this fixture creates a real rowversion
    // column instead of needing the spoofed-type pattern, giving the
    // strongest possible live-engine signal.

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_RowversionColumn_IsSkippedFromColumnStats()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        await CreateRowversionFixtureAsync(conn);

        try
        {
            var sut = new SqlServerDeepProfileReader(conn);

            var result = await sut.ProfileTableAsync(
                "dbo",
                "TFB2RowversionFixture",
                new[]
                {
                    new ColumnRef("ParcelId",     "int",       IsNullable: false),
                    new ColumnRef("tsRowVersion", "timestamp", IsNullable: false), // policy-skip
                    new ColumnRef("HoodCd",       "varchar",   IsNullable: true),
                });

            // Live engine accepted the table. Skipped column does not appear.
            result.Table.RowCount.Should().Be(3L);
            result.Columns.Select(c => c.ColumnName).Should().BeEquivalentTo(new[]
            {
                "ParcelId", "HoodCd",
            });
            result.Columns.Should().NotContain(c => c.ColumnName == "tsRowVersion");
            result.CodeCandidates.Should().NotContain(c => c.ColumnName == "tsRowVersion");
        }
        finally
        {
            await DropRowversionFixtureAsync(conn);
        }
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_RowversionColumnPresent_NonRowversionColumnsStillProfile()
    {
        // Co-test: with the rowversion correctly skipped, the surviving
        // columns produce stats with the same shape they would have
        // produced if the table had no rowversion at all. Pins that the
        // skip is purely subtractive.
        await using var conn = await _fixture.OpenConnectionAsync();
        await CreateRowversionFixtureAsync(conn);

        try
        {
            var sut = new SqlServerDeepProfileReader(conn);

            var result = await sut.ProfileTableAsync(
                "dbo",
                "TFB2RowversionFixture",
                new[]
                {
                    new ColumnRef("ParcelId",     "int",       IsNullable: false),
                    new ColumnRef("tsRowVersion", "timestamp", IsNullable: false),
                    new ColumnRef("HoodCd",       "varchar",   IsNullable: true),
                });

            // ParcelId: 3 distinct, no NULLs, deterministic min/max.
            var parcelId = result.Columns.Single(c => c.ColumnName == "ParcelId");
            parcelId.NullCount.Should().Be(0);
            parcelId.DistinctCount.Should().Be(3);
            parcelId.MinValue.Should().Be("1");
            parcelId.MaxValue.Should().Be("3");

            // HoodCd: 1 NULL + {RES, COM} → 3 distinct (NULL counts in
            // SELECT DISTINCT, same as in the BIT test).
            var hoodCd = result.Columns.Single(c => c.ColumnName == "HoodCd");
            hoodCd.NullCount.Should().Be(1);
            hoodCd.DistinctCount.Should().Be(3);
        }
        finally
        {
            await DropRowversionFixtureAsync(conn);
        }
    }

    private static async System.Threading.Tasks.Task CreateRowversionFixtureAsync(SqlConnection conn)
    {
        const string ddl = @"
            IF OBJECT_ID('dbo.TFB2RowversionFixture', 'U') IS NOT NULL
                DROP TABLE dbo.TFB2RowversionFixture;

            CREATE TABLE dbo.TFB2RowversionFixture (
                ParcelId      INT          NOT NULL PRIMARY KEY,
                tsRowVersion  rowversion   NOT NULL,
                HoodCd        NVARCHAR(8)  NULL
            );

            INSERT INTO dbo.TFB2RowversionFixture (ParcelId, HoodCd) VALUES
                (1, 'RES'),
                (2, 'COM'),
                (3, NULL);
        ";
        await using var cmd = new SqlCommand(ddl, conn);
        await cmd.ExecuteNonQueryAsync();
    }

    private static async System.Threading.Tasks.Task DropRowversionFixtureAsync(SqlConnection conn)
    {
        await using var cmd = new SqlCommand(
            "IF OBJECT_ID('dbo.TFB2RowversionFixture', 'U') IS NOT NULL DROP TABLE dbo.TFB2RowversionFixture;",
            conn);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── BernoulliSample path (FIX-B2.7D) ─────────────────────────────────
    //
    // Closes the integration-test gap that let the B2.0 BERNOULLI dialect
    // bug live until B2.7-OLTP. The default ParcelDeepProfileFixture has
    // 100 rows — well below FullThresholdRowCount (100,000) — so every
    // earlier integration test took the Full path and never executed the
    // BernoulliSample materialization SQL against a live engine. This
    // test seeds a >100K-row table on purpose so the BernoulliSample path
    // runs end-to-end with TABLESAMPLE SYSTEM.

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableAsync_AboveFullThreshold_TakesBernoulliSamplePathSuccessfully()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        await CreateBernoulliFixtureAsync(conn, rowCount: 100_050);

        try
        {
            var sut = new SqlServerDeepProfileReader(conn);

            var result = await sut.ProfileTableAsync(
                "dbo",
                "TFB2BernoulliFixture",
                new[]
                {
                    new ColumnRef("Id",     "int",     IsNullable: false),
                    new ColumnRef("Code",   "varchar", IsNullable: false),
                    new ColumnRef("Bucket", "int",     IsNullable: false),
                });

            // Plan-level: 100,050 > FullThresholdRowCount → BernoulliSample.
            result.Table.SamplingMethod.Should().Be("BernoulliSample");
            result.Table.RowCount.Should().BeGreaterThan(100_000);

            // The plan targets ~10K rows from the sample. SYSTEM sampling
            // is page-clustered so the actual sample size is noisier than
            // a true Bernoulli per-row coin flip; allow a wide window
            // [3K, 25K] that still fails closed if the plan or the engine
            // does something genuinely wrong (e.g. returns 0 rows or the
            // entire table). This is a smoke test, not a sampling-quality
            // test.
            result.Table.SampleRowCount.Should().BeInRange(3_000, 25_000);

            // Aggregate result still shapes up: every column produces a
            // ColumnStats row, no exception bubbles, and the
            // distinct-clamp behaves (Code has 5 distinct, Bucket has 100).
            result.Columns.Should().HaveCount(3);
            var code = result.Columns.Single(c => c.ColumnName == "Code");
            code.DistinctCount.Should().Be(5);  // 'A'..'E' → 5 distinct
            code.NullCount.Should().Be(0);

            var bucket = result.Columns.Single(c => c.ColumnName == "Bucket");
            bucket.DistinctCount.Should().BeGreaterOrEqualTo(50);  // up to 100, sample-dependent
        }
        finally
        {
            await DropBernoulliFixtureAsync(conn);
        }
    }

    private static async System.Threading.Tasks.Task CreateBernoulliFixtureAsync(
        SqlConnection conn, int rowCount)
    {
        // sys.all_objects is always present and has enough rows to seed
        // 100K+ via a CROSS JOIN — no recursion-limit ceremony needed.
        // Use deterministic content so the assertions are stable.
        var ddl = @$"
            IF OBJECT_ID('dbo.TFB2BernoulliFixture', 'U') IS NOT NULL
                DROP TABLE dbo.TFB2BernoulliFixture;

            CREATE TABLE dbo.TFB2BernoulliFixture (
                Id      INT          NOT NULL PRIMARY KEY,
                Code    VARCHAR(8)   NOT NULL,
                Bucket  INT          NOT NULL
            );

            ;WITH Tally AS (
                SELECT TOP ({rowCount})
                       ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
                FROM sys.all_objects a
                CROSS JOIN sys.all_objects b
            )
            INSERT INTO dbo.TFB2BernoulliFixture (Id, Code, Bucket)
            SELECT n,
                   CASE n % 5 WHEN 0 THEN 'A' WHEN 1 THEN 'B' WHEN 2 THEN 'C' WHEN 3 THEN 'D' ELSE 'E' END,
                   n % 100
            FROM Tally;
        ";
        await using var cmd = new SqlCommand(ddl, conn) { CommandTimeout = 120 };
        await cmd.ExecuteNonQueryAsync();
    }

    private static async System.Threading.Tasks.Task DropBernoulliFixtureAsync(SqlConnection conn)
    {
        await using var cmd = new SqlCommand(
            "IF OBJECT_ID('dbo.TFB2BernoulliFixture', 'U') IS NOT NULL DROP TABLE dbo.TFB2BernoulliFixture;",
            conn);
        await cmd.ExecuteNonQueryAsync();
    }
}
