using System;
using System.Threading;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.Core.DTOs.Sync;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema.Api;

/// <summary>
/// Slice C48-D unit tests for
/// <c>GET /api/sync/schema/catalog/summary</c>. Verifies both the
/// configured (catalog registered → real coverage + version) and
/// not-configured (catalog absent → <c>Configured = false</c>)
/// paths through <see cref="SyncController.GetSchemaCatalogSummary"/>.
/// </summary>
public sealed class SchemaCatalogSummaryEndpointTests
{
    [Fact]
    public async Task NotConfigured_ReturnsOkWithConfiguredFalseAndNullFields()
    {
        // No IPacsSchemaCatalog registered.
        var (controller, services) = BuildController(registerCatalog: false);

        var result = controller.GetSchemaCatalogSummary(services);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<SchemaCatalogSummaryDto>().Subject;

        dto.Configured.Should().BeFalse();
        dto.TableCount.Should().BeNull();
        dto.ColumnCount.Should().BeNull();
        dto.DictionaryCount.Should().BeNull();
        dto.PacsRelease.Should().BeNull();
        dto.IngestedAtUtc.Should().BeNull();

        await Task.CompletedTask;
    }

    [Fact]
    public async Task Configured_ReturnsCoverageAndVersionFromRegisteredCatalog()
    {
        var (controller, services) = BuildController(registerCatalog: true);

        var result = controller.GetSchemaCatalogSummary(services);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<SchemaCatalogSummaryDto>().Subject;

        dto.Configured.Should().BeTrue();
        dto.TableCount.Should().Be(3);
        dto.ColumnCount.Should().Be(9);
        dto.DictionaryCount.Should().Be(1);
        dto.PacsRelease.Should().Be("PACS-9.0.4-fixture");
        dto.IngestedAtUtc.Should().NotBeNull();

        await Task.CompletedTask;
    }

    [Fact]
    public void Configured_PassesThroughCatalogVersionFromLiveSourceShape()
    {
        // Verify the endpoint correctly surfaces a LivePacsSchemaSource
        // -shaped catalog (UTC ingest, operator-supplied PacsRelease label).
        // This proves the wiring works for the production opt-in path even
        // when no live SQL connection is available.
        var fake = new TerraFusion.Unit.Tests.Sync.Schema.FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("sale"));
        fake.Columns.Add(new IntrospectedColumn("sale", "chg_of_owner_id", "int", false, 1));
        fake.PrimaryKeys.Add(new IntrospectedPrimaryKeyMember("sale", "chg_of_owner_id", 1));

        var liveSource = new LivePacsSchemaSource(
            fake,
            new LivePacsSchemaSourceOptions("test-source-label", "dbo", "Harris PACS 9.0.4.2"));

        var (controller, services) = BuildController(catalog: BuildCatalogFromSource(liveSource));

        var result = controller.GetSchemaCatalogSummary(services);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<SchemaCatalogSummaryDto>().Subject;

        dto.Configured.Should().BeTrue();
        dto.TableCount.Should().Be(1);
        dto.PacsRelease.Should().Be("Harris PACS 9.0.4.2");
        dto.IngestedAtUtc!.Value.Kind.Should().Be(DateTimeKind.Utc);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Test scaffolding
    // ────────────────────────────────────────────────────────────────────────

    private static (SyncController controller, IServiceProvider services) BuildController(
        bool registerCatalog = false)
    {
        IPacsSchemaCatalog? catalog = registerCatalog ? BuildFixtureCatalog() : null;
        return BuildController(catalog);
    }

    private static (SyncController controller, IServiceProvider services) BuildController(
        IPacsSchemaCatalog? catalog)
    {
        var db = CreateDb($"schema-summary-{Guid.NewGuid()}");

        var qualification = new Mock<ISaleQualificationService>().Object;
        var compReader = new Mock<ISalesCompEligibilityReader>().Object;
        var activeWorkbook = new SyncCountyActiveWorkbookService(db);
        var staleReader = new Mock<ISalesCompStaleReader>().Object;
        var staleSummaryReader = new Mock<ISalesCompStaleSummaryReader>().Object;

        var controller = new SyncController(
            qualification, db, NullLogger<SyncController>.Instance,
            compReader, activeWorkbook, staleReader, staleSummaryReader);

        var serviceCollection = new ServiceCollection();
        if (catalog is not null)
        {
            serviceCollection.AddSingleton(catalog);
        }
        var services = serviceCollection.BuildServiceProvider();

        return (controller, services);
    }

    private static TerraFusionDbContext CreateDb(string name)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();
        return new TerraFusionDbContext(options, configuration);
    }

    private static IPacsSchemaCatalog BuildFixtureCatalog()
    {
        var data = TerraFusion.Unit.Tests.Sync.Schema.PacsSchemaCatalogTestFixture.BuildRepresentative();
        var source = new InMemoryPacsSchemaSource(data);
        return PacsSchemaCatalog.BuildAsync(source, CancellationToken.None).GetAwaiter().GetResult();
    }

    private static IPacsSchemaCatalog BuildCatalogFromSource(IPacsSchemaSource source) =>
        PacsSchemaCatalog.BuildAsync(source, CancellationToken.None).GetAwaiter().GetResult();
}
