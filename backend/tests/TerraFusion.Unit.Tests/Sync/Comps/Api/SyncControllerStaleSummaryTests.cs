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
/// Slice C44-B tests for the
/// <c>GET /api/sync/comps/stale/summary</c> endpoint exposed by
/// <see cref="SyncController.GetStaleCompsSummary"/>.
///
/// <para>Locks the C44-A contract via the 17-test matrix:
/// <list type="number">
/// <item>Happy path with explicit baseline.</item>
/// <item>Happy path with pointer-resolved baseline.</item>
/// <item>400 when omitted AND no pointer (locked message).</item>
/// <item>400 for empty <c>countyId</c>.</item>
/// <item>400 for <c>?page=</c> (Hard Guard 11).</item>
/// <item>400 for <c>?pageSize=</c> (Hard Guard 11).</item>
/// <item>403 for cross-county request.</item>
/// <item>403 for principal without <c>countyId</c> claim.</item>
/// <item>200 with empty groups when zero stale rows.</item>
/// <item>200 with empty groups when no canonical rows at all.</item>
/// <item>Group ordering: <c>count DESC</c> with deliberate
///   tie-break on <c>sourceWorkbookId ASC</c>.</item>
/// <item><c>ComputedDecision</c> round-trips as wire string.</item>
/// <item><c>totalStaleRows</c> equals sum of <c>groups[*].count</c>
///   when not truncated.</item>
/// <item>Truncation: 101+ groups → <c>truncated: true</c> +
///   accurate <c>groupCount</c> + top-100 by count DESC.</item>
/// <item>Read-only contract.</item>
/// <item><c>baselineSource</c> echoes correctly.</item>
/// <item>Per-row total reconciliation:
///   <c>summary.totalStaleRows == perRow.totalCount</c>.</item>
/// </list>
/// </para>
/// </summary>
public class SyncControllerStaleSummaryTests
{
    private const string OperatorId = "c44b-test";

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
        Guid sourceWorkbookId, DateTime sourceWorkbookLockedAt)
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
            WacCdSourceValue            = "wac",
            WacCdCanonicalValue         = "ArmsLengthSale",
            WacCdAxisDecision           = wacAxis,
            SlRatioTypeCdSourceValue    = "00",
            SlRatioTypeCdCanonicalValue = "Conventional",
            SlRatioTypeCdAxisDecision   = ratioAxis,
            SourceWorkbookId            = sourceWorkbookId,
            SourceWorkbookLockedAt      = sourceWorkbookLockedAt,
            CreatedAt                   = nowUtc,
            UpdatedAt                   = nowUtc,
            CreatedBy                   = OperatorId,
            UpdatedBy                   = OperatorId,
        };
    }

    private static StaleSummaryDto AssertOk(IActionResult result)
    {
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        return ok.Value.Should().BeOfType<StaleSummaryDto>().Subject;
    }

    // 1. Happy path with explicit baseline.
    [Fact]
    public async Task GetStaleCompsSummary_ExplicitBaseline_ReturnsCorrectGroupCounts()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldA = Guid.NewGuid();
        var oldB = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 3 stale Qualified on oldA, 1 stale Excluded on oldA,
        // 2 stale Qualified on oldB, 5 fresh Qualified on newWb.
        for (int i = 1; i <= 3; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, oldA, lockedAt));
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 100,
            CanonicalSaleQualificationDecision.Excluded, oldA, lockedAt));
        for (int i = 200; i <= 201; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, oldB, lockedAt));
        for (int i = 300; i <= 304; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, newWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.CountyId.Should().Be(county.Id);
        dto.BaselineWorkbookId.Should().Be(newWb);
        dto.BaselineSource.Should().Be("explicit-query-param");
        dto.TotalStaleRows.Should().Be(6);     // 3 + 1 + 2
        dto.GroupCount.Should().Be(3);
        dto.Truncated.Should().BeFalse();
        dto.Groups.Should().HaveCount(3);

        // Largest group first: oldA Qualified (3).
        dto.Groups[0].SourceWorkbookId.Should().Be(oldA);
        dto.Groups[0].ComputedDecision.Should().Be("Qualified");
        dto.Groups[0].Count.Should().Be(3);
    }

    // 2. Happy path with pointer-resolved baseline.
    [Fact]
    public async Task GetStaleCompsSummary_OmittedBaseline_ResolvesViaPointer()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.SyncMappingWorkbooks.Add(new TerraFusion.Core.Entities.Sync.Mapping.SyncMappingWorkbook
        {
            Id = newWb, CountyId = county.Id,
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb-new", Status = "Mapped", UpdatedAt = lockedAt,
        });
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1,
            CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt));
        await db.SaveChangesAsync();
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, newWb, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, null, null, null));

        dto.BaselineWorkbookId.Should().Be(newWb);
        dto.BaselineSource.Should().Be("active-workbook-pointer");
        dto.TotalStaleRows.Should().Be(1);
        dto.Groups.Should().ContainSingle();
    }

    // 3. 400 when omitted AND no pointer.
    [Fact]
    public async Task GetStaleCompsSummary_NoBaseline_Returns400WithLockedMessage()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetStaleCompsSummary(county.Id, null, null, null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        // Locked message components per C44-A.
        json.Should().Contain($"Cannot summarize staleness for county {county.Id}");
        json.Should().Contain("no workbookId supplied");
        json.Should().Contain("no active-workbook pointer is configured");
        json.Should().Contain("?workbookId=");
        json.Should().Contain("set the county active workbook");
    }

    // 4. 400 for empty countyId.
    [Fact]
    public async Task GetStaleCompsSummary_Returns400ForEmptyCountyId()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.GetStaleCompsSummary(Guid.Empty, null, null, null);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // 5 / 6. 400 for ?page= and ?pageSize= (Hard Guard 11).
    [Theory]
    [InlineData(1, null)]   // page supplied
    [InlineData(2, null)]
    [InlineData(null, 50)]  // pageSize supplied
    [InlineData(null, 100)]
    [InlineData(1, 50)]     // both
    public async Task GetStaleCompsSummary_RejectsPaginationParameters(int? page, int? pageSize)
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetStaleCompsSummary(
            county.Id, Guid.NewGuid(), page, pageSize);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        json.Should().ContainAny("page", "pageSize");
        json.Should().Contain("not a valid query parameter");
    }

    // 7. 403 for cross-county request.
    [Fact]
    public async Task GetStaleCompsSummary_RefusesCrossCountyRequestWith403()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var controller = BuildController(db, principalCountyClaim: yakima.Id);

        var result = await controller.GetStaleCompsSummary(benton.Id, Guid.NewGuid(), null, null);
        result.Should().BeOfType<ForbidResult>();
    }

    // 8. 403 for principal without countyId claim.
    [Fact]
    public async Task GetStaleCompsSummary_RefusesPrincipalWithoutCountyClaimWith403()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: null);

        var result = await controller.GetStaleCompsSummary(county.Id, Guid.NewGuid(), null, null);
        result.Should().BeOfType<ForbidResult>();
    }

    // 9. 200 empty when zero stale rows.
    [Fact]
    public async Task GetStaleCompsSummary_EveryRowPointsAtBaseline_ReturnsEmptyGroups()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        for (int i = 1; i <= 3; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, wb, null, null));

        dto.TotalStaleRows.Should().Be(0);
        dto.GroupCount.Should().Be(0);
        dto.Groups.Should().BeEmpty();
        dto.Truncated.Should().BeFalse();
    }

    // 10. 200 empty when no canonical rows at all.
    [Fact]
    public async Task GetStaleCompsSummary_NoCanonicalRowsAtAll_ReturnsEmptyGroups()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, Guid.NewGuid(), null, null));
        dto.TotalStaleRows.Should().Be(0);
        dto.GroupCount.Should().Be(0);
        dto.Groups.Should().BeEmpty();
    }

    // 11. Group ordering: count DESC then sourceWorkbookId ASC.
    [Fact]
    public async Task GetStaleCompsSummary_OrdersByCountDescThenWorkbookIdAsc()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        var newWb = Guid.NewGuid();

        // Construct two workbook ids with deterministic ordering
        // (smaller ASCII first) so the tie-break is unambiguous.
        var wbAlpha = Guid.Parse("11111111-aaaa-bbbb-cccc-dddddddddddd");
        var wbBeta  = Guid.Parse("22222222-aaaa-bbbb-cccc-dddddddddddd");

        // Two groups with the same count of 5 but different
        // workbook ids. Tie-break MUST put wbAlpha first
        // (smaller ascending). One group with count 7 (the
        // largest, must come first overall).
        for (int i = 1; i <= 5; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, wbAlpha, lockedAt));
        for (int i = 100; i <= 104; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, wbBeta, lockedAt));
        for (int i = 200; i <= 206; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Excluded, wbAlpha, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Groups.Should().HaveCount(3);
        // Largest count first: wbAlpha Excluded (7).
        dto.Groups[0].SourceWorkbookId.Should().Be(wbAlpha);
        dto.Groups[0].ComputedDecision.Should().Be("Excluded");
        dto.Groups[0].Count.Should().Be(7);
        // Tie at count=5: wbAlpha (smaller Guid) before wbBeta.
        dto.Groups[1].SourceWorkbookId.Should().Be(wbAlpha);
        dto.Groups[1].Count.Should().Be(5);
        dto.Groups[2].SourceWorkbookId.Should().Be(wbBeta);
        dto.Groups[2].Count.Should().Be(5);
    }

    // 12. ComputedDecision round-trips as wire string.
    [Fact]
    public async Task GetStaleCompsSummary_ProjectsDecisionAsWireStableString()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt),
            BuildRow(county.Id, 2, CanonicalSaleQualificationDecision.Excluded, oldWb, lockedAt),
            BuildRow(county.Id, 3, CanonicalSaleQualificationDecision.Inconclusive, oldWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Groups.Should().HaveCount(3);
        dto.Groups.Select(g => g.ComputedDecision)
            .Should().BeEquivalentTo(new[] { "Qualified", "Excluded", "Inconclusive" });
    }

    // 13. totalStaleRows = sum of groups[*].count when not truncated.
    [Fact]
    public async Task GetStaleCompsSummary_TotalStaleRowsEqualsGroupSumWhenNotTruncated()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldA = Guid.NewGuid();
        var oldB = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 4 + 2 + 1 = 7 stale total across 3 groups.
        for (int i = 1; i <= 4; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, oldA, lockedAt));
        for (int i = 100; i <= 101; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Excluded, oldA, lockedAt));
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 200,
            CanonicalSaleQualificationDecision.Inconclusive, oldB, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Truncated.Should().BeFalse();
        dto.TotalStaleRows.Should().Be(dto.Groups.Sum(g => g.Count),
            "C44-A invariant: totalStaleRows MUST equal sum(groups[*].count) when the response is not truncated");
        dto.TotalStaleRows.Should().Be(7);
    }

    // 14. Truncation: > 100 groups → truncated=true, top-100 by count DESC.
    [Fact]
    public async Task GetStaleCompsSummary_OverHundredGroups_TruncatesAndSignals()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Seed 105 distinct workbook ids, each with 1 stale Qualified
        // row. That's 105 distinct (workbook, decision) groups —
        // exceeds the 100-cap. Truncation must kick in.
        for (int i = 1; i <= 105; i++)
        {
            var wb = Guid.NewGuid();
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1000 + i,
                CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        }
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.TotalStaleRows.Should().Be(105,
            "totalStaleRows is independent of the group cap (Hard Guard 4)");
        dto.GroupCount.Should().Be(105,
            "groupCount is the actual count BEFORE truncation");
        dto.Groups.Should().HaveCount(100,
            "groups carries at most MaxStaleSummaryGroups (100) per Hard Guard 4");
        dto.Truncated.Should().BeTrue("groupCount > 100 ⇒ truncated");

        // Each group has count=1 in this scenario (one workbook,
        // one decision), so the cap takes the first 100 by tie-break
        // ordering on sourceWorkbookId ASC.
        dto.Groups.Should().OnlyContain(g => g.Count == 1);
    }

    // 15. Read-only contract.
    [Fact]
    public async Task GetStaleCompsSummary_DoesNotMutateAnyState()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.SyncMappingWorkbooks.Add(new TerraFusion.Core.Entities.Sync.Mapping.SyncMappingWorkbook
        {
            Id = newWb, CountyId = county.Id,
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb-new", Status = "Mapped", UpdatedAt = lockedAt,
        });
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt),
            BuildRow(county.Id, 2, CanonicalSaleQualificationDecision.Excluded, oldWb, lockedAt));
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
        await controller.GetStaleCompsSummary(county.Id, newWb, null, null);
        await controller.GetStaleCompsSummary(county.Id, null, null, null);
        await controller.GetStaleCompsSummary(county.Id, Guid.Empty, null, null);

        var post = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new { r.ChgOfOwnerId, r.ComputedDecision, r.UpdatedAt, r.UpdatedBy })
            .ToListAsync();
        var postPtr = await db.SyncCountyActiveWorkbooks.AsNoTracking()
            .Select(r => new { r.CountyId, r.ActiveWorkbookId, r.UpdatedAt, r.UpdatedBy }).ToListAsync();

        post.Should().BeEquivalentTo(pre, "summary reads must NOT mutate canonical rows");
        postPtr.Should().BeEquivalentTo(prePtr, "summary reads must NOT mutate the active-workbook pointer");
    }

    // 16. baselineSource echoes correctly.
    [Fact]
    public async Task GetStaleCompsSummary_BaselineSourceEchoesResolutionPath()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
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

        var pointer = AssertOk(await controller.GetStaleCompsSummary(county.Id, null, null, null));
        pointer.BaselineWorkbookId.Should().Be(pointedWb);
        pointer.BaselineSource.Should().Be("active-workbook-pointer");

        var explicitResult = AssertOk(
            await controller.GetStaleCompsSummary(county.Id, explicitWb, null, null));
        explicitResult.BaselineWorkbookId.Should().Be(explicitWb);
        explicitResult.BaselineSource.Should().Be("explicit-query-param");

        var emptyExplicit = AssertOk(
            await controller.GetStaleCompsSummary(county.Id, Guid.Empty, null, null));
        emptyExplicit.BaselineWorkbookId.Should().Be(pointedWb);
        emptyExplicit.BaselineSource.Should().Be("active-workbook-pointer");
    }

    // 17. Reconciliation: summary.totalStaleRows == perRow.totalCount.
    [Fact]
    public async Task GetStaleCompsSummary_ReconcilesWithPerRowEndpointTotalCount()
    {
        await using var db = CreateDb($"summary-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldA = Guid.NewGuid();
        var oldB = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Mix of decisions across two prior workbooks.
        for (int i = 1; i <= 3; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, oldA, lockedAt));
        for (int i = 100; i <= 102; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Excluded, oldA, lockedAt));
        for (int i = 200; i <= 204; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Inconclusive, oldB, lockedAt));
        // 4 fresh rows (NOT stale; should NOT count).
        for (int i = 300; i <= 303; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, newWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);

        var summary = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));
        var perRowResult = await controller.GetStaleComps(county.Id, newWb, page: 1, pageSize: 500);
        var perRowOk = perRowResult.Should().BeOfType<OkObjectResult>().Subject;
        var perRow = perRowOk.Value.Should().BeOfType<PagedStaleSaleQualificationsDto>().Subject;

        summary.TotalStaleRows.Should().Be(perRow.TotalCount,
            "C44-A reconciliation: summary.totalStaleRows MUST equal perRow.totalCount " +
            "for matching (countyId, baselineWorkbookId) — both endpoints share the locked stale predicate");

        // Cross-check the actual number too.
        summary.TotalStaleRows.Should().Be(11);  // 3 + 3 + 5
    }
}
