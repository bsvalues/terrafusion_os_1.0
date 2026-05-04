// CI-HYGIENE-D (#751): tests rewritten to assert the server-side CAMA scan
// contract established by commit 14a5a969d (April 16, 2026):
// "AssessDataQuality rewritten to self-query CamaCharacteristics directly
//  (was: client-supplied records array — broke DataQualityTab which sends
//  {taxYear})". Tests previously asserted the deprecated client-supplied
//  records contract; this rewrite aligns to current production doctrine.
//  Same pattern as PR #745 (R14 evidence-only) and PR #758 (R14Phase2P0).
//
// Doctrine summary of the current /api/costforge/analytics/data-quality/assess
// endpoint (CostForgeController.AssessDataQuality, src line ~6813):
//   - [AllowAnonymous] — explicit dev-environment doctrine
//   - Server-side CAMA scan (ignores any client-supplied Records)
//   - Returns 0-1 float scale: completenessScore, accuracyScore,
//     consistencyScore, outlierDetection, issues, assessedAt, totalRecords
//   - Does NOT persist to DataQualityAssessments
//   - Empty CAMA → returns Ok with zero scores (no BadRequest)
// The companion read endpoints GetDataQualityAssessment and
// GetDataQualityHistory still exist and still require county context;
// tests now seed DataQualityAssessment rows directly to drive them.

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

namespace TerraFusion.Unit.Tests.R2Wave32;

