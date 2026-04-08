using System.Security.Claims;
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

namespace TerraFusion.Unit.Tests.R2Wave25;

[Trait("Category", "R2Wave25")]
[Trait("Category", "ForgeValuation")]
public sealed class R2Wave25ForgeValuationTests
{
  private static readonly Guid BentonCountyId = Guid.NewGuid();
  private const string BentonFips = "003";

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
  {
    return new ClaimsPrincipal(new ClaimsIdentity(
    [
      new Claim("countyId", countyId.ToString()),
      new Claim("countyCode", countyCode),
      new Claim("sub", "w25-test-user"),
      new Claim("userId", "w25-test-user"),
    ], "TestAuth"));
  }

  private static ClaimsPrincipal CreateEmptyPrincipal()
    => new(new ClaimsIdentity());

  private static void AttachPrincipal(ControllerBase controller, ClaimsPrincipal principal)
  {
    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = principal },
    };
  }

  private static CostForgeController CreateController(DataDbContext db, ClaimsPrincipal? principal = null)
  {
    var costForge = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAi = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
      costForge.Object, costForgeAi.Object, db, auditLogger.Object,
      NullLogger<CostForgeController>.Instance);

    AttachPrincipal(controller, principal ?? CreatePrincipal(BentonCountyId));
    return controller;
  }

  private static async Task SeedCounty(DataDbContext db, Guid countyId)
  {
    if (!await db.Counties.AnyAsync(c => c.Id == countyId))
    {
      db.Counties.Add(new County
      {
        Id = countyId,
        Name = "Benton",
        State = "WA",
        FipsCode = BentonFips,
      });
      await db.SaveChangesAsync();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Valuation Record CRUD
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task SaveValuationRecord_ReturnsCreated()
  {
    using var db = CreateDbContext(nameof(SaveValuationRecord_ReturnsCreated));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.SaveValuationRecord(new CostForgeController.SaveValuationRequest
    {
      ParcelId = "P-001",
      TaxYear = 2026,
      PropertyType = "residential",
      CostApproachValue = 250_000m,
      CostConfidence = "high",
      FinalReconciledValue = 260_000m,
      OverallConfidence = "high",
    });

    var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
    created.StatusCode.Should().Be(201);

    var records = await db.ValuationRecords.ToListAsync();
    records.Should().HaveCount(1);
    records[0].ParcelId.Should().Be("P-001");
    records[0].Status.Should().Be("draft");
  }

  [Fact]
  public async Task SaveValuationRecord_WithoutCounty_ReturnsUnauthorized()
  {
    using var db = CreateDbContext(nameof(SaveValuationRecord_WithoutCounty_ReturnsUnauthorized));
    var controller = CreateController(db, CreateEmptyPrincipal());

    var result = await controller.SaveValuationRecord(new CostForgeController.SaveValuationRequest
    {
      ParcelId = "P-002",
      TaxYear = 2026,
      PropertyType = "residential",
    });

    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  [Fact]
  public async Task GetValuationRecord_ReturnsOk()
  {
    using var db = CreateDbContext(nameof(GetValuationRecord_ReturnsOk));
    await SeedCounty(db, BentonCountyId);

    var recordId = Guid.NewGuid();
    db.ValuationRecords.Add(new ValuationRecord
    {
      Id = recordId,
      ParcelId = "P-003",
      TaxYear = 2026,
      PropertyType = "residential",
      FinalReconciledValue = 300_000m,
      Status = "draft",
      CountyId = BentonCountyId,
    });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.GetValuationRecord(recordId);

    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  public async Task GetValuationRecord_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetValuationRecord_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);

    var otherCountyId = Guid.NewGuid();
    db.ValuationRecords.Add(new ValuationRecord
    {
      Id = Guid.NewGuid(),
      ParcelId = "P-004",
      TaxYear = 2026,
      PropertyType = "residential",
      Status = "draft",
      CountyId = otherCountyId,
    });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.GetValuationRecord(db.ValuationRecords.First().Id);

    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetParcelValuations_FiltersCorrectly()
  {
    using var db = CreateDbContext(nameof(GetParcelValuations_FiltersCorrectly));
    await SeedCounty(db, BentonCountyId);

    db.ValuationRecords.AddRange(
      new ValuationRecord { ParcelId = "P-005", TaxYear = 2025, PropertyType = "residential", Status = "draft", CountyId = BentonCountyId },
      new ValuationRecord { ParcelId = "P-005", TaxYear = 2026, PropertyType = "residential", Status = "draft", CountyId = BentonCountyId },
      new ValuationRecord { ParcelId = "P-006", TaxYear = 2026, PropertyType = "residential", Status = "draft", CountyId = BentonCountyId }
    );
    await db.SaveChangesAsync();

    var controller = CreateController(db);

    // All for parcel
    var result = await controller.GetParcelValuations("P-005");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var list = (ok.Value as System.Collections.IEnumerable)!.Cast<ValuationRecord>().ToList();
    list.Should().HaveCount(2);

    // Filtered by year
    var result2 = await controller.GetParcelValuations("P-005", taxYear: 2026);
    var ok2 = result2.Should().BeOfType<OkObjectResult>().Subject;
    var list2 = (ok2.Value as System.Collections.IEnumerable)!.Cast<ValuationRecord>().ToList();
    list2.Should().HaveCount(1);
    list2[0].TaxYear.Should().Be(2026);
  }

  // ═══════════════════════════════════════════════════════════════
  // Valuation Status Transitions
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task UpdateValuationStatus_DraftToReviewed_Succeeds()
  {
    using var db = CreateDbContext(nameof(UpdateValuationStatus_DraftToReviewed_Succeeds));
    await SeedCounty(db, BentonCountyId);

    var recordId = Guid.NewGuid();
    db.ValuationRecords.Add(new ValuationRecord
    {
      Id = recordId,
      ParcelId = "P-010",
      TaxYear = 2026,
      PropertyType = "residential",
      Status = "draft",
      CountyId = BentonCountyId,
    });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.UpdateValuationStatus(recordId,
      new CostForgeController.UpdateStatusRequest { Status = "reviewed" });

    result.Should().BeOfType<OkObjectResult>();
    var updated = await db.ValuationRecords.FindAsync(recordId);
    updated!.Status.Should().Be("reviewed");
    updated.ReviewedAt.Should().NotBeNull();
  }

  [Fact]
  public async Task UpdateValuationStatus_ReviewedToSealed_Succeeds()
  {
    using var db = CreateDbContext(nameof(UpdateValuationStatus_ReviewedToSealed_Succeeds));
    await SeedCounty(db, BentonCountyId);

    var recordId = Guid.NewGuid();
    db.ValuationRecords.Add(new ValuationRecord
    {
      Id = recordId,
      ParcelId = "P-011",
      TaxYear = 2026,
      PropertyType = "residential",
      Status = "reviewed",
      CountyId = BentonCountyId,
    });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.UpdateValuationStatus(recordId,
      new CostForgeController.UpdateStatusRequest { Status = "sealed" });

    result.Should().BeOfType<OkObjectResult>();
    var updated = await db.ValuationRecords.FindAsync(recordId);
    updated!.Status.Should().Be("sealed");
  }

  [Fact]
  public async Task UpdateValuationStatus_InvalidTransition_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(UpdateValuationStatus_InvalidTransition_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);

    var recordId = Guid.NewGuid();
    db.ValuationRecords.Add(new ValuationRecord
    {
      Id = recordId,
      ParcelId = "P-012",
      TaxYear = 2026,
      PropertyType = "residential",
      Status = "draft",
      CountyId = BentonCountyId,
    });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.UpdateValuationStatus(recordId,
      new CostForgeController.UpdateStatusRequest { Status = "sealed" });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ═══════════════════════════════════════════════════════════════
  // Comparable Sales
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task IngestComparableSale_ReturnsCreated()
  {
    using var db = CreateDbContext(nameof(IngestComparableSale_ReturnsCreated));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.IngestComparableSale(new CostForgeController.IngestComparableRequest
    {
      ParcelId = "S-001",
      SaleDate = new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc),
      SalePrice = 350_000m,
      PropertyType = "residential",
      Neighborhood = "West Richland",
      GrossLivingArea = 2200,
    });

    result.Should().BeOfType<CreatedAtActionResult>();
    var sales = await db.ComparableSales.ToListAsync();
    sales.Should().HaveCount(1);
    sales[0].IsVerified.Should().BeFalse();
    sales[0].QualificationDecision.Should().BeNull();
  }

  [Fact]
  public async Task SearchComparableSales_FiltersCorrectly()
  {
    using var db = CreateDbContext(nameof(SearchComparableSales_FiltersCorrectly));
    await SeedCounty(db, BentonCountyId);

    db.Properties.Add(new Property
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      PropertyId = "PACS-SUBJECT-001",
      ParcelId = "SUBJECT-001",
      ParcelNumber = "SUBJECT-001",
      Address = "100 Main St, Kennewick, WA 99336",
      PropertyType = "residential",
      AssessedValue = 315000m,
      LandValue = 100000m,
      ImprovementValue = 215000m,
      MarketValue = 315000m,
      AssessmentDate = DateTime.UtcNow,
      LastUpdated = DateTime.UtcNow,
      TaxYear = 2026
    });

    db.ComparableSales.AddRange(
      new ComparableSale { ParcelId = "S-010", SaleDate = DateTime.UtcNow.AddMonths(-3), SalePrice = 300_000, PropertyType = "residential", Neighborhood = "Kennewick", GrossLivingArea = 1800, QualificationRecommendation = "qualified", CountyId = BentonCountyId, IngestedBy = "test" },
      new ComparableSale { ParcelId = "S-011", SaleDate = DateTime.UtcNow.AddMonths(-6), SalePrice = 340_000, PropertyType = "residential", Neighborhood = "Richland", GrossLivingArea = 2200, QualificationRecommendation = "qualified", CountyId = BentonCountyId, IngestedBy = "test" },
      new ComparableSale { ParcelId = "S-012", SaleDate = DateTime.UtcNow.AddMonths(-30), SalePrice = 280_000, PropertyType = "commercial", Neighborhood = "Kennewick", GrossLivingArea = 3000, QualificationRecommendation = "qualified", CountyId = BentonCountyId, IngestedBy = "test" }
    );
    await db.SaveChangesAsync();

    var controller = CreateController(db);

    // Subject-aware defaults use the subject's property type and neighborhood.
    var result = await controller.SearchComparableSales("SUBJECT-001");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var value = ok.Value!;
    var count = (int)value.GetType().GetProperty("count")!.GetValue(value)!;
    count.Should().Be(1);
    value.GetType().GetProperty("selectionMethod")!.GetValue(value)!.Should().NotBeNull();

    // Explicit property type still keeps subject neighborhood defaults.
    var result2 = await controller.SearchComparableSales("SUBJECT-001", propertyType: "residential");
    var ok2 = result2.Should().BeOfType<OkObjectResult>().Subject;
    var value2 = ok2.Value!;
    var count2 = (int)value2.GetType().GetProperty("count")!.GetValue(value2)!;
    count2.Should().Be(1);

    // GLA range still honors the subject neighborhood default, so no comp remains here.
    var result3 = await controller.SearchComparableSales("SUBJECT-001", minGla: 2000, maxGla: 2500);
    var ok3 = result3.Should().BeOfType<OkObjectResult>().Subject;
    var value3 = ok3.Value!;
    var count3 = (int)value3.GetType().GetProperty("count")!.GetValue(value3)!;
    count3.Should().Be(0);

    // Filter by neighborhood
    var result4 = await controller.SearchComparableSales("SUBJECT-001", neighborhood: "Kennewick");
    var ok4 = result4.Should().BeOfType<OkObjectResult>().Subject;
    var value4 = ok4.Value!;
    var count4 = (int)value4.GetType().GetProperty("count")!.GetValue(value4)!;
    count4.Should().Be(1);
  }

  [Fact]
  public async Task SearchComparableSales_ExcludesSubjectParcel()
  {
    using var db = CreateDbContext(nameof(SearchComparableSales_ExcludesSubjectParcel));
    await SeedCounty(db, BentonCountyId);

    db.Properties.Add(new Property
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      PropertyId = "PACS-SUBJ",
      ParcelId = "SUBJ",
      ParcelNumber = "SUBJ",
      Address = "101 Main St, Kennewick, WA 99336",
      PropertyType = "residential",
      AssessedValue = 200000m,
      LandValue = 80000m,
      ImprovementValue = 120000m,
      MarketValue = 200000m,
      AssessmentDate = DateTime.UtcNow,
      LastUpdated = DateTime.UtcNow,
      TaxYear = 2026
    });

    db.ComparableSales.AddRange(
      new ComparableSale { ParcelId = "SUBJ", SaleDate = DateTime.UtcNow.AddMonths(-1), SalePrice = 200_000, PropertyType = "residential", Neighborhood = "KENNEWICK", QualificationRecommendation = "qualified", CountyId = BentonCountyId, IngestedBy = "test" },
      new ComparableSale { ParcelId = "COMP-1", SaleDate = DateTime.UtcNow.AddMonths(-2), SalePrice = 210_000, PropertyType = "residential", Neighborhood = "KENNEWICK", QualificationRecommendation = "qualified", CountyId = BentonCountyId, IngestedBy = "test" }
    );
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.SearchComparableSales("SUBJ");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var value = ok.Value!;
    var count = (int)value.GetType().GetProperty("count")!.GetValue(value)!;
    count.Should().Be(1); // Subject excluded
  }

  [Fact]
  public async Task SearchComparableSales_SubjectAwareRanking_PrefersNeighborhoodAndPhysicalSimilarity()
  {
    using var db = CreateDbContext(nameof(SearchComparableSales_SubjectAwareRanking_PrefersNeighborhoodAndPhysicalSimilarity));
    await SeedCounty(db, BentonCountyId);

    db.Properties.Add(new Property
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      PropertyId = "PACS-SUBJECT-RANK",
      ParcelId = "SUBJECT-RANK",
      ParcelNumber = "SUBJECT-RANK",
      Address = "100 Main St, Kennewick, WA 99336",
      PropertyType = "residential",
      AssessedValue = 320000m,
      LandValue = 100000m,
      ImprovementValue = 220000m,
      MarketValue = 320000m,
      AssessmentDate = DateTime.UtcNow,
      LastUpdated = DateTime.UtcNow,
      TaxYear = 2026
    });
    db.CamaCharacteristics.Add(new CamaCharacteristic
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      ParcelId = "SUBJECT-RANK",
      TaxYear = 2026,
      BuildingType = "R1",
      SquareFeet = 2000m,
      LandAreaSqft = 8000m,
      YearBuilt = 2005,
      UpdatedBy = "test"
    });
    db.ComparableSales.AddRange(
      new ComparableSale
      {
        Id = Guid.NewGuid(),
        ParcelId = "COMP-BEST",
        SaleDate = DateTime.UtcNow.AddMonths(-2),
        SalePrice = 318000m,
        PropertyType = "residential",
        Neighborhood = "KENNEWICK",
        GrossLivingArea = 1980m,
        LotSizeSqft = 7900m,
        YearBuilt = 2004,
        QualificationRecommendation = "qualified",
        CountyId = BentonCountyId,
        IngestedBy = "test"
      },
      new ComparableSale
      {
        Id = Guid.NewGuid(),
        ParcelId = "COMP-WORSE",
        SaleDate = DateTime.UtcNow.AddMonths(-1),
        SalePrice = 318000m,
        PropertyType = "commercial",
        Neighborhood = "RICHLAND",
        GrossLivingArea = 4200m,
        LotSizeSqft = 25000m,
        YearBuilt = 1980,
        QualificationRecommendation = "qualified",
        CountyId = BentonCountyId,
        IngestedBy = "test"
      });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.SearchComparableSales("SUBJECT-RANK", limit: 2);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var comparables = (ok.Value!.GetType().GetProperty("comparables")!.GetValue(ok.Value) as System.Collections.IEnumerable)!
      .Cast<object>()
      .ToList();

    comparables.Should().HaveCount(1);
    comparables[0].GetType().GetProperty("ParcelId")!.GetValue(comparables[0])!.Should().Be("COMP-BEST");
  }

  [Fact]
  public async Task SearchComparableSales_ExcludesNonArmsLengthByDefault()
  {
    using var db = CreateDbContext(nameof(SearchComparableSales_ExcludesNonArmsLengthByDefault));
    await SeedCounty(db, BentonCountyId);

    db.Properties.Add(new Property
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      PropertyId = "PACS-SUBJECT-QUAL",
      ParcelId = "SUBJECT-QUAL",
      ParcelNumber = "SUBJECT-QUAL",
      Address = "100 Main St, Kennewick, WA 99336",
      PropertyType = "residential",
      AssessedValue = 250000m,
      LandValue = 90000m,
      ImprovementValue = 160000m,
      MarketValue = 250000m,
      AssessmentDate = DateTime.UtcNow,
      LastUpdated = DateTime.UtcNow,
      TaxYear = 2026
    });

    db.ComparableSales.AddRange(
      new ComparableSale
      {
        Id = Guid.NewGuid(),
        ParcelId = "QUAL-1",
        SaleDate = DateTime.UtcNow.AddMonths(-2),
        SalePrice = 255000m,
        PropertyType = "residential",
        Neighborhood = "KENNEWICK",
        QualificationRecommendation = "qualified",
        CountyId = BentonCountyId,
        IngestedBy = "test"
      },
      new ComparableSale
      {
        Id = Guid.NewGuid(),
        ParcelId = "NONARM-1",
        SaleDate = DateTime.UtcNow.AddMonths(-1),
        SalePrice = 260000m,
        PropertyType = "residential",
        Neighborhood = "KENNEWICK",
        QualificationRecommendation = "non-arms-length",
        CountyId = BentonCountyId,
        IngestedBy = "test"
      });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.SearchComparableSales("SUBJECT-QUAL", limit: 10);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var comparables = (ok.Value!.GetType().GetProperty("comparables")!.GetValue(ok.Value) as System.Collections.IEnumerable)!
      .Cast<object>()
      .ToList();

    comparables.Should().HaveCount(1);
    comparables[0].GetType().GetProperty("ParcelId")!.GetValue(comparables[0])!.Should().Be("QUAL-1");
  }

  [Fact]
  public async Task SearchComparableSales_IncludesHistoricalCompUntilMonthsBackIsExplicit()
  {
    using var db = CreateDbContext(nameof(SearchComparableSales_IncludesHistoricalCompUntilMonthsBackIsExplicit));
    await SeedCounty(db, BentonCountyId);

    db.Properties.Add(new Property
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      PropertyId = "PACS-SUBJECT-HIST",
      ParcelId = "SUBJECT-HIST",
      ParcelNumber = "SUBJECT-HIST",
      Address = "100 Main St, Kennewick, WA 99336",
      PropertyType = "residential",
      AssessedValue = 275000m,
      LandValue = 90000m,
      ImprovementValue = 185000m,
      MarketValue = 275000m,
      AssessmentDate = DateTime.UtcNow,
      LastUpdated = DateTime.UtcNow,
      TaxYear = 2026
    });

    db.ComparableSales.Add(new ComparableSale
    {
      Id = Guid.NewGuid(),
      ParcelId = "HIST-1",
      SaleDate = DateTime.UtcNow.AddMonths(-48),
      SalePrice = 280000m,
      PropertyType = "residential",
      Neighborhood = "KENNEWICK",
      QualificationRecommendation = "qualified",
      CountyId = BentonCountyId,
      IngestedBy = "test"
    });
    await db.SaveChangesAsync();

    var controller = CreateController(db);

    var defaultResult = await controller.SearchComparableSales("SUBJECT-HIST");
    var defaultOk = defaultResult.Should().BeOfType<OkObjectResult>().Subject;
    var defaultCount = (int)defaultOk.Value!.GetType().GetProperty("count")!.GetValue(defaultOk.Value)!;
    defaultCount.Should().Be(1);

    var filteredResult = await controller.SearchComparableSales("SUBJECT-HIST", monthsBack: 24);
    var filteredOk = filteredResult.Should().BeOfType<OkObjectResult>().Subject;
    var filteredCount = (int)filteredOk.Value!.GetType().GetProperty("count")!.GetValue(filteredOk.Value)!;
    filteredCount.Should().Be(0);
  }

  // ═══════════════════════════════════════════════════════════════
  // CAMA Characteristics
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task UpsertCamaCharacteristic_CreatesNew()
  {
    using var db = CreateDbContext(nameof(UpsertCamaCharacteristic_CreatesNew));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.UpsertCamaCharacteristic(new CostForgeController.UpsertCamaRequest
    {
      ParcelId = "C-001",
      TaxYear = 2026,
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 2400,
      QualityGrade = "GOOD",
      ConditionGrade = "GOOD",
      YearBuilt = 2005,
    });

    result.Should().BeOfType<OkObjectResult>();
    var cama = await db.CamaCharacteristics.FirstOrDefaultAsync();
    cama.Should().NotBeNull();
    cama!.BuildingType.Should().Be("R1");
    cama.SquareFeet.Should().Be(2400);
  }

  [Fact]
  public async Task UpsertCamaCharacteristic_UpdatesExisting()
  {
    using var db = CreateDbContext(nameof(UpsertCamaCharacteristic_UpdatesExisting));
    await SeedCounty(db, BentonCountyId);

    db.CamaCharacteristics.Add(new CamaCharacteristic
    {
      ParcelId = "C-002",
      TaxYear = 2026,
      BuildingType = "R1",
      SquareFeet = 1800,
      CountyId = BentonCountyId,
    });
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.UpsertCamaCharacteristic(new CostForgeController.UpsertCamaRequest
    {
      ParcelId = "C-002",
      TaxYear = 2026,
      BuildingType = "R2",
      SquareFeet = 2500,
    });

    result.Should().BeOfType<OkObjectResult>();
    var cama = await db.CamaCharacteristics.FirstOrDefaultAsync();
    cama!.BuildingType.Should().Be("R2");
    cama.SquareFeet.Should().Be(2500);
  }

  [Fact]
  public async Task GetCamaCharacteristics_ReturnsForParcel()
  {
    using var db = CreateDbContext(nameof(GetCamaCharacteristics_ReturnsForParcel));
    await SeedCounty(db, BentonCountyId);

    db.CamaCharacteristics.AddRange(
      new CamaCharacteristic { ParcelId = "C-003", TaxYear = 2025, BuildingType = "R1", SquareFeet = 1500, CountyId = BentonCountyId },
      new CamaCharacteristic { ParcelId = "C-003", TaxYear = 2026, BuildingType = "R1", SquareFeet = 1600, CountyId = BentonCountyId },
      new CamaCharacteristic { ParcelId = "C-099", TaxYear = 2026, BuildingType = "C1", SquareFeet = 5000, CountyId = BentonCountyId }
    );
    await db.SaveChangesAsync();

    var controller = CreateController(db);

    // All for parcel
    var result = await controller.GetCamaCharacteristics("C-003");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var list = (ok.Value as System.Collections.IEnumerable)!.Cast<CamaCharacteristic>().ToList();
    list.Should().HaveCount(2);

    // Filtered by year
    var result2 = await controller.GetCamaCharacteristics("C-003", taxYear: 2026);
    var ok2 = result2.Should().BeOfType<OkObjectResult>().Subject;
    var list2 = (ok2.Value as System.Collections.IEnumerable)!.Cast<CamaCharacteristic>().ToList();
    list2.Should().HaveCount(1);
    list2[0].SquareFeet.Should().Be(1600);
  }

  // ═══════════════════════════════════════════════════════════════
  // County Isolation
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task ComparableSales_IsolatedByCounty()
  {
    using var db = CreateDbContext(nameof(ComparableSales_IsolatedByCounty));
    await SeedCounty(db, BentonCountyId);

    var otherCountyId = Guid.NewGuid();
    db.ComparableSales.AddRange(
      new ComparableSale { ParcelId = "ISO-1", SaleDate = DateTime.UtcNow.AddMonths(-1), SalePrice = 200_000, PropertyType = "residential", CountyId = BentonCountyId, IngestedBy = "test" },
      new ComparableSale { ParcelId = "ISO-2", SaleDate = DateTime.UtcNow.AddMonths(-1), SalePrice = 500_000, PropertyType = "residential", CountyId = otherCountyId, IngestedBy = "test" }
    );
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.SearchComparableSales("SUBJECT-X");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var value = ok.Value!;
    var count = (int)value.GetType().GetProperty("count")!.GetValue(value)!;
    count.Should().Be(1); // Only BentonCounty sale visible
  }

  [Fact]
  public async Task CamaCharacteristics_IsolatedByCounty()
  {
    using var db = CreateDbContext(nameof(CamaCharacteristics_IsolatedByCounty));
    await SeedCounty(db, BentonCountyId);

    var otherCountyId = Guid.NewGuid();
    db.CamaCharacteristics.AddRange(
      new CamaCharacteristic { ParcelId = "ISO-C1", TaxYear = 2026, BuildingType = "R1", SquareFeet = 2000, CountyId = BentonCountyId },
      new CamaCharacteristic { ParcelId = "ISO-C2", TaxYear = 2026, BuildingType = "C1", SquareFeet = 5000, CountyId = otherCountyId }
    );
    await db.SaveChangesAsync();

    var controller = CreateController(db);
    var result = await controller.GetCamaCharacteristics("ISO-C2");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var list = (ok.Value as System.Collections.IEnumerable)!.Cast<CamaCharacteristic>().ToList();
    list.Should().BeEmpty(); // Other county's data not visible
  }

  // ═══════════════════════════════════════════════════════════════
  // Entity Registration
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void DbContext_HasValuationRecordsDbSet()
  {
    using var db = CreateDbContext(nameof(DbContext_HasValuationRecordsDbSet));
    db.ValuationRecords.Should().NotBeNull();
  }

  [Fact]
  public void DbContext_HasComparableSalesDbSet()
  {
    using var db = CreateDbContext(nameof(DbContext_HasComparableSalesDbSet));
    db.ComparableSales.Should().NotBeNull();
  }

  [Fact]
  public void DbContext_HasCamaCharacteristicsDbSet()
  {
    using var db = CreateDbContext(nameof(DbContext_HasCamaCharacteristicsDbSet));
    db.CamaCharacteristics.Should().NotBeNull();
  }

  [Fact]
  public void DbContext_HasCostMatricesDbSet()
  {
    using var db = CreateDbContext(nameof(DbContext_HasCostMatricesDbSet));
    db.CostMatrices.Should().NotBeNull();
  }

  // ═══════════════════════════════════════════════════════════════
  // Valuation Record Lifecycle
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task ValuationRecord_FullLifecycle_DraftToSealed()
  {
    using var db = CreateDbContext(nameof(ValuationRecord_FullLifecycle_DraftToSealed));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // 1. Create
    var createResult = await controller.SaveValuationRecord(new CostForgeController.SaveValuationRequest
    {
      ParcelId = "LC-001",
      TaxYear = 2026,
      PropertyType = "residential",
      CostApproachValue = 250_000m,
      IncomeApproachValue = 240_000m,
      SalesComparisonValue = 260_000m,
      FinalReconciledValue = 252_000m,
    });
    var created = createResult.Should().BeOfType<CreatedAtActionResult>().Subject;
    var recordId = (Guid)created.RouteValues!["id"]!;

    // 2. Verify draft
    var draft = await db.ValuationRecords.FindAsync(recordId);
    draft!.Status.Should().Be("draft");

    // 3. Transition to reviewed
    var reviewResult = await controller.UpdateValuationStatus(recordId,
      new CostForgeController.UpdateStatusRequest { Status = "reviewed" });
    reviewResult.Should().BeOfType<OkObjectResult>();

    // 4. Transition to sealed
    var sealResult = await controller.UpdateValuationStatus(recordId,
      new CostForgeController.UpdateStatusRequest { Status = "sealed" });
    sealResult.Should().BeOfType<OkObjectResult>();

    // 5. Verify sealed  
    var sealed_ = await db.ValuationRecords.FindAsync(recordId);
    sealed_!.Status.Should().Be("sealed");
  }

  [Fact]
  public async Task SaveValuationRecord_PersistsAllThreeApproaches()
  {
    using var db = CreateDbContext(nameof(SaveValuationRecord_PersistsAllThreeApproaches));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.SaveValuationRecord(new CostForgeController.SaveValuationRequest
    {
      ParcelId = "FULL-001",
      TaxYear = 2026,
      PropertyType = "residential",
      CostApproachValue = 250_000m,
      CostConfidence = "high",
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 2200m,
      Rcn = 300_000m,
      DepreciationPercent = 16.67m,
      Rcnld = 250_000m,
      LandValue = 50_000m,
      SiteImprovementValue = 15_000m,
      IncomeApproachValue = 240_000m,
      IncomeConfidence = "medium",
      GrossIncome = 36_000m,
      VacancyRate = 5m,
      OperatingExpenses = 10_260m,
      NetOperatingIncome = 23_940m,
      CapRate = 5.5m,
      SalesComparisonValue = 260_000m,
      SalesConfidence = "high",
      ComparableCount = 5,
      MedianAdjustedPrice = 258_000m,
      FinalReconciledValue = 252_000m,
      Spread = 20_000m,
      OverallConfidence = "high",
      Notes = "Annual assessment - all three approaches applied.",
    });

    result.Should().BeOfType<CreatedAtActionResult>();

    var record = await db.ValuationRecords.FirstAsync();
    record.CostApproachValue.Should().Be(250_000m);
    record.IncomeApproachValue.Should().Be(240_000m);
    record.SalesComparisonValue.Should().Be(260_000m);
    record.FinalReconciledValue.Should().Be(252_000m);
    record.ComparableCount.Should().Be(5);
    record.Notes.Should().Contain("Annual assessment");
  }
}
