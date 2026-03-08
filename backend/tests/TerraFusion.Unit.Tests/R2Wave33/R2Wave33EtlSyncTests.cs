using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using Xunit;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CostForgeAIService = TerraFusion.Core.Services.ICostForgeAIService;
using CostForgeService = TerraFusion.Core.Services.ICostForgeService;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave33;

[Trait("Category", "R2Wave33")]
[Trait("Category", "EtlSync")]
public sealed class R2Wave33EtlSyncTests
{
  private static readonly Guid BentonCountyId = Guid.NewGuid();
  private static readonly Guid OtherCountyId = Guid.NewGuid();

  private static DataDbContext CreateDbContext(string name)
  {
    var options = new DbContextOptionsBuilder<DataDbContext>()
      .UseInMemoryDatabase(name)
      .Options;
    var config = new ConfigurationBuilder()
      .AddInMemoryCollection(new Dictionary<string, string?>())
      .Build();
    return new DataDbContext(options, config);
  }

  private static ClaimsPrincipal CreatePrincipal(Guid countyId, string countyCode = "BENTON")
    => new(new ClaimsIdentity(
    [
      new Claim("countyId", countyId.ToString()),
      new Claim("countyCode", countyCode),
      new Claim("sub", "w33-test-user"),
    ], "TestAuth"));

