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
using TerraFusion.Core.DTOs.Sync;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Comps.Api;

/// <summary>
/// Slice C38-B integration tests for the
/// <c>GET /api/sync/comps/eligible</c> endpoint exposed by
/// <see cref="SyncController.GetEligibleComps"/>.
///
/// <para>Exercises the controller action directly (not via an
/// HttpClient) — the action is a thin adapter over the C37-B reader,
/// so the per-test surface stays small. Auth is simulated by
/// populating <see cref="HttpContext.User"/> with a
/// <c>countyId</c> claim, mirroring how
/// <c>AddTerraFusionAuthentication</c> populates the principal in
/// production. The reader itself runs against a real EF InMemory
/// DbContext seeded with canonical landing rows so the
/// Qualified-only contract is mechanically asserted on every
/// request.</para>
///
/// <para>Locks the C38-A contract:
/// <list type="bullet">
/// <item>200 happy path returns DTO list ordered by
///   <c>ChgOfOwnerId</c>.</item>
/// <item>200 with empty array for a county with zero Qualified
///   rows.</item>
/// <item>200 with workbook-pin filtering.</item>
/// <item>400 for empty <c>countyId</c>.</item>
/// <item>403 for cross-county access.</item>
/// <item>403 when the principal has no <c>countyId</c> claim.</item>
/// <item>Read-only — pre/post DB snapshot equality.</item>
/// </list>
/// (401 / 405 are framework-level and not exercised at the action
/// layer; they're enforced by the [Authorize] attribute and
/// [HttpGet] route table respectively. The C38-A policy locks them;
/// the framework enforces them.)
/// </para>
/// </summary>
public class SyncControllerCompsEligibleTests
{
    private const string OperatorId = "c38b-test";

    // ── Test scaffolding ────────────────────────────────────────────────

