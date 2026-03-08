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

namespace TerraFusion.Unit.Tests.R2Wave30;

[Trait("Category", "R2Wave30")]
[Trait("Category", "RcwCalculators")]
public sealed class R2Wave30RcwCalculatorTests
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
      new Claim("sub", "w30-test-user"),
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

  // ════════════════════════════════════════
  // RCW 84.34 — Open Space / Current Use
  // ════════════════════════════════════════

  [Fact]
  public async Task Rcw8434_FarmAndAgricultural_ReducesValue()
  {
    using var db = CreateDbContext(nameof(Rcw8434_FarmAndAgricultural_ReducesValue));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8434(new Rcw8434Request
    {
      ParcelId = "P-001",
      Classification = "farm_and_agricultural",
      MarketValue = 500_000m,
      Acreage = 20m,
      LevyRate = 10.0,
      TaxYear = 2026,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("statute").GetString().Should().Be("rcw_84_34");
    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeTrue();
    // 20 acres * $500/acre = $10,000 reduced value
    doc.RootElement.GetProperty("reducedValue").GetDecimal().Should().Be(10_000m);
    doc.RootElement.GetProperty("exemptionAmount").GetDecimal().Should().Be(490_000m);
    doc.RootElement.GetProperty("taxSavings").GetDecimal().Should().BeGreaterThan(0);
  }

  [Fact]
  public async Task Rcw8434_TooFewAcres_DoesNotQualify()
  {
    using var db = CreateDbContext(nameof(Rcw8434_TooFewAcres_DoesNotQualify));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8434(new Rcw8434Request
    {
      MarketValue = 300_000m,
      Acreage = 3m,
      LevyRate = 10.0,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeFalse();
    doc.RootElement.GetProperty("disqualificationReason").GetString().Should().Contain("5 acres");
  }

  [Fact]
  public async Task Rcw8434_PersistsToDb()
  {
    using var db = CreateDbContext(nameof(Rcw8434_PersistsToDb));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateRcw8434(new Rcw8434Request
    {
      MarketValue = 400_000m, Acreage = 10m, LevyRate = 10.0,
    });

    var entities = await db.Set<RcwCalculation>().ToListAsync();
    entities.Should().HaveCount(1);
    entities[0].Statute.Should().Be("rcw_84_34");
  }

  // ════════════════════════════════════════
  // RCW 84.26 — Historic Property
  // ════════════════════════════════════════

  [Fact]
  public async Task Rcw8426_QualifiedRehab_ReducesToPreRehabValue()
  {
    using var db = CreateDbContext(nameof(Rcw8426_QualifiedRehab_ReducesToPreRehabValue));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8426(new Rcw8426Request
    {
      ParcelId = "H-001",
      MarketValue = 400_000m,
      PreRehabValue = 200_000m,
      RehabilitationCost = 100_000m, // 50% of pre-rehab → qualifies (>=25%)
      YearDesignated = 2020,
      LevyRate = 10.0,
      TaxYear = 2026,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("statute").GetString().Should().Be("rcw_84_26");
    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("reducedValue").GetDecimal().Should().Be(200_000m);
    doc.RootElement.GetProperty("exemptionAmount").GetDecimal().Should().Be(200_000m);
    doc.RootElement.GetProperty("yearsRemaining").GetInt32().Should().BeGreaterThanOrEqualTo(0);
  }

  [Fact]
  public async Task Rcw8426_InsufficientRehab_DoesNotQualify()
  {
    using var db = CreateDbContext(nameof(Rcw8426_InsufficientRehab_DoesNotQualify));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8426(new Rcw8426Request
    {
      MarketValue = 400_000m,
      PreRehabValue = 200_000m,
      RehabilitationCost = 10_000m, // 5% — below 25% threshold
      YearDesignated = 2020,
      LevyRate = 10.0,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeFalse();
    doc.RootElement.GetProperty("disqualificationReason").GetString().Should().Contain("25%");
  }

  // ════════════════════════════════════════
  // RCW 84.36.381 — Senior/Disabled
  // ════════════════════════════════════════

  [Fact]
  public async Task Rcw8436381_Tier1_FullExemption()
  {
    using var db = CreateDbContext(nameof(Rcw8436381_Tier1_FullExemption));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8436381(new Rcw8436381Request
    {
      ParcelId = "S-001",
      MarketValue = 300_000m,
      Age = 65,
      Income = 30_000m,
      LevyRate = 10.0,
      TaxYear = 2026,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("tier").GetString().Should().Be("tier_1");
    doc.RootElement.GetProperty("reducedValue").GetDecimal().Should().Be(150_000m);
    doc.RootElement.GetProperty("exemptionAmount").GetDecimal().Should().Be(150_000m);
  }

  [Fact]
  public async Task Rcw8436381_Tier2_PartialExemption()
  {
    using var db = CreateDbContext(nameof(Rcw8436381_Tier2_PartialExemption));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8436381(new Rcw8436381Request
    {
      MarketValue = 300_000m,
      Age = 62,
      Income = 45_000m,
      LevyRate = 10.0,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("tier").GetString().Should().Be("tier_2");
    doc.RootElement.GetProperty("reducedValue").GetDecimal().Should().Be(200_000m);
  }

  [Fact]
  public async Task Rcw8436381_Tier3_ReducedRate()
  {
    using var db = CreateDbContext(nameof(Rcw8436381_Tier3_ReducedRate));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8436381(new Rcw8436381Request
    {
      MarketValue = 300_000m,
      Age = 70,
      Income = 60_000m,
      LevyRate = 10.0,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("tier").GetString().Should().Be("tier_3");
    doc.RootElement.GetProperty("reducedValue").GetDecimal().Should().Be(270_000m); // 90%
  }

  [Fact]
  public async Task Rcw8436381_OverIncome_DoesNotQualify()
  {
    using var db = CreateDbContext(nameof(Rcw8436381_OverIncome_DoesNotQualify));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8436381(new Rcw8436381Request
    {
      MarketValue = 300_000m,
      Age = 65,
      Income = 100_000m,
      LevyRate = 10.0,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeFalse();
    doc.RootElement.GetProperty("tier").GetString().Should().Be("over_income");
  }

  [Fact]
  public async Task Rcw8436381_TooYoungNotDisabled_DoesNotQualify()
  {
    using var db = CreateDbContext(nameof(Rcw8436381_TooYoungNotDisabled_DoesNotQualify));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8436381(new Rcw8436381Request
    {
      MarketValue = 300_000m,
      Age = 50,
      IsDisabled = false,
      Income = 30_000m,
      LevyRate = 10.0,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeFalse();
    doc.RootElement.GetProperty("disqualificationReason").GetString().Should().Contain("61");
  }

  [Fact]
  public async Task Rcw8436381_DisabledPersonQualifies()
  {
    using var db = CreateDbContext(nameof(Rcw8436381_DisabledPersonQualifies));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateRcw8436381(new Rcw8436381Request
    {
      MarketValue = 300_000m,
      Age = 45,
      IsDisabled = true,
      Income = 30_000m,
      LevyRate = 10.0,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("qualifies").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("tier").GetString().Should().Be("tier_1");
  }

  // ════════════════════════════════════════
  // Retrieval & County Isolation
  // ════════════════════════════════════════

  [Fact]
  public async Task GetRcwCalculation_RetrievesById()
  {
    using var db = CreateDbContext(nameof(GetRcwCalculation_RetrievesById));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateRcw8434(new Rcw8434Request
    {
      ParcelId = "P-001", MarketValue = 500_000m, Acreage = 10m, LevyRate = 10.0,
    });
    var saved = await db.Set<RcwCalculation>().FirstAsync();

    var result = await controller.GetRcwCalculation(saved.Id);

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("id").GetInt32().Should().Be(saved.Id);
    doc.RootElement.GetProperty("statute").GetString().Should().Be("rcw_84_34");
  }

  [Fact]
  public async Task GetRcwCalculation_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetRcwCalculation_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    await SeedCounty(db, OtherCountyId, "Other", "999");

    var bentonController = CreateController(db, CreatePrincipal(BentonCountyId));
    await bentonController.CalculateRcw8434(new Rcw8434Request
    {
      MarketValue = 100_000m, Acreage = 10m, LevyRate = 10.0,
    });
    var saved = await db.Set<RcwCalculation>().FirstAsync();

    var otherController = CreateController(db, CreatePrincipal(OtherCountyId, "OTHER"));
    var result = await otherController.GetRcwCalculation(saved.Id);

    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetHistory_FiltersOnStatute()
  {
    using var db = CreateDbContext(nameof(GetHistory_FiltersOnStatute));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateRcw8434(new Rcw8434Request
    {
      MarketValue = 400_000m, Acreage = 10m, LevyRate = 10.0,
    });
    await controller.CalculateRcw8436381(new Rcw8436381Request
    {
      MarketValue = 300_000m, Age = 65, Income = 30_000m, LevyRate = 10.0,
    });

    var result = await controller.GetRcwHistory(statute: "rcw_84_34");

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

    var result = await controller.CalculateRcw8434(new Rcw8434Request
    {
      MarketValue = 200_000m, Acreage = 10m, LevyRate = 10.0,
    });

    result.Should().BeOfType<UnauthorizedObjectResult>();
  }
}
