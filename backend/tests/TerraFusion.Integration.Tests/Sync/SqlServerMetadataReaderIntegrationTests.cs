using FluentAssertions;
using TerraFusion.Integration.Tests.Sync.Fixtures;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Integration tests for <see cref="SqlServerMetadataReader"/> against a live
/// SQL Server in Docker (Slice B1.6).
///
/// Run with Docker available:
///   dotnet test --filter "FullyQualifiedName~SqlServerMetadataReaderIntegration"
///
/// Skip in environments without Docker:
///   dotnet test --filter "Category!=DockerRequired"
///
/// First-run container startup takes ~30s; cached image runs are faster.
/// </summary>
[Collection(nameof(SqlServerFixtureCollection))]
[Trait("Category", "DockerRequired")]
public class SqlServerMetadataReaderIntegrationTests
{
    private readonly SqlServerFixture _fixture;

    public SqlServerMetadataReaderIntegrationTests(SqlServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadTablesAsync_FindsSeededUserTables()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var tables = await reader.ReadTablesAsync();

        var userTables = tables.Where(t => !t.IsView).ToList();
        userTables.Should().Contain(t => t.SchemaName == "dbo" && t.TableName == "test_property");
        userTables.Should().Contain(t => t.SchemaName == "dbo" && t.TableName == "test_assessment");

        var propertyTable = userTables.Single(t => t.TableName == "test_property");
        propertyTable.ColumnCount.Should().Be(3); // prop_id, geo_id, address
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadTablesAsync_FindsSeededViews_FlaggedAsIsView()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var tables = await reader.ReadTablesAsync();

        var view = tables.SingleOrDefault(t => t.TableName == "vw_test_active_properties");
        view.Should().NotBeNull();
        view!.IsView.Should().BeTrue();
        view.RowCountEstimate.Should().BeNull();  // views don't have row counts
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadColumnsAsync_DerivesPrimaryKeyFlag()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var columns = await reader.ReadColumnsAsync();

        var propIdOnProperty = columns.Single(c =>
            c.TableName == "test_property" && c.ColumnName == "prop_id");

        propIdOnProperty.IsPrimaryKey.Should().BeTrue();
        propIdOnProperty.IsNullable.Should().BeFalse();
        propIdOnProperty.OrdinalPosition.Should().Be(1);
        propIdOnProperty.DataType.Should().Be("int");
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadColumnsAsync_DerivesForeignKeyFlag()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var columns = await reader.ReadColumnsAsync();

        var fkCol = columns.Single(c =>
            c.TableName == "test_assessment" && c.ColumnName == "prop_id");

        fkCol.IsForeignKey.Should().BeTrue();
        fkCol.IsPrimaryKey.Should().BeFalse();
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadColumnsAsync_CapturesDefaultExpression()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var columns = await reader.ReadColumnsAsync();

        var addressCol = columns.Single(c =>
            c.TableName == "test_property" && c.ColumnName == "address");

        addressCol.DefaultValue.Should().NotBeNull();
        addressCol.DefaultValue.Should().Contain("unknown");
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadViewsAsync_PreservesDefinitionBody()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var views = await reader.ReadViewsAsync();

        var view = views.Single(v => v.ViewName == "vw_test_active_properties");
        view.Definition.Should().Contain("FROM dbo.test_property");
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadProceduresAsync_PreservesDefinitionBody()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var procs = await reader.ReadProceduresAsync();

        var proc = procs.Single(p => p.ProcedureName == "usp_test_get_property");
        proc.Definition.Should().Contain("@PropId");
        proc.Definition.Should().Contain("FROM dbo.test_property");
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadUdfsAsync_ClassifiesScalarFunction()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var udfs = await reader.ReadUdfsAsync();

        var fn = udfs.Single(f => f.FunctionName == "fn_test_normalize");
        fn.FunctionType.Should().Be("scalar");
        fn.Definition.Should().Contain("UPPER");
        fn.Definition.Should().Contain("LTRIM");
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadTriggersAsync_CapturesTimingAndEvents()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var triggers = await reader.ReadTriggersAsync();

        var trigger = triggers.Single(t => t.TriggerName == "trg_test_property_audit");
        trigger.ParentTableName.Should().Be("test_property");
        trigger.IsAfter.Should().BeTrue();
        trigger.IsInsteadOf.Should().BeFalse();
        trigger.Events.Should().Contain("INSERT");
        trigger.Events.Should().Contain("UPDATE");
    }

    [Fact]
    public async System.Threading.Tasks.Task ReadConstraintsAsync_FindsAllFourTypes()
    {
        await using var conn = await _fixture.OpenConnectionAsync();
        var reader = new SqlServerMetadataReader(conn);

        var constraints = await reader.ReadConstraintsAsync();

        var byType = constraints
            .GroupBy(c => c.ConstraintType)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Primary keys on both seeded tables
        byType.Should().ContainKey("PRIMARY_KEY");
        byType["PRIMARY_KEY"].Should().Contain(c => c.ConstraintName == "PK_test_property");
        byType["PRIMARY_KEY"].Should().Contain(c => c.ConstraintName == "PK_test_assessment");

        // FK from test_assessment to test_property
        byType.Should().ContainKey("FOREIGN_KEY");
        byType["FOREIGN_KEY"].Should().Contain(c => c.ConstraintName == "FK_test_assessment_property");
        var fk = byType["FOREIGN_KEY"].Single(c => c.ConstraintName == "FK_test_assessment_property");
        fk.ReferencedTable.Should().Be("test_property");
        fk.ReferencedColumns.Should().Be("prop_id");

        // CHECK on market_value
        byType.Should().ContainKey("CHECK");
        byType["CHECK"].Should().Contain(c => c.ConstraintName == "CK_test_assessment_value_nonnegative");
        byType["CHECK"].Single(c => c.ConstraintName == "CK_test_assessment_value_nonnegative")
            .Definition.Should().Contain("market_value");

        // DEFAULT on address column
        byType.Should().ContainKey("DEFAULT");
        byType["DEFAULT"].Should().Contain(c => c.ConstraintName == "DF_test_property_address");
    }
}
