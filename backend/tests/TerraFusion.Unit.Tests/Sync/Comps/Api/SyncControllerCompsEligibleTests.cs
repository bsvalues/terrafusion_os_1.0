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
/// Slice C38-B + C39-B integration tests for the
/// <c>GET /api/sync/comps/eligible</c> endpoint exposed by
/// <see cref="SyncController.GetEligibleComps"/>.
///
/// <para>Asserts the C38-A endpoint contract (auth, county
/// isolation, read-only, no PII, idempotent, workbook-pin opt-in)
/// AND the C39-A pagination contract (default 1/100, max 500,
/// envelope shape, deterministic ordering across pages,
/// past-the-end semantics).</para>
///
/// <para>Auth is simulated by populating <see cref="HttpContext.User"/>
/// with a <c>countyId</c> claim, mirroring how
/// <c>AddTerraFusionAuthentication</c> populates the principal in
/// production. The reader runs against a real EF InMemory DbContext
/// seeded with canonical landing rows so the Qualified-only +
/// pagination contracts are mechanically asserted on every
/// request.</para>
///
/// <para>401 / 405 are framework-level and not exercised at the
/// action layer; they're enforced upstream by the [Authorize]
/// attribute and the [HttpGet] route table respectively.</para>
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

    private static PagedCompEligibleSalesDto AssertOkEnvelope(IActionResult result)
    {
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        return ok.Value.Should().BeOfType<PagedCompEligibleSalesDto>().Subject;
    }

    private static async Task SeedQualifiedRowsAsync(
        TerraFusionDbContext db,
        Guid countyId,
        Guid workbookId,
        DateTime lockedAt,
        IEnumerable<int> ids)
    {
        foreach (var id in ids)
        {
            db.CanonicalSaleQualifications.Add(
                BuildRow(countyId, id, CanonicalSaleQualificationDecision.Qualified, workbookId, lockedAt,
                    wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale",
                    ratioSource: "00", ratioCanonical: "Conventional"));
        }
        await db.SaveChangesAsync();
    }

    // ════════════════════════════════════════════════════════════════════
    //  C38-B contract (carried forward + envelope-shaped)
    // ════════════════════════════════════════════════════════════════════

    // ── 200 OK — happy path ─────────────────────────────────────────────

    [Fact]
    public async Task GetEligibleComps_ReturnsQualifiedDtosOrderedAscending()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

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

        var result = await controller.GetEligibleComps(county.Id, workbookId: null, page: null, pageSize: null);

        var env = AssertOkEnvelope(result);
        env.Items.Should().HaveCount(2);
        env.Items.Select(d => d.ChgOfOwnerId).Should().Equal(1001, 1003);
        env.Items.Should().OnlyContain(d => d.WacCdCanonicalValue == "ArmsLengthSale");
        env.Items.Should().OnlyContain(d => d.SourceWorkbookId == wb);
        env.TotalCount.Should().Be(2);
        env.TotalPages.Should().Be(1);
        env.Page.Should().Be(1);
        env.PageSize.Should().Be(100);
        env.HasNextPage.Should().BeFalse();
        env.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public async Task GetEligibleComps_ReturnsEmptyEnvelopeWhenCountyHasNoQualifiedRows()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 2001, CanonicalSaleQualificationDecision.Excluded, wb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 2002, CanonicalSaleQualificationDecision.Inconclusive, wb, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetEligibleComps(county.Id, null, null, null);

        var env = AssertOkEnvelope(result);
        env.Items.Should().BeEmpty();
        env.TotalCount.Should().Be(0);
        env.TotalPages.Should().Be(0);
        env.HasNextPage.Should().BeFalse();
        env.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public async Task GetEligibleComps_ReturnsEmptyEnvelopeWhenCountyHasNoCanonicalRowsAtAll()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetEligibleComps(county.Id, null, null, null);

        var env = AssertOkEnvelope(result);
        env.Items.Should().BeEmpty();
        env.TotalCount.Should().Be(0);
        env.TotalPages.Should().Be(0);
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

        var unpinned = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, null, null));
        unpinned.Items.Should().HaveCount(2);
        unpinned.TotalCount.Should().Be(2);

        var pinnedOld = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, oldWb, null, null));
        pinnedOld.Items.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(3001);
        pinnedOld.TotalCount.Should().Be(1);

        var pinnedNew = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, newWb, null, null));
        pinnedNew.Items.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(3002);
        pinnedNew.TotalCount.Should().Be(1);
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
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, Guid.Empty, null, null));
        env.Items.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(4001);
    }

    // ── 400 — missing / malformed countyId ──────────────────────────────

    [Fact]
    public async Task GetEligibleComps_ReturnsBadRequestWhenCountyIdEmpty()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.GetEligibleComps(Guid.Empty, null, null, null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        json.Should().Contain("countyId");
    }

    // ── 403 — county isolation ──────────────────────────────────────────

    [Fact]
    public async Task GetEligibleComps_RefusesCrossCountyRequestWith403()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.Add(
            BuildRow(benton.Id, 5001, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.GetEligibleComps(benton.Id, null, null, null);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetEligibleComps_RefusesPrincipalWithoutCountyClaimWith403()
    {
        await using var db = CreateDb($"sce-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var controller = BuildController(db, principalCountyClaim: null);

        var result = await controller.GetEligibleComps(county.Id, null, null, null);

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
        var result = await controller.GetEligibleComps(county.Id, null, null, null);

        result.Should().BeOfType<OkObjectResult>();
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
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, null, null));

        var dto = env.Items.Single();
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

    // ════════════════════════════════════════════════════════════════════
    //  C39-B pagination contract (the 13-test matrix)
    // ════════════════════════════════════════════════════════════════════

    // 1. Default first page.
    [Fact]
    public async Task GetEligibleComps_DefaultsApplyWhenPageAndPageSizeOmitted()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        await SeedQualifiedRowsAsync(db, county.Id, wb, lockedAt, Enumerable.Range(1, 5));

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, null, null));

        env.Page.Should().Be(1);
        env.PageSize.Should().Be(100);
        env.Items.Should().HaveCount(5);
        env.TotalCount.Should().Be(5);
        env.TotalPages.Should().Be(1);
        env.HasNextPage.Should().BeFalse();
        env.HasPreviousPage.Should().BeFalse();
    }

    // 2. Explicit page and pageSize.
    [Fact]
    public async Task GetEligibleComps_AppliesExplicitPageAndPageSize()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        await SeedQualifiedRowsAsync(db, county.Id, wb, lockedAt, Enumerable.Range(1, 25));

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, page: 2, pageSize: 10));

        env.Page.Should().Be(2);
        env.PageSize.Should().Be(10);
        env.Items.Should().HaveCount(10);
        env.Items.Select(d => d.ChgOfOwnerId).Should().Equal(Enumerable.Range(11, 10));
        env.TotalCount.Should().Be(25);
        env.TotalPages.Should().Be(3);
        env.HasNextPage.Should().BeTrue();
        env.HasPreviousPage.Should().BeTrue();
    }

    // 3. Past-the-end page.
    [Fact]
    public async Task GetEligibleComps_PastTheEndPageReturnsEmptyItemsWithAccurateMetadata()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        await SeedQualifiedRowsAsync(db, county.Id, wb, lockedAt, Enumerable.Range(1, 50));

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, page: 99, pageSize: 100));

        env.Page.Should().Be(99);
        env.PageSize.Should().Be(100);
        env.Items.Should().BeEmpty();
        env.TotalCount.Should().Be(50);
        env.TotalPages.Should().Be(1);
        env.HasNextPage.Should().BeFalse();
        env.HasPreviousPage.Should().BeTrue(); // overshoot signal
    }

    // 4. Page size at the limit.
    [Fact]
    public async Task GetEligibleComps_AcceptsPageSizeAt500()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        await SeedQualifiedRowsAsync(db, county.Id, wb, lockedAt, Enumerable.Range(1, 600));

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, page: 1, pageSize: 500));

        env.Page.Should().Be(1);
        env.PageSize.Should().Be(500);
        env.Items.Should().HaveCount(500);
        env.TotalCount.Should().Be(600);
        env.TotalPages.Should().Be(2);
        env.HasNextPage.Should().BeTrue();
        env.HasPreviousPage.Should().BeFalse();
    }

    // 5. Page size over the limit.
    [Theory]
    [InlineData(501)]
    [InlineData(1000)]
    [InlineData(99999)]
    public async Task GetEligibleComps_RejectsPageSizeOver500WithBadRequest(int badSize)
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetEligibleComps(county.Id, null, null, badSize);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        json.Should().Contain("pageSize");
        json.Should().Contain("500");
    }

    // 6. Page < 1.
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public async Task GetEligibleComps_RejectsPageBelow1WithBadRequest(int badPage)
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetEligibleComps(county.Id, null, badPage, null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        json.Should().Contain("page");
    }

    // 7. PageSize < 1.
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-50)]
    public async Task GetEligibleComps_RejectsPageSizeBelow1WithBadRequest(int badSize)
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetEligibleComps(county.Id, null, null, badSize);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        json.Should().Contain("pageSize");
    }

    // 8. County isolation preserved with pagination.
    [Fact]
    public async Task GetEligibleComps_PaginationDoesNotBypassCountyIsolation()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        await SeedQualifiedRowsAsync(db, benton.Id, wb, lockedAt, Enumerable.Range(1, 5));

        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.GetEligibleComps(benton.Id, null, page: 1, pageSize: 10);

        result.Should().BeOfType<ForbidResult>();
    }

    // 9. Workbook-pin preserved with pagination.
    [Fact]
    public async Task GetEligibleComps_PaginationRespectsWorkbookPin()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 5 rows in oldWb, 12 rows in newWb. Pinned to newWb +
        // pageSize=5 should return 5 rows on page 1, totalCount=12.
        await SeedQualifiedRowsAsync(db, county.Id, oldWb, lockedAt, Enumerable.Range(100, 5));
        await SeedQualifiedRowsAsync(db, county.Id, newWb, lockedAt, Enumerable.Range(200, 12));

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, newWb, page: 1, pageSize: 5));

        env.Items.Should().HaveCount(5);
        env.Items.Select(d => d.ChgOfOwnerId).Should().Equal(200, 201, 202, 203, 204);
        env.Items.Should().OnlyContain(d => d.SourceWorkbookId == newWb);
        env.TotalCount.Should().Be(12);
        env.TotalPages.Should().Be(3);
    }

    // 10. Empty pool returns full envelope (already covered in C38-B
    //     contract block, but the pagination version verifies metadata
    //     when pagination params are explicit).
    [Fact]
    public async Task GetEligibleComps_EmptyPoolWithExplicitPaginationStillReturnsFullEnvelope()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, page: 5, pageSize: 50));

        env.Items.Should().BeEmpty();
        env.Page.Should().Be(5);
        env.PageSize.Should().Be(50);
        env.TotalCount.Should().Be(0);
        env.TotalPages.Should().Be(0);
        env.HasNextPage.Should().BeFalse();
        env.HasPreviousPage.Should().BeTrue();
    }

    // 11. Deterministic ordering across ≥ 3 pages.
    [Fact]
    public async Task GetEligibleComps_PagesPartitionThePoolWithoutOverlapOrSkip()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 7 pages worth of rows at pageSize=4 → 28 total, last page
        // partial. Insert out of order so the test exercises the
        // server-side OrderBy.
        var ids = new[] { 50, 10, 80, 30, 5, 70, 25, 90, 45, 12, 60, 8,
                          75, 32, 18, 65, 1, 99, 22, 40,
                          88, 14, 55, 28, 95, 38, 6, 72 };
        await SeedQualifiedRowsAsync(db, county.Id, wb, lockedAt, ids);

        var controller = BuildController(db, principalCountyClaim: county.Id);

        var page1 = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, 1, 4));
        var page2 = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, 2, 4));
        var page3 = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, 3, 4));
        var page4 = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, 4, 4));
        var page5 = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, 5, 4));
        var page6 = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, 6, 4));
        var page7 = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, 7, 4));

        var allPagedIds = page1.Items.Concat(page2.Items).Concat(page3.Items)
            .Concat(page4.Items).Concat(page5.Items).Concat(page6.Items).Concat(page7.Items)
            .Select(d => d.ChgOfOwnerId).ToList();

        // No duplicates across pages.
        allPagedIds.Should().OnlyHaveUniqueItems();

        // Union equals the seeded pool.
        allPagedIds.Should().BeEquivalentTo(ids);

        // Each page is internally ascending (verifies page-local
        // ordering is also locked).
        new[] { page1, page2, page3, page4, page5, page6, page7 }
            .ToList()
            .ForEach(p => p.Items.Select(d => d.ChgOfOwnerId).Should().BeInAscendingOrder());

        // Concatenation across pages is also ascending — the
        // strongest cursor-stability invariant.
        allPagedIds.Should().BeInAscendingOrder();
    }

    // 12. Read-only across paginated reads.
    [Fact]
    public async Task GetEligibleComps_PaginatedReadsDoNotMutateAnyState()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        await SeedQualifiedRowsAsync(db, county.Id, wb, lockedAt, Enumerable.Range(1, 30));

        var pre = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new { r.ChgOfOwnerId, r.ComputedDecision, r.UpdatedAt, r.UpdatedBy })
            .ToListAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetEligibleComps(county.Id, null, 1, 10);
        await controller.GetEligibleComps(county.Id, null, 2, 10);
        await controller.GetEligibleComps(county.Id, null, 3, 10);
        await controller.GetEligibleComps(county.Id, wb, 1, 10);

        var post = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new { r.ChgOfOwnerId, r.ComputedDecision, r.UpdatedAt, r.UpdatedBy })
            .ToListAsync();

        post.Should().BeEquivalentTo(pre);
    }

    // 13. Default-form parity with C37-B reader.
    [Fact]
    public async Task GetEligibleComps_DefaultFormMatchesUnpaginatedReaderRowSet()
    {
        await using var db = CreateDb($"sce-pg-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        await SeedQualifiedRowsAsync(db, county.Id, wb, lockedAt, Enumerable.Range(1, 75));

        // Seed Excluded + Inconclusive too — they must NOT appear in
        // either the reader's output or the paginated default response.
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 9001, CanonicalSaleQualificationDecision.Excluded, wb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 9002, CanonicalSaleQualificationDecision.Inconclusive, wb, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var reader = new SalesCompEligibilityReader(db);
        var unpaginated = await reader.ReadAsync(county.Id, sourceWorkbookId: null);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(await controller.GetEligibleComps(county.Id, null, null, null));

        env.Items.Select(d => d.ChgOfOwnerId).Should()
            .Equal(unpaginated.Select(s => s.ChgOfOwnerId));
        env.TotalCount.Should().Be(unpaginated.Count);
        env.Page.Should().Be(1);
        env.PageSize.Should().Be(100);
    }
}
