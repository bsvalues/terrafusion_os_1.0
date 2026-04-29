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
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Comps.Api;

/// <summary>
/// Slice C46-B tests for the C46-A workbook-name enrichment on
/// the stale-summary endpoint. Validates the controller-side
/// post-aggregation lookup adds <c>SourceWorkbookName</c> to
/// each group without violating the C44-A "no SQL join" Hard
/// Guard or the C45-B cache-key invariance.
/// </summary>
public class StaleSummaryWorkbookNameEnrichmentTests
{
    private const string OperatorId = "c46b-test";

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
        Guid? principalCountyClaim,
        ISalesCompStaleSummaryReader? customSummaryReader = null)
    {
        var qualification      = new Mock<ISaleQualificationService>().Object;
        var compReader         = new Mock<ISalesCompEligibilityReader>().Object;
        var activeWorkbook     = new SyncCountyActiveWorkbookService(db);
        var staleReader        = new SalesCompStaleReader(db);
        var staleSummaryReader = customSummaryReader ?? (ISalesCompStaleSummaryReader)new SalesCompStaleSummaryReader(db);

        var controller = new SyncController(
            qualification, db, NullLogger<SyncController>.Instance,
            compReader, activeWorkbook, staleReader, staleSummaryReader);

        var identity = new ClaimsIdentity(authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        var http = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        controller.ControllerContext = new ControllerContext { HttpContext = http };
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

    private static async Task<Guid> SeedWorkbookAsync(
        TerraFusionDbContext db, Guid countyId, string name)
    {
        var conn = new SyncSourceConnection
        {
            Id = Guid.NewGuid(), CountyId = countyId, Name = $"{name}-conn",
            SourceSystem = "PACS", ConnectionType = "SqlServer",
            Server = "localhost,1433", Database = "pacs_oltp",
            AuthMode = "SqlAuth", IsActive = true,
        };
        db.SyncSourceConnections.Add(conn);
        var batch = new SyncBatch
        {
            CountyId = countyId, SourceSystem = "PACS", Mode = "profile",
            Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0,
        };
        db.SyncBatches.Add(batch);
        var wb = new SyncMappingWorkbook
        {
            CountyId           = countyId,
            SourceConnectionId = conn.Id,
            ProfileBatchId     = batch.Id,
            Name               = name,
            Status             = "Mapped",
        };
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();
        return wb.Id;
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
            WacCdSourceValue            = "458-61A-203(1)",
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

    // ════════════════════════════════════════════════════════════════════
    //  C46-B test matrix (10 cases per the C46-A policy)
    // ════════════════════════════════════════════════════════════════════

    // 1. Happy path: one stale group → DTO carries the workbook
    //    Name verbatim.
    [Fact]
    public async Task Enrichment_SingleGroup_PopulatesSourceWorkbookName()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = await SeedWorkbookAsync(db, county.Id, name: "benton-2026-04-29 review");
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1,
            CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Groups.Should().ContainSingle();
        var group = dto.Groups[0];
        group.SourceWorkbookId.Should().Be(oldWb);
        group.SourceWorkbookName.Should().Be("benton-2026-04-29 review");
        group.ComputedDecision.Should().Be("Qualified");
        group.Count.Should().Be(1);
    }

    // 2. Multiple groups across distinct workbooks → each group's
    //    name matches its own workbook.
    [Fact]
    public async Task Enrichment_MultipleDistinctWorkbooks_EachGroupCarriesItsOwnName()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbA = await SeedWorkbookAsync(db, county.Id, name: "wb-A first review");
        var wbB = await SeedWorkbookAsync(db, county.Id, name: "wb-B follow-up");
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wbA, lockedAt),
            BuildRow(county.Id, 2, CanonicalSaleQualificationDecision.Excluded, wbB, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Groups.Should().HaveCount(2);
        dto.Groups.Single(g => g.SourceWorkbookId == wbA).SourceWorkbookName
            .Should().Be("wb-A first review");
        dto.Groups.Single(g => g.SourceWorkbookId == wbB).SourceWorkbookName
            .Should().Be("wb-B follow-up");
    }

    // 3. Same workbook, different decisions → both groups carry
    //    the same name (single-row workbook lookup; no duplicate
    //    query work).
    [Fact]
    public async Task Enrichment_SameWorkbookTwoDecisions_BothCarrySameName()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = await SeedWorkbookAsync(db, county.Id, name: "shared-workbook");
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt),
            BuildRow(county.Id, 2, CanonicalSaleQualificationDecision.Excluded, wb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Groups.Should().HaveCount(2);
        dto.Groups.Should().OnlyContain(g => g.SourceWorkbookName == "shared-workbook");
        dto.Groups.Select(g => g.SourceWorkbookId).Should().OnlyContain(id => id == wb);
    }

    // 4. Workbook deleted between aggregation and lookup → null
    //    name on that group; other groups unaffected. Simulated by
    //    seeding a canonical row pointing at a workbook id that
    //    has no SyncMappingWorkbooks row.
    [Fact]
    public async Task Enrichment_MissingWorkbook_GroupCarriesNullName()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var existingWb = await SeedWorkbookAsync(db, county.Id, name: "still-here");
        // Phantom id with no SyncMappingWorkbooks row.
        var ghostWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, existingWb, lockedAt),
            BuildRow(county.Id, 2, CanonicalSaleQualificationDecision.Qualified, ghostWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Groups.Should().HaveCount(2);
        dto.Groups.Single(g => g.SourceWorkbookId == existingWb).SourceWorkbookName
            .Should().Be("still-here");
        dto.Groups.Single(g => g.SourceWorkbookId == ghostWb).SourceWorkbookName
            .Should().BeNull("missing workbook row → null name (Hard Guard 4)");
    }

    // 5. Cross-county workbook id (synthetic / corrupted canonical
    //    row) → null name. The action's principal-county-claim
    //    check fires upstream for the request's countyId; this
    //    test exercises the data-access layer's Hard Guard 3
    //    defense in depth (the lookup query also filters on
    //    CountyId so a foreign-county workbook's name cannot leak
    //    via a corrupted canonical row).
    [Fact]
    public async Task Enrichment_CrossCountyWorkbookId_GroupCarriesNullName()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");

        // Workbook seeded in Yakima.
        var yakimaWb = await SeedWorkbookAsync(db, yakima.Id, name: "yakima-workbook-secret");

        // Canonical row in Benton with a SourceWorkbookId pointing
        // at the Yakima workbook (a corrupted-data scenario; the
        // real C36 writer never produces this, but the defense-in-
        // depth filter must hold anyway).
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(benton.Id, 1, CanonicalSaleQualificationDecision.Qualified, yakimaWb, lockedAt));
        await db.SaveChangesAsync();

        // Benton principal asks for Benton's summary.
        var controller = BuildController(db, principalCountyClaim: benton.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(benton.Id, newWb, null, null));

        dto.Groups.Should().ContainSingle();
        dto.Groups[0].SourceWorkbookId.Should().Be(yakimaWb);
        dto.Groups[0].SourceWorkbookName.Should().BeNull(
            "Hard Guard 3 / 5: cross-county workbook lookups return null — the foreign workbook's name MUST NOT leak");
    }

    // 6. Empty groups (no stale rows) → enrichment short-circuits
    //    with no lookup query issued. The only assertion we can
    //    make at the action surface is that the response is still
    //    correct and groups is empty.
    [Fact]
    public async Task Enrichment_EmptyGroups_NoLookupNeeded()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var newWb = Guid.NewGuid();
        // No canonical rows at all.

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.Groups.Should().BeEmpty();
        dto.TotalStaleRows.Should().Be(0);
    }

    // 7. Truncation interaction: > 100 distinct workbooks → only
    //    the top 100 by count get rendered, and each carries its
    //    name. Truncated remainder is invisible (no name leakage).
    [Fact]
    public async Task Enrichment_OverHundredGroups_TruncatedSetCarriesNames_RemainderInvisible()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // 105 distinct workbooks, each with one Qualified stale row.
        // All seeded with named workbooks; the truncation drops 5,
        // and the remaining 100 must carry their respective names.
        for (int i = 1; i <= 105; i++)
        {
            var wbId = await SeedWorkbookAsync(db, county.Id, name: $"wb-{i:D3}");
            db.CanonicalSaleQualifications.Add(
                BuildRow(county.Id, 1000 + i,
                    CanonicalSaleQualificationDecision.Qualified, wbId, lockedAt));
        }
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var dto = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));

        dto.GroupCount.Should().Be(105);
        dto.Truncated.Should().BeTrue();
        dto.Groups.Should().HaveCount(100);
        // Every rendered group must have its name populated.
        dto.Groups.Should().OnlyContain(g => g.SourceWorkbookName != null,
            "every group in the top-100 must carry its workbook name");
        dto.Groups.Should().OnlyContain(g => g.SourceWorkbookName!.StartsWith("wb-"));
    }

    // 8. ETag invariance: the C45-B summary ETag is byte-for-byte
    //    identical to a pre-C46-B response with the same canonical
    //    data. We can't go back in time, but we CAN lock that
    //    adding/removing a workbook NAME (without touching the
    //    canonical landing) does not perturb the ETag.
    [Fact]
    public async Task Enrichment_CacheKeyInvariance_EtagDoesNotShiftOnNameChanges()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = await SeedWorkbookAsync(db, county.Id, name: "original-name");
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1,
            CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt));
        await db.SaveChangesAsync();

        // First request: get the ETag.
        var c1 = BuildController(db, principalCountyClaim: county.Id);
        await c1.GetStaleCompsSummary(county.Id, newWb, null, null);
        var etag1 = c1.Response.Headers.ETag.ToString();
        etag1.Should().NotBeEmpty();

        // Mutate the workbook NAME (canonical landing untouched).
        var workbookRow = await db.SyncMappingWorkbooks.SingleAsync(w => w.Id == oldWb);
        workbookRow.Name = "renamed-after-the-fact";
        await db.SaveChangesAsync();

        // Re-request: the ETag MUST be identical (Hard Guard 6 /
        // C45-B cache-key invariance — Name is not in the seed).
        var c2 = BuildController(db, principalCountyClaim: county.Id);
        await c2.GetStaleCompsSummary(county.Id, newWb, null, null);
        var etag2 = c2.Response.Headers.ETag.ToString();
        etag2.Should().Be(etag1,
            "Hard Guard 6: workbook-name changes do NOT shift the C45-B ETag — the cache key is keyed on canonical-landing freshness, not workbook metadata");

        // Body picks up the new name on a fresh fetch (no
        // 304-cache short-circuit because we used a fresh
        // controller instance with no If-None-Match).
        var dto = AssertOk(await BuildController(db, principalCountyClaim: county.Id)
            .GetStaleCompsSummary(county.Id, newWb, null, null));
        dto.Groups.Should().ContainSingle()
            .Which.SourceWorkbookName.Should().Be("renamed-after-the-fact");
    }

    // 9. Lookup-failure resilience: when the workbook-name query
    //    throws, the summary still returns 200 with all groups
    //    carrying SourceWorkbookName: null. We simulate the
    //    failure by disposing the DbContext between the
    //    aggregation reads and the lookup — ToDictionaryAsync
    //    will throw ObjectDisposedException, the controller's
    //    catch swallows it, and the response degrades gracefully.
    //
    //    Implementation note: this test uses a custom
    //    ISalesCompStaleSummaryReader that returns the
    //    aggregation rows WITHOUT touching the DbContext (so
    //    they survive disposal); then we dispose db just before
    //    the controller hits the workbook-name lookup. The
    //    catch path emits null names without surfacing a 5xx.
    [Fact]
    public async Task Enrichment_LookupFailure_SummaryStillReturns200_NullNames()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = await SeedWorkbookAsync(db, county.Id, name: "would-be-name");
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1,
            CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt));
        await db.SaveChangesAsync();

        // Pre-compute the aggregation results from a real reader,
        // then build a fake reader that returns the same data
        // without re-querying the DbContext. This way we can
        // dispose db and still get aggregation results — but the
        // workbook-name lookup will throw on the disposed context.
        var realReader = new SalesCompStaleSummaryReader(db);
        var aggregationGroups = await realReader.GroupAsync(county.Id, newWb, 100);
        var totalStaleRows = await realReader.TotalStaleRowsAsync(county.Id, newWb);
        var groupCount = await realReader.GroupCountAsync(county.Id, newWb);
        var maxLockedAt = await realReader.MaxLockedAtAsync(county.Id, newWb);

        var fakeReader = new Mock<ISalesCompStaleSummaryReader>();
        fakeReader.Setup(r => r.GroupAsync(county.Id, newWb, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(aggregationGroups);
        fakeReader.Setup(r => r.TotalStaleRowsAsync(county.Id, newWb, It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalStaleRows);
        fakeReader.Setup(r => r.GroupCountAsync(county.Id, newWb, It.IsAny<CancellationToken>()))
            .ReturnsAsync(groupCount);
        fakeReader.Setup(r => r.MaxLockedAtAsync(county.Id, newWb, It.IsAny<CancellationToken>()))
            .ReturnsAsync(maxLockedAt);

        // Build the controller pointing at the SAME db, but with
        // the fake summary reader. The controller's enrichment
        // lookup still uses _db.SyncMappingWorkbooks. To force the
        // lookup failure, we dispose the context after building
        // the controller but before invoking the action.
        var controller = BuildController(db, principalCountyClaim: county.Id,
            customSummaryReader: fakeReader.Object);
        await db.DisposeAsync(); // forces a thrown exception inside the workbook-name lookup

        // The action MUST still return 200 with the groups; the
        // SourceWorkbookName field falls back to null.
        var result = await controller.GetStaleCompsSummary(county.Id, newWb, null, null);
        var dto = AssertOk(result);

        dto.Groups.Should().HaveCount(aggregationGroups.Count);
        dto.Groups.Should().OnlyContain(g => g.SourceWorkbookName == null,
            "Hard Guard 8: lookup-failure resilience — null names instead of a 5xx");
    }

    // 10. C44-B reconciliation invariant preserved: summary
    //     totalStaleRows still equals per-row totalCount.
    [Fact]
    public async Task Enrichment_DoesNotBreak_C44BReconciliationInvariant()
    {
        await using var db = CreateDb($"enrich-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbA = await SeedWorkbookAsync(db, county.Id, name: "wb-A");
        var wbB = await SeedWorkbookAsync(db, county.Id, name: "wb-B");
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);

        // Mix of workbooks and decisions to ensure non-trivial
        // group/row reconciliation.
        for (int i = 1; i <= 4; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Qualified, wbA, lockedAt));
        for (int i = 100; i <= 102; i++)
            db.CanonicalSaleQualifications.Add(BuildRow(county.Id, i,
                CanonicalSaleQualificationDecision.Excluded, wbB, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var summary = AssertOk(await controller.GetStaleCompsSummary(county.Id, newWb, null, null));
        var perRowResult = await controller.GetStaleComps(county.Id, newWb, page: 1, pageSize: 500);
        var perRow = ((OkObjectResult)perRowResult).Value
            .Should().BeOfType<PagedStaleSaleQualificationsDto>().Subject;

        summary.TotalStaleRows.Should().Be(perRow.TotalCount,
            "C44-B test 17 invariant must still hold: totalStaleRows == perRow.totalCount even with C46-B enrichment");
        summary.TotalStaleRows.Should().Be(7);
        summary.Groups.Sum(g => g.Count).Should().Be(summary.TotalStaleRows,
            "C44-A invariant: groups[*].count sums to totalStaleRows when not truncated");

        // And the names land correctly on each group.
        summary.Groups.Single(g => g.SourceWorkbookId == wbA).SourceWorkbookName
            .Should().Be("wb-A");
        summary.Groups.Single(g => g.SourceWorkbookId == wbB).SourceWorkbookName
            .Should().Be("wb-B");
    }
}
