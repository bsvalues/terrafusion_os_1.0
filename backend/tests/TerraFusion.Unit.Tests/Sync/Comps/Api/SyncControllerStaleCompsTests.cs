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
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Comps.Api;

/// <summary>
/// Slice C43-B tests for the
/// <c>GET /api/sync/comps/stale</c> endpoint exposed by
/// <see cref="SyncController.GetStaleComps"/>.
///
/// <para>Locks the C43-A contract:
/// <list type="bullet">
/// <item>200 happy path with explicit + pointer-resolved
///   baselines.</item>
/// <item>400 when neither explicit nor pointer baseline is
///   available (locked operator message).</item>
/// <item>400 for empty countyId / malformed pagination.</item>
/// <item>403 for cross-county / no-claim.</item>
/// <item>200 with empty <c>items: []</c> when no stale rows.</item>
/// <item>Pagination round-trip determinism.</item>
/// <item><c>ComputedDecision</c> projects to wire-stable
///   string.</item>
/// <item>Read-only contract (pre/post DB snapshot).</item>
/// <item><c>baselineSource</c> echoes correctly.</item>
/// </list>
/// </para>
/// </summary>
public class SyncControllerStaleCompsTests
{
    private const string OperatorId = "c43b-test";

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
        var qualification      = new Mock<ISaleQualificationService>().Object;
        var compReader         = new Mock<ISalesCompEligibilityReader>().Object;
        var activeWorkbook     = new SyncCountyActiveWorkbookService(db);
        var staleReader        = new SalesCompStaleReader(db);
        var staleSummaryReader = new SalesCompStaleSummaryReader(db);

