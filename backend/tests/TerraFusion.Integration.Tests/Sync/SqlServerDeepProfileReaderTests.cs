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

        sql.Should().Contain("TABLESAMPLE BERNOULLI (0.05 PERCENT)");
        sql.Should().Contain("REPEATABLE (42)");
        sql.Should().Contain("[dbo].[huge_table]");
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
        sql.Should().Contain("COUNT(*) - COUNT([prop_id]) AS NullCount");
        // Distinct count is clamped via TOP (clamp + 1) DISTINCT
        sql.Should().Contain("TOP (1001)");
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
