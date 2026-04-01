// W1C proof-wall tests — GovernedToolAuditService null-row fix.
// ALL prior tests mocked IGovernedToolAuditService; this file exercises the real path.

using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Stage2;

[Trait("Category", "Stage2")]
public sealed class GovernedToolAuditServiceTests
{
    private static readonly Guid BentonCountyId = new("11111111-1111-1111-1111-111111111111");

    // ── DbContext factory ─────────────────────────────────────────────

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"AuditSvc-{name}-{Guid.NewGuid()}")
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    private static async Task SeedCounty(DataDbContext db, Guid countyId, string name = "Benton", string fips = "003")
    {
        if (!await db.Counties.AnyAsync(c => c.Id == countyId))
        {
            db.Counties.Add(new County { Id = countyId, Name = name, State = "WA", FipsCode = fips });
            await db.SaveChangesAsync();
        }
    }

    // ── Service-isolation: proves LogInvocationAsync writes exactly one row ──

    [Fact]
    public async Task LogInvocationAsync_WritesExactlyOneAuditRow()
    {
        await using var db = CreateDbContext(nameof(LogInvocationAsync_WritesExactlyOneAuditRow));
        var svc = new GovernedToolAuditService(db, NullLogger<GovernedToolAuditService>.Instance);

        await svc.LogInvocationAsync(
            "check_exemption_eligibility",
            "12345-001",
            "test-user",
            "eligible",
            CancellationToken.None);

        var rows = await db.AuditLogs
            .Where(a => a.Type.StartsWith("DAIS_TOOL:"))
            .ToListAsync();

        rows.Should().HaveCount(1);
        rows[0].Type.Should().Be("DAIS_TOOL:check_exemption_eligibility");
        rows[0].Source.Should().Be("GovernedToolAuditService");
        rows[0].UserId.Should().Be("test-user");
    }

    [Fact]
    public async Task LogInvocationAsync_TwoDistinctTools_WritesTwoRows()
    {
        await using var db = CreateDbContext(nameof(LogInvocationAsync_TwoDistinctTools_WritesTwoRows));
        var svc = new GovernedToolAuditService(db, NullLogger<GovernedToolAuditService>.Instance);

        await svc.LogInvocationAsync("check_exemption_eligibility", "parcel-1", "user-a", "eligible", CancellationToken.None);
        await svc.LogInvocationAsync("create_exemption", "parcel-2", "user-b", "created", CancellationToken.None);

        var rows = await db.AuditLogs
            .Where(a => a.Type.StartsWith("DAIS_TOOL:"))
            .OrderBy(a => a.Timestamp)
            .ToListAsync();

        rows.Should().HaveCount(2);
        rows.Select(r => r.Type).Should().Contain("DAIS_TOOL:check_exemption_eligibility");
        rows.Select(r => r.Type).Should().Contain("DAIS_TOOL:create_exemption");
    }

    // ── Mock verification: CheckExemptionEligibility calls audit service exactly once ──

    [Fact]
    public async Task CheckExemptionEligibility_CallsAuditServiceOnce_WithCorrectArgs()
    {
        await using var db = CreateDbContext(nameof(CheckExemptionEligibility_CallsAuditServiceOnce_WithCorrectArgs));
        await SeedCounty(db, BentonCountyId);

        var auditMock = new Mock<IGovernedToolAuditService>();
        auditMock
            .Setup(a => a.LogInvocationAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var controller = BuildController(db, auditMock.Object);

        var result = await controller.CheckExemptionEligibility(
            county: "Benton", parcelId: "12345-001",
            age: 65, income: 35000m, disability: false);

        result.Should().BeOfType<OkObjectResult>();

        auditMock.Verify(
            a => a.LogInvocationAsync(
                "check_exemption_eligibility",
                "12345-001",
                It.IsAny<string>(),
                "eligible",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ── E2E: real service + real InMemory DB — proves the write path end-to-end ──

    [Fact]
    public async Task CheckExemptionEligibility_WithRealAuditService_WritesOneRow()
    {
        await using var db = CreateDbContext(nameof(CheckExemptionEligibility_WithRealAuditService_WritesOneRow));
        await SeedCounty(db, BentonCountyId);

        var realAudit = new GovernedToolAuditService(db, NullLogger<GovernedToolAuditService>.Instance);
        var controller = BuildController(db, realAudit);

        var result = await controller.CheckExemptionEligibility(
            county: "Benton", parcelId: "12345-001",
            age: 65, income: 35000m, disability: false);

        result.Should().BeOfType<OkObjectResult>();

        var rows = await db.AuditLogs
            .Where(a => a.Type == "DAIS_TOOL:check_exemption_eligibility")
            .ToListAsync();

        rows.Should().HaveCount(1, because: "GovernedToolAuditService must write exactly one row per Dais tool call");
        rows[0].Source.Should().Be("GovernedToolAuditService");
        rows[0].UserId.Should().Be("anonymous", because: "controller has no name claim so fallback is 'anonymous'");
    }

    // ── Helper ────────────────────────────────────────────────────────

    private static DaisController BuildController(DataDbContext db, IGovernedToolAuditService audit)
    {
        var controller = new DaisController(
            db,
            NullLogger<DaisController>.Instance,
            new Mock<IExemptionService>().Object,
            new Mock<IAppealService>().Object,
            new Mock<ICertificationService>().Object,
            new Mock<INoticeService>().Object,
            new Mock<IQueueService>().Object,
            new Mock<IRequestUserContextAccessor>().Object,
            audit);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim("countyId", BentonCountyId.ToString()),
                    new Claim("countyCode", "BENTON"),
                    new Claim("sub", "test-user"),
                ], "TestAuth"))
            }
        };

        return controller;
    }
}
