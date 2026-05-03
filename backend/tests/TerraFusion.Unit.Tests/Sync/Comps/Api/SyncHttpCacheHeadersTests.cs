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
using TerraFusion.API.Services.Sync;
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
/// Slice C45-B tests for the comps API caching headers per the
/// C45-A 17-test matrix. Tests the cacheable endpoints
/// (<c>GetEligibleComps</c>, <c>GetStaleComps</c>,
/// <c>GetStaleCompsSummary</c>, <c>GetActiveWorkbook</c>) plus
/// the no-cache mutations (<c>PutActiveWorkbook</c>,
/// <c>DeleteActiveWorkbook</c>) and the no-cache 4xx error paths.
///
/// <para>Test 5's "simulated 5xx" sub-case is intentionally
/// scoped narrower than the policy — the controller can stamp
/// no-store on 4xx returns it owns, but unhandled 5xx exceptions
/// bubble through the global ASP.NET exception middleware where
/// they are out of this slice's control. Adding a 5xx-specific
/// no-store filter is a follow-on if telemetry shows clients
/// caching error responses; for now we lock the 4xx side
/// mechanically.</para>
/// </summary>
public class SyncHttpCacheHeadersTests
{
    private const string OperatorId = "c45b-test";

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
        string? principalName = null,
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
            authenticationType: principalCountyClaim is null && principalName is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        if (principalName is not null)
        {
            identity.AddClaim(new Claim(ClaimsIdentity.DefaultNameClaimType, principalName));
        }

