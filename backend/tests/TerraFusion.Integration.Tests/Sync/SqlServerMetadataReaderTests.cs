using FluentAssertions;
using Microsoft.Data.SqlClient;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Unit-style tests for <see cref="SqlServerMetadataReader"/>. These verify the
/// SQL query shape (correct sys.* references, no SQL injection vectors, expected
/// columns) WITHOUT executing against a live SQL Server.
///
/// Real query execution is tested in Slice B1.6 against a Docker SQL Server fixture.
/// </summary>
public class SqlServerMetadataReaderTests
{
    [Fact]
    public void Constructor_ThrowsOnNullConnection()
    {
        Action act = () => new SqlServerMetadataReader(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_AcceptsValidConnection()
    {
        // Doesn't open the connection — just constructs the reader.
        using var connection = new SqlConnection("Server=.;Database=tempdb;Integrated Security=True;TrustServerCertificate=True");
        var act = () => new SqlServerMetadataReader(connection);
        act.Should().NotThrow();
    }

    [Fact]
    public void TablesSql_ReadsFromSysTables_AndSysViews_NotMsShipped()
    {
        var sql = SqlServerMetadataReader.TablesSql;

        sql.Should().Contain("FROM sys.tables");
        sql.Should().Contain("FROM sys.views");
        sql.Should().Contain("is_ms_shipped = 0");
        sql.Should().Contain("UNION ALL");
        sql.Should().Contain("SCHEMA_NAME(t.schema_id)");
        sql.Should().Contain("SCHEMA_NAME(v.schema_id)");
    }

    [Fact]
    public void TablesSql_IncludesRowCountFromPartitions()
    {
        var sql = SqlServerMetadataReader.TablesSql;

        sql.Should().Contain("sys.partitions");
        sql.Should().Contain("SUM(p.rows)");
        sql.Should().Contain("p.index_id IN (0, 1)");  // heap or clustered only
    }

    [Fact]
    public void ColumnsSql_JoinsSysColumns_SysObjects_SysTypes()
    {
        var sql = SqlServerMetadataReader.ColumnsSql;

        sql.Should().Contain("FROM sys.columns");
        sql.Should().Contain("sys.objects");
        sql.Should().Contain("sys.types");
        sql.Should().Contain("o.type IN ('U', 'V')");  // user tables + views
        sql.Should().Contain("c.column_id");
    }

    [Fact]
    public void ColumnsSql_DerivesPrimaryKeyAndForeignKeyFlags()
    {
        var sql = SqlServerMetadataReader.ColumnsSql;

        sql.Should().Contain("sys.indexes");
        sql.Should().Contain("is_primary_key = 1");
        sql.Should().Contain("sys.foreign_key_columns");
        sql.Should().Contain("IsPrimaryKey");
        sql.Should().Contain("IsForeignKey");
    }

    [Fact]
    public void ViewsSql_UsesObjectDefinitionForBody()
    {
        var sql = SqlServerMetadataReader.ViewsSql;

        sql.Should().Contain("FROM sys.views");
        sql.Should().Contain("OBJECT_DEFINITION(v.object_id)");
        sql.Should().Contain("is_ms_shipped = 0");
    }

    [Fact]
    public void ProceduresSql_UsesObjectDefinitionForBody()
    {
        var sql = SqlServerMetadataReader.ProceduresSql;

        sql.Should().Contain("FROM sys.procedures");
        sql.Should().Contain("OBJECT_DEFINITION(p.object_id)");
        sql.Should().Contain("is_ms_shipped = 0");
    }

    [Fact]
    public void UdfsSql_FiltersOnFunctionTypes_AndMapsType()
    {
        var sql = SqlServerMetadataReader.UdfsSql;

        sql.Should().Contain("FROM sys.objects");
        sql.Should().Contain("type IN ('FN', 'IF', 'TF')");
        sql.Should().Contain("'scalar'");
        sql.Should().Contain("'inline-table'");
        sql.Should().Contain("'multi-statement-table'");
    }

    [Fact]
    public void TriggersSql_AggregatesEventsViaXmlPath_AndJoinsSysObjectsForParent()
    {
        var sql = SqlServerMetadataReader.TriggersSql;

        sql.Should().Contain("FROM sys.triggers");
        sql.Should().Contain("sys.trigger_events");
        sql.Should().Contain("FOR XML PATH('')");
        sql.Should().Contain("is_instead_of_trigger");
        sql.Should().Contain("parent_class = 1");  // table-bound triggers only
    }

    [Fact]
    public void ConstraintsSql_UnionsAllFourConstraintTypes()
    {
        var sql = SqlServerMetadataReader.ConstraintsSql;

        sql.Should().Contain("sys.key_constraints");
        sql.Should().Contain("sys.foreign_keys");
        sql.Should().Contain("sys.check_constraints");
        sql.Should().Contain("sys.default_constraints");
        sql.Should().Contain("'PRIMARY_KEY'");
        sql.Should().Contain("'UNIQUE'");
        sql.Should().Contain("'FOREIGN_KEY'");
        sql.Should().Contain("'CHECK'");
        sql.Should().Contain("'DEFAULT'");
    }

    [Fact]
    public void AllSqlConstants_ContainNoSqlInjectionVectors()
    {
        // The reader uses static SQL — no string concatenation with user input.
        // Verify each constant is a hardcoded string with no parameters.
        var sqls = new[]
        {
            SqlServerMetadataReader.TablesSql,
            SqlServerMetadataReader.ColumnsSql,
            SqlServerMetadataReader.ViewsSql,
            SqlServerMetadataReader.ProceduresSql,
            SqlServerMetadataReader.UdfsSql,
            SqlServerMetadataReader.TriggersSql,
            SqlServerMetadataReader.ConstraintsSql
        };

        foreach (var sql in sqls)
        {
            sql.Should().NotContain("@");          // no SQL parameters
            sql.Should().NotBeNullOrWhiteSpace();
        }
    }

    [Fact]
    public void AllSqlConstants_ReadFromSysCatalog_NeverUserData()
    {
        // Profile mode is metadata-only by design (Slice B1 contract).
        // Every SQL must read from sys.* — never from user tables.
        var sqls = new[]
        {
            SqlServerMetadataReader.TablesSql,
            SqlServerMetadataReader.ColumnsSql,
            SqlServerMetadataReader.ViewsSql,
            SqlServerMetadataReader.ProceduresSql,
            SqlServerMetadataReader.UdfsSql,
            SqlServerMetadataReader.TriggersSql,
            SqlServerMetadataReader.ConstraintsSql
        };

        foreach (var sql in sqls)
        {
            sql.Should().Contain("sys.", because: "profiler reads only catalog metadata");
        }
    }
}
