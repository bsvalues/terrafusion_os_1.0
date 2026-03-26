using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.API.Controllers;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;
using IGovernedToolAuditService = TerraFusion.API.Services.IGovernedToolAuditService;
using IExemptionService = TerraFusion.Core.Services.IExemptionService;
using IAppealService = TerraFusion.Core.Services.IAppealService;
using ICertificationService = TerraFusion.Core.Services.ICertificationService;
using INoticeService = TerraFusion.Core.Services.INoticeService;
using IQueueService = TerraFusion.Core.Services.IQueueService;
using TerraFusion.Core.Auth;

namespace TerraFusion.Unit.Tests.Stage2;

[Trait("Category", "Stage2")]
public sealed class DaisEndpointContractTests
{
    private static readonly Guid BentonCountyId = new("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OtherCountyId  = new("22222222-2222-2222-2222-222222222222");

    // ── DbContext factory ──────────────────────────────────────────────

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"Stage2Ep-{name}-{Guid.NewGuid()}")
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    // ── County seed helper ─────────────────────────────────────────────

    private static async Task SeedCounty(DataDbContext db, Guid countyId, string name = "Benton", string fips = "003")
    {
        if (!await db.Counties.AnyAsync(c => c.Id == countyId))
        {
            db.Counties.Add(new County { Id = countyId, Name = name, State = "WA", FipsCode = fips });
            await db.SaveChangesAsync();
        }
    }

    // ── Controller factory ─────────────────────────────────────────────

    private static DaisController CreateDaisController(
        DataDbContext db,
        IAppealService? appealSvc = null,
        IExemptionService? exemptionSvc = null,
        ICertificationService? certificationSvc = null,
        INoticeService? noticeSvc = null,
        IQueueService? queueSvc = null,
        ClaimsPrincipal? principal = null)
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

        var userContextMock = new Mock<IRequestUserContextAccessor>();
        userContextMock.Setup(a => a.Current)
            .Returns(new RequestUserContext(
                IsAuthenticated: true,
                UserId: "stage2-test-user",
                CountyId: BentonCountyId.ToString(),
                Roles: Array.Empty<string>()));

