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
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Mapping.Api;

/// <summary>
/// Slice C45-C tests for the <c>If-Match</c> optimistic-
/// concurrency check on <c>PUT /api/sync/active-workbook</c>.
/// Closes the C45-A "future slice" gap so two operators racing to
/// promote different workbooks can detect the conflict instead of
/// silently overwriting each other.
///
/// <para>Locked semantics:
/// <list type="bullet">
/// <item>Header absent → backward-compatible (200 with current
///   behavior).</item>
/// <item>Header is the current ETag → 200 (proceed; pointer
///   rotates).</item>
/// <item>Header is a stale ETag → 412 Precondition Failed.</item>
/// <item>Header is <c>*</c> + pointer exists → 200.</item>
/// <item>Header is <c>*</c> + no pointer → 412.</item>
/// <item>Every response (200 / 412) carries
///   <c>Cache-Control: no-store</c> (mutation surface).</item>
/// <item>Cross-county callers still get 403 (Hard Guard 8 — auth
///   precedence over precondition checks).</item>
/// </list>
/// </para>
/// </summary>
public class PutActiveWorkbookIfMatchTests
{
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
        string? principalName = "alice",
        IDictionary<string, string>? extraRequestHeaders = null)
    {
        var qualification      = new Mock<ISaleQualificationService>().Object;
        var compReader         = new Mock<ISalesCompEligibilityReader>().Object;
        var activeWorkbook     = new SyncCountyActiveWorkbookService(db);
        var staleReader        = new Mock<ISalesCompStaleReader>().Object;
        var staleSummaryReader = new Mock<ISalesCompStaleSummaryReader>().Object;

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

    /// <summary>
    /// Run a GET against the active-workbook endpoint to obtain
    /// the current ETag exactly as a real client would see it.
    /// Used by tests that need to feed the canonical ETag into a
    /// subsequent PUT.
    /// </summary>
    private static async Task<string> GetCurrentETagAsync(
        TerraFusionDbContext db, Guid principalCountyClaim, Guid countyToFetch)
    {
        var fetcher = BuildController(db, principalCountyClaim);
        var result = await fetcher.GetActiveWorkbook(countyToFetch);
        result.Should().BeOfType<OkObjectResult>();
        return fetcher.Response.Headers.ETag.ToString();
    }

    // ════════════════════════════════════════════════════════════════════
    //  C45-C If-Match matrix
    // ════════════════════════════════════════════════════════════════════

    // 1. Header absent → backward-compatible 200.
    [Fact]
    public async Task Put_NoIfMatchHeader_BackwardCompatible_200()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        result.Should().BeOfType<OkObjectResult>();
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store",
            "all PUT responses must be no-store regardless of If-Match");
    }

    // 2. Matching ETag → 200; pointer rotates.
    [Fact]
    public async Task Put_MatchingIfMatch_200_AndPointerRotates()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbA = await SeedWorkbookAsync(db, county.Id, name: "A");
        var wbB = await SeedWorkbookAsync(db, county.Id, name: "B");

        // Seed an existing pointer (A) so we have a current ETag.
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbA, "first-promoter", null);

        var currentEtag = await GetCurrentETagAsync(db, county.Id, county.Id);
        currentEtag.Should().NotBeEmpty();

        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Match"] = currentEtag });
        var result = await controller.PutActiveWorkbook(county.Id, wbB, request: null);

        result.Should().BeOfType<OkObjectResult>();
        var dto = ((OkObjectResult)result).Value
            .Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(wbB,
            "matching If-Match means the PUT proceeds; pointer rotates to B");
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }

    // 3. Stale ETag → 412 Precondition Failed; pointer unchanged.
    [Fact]
    public async Task Put_StaleIfMatch_Returns412_AndPointerUnchanged()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbA = await SeedWorkbookAsync(db, county.Id, name: "A");
        var wbB = await SeedWorkbookAsync(db, county.Id, name: "B");
        var wbC = await SeedWorkbookAsync(db, county.Id, name: "C");

        // Pointer cycle: A → B (so the ETag has rotated since A).
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbA, "first-promoter", null);
        var staleEtag = await GetCurrentETagAsync(db, county.Id, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbB, "second-promoter", null);

        // Operator C still has the A-era ETag and tries to promote
        // wbC. 412 must fire; pointer stays at B.
        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Match"] = staleEtag });
        var result = await controller.PutActiveWorkbook(county.Id, wbC, request: null);

        var status = result.Should().BeOfType<ObjectResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status412PreconditionFailed);
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");

        // Pointer untouched: still B, NOT C.
        var post = await new SyncCountyActiveWorkbookService(db).GetAsync(county.Id);
        post.Should().NotBeNull();
        post!.ActiveWorkbookId.Should().Be(wbB,
            "412 must NOT mutate the pointer; the racer's PUT is rejected before SetAsync is called");
    }

    // 4. If-Match: * with existing pointer → 200.
    [Fact]
    public async Task Put_StarIfMatch_WithExistingPointer_200()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbA = await SeedWorkbookAsync(db, county.Id, name: "A");
        var wbB = await SeedWorkbookAsync(db, county.Id, name: "B");
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbA, "first-promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Match"] = "*" });
        var result = await controller.PutActiveWorkbook(county.Id, wbB, request: null);

        result.Should().BeOfType<OkObjectResult>();
        var dto = ((OkObjectResult)result).Value
            .Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(wbB);
    }

    // 5. If-Match: * with NO pointer → 412.
    [Fact]
    public async Task Put_StarIfMatch_WithNoPointer_Returns412()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        // No prior pointer exists.
        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Match"] = "*" });
        var result = await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        var status = result.Should().BeOfType<ObjectResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status412PreconditionFailed,
            "If-Match: * requires a pre-existing resource; no pointer ⇒ 412");
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");

        // Pointer still does not exist.
        (await new SyncCountyActiveWorkbookService(db).GetAsync(county.Id)).Should().BeNull();
    }

    // 6. 412 emits Cache-Control: no-store + no ETag.
    [Fact]
    public async Task Put_412_AlwaysEmitsNoStore_NoETag()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string>
            {
                ["If-Match"] = "\"awb:made-up-stale-etag\"",
            });
        // No prior pointer; explicit non-* If-Match cannot match → 412.
        var result = await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        var status = result.Should().BeOfType<ObjectResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status412PreconditionFailed);
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
        controller.Response.Headers.ETag.ToString().Should().BeEmpty(
            "mutations / 412 must not emit ETag (Hard Guard 2)");
        controller.Response.Headers.LastModified.ToString().Should().BeEmpty();
    }

    // 7. Cross-county precedence: 403 fires BEFORE the If-Match check.
    [Fact]
    public async Task Put_CrossCountyWithIfMatch_403_Never412()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = await SeedWorkbookAsync(db, benton.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(benton.Id, bentonWb, "first-promoter", null);

        // Yakima principal sends a (legitimately stale) If-Match
        // and tries to PUT against Benton's pointer. C45-A Hard
        // Guard 8 says 403 fires before any precondition check.
        var controller = BuildController(db, principalCountyClaim: yakima.Id,
            extraRequestHeaders: new Dictionary<string, string>
            {
                ["If-Match"] = "\"awb:any-value\"",
            });
        var result = await controller.PutActiveWorkbook(benton.Id, bentonWb, request: null);

        result.Should().BeOfType<ForbidResult>(
            "Hard Guard 8: county-isolation 403 happens BEFORE the If-Match check");
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");

        // Benton's pointer untouched (defense in depth).
        var post = await new SyncCountyActiveWorkbookService(db).GetAsync(benton.Id);
        post.Should().NotBeNull();
        post!.ActiveWorkbookId.Should().Be(bentonWb);
    }

    // 8. Round-trip: GET → PUT with returned ETag → success; second
    //    PUT with the same ETag → 412 (the first PUT rotated the
    //    pointer, so the operator now needs to refetch).
    [Fact]
    public async Task RoundTrip_GET_PUT_secondPUT_WithStaleETag_412()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbA = await SeedWorkbookAsync(db, county.Id, name: "A");
        var wbB = await SeedWorkbookAsync(db, county.Id, name: "B");
        var wbC = await SeedWorkbookAsync(db, county.Id, name: "C");
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbA, "promoter", null);

        // Operator 1: fetch ETag, PUT with it, succeeds.
        var etag1 = await GetCurrentETagAsync(db, county.Id, county.Id);
        var op1 = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Match"] = etag1 });
        (await op1.PutActiveWorkbook(county.Id, wbB, null))
            .Should().BeOfType<OkObjectResult>();

        // Operator 2 has the SAME ETag (etag1) but the pointer
        // has now rotated to B. PUT must 412.
        var op2 = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Match"] = etag1 });
        var result2 = await op2.PutActiveWorkbook(county.Id, wbC, null);
        var status = result2.Should().BeOfType<ObjectResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status412PreconditionFailed,
            "second operator's stale ETag must be rejected; this is the lost-update guard");

        // Pointer remains at B (the first PUT's value), NOT C.
        var post = await new SyncCountyActiveWorkbookService(db).GetAsync(county.Id);
        post!.ActiveWorkbookId.Should().Be(wbB);
    }

    // 9. Empty If-Match header treated as absent (defensive).
    [Fact]
    public async Task Put_EmptyIfMatchHeader_TreatedAsAbsent_200()
    {
        await using var db = CreateDb($"ifmatch-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db, principalCountyClaim: county.Id,
            extraRequestHeaders: new Dictionary<string, string> { ["If-Match"] = "   " });
        var result = await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        result.Should().BeOfType<OkObjectResult>(
            "whitespace-only If-Match header is parsed as absent; PUT proceeds with the legacy non-conditional path");
    }
}