        var http = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
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
        TerraFusionDbContext db, Guid countyId, string status = "Mapped", string name = "wb")
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
            Name               = $"{name}-{Guid.NewGuid():N}",
            Status             = status,
        };
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();
        return wb.Id;
    }

    private static CanonicalSaleQualification BuildRow(
        Guid countyId, int chgOfOwnerId,
        CanonicalSaleQualificationDecision decision,
        Guid sourceWorkbookId, DateTime sourceWorkbookLockedAt,
        string? wacSource = null, string? wacCanonical = null,
        string? ratioSource = null, string? ratioCanonical = null)
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
            WacCdSourceValue            = wacSource ?? "wac",
            WacCdCanonicalValue         = wacCanonical ?? "ArmsLengthSale",
            WacCdAxisDecision           = wacAxis,
            SlRatioTypeCdSourceValue    = ratioSource ?? "00",
            SlRatioTypeCdCanonicalValue = ratioCanonical ?? "Conventional",
            SlRatioTypeCdAxisDecision   = ratioAxis,
            SourceWorkbookId            = sourceWorkbookId,
            SourceWorkbookLockedAt      = sourceWorkbookLockedAt,
            CreatedAt                   = nowUtc,
            UpdatedAt                   = nowUtc,
            CreatedBy                   = OperatorId,
            UpdatedBy                   = OperatorId,
        };
    }

    // ════════════════════════════════════════════════════════════════════
    //  C45-A 17-test matrix
    // ════════════════════════════════════════════════════════════════════

    // 1. Cache-Control: private, max-age=60 on /api/sync/comps/eligible.
    [Fact]
    public async Task GetEligibleComps_200_EmitsPrivateMaxAge60()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetEligibleComps(county.Id, null, null, null);

        result.Should().BeOfType<OkObjectResult>();
        var headers = controller.Response.Headers;
        headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        headers.Vary.ToString().Should().Be("Authorization");
        headers.ETag.ToString().Should().StartWith("\"comps:e:").And.EndWith("\"");
        headers.LastModified.ToString().Should().NotBeEmpty();
    }

    // 2. Same for /api/sync/comps/stale and /api/sync/comps/stale/summary.
    [Fact]
    public async Task GetStaleComps_200_EmitsPrivateMaxAge60()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, oldWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetStaleComps(county.Id, newWb, null, null);

        result.Should().BeOfType<OkObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        controller.Response.Headers.Vary.ToString().Should().Be("Authorization");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"comps:s:");
    }

    [Fact]
    public async Task GetStaleCompsSummary_200_EmitsPrivateMaxAge60()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var newWb = Guid.NewGuid();
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.GetStaleCompsSummary(county.Id, newWb, null, null);
        result.Should().BeOfType<OkObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"comps:ss:");
    }

    // 3. Cache-Control: private, max-age=5 on /api/sync/active-workbook.
    [Fact]
    public async Task GetActiveWorkbook_200_EmitsPrivateMaxAge5()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetActiveWorkbook(county.Id);

        result.Should().BeOfType<OkObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=5");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"awb:");
    }

    // 4. no-store on PUT and DELETE active-workbook.
    [Fact]
    public async Task PutActiveWorkbook_200_EmitsNoStore()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db, principalCountyClaim: county.Id, principalName: "alice");
        var result = await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        result.Should().BeOfType<OkObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
        controller.Response.Headers.ETag.ToString().Should().BeEmpty(
            "mutations must not carry ETag (Hard Guard 2)");
    }

    [Fact]
    public async Task DeleteActiveWorkbook_204_EmitsNoStore()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id, principalName: "alice");
        var result = await controller.DeleteActiveWorkbook(county.Id);

        result.Should().BeOfType<NoContentResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }

    // 5. no-store on 4xx error responses.
    [Fact]
    public async Task GetEligibleComps_400_EmitsNoStore()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.GetEligibleComps(Guid.Empty, null, null, null);
        result.Should().BeOfType<BadRequestObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
        controller.Response.Headers.ETag.ToString().Should().BeEmpty();
        controller.Response.Headers.LastModified.ToString().Should().BeEmpty();
    }

    [Fact]
    public async Task GetStaleComps_400_EmitsNoStore()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);

        // Triggers the "no baseline + no pointer" 400.
        var result = await controller.GetStaleComps(county.Id, null, null, null);
        result.Should().BeOfType<BadRequestObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }

    // 6. ETag stable across two identical 200 requests with no
    //    canonical writes intervening.
    [Fact]
    public async Task GetEligibleComps_ETagStableAcrossIdenticalRequests()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        // Two separate controllers (= two separate HttpContexts)
        // against the same DB. ETags must match exactly.
        var c1 = BuildController(db, principalCountyClaim: county.Id);
        await c1.GetEligibleComps(county.Id, null, null, null);
        var etag1 = c1.Response.Headers.ETag.ToString();

        var c2 = BuildController(db, principalCountyClaim: county.Id);
        await c2.GetEligibleComps(county.Id, null, null, null);
        var etag2 = c2.Response.Headers.ETag.ToString();

        etag1.Should().NotBeEmpty();
        etag1.Should().Be(etag2,
            "ETag must be deterministic across identical requests when no C36 writes have intervened");
    }

    // 7. ETag rotates when a C36 write touches a row in scope
    //    (a new SourceWorkbookLockedAt advances the seed).
    [Fact]
    public async Task GetEligibleComps_ETagRotates_WhenCanonicalRowLockedAtAdvances()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var earlyLockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, earlyLockedAt));
        await db.SaveChangesAsync();

        var c1 = BuildController(db, principalCountyClaim: county.Id);
        await c1.GetEligibleComps(county.Id, null, null, null);
        var etag1 = c1.Response.Headers.ETag.ToString();

        // Simulate a C36 re-write that advances SourceWorkbookLockedAt.
        var row = await db.CanonicalSaleQualifications.SingleAsync();
        row.SourceWorkbookLockedAt = new DateTime(2026, 4, 29, 0, 0, 0, DateTimeKind.Utc);
        await db.SaveChangesAsync();

        var c2 = BuildController(db, principalCountyClaim: county.Id);
        await c2.GetEligibleComps(county.Id, null, null, null);
        var etag2 = c2.Response.Headers.ETag.ToString();

        etag1.Should().NotBe(etag2,
            "ETag must rotate when the row's SourceWorkbookLockedAt advances (any C36 write to a row in scope advances the cache key)");
    }

    // 8. 304 Not Modified when client sends matching If-None-Match.
    [Fact]
    public async Task GetEligibleComps_IfNoneMatchMatching_Returns304()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        // First request to obtain the ETag.
        var first = BuildController(db, principalCountyClaim: county.Id);
        await first.GetEligibleComps(county.Id, null, null, null);
        var serverEtag = first.Response.Headers.ETag.ToString();
        serverEtag.Should().NotBeEmpty();

        // Second request with that ETag in If-None-Match.
        var second = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-None-Match"] = serverEtag });
        var result = await second.GetEligibleComps(county.Id, null, null, null);

        var status = result.Should().BeOfType<StatusCodeResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status304NotModified);
        second.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
        second.Response.Headers.ETag.ToString().Should().Be(serverEtag);
        second.Response.Headers.Vary.ToString().Should().Be("Authorization");
        second.Response.Headers.LastModified.ToString().Should().BeEmpty(
            "Hard Guard / spec: 304 carries no Last-Modified");
    }

    // 9. 200 OK when client sends a stale If-None-Match.
    [Fact]
    public async Task GetEligibleComps_IfNoneMatchStale_Returns200()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-None-Match"] = "\"comps:e:stale-deadbeef\"" });
        var result = await controller.GetEligibleComps(county.Id, null, null, null);

        result.Should().BeOfType<OkObjectResult>(
            "stale ETag must NOT short-circuit; client gets the full body");
    }

    // 10. Vary: Authorization on every 200 / 304.
    [Fact]
    public async Task EveryCacheable200ResponseEmitsVaryAuthorization()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db).SetAsync(county.Id, wbId, "p", null);

        var c1 = BuildController(db, principalCountyClaim: county.Id);
        await c1.GetEligibleComps(county.Id, null, null, null);
        c1.Response.Headers.Vary.ToString().Should().Be("Authorization");

        var c2 = BuildController(db, principalCountyClaim: county.Id);
        await c2.GetActiveWorkbook(county.Id);
        c2.Response.Headers.Vary.ToString().Should().Be("Authorization");

        var c3 = BuildController(db, principalCountyClaim: county.Id);
        await c3.GetStaleComps(county.Id, Guid.NewGuid(), null, null);
        c3.Response.Headers.Vary.ToString().Should().Be("Authorization");

        var c4 = BuildController(db, principalCountyClaim: county.Id);
        await c4.GetStaleCompsSummary(county.Id, Guid.NewGuid(), null, null);
        c4.Response.Headers.Vary.ToString().Should().Be("Authorization");
    }

    // 11. No Pragma header (Hard Guard 9).
    [Fact]
    public async Task NoPragmaHeaderOnAnyResponse()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetEligibleComps(county.Id, null, null, null);
        controller.Response.Headers.Pragma.ToString().Should().BeEmpty();
    }

    // 12. No Expires header (Hard Guard 11).
    [Fact]
    public async Task NoExpiresHeaderOnAnyResponse()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetEligibleComps(county.Id, null, null, null);
        controller.Response.Headers["Expires"].ToString().Should().BeEmpty();
    }

    // 13. County-isolation precedence: cross-county 403 happens
    //     BEFORE ETag computation. Sending a matching If-None-Match
    //     from a wrong-county principal still gets 403, never 304.
    [Fact]
    public async Task CrossCountyCallerWithMatchingETag_StillGets403_Never304()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(benton.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        // Get the Benton ETag legitimately.
        var bentonCaller = BuildController(db, principalCountyClaim: benton.Id);
        await bentonCaller.GetEligibleComps(benton.Id, null, null, null);
        var bentonEtag = bentonCaller.Response.Headers.ETag.ToString();

        // Yakima principal asks for Benton's data with matching ETag.
        // 403 must short-circuit BEFORE ETag check (Hard Guard 8).
        var attacker = BuildController(db, principalCountyClaim: yakima.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-None-Match"] = bentonEtag });
        var result = await attacker.GetEligibleComps(benton.Id, null, null, null);

        result.Should().BeOfType<ForbidResult>(
            "C45-A Hard Guard 8: county-isolation 403 happens BEFORE ETag computation");
        attacker.Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }

    // 14. Endpoint scope-prefix prevents collisions: same county +
    //     workbook produces different ETag values across endpoints.
    [Fact]
    public async Task EndpointScopePrefixesPreventETagCollisions()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        // Reuse the same county / wb across all 4 cacheable endpoints
        // and verify the ETag scope-prefix differs in each.
        var c1 = BuildController(db, principalCountyClaim: county.Id);
        await c1.GetEligibleComps(county.Id, wb, null, null);
        var eligibleEtag = c1.Response.Headers.ETag.ToString();

        var c2 = BuildController(db, principalCountyClaim: county.Id);
        await c2.GetStaleComps(county.Id, Guid.NewGuid(), null, null);
        var staleEtag = c2.Response.Headers.ETag.ToString();

        var c3 = BuildController(db, principalCountyClaim: county.Id);
        await c3.GetStaleCompsSummary(county.Id, Guid.NewGuid(), null, null);
        var summaryEtag = c3.Response.Headers.ETag.ToString();

        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db).SetAsync(county.Id, wbId, "p", null);
        var c4 = BuildController(db, principalCountyClaim: county.Id);
        await c4.GetActiveWorkbook(county.Id);
        var awbEtag = c4.Response.Headers.ETag.ToString();

        eligibleEtag.Should().StartWith("\"comps:e:");
        staleEtag.Should().StartWith("\"comps:s:");
        summaryEtag.Should().StartWith("\"comps:ss:");
        awbEtag.Should().StartWith("\"awb:");

        new[] { eligibleEtag, staleEtag, summaryEtag, awbEtag }
            .Should().OnlyHaveUniqueItems(
                "scope-prefixes are designed so the same content can never collide across endpoints");
    }

    // 15. Last-Modified matches the maxLockedAtUtc across the rows
    //     in scope (or setAtUtc for active-workbook).
    [Fact]
    public async Task LastModifiedMatches_MaxLockedAt_OnEligibleEndpoint()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAtA = new DateTime(2026, 4, 28, 18, 0, 0, DateTimeKind.Utc);
        var lockedAtB = new DateTime(2026, 4, 29, 1, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAtA),
            BuildRow(county.Id, 2, CanonicalSaleQualificationDecision.Qualified, wb, lockedAtB));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetEligibleComps(county.Id, null, null, null);

        var headerVal = controller.Response.Headers.LastModified.ToString();
        // Last-Modified is RFC 1123: e.g. "Wed, 29 Apr 2026 01:00:00 GMT"
        headerVal.Should().Contain("29 Apr 2026 01:00:00 GMT",
            "Last-Modified must reflect the MAX SourceWorkbookLockedAt across rows in scope");
    }

    // 16. Empty result is still cacheable with a deterministic ETag.
    [Fact]
    public async Task EmptyResultStillCacheable_DeterministicETag()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        // No canonical rows.

        var c1 = BuildController(db, principalCountyClaim: county.Id);
        await c1.GetEligibleComps(county.Id, null, null, null);
        var etag1 = c1.Response.Headers.ETag.ToString();

        var c2 = BuildController(db, principalCountyClaim: county.Id);
        await c2.GetEligibleComps(county.Id, null, null, null);
        var etag2 = c2.Response.Headers.ETag.ToString();

        etag1.Should().NotBeEmpty();
        etag1.Should().Be(etag2,
            "empty result must still produce a deterministic ETag (UnixEpoch fallback for the seed)");
        c1.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=60, stale-while-revalidate=120");
    }

    // 17. If-Modified-Since short-circuit.
    [Fact]
    public async Task GetEligibleComps_IfModifiedSinceAfterMaxLockedAt_Returns304()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        // Send If-Modified-Since AT or AFTER the maxLockedAtUtc.
        // RFC 1123 format: "Wed, 28 Apr 2026 21:00:00 GMT"
        var ifModSince = lockedAt.AddSeconds(1).ToString("R", System.Globalization.CultureInfo.InvariantCulture);
        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Modified-Since"] = ifModSince });

        var result = await controller.GetEligibleComps(county.Id, null, null, null);

        var status = result.Should().BeOfType<StatusCodeResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status304NotModified);
    }

    [Fact]
    public async Task GetEligibleComps_IfModifiedSinceBeforeMaxLockedAt_Returns200()
    {
        await using var db = CreateDb($"cache-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 29, 12, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wb, lockedAt));
        await db.SaveChangesAsync();

        var stale = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var ifModSince = stale.ToString("R", System.Globalization.CultureInfo.InvariantCulture);
        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Modified-Since"] = ifModSince });

        var result = await controller.GetEligibleComps(county.Id, null, null, null);
        result.Should().BeOfType<OkObjectResult>(
            "If-Modified-Since BEFORE the server's maxLockedAtUtc must NOT short-circuit");
    }
}