  private static CostForgeController CreateController(DataDbContext db, ClaimsPrincipal? principal = null)
  {
    var controller = new CostForgeController(
      new Mock<CostForgeService>(MockBehavior.Strict).Object,
      new Mock<CostForgeAIService>(MockBehavior.Strict).Object,
      db,
      new Mock<AuditLogger>(MockBehavior.Strict).Object,
      NullLogger<CostForgeController>.Instance);

    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = principal ?? CreatePrincipal(BentonCountyId) },
    };
    return controller;
  }

  private static async Task SeedCounty(DataDbContext db, Guid countyId, string name = "Benton", string fips = "003")
  {
    if (!await db.Counties.AnyAsync(c => c.Id == countyId))
    {
      db.Counties.Add(new County { Id = countyId, Name = name, State = "WA", FipsCode = fips });
      await db.SaveChangesAsync();
    }
  }

  private static EtlSyncRecord MakeRecord(string key, Dictionary<string, string?>? data = null)
    => new() { Key = key, Data = data ?? new() { ["field1"] = "value1" } };

  // ════════════════════════════════════════
  // ETL Sync Job Execution
  // ════════════════════════════════════════

  [Fact]
  public async Task Sync_ValidRecords_AllProcessed()
  {
    using var db = CreateDbContext(nameof(Sync_ValidRecords_AllProcessed));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.StartEtlSync(new EtlSyncRequest
    {
      SourceSystem = "harris_pacs",
      EntityType = "parcels",
      Records = new()
      {
        MakeRecord("P-001"),
        MakeRecord("P-002"),
        MakeRecord("P-003"),
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("status").GetString().Should().Be("completed");
    doc.RootElement.GetProperty("processedRecords").GetInt32().Should().Be(3);
    doc.RootElement.GetProperty("failedRecords").GetInt32().Should().Be(0);
    doc.RootElement.GetProperty("sourceSystem").GetString().Should().Be("harris_pacs");
    doc.RootElement.GetProperty("entityType").GetString().Should().Be("parcels");
  }

  [Fact]
  public async Task Sync_MissingKey_RecordFails()
  {
    using var db = CreateDbContext(nameof(Sync_MissingKey_RecordFails));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.StartEtlSync(new EtlSyncRequest
    {
      Records = new()
      {
        MakeRecord("P-001"),
        new() { Key = null, Data = new() { ["x"] = "y" } }, // missing key
        new() { Key = "", Data = new() { ["x"] = "y" } },   // empty key
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("processedRecords").GetInt32().Should().Be(1);
    doc.RootElement.GetProperty("failedRecords").GetInt32().Should().Be(2);
  }

  [Fact]
  public async Task Sync_EmptyDataPayload_RecordFails()
  {
    using var db = CreateDbContext(nameof(Sync_EmptyDataPayload_RecordFails));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.StartEtlSync(new EtlSyncRequest
    {
      Records = new()
      {
        new() { Key = "P-001", Data = new() },
        new() { Key = "P-002", Data = null },
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("failedRecords").GetInt32().Should().Be(2);
    doc.RootElement.GetProperty("processedRecords").GetInt32().Should().Be(0);
    doc.RootElement.GetProperty("status").GetString().Should().Be("failed");
  }

  [Fact]
  public async Task Sync_EmptyRecords_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(Sync_EmptyRecords_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.StartEtlSync(new EtlSyncRequest { Records = new() });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task Sync_PersistsToDb()
  {
    using var db = CreateDbContext(nameof(Sync_PersistsToDb));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.StartEtlSync(new EtlSyncRequest
    {
      SourceSystem = "tyler_vision",
      EntityType = "sales",
      Direction = "inbound",
      Records = new() { MakeRecord("S-001") },
    });

    var entities = await db.Set<EtlSyncJob>().ToListAsync();
    entities.Should().HaveCount(1);
    entities[0].SourceSystem.Should().Be("tyler_vision");
    entities[0].EntityType.Should().Be("sales");
  }

  [Fact]
  public async Task Sync_IncludesThroughputMetrics()
  {
    using var db = CreateDbContext(nameof(Sync_IncludesThroughputMetrics));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.StartEtlSync(new EtlSyncRequest
    {
      Records = new() { MakeRecord("P-001"), MakeRecord("P-002") },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("durationMs").GetInt64().Should().BeGreaterThanOrEqualTo(0);
    doc.RootElement.GetProperty("recordsPerSecond").GetDouble().Should().BeGreaterThanOrEqualTo(0);
  }

  // ════════════════════════════════════════
  // Retrieval & County Isolation
  // ════════════════════════════════════════

  [Fact]
  public async Task GetEtlJob_RetrievesById()
  {
    using var db = CreateDbContext(nameof(GetEtlJob_RetrievesById));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.StartEtlSync(new EtlSyncRequest
    {
      SourceSystem = "harris_pacs",
      Records = new() { MakeRecord("P-001") },
    });
    var saved = await db.Set<EtlSyncJob>().FirstAsync();

    var result = await controller.GetEtlSyncJob(saved.Id);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("sourceSystem").GetString().Should().Be("harris_pacs");
  }

  [Fact]
  public async Task GetEtlJob_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetEtlJob_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    await SeedCounty(db, OtherCountyId, "Other", "999");

    var bentonController = CreateController(db, CreatePrincipal(BentonCountyId));
    await bentonController.StartEtlSync(new EtlSyncRequest
    {
      Records = new() { MakeRecord("P-001") },
    });
    var saved = await db.Set<EtlSyncJob>().FirstAsync();

    var otherController = CreateController(db, CreatePrincipal(OtherCountyId, "OTHER"));
    var result = await otherController.GetEtlSyncJob(saved.Id);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetHistory_FiltersBySourceSystem()
  {
    using var db = CreateDbContext(nameof(GetHistory_FiltersBySourceSystem));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.StartEtlSync(new EtlSyncRequest
    {
      SourceSystem = "harris_pacs",
      Records = new() { MakeRecord("P-001") },
    });
    await controller.StartEtlSync(new EtlSyncRequest
    {
      SourceSystem = "tyler_vision",
      Records = new() { MakeRecord("S-001") },
    });

    var result = await controller.GetEtlHistory(sourceSystem: "harris_pacs", entityType: null);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(1);
  }

  [Fact]
  public async Task RequiresCountyContext()
  {
    using var db = CreateDbContext(nameof(RequiresCountyContext));
    var controller = CreateController(db, new ClaimsPrincipal(new ClaimsIdentity()));

    var result = await controller.StartEtlSync(new EtlSyncRequest
    {
      Records = new() { MakeRecord("P-001") },
    });

    result.Should().BeOfType<UnauthorizedObjectResult>();
  }
}
