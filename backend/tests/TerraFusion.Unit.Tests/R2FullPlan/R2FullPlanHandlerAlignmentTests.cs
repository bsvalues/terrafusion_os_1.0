using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using IGovernedToolAuditService = TerraFusion.API.Services.IGovernedToolAuditService;
using IExemptionService = TerraFusion.Core.Services.IExemptionService;
using IAppealService = TerraFusion.Core.Services.IAppealService;
using ICertificationService = TerraFusion.Core.Services.ICertificationService;
using INoticeService = TerraFusion.Core.Services.INoticeService;
using IQueueService = TerraFusion.Core.Services.IQueueService;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities;
using Xunit;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CostForgeAIService = TerraFusion.Core.Services.ICostForgeAIService;
using CostForgeService = TerraFusion.Core.Services.ICostForgeService;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2FullPlan;

/// <summary>
/// R2 Full Plan — Handler↔Backend alignment tests.
/// Validates all 24 handler endpoints have matching backend routes.
/// </summary>
[Trait("Category", "R2FullPlan")]
[Trait("Category", "HandlerAlignment")]
public sealed class R2FullPlanHandlerAlignmentTests
{
  private static readonly Guid BentonCountyId = Guid.NewGuid();

  private static DataDbContext CreateDbContext(string name)
  {
    var options = new DbContextOptionsBuilder<DataDbContext>()
      .UseInMemoryDatabase($"R2FullPlan-{name}-{Guid.NewGuid()}")
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
      new Claim("sub", "r2-test-user"),
      new Claim("userId", "r2-test-user"),
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

  private static CostForgeController CreateCostForgeController(DataDbContext db, ClaimsPrincipal? principal = null)
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

  private static DossierController CreateDossierController(DataDbContext db, ClaimsPrincipal? principal = null, string env = "Production")
  {
    var costForge = new Mock<CostForgeService>(MockBehavior.Strict);
    var host = new Mock<IHostEnvironment>();
    host.SetupGet(h => h.EnvironmentName).Returns(env);
    var controller = new DossierController(db, costForge.Object, NullLogger<DossierController>.Instance, host.Object);
    AttachPrincipal(controller, principal ?? CreatePrincipal(BentonCountyId));
    return controller;
  }

  private static DaisController CreateDaisController(DataDbContext db, ClaimsPrincipal? principal = null)
  {
    var noticeMock = new Mock<INoticeService>();
    noticeMock.Setup(s => s.CreateAsync(It.IsAny<Notice>()))
      .ReturnsAsync((Notice n) => { n.Id = Guid.NewGuid(); n.CreatedAt = DateTime.UtcNow; return n; });

    var queueMock = new Mock<IQueueService>();
    queueMock.Setup(s => s.CreateAsync(It.IsAny<QueueItem>()))
      .ReturnsAsync((QueueItem q) => { q.Id = Guid.NewGuid(); q.CreatedAt = DateTime.UtcNow; return q; });

    var certMock = new Mock<ICertificationService>();
    certMock.Setup(s => s.GetByTaxYearAsync(It.IsAny<int>(), It.IsAny<Guid>()))
      .ReturnsAsync(new List<CertificationStep>());

    var controller = new DaisController(db, NullLogger<DaisController>.Instance,
        new Mock<IExemptionService>().Object,
        new Mock<IAppealService>().Object,
        certMock.Object,
        noticeMock.Object,
        queueMock.Object,
        new Mock<IRequestUserContextAccessor>().Object,
        new Mock<IGovernedToolAuditService>().Object);
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
        FipsCode = "003",
      });
      await db.SaveChangesAsync();
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  DAIS — Wave 20: TerraExempt (Senior/Disabled, Current Use, Historic)
  // ══════════════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_Programs_Returns_WA_Programs()
  {
    using var db = CreateDbContext("exempt-programs");
    var controller = CreateDaisController(db);
    var result = controller.GetExemptionPrograms();
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_SeniorDisabled_Full_Exemption()
  {
    using var db = CreateDbContext("exempt-senior-full");
    var controller = CreateDaisController(db);
    var request = new DaisController.SeniorDisabledRequest(35000m, 350000m, 65);
    var result = controller.CalculateSeniorDisabledExemption(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var value = ok.Value;
    value!.GetType().GetProperty("eligible")!.GetValue(value).Should().Be(true);
    value!.GetType().GetProperty("level")!.GetValue(value).Should().Be("full");
  }

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_SeniorDisabled_Ineligible_HighIncome()
  {
    using var db = CreateDbContext("exempt-senior-high");
    var controller = CreateDaisController(db);
    var request = new DaisController.SeniorDisabledRequest(80000m, 350000m, 65);
    var result = controller.CalculateSeniorDisabledExemption(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var value = ok.Value;
    value!.GetType().GetProperty("level")!.GetValue(value).Should().Be("ineligible");
  }

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_SeniorDisabled_NegativeIncome_Returns400()
  {
    using var db = CreateDbContext("exempt-senior-neg");
    var controller = CreateDaisController(db);
    var request = new DaisController.SeniorDisabledRequest(-1m, 350000m, 65);
    var result = controller.CalculateSeniorDisabledExemption(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_CurrentUse_Farm_Agricultural()
  {
    using var db = CreateDbContext("exempt-cu-farm");
    var controller = CreateDaisController(db);
    var request = new DaisController.CurrentUseRequest("farm-agricultural", 100m, 500000m, null, null);
    var result = controller.CalculateCurrentUseAssessment(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_CurrentUse_InvalidClassification_Returns400()
  {
    using var db = CreateDbContext("exempt-cu-invalid");
    var controller = CreateDaisController(db);
    var request = new DaisController.CurrentUseRequest("industrial", 100m, 500000m, null, null);
    var result = controller.CalculateCurrentUseAssessment(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_Historic_Eligible()
  {
    using var db = CreateDbContext("exempt-hist");
    var controller = CreateDaisController(db);
    var request = new DaisController.HistoricPropertyRequest(400000m, 120000m, 3);
    var result = controller.CalculateHistoricValuation(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave20")]
  public void Exempt_Historic_ZeroCost_Returns400()
  {
    using var db = CreateDbContext("exempt-hist-zero");
    var controller = CreateDaisController(db);
    var request = new DaisController.HistoricPropertyRequest(400000m, 0m, 3);
    var result = controller.CalculateHistoricValuation(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // Handler #16: explain_senior_exemption_impact → GET /api/dais/exemptions/impact
  [Fact]
  [Trait("Category", "Handler16")]
  public void Handler16_ExemptionsImpact_ReturnsAnalysis()
  {
    using var db = CreateDbContext("handler-16");
    var controller = CreateDaisController(db);
    var result = controller.GetExemptionImpact("senior-disabled", 35000m, 350000m, 65, null);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    ok.Value.Should().NotBeNull();
  }

  // ══════════════════════════════════════════════════════════════════
  //  DAIS — Wave 21: TerraAppeal + TerraCert
  // ══════════════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "Wave21")]
  public void Appeal_Grounds_ReturnsAllGrounds()
  {
    using var db = CreateDbContext("appeal-grounds");
    var controller = CreateDaisController(db);
    var result = controller.GetAppealGrounds();
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave21")]
  public void Appeal_Timeline_ReturnsCurrentYear()
  {
    using var db = CreateDbContext("appeal-timeline");
    var controller = CreateDaisController(db);
    var result = controller.GetAppealTimeline(null);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave21")]
  public void Appeal_EvidenceChecklist_SpecificGround()
  {
    using var db = CreateDbContext("appeal-evidence");
    var controller = CreateDaisController(db);
    var result = controller.GetAppealEvidenceChecklist("MARKET_VALUE");
    result.Should().BeOfType<OkObjectResult>();
  }

  // Handler #14: check_cert_status → GET /api/dais/certification/{county}/{taxYear}
  [Fact]
  [Trait("Category", "Handler14")]
  public async Task Handler14_CertificationStatus_Benton()
  {
    using var db = CreateDbContext("handler-14");
    var controller = CreateDaisController(db);
    var result = await controller.GetCertificationStatus("benton", 2026);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    ok.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Wave21")]
  public async Task Cert_AltStatus_ReturnsOk()
  {
    using var db = CreateDbContext("cert-alt-status");
    var controller = CreateDaisController(db);
    var result = await controller.GetCertStatus("benton", 2026);
    result.Should().BeOfType<OkObjectResult>();
  }

  // ══════════════════════════════════════════════════════════════════
  //  DAIS — Wave 22: TerraNotice + TerraQueue
  // ══════════════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "Wave22")]
  public void Notice_Templates_ReturnsAll()
  {
    using var db = CreateDbContext("notice-templates");
    var controller = CreateDaisController(db);
    var result = controller.GetNoticeTemplates();
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave22")]
  public async Task Notice_Generate_ValidTemplate()
  {
    using var db = CreateDbContext("notice-gen");
    var controller = CreateDaisController(db);
    var request = new DaisController.GenerateNoticeRequest("VALUE_CHANGE", "P-001", "mail", null);
    var result = await controller.GenerateNotice(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave22")]
  public async Task Notice_Generate_NullTemplate_Returns400()
  {
    using var db = CreateDbContext("notice-gen-null");
    var controller = CreateDaisController(db);
    var request = new DaisController.GenerateNoticeRequest(null, null, null, null);
    var result = await controller.GenerateNotice(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave22")]
  public void Queue_Types_ReturnsAll()
  {
    using var db = CreateDbContext("queue-types");
    var controller = CreateDaisController(db);
    var result = controller.GetQueueTypes();
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave22")]
  public async Task Queue_Assign_ValidTask()
  {
    using var db = CreateDbContext("queue-assign");
    var controller = CreateDaisController(db);
    var request = new DaisController.QueueAssignRequest("FIELD_INSPECTION", "P-001", "appraiser-1", "normal");
    var result = await controller.AssignToQueue(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Wave22")]
  public async Task Queue_Assign_NullType_Returns400()
  {
    using var db = CreateDbContext("queue-assign-null");
    var controller = CreateDaisController(db);
    var request = new DaisController.QueueAssignRequest(null, null, null, null);
    var result = await controller.AssignToQueue(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ══════════════════════════════════════════════════════════════════
  //  COSTFORGE — Handler Alignment (models + comps)
  // ══════════════════════════════════════════════════════════════════

  // Handler #6: explain_model_inputs → GET /api/costforge/models/{modelId}
  [Fact]
  [Trait("Category", "Handler6")]
  public async Task Handler6_GetModelInputs_CostApproach()
  {
    using var db = CreateDbContext("handler-6-cost");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateCostForgeController(db);
    var result = await controller.GetModelInputs("cost-approach", 2026, null);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler6")]
  public async Task Handler6_GetModelInputs_IncomeApproach()
  {
    using var db = CreateDbContext("handler-6-income");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateCostForgeController(db);
    var result = await controller.GetModelInputs("income-approach", 2026, null);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler6")]
  public async Task Handler6_GetModelInputs_SalesComparison()
  {
    using var db = CreateDbContext("handler-6-sales");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateCostForgeController(db);
    var result = await controller.GetModelInputs("sales-comparison", 2026, null);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler6")]
  public async Task Handler6_GetModelInputs_Unknown_Returns404()
  {
    using var db = CreateDbContext("handler-6-unknown");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateCostForgeController(db);
    var result = await controller.GetModelInputs("nonexistent-model", 2026, null);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler6")]
  public async Task Handler6_GetModelInputs_NoClaims_Returns401()
  {
    using var db = CreateDbContext("handler-6-noauth");
    var controller = CreateCostForgeController(db, CreateEmptyPrincipal());
    var result = await controller.GetModelInputs("cost-approach", 2026, null);
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  // Handler #12: summarize_sales_comps_rationale → GET /api/costforge/comps/{subjectId}
  [Fact]
  [Trait("Category", "Handler12")]
  public async Task Handler12_GetComps_EmptyStore_ReturnsHonestEmptyResult()
  {
    using var db = CreateDbContext("handler-12-empty");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateCostForgeController(db);
    var result = await controller.GetComparableSales("PARCEL-001", null, true);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var value = ok.Value!;
    value.GetType().GetProperty("count")!.GetValue(value).Should().Be(0);
    value.GetType().GetProperty("selectionMethod")!.GetValue(value)!.Should().Be("no comparable sales matched operational selection criteria");
  }

  [Fact]
  [Trait("Category", "Handler12")]
  public async Task Handler12_GetComps_NoClaims_Returns401()
  {
    using var db = CreateDbContext("handler-12-noauth");
    var controller = CreateCostForgeController(db, CreateEmptyPrincipal());
    var result = await controller.GetComparableSales("PARCEL-001", null, true);
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler12")]
  public async Task Handler12_GetComps_WithRealData()
  {
    using var db = CreateDbContext("handler-12-real");
    await SeedCounty(db, BentonCountyId);
    db.Properties.Add(new Property
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      PropertyId = "PACS-PARCEL-001",
      ParcelId = "PARCEL-001",
      ParcelNumber = "PARCEL-001",
      Address = "100 Main St, Kennewick, WA 99336",
      PropertyType = "SFR",
      AssessedValue = 295000m,
      LandValue = 85000m,
      ImprovementValue = 210000m,
      MarketValue = 295000m,
      AssessmentDate = DateTime.UtcNow,
      LastUpdated = DateTime.UtcNow,
      TaxYear = 2026,
    });
    db.ComparableSales.Add(new ComparableSale
    {
      Id = Guid.NewGuid(),
      CountyId = BentonCountyId,
      ParcelId = "COMP-TEST",
      SaleDate = DateTime.UtcNow.AddMonths(-2),
      SalePrice = 300000m,
      PropertyType = "SFR",
      GrossLivingArea = 2000m,
      LotSizeSqft = 8000m,
      Neighborhood = "KENNEWICK",
      SaleQualification = "qualified",
    });
    await db.SaveChangesAsync();
    var controller = CreateCostForgeController(db);
    var result = await controller.GetComparableSales("PARCEL-001", null, true);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var value = ok.Value!;
    value.GetType().GetProperty("count")!.GetValue(value).Should().Be(1);
    value.GetType().GetProperty("selectionMethod")!.GetValue(value)!.Should().NotBeNull();
  }

  // ══════════════════════════════════════════════════════════════════
  //  DOSSIER — Handler Alignment (notices, appeals, BOE, memos, evidence)
  // ══════════════════════════════════════════════════════════════════

  // Handler #17: draft_value_change_notice → POST /api/dossier/notices/drafts
  [Fact]
  [Trait("Category", "Handler17")]
  public async Task Handler17_DraftNotice_ReturnsOk()
  {
    using var db = CreateDbContext("handler-17");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.DraftNoticeRequest("P-001", "VALUE_CHANGE", 250000m, 275000m, "Annual revaluation");
    var result = await controller.DraftNotice(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler17")]
  public async Task Handler17_DraftNotice_NullParcel_Returns400()
  {
    using var db = CreateDbContext("handler-17-null");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.DraftNoticeRequest(null, null, null, null, null);
    var result = await controller.DraftNotice(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // Handler #20: draft_notice → POST /api/dossier/notices
  [Fact]
  [Trait("Category", "Handler20")]
  public async Task Handler20_CreateNotice_ReturnsOk()
  {
    using var db = CreateDbContext("handler-20");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.CreateNoticeRequest("VALUE_CHANGE", "P-001", "John Doe", "mail", null);
    var result = await controller.CreateNotice(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler20")]
  public async Task Handler20_CreateNotice_NullTemplate_Returns400()
  {
    using var db = CreateDbContext("handler-20-null");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.CreateNoticeRequest(null, null, null, null, null);
    var result = await controller.CreateNotice(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // Handler #18: draft_appeal_response → POST /api/dossier/appeals/{appealId}/drafts
  [Fact]
  [Trait("Category", "Handler18")]
  public async Task Handler18_DraftAppealResponse_ReturnsOk()
  {
    using var db = CreateDbContext("handler-18");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.DraftAppealRequest("ASSESSOR_RESPONSE", "Value is supported", "DENY", null);
    var result = await controller.DraftAppealResponse("APPEAL-001", request);
    result.Should().BeOfType<OkObjectResult>();
  }

  // Handler #19: draft_boe_appeal_response → POST /api/dossier/boe/{caseId}/response-drafts
  [Fact]
  [Trait("Category", "Handler19")]
  public async Task Handler19_DraftBoeResponse_ReturnsOk()
  {
    using var db = CreateDbContext("handler-19");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.DraftBoeResponseRequest("Value is within tolerance", "5 comparable sales", "SUSTAIN", "2026-08-15");
    var result = await controller.DraftBoeResponse("BOE-CASE-001", request);
    result.Should().BeOfType<OkObjectResult>();
  }

  // Handler #22: generate_commissioner_memo → POST /api/dossier/memos/drafts
  [Fact]
  [Trait("Category", "Handler22")]
  public async Task Handler22_DraftMemo_ReturnsOk()
  {
    using var db = CreateDbContext("handler-22");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.DraftMemoRequest("Budget Impact Analysis", "The 2026 levy rate impacts are...", null, null, null);
    var result = await controller.DraftCommissionerMemo(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler22")]
  public async Task Handler22_DraftMemo_NullSubject_Returns400()
  {
    using var db = CreateDbContext("handler-22-null");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.DraftMemoRequest(null, null, null, null, null);
    var result = await controller.DraftCommissionerMemo(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // Handler #23: assemble_boe_packet → POST /api/dossier/boe/{caseId}/packet
  [Fact]
  [Trait("Category", "Handler23")]
  public async Task Handler23_AssembleBoePacket_ReturnsOk()
  {
    using var db = CreateDbContext("handler-23");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var request = new DossierController.AssemblePacketRequest("P-001", true, true, true);
    var result = await controller.AssembleBoePacket("BOE-CASE-001", request);
    result.Should().BeOfType<OkObjectResult>();
  }

  // Handler #21: synthesize_evidence → GET /api/dossier/{parcelId}/evidence
  [Fact]
  [Trait("Category", "Handler21")]
  public async Task Handler21_GetParcelEvidence_ReturnsOk()
  {
    using var db = CreateDbContext("handler-21");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var result = await controller.GetParcelEvidence("PARCEL-001", null);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler21")]
  public async Task Handler21_GetParcelEvidence_WithCategory()
  {
    using var db = CreateDbContext("handler-21-cat");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var result = await controller.GetParcelEvidence("PARCEL-001", "valuation");
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  [Trait("Category", "Handler21")]
  public async Task Handler21_GetParcelEvidence_InvalidId_Returns400()
  {
    using var db = CreateDbContext("handler-21-inv");
    await SeedCounty(db, BentonCountyId);
    var controller = CreateDossierController(db);
    var result = await controller.GetParcelEvidence("INVALID ID WITH SPACES!!!", null);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ══════════════════════════════════════════════════════════════════
  //  County Isolation Tests — verify Forbid when no claims
  // ══════════════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "CountyIsolation")]
  public async Task Dossier_NoClaims_DraftNotice_ReturnsForbid()
  {
    using var db = CreateDbContext("iso-dossier-notice");
    var controller = CreateDossierController(db, CreateEmptyPrincipal());
    var request = new DossierController.DraftNoticeRequest("P-001", "VALUE_CHANGE", null, null, null);
    var result = await controller.DraftNotice(request);
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "CountyIsolation")]
  public async Task Dossier_NoClaims_CreateNotice_ReturnsForbid()
  {
    using var db = CreateDbContext("iso-dossier-create");
    var controller = CreateDossierController(db, CreateEmptyPrincipal());
    var request = new DossierController.CreateNoticeRequest("VALUE_CHANGE", "P-001", null, null, null);
    var result = await controller.CreateNotice(request);
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "CountyIsolation")]
  public async Task Dossier_NoClaims_DraftAppeal_ReturnsForbid()
  {
    using var db = CreateDbContext("iso-dossier-appeal");
    var controller = CreateDossierController(db, CreateEmptyPrincipal());
    var result = await controller.DraftAppealResponse("A-001", null);
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "CountyIsolation")]
  public async Task Dossier_NoClaims_DraftBoe_ReturnsForbid()
  {
    using var db = CreateDbContext("iso-dossier-boe");
    var controller = CreateDossierController(db, CreateEmptyPrincipal());
    var result = await controller.DraftBoeResponse("BOE-001", null);
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "CountyIsolation")]
  public async Task Dossier_NoClaims_DraftMemo_ReturnsForbid()
  {
    using var db = CreateDbContext("iso-dossier-memo");
    var controller = CreateDossierController(db, CreateEmptyPrincipal());
    var request = new DossierController.DraftMemoRequest("Subject", null, null, null, null);
    var result = await controller.DraftCommissionerMemo(request);
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "CountyIsolation")]
  public async Task Dossier_NoClaims_AssemblePacket_ReturnsForbid()
  {
    using var db = CreateDbContext("iso-dossier-packet");
    var controller = CreateDossierController(db, CreateEmptyPrincipal());
    var result = await controller.AssembleBoePacket("BOE-001", null);
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "CountyIsolation")]
  public async Task Dossier_NoClaims_Evidence_ReturnsForbid()
  {
    using var db = CreateDbContext("iso-dossier-evidence");
    var controller = CreateDossierController(db, CreateEmptyPrincipal());
    var result = await controller.GetParcelEvidence("P-001", null);
    result.Should().BeOfType<ForbidResult>();
  }
}
