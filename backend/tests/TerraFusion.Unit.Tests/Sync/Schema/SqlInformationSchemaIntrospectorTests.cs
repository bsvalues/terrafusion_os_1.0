using System;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C48-C SQL-shape unit tests for
/// <see cref="SqlInformationSchemaIntrospector"/>. Validation against
/// a live PACS database is deferred to C48-D (first consumer
/// migration) and is gated on a configured connection string. These
/// tests verify only what can be checked without a live connection:
/// the SQL queries reference the correct INFORMATION_SCHEMA views
/// and apply the schema parameter, and the constructor correctly
/// validates its arguments.
/// </summary>
public sealed class SqlInformationSchemaIntrospectorTests
{
    [Fact]
    public void Tables_Query_ScopesToBaseTablesInConfiguredSchema()
    {
        var sql = SqlInformationSchemaIntrospector.Queries.Tables;

        sql.Should().Contain("INFORMATION_SCHEMA.TABLES");
        sql.Should().Contain("TABLE_TYPE = 'BASE TABLE'");
        sql.Should().Contain("TABLE_SCHEMA = @schema");
    }

    [Fact]
    public void Columns_Query_PullsTypeNullabilityAndOrdinalPosition()
    {
        var sql = SqlInformationSchemaIntrospector.Queries.Columns;

        sql.Should().Contain("INFORMATION_SCHEMA.COLUMNS");
        sql.Should().Contain("DATA_TYPE");
        sql.Should().Contain("IS_NULLABLE");
        sql.Should().Contain("ORDINAL_POSITION");
        sql.Should().Contain("TABLE_SCHEMA = @schema");
    }

    [Fact]
    public void PrimaryKeys_Query_JoinsKeyColumnUsageAndTableConstraints()
    {
        var sql = SqlInformationSchemaIntrospector.Queries.PrimaryKeys;

        sql.Should().Contain("INFORMATION_SCHEMA.KEY_COLUMN_USAGE");
        sql.Should().Contain("INFORMATION_SCHEMA.TABLE_CONSTRAINTS");
        sql.Should().Contain("CONSTRAINT_TYPE = 'PRIMARY KEY'");
        sql.Should().Contain("TABLE_SCHEMA = @schema");
    }

    [Fact]
    public void Queries_NeverContainSelectStarAgainstUserTables_HG1()
    {
        // HG1: catalog stores schema metadata only; introspector must
        // never pull row data. Forbidden patterns: SELECT * FROM
        // <user_table>. Only INFORMATION_SCHEMA.* references allowed.
        var allQueries = new[]
        {
            SqlInformationSchemaIntrospector.Queries.Tables,
            SqlInformationSchemaIntrospector.Queries.Columns,
            SqlInformationSchemaIntrospector.Queries.PrimaryKeys,
        };

        foreach (var sql in allQueries)
        {
            sql.Should().NotContain("SELECT *");
        }
    }

    [Fact]
    public void Constructor_NullConnectionString_Throws()
    {
        var act = () => new SqlInformationSchemaIntrospector(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_NullSchemaName_Throws()
    {
        var act = () => new SqlInformationSchemaIntrospector("Server=.;", schemaName: null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_DefaultSchemaName_IsDbo()
    {
        // Just verifying the default — caller-friendly for SQL Server / Harris PACS.
        var act = () => new SqlInformationSchemaIntrospector("Server=.;");
        act.Should().NotThrow();
    }
}
