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
/// Slice C45-E tests for the <c>stale-while-revalidate=120</c>
/// directive on the comp endpoint family. SWR lets clients
/// render the cached body for up to 120 seconds AFTER the
/// 60-second <c>max-age</c> expires while asynchronously
/// refetching — smooths the polling cliff for dashboards.
///
/// <para>Locked design choice: SWR is emitted ONLY on the
/// long-window comp endpoints (<c>/api/sync/comps/eligible</c>,
/// <c>/comps/stale</c>, <c>/comps/stale/summary</c>). The
/// active-workbook pointer endpoint (5s window) deliberately
/// OMITS SWR — operators expect pointer promote/clear to
/// reflect within seconds, and SWR would mean "show old pointer
/// for up to N seconds longer," which contradicts that mental
/// model.</para>
/// </summary>
public class SyncCacheStaleWhileRevalidateTests
{
    private const string OperatorId = "c45e-test";

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

        var identity = new ClaimsIdentity(authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
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

    private static async Task<County> SeedCountyAsync(TerraFusionDbContext db)
    {
        var county = new County
        {
            Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005",
        };
        db.Counties.Add(county);
        await db.SaveChangesAsync();
        return county;
    }

    private static async Task<Guid> SeedWorkbookAsync(TerraFusionDbContext db, Guid countyId)
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

    private static CanonicalSaleQualification BuildQualifiedRow(
        Guid countyId, int chgOfOwnerId, Guid sourceWorkbookId, DateTime sourceWorkbookLockedAt)
    {
        var nowUtc = DateTime.UtcNow;
        return new CanonicalSaleQualification
        {
            CountyId                    = countyId,
            ChgOfOwnerId                = chgOfOwnerId,
            ComputedDecision            = CanonicalSaleQualificationDecision.Qualified,
            WacCdSourceValue            = "458-61A-203(1)",
            WacCdCanonicalValue         = "ArmsLengthSale",
            WacCdAxisDecision           = CanonicalSaleAxisDecision.Qualified,
            SlRatioTypeCdSourceValue    = "00",
            SlRatioTypeCdCanonicalValue = "Conventional",
            SlRatioTypeCdAxisDecision   = CanonicalSaleAxisDecision.Qualified,
            SourceWorkbookId            = sourceWorkbookId,
            SourceWorkbookLockedAt      = sourceWorkbookLockedAt,
            CreatedAt                   = nowUtc,
            UpdatedAt                   = nowUtc,
            CreatedBy                   = OperatorId,
            UpdatedBy                   = OperatorId,
        };
    }

    // ════════════════════════════════════════════════════════════════════
    //  C45-E test matrix
    // ════════════════════════════════════════════════════════════════════

    // 1. Comp eligibility endpoint emits SWR=120 alongside max-age=60.
    [Fact]
    public async Task GetEligibleComps_200_EmitsStaleWhileRevalidate120()
    {
        await using var db = CreateDb($"swr-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildQualifiedRow(county.Id, 1, wb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetEligibleComps(county.Id, null, null, null);

        controller.Response.Headers.CacheControl.ToString()
            .Should().Be("private, max-age=60, stale-while-revalidate=120");
    }

    // 2. Comp stale per-row endpoint emits SWR=120.
    [Fact]
    public async Task GetStaleComps_200_EmitsStaleWhileRevalidate120()
    {
        await using var db = CreateDb($"swr-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildQualifiedRow(county.Id, 1, oldWb, lockedAt));
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetStaleComps(county.Id, newWb, null, null);

        controller.Response.Headers.CacheControl.ToString()
            .Should().Be("private, max-age=60, stale-while-revalidate=120");
    }

    // 3. Comp stale summary endpoint emits SWR=120.
    [Fact]
    public async Task GetStaleCompsSummary_200_EmitsStaleWhileRevalidate120()
    {
        await using var db = CreateDb($"swr-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var newWb = Guid.NewGuid();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetStaleCompsSummary(county.Id, newWb, null, null);

        controller.Response.Headers.CacheControl.ToString()
            .Should().Be("private, max-age=60, stale-while-revalidate=120");
    }

    // 4. Active-workbook endpoint deliberately OMITS SWR (5s
    //    window, operator promote/clear must reflect fast).
    [Fact]
    public async Task GetActiveWorkbook_200_DoesNotEmitStaleWhileRevalidate()
    {
        await using var db = CreateDb($"swr-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        await controller.GetActiveWorkbook(county.Id);

        var cacheControl = controller.Response.Headers.CacheControl.ToString();
        cacheControl.Should().Be("private, max-age=5",
            "active-workbook deliberately omits SWR — operators want pointer changes to reflect within seconds");
        cacheControl.Should().NotContain("stale-while-revalidate",
            "C45-E locks active-workbook to NO SWR directive");
    }

    // 5. 304 short-circuit on a comp endpoint also carries SWR.
    [Fact]
    public async Task GetEligibleComps_304_PreservesStaleWhileRevalidate()
    {
        await using var db = CreateDb($"swr-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        db.CanonicalSaleQualifications.Add(BuildQualifiedRow(county.Id, 1, wb, lockedAt));
        await db.SaveChangesAsync();

        // Get the canonical ETag.
        var seed = BuildController(db, principalCountyClaim: county.Id);
        await seed.GetEligibleComps(county.Id, null, null, null);
        var etag = seed.Response.Headers.ETag.ToString();

        // Re-request with that ETag → 304; assert SWR still present.
        var conditional = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-None-Match"] = etag });
        var result = await conditional.GetEligibleComps(county.Id, null, null, null);

        var status = result.Should().BeOfType<StatusCodeResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status304NotModified);
        conditional.Response.Headers.CacheControl.ToString()
            .Should().Be("private, max-age=60, stale-while-revalidate=120",
                "304 must echo the same Cache-Control as the matching 200, including SWR");
    }

    // 6. Mutations and 4xx errors still emit no-store (SWR doesn't
    //    apply to error / mutation surfaces; Hard Guard 2 of C45-A
    //    still holds).
    [Fact]
    public async Task PutActiveWorkbook_200_StillEmitsNoStore_NoSwr()
    {
        await using var db = CreateDb($"swr-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var identity = new ClaimsIdentity(authenticationType: "Test");
        identity.AddClaim(new Claim("countyId", county.Id.ToString()));
        identity.AddClaim(new Claim(ClaimsIdentity.DefaultNameClaimType, "alice"));
        var http = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };

        var controller = new SyncController(
            new Mock<ISaleQualificationService>().Object,
            db, NullLogger<SyncController>.Instance,
            new SalesCompEligibilityReader(db),
            new SyncCountyActiveWorkbookService(db),
            new SalesCompStaleReader(db),
            new SalesCompStaleSummaryReader(db));
        controller.ControllerContext = new ControllerContext { HttpContext = http };

        await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        var cacheControl = controller.Response.Headers.CacheControl.ToString();
        cacheControl.Should().Be("no-store");
        cacheControl.Should().NotContain("stale-while-revalidate");
    }

    [Fact]
    public async Task GetEligibleComps_400_StillEmitsNoStore_NoSwr()
    {
        await using var db = CreateDb($"swr-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        await controller.GetEligibleComps(Guid.Empty, null, null, null);

        var cacheControl = controller.Response.Headers.CacheControl.ToString();
        cacheControl.Should().Be("no-store");
        cacheControl.Should().NotContain("stale-while-revalidate");
    }

    // 7. Helper-level test: BuildCacheControl emits SWR only when
    //    the optional parameter is supplied and positive.
    [Fact]
    public void Helper_ApplyPrivateCacheHeaders_OmitsSwr_WhenNullOrZero()
    {
        var http = new DefaultHttpContext();
        var etag = SyncHttpCacheHeaders.BuildStrongEtag("test", "seed");
        var lastMod = new DateTimeOffset(2026, 4, 29, 12, 0, 0, TimeSpan.Zero);

        SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(
            http.Response, TimeSpan.FromSeconds(5), etag, lastMod, staleWhileRevalidate: null);
        http.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=5");

        // Reset and try again with zero (treated as absent).
        http.Response.Headers.Clear();
        SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(
            http.Response, TimeSpan.FromSeconds(5), etag, lastMod, staleWhileRevalidate: TimeSpan.Zero);
        http.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=5",
            "TimeSpan.Zero must be treated as 'no SWR directive' — the operator-pointer endpoint relies on this");
    }

    [Fact]
    public void Helper_ApplyPrivateCacheHeaders_EmitsSwr_WhenPositive()
    {
        var http = new DefaultHttpContext();
        var etag = SyncHttpCacheHeaders.BuildStrongEtag("test", "seed");
        var lastMod = new DateTimeOffset(2026, 4, 29, 12, 0, 0, TimeSpan.Zero);

        SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(
            http.Response, TimeSpan.FromSeconds(60), etag, lastMod,
            staleWhileRevalidate: TimeSpan.FromSeconds(120));

        http.Response.Headers.CacheControl.ToString()
            .Should().Be("private, max-age=60, stale-while-revalidate=120");
    }
}
