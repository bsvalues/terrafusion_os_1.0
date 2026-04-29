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
/// Slice C41-C tests for the
/// <c>GET / PUT / DELETE /api/sync/active-workbook</c> endpoints
/// exposed by <see cref="SyncController"/>.
///
/// <para>Inherits the C38-A endpoint contract pattern: action-level
/// invocations against a real EF InMemory DbContext + a real
/// <see cref="SyncCountyActiveWorkbookService"/>; auth is simulated
/// by populating <see cref="HttpContext.User"/> with the
/// <c>countyId</c> claim. 401 / 405 are framework-level (enforced
/// upstream by <c>[Authorize]</c> + the <c>[HttpGet/Put/Delete]</c>
/// route table) and not exercised at the action layer.</para>
///
/// <para>Locks the C41-A HTTP surface contract:
/// <list type="bullet">
/// <item>GET 200 returns the snapshot DTO.</item>
/// <item>GET 404 when no pointer (Hard Guard 9).</item>
/// <item>GET 400 for empty countyId.</item>
/// <item>GET 403 for cross-county / no-claim.</item>
/// <item>PUT 200 promotes a Mapped workbook in-county.</item>
/// <item>PUT 400 for empty countyId / workbookId.</item>
/// <item>PUT 400 for Draft / cross-county target (Hard Guard 2).</item>
/// <item>PUT 403 for cross-county / no-claim.</item>
/// <item>DELETE 204 clears an existing pointer.</item>
/// <item>DELETE 404 when no pointer to clear.</item>
/// <item>DELETE 400 / 403 mirror the GET shape.</item>
/// </list>
/// </para>
/// </summary>
public class SyncControllerActiveWorkbookTests
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
        string? principalName = null)
    {
        var qualification  = new Mock<ISaleQualificationService>().Object;
        var compReader     = new Mock<ISalesCompEligibilityReader>().Object;
        var activeWorkbook = new SyncCountyActiveWorkbookService(db);

        var controller = new SyncController(
            qualification,
            db,
            NullLogger<SyncController>.Instance,
            compReader,
            activeWorkbook);

        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null && principalName is null ? null : "Test",
            nameType: ClaimsIdentity.DefaultNameClaimType,
            roleType: ClaimsIdentity.DefaultRoleClaimType);
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        if (principalName is not null)
        {
            identity.AddClaim(new Claim(ClaimsIdentity.DefaultNameClaimType, principalName));
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
        TerraFusionDbContext db, Guid countyId,
        string status = "Mapped", string name = "wb")
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

    // ════════════════════════════════════════════════════════════════════
    //  GET /api/sync/active-workbook
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetActiveWorkbook_ReturnsSnapshotWhenPointerExists()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", "first promotion");

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetActiveWorkbook(county.Id);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.CountyId.Should().Be(county.Id);
        dto.ActiveWorkbookId.Should().Be(wbId);
        dto.SetBy.Should().Be("promoter");
        dto.SetReason.Should().Be("first promotion");
    }

    [Fact]
    public async Task GetActiveWorkbook_Returns404WhenNoPointer()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.GetActiveWorkbook(county.Id);

        result.Should().BeOfType<NotFoundObjectResult>(
            "Hard Guard 9: no-pointer is a valid state surfaced as 404");
    }

    [Fact]
    public async Task GetActiveWorkbook_Returns400WhenCountyIdEmpty()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.GetActiveWorkbook(Guid.Empty);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetActiveWorkbook_Returns403ForCrossCountyRequest()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = await SeedWorkbookAsync(db, benton.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(benton.Id, bentonWb, "promoter", null);

        // Yakima principal asks for Benton's pointer.
        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.GetActiveWorkbook(benton.Id);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetActiveWorkbook_Returns403ForPrincipalWithoutCountyClaim()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: null);

        var result = await controller.GetActiveWorkbook(county.Id);
        result.Should().BeOfType<ForbidResult>();
    }

    // ════════════════════════════════════════════════════════════════════
    //  PUT /api/sync/active-workbook
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task PutActiveWorkbook_PromotesMappedWorkbookAndReturnsSnapshot()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db,
            principalCountyClaim: county.Id,
            principalName: "alice@benton.gov");
        var result = await controller.PutActiveWorkbook(
            county.Id, wbId,
            new ActiveWorkbookSetRequest("promotion via API"));

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(wbId);
        dto.SetBy.Should().Be("alice@benton.gov",
            "operator id MUST come from the principal name claim, not the request body");
        dto.SetReason.Should().Be("promotion via API");
    }

    [Fact]
    public async Task PutActiveWorkbook_AcceptsNullBodyAndUsesNullReason()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db,
            principalCountyClaim: county.Id,
            principalName: "alice");
        var result = await controller.PutActiveWorkbook(county.Id, wbId, request: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.SetReason.Should().BeNull();
    }

    [Fact]
    public async Task PutActiveWorkbook_Returns400ForEmptyCountyId()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.PutActiveWorkbook(Guid.Empty, Guid.NewGuid(), null);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task PutActiveWorkbook_Returns400ForEmptyWorkbookId()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var controller = BuildController(db, principalCountyClaim: county.Id);

        var result = await controller.PutActiveWorkbook(county.Id, Guid.Empty, null);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task PutActiveWorkbook_Returns400ForDraftTarget()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var draftId = await SeedWorkbookAsync(db, county.Id, status: "Draft");

        var controller = BuildController(db,
            principalCountyClaim: county.Id,
            principalName: "alice");
        var result = await controller.PutActiveWorkbook(county.Id, draftId, null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        // System.Text.Json escapes single quotes to ', so look
        // for the un-quoted Draft / Mapped substrings rather than
        // the verbatim Status='Draft' shape.
        json.Should().Contain("Draft");
        json.Should().Contain("Mapped");
        json.Should().Contain("can be promoted to active");
    }

    [Fact]
    public async Task PutActiveWorkbook_Returns400ForCrossCountyTarget()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = await SeedWorkbookAsync(db, benton.Id);

        // Principal authorized for Yakima tries to PUT Yakima's
        // pointer at a Benton-owned workbook id. The county-isolation
        // guard passes (county claim matches countyId param), but
        // the service-layer validation rejects with "not found for
        // county" → 400.
        var controller = BuildController(db,
            principalCountyClaim: yakima.Id,
            principalName: "alice");
        var result = await controller.PutActiveWorkbook(yakima.Id, bentonWb, null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(bad.Value);
        json.Should().Contain("not found for county");
    }

    [Fact]
    public async Task PutActiveWorkbook_Returns403ForCrossCountyRequest()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = await SeedWorkbookAsync(db, benton.Id);

        // Yakima principal tries to PUT Benton's pointer.
        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.PutActiveWorkbook(benton.Id, bentonWb, null);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task PutActiveWorkbook_Returns403ForPrincipalWithoutCountyClaim()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db, principalCountyClaim: null);
        var result = await controller.PutActiveWorkbook(county.Id, wbId, null);

        result.Should().BeOfType<ForbidResult>();
    }

    // ════════════════════════════════════════════════════════════════════
    //  DELETE /api/sync/active-workbook
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task DeleteActiveWorkbook_Returns204AndClearsPointer()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildController(db,
            principalCountyClaim: county.Id,
            principalName: "alice");
        var result = await controller.DeleteActiveWorkbook(county.Id);

        result.Should().BeOfType<NoContentResult>();
        (await db.SyncCountyActiveWorkbooks.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DeleteActiveWorkbook_Returns404WhenNoPointer()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);

        var controller = BuildController(db, principalCountyClaim: county.Id);
        var result = await controller.DeleteActiveWorkbook(county.Id);

        result.Should().BeOfType<NotFoundObjectResult>(
            "DELETE distinguishes 'nothing-to-clear' (404) from 'cleared' (204)");
    }

    [Fact]
    public async Task DeleteActiveWorkbook_Returns400ForEmptyCountyId()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var controller = BuildController(db, principalCountyClaim: Guid.NewGuid());

        var result = await controller.DeleteActiveWorkbook(Guid.Empty);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeleteActiveWorkbook_Returns403ForCrossCountyRequest()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = await SeedWorkbookAsync(db, benton.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(benton.Id, bentonWb, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: yakima.Id);
        var result = await controller.DeleteActiveWorkbook(benton.Id);

        result.Should().BeOfType<ForbidResult>();
        // Pointer untouched (defense in depth — the action returned
        // 403 before the service was called).
        (await db.SyncCountyActiveWorkbooks.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task DeleteActiveWorkbook_Returns403ForPrincipalWithoutCountyClaim()
    {
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);
        await new SyncCountyActiveWorkbookService(db)
            .SetAsync(county.Id, wbId, "promoter", null);

        var controller = BuildController(db, principalCountyClaim: null);
        var result = await controller.DeleteActiveWorkbook(county.Id);

        result.Should().BeOfType<ForbidResult>();
        (await db.SyncCountyActiveWorkbooks.CountAsync()).Should().Be(1);
    }

    // ════════════════════════════════════════════════════════════════════
    //  Round-trip parity: GET ↔ PUT ↔ DELETE
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task ActiveWorkbookEndpoints_RoundTripCleanly()
    {
        // Verifies the three actions form a coherent state machine
        // and the C41-A invariants survive the full HTTP path.
        await using var db = CreateDb($"awb-api-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var controller = BuildController(db,
            principalCountyClaim: county.Id,
            principalName: "alice");

        // 1. Initial GET → 404 (no pointer yet).
        (await controller.GetActiveWorkbook(county.Id))
            .Should().BeOfType<NotFoundObjectResult>();

        // 2. PUT → 200 with snapshot.
        var put = await controller.PutActiveWorkbook(
            county.Id, wbId, new ActiveWorkbookSetRequest("first set"));
        put.Should().BeOfType<OkObjectResult>();

        // 3. GET → 200 with same snapshot.
        var getResult = await controller.GetActiveWorkbook(county.Id);
        var dto = ((OkObjectResult)getResult).Value
            .Should().BeOfType<ActiveWorkbookSnapshotDto>().Subject;
        dto.ActiveWorkbookId.Should().Be(wbId);
        dto.SetReason.Should().Be("first set");

        // 4. DELETE → 204.
        (await controller.DeleteActiveWorkbook(county.Id))
            .Should().BeOfType<NoContentResult>();

        // 5. GET → 404 again.
        (await controller.GetActiveWorkbook(county.Id))
            .Should().BeOfType<NotFoundObjectResult>();

        // 6. DELETE again → 404 (Hard Guard: 404 distinguishes
        //    nothing-to-clear).
        (await controller.DeleteActiveWorkbook(county.Id))
            .Should().BeOfType<NotFoundObjectResult>();
    }
}
