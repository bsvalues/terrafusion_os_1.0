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
/// Slice C45-D tests for HEAD method support across the four
/// cacheable comps endpoints. HEAD lets clients probe ETag /
/// Last-Modified without fetching the body — useful for cheap
/// dashboard freshness checks.
///
/// <para>Locked semantics:
/// <list type="bullet">
/// <item>HEAD is routed to the same action as GET via
///   <c>[HttpHead(...)]</c> alongside <c>[HttpGet(...)]</c>.</item>
/// <item>The action detects HEAD via <c>HttpMethods.IsHead</c>
///   and short-circuits BEFORE materializing the response body
///   (skips the count + page reads on the comp endpoints; skips
///   the GroupAsync read on the summary endpoint; skips the DTO
///   allocation on active-workbook).</item>
/// <item>HEAD with matching <c>If-None-Match</c> still returns
///   304 (the conditional check fires before the HEAD
///   short-circuit).</item>
/// <item>HEAD inherits all the C45-A guards: 400 on bad input
///   with no-store; 403 on cross-county with no-store; 401 from
///   <c>[Authorize]</c> upstream.</item>
/// </list>
/// </para>
/// </summary>
public class SyncControllerHeadMethodTests
{
    private const string OperatorId = "c45d-test";

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

    private static SyncController BuildHeadController(
        TerraFusionDbContext db,
        Guid? principalCountyClaim,
        IDictionary<string, string>? extraRequestHeaders = null)
    {
        var qualification      = new Mock<ISaleQualificationService>().Object;
        var compReader         = new SalesCompEligibilityReader(db);
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

        var http = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        // Set HEAD method explicitly on the request — the action
        // checks HttpMethods.IsHead(Request.Method) to short-circuit.
        http.Request.Method = HttpMethods.Head;
        if (extraRequestHeaders is not null)
        {
            foreach (var kv in extraRequestHeaders)
            {
                http.Request.Headers[kv.Key] = kv.Value;
            }
        }
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
        TerraFusionDbContext db, Guid countyId)
    {
        var conn = new SyncSourceConnection
        {
            Id = Guid.NewGuid(), CountyId = countyId, Name = "wb-conn",
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
            Name               = $"wb-{Guid.NewGuid():N}",
            Status             = "Mapped",
        };
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();
        return wb.Id;
    }

    private static CanonicalSaleQualification BuildRow(
        Guid countyId, int chgOfOwnerId, Guid sourceWorkbookId,
        DateTime sourceWorkbookLockedAt,
        CanonicalSaleQualificationDecision decision = CanonicalSaleQualificationDecision.Qualified)
    {
        var (wacAxis, ratioAxis) = decision == CanonicalSaleQualificationDecision.Qualified
            ? (CanonicalSaleAxisDecision.Qualified, CanonicalSaleAxisDecision.Qualified)
            : (CanonicalSaleAxisDecision.NotMapped, CanonicalSaleAxisDecision.NotMapped);
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

    private static StatusCodeResult AssertHeadOk(IActionResult result)
    {
        // The action returns StatusCode(200) (no body) on the HEAD
        // short-circuit. Tests assert the headers separately.
        var status = result.Should().BeOfType<StatusCodeResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status200OK);
        return status;
    }

    // ════════════════════════════════════════════════════════════════════
    //  C45-D: HEAD on each cacheable endpoint — headers present, no body
    // ════════════════════════════════════════════════════════════════════

    // 1. HEAD /api/sync/comps/eligible.
    [Fact]
    public async Task Head_GetEligibleComps_EmitsHeaders_AndStatusCodeResult()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1, wb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildHeadController(db, principalCountyClaim: county.Id);
        var result = await controller.GetEligibleComps(county.Id, null, null, null);