        var auditMock = new Mock<IGovernedToolAuditService>();
        auditMock.Setup(a => a.LogInvocationAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var controller = new DaisController(
            db,
            NullLogger<DaisController>.Instance,
            exemptionSvc ?? new Mock<IExemptionService>().Object,
            appealSvc ?? new Mock<IAppealService>().Object,
            certificationSvc ?? certMock.Object,
            noticeSvc ?? noticeMock.Object,
            queueSvc ?? queueMock.Object,
            userContextMock.Object,
            auditMock.Object);

        var countyIdStr = BentonCountyId.ToString();
        var claims = principal ?? new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("countyId", countyIdStr),
            new Claim("countyCode", "BENTON"),
            new Claim("sub", "stage2-test-user"),
        ], "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claims }
        };

        return controller;
    }

    // ── 201 Contract ───────────────────────────────────────────────────

    [Fact]
    public async Task CreateAppeal_ValidRequest_Returns201Created()
    {
        await using var db = CreateDbContext(nameof(CreateAppeal_ValidRequest_Returns201Created));
        await SeedCounty(db, BentonCountyId);

        // Use the real AppealService so the full end-to-end path is exercised.
        var realAppealSvc = new AppealService(db, NullLogger<AppealService>.Instance);
        var controller = CreateDaisController(db, realAppealSvc);

        var request = new DaisController.CreateAppealRequest(
            ParcelId: "12345-000-000",
            AppealGround: "MARKET_VALUE",
            PetitionerName: "Jane Smith",
            CurrentValue: 450_000m,
            RequestedValue: 400_000m,
            TaxYear: 2026);

        var result = await controller.CreateAppeal(request);

        result.Should().BeOfType<CreatedAtActionResult>();
        var created = (CreatedAtActionResult)result;
        created.StatusCode.Should().Be(201);
        created.ActionName.Should().Be("GetAppealById");
    }

    // ── Validation ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAppeal_MissingParcelId_Returns400()
    {
        await using var db = CreateDbContext(nameof(CreateAppeal_MissingParcelId_Returns400));
        await SeedCounty(db, BentonCountyId);
        var controller = CreateDaisController(db);

        // ParcelId is null/empty — controller must return 400.
        var request = new DaisController.CreateAppealRequest(
            ParcelId: "",
            AppealGround: "MARKET_VALUE",
            PetitionerName: null,
            CurrentValue: 300_000m,
            RequestedValue: 270_000m,
            TaxYear: 2026);

        var result = await controller.CreateAppeal(request);

        result.Should().BeOfType<BadRequestObjectResult>();
        ((BadRequestObjectResult)result).StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task CreateAppeal_NullBody_Returns400()
    {
        await using var db = CreateDbContext(nameof(CreateAppeal_NullBody_Returns400));
        await SeedCounty(db, BentonCountyId);
        var controller = CreateDaisController(db);

        // Pass null — controller checks `request is null` first.
        var result = await controller.CreateAppeal(null!);

        result.Should().BeOfType<BadRequestObjectResult>();
        ((BadRequestObjectResult)result).StatusCode.Should().Be(400);
    }

    // ── County isolation on GET ─────────────────────────────────────────

    [Fact]
    public async Task GetAllAppeals_OnlyReturnsSameCountyAppeals()
    {
        await using var db = CreateDbContext(nameof(GetAllAppeals_OnlyReturnsSameCountyAppeals));
        await SeedCounty(db, BentonCountyId, "Benton", "003");
        await SeedCounty(db, OtherCountyId, "Franklin", "021");

        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        // Seed one appeal per county for the same tax year.
        await svc.CreateAsync(new Appeal
        {
            ParcelId = "BENTON-001",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 400_000m,
            RequestedValue = 360_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        });
        await svc.CreateAsync(new Appeal
        {
            ParcelId = "FRANKLIN-001",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 200_000m,
            RequestedValue = 180_000m,
            TaxYear = 2026,
            CountyId = OtherCountyId,
        });

        // Controller wired to BentonCountyId principal.
        var controller = CreateDaisController(db, svc);
        var result = await controller.GetAllAppeals(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var appeals = ok.Value as IEnumerable<Appeal>;
        appeals.Should().NotBeNull();
        appeals!.Should().OnlyContain(a => a.CountyId == BentonCountyId);
    }

    [Fact]
    public async Task GetAllAppeals_OtherCountyData_IsNotVisible()
    {
        await using var db = CreateDbContext(nameof(GetAllAppeals_OtherCountyData_IsNotVisible));
        await SeedCounty(db, BentonCountyId, "Benton", "003");
        await SeedCounty(db, OtherCountyId, "Yakima", "077");

        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        // Only seed an appeal for OtherCounty.
        await svc.CreateAsync(new Appeal
        {
            ParcelId = "YAKIMA-999",
            AppealGround = "UNIFORMITY",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 150_000m,
            RequestedValue = 130_000m,
            TaxYear = 2026,
            CountyId = OtherCountyId,
        });

        // Benton-scoped controller should see nothing for 2026.
        var controller = CreateDaisController(db, svc);
        var result = await controller.GetAllAppeals(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var appeals = ok.Value as IEnumerable<Appeal>;
        appeals.Should().NotBeNull();
        appeals!.Should().BeEmpty("Benton county has no 2026 appeals");
    }

    // ── Schema presence ────────────────────────────────────────────────

    [Fact]
    public void DbContext_HasAppealDbSet()
    {
        using var db = CreateDbContext("schema-appeal");
        db.Model.FindEntityType(typeof(Appeal)).Should().NotBeNull();
    }

    [Fact]
    public void DbContext_HasExemptionDbSet()
    {
        using var db = CreateDbContext("schema-exemption");
        db.Model.FindEntityType(typeof(Exemption)).Should().NotBeNull();
    }

    [Fact]
    public void DbContext_HasCertificationStepDbSet()
    {
        using var db = CreateDbContext("schema-certificationstep");
        db.Model.FindEntityType(typeof(CertificationStep)).Should().NotBeNull();
    }

    [Fact]
    public void DbContext_HasNoticeDbSet()
    {
        using var db = CreateDbContext("schema-notice");
        db.Model.FindEntityType(typeof(Notice)).Should().NotBeNull();
    }

    [Fact]
    public void DbContext_HasQueueItemDbSet()
    {
        using var db = CreateDbContext("schema-queueitem");
        db.Model.FindEntityType(typeof(QueueItem)).Should().NotBeNull();
    }

    [Fact]
    public async Task CreateExemption_ValidRequest_Returns201Created()
    {
        await using var db = CreateDbContext(nameof(CreateExemption_ValidRequest_Returns201Created));
        await SeedCounty(db, BentonCountyId);

        var realExemptionSvc = new ExemptionService(db, NullLogger<ExemptionService>.Instance);
        var controller = CreateDaisController(db, exemptionSvc: realExemptionSvc);

        var request = new DaisController.CreateExemptionRequest(
            ParcelId: "12345-000-999",
            ProgramCode: null,
            ApplicantName: "Jane Smith",
            ExemptionAmount: 50_000m,
            RcwReference: "84.36.381",
            Notes: "Initial review");

        var result = await controller.CreateExemption(request);

        result.Should().BeOfType<CreatedAtActionResult>();
        db.Exemptions.Should().ContainSingle(e => e.ParcelId == "12345-000-999" && e.CountyId == BentonCountyId);
    }

    [Fact]
    public async Task GenerateNotice_ValidRequest_PersistsSerializedFields()
    {
        await using var db = CreateDbContext(nameof(GenerateNotice_ValidRequest_PersistsSerializedFields));
        await SeedCounty(db, BentonCountyId);

        var realNoticeSvc = new NoticeService(db, NullLogger<NoticeService>.Instance);
        var controller = CreateDaisController(db, noticeSvc: realNoticeSvc);

        var result = await controller.GenerateNotice(new DaisController.GenerateNoticeRequest(
            TemplateId: "VALUE_CHANGE",
            ParcelId: "12345-000-555",
            DeliveryMethod: null,
            Fields: new Dictionary<string, string> { ["ownerName"] = "Jane Smith" }));

        result.Should().BeOfType<OkObjectResult>();
        var created = db.Notices.Should().ContainSingle().Subject;
        created.CountyId.Should().Be(BentonCountyId);
        created.DeliveryMethod.Should().Be("mail");
        JsonDocument.Parse(created.Fields!).RootElement.GetProperty("ownerName").GetString().Should().Be("Jane Smith");
    }

    [Fact]
    public async Task AssignToQueue_ValidRequest_PersistsCountyScopedQueueItem()
    {
        await using var db = CreateDbContext(nameof(AssignToQueue_ValidRequest_PersistsCountyScopedQueueItem));
        await SeedCounty(db, BentonCountyId);

        var realQueueSvc = new QueueService(db, NullLogger<QueueService>.Instance);
        var controller = CreateDaisController(db, queueSvc: realQueueSvc);

        var result = await controller.AssignToQueue(new DaisController.QueueAssignRequest(
            TaskType: "FIELD_INSPECTION",
            ParcelId: "12345-000-777",
            AssignedTo: "alice@appraisers.local",
            Priority: "high"));

        result.Should().BeOfType<OkObjectResult>();
        db.QueueItems.Should().ContainSingle(q => q.ParcelId == "12345-000-777" && q.CountyId == BentonCountyId);
    }

    [Fact]
    public async Task GetCertificationStatus_WhenNoRowsExist_PersistsCanonicalSteps()
    {
        await using var db = CreateDbContext(nameof(GetCertificationStatus_WhenNoRowsExist_PersistsCanonicalSteps));
        await SeedCounty(db, BentonCountyId);

        var realCertSvc = new CertificationService(db, NullLogger<CertificationService>.Instance);
        var controller = CreateDaisController(db, certificationSvc: realCertSvc);

        var result = await controller.GetCertificationStatus("Benton", 2029);

        result.Should().BeOfType<OkObjectResult>();
        db.CertificationSteps.Should().HaveCount(6);
        db.CertificationSteps.Should().OnlyContain(s => s.CountyId == BentonCountyId && s.TaxYear == 2029);
    }
}