[Trait("Category", "R2Wave32")]
[Trait("Category", "DataQuality")]
public sealed class R2Wave32DataQualityTests
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
      new Claim("sub", "w32-test-user"),
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

  /// <summary>
  /// Seed a CAMA characteristic that is "perfect" — populated and consistent —
  /// so the server-side scan reports clean scores. Tests can override fields
  /// via the action delegate to inject defects (missing field, bad year,
  /// effective-age &gt; economic-life, etc).
  /// </summary>
  private static async Task SeedCama(
      DataDbContext db,
      Guid countyId,
      string parcelId,
      int taxYear,
      Action<CamaCharacteristic>? mutate = null)
  {
    var c = new CamaCharacteristic
    {
      Id = Guid.NewGuid(),
      ParcelId = parcelId,
      TaxYear = taxYear,
      BuildingType = "R1",
      SquareFeet = 2000m,
      QualityGrade = "STANDARD",
      ConditionGrade = "GOOD",
      NeighborhoodCode = "N01",
      YearBuilt = 1995,
      EffectiveAge = 20,
      EconomicLife = 60,
      ImprvVal = 250_000m,
      CountyId = countyId,
    };
    mutate?.Invoke(c);
    db.CamaCharacteristics.Add(c);
    await db.SaveChangesAsync();
  }

  /// <summary>
  /// Seed a DataQualityAssessment row directly (production AssessDataQuality
  /// no longer writes; the read endpoints still query this table).
  /// </summary>
  private static async Task<DataQualityAssessment> SeedAssessment(
      DataDbContext db,
      Guid countyId,
      string scope = "county",
      double overallScore = 92,
      string grade = "A")
  {
    var entity = new DataQualityAssessment
    {
      CountyId = countyId,
      Scope = scope,
      TotalRecords = 10,
      CompleteRecords = 10,
      CompletenessScore = 100,
      ConsistentRecords = 10,
      ConsistencyScore = 100,
      TimelyRecords = 10,
      TimelinessScore = 100,
      AccurateRecords = 10,
      AccuracyScore = 100,
      OverallScore = overallScore,
      Grade = grade,
      IssueCount = 0,
      CreatedBy = "w32-test-user",
      CreatedAt = DateTime.UtcNow,
    };
    db.Set<DataQualityAssessment>().Add(entity);
    await db.SaveChangesAsync();
    return entity;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Quality Assessment — server-side CAMA scan (0-1 scale, no persistence)
  // ────────────────────────────────────────────────────────────────────────

  [Fact]
  public async Task Assess_PerfectData_HighScores()
  {
    using var db = CreateDbContext(nameof(Assess_PerfectData_HighScores));
    await SeedCounty(db, BentonCountyId);
    var taxYear = DateTime.UtcNow.Year;
    await SeedCama(db, BentonCountyId, "P-001", taxYear);
    await SeedCama(db, BentonCountyId, "P-002", taxYear);
    await SeedCama(db, BentonCountyId, "P-003", taxYear);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest { TaxYear = taxYear });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    doc.RootElement.GetProperty("completenessScore").GetDouble().Should().Be(1.0);
    doc.RootElement.GetProperty("accuracyScore").GetDouble().Should().Be(1.0);
    doc.RootElement.GetProperty("consistencyScore").GetDouble().Should().Be(1.0);
    doc.RootElement.GetProperty("totalRecords").GetInt32().Should().Be(3);
  }

  [Fact]
  public async Task Assess_MissingFields_LowersCompleteness()
  {
    using var db = CreateDbContext(nameof(Assess_MissingFields_LowersCompleteness));
    await SeedCounty(db, BentonCountyId);
    var taxYear = DateTime.UtcNow.Year;
    // 1 perfect record + 1 with all three completeness-tracked fields nulled
    await SeedCama(db, BentonCountyId, "P-001", taxYear);
    await SeedCama(db, BentonCountyId, "P-002", taxYear, c =>
    {
      c.YearBuilt = null;
      c.SquareFeet = 0m;
      c.QualityGrade = null;
    });
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest { TaxYear = taxYear });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    // Completeness divisor is total*3 across YearBuilt+SquareFeet+QualityGrade.
    // 3 missing of 6 cells → 1 - 3/6 = 0.5
    doc.RootElement.GetProperty("completenessScore").GetDouble().Should().BeApproximately(0.5, 0.01);
  }

  [Fact]
  public async Task Assess_NegativeImprvVal_LowersAccuracyAndFlagsIssue()
  {
    using var db = CreateDbContext(nameof(Assess_NegativeImprvVal_LowersAccuracyAndFlagsIssue));
    await SeedCounty(db, BentonCountyId);
    var taxYear = DateTime.UtcNow.Year;
    await SeedCama(db, BentonCountyId, "P-001", taxYear, c => c.ImprvVal = -50_000m);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest { TaxYear = taxYear });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    // 1 bad ImprvVal of 3 accuracy cells → 1 - 1/3 ≈ 0.6667
    doc.RootElement.GetProperty("accuracyScore").GetDouble().Should().BeLessThan(1.0);
    var issues = doc.RootElement.GetProperty("issues").EnumerateArray().ToList();
    issues.Should().Contain(i =>
      i.GetProperty("category").GetString() == "Accuracy" &&
      i.GetProperty("field").GetString() == "ImprvVal");
  }

  [Fact]
  public async Task Assess_EffectiveAgeExceedsEconomicLife_LowersConsistency()
  {
    using var db = CreateDbContext(nameof(Assess_EffectiveAgeExceedsEconomicLife_LowersConsistency));
    await SeedCounty(db, BentonCountyId);
    var taxYear = DateTime.UtcNow.Year;
    await SeedCama(db, BentonCountyId, "P-001", taxYear, c =>
    {
      c.EffectiveAge = 100;
      c.EconomicLife = 60;
    });
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest { TaxYear = taxYear });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    doc.RootElement.GetProperty("consistencyScore").GetDouble().Should().BeLessThan(1.0);
    var issues = doc.RootElement.GetProperty("issues").EnumerateArray().ToList();
    issues.Should().Contain(i =>
      i.GetProperty("category").GetString() == "Consistency" &&
      i.GetProperty("field").GetString() == "EffectiveAge/EconomicLife");
  }

  [Fact]
  public async Task Assess_OutOfRangeYearBuilt_LowersAccuracy()
  {
    using var db = CreateDbContext(nameof(Assess_OutOfRangeYearBuilt_LowersAccuracy));
    await SeedCounty(db, BentonCountyId);
    var taxYear = DateTime.UtcNow.Year;
    await SeedCama(db, BentonCountyId, "P-001", taxYear, c => c.YearBuilt = 1500); // < 1800
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest { TaxYear = taxYear });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    doc.RootElement.GetProperty("accuracyScore").GetDouble().Should().BeLessThan(1.0);
  }

  [Fact]
  public async Task Assess_EmptyCama_ReturnsOkWithZeroScores()
  {
    // April 16 doctrine: production no longer validates a Records array;
    // the CAMA scan with no rows returns Ok with zero scores rather than
    // BadRequest. (Was: BadRequest on empty client-supplied records.)
    using var db = CreateDbContext(nameof(Assess_EmptyCama_ReturnsOkWithZeroScores));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      TaxYear = DateTime.UtcNow.Year,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    doc.RootElement.GetProperty("completenessScore").GetDouble().Should().Be(0.0);
    doc.RootElement.GetProperty("accuracyScore").GetDouble().Should().Be(0.0);
    doc.RootElement.GetProperty("consistencyScore").GetDouble().Should().Be(0.0);
  }

  [Fact]
  public async Task Assess_DoesNotPersistToDb()
  {
    // April 16 doctrine: AssessDataQuality is a read-only CAMA scan and
    // does NOT write a DataQualityAssessment row. The previous test asserted
    // persistence; this test now asserts the opposite to lock the contract.
    using var db = CreateDbContext(nameof(Assess_DoesNotPersistToDb));
    await SeedCounty(db, BentonCountyId);
    var taxYear = DateTime.UtcNow.Year;
    await SeedCama(db, BentonCountyId, "P-001", taxYear);
    var controller = CreateController(db);

    await controller.AssessDataQuality(new DataQualityRequest
    {
      Scope = "district",
      TaxYear = taxYear,
    });

    var entities = await db.Set<DataQualityAssessment>().ToListAsync();
    entities.Should().BeEmpty(
      "AssessDataQuality is a stateless CAMA scan per April 16, 2026 commit 14a5a969d");
  }

  [Fact]
  public async Task Assess_AnonymousPrincipal_StillSucceeds()
  {
    // April 16 doctrine: the endpoint is explicitly [AllowAnonymous] for
    // dev-environment use. Anonymous callers must not be rejected.
    using var db = CreateDbContext(nameof(Assess_AnonymousPrincipal_StillSucceeds));
    await SeedCounty(db, BentonCountyId);
    var taxYear = DateTime.UtcNow.Year;
    await SeedCama(db, BentonCountyId, "P-001", taxYear);
    var controller = CreateController(db, new ClaimsPrincipal(new ClaimsIdentity()));

    var result = await controller.AssessDataQuality(new DataQualityRequest { TaxYear = taxYear });

    result.Should().BeOfType<OkObjectResult>(
      "AssessDataQuality is [AllowAnonymous] — anonymous principals must succeed");
  }

  // ────────────────────────────────────────────────────────────────────────
  // Retrieval & County Isolation — read endpoints still require county ctx
  // ────────────────────────────────────────────────────────────────────────

  [Fact]
  public async Task GetAssessment_RetrievesById()
  {
    using var db = CreateDbContext(nameof(GetAssessment_RetrievesById));
    await SeedCounty(db, BentonCountyId);
    var saved = await SeedAssessment(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.GetDataQualityAssessment(saved.Id);

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    doc.RootElement.GetProperty("id").GetInt32().Should().Be(saved.Id);
  }

  [Fact]
  public async Task GetAssessment_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetAssessment_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    await SeedCounty(db, OtherCountyId, "Other", "999");
    var saved = await SeedAssessment(db, BentonCountyId);

    var otherController = CreateController(db, CreatePrincipal(OtherCountyId, "OTHER"));
    var result = await otherController.GetDataQualityAssessment(saved.Id);

    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetHistory_FiltersByScope()
  {
    using var db = CreateDbContext(nameof(GetHistory_FiltersByScope));
    await SeedCounty(db, BentonCountyId);
    await SeedAssessment(db, BentonCountyId, scope: "county");
    await SeedAssessment(db, BentonCountyId, scope: "district");
    var controller = CreateController(db);

    var result = await controller.GetDataQualityHistory(scope: "district");

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(1);
  }

  [Fact]
  public async Task GetAssessment_RequiresCountyContext()
  {
    // Read endpoints (Get*) still require county context, even though
    // AssessDataQuality is now [AllowAnonymous]. Anonymous principals on
    // GetDataQualityAssessment must be Unauthorized.
    using var db = CreateDbContext(nameof(GetAssessment_RequiresCountyContext));
    await SeedCounty(db, BentonCountyId);
    var saved = await SeedAssessment(db, BentonCountyId);
    var controller = CreateController(db, new ClaimsPrincipal(new ClaimsIdentity()));

    var result = await controller.GetDataQualityAssessment(saved.Id);

    result.Should().BeOfType<UnauthorizedObjectResult>();
  }
}
