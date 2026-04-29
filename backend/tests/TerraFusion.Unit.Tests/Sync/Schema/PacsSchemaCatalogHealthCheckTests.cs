using System.Threading;
using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C48-B unit tests for <see cref="PacsSchemaCatalogHealthCheck"/>.
/// Verifies the coverage gate per the C48-A C48-B implementation
/// contract preview point 7.
/// </summary>
public sealed class PacsSchemaCatalogHealthCheckTests
{
    [Fact]
    public async Task Healthy_WhenCoverageMeetsFloor()
    {
        var catalog = await BuildFixtureCatalog();
        var floor = new PacsSchemaCatalogCoverageFloor(MinTables: 3, MinColumns: 9, MinDictionaries: 1);
        var sut = new PacsSchemaCatalogHealthCheck(catalog, floor);

        var result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Data["TableCount"].Should().Be(3);
        result.Data["ColumnCount"].Should().Be(9);
        result.Data["DictionaryCount"].Should().Be(1);
        result.Data["TylerRelease"].Should().Be("PACS-9.0.4-fixture");
    }

    [Fact]
    public async Task Degraded_WhenCoverageBelowFloor()
    {
        var catalog = await BuildFixtureCatalog();
        var floor = new PacsSchemaCatalogCoverageFloor(MinTables: 100, MinColumns: 1500, MinDictionaries: 30);
        var sut = new PacsSchemaCatalogHealthCheck(catalog, floor);

        var result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("coverage below configured floor");
        result.Data["FloorTables"].Should().Be(100);
        result.Data["FloorColumns"].Should().Be(1500);
        result.Data["FloorDictionaries"].Should().Be(30);
    }

    [Fact]
    public async Task Healthy_WhenFloorNoneRegardlessOfCoverage()
    {
        var catalog = await BuildFixtureCatalog();
        var sut = new PacsSchemaCatalogHealthCheck(catalog, PacsSchemaCatalogCoverageFloor.None);

        var result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    private static async Task<IPacsSchemaCatalog> BuildFixtureCatalog()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var source = new InMemoryPacsSchemaSource(data);
        return await PacsSchemaCatalog.BuildAsync(source, CancellationToken.None);
    }
}
