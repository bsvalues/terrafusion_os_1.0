using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: thin endpoint contract test for the
/// <c>GET /api/sync/doctrine/policy/sales-qualification/audit</c>
/// endpoint. Exercises the controller method directly (rather than
/// via WebApplicationFactory) since the controller logic is a thin
/// pass-through and the underlying audit service is exhaustively
/// covered by <see cref="DoctrineSalesAuditServiceTests"/>.
/// </summary>
public sealed class DoctrinePolicySalesAuditEndpointTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public DoctrinePolicySalesAuditEndpointTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"sync-d5-endpoint-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private DoctrinePolicyController BuildController()
        => new(_db, NullLogger<DoctrinePolicyController>.Instance);

    private IDoctrineSalesAuditService BuildAudit()
        => new DoctrineSalesAuditService(_db, NullLogger<DoctrineSalesAuditService>.Instance);

    [Fact]
    public async Task AuditSalesQualification_returns_OK_with_report()
    {
        await new SalesQualificationCodesSeeder(
            _db, NullLogger<SalesQualificationCodesSeeder>.Instance).SeedAsync();

        var controller = BuildController();
        var result = await controller.AuditSalesQualification(BuildAudit(), default);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var report = ok.Value.Should().BeOfType<DoctrineSalesAuditReport>().Subject;
        report.DoctrineState.TotalRules.Should().Be(3);
        report.PromoterAlignment.AlignedWithDoctrine.Should().BeTrue();
    }

    [Fact]
    public async Task AuditSalesQualification_on_empty_table_still_returns_OK()
    {
        var controller = BuildController();
        var result = await controller.AuditSalesQualification(BuildAudit(), default);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var report = ok.Value.Should().BeOfType<DoctrineSalesAuditReport>().Subject;
        report.DoctrineState.TotalRules.Should().Be(0);
        report.YearAwarenessCheck.Post2017DorRule.Should().Be("MISSING");
    }
}