        var controller = new SyncController(
            qualification, db, NullLogger<SyncController>.Instance,
            compReader, activeWorkbook, staleReader, staleSummaryReader);

        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) },
        };

        return controller;
    }

    private static async Task<County> SeedCountyAsync(
        TerraFusionDbContext db, string name = "Benton", string fips = "53005")
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
        Guid countyId, int chgOfOwnerId,
        CanonicalSaleQualificationDecision decision,
        Guid sourceWorkbookId, DateTime sourceWorkbookLockedAt,
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

    private static PagedStaleSaleQualificationsDto AssertOkEnvelope(IActionResult result)
    {
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        return ok.Value.Should().BeOfType<PagedStaleSaleQualificationsDto>().Subject;
    }

    // ════════════════════════════════════════════════════════════════════
    //  C43-A test matrix (14 cases)
    // ════════════════════════════════════════════════════════════════════

    // 1. Happy path with EXPLICIT workbookId.
    [Fact]
    public async Task GetStaleComps_ExplicitBaseline_ReturnsOnlyStaleRows()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 2 rows on old (stale relative to new), 1 on new (fresh).
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1001, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 1002, CanonicalSaleQualificationDecision.Excluded, oldWb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 1003, CanonicalSaleQualificationDecision.Qualified, newWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(
            await controller.GetStaleComps(county.Id, workbookId: newWb, page: null, pageSize: null));

        env.BaselineWorkbookId.Should().Be(newWb);
        env.BaselineSource.Should().Be("explicit-query-param");
        env.Items.Should().HaveCount(2);
        env.Items.Select(d => d.ChgOfOwnerId).Should().Equal(1001, 1002);
        env.Items.Should().OnlyContain(d => d.SourceWorkbookId == oldWb);
        env.TotalCount.Should().Be(2);
        env.Page.Should().Be(1);
        env.PageSize.Should().Be(100);
    }

    // 2. Happy path with POINTER-RESOLVED baseline.
    [Fact]
    public async Task GetStaleComps_OmittedBaseline_ResolvesViaActiveWorkbookPointer()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Seed canonical rows + Mapped workbook + active pointer
        // pointing at newWb. The pointer service requires the
        // workbook to actually exist in SyncMappingWorkbooks.
        db.SyncMappingWorkbooks.Add(new TerraFusion.Core.Entities.Sync.Mapping.SyncMappingWorkbook
        {
            Id = newWb, CountyId = county.Id,
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb-new", Status = "Mapped", UpdatedAt = lockedAt,
        });

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 2001, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 2002, CanonicalSaleQualificationDecision.Qualified, newWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, newWb, "promoter", "for stale test");

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(
            await controller.GetStaleComps(county.Id, workbookId: null, page: null, pageSize: null));

        env.BaselineWorkbookId.Should().Be(newWb);
        env.BaselineSource.Should().Be("active-workbook-pointer");
        env.Items.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(2001);
        env.TotalCount.Should().Be(1);
    }

    // 3. 400 when omitted AND no pointer.
    [Fact]
    public async Task GetStaleComps_OmittedBaseline_NoPointer_Returns400WithLockedMessage()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetStaleComps(county.Id, null, null, null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        // Locked message components per the C43-A policy doc.
        json.Should().Contain($"Cannot compute staleness for county {county.Id}");
        json.Should().Contain("no workbookId supplied");
        json.Should().Contain("no active-workbook pointer is configured");
        json.Should().Contain("?workbookId=");
        json.Should().Contain("set the county active workbook");
    }

    // 4. 400 for empty countyId.
    [Fact]
    public async Task GetStaleComps_Returns400ForEmptyCountyId()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.GetStaleComps(Guid.Empty, null, null, null);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // 5. 400 for malformed pagination params.
    [Theory]
    [InlineData(0, null)]      // page < 1
    [InlineData(-1, null)]     // page < 1
    [InlineData(null, 0)]      // pageSize < 1
    [InlineData(null, -1)]     // pageSize < 1
    [InlineData(null, 501)]    // pageSize > max
    [InlineData(null, 99999)]  // pageSize > max
    public async Task GetStaleComps_Returns400ForBadPaginationParams(int? badPage, int? badPageSize)
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetStaleComps(county.Id, Guid.NewGuid(), badPage, badPageSize);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // 6. 403 for cross-county request.
    [Fact]
    public async Task GetStaleComps_RefusesCrossCountyRequestWith403()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");

        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.GetStaleComps(benton.Id, Guid.NewGuid(), null, null);

        result.Should().BeOfType<ForbidResult>();
    }

    // 7. 403 for principal without countyId claim.
    [Fact]
    public async Task GetStaleComps_RefusesPrincipalWithoutCountyClaimWith403()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);

        var controller = BuildController(db, principalCountyClaim: null);
        var result = await controller.GetStaleComps(county.Id, Guid.NewGuid(), null, null);

        result.Should().BeOfType<ForbidResult>();
    }

    // 8. 200 with empty items when every row points at baseline.
    [Fact]
    public async Task GetStaleComps_EveryRowPointsAtBaseline_ReturnsEmptyItems()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 3 rows all on the same workbook → 0 stale relative to it.
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 100, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 101, CanonicalSaleQualificationDecision.Excluded, wb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 102, CanonicalSaleQualificationDecision.Inconclusive, wb, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(
            await controller.GetStaleComps(county.Id, wb, null, null));

        env.Items.Should().BeEmpty();
        env.TotalCount.Should().Be(0);
        env.TotalPages.Should().Be(0);
    }

    // 9. 200 with empty items when county has zero canonical rows.
    [Fact]
    public async Task GetStaleComps_NoCanonicalRowsAtAll_ReturnsEmptyItems()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(
            await controller.GetStaleComps(county.Id, Guid.NewGuid(), null, null));

        env.Items.Should().BeEmpty();
        env.TotalCount.Should().Be(0);
    }

    // 10. Pagination round-trip determinism.
    [Fact]
    public async Task GetStaleComps_PagesPartitionStaleRowsWithoutOverlapOrSkip()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 12 stale rows on oldWb, 3 fresh rows on newWb (the
        // baseline). Insert out of order to verify the
        // ChgOfOwnerId-asc ordering is server-enforced.
        var staleIds = new[] { 50, 10, 80, 30, 5, 70, 25, 90, 45, 12, 60, 8 };
        foreach (var id in staleIds)
        {
            db.CanonicalSaleQualifications.Add(
                BuildRow(county.Id, id, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt,
                    wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        }
        foreach (var id in new[] { 200, 201, 202 })
        {
            db.CanonicalSaleQualifications.Add(
                BuildRow(county.Id, id, CanonicalSaleQualificationDecision.Qualified, newWb, lockedAt,
                    wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        }
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);

        var page1 = AssertOkEnvelope(await controller.GetStaleComps(county.Id, newWb, 1, 5));
        var page2 = AssertOkEnvelope(await controller.GetStaleComps(county.Id, newWb, 2, 5));
        var page3 = AssertOkEnvelope(await controller.GetStaleComps(county.Id, newWb, 3, 5));

        var allIds = page1.Items.Concat(page2.Items).Concat(page3.Items)
            .Select(d => d.ChgOfOwnerId).ToList();

        allIds.Should().OnlyHaveUniqueItems();
        allIds.Should().BeEquivalentTo(staleIds);   // union equals pool
        allIds.Should().BeInAscendingOrder();        // cross-page cursor stability

        page1.TotalCount.Should().Be(12);
        page1.TotalPages.Should().Be(3);
        page1.HasNextPage.Should().BeTrue();
        page1.HasPreviousPage.Should().BeFalse();
        page3.HasNextPage.Should().BeFalse();
        page3.HasPreviousPage.Should().BeTrue();
    }

    // 11. ComputedDecision projects to wire-stable string.
    [Fact]
    public async Task GetStaleComps_ProjectsComputedDecisionAsWireStableString()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 2, CanonicalSaleQualificationDecision.Excluded, oldWb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 3, CanonicalSaleQualificationDecision.Inconclusive, oldWb, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var env = AssertOkEnvelope(await controller.GetStaleComps(county.Id, newWb, null, null));

        env.Items.Should().HaveCount(3);
        env.Items.Single(d => d.ChgOfOwnerId == 1).ComputedDecision.Should().Be("Qualified");
        env.Items.Single(d => d.ChgOfOwnerId == 2).ComputedDecision.Should().Be("Excluded");
        env.Items.Single(d => d.ChgOfOwnerId == 3).ComputedDecision.Should().Be("Inconclusive");
    }

    // 12. Read-only contract: pre/post DB snapshot equality.
    [Fact]
    public async Task GetStaleComps_DoesNotMutateAnyState()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Seed Mapped workbook so the pointer-resolution path is
        // exercisable.
        db.SyncMappingWorkbooks.Add(new TerraFusion.Core.Entities.Sync.Mapping.SyncMappingWorkbook
        {
            Id = newWb, CountyId = county.Id,
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb-new", Status = "Mapped", UpdatedAt = lockedAt,
        });
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 9001, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 9002, CanonicalSaleQualificationDecision.Excluded, oldWb, lockedAt,
                wacSource: "458-61A-217(1)"));
        await db.SaveChangesAsync();
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, newWb, "promoter", null);

        var pre = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new { r.ChgOfOwnerId, r.ComputedDecision, r.UpdatedAt, r.UpdatedBy })
            .ToListAsync();
        var prePtr = await db.SyncCountyActiveWorkbooks.AsNoTracking()
            .Select(r => new { r.CountyId, r.ActiveWorkbookId, r.UpdatedAt, r.UpdatedBy }).ToListAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        // Three reads: explicit-baseline, pointer-baseline, pagination.
        await controller.GetStaleComps(county.Id, newWb, null, null);
        await controller.GetStaleComps(county.Id, null, null, null);
        await controller.GetStaleComps(county.Id, null, 1, 5);

        var post = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new { r.ChgOfOwnerId, r.ComputedDecision, r.UpdatedAt, r.UpdatedBy })
            .ToListAsync();
        var postPtr = await db.SyncCountyActiveWorkbooks.AsNoTracking()
            .Select(r => new { r.CountyId, r.ActiveWorkbookId, r.UpdatedAt, r.UpdatedBy }).ToListAsync();

        post.Should().BeEquivalentTo(pre, "stale-row reads must NOT mutate canonical rows");
        postPtr.Should().BeEquivalentTo(prePtr, "stale-row reads must NOT mutate the active-workbook pointer");
    }

    // 13. baselineSource echoes correctly across explicit + pointer paths.
    [Fact]
    public async Task GetStaleComps_BaselineSourceFieldEchoesResolutionPath()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var pointedWb = Guid.NewGuid();
        var explicitWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.SyncMappingWorkbooks.Add(new TerraFusion.Core.Entities.Sync.Mapping.SyncMappingWorkbook
        {
            Id = pointedWb, CountyId = county.Id,
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb-pointer", Status = "Mapped", UpdatedAt = lockedAt,
        });
        await db.SaveChangesAsync();
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, pointedWb, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id);

        var pointer = AssertOkEnvelope(await controller.GetStaleComps(county.Id, null, null, null));
        pointer.BaselineWorkbookId.Should().Be(pointedWb);
        pointer.BaselineSource.Should().Be("active-workbook-pointer");

        var explicitResult = AssertOkEnvelope(
            await controller.GetStaleComps(county.Id, explicitWb, null, null));
        explicitResult.BaselineWorkbookId.Should().Be(explicitWb);
        explicitResult.BaselineSource.Should().Be("explicit-query-param");

        // Guid.Empty for explicit workbookId is treated as "no
        // explicit"; falls back to the pointer.
        var emptyExplicit = AssertOkEnvelope(
            await controller.GetStaleComps(county.Id, Guid.Empty, null, null));
        emptyExplicit.BaselineWorkbookId.Should().Be(pointedWb);
        emptyExplicit.BaselineSource.Should().Be("active-workbook-pointer");
    }

    // 14. Cross-county baseline: every row is "stale" relative to a
    //     foreign workbook id (the predicate just compares ids;
    //     C43-A leaves this case to C43-B's discretion — recommend
    //     "every row is stale" since that's a useful diagnostic
    //     signal that the operator passed a wrong workbook id).
    [Fact]
    public async Task GetStaleComps_BaselineFromAnotherCounty_ReturnsAllRowsAsStale()
    {
        await using var db = CreateDb($"stale-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = Guid.NewGuid();
        var yakimaWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Benton has 2 rows on its own workbook.
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(benton.Id, 1, CanonicalSaleQualificationDecision.Qualified, bentonWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(benton.Id, 2, CanonicalSaleQualificationDecision.Excluded, bentonWb, lockedAt,
                wacSource: "458-61A-217(1)"));
        await db.SaveChangesAsync();

        // Benton principal asks for staleness using a Yakima workbook
        // id as baseline. The county-isolation guard passes (claim
        // matches countyId). The reader's predicate compares ids
        // verbatim → both Benton rows are "stale" relative to a
        // Yakima workbook. Useful diagnostic: tells the operator
        // the baseline they passed isn't producing matches.
        var controller = BuildController(db, principalCountyClaim: benton.Id);
        var env = AssertOkEnvelope(await controller.GetStaleComps(benton.Id, yakimaWb, null, null));

        env.Items.Should().HaveCount(2);
        env.TotalCount.Should().Be(2);
        env.BaselineWorkbookId.Should().Be(yakimaWb);
        // Cross-county baseline returns every row as stale; consumer
        // UI should flag this when no match is the expected case.

        _ = yakima; // silence unused-variable analyzer; the second county exists to make the test scenario concrete.
    }
}