    private static TerraFusionDbContext CreateDb(string name)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();
        return new TerraFusionDbContext(options, configuration);
    }

    private static SyncController BuildController(
        TerraFusionDbContext db,
        Guid? principalCountyClaim)
    {
        var qualification = new Mock<ISaleQualificationService>().Object;
        var compReader    = new SalesCompEligibilityReader(db);

        var controller = new SyncController(
            qualification,
            db,
            NullLogger<SyncController>.Instance,
            compReader);

        // Simulate the authenticated principal. When the claim is
        // null we leave the principal anonymous, mirroring an
        // unauthenticated call (used to drive the 403 path because
        // [Authorize] enforcement is upstream of the action and is
        // not part of this test's surface).
        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
            },
        };

        return controller;
    }

    private static async Task<County> SeedCountyAsync(TerraFusionDbContext db, string name, string fips)
    {
        var county = new County
        {
            Id = Guid.NewGuid(), Name = name, State = "WA", FipsCode = fips,
        };
        db.Counties.Add(county);
        await db.SaveChangesAsync();
        return county;
    }

    private static CanonicalSaleQualification BuildRow(
        Guid countyId,
        int chgOfOwnerId,
        CanonicalSaleQualificationDecision decision,
        Guid sourceWorkbookId,
        DateTime sourceWorkbookLockedAt,
        string? wacSource = null,
        string? wacCanonical = null,
        string? ratioSource = null,
        string? ratioCanonical = null)
    {
        var (wacAxis, ratioAxis) = decision switch
        {
            CanonicalSaleQualificationDecision.Qualified =>
                (CanonicalSaleAxisDecision.Qualified, CanonicalSaleAxisDecision.Qualified),
            CanonicalSaleQualificationDecision.Excluded =>
                (CanonicalSaleAxisDecision.Excluded, CanonicalSaleAxisDecision.Qualified),
            _ =>
                (CanonicalSaleAxisDecision.NotMapped, CanonicalSaleAxisDecision.NotMapped),
        };
        var nowUtc = DateTime.UtcNow;
        return new CanonicalSaleQualification
        {
            CountyId                    = countyId,
            ChgOfOwnerId                = chgOfOwnerId,
            ComputedDecision            = decision,
            WacCdSourceValue            = wacSource,
            WacCdCanonicalValue         = wacCanonical,
            WacCdAxisDecision           = wacAxis,
            SlRatioTypeCdSourceValue    = ratioSource,
            SlRatioTypeCdCanonicalValue = ratioCanonical,
            SlRatioTypeCdAxisDecision   = ratioAxis,
            SourceWorkbookId            = sourceWorkbookId,
            SourceWorkbookLockedAt      = sourceWorkbookLockedAt,
            CreatedAt                   = nowUtc,
            UpdatedAt                   = nowUtc,
            CreatedBy                   = OperatorId,
            UpdatedBy                   = OperatorId,
        };
    }

    // ── 200 OK — happy path ─────────────────────────────────────────────

    [Fact]
    public async Task GetEligibleComps_ReturnsQualifiedDtosOrderedAscending()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 2 Qualified, 1 Excluded, 1 Inconclusive — only Qualified
        // should appear in the response.
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1003, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale",
                ratioSource: "00", ratioCanonical: "Conventional"),
            BuildRow(county.Id, 1001, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale",
                ratioSource: "00", ratioCanonical: "Conventional"),
            BuildRow(county.Id, 1002, CanonicalSaleQualificationDecision.Excluded, wb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 1004, CanonicalSaleQualificationDecision.Inconclusive, wb, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetEligibleComps(county.Id, workbookId: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject.ToList();

        dtos.Should().HaveCount(2);
        dtos.Select(d => d.ChgOfOwnerId).Should().Equal(1001, 1003);
        dtos.Should().OnlyContain(d => d.WacCdCanonicalValue == "ArmsLengthSale");
        dtos.Should().OnlyContain(d => d.SourceWorkbookId == wb);
    }

    [Fact]
    public async Task GetEligibleComps_ReturnsEmptyArrayWhenCountyHasNoQualifiedRows()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Only Excluded and Inconclusive — comp pool is empty, but
        // that's a 200 OK with [], NOT a 404.
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 2001, CanonicalSaleQualificationDecision.Excluded, wb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 2002, CanonicalSaleQualificationDecision.Inconclusive, wb, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetEligibleComps(county.Id, workbookId: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject.ToList();
        dtos.Should().BeEmpty();
    }

    [Fact]
    public async Task GetEligibleComps_ReturnsEmptyArrayWhenCountyHasNoCanonicalRowsAtAll()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetEligibleComps(county.Id, workbookId: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject;
        dtos.Should().BeEmpty();
    }

    // ── Workbook-pin opt-in (Hard Guard 7) ──────────────────────────────

    [Fact]
    public async Task GetEligibleComps_AppliesWorkbookPinWhenSpecified()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 3001, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 3002, CanonicalSaleQualificationDecision.Qualified, newWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);

        // Unpinned: both rows.
        var unpinnedResult = await controller.GetEligibleComps(county.Id, workbookId: null);
        var unpinned = ((OkObjectResult)unpinnedResult).Value.Should()
            .BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject.ToList();
        unpinned.Should().HaveCount(2);

        // Pinned to old: just 3001.
        var pinnedOldResult = await controller.GetEligibleComps(county.Id, workbookId: oldWb);
        var pinnedOld = ((OkObjectResult)pinnedOldResult).Value.Should()
            .BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject.ToList();
        pinnedOld.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(3001);

        // Pinned to new: just 3002.
        var pinnedNewResult = await controller.GetEligibleComps(county.Id, workbookId: newWb);
        var pinnedNew = ((OkObjectResult)pinnedNewResult).Value.Should()
            .BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject.ToList();
        pinnedNew.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(3002);
    }

    [Fact]
    public async Task GetEligibleComps_TreatsEmptyWorkbookGuidAsUnpinned()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 4001, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetEligibleComps(county.Id, workbookId: Guid.Empty);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject.ToList();
        dtos.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(4001);
    }

    // ── 400 — missing / malformed countyId ──────────────────────────────

    [Fact]
    public async Task GetEligibleComps_ReturnsBadRequestWhenCountyIdEmpty()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.GetEligibleComps(Guid.Empty, workbookId: null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        bad.Value.Should().NotBeNull();
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        json.Should().Contain("countyId");
    }

    // ── 403 — county isolation (Hard Guard 3) ───────────────────────────

    [Fact]
    public async Task GetEligibleComps_RefusesCrossCountyRequestWith403()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Seed Qualified rows in Benton; principal authorized for
        // Yakima asks for Benton's comps. Must 403; must not leak rows.
        db.CanonicalSaleQualifications.Add(
            BuildRow(benton.Id, 5001, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.GetEligibleComps(benton.Id, workbookId: null);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetEligibleComps_RefusesPrincipalWithoutCountyClaimWith403()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        // principalCountyClaim: null → no countyId claim on the
        // principal. Expected behavior: 403 (cannot enforce
        // isolation, fail closed).
        var controller = BuildController(db, principalCountyClaim: null);

        var result = await controller.GetEligibleComps(county.Id, workbookId: null);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetEligibleComps_AllowsSelfCountyAccess()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 6001, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetEligibleComps(county.Id, workbookId: null);

        result.Should().BeOfType<OkObjectResult>();
    }

    // ── Read-only contract ──────────────────────────────────────────────

    [Fact]
    public async Task GetEligibleComps_DoesNotMutateAnyState()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 7001, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 7002, CanonicalSaleQualificationDecision.Excluded, wb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 7003, CanonicalSaleQualificationDecision.Inconclusive, wb, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var pre = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new { r.ChgOfOwnerId, r.ComputedDecision, r.UpdatedAt, r.UpdatedBy })
            .ToListAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetEligibleComps(county.Id, workbookId: null);
        await controller.GetEligibleComps(county.Id, workbookId: wb);

        var post = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new { r.ChgOfOwnerId, r.ComputedDecision, r.UpdatedAt, r.UpdatedBy })
            .ToListAsync();

        post.Should().BeEquivalentTo(pre);
    }

    // ── DTO projection completeness ─────────────────────────────────────

    [Fact]
    public async Task GetEligibleComps_ProjectsAllPublicFieldsToDto()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        var saleDate = new DateTime(2025, 7, 18, 0, 0, 0, DateTimeKind.Utc);

        var row = BuildRow(county.Id, 8001, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
            wacSource: "458-61A-203(1)",
            wacCanonical: "ArmsLengthSale",
            ratioSource: "00",
            ratioCanonical: "Conventional");
        row.SaleDate = saleDate;
        row.SalePrice = 525000m;
        db.CanonicalSaleQualifications.Add(row);
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetEligibleComps(county.Id, workbookId: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeAssignableTo<IEnumerable<CompEligibleSaleDto>>().Subject.Single();

        dto.ChgOfOwnerId.Should().Be(8001);
        dto.WacCdSourceValue.Should().Be("458-61A-203(1)");
        dto.WacCdCanonicalValue.Should().Be("ArmsLengthSale");
        dto.SlRatioTypeCdSourceValue.Should().Be("00");
        dto.SlRatioTypeCdCanonicalValue.Should().Be("Conventional");
        dto.SaleDate.Should().Be(saleDate);
        dto.SalePrice.Should().Be(525000m);
        dto.SourceWorkbookId.Should().Be(wb);
        dto.SourceWorkbookLockedAt.Should().Be(lockedAt);
    }
}