        AssertHeadOk(result);
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"comps:e:").And.EndWith("\"");
        controller.Response.Headers.Vary.ToString().Should().Be("Authorization");
        controller.Response.Headers.LastModified.ToString().Should().NotBeEmpty();
    }

    // 2. HEAD /api/sync/comps/stale.
    [Fact]
    public async Task Head_GetStaleComps_EmitsHeaders_AndStatusCodeResult()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1, oldWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildHeadController(db, principalCountyClaim: county.Id);
        var result = await controller.GetStaleComps(county.Id, newWb, null, null);

        AssertHeadOk(result);
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"comps:s:");
        controller.Response.Headers.Vary.ToString().Should().Be("Authorization");
    }

    // 3. HEAD /api/sync/comps/stale/summary.
    [Fact]
    public async Task Head_GetStaleCompsSummary_EmitsHeaders_AndStatusCodeResult()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var newWb = Guid.NewGuid();

        var controller = BuildHeadController(db, principalCountyClaim: county.Id);
        var result = await controller.GetStaleCompsSummary(county.Id, newWb, null, null);

        AssertHeadOk(result);
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"comps:ss:");
    }

    // 4. HEAD /api/sync/active-workbook.
    [Fact]
    public async Task Head_GetActiveWorkbook_EmitsHeaders_AndStatusCodeResult()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildHeadController(db, principalCountyClaim: county.Id);
        var result = await controller.GetActiveWorkbook(county.Id);

        AssertHeadOk(result);
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=5");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"awb:");
    }

    // 5. HEAD with matching If-None-Match still 304s (the
    //    conditional check fires before the HEAD short-circuit).
    [Fact]
    public async Task Head_GetEligibleComps_MatchingIfNoneMatch_Returns304()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildRow(county.Id, 1, wb, lockedAt));
        await db.SaveChangesAsync();

        // Get the canonical ETag via a HEAD-less GET (the test's
        // own scaffolding uses a fresh controller with default
        // method = GET).
        var seedController = new SyncController(
            new Mock<ISaleQualificationService>().Object,
            db, NullLogger<SyncController>.Instance,
            new SalesCompEligibilityReader(db),
            new SyncCountyActiveWorkbookService(db),
            new SalesCompStaleReader(db),
            new SalesCompStaleSummaryReader(db));
        var seedIdentity = new ClaimsIdentity(authenticationType: "Test");
        seedIdentity.AddClaim(new Claim("countyId", county.Id.ToString()));
        seedController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(seedIdentity) },
        };
        await seedController.GetEligibleComps(county.Id, null, null, null);
        var etag = seedController.Response.Headers.ETag.ToString();
        etag.Should().NotBeEmpty();

        // HEAD with that ETag in If-None-Match → 304.
        var head = BuildHeadController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-None-Match"] = etag });
        var result = await head.GetEligibleComps(county.Id, null, null, null);

        var status = result.Should().BeOfType<StatusCodeResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status304NotModified,
            "the conditional 304 short-circuit fires BEFORE the HEAD short-circuit");
        head.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        head.Response.Headers.LastModified.ToString().Should().BeEmpty(
            "304 carries no Last-Modified regardless of method");
    }

    // 6. HEAD with bad input still 400 + no-store.
    [Fact]
    public async Task Head_GetEligibleComps_EmptyCountyId_Returns400_NoStore()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var controller = BuildHeadController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.GetEligibleComps(Guid.Empty, null, null, null);

        result.Should().BeOfType<BadRequestObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }

    // 7. HEAD cross-county precedence: 403 fires before HEAD
    //    short-circuit. (Hard Guard 8 of C45-A.)
    [Fact]
    public async Task Head_GetEligibleComps_CrossCounty_Returns403_NoStore()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildRow(benton.Id, 1, wb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildHeadController(db, principalCountyClaim: yakima.Id);
        var result = await controller.GetEligibleComps(benton.Id, null, null, null);

        result.Should().BeOfType<ForbidResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
        controller.Response.Headers.ETag.ToString().Should().BeEmpty(
            "cross-county HEAD must not leak resource ETag");
    }

    // 8. HEAD on the active-workbook endpoint with no pointer →
    //    404 (matches the GET behavior). No-store on the 404.
    [Fact]
    public async Task Head_GetActiveWorkbook_NoPointer_Returns404_NoStore()
    {
        await using var db = CreateDb($"head-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildHeadController(db, principalCountyClaim: county.Id);

        var result = await controller.GetActiveWorkbook(county.Id);

        result.Should().BeOfType<NotFoundObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }
}
