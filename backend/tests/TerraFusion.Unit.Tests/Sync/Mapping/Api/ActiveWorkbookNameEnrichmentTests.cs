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
/// Slice C47-A tests for the workbook-name enrichment on the
/// <c>GET</c> + <c>PUT /api/sync/active-workbook</c> endpoints.
/// Symmetric to C46-B's enrichment on the stale-summary endpoint;
/// inherits the C46-A guards verbatim.
///
/// <para>Locks:
/// <list type="bullet">
/// <item>Happy path: name populated verbatim on GET.</item>
/// <item>Missing workbook → null name (Hard Guard 4 inherited).</item>
/// <item>HEAD short-circuits before enrichment (no extra query).</item>
/// <item>PUT response carries the same enriched DTO shape.</item>
/// <item>ETag invariance: workbook-name change does NOT shift the
///   C45-B ETag (Hard Guard 6 inherited).</item>
/// <item>Lookup-failure resilience: 200 still returned, name
///   degrades to null (Hard Guard 8 inherited).</item>
/// </list>
/// </para>
/// </summary>
public class ActiveWorkbookNameEnrichmentTests
{
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
        IDictionary<string, string>? extraRequestHeaders = null,
        bool head = false)
    {
        var qualification      = new Mock<ISaleQualificationService>().Object;
        var compReader         = new Mock<ISalesCompEligibilityReader>().Object;
        var activeWorkbook     = new SyncCountyActiveWorkbookService(db);
        var staleReader        = new Mock<ISalesCompStaleReader>().Object;
        var staleSummaryReader = new Mock<ISalesCompStaleSummaryReader>().Object;

        var controller = new SyncController(
            qualification, db, NullLogger<SyncController>.Instance,
            compReader, activeWorkbook, staleReader, staleSummaryReader);

        var identity = new ClaimsIdentity(authenticationType:
            principalCountyClaim is null && principalName is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        if (principalName is not null)
        {
            identity.AddClaim(new Claim(ClaimsIdentity.DefaultNameClaimType, principalName));
        }

        var http = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        if (head) http.Request.Method = HttpMethods.Head;
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

    // 1. GET happy path: name populated verbatim.
    [Fact]
    public async Task GetActiveWorkbook_PopulatesActiveWorkbookName()
    {
        await using var db = CreateDb($"awb-name-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id, name: "benton-2026-04-29 review");
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetActiveWorkbook(county.Id);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(wbId);
        dto.ActiveWorkbookName.Should().Be("benton-2026-04-29 review");
    }

    // 2. GET with deleted-workbook scenario → null name. We
    //    can't actually delete a pointed-to workbook (FK
    //    Restrict per C41-B), but we can simulate it by
    //    bypassing the service and inserting a pointer row that
    //    references a non-existent workbook id directly via the
    //    DbContext (defensive scenario per C46-A Hard Guard 4).
    [Fact]
    public async Task GetActiveWorkbook_MissingWorkbookRow_ReturnsNullName()
    {
        await using var db = CreateDb($"awb-name-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var ghostWbId = Guid.NewGuid();

        // Hand-insert a pointer row pointing at a non-existent
        // workbook (bypasses the FK + service guards).
        // EF.InMemory doesn't enforce FKs, so we can do this in
        // tests; in production the Restrict prevents it.
        db.SyncCountyActiveWorkbooks.Add(new SyncCountyActiveWorkbook
        {
            CountyId         = county.Id,
            ActiveWorkbookId = ghostWbId,
            SetAt            = DateTime.UtcNow,
            SetBy            = "ghost",
            SetReason        = null,
            CreatedAt        = DateTime.UtcNow,
            UpdatedAt        = DateTime.UtcNow,
            CreatedBy        = "ghost",
            UpdatedBy        = "ghost",
        });
        await db.SaveChangesAsync();

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetActiveWorkbook(county.Id);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(ghostWbId);
        dto.ActiveWorkbookName.Should().BeNull(
            "Hard Guard 4 inherited from C46-A: missing workbook row → null name, no throw");
    }

    // 3. HEAD short-circuit happens BEFORE the enrichment lookup
    //    (the action returns immediately after the conditional
    //    + ETag check; HEAD callers don't pay for the workbook
    //    lookup). This is verified by asserting the response is
    //    a StatusCodeResult(200) with cache headers.
    [Fact]
    public async Task HeadActiveWorkbook_DoesNotMaterializeName_StillReturnsCacheHeaders()
    {
        await using var db = CreateDb($"awb-name-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id, name: "test-wb");
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: county.Id, head: true);
        var result = await controller.GetActiveWorkbook(county.Id);

        var status = result.Should().BeOfType<StatusCodeResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status200OK);
        // The HEAD short-circuit returns BEFORE the enrichment
        // lookup runs, so no DTO is materialized.
        controller.Response.Headers.CacheControl.ToString().Should().Be("private, max-age=5");
        controller.Response.Headers.ETag.ToString().Should().StartWith("\"awb:");
    }

    // 4. PUT also returns the enriched DTO shape (same record
    //    shape across both verbs).
    [Fact]
    public async Task PutActiveWorkbook_ReturnsEnrichedDto()
    {
        await using var db = CreateDb($"awb-name-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id, name: "post-promotion-name");

        var controller = BuildController(db, principalCountyClaim: county.Id, principalName: "alice");
        var result = await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(wbId);
        dto.ActiveWorkbookName.Should().Be("post-promotion-name",
            "PUT response carries the enriched DTO shape — operators get the workbook name as soon as they promote it");
    }

    // 5. ETag invariance: workbook-name change does NOT shift the
    //    C45-B ETag for the active-workbook endpoint. Cache-key
    //    is keyed on (countyId, activeWorkbookId, setAtUtc) only.
    [Fact]
    public async Task GetActiveWorkbook_NameChange_DoesNotShiftEtag()
    {
        await using var db = CreateDb($"awb-name-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id, name: "original-name");
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        // First request: capture the ETag.
        var c1 = BuildController(db, principalCountyClaim: county.Id);
        await c1.GetActiveWorkbook(county.Id);
        var etag1 = c1.Response.Headers.ETag.ToString();
        etag1.Should().NotBeEmpty();

        // Mutate the workbook NAME (the pointer / setAt unchanged).
        var workbookRow = await db.SyncMappingWorkbooks.SingleAsync(w => w.Id == wbId);
        workbookRow.Name = "renamed-after-promotion";
        await db.SaveChangesAsync();

        // Re-request: ETag must be identical (Hard Guard 6
        // inherited from C46-A: workbook-name changes do NOT
        // perturb the C45-B ETag — the cache key is keyed on
        // pointer freshness, not workbook metadata).
        var c2 = BuildController(db, principalCountyClaim: county.Id);
        await c2.GetActiveWorkbook(county.Id);
        var etag2 = c2.Response.Headers.ETag.ToString();
        etag2.Should().Be(etag1,
            "C46-A Hard Guard 6: workbook-name changes MUST NOT shift the active-workbook ETag");

        // But a fresh body picks up the new name.
        var freshController = BuildController(db, principalCountyClaim: county.Id);
        var result = await freshController.GetActiveWorkbook(county.Id);
        var dto = ((OkObjectResult)result).Value
            .Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookName.Should().Be("renamed-after-promotion");
    }

    // 6. Lookup-failure resilience: when the workbook-name query
    //    throws (simulated by disposing the DbContext between
    //    pointer.GetAsync and the workbook lookup), the response
    //    still returns 200 with ActiveWorkbookName: null.
    //
    //    Implementation note: the real activeWorkbook service is
    //    used to insert the pointer; then a controller is built
    //    against the SAME db instance; then we dispose db just
    //    before the action runs. The pointer.GetAsync at the
    //    start of the action will throw too — but that's the
    //    existing behavior the controller surfaces as 5xx via
    //    the global middleware. This test is more nuanced: we
    //    want to prove that IF the pointer succeeds AND the
    //    workbook-lookup throws, the action handles it
    //    gracefully. Easier to express via a Mock pointer
    //    service that returns a snapshot, plus a disposed db
    //    for the workbook lookup.
    [Fact]
    public async Task GetActiveWorkbook_LookupFailure_Returns200_NullName()
    {
        await using var db = CreateDb($"awb-name-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = Guid.NewGuid();
        var setAt = new DateTime(2026, 4, 29, 12, 0, 0, DateTimeKind.Utc);

        // Mock the pointer service to return a snapshot (so the
        // pointer.GetAsync doesn't fail). The controller will
        // then try to look up the workbook name in db, which we
        // dispose to force the failure.
        var pointerMock = new Mock<ISyncCountyActiveWorkbookService>();
        pointerMock.Setup(p => p.GetAsync(county.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SyncCountyActiveWorkbookSnapshot(
                county.Id, wbId, setAt, "promoter", null));

        var qualification = new Mock<ISaleQualificationService>().Object;
        var compReader    = new Mock<ISalesCompEligibilityReader>().Object;
        var staleReader   = new Mock<ISalesCompStaleReader>().Object;
        var staleSumReader = new Mock<ISalesCompStaleSummaryReader>().Object;

        var controller = new SyncController(
            qualification, db, NullLogger<SyncController>.Instance,
            compReader, pointerMock.Object, staleReader, staleSumReader);

        var identity = new ClaimsIdentity(authenticationType: "Test");
        identity.AddClaim(new Claim("countyId", county.Id.ToString()));
        var http = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        controller.ControllerContext = new ControllerContext { HttpContext = http };

        // Dispose the DbContext to force the workbook-name lookup
        // to throw ObjectDisposedException.
        await db.DisposeAsync();

        var result = await controller.GetActiveWorkbook(county.Id);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(wbId);
        dto.ActiveWorkbookName.Should().BeNull(
            "C46-A Hard Guard 8: lookup failure must NOT fail the response — null name fallback");
    }

    // 7. Cross-county precedence: 403 fires before any
    //    enrichment lookup, so a foreign-county workbook's name
    //    cannot leak.
    [Fact]
    public async Task GetActiveWorkbook_CrossCounty_Returns403_NoNameLeakage()
    {
        await using var db = CreateDb($"awb-name-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");

        var bentonWbId = await SeedWorkbookAsync(db, benton.Id, name: "benton-secret-workbook");
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(benton.Id, bentonWbId, "benton-promoter", null);

        // Yakima principal asks for Benton's pointer.
        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.GetActiveWorkbook(benton.Id);

        result.Should().BeOfType<ForbidResult>(
            "Hard Guard 8 (C45-A): county isolation fires before enrichment; foreign workbook name MUST NOT leak");
    }
}
