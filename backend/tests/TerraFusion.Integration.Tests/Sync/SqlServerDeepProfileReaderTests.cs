using FluentAssertions;
using Microsoft.Data.SqlClient;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Unit tests for <see cref="SqlServerDeepProfileReader"/>. Verifies the
/// SQL query shape (correct identifiers, TABLESAMPLE inclusion, distinct
/// clamp, etc.), the sampling-plan decision logic, and the code-candidate
/// heuristic — all WITHOUT executing against a live SQL Server.
///
/// End-to-end execution is verified by the Slice B2.6 Docker integration
/// tests against an azure-sql-edge fixture (mirrors the B1.6 pattern).
/// </summary>
public class SqlServerDeepProfileReaderTests
{
    // ── Constructor guards ───────────────────────────────────────────────

    [Fact]
    public void Constructor_ThrowsOnNullConnection()
    {
        Action act = () => new SqlServerDeepProfileReader(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_AcceptsValidConnection()
    {
        using var connection = new SqlConnection("Server=.;Database=tempdb;Integrated Security=True;TrustServerCertificate=True");
        var act = () => new SqlServerDeepProfileReader(connection);
        act.Should().NotThrow();
    }

    // ── Timeout budget record (FIX-B2.7E) ────────────────────────────────
    //
    // The two-argument constructor accepts an explicit
    // DeepProfileTimeoutBudget; the one-argument ctor delegates to it with
    // the Default. These unit tests pin the record's defaults and the
    // null/zero/negative validation guards. End-to-end "the budget value
    // actually reaches cmd.CommandTimeout" is verified by the live
    // BernoulliSample integration test against a >100K-row fixture (the
    // shape that originally tripped the cascade in B2.7-OLTP).

    [Fact]
    public void DeepProfileTimeoutBudget_Default_HasSensibleValues()
    {
        var budget = DeepProfileTimeoutBudget.Default;

        // 30 s for short metadata roundtrips (row-count estimate, exact
        // COUNT_BIG, post-materialization temp count, DROP TABLE).
        budget.MetadataSeconds.Should().Be(30);

        // 5 minutes for the SELECT * INTO #temp materialization. Generous
        // enough to handle 8M-row PACS tables with wide column lists; tight
        // enough to surface pathological cases.
        budget.MaterializationSeconds.Should().Be(300);

        // 5 minutes for per-column UNION ALL aggregation + sample / top-N
        // reads against the materialized temp.
        budget.AggregationSeconds.Should().Be(300);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void DeepProfileTimeoutBudget_Validate_RejectsNonPositiveMetadata(int seconds)
    {
        Action act = () => new DeepProfileTimeoutBudget(MetadataSeconds: seconds).Validate();
        act.Should().Throw<ArgumentOutOfRangeException>().WithMessage("*positive*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void DeepProfileTimeoutBudget_Validate_RejectsNonPositiveMaterialization(int seconds)
    {
        Action act = () => new DeepProfileTimeoutBudget(MaterializationSeconds: seconds).Validate();
        act.Should().Throw<ArgumentOutOfRangeException>().WithMessage("*positive*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void DeepProfileTimeoutBudget_Validate_RejectsNonPositiveAggregation(int seconds)
    {
        Action act = () => new DeepProfileTimeoutBudget(AggregationSeconds: seconds).Validate();
        act.Should().Throw<ArgumentOutOfRangeException>().WithMessage("*positive*");
    }

    [Fact]
    public void DeepProfileTimeoutBudget_Validate_AllowsCustomPositiveValues()
    {
        var budget = new DeepProfileTimeoutBudget(
            MetadataSeconds:       60,
            MaterializationSeconds: 900,
            AggregationSeconds:     600);

        var act = () => budget.Validate();

        act.Should().NotThrow();
        budget.MetadataSeconds.Should().Be(60);
        budget.MaterializationSeconds.Should().Be(900);
        budget.AggregationSeconds.Should().Be(600);
    }

    [Fact]
    public void Constructor_TwoArg_AcceptsCustomTimeoutBudget()
    {
        using var connection = new SqlConnection("Server=.;Database=tempdb;Integrated Security=True;TrustServerCertificate=True");
        var budget = new DeepProfileTimeoutBudget(
            MetadataSeconds:       45,
            MaterializationSeconds: 240,
            AggregationSeconds:     180);

        var act = () => new SqlServerDeepProfileReader(connection, budget);

        act.Should().NotThrow();
    }

    [Fact]
    public void Constructor_TwoArg_RejectsNullBudget()
    {
        using var connection = new SqlConnection("Server=.;Database=tempdb;Integrated Security=True;TrustServerCertificate=True");

        Action act = () => new SqlServerDeepProfileReader(connection, null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_TwoArg_RejectsInvalidBudget()
    {
        using var connection = new SqlConnection("Server=.;Database=tempdb;Integrated Security=True;TrustServerCertificate=True");
        var bad = new DeepProfileTimeoutBudget(MetadataSeconds: -5);

        Action act = () => new SqlServerDeepProfileReader(connection, bad);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Constructor_OneArg_DelegatesToDefaultBudget()
    {
        using var connection = new SqlConnection("Server=.;Database=tempdb;Integrated Security=True;TrustServerCertificate=True");
        // Smoke: the one-arg ctor must not throw, must pick the Default
        // budget, and must therefore behave identically to the two-arg
        // ctor with Default explicitly passed.
        var act = () => new SqlServerDeepProfileReader(connection);
        act.Should().NotThrow();
    }

    // ── Sampling plan (B2.0 decision) ────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(99_999)]
    [InlineData(100_000)]
    public void PlanSampling_AtOrBelowThreshold_ChoosesFull(long rowCount)
    {
        var plan = SqlServerDeepProfileReader.PlanSampling(rowCount, estimateIsExact: true);

        plan.Method.Should().Be("Full");
        plan.TargetRowCount.Should().Be((int)rowCount);
        plan.BernoulliPct.Should().BeNull();
        plan.RowCountIsExact.Should().BeTrue();
    }

    [Theory]
    [InlineData(100_001)]
    [InlineData(1_000_000)]
    [InlineData(50_000_000L)]
    public void PlanSampling_AboveThreshold_ChoosesBernoulliSample(long rowCount)
    {
        var plan = SqlServerDeepProfileReader.PlanSampling(rowCount, estimateIsExact: false);

        plan.Method.Should().Be("BernoulliSample");
        plan.TargetRowCount.Should().Be(SqlServerDeepProfileReader.TargetSampleRowCount);
        plan.BernoulliPct.Should().NotBeNull();
        plan.BernoulliPct.Should().BeGreaterThan(0m);
        // RowCountIsExact reflects the caller-supplied flag — sampled tables
        // typically use sys.partitions estimates (inexact).
        plan.RowCountIsExact.Should().BeFalse();
    }

    [Fact]
    public void PlanSampling_Bernoulli_PercentageScalesInverselyWithSize()
    {
        var smallish = SqlServerDeepProfileReader.PlanSampling(200_000, false);
        var large    = SqlServerDeepProfileReader.PlanSampling(20_000_000, false);

        // Both target ~10K rows, so the larger table needs a smaller %.
        smallish.BernoulliPct!.Value.Should().BeGreaterThan(large.BernoulliPct!.Value);
        // Sanity: 200K should be ~5%, 20M should be ~0.05%.
        smallish.BernoulliPct.Value.Should().BeApproximately(5.0m, 0.5m);
        large.BernoulliPct.Value.Should().BeApproximately(0.05m, 0.005m);
    }

    [Fact]
    public void PlanSampling_RejectsNegativeRowCount()
    {
        Action act = () => SqlServerDeepProfileReader.PlanSampling(-1, true);
        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    // ── Identifier safety ────────────────────────────────────────────────

    [Fact]
    public void QuoteIdentifier_BracketsTheIdent()
    {
        SqlServerDeepProfileReader.QuoteIdentifier("property_val").Should().Be("[property_val]");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void QuoteIdentifier_RejectsBlankIdent(string blank)
    {
        Action act = () => SqlServerDeepProfileReader.QuoteIdentifier(blank);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void QuoteIdentifier_RejectsClosingBracket()
    {
        Action act = () => SqlServerDeepProfileReader.QuoteIdentifier("evil]name");
        act.Should().Throw<ArgumentException>().WithMessage("*closing bracket*");
    }

    [Fact]
    public void Escape_DoublesSingleQuotes()
    {
        SqlServerDeepProfileReader.Escape("O'Brien").Should().Be("O''Brien");
    }

    // ── SQL builders ─────────────────────────────────────────────────────

    [Fact]
    public void BuildRowCountEstimateSql_TargetsSysPartitions_AndFiltersBySchemaTable()
    {
        var sql = SqlServerDeepProfileReader.BuildRowCountEstimateSql("dbo", "property_val");

        sql.Should().Contain("FROM sys.partitions");
        sql.Should().Contain("INNER JOIN sys.tables");
        sql.Should().Contain("INNER JOIN sys.schemas");
        sql.Should().Contain("s.name = N'dbo'");
        sql.Should().Contain("t.name = N'property_val'");
        sql.Should().Contain("p.index_id IN (0, 1)");
        sql.Should().Contain("ISNULL(SUM(p.rows), 0)");
    }

    [Fact]
    public void BuildExactRowCountSql_UsesCountBigAndQuotedIdent()
    {
        var sql = SqlServerDeepProfileReader.BuildExactRowCountSql("dbo", "property_val");

        sql.Should().Contain("COUNT_BIG(*)");
        sql.Should().Contain("[dbo].[property_val]");
    }

    [Fact]
    public void BuildSampleMaterializationSql_FullPlan_DoesNotIncludeTablesample()
    {
        var plan = new DeepProfileSamplingPlan("Full", 1000, BernoulliPct: null, RowCountIsExact: true);

        var sql = SqlServerDeepProfileReader.BuildSampleMaterializationSql("dbo", "small_table", plan);

        sql.Should().Contain("SELECT * INTO #tf_deep_profile_sample");
        sql.Should().Contain("[dbo].[small_table]");
        sql.Should().NotContain("TABLESAMPLE");
    }

    [Fact]
    public void BuildSampleMaterializationSql_BernoulliPlan_IncludesPercentAndRepeatableSeed()
    {
        var plan = new DeepProfileSamplingPlan("BernoulliSample", 10_000, BernoulliPct: 0.05m, RowCountIsExact: false);

        var sql = SqlServerDeepProfileReader.BuildSampleMaterializationSql("dbo", "huge_table", plan);

        // FIX-B2.7D: SQL Server's TABLESAMPLE only supports SYSTEM, not
        // the SQL:2003 BERNOULLI keyword. The C# Method stays
        // "BernoulliSample" (intent), but the emitted T-SQL switches.
        sql.Should().Contain("TABLESAMPLE SYSTEM (0.05 PERCENT)");
        sql.Should().Contain("REPEATABLE (42)");
        sql.Should().Contain("[dbo].[huge_table]");
    }

    [Fact]
    public void BuildSampleMaterializationSql_BernoulliPlan_NeverEmitsBernoulliKeyword()
    {
        // Regression pin: SQL Server rejects "TABLESAMPLE BERNOULLI" with
        //   Incorrect syntax near 'BERNOULLI'.
        // PostgreSQL accepts both BERNOULLI and SYSTEM; SQL Server only
        // SYSTEM. This reader is SQL-Server-only — pin the absence so a
        // future "let's match the SQL:2003 keyword for clarity" tweak
        // doesn't reintroduce the latent bug that lived from B2.0
        // through B2.7-OLTP.
        var plan = new DeepProfileSamplingPlan("BernoulliSample", 10_000, BernoulliPct: 0.05m, RowCountIsExact: false);

        var sql = SqlServerDeepProfileReader.BuildSampleMaterializationSql("dbo", "huge_table", plan);

        sql.Should().NotContain("BERNOULLI");
    }

    [Fact]
    public void BuildSampleMaterializationSql_BernoulliWithoutPct_Throws()
    {
        var plan = new DeepProfileSamplingPlan("BernoulliSample", 10_000, BernoulliPct: null, RowCountIsExact: false);

        Action act = () => SqlServerDeepProfileReader.BuildSampleMaterializationSql("dbo", "t", plan);
        act.Should().Throw<InvalidOperationException>().WithMessage("*BernoulliPct*");
    }

    [Fact]
    public void BuildColumnAggregationSql_OneColumn_ProducesSingleSelect()
    {
        var cols = new[] { new ColumnRef("prop_id", "int", IsNullable: false) };

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(cols);

        sql.Should().Contain("N'prop_id' AS ColumnName");
        // NullCount uses COUNT_BIG (BIGINT result) so SqlDataReader.GetInt64
        // binds correctly. Plain COUNT() returns INT and would raise
        // InvalidCastException at runtime — caught by Slice B2.6 Docker
        // integration test, pinned here against regression.
        sql.Should().Contain("COUNT_BIG(*) - COUNT_BIG([prop_id]) AS NullCount");
        // Distinct count is clamped via DISTINCT TOP (clamp + 1). The
        // DISTINCT-before-TOP order is the only valid T-SQL form (the
        // reverse raises "Incorrect syntax near 'DISTINCT'") — the Slice
        // B2.6 Docker integration test caught the original
        // "TOP (n) DISTINCT" bug; this assertion pins the fix.
        sql.Should().Contain("DISTINCT TOP (1001)");
        sql.Should().NotContain("TOP (1001) DISTINCT");
        sql.Should().Contain("CONVERT(NVARCHAR(MAX), MIN([prop_id]))");
        sql.Should().Contain("CONVERT(NVARCHAR(MAX), MAX([prop_id]))");
        sql.Should().Contain("FROM #tf_deep_profile_sample");
        sql.Should().NotContain("UNION ALL"); // single column has no UNION
    }

    [Fact]
    public void BuildColumnAggregationSql_MultipleColumns_UnionsAcross()
    {
        var cols = new[]
        {
            new ColumnRef("prop_id",  "int",      false),
            new ColumnRef("hood_cd",  "varchar",  true),
            new ColumnRef("ratio_rpt_cd", "char", true),
        };

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(cols);

        sql.Should().Contain("N'prop_id' AS ColumnName");
        sql.Should().Contain("N'hood_cd' AS ColumnName");
        sql.Should().Contain("N'ratio_rpt_cd' AS ColumnName");
        // 3 columns → 2 UNION ALLs
        var unionCount = sql.Split("UNION ALL").Length - 1;
        unionCount.Should().Be(2);
    }

    [Fact]
    public void BuildColumnAggregationSql_RejectsEmptyColumnList()
    {
        Action act = () => SqlServerDeepProfileReader.BuildColumnAggregationSql(Array.Empty<ColumnRef>());
        act.Should().Throw<ArgumentException>();
    }

    // ── BIT min/max regression (FIX-B2.7A) ───────────────────────────────
    //
    // SQL Server rejects MIN([bit_col]) / MAX([bit_col]) with
    // "Operand data type bit is invalid for min operator." PACS tables
    // routinely flag rows with BIT columns, so the original emission
    // failed every PACS table that had one — discovered by B2.7-SMOKE.
    // The fix promotes BIT to tinyint inside the aggregate.
    //
    // These tests pin the SQL shape so the regression cannot land again
    // without a unit signal; the live engine path is verified by the
    // Slice B2.6 Docker integration tests with a BIT fixture column.

    [Fact]
    public void BuildColumnAggregationSql_CastsBitColumnForMinMax()
    {
        var cols = new[] { new ColumnRef("is_active", "bit", IsNullable: false) };

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(cols);

        sql.Should().Contain("MIN(CAST([is_active] AS tinyint))");
        sql.Should().Contain("MAX(CAST([is_active] AS tinyint))");
        // The serialized result is still NVARCHAR(MAX) so the result-set
        // shape stays uniform across types.
        sql.Should().Contain("CONVERT(NVARCHAR(MAX), MIN(CAST([is_active] AS tinyint)))");
        sql.Should().Contain("CONVERT(NVARCHAR(MAX), MAX(CAST([is_active] AS tinyint)))");
    }

    [Fact]
    public void BuildColumnAggregationSql_DoesNotEmitMinOverRawBit()
    {
        var cols = new[] { new ColumnRef("is_active", "bit", IsNullable: false) };

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(cols);

        // The raw-BIT shape would crash the live engine. Pinned absent.
        sql.Should().NotContain("MIN([is_active])");
        sql.Should().NotContain("MAX([is_active])");
    }

    [Fact]
    public void BuildColumnAggregationSql_BitTypeIsCaseInsensitive()
    {
        // sys.types returns "bit", but defensive: SQL-type strings vary in
        // casing across schema sources. The fix uses OrdinalIgnoreCase.
        var cols = new[] { new ColumnRef("is_active", "BIT", IsNullable: false) };

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(cols);

        sql.Should().Contain("MIN(CAST([is_active] AS tinyint))");
        sql.Should().NotContain("MIN([is_active])");
    }

    [Fact]
    public void BuildColumnAggregationSql_PreservesNormalMinMaxForNonBitColumns()
    {
        // Make sure the BIT-cast path is type-gated, not blanket — every
        // other type still gets the bare column reference inside MIN/MAX.
        var cols = new[]
        {
            new ColumnRef("prop_id",   "int",       IsNullable: false),
            new ColumnRef("hood_cd",   "varchar",   IsNullable: true),
            new ColumnRef("levy_amt",  "decimal",   IsNullable: true),
            new ColumnRef("appraised", "datetime2", IsNullable: true),
        };

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(cols);

        sql.Should().Contain("MIN([prop_id])");
        sql.Should().Contain("MAX([prop_id])");
        sql.Should().Contain("MIN([hood_cd])");
        sql.Should().Contain("MAX([hood_cd])");
        sql.Should().Contain("MIN([levy_amt])");
        sql.Should().Contain("MAX([levy_amt])");
        sql.Should().Contain("MIN([appraised])");
        sql.Should().Contain("MAX([appraised])");
        // No CAST(... AS tinyint) for non-BIT columns.
        sql.Should().NotContain("CAST([prop_id] AS tinyint)");
        sql.Should().NotContain("CAST([hood_cd] AS tinyint)");
    }

    [Fact]
    public void BuildColumnAggregationSql_MixedBitAndNonBit_AppliesCastOnlyToBit()
    {
        var cols = new[]
        {
            new ColumnRef("prop_id",   "int",  IsNullable: false),
            new ColumnRef("is_active", "bit",  IsNullable: false),
            new ColumnRef("hood_cd",   "varchar", IsNullable: true),
        };

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(cols);

        sql.Should().Contain("MIN([prop_id])");
        sql.Should().Contain("MIN(CAST([is_active] AS tinyint))");
        sql.Should().Contain("MIN([hood_cd])");
        sql.Should().NotContain("CAST([prop_id] AS tinyint)");
        sql.Should().NotContain("CAST([hood_cd] AS tinyint)");
        sql.Should().NotContain("MIN([is_active])");
    }

    [Theory]
    [InlineData("bit", "CAST([is_active] AS tinyint)")]
    [InlineData("BIT", "CAST([is_active] AS tinyint)")]
    [InlineData("Bit", "CAST([is_active] AS tinyint)")]
    [InlineData("int", "[is_active]")]
    [InlineData("varchar", "[is_active]")]
    [InlineData("nvarchar", "[is_active]")]
    [InlineData("datetime2", "[is_active]")]
    [InlineData("decimal", "[is_active]")]
    public void BuildMinMaxOperand_WrapsBitOnlyAndIsCaseInsensitive(string sqlType, string expected)
    {
        var operand = SqlServerDeepProfileReader.BuildMinMaxOperand("[is_active]", sqlType);
        operand.Should().Be(expected);
    }

    // ── Spatial-skip policy (FIX-B2.7B) ──────────────────────────────────
    //
    // PACS spatial columns (geometry, geography) must NOT be deep-profiled.
    // Benton County GIS truth lives in TerraAtlas (SHP / geodatabase /
    // ArcGIS API), not in the assessor system. SQL Server also rejects
    // DISTINCT/MIN/MAX over spatial CLR types — discovered when B2.7-SMOKE
    // hit `[dbo].[__AAPARCEL_]`:
    //
    //   The geometry data type cannot be selected as DISTINCT because it
    //   is not comparable.
    //
    // The reader filters spatial columns at the top of ProfileTableAsync.
    // These tests pin both the type predicate and the filter helper, plus
    // the SQL-builder absence (no DISTINCT/MIN/MAX/sample/top against a
    // spatial column once the caller has applied the filter).

    [Theory]
    [InlineData("geometry",  true)]
    [InlineData("GEOMETRY",  true)]
    [InlineData("Geometry",  true)]
    [InlineData("geography", true)]
    [InlineData("GEOGRAPHY", true)]
    [InlineData("Geography", true)]
    [InlineData("int",       false)]
    [InlineData("varchar",   false)]
    [InlineData("nvarchar",  false)]
    [InlineData("bit",       false)]
    [InlineData("decimal",   false)]
    [InlineData("datetime2", false)]
    public void IsSpatialType_RecognizesGeometryAndGeographyCaseInsensitively(string sqlType, bool expected)
    {
        SqlServerDeepProfileReader.IsSpatialType(sqlType).Should().Be(expected);
    }

    [Fact]
    public void IsSpatialType_ThrowsOnNullType()
    {
        Action act = () => SqlServerDeepProfileReader.IsSpatialType(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void FilterProfilableColumns_DropsGeometryAndGeographyAndPreservesOrder()
    {
        var input = new[]
        {
            new ColumnRef("ParcelId",   "int",      IsNullable: false),
            new ColumnRef("Boundary",   "geometry", IsNullable: true),  // skipped
            new ColumnRef("HoodCd",     "varchar",  IsNullable: true),
            new ColumnRef("Centroid",   "GEOGRAPHY",IsNullable: true),  // skipped (case-insensitive)
            new ColumnRef("LandValue",  "decimal",  IsNullable: false),
        };

        var filtered = SqlServerDeepProfileReader.FilterProfilableColumns(input);

        filtered.Select(c => c.Name).Should().ContainInOrder("ParcelId", "HoodCd", "LandValue");
        filtered.Should().NotContain(c => c.Name == "Boundary");
        filtered.Should().NotContain(c => c.Name == "Centroid");
    }

    [Fact]
    public void FilterProfilableColumns_AllSpatial_ReturnsEmpty()
    {
        // PACS heritage tables like __AAPARCEL_ that hold only a parcel
        // identifier and a geometry collapse to "structural-only" — the
        // column list comes back empty so ProfileTableAsync short-circuits.
        var input = new[]
        {
            new ColumnRef("Boundary", "geometry",  IsNullable: true),
            new ColumnRef("Centroid", "geography", IsNullable: true),
        };

        var filtered = SqlServerDeepProfileReader.FilterProfilableColumns(input);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterProfilableColumns_NoSpatial_ReturnsAllOriginalColumns()
    {
        var input = new[]
        {
            new ColumnRef("ParcelId",  "int",      IsNullable: false),
            new ColumnRef("HoodCd",    "varchar",  IsNullable: true),
            new ColumnRef("LandValue", "decimal",  IsNullable: false),
        };

        var filtered = SqlServerDeepProfileReader.FilterProfilableColumns(input);

        filtered.Should().HaveCount(3);
        filtered.Should().BeEquivalentTo(input);
    }

    [Fact]
    public void FilterProfilableColumns_ThrowsOnNullInput()
    {
        Action act = () => SqlServerDeepProfileReader.FilterProfilableColumns(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void BuildColumnAggregationSql_GivenFilteredList_DoesNotReferenceSpatialColumn()
    {
        // Once FilterProfilableColumns has stripped the spatial entries,
        // none of the sub-builders should see them. This pins that the
        // surviving SQL has no DISTINCT/MIN/MAX/UNION pointed at a spatial
        // column — the failure mode that broke the B2.7-SMOKE.
        var input = new[]
        {
            new ColumnRef("ParcelId",  "int",      IsNullable: false),
            new ColumnRef("Boundary",  "geometry", IsNullable: true),
            new ColumnRef("HoodCd",    "varchar",  IsNullable: true),
        };

        var profilable = SqlServerDeepProfileReader.FilterProfilableColumns(input);

        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(profilable);

        sql.Should().Contain("[ParcelId]");
        sql.Should().Contain("[HoodCd]");
        sql.Should().NotContain("[Boundary]");
        sql.Should().NotContain("Boundary");
    }

    [Fact]
    public void DetectCodeCandidate_NeverFiresOnSpatialType()
    {
        // Defensive: even if a caller bypassed the filter and handed a
        // spatial column's stats to the heuristic, IsCodeCandidateType
        // already gates by SQL type and won't promote geometry/geography.
        var stats = StatsWith(distinctCount: 3, exact: true);

        SqlServerDeepProfileReader.DetectCodeCandidate(stats, "geometry",  10_000).Should().BeNull();
        SqlServerDeepProfileReader.DetectCodeCandidate(stats, "geography", 10_000).Should().BeNull();
    }

    // ── Concurrency-token skip policy (FIX-B2.7C) ────────────────────────
    //
    // PACS business tables routinely carry a `tsRowVersion` column of type
    // `timestamp` (legacy synonym of `rowversion`). The deep profiler's
    // CONVERT(NVARCHAR(MAX), MIN(...)) path crashes against it with:
    //
    //   Explicit conversion from data type timestamp to nvarchar(max) is
    //   not allowed.
    //
    // — discovered when B2.7-TARGETED hit property_val / imprv /
    // imprv_detail / land_detail. rowversion is an opaque concurrency
    // token, not business data the workbench will ever map, so the policy
    // is to SKIP at the deep-profile level rather than coerce to hex.

    [Theory]
    [InlineData("rowversion", true)]
    [InlineData("ROWVERSION", true)]
    [InlineData("RowVersion", true)]
    [InlineData("timestamp",  true)]
    [InlineData("TIMESTAMP",  true)]
    [InlineData("Timestamp",  true)]
    [InlineData("int",        false)]
    [InlineData("varchar",    false)]
    [InlineData("nvarchar",   false)]
    [InlineData("bit",        false)]
    [InlineData("decimal",    false)]
    [InlineData("datetime",   false)]   // datetime is NOT a concurrency type
    [InlineData("datetime2",  false)]   // datetime2 is NOT a concurrency type
    [InlineData("geometry",   false)]   // covered by IsSpatialType, not this
    [InlineData("geography",  false)]
    public void IsConcurrencyType_RecognizesRowversionAndTimestampCaseInsensitively(string sqlType, bool expected)
    {
        SqlServerDeepProfileReader.IsConcurrencyType(sqlType).Should().Be(expected);
    }

    [Fact]
    public void IsConcurrencyType_ThrowsOnNullType()
    {
        Action act = () => SqlServerDeepProfileReader.IsConcurrencyType(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void FilterProfilableColumns_DropsRowversionAndTimestamp()
    {
        var input = new[]
        {
            new ColumnRef("ParcelId",     "int",        IsNullable: false),
            new ColumnRef("tsRowVersion", "timestamp",  IsNullable: false), // skipped
            new ColumnRef("HoodCd",       "varchar",    IsNullable: true),
            new ColumnRef("ConcurrencyV", "ROWVERSION", IsNullable: false), // skipped (case-insensitive)
            new ColumnRef("LandValue",    "decimal",    IsNullable: false),
        };

        var filtered = SqlServerDeepProfileReader.FilterProfilableColumns(input);

        filtered.Select(c => c.Name).Should().ContainInOrder("ParcelId", "HoodCd", "LandValue");
        filtered.Should().NotContain(c => c.Name == "tsRowVersion");
        filtered.Should().NotContain(c => c.Name == "ConcurrencyV");
    }

    [Fact]
    public void FilterProfilableColumns_DropsBothSpatialAndConcurrencyTogether()
    {
        // The two skip policies stack — a typical PACS valuation table
        // has neither a geometry column AND a tsRowVersion. Whatever the
        // mix, the survivor list contains only the columns that both
        // pass.
        var input = new[]
        {
            new ColumnRef("ParcelId",     "int",        IsNullable: false),
            new ColumnRef("Boundary",     "geometry",   IsNullable: true),  // spatial-skip
            new ColumnRef("tsRowVersion", "timestamp",  IsNullable: false), // concurrency-skip
            new ColumnRef("HoodCd",       "varchar",    IsNullable: true),
        };

        var filtered = SqlServerDeepProfileReader.FilterProfilableColumns(input);

        filtered.Should().HaveCount(2);
        filtered.Select(c => c.Name).Should().ContainInOrder("ParcelId", "HoodCd");
    }

    [Fact]
    public void FilterProfilableColumns_AllConcurrency_ReturnsEmpty()
    {
        // Pathological but defensible: a join table that's just a
        // rowversion + nothing else collapses to "structural-only" once
        // the filter runs.
        var input = new[]
        {
            new ColumnRef("tsA", "timestamp",  IsNullable: false),
            new ColumnRef("tsB", "rowversion", IsNullable: false),
        };

        var filtered = SqlServerDeepProfileReader.FilterProfilableColumns(input);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void BuildColumnAggregationSql_GivenFilteredList_DoesNotReferenceConcurrencyColumn()
    {
        // Same shape as the spatial absence test — once
        // FilterProfilableColumns has stripped rowversion entries, the
        // SQL builder's MIN/MAX/CONVERT path never points at them, so
        // the engine's "explicit conversion from timestamp to nvarchar"
        // failure mode is unreachable.
        var input = new[]
        {
            new ColumnRef("ParcelId",     "int",       IsNullable: false),
            new ColumnRef("tsRowVersion", "timestamp", IsNullable: false),
            new ColumnRef("HoodCd",       "varchar",   IsNullable: true),
        };

        var profilable = SqlServerDeepProfileReader.FilterProfilableColumns(input);
        var sql = SqlServerDeepProfileReader.BuildColumnAggregationSql(profilable);

        sql.Should().Contain("[ParcelId]");
        sql.Should().Contain("[HoodCd]");
        sql.Should().NotContain("[tsRowVersion]");
        sql.Should().NotContain("tsRowVersion");
    }

    [Fact]
    public void DetectCodeCandidate_NeverFiresOnConcurrencyType()
    {
        // Defensive: same as the spatial DetectCodeCandidate guard. A
        // concurrency token can never be a code-table candidate by type.
        var stats = StatsWith(distinctCount: 3, exact: true);

        SqlServerDeepProfileReader.DetectCodeCandidate(stats, "rowversion", 10_000).Should().BeNull();
        SqlServerDeepProfileReader.DetectCodeCandidate(stats, "timestamp",  10_000).Should().BeNull();
    }

    [Fact]
    public void BuildSampleValuesSql_IncludesNewIdOrderingAndTopGuard()
    {
        var sql = SqlServerDeepProfileReader.BuildSampleValuesSql("hood_cd");

        sql.Should().Contain($"TOP ({SqlServerDeepProfileReader.SampleValuesPerColumn})");
        sql.Should().Contain("CONVERT(NVARCHAR(MAX), [hood_cd])");
        sql.Should().Contain("FROM #tf_deep_profile_sample");
        sql.Should().Contain("ORDER BY NEWID()");
    }

    [Fact]
    public void BuildTopValuesSql_GroupsAndOrdersByCountDesc()
    {
        var sql = SqlServerDeepProfileReader.BuildTopValuesSql("hood_cd");

        sql.Should().Contain($"TOP ({SqlServerDeepProfileReader.TopValuesKept})");
        sql.Should().Contain("WHERE [hood_cd] IS NOT NULL");
        sql.Should().Contain("GROUP BY [hood_cd]");
        sql.Should().Contain("ORDER BY Count DESC, [hood_cd] ASC");
    }

    // ── Code-candidate heuristic ─────────────────────────────────────────

    private static ColumnStatsRecord StatsWith(int distinctCount, bool exact, int parentRowCount = 10_000)
        => new(
            SchemaName:           "dbo",
            TableName:            "property_val",
            ColumnName:           "ratio_rpt_cd",
            ParentRowCount:       parentRowCount,
            NullCount:            0,
            NullPct:              0m,
            DistinctCount:        distinctCount,
            DistinctCountIsExact: exact,
            MinValue:             null,
            MaxValue:             null,
            SampleValuesJson:     null,
            TopValuesJson:        null);

    [Fact]
    public void DetectCodeCandidate_LowCardinalityVarchar_Qualifies()
    {
        var stats = StatsWith(distinctCount: 7, exact: true, parentRowCount: 10_000);

        var hit = SqlServerDeepProfileReader.DetectCodeCandidate(stats, "varchar", sampleSize: 10_000);

        hit.Should().NotBeNull();
        hit!.DistinctCount.Should().Be(7);
        hit.SampleSize.Should().Be(10_000);
        hit.DistinctRatio.Should().Be(0.0007m);
        hit.Reason.Should().Be("low_cardinality_string");
    }

    [Fact]
    public void DetectCodeCandidate_TinyInt_QualifiesWithSmallintReason()
    {
        var stats = StatsWith(distinctCount: 4, exact: true, parentRowCount: 10_000);

        var hit = SqlServerDeepProfileReader.DetectCodeCandidate(stats, "tinyint", sampleSize: 10_000);

        hit.Should().NotBeNull();
        hit!.Reason.Should().Be("low_cardinality_smallint");
    }

    [Fact]
    public void DetectCodeCandidate_HighDistinctRatio_DoesNotQualify()
    {
        // 600 distinct over 10K sample = 6% — above the 5% cap.
        var stats = StatsWith(distinctCount: 600, exact: true);

        var hit = SqlServerDeepProfileReader.DetectCodeCandidate(stats, "varchar", sampleSize: 10_000);

        hit.Should().BeNull();
    }

    [Fact]
    public void DetectCodeCandidate_DistinctClamped_DoesNotQualify()
    {
        // Saturated distinct → can't trust the heuristic.
        var stats = StatsWith(distinctCount: 1_000, exact: false);

        var hit = SqlServerDeepProfileReader.DetectCodeCandidate(stats, "varchar", sampleSize: 10_000);

        hit.Should().BeNull();
    }

    [Fact]
    public void DetectCodeCandidate_TooManyDistinct_DoesNotQualify()
    {
        // Distinct = 150 — exact, but above the 100-cap.
        var stats = StatsWith(distinctCount: 150, exact: true);

        var hit = SqlServerDeepProfileReader.DetectCodeCandidate(stats, "varchar", sampleSize: 10_000);

        hit.Should().BeNull();
    }

    [Fact]
    public void DetectCodeCandidate_NonCodeType_DoesNotQualify()
    {
        // datetime2 — even with low cardinality, not a code-table candidate
        // by the type heuristic.
        var stats = StatsWith(distinctCount: 5, exact: true);

        var hit = SqlServerDeepProfileReader.DetectCodeCandidate(stats, "datetime2", sampleSize: 10_000);

        hit.Should().BeNull();
    }

    [Fact]
    public void DetectCodeCandidate_ZeroSample_DoesNotQualify()
    {
        var stats = StatsWith(distinctCount: 1, exact: true);

        var hit = SqlServerDeepProfileReader.DetectCodeCandidate(stats, "varchar", sampleSize: 0);

        hit.Should().BeNull();
    }
}
