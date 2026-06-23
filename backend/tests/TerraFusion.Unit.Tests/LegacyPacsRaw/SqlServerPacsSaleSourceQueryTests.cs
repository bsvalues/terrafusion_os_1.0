using FluentAssertions;
using TerraFusion.Data.Services.PacsSources;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Tests for <see cref="SqlServerPacsSaleSource.BuildQuery"/> query shape.
///
/// <para>These tests do NOT require a live SQL Server connection — they verify
/// the SQL text emitted by the source so CI can catch ORDER BY regressions
/// without spinning up PACS. The ORDER BY fix was motivated by the
/// WO-DATA-FINALIZE-SALES-001 stall: an unconditional ORDER BY on the 440k-row
/// JOIN forced SQL Server to sort through tempdb before streaming, causing a
/// mid-reader hang that left a zombie IN_PROGRESS batch.</para>
/// </summary>
public sealed class SqlServerPacsSaleSourceQueryTests
{
    [Fact]
    public void FullCorpus_Query_DoesNotContainOrderBy()
    {
        // topN = null → full-corpus drain. Must NOT include ORDER BY so that
        // SQL Server streams the hash-join result without a tempdb sort pass.
        var sql = SqlServerPacsSaleSource.BuildQuery(topN: null);

        sql.Should().NotContainEquivalentOf("ORDER BY",
            because: "full-corpus drains must omit ORDER BY to prevent SQL Server " +
                     "from sorting 440k rows through tempdb before streaming begins");
    }

    [Fact]
    public void FullCorpus_Query_DoesNotContainTopClause()
    {
        var sql = SqlServerPacsSaleSource.BuildQuery(topN: null);

        sql.Should().NotContainEquivalentOf("TOP ",
            because: "full-corpus drains must not limit rows");
    }

    [Fact]
    public void FullCorpus_Query_DoesNotContainDateFilter()
    {
        var sql = SqlServerPacsSaleSource.BuildQuery(topN: null);

        sql.Should().NotContainEquivalentOf("WHERE",
            because: "full-corpus drains must include all sale dates, not just post-2018");
    }

    [Fact]
    public void TopN_Query_ContainsOrderBy()
    {
        // topN set → bounded proof run. ORDER BY DESC surfaces canonical-eligible
        // (recent) records first so SYNC-POP-2 proof runs observe truth promotion
        // within a small TopN window.
        var sql = SqlServerPacsSaleSource.BuildQuery(topN: 250);

        sql.Should().ContainEquivalentOf("ORDER BY",
            because: "TopN proof runs require deterministic ordering to surface recent sales first");
        sql.Should().ContainEquivalentOf("chg_of_owner_id DESC",
            because: "descending order surfaces the most recent change-of-owner records first");
    }

    [Fact]
    public void TopN_Query_ContainsTopClause()
    {
        var sql = SqlServerPacsSaleSource.BuildQuery(topN: 250);

        sql.Should().Contain("TOP 250",
            because: "TopN must limit the SQL Server result to the requested count");
    }

    [Fact]
    public void TopN_Query_ContainsDateFilter()
    {
        var sql = SqlServerPacsSaleSource.BuildQuery(topN: 250);

        sql.Should().ContainEquivalentOf("WHERE s.sl_dt >= '2018-01-01'",
            because: "TopN proof runs filter to post-2018 sales to maximize canonical-eligible rows in the sample");
    }

    [Fact]
    public void BothVariants_SelectAllRequiredColumns()
    {
        foreach (var sql in new[]
        {
            SqlServerPacsSaleSource.BuildQuery(topN: null),
            SqlServerPacsSaleSource.BuildQuery(topN: 100),
        })
        {
            sql.Should().ContainEquivalentOf("chg_of_owner_id");
            sql.Should().ContainEquivalentOf("prop_id");
            sql.Should().ContainEquivalentOf("sl_county_ratio_cd");
            sql.Should().ContainEquivalentOf("sl_dt");
            sql.Should().ContainEquivalentOf("sl_price");
            sql.Should().ContainEquivalentOf("adjusted_sl_price");
            sql.Should().ContainEquivalentOf("prop_val_yr");
            sql.Should().ContainEquivalentOf("sup_num");
        }
    }

    [Fact]
    public void BothVariants_JoinChgOfOwnerPropAssoc()
    {
        foreach (var sql in new[]
        {
            SqlServerPacsSaleSource.BuildQuery(topN: null),
            SqlServerPacsSaleSource.BuildQuery(topN: 100),
        })
        {
            sql.Should().ContainEquivalentOf("chg_of_owner_prop_assoc",
                because: "prop_id lives on chg_of_owner_prop_assoc, not on dbo.sale");
        }
    }
}
