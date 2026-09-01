using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.API.Controllers;
using TerraFusion.API.Adapters;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dais;
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
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Unit.Tests.Dais;

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
        ClaimsPrincipal? principal = null,
        IDaisAppealWorkflowConsumer? appealWorkflowConsumer = null)
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
            auditMock.Object,
            appealWorkflowConsumer ?? new ExactContractTestConsumer());

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
    public async Task DaisController_GetAppealWorkflowByParcel_ReturnsExactFrozenContract()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_ReturnsExactFrozenContract));
        var filedAt = new DateTime(2026, 1, 15, 12, 30, 0, DateTimeKind.Utc);
        var appealId = Guid.Parse("11111111-1111-1111-1111-1111111111a1");
        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(service => service.GetByParcelAsync("PARCEL-001", BentonCountyId))
            .ReturnsAsync([
                new Appeal
                {
                    Id = appealId,
                    ParcelId = "PARCEL-001",
                    AppealGround = "MARKET_VALUE",
                    Status = "filed",
                    FiledDate = filedAt,
                    TaxYear = 2026,
                    CountyId = BentonCountyId,
                },
            ]);
        var controller = CreateDaisController(db, appealMock.Object);

        var result = await controller.GetAppealWorkflowByParcel("PARCEL-001");

        var content = result.Should().BeOfType<ContentResult>().Subject;
        content.ContentType.Should().Be("application/json");
        var contract = DeserializeAppealWorkflowResult(content);
        contract.SchemaVersion.Should().Be("1.0.0");
        contract.CountyId.Should().Be(BentonCountyId.ToString("D"));
        contract.TraceId.Should().NotBeNullOrWhiteSpace();
        contract.Appeals.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new DaisAppealWorkflowRecord
            {
                AppealId = appealId.ToString("D"),
                ParcelId = "PARCEL-001",
                TaxYear = 2026,
                Ground = DaisAppealGround.MARKET_VALUE,
                Status = DaisAppealStatus.filed,
                FiledAt = new DateTimeOffset(filedAt),
            });
    }

    [Fact]
    public async Task DaisController_GetAppealWorkflowByParcel_ReturnsExactEmptyContract()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_ReturnsExactEmptyContract));
        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(service => service.GetByParcelAsync("PARCEL-EMPTY", BentonCountyId))
            .ReturnsAsync([]);
        var controller = CreateDaisController(db, appealMock.Object);

        var result = await controller.GetAppealWorkflowByParcel("PARCEL-EMPTY");

        var contract = DeserializeAppealWorkflowResult(result.Should().BeOfType<ContentResult>().Subject);
        contract.CountyId.Should().Be(BentonCountyId.ToString("D"));
        contract.Appeals.Should().BeEmpty();
    }

    [Fact]
    public async Task DaisController_GetAppealWorkflowByParcel_WithoutIdentity_Returns401()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_WithoutIdentity_Returns401));
        var controller = CreateDaisController(
            db,
            principal: new ClaimsPrincipal(new ClaimsIdentity()));

        var result = await controller.GetAppealWorkflowByParcel("PARCEL-001");

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task DaisController_GetAppealWorkflowByParcel_WithoutCountyIdentity_Returns403()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_WithoutCountyIdentity_Returns403));
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("sub", "stage2-test-user")],
            "TestAuth"));
        var controller = CreateDaisController(db, principal: principal);

        var result = await controller.GetAppealWorkflowByParcel("PARCEL-001");

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task DaisController_GetAppealWorkflowByParcel_DoesNotDiscloseSameParcelFromOtherCounty()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_DoesNotDiscloseSameParcelFromOtherCounty));
        var service = new AppealService(db, NullLogger<AppealService>.Instance, new FakeDaisAppealMutationDecisionPort());
        await service.CreateAsync(BentonCountyId,
            new CreateAppealCommand("SHARED-PARCEL", "UNIFORMITY", "Synthetic Benton", 250_000m, 225_000m, 2026),
            "stage2-test-user",
            new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc));
        await service.CreateAsync(OtherCountyId,
            new CreateAppealCommand("SHARED-PARCEL", "MARKET_VALUE", "Synthetic Other", 900_000m, 100_000m, 2026),
            "stage2-other-user",
            new DateTime(2026, 1, 11, 0, 0, 0, DateTimeKind.Utc));
        var controller = CreateDaisController(db, service);

        var result = await controller.GetAppealWorkflowByParcel("SHARED-PARCEL");

        var contract = DeserializeAppealWorkflowResult(result.Should().BeOfType<ContentResult>().Subject);
        contract.Appeals.Should().ContainSingle();
        contract.Appeals[0].Ground.Should().Be(DaisAppealGround.UNIFORMITY);
        contract.Appeals.Should().OnlyContain(appeal => appeal.ParcelId == "SHARED-PARCEL");
    }

    [Fact]
    public async Task DaisController_GetAppealWorkflowByParcel_FailsClosedOnCountyMismatch()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_FailsClosedOnCountyMismatch));
        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(service => service.GetByParcelAsync("PARCEL-001", BentonCountyId))
            .ReturnsAsync([
                new Appeal
                {
                    Id = Guid.NewGuid(),
                    ParcelId = "PARCEL-001",
                    AppealGround = "MARKET_VALUE",
                    Status = "filed",
                    FiledDate = DateTime.UtcNow,
                    TaxYear = 2026,
                    CountyId = OtherCountyId,
                },
            ]);
        var controller = CreateDaisController(db, appealMock.Object);

        var result = await controller.GetAppealWorkflowByParcel("PARCEL-001");

        var problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        problem.Value.Should().BeOfType<ProblemDetails>();
    }

    [TerraFusion.Unit.Tests.Dais.ExactDaisAppealWorkflowHostFact]
    public async Task DaisController_GetAppealWorkflowByParcel_UsesExactStagedRuntimeEndToEnd()
    {
        var modulePath = Path.GetFullPath(
            Environment.GetEnvironmentVariable("TERRAFUSION_DAIS_HOST_MODULE_PATH")!);
        var schemaPath = Path.GetFullPath(
            Environment.GetEnvironmentVariable("TERRAFUSION_DAIS_HOST_SCHEMA_PATH")!);
        var artifactSlot = Directory.GetParent(modulePath)!.FullName;
        var sovereignRoot = Directory.GetParent(
            Directory.GetParent(
                Directory.GetParent(
                    Directory.GetParent(artifactSlot)!.FullName)!.FullName)!.FullName)!.FullName;
        var verifier = new DaisAppealWorkflowArtifactVerifier(sovereignRoot);
        var verified = verifier.Verify();
        verified.ModulePath.Should().Be(modulePath);
        verified.SchemaPath.Should().Be(schemaPath);

        var options = new DaisAppealWorkflowOptions
        {
            Mode = DaisAppealWorkflowMode.LocalExact,
            ModulePath = modulePath,
            SchemaPath = schemaPath,
            NodeExecutablePath = FindNodeExecutable(),
            TimeoutSeconds = 30,
        };
        var processHost = new DaisAppealWorkflowProcessHost(options.NodeExecutablePath);
        var verifiedHost = new DaisAppealWorkflowVerifiedProcessHost(processHost, verifier);
        var consumer = new DaisAppealWorkflowConsumer(verifiedHost, Options.Create(options));

        await using var db = CreateDbContext(
            nameof(DaisController_GetAppealWorkflowByParcel_UsesExactStagedRuntimeEndToEnd));
        var appealId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(service => service.GetByParcelAsync("PARCEL-EXACT", BentonCountyId))
            .ReturnsAsync([
                new Appeal
                {
                    Id = appealId,
                    ParcelId = "PARCEL-EXACT",
                    TaxYear = 2026,
                    AppealGround = "MARKET_VALUE",
                    Status = "filed",
                    FiledDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                    CountyId = BentonCountyId,
                },
            ]);
        var controller = CreateDaisController(
            db,
            appealMock.Object,
            appealWorkflowConsumer: consumer);

        var response = await controller.GetAppealWorkflowByParcel("PARCEL-EXACT");

        var content = response.Should().BeOfType<ContentResult>().Subject;
        var contract = DeserializeAppealWorkflowResult(content);
        contract.CountyId.Should().Be(BentonCountyId.ToString("D"));
        contract.Appeals.Should().ContainSingle().Which.AppealId.Should().Be(appealId.ToString("D"));
    }

    [TerraFusion.Unit.Tests.Dais.ExactDaisAppealMutationAndWorkflowHostFact]
    public async Task DaisController_ExactStagedMutationRuntime_CreatesTransitionsPersistsSqlite_AndReadsThroughWorkflowConsumer()
    {
        var mutationModule = Path.GetFullPath(Environment.GetEnvironmentVariable(
            "TERRAFUSION_DAIS_MUTATION_HOST_MODULE_PATH")!);
        var mutationSchema = Path.GetFullPath(Environment.GetEnvironmentVariable(
            "TERRAFUSION_DAIS_MUTATION_HOST_SCHEMA_PATH")!);
        var mutationRoot = SovereignRootFromArtifact(mutationModule);
        var mutationVerifier = new DaisAppealWorkflowArtifactVerifier(
            mutationRoot,
            DaisAppealMutationArtifactExpectation.Canonical);
        var mutationArtifact = mutationVerifier.Verify();
        var mutationOptions = new DaisAppealMutationOptions
        {
            Mode = DaisAppealMutationMode.LocalExact,
            ModulePath = mutationArtifact.ModulePath,
            SchemaPath = mutationArtifact.SchemaPath,
            NodeExecutablePath = FindNodeExecutable(),
            TimeoutSeconds = 30,
        };
        var mutationHost = new DaisAppealMutationVerifiedProcessHost(
            new DaisAppealMutationProcessHost(mutationOptions.NodeExecutablePath),
            mutationVerifier);
        var mutationPort = new DaisAppealMutationDecisionPort(
            mutationHost,
            Options.Create(mutationOptions));

        var workflowModule = Path.GetFullPath(Environment.GetEnvironmentVariable(
            "TERRAFUSION_DAIS_HOST_MODULE_PATH")!);
        var workflowSchema = Path.GetFullPath(Environment.GetEnvironmentVariable(
            "TERRAFUSION_DAIS_HOST_SCHEMA_PATH")!);
        var workflowVerifier = new DaisAppealWorkflowArtifactVerifier(
            SovereignRootFromArtifact(workflowModule));
        var workflowArtifact = workflowVerifier.Verify();
        var workflowOptions = new DaisAppealWorkflowOptions
        {
            Mode = DaisAppealWorkflowMode.LocalExact,
            ModulePath = workflowArtifact.ModulePath,
            SchemaPath = workflowArtifact.SchemaPath,
            NodeExecutablePath = FindNodeExecutable(),
            TimeoutSeconds = 30,
        };
        var workflowConsumer = new DaisAppealWorkflowConsumer(
            new DaisAppealWorkflowVerifiedProcessHost(
                new DaisAppealWorkflowProcessHost(workflowOptions.NodeExecutablePath),
                workflowVerifier),
            Options.Create(workflowOptions));

        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var dbOptions = new DbContextOptionsBuilder<DataDbContext>().UseSqlite(connection).Options;
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:" })
            .Build();
        await using var db = new DataDbContext(dbOptions, config);
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE "Counties" (
              "Id" TEXT NOT NULL CONSTRAINT "PK_Counties" PRIMARY KEY,
              "Name" TEXT NOT NULL, "State" TEXT NOT NULL, "FipsCode" TEXT NULL,
              "Population" INTEGER NOT NULL, "Area" REAL NOT NULL,
              "CreatedAt" TEXT NOT NULL, "UpdatedAt" TEXT NOT NULL
            );
            CREATE TABLE "Appeals" (
              "Id" TEXT NOT NULL CONSTRAINT "PK_Appeals" PRIMARY KEY,
              "ParcelId" TEXT NOT NULL, "AppealGround" TEXT NOT NULL, "Status" TEXT NOT NULL,
              "PetitionerName" TEXT NULL, "FiledDate" TEXT NOT NULL, "HearingDate" TEXT NULL,
              "DecisionDate" TEXT NULL, "CurrentValue" TEXT NOT NULL, "RequestedValue" TEXT NOT NULL,
              "DecidedValue" TEXT NULL, "DecisionNotes" TEXT NULL, "TaxYear" INTEGER NOT NULL,
              "CountyId" TEXT NOT NULL, "CreatedBy" TEXT NULL, "UpdatedBy" TEXT NULL,
              "CreatedAt" TEXT NOT NULL, "UpdatedAt" TEXT NOT NULL,
              CONSTRAINT "FK_Appeals_Counties_CountyId" FOREIGN KEY ("CountyId") REFERENCES "Counties" ("Id")
            );
            CREATE TABLE "AuditLogs" (
              "Id" TEXT NOT NULL CONSTRAINT "PK_AuditLogs" PRIMARY KEY,
              "Type" TEXT NOT NULL, "Data" TEXT NULL, "Timestamp" TEXT NOT NULL,
              "UserId" TEXT NULL, "UserEmail" TEXT NULL, "IpAddress" TEXT NULL,
              "UserAgent" TEXT NULL, "RequestPath" TEXT NULL, "RequestMethod" TEXT NULL,
              "CorrelationId" TEXT NULL, "ResponseStatusCode" INTEGER NULL, "DurationMs" INTEGER NULL,
              "MachineName" TEXT NULL, "ProcessId" INTEGER NULL, "Severity" TEXT NULL, "Source" TEXT NULL
            );
            """);
        await SeedCounty(db, BentonCountyId);
        var service = new AppealService(db, NullLogger<AppealService>.Instance, mutationPort);
        var controller = CreateDaisController(db, service, appealWorkflowConsumer: workflowConsumer);

        var create = await controller.CreateAppeal(new DaisController.CreateAppealRequest(
            "DAIS-EXACT-SQLITE", "MARKET_VALUE", "Synthetic Person", 500_000m, 450_000m, 2026));
        var appeal = create.Should().BeOfType<CreatedAtActionResult>().Subject.Value
            .Should().BeOfType<Appeal>().Subject;
        (await controller.UpdateAppealStatus(
            appeal.Id, new DaisController.UpdateAppealStatusRequest("heard", null, null)))
            .Should().BeOfType<OkObjectResult>();
        (await controller.UpdateAppealStatus(
            appeal.Id, new DaisController.UpdateAppealStatusRequest("decided", "Synthetic decision", 455_000m)))
            .Should().BeOfType<OkObjectResult>();
        db.ChangeTracker.Clear();

        var response = await controller.GetAppealWorkflowByParcel("DAIS-EXACT-SQLITE");
        var contract = DeserializeAppealWorkflowResult(response.Should().BeOfType<ContentResult>().Subject);
        contract.Appeals.Should().ContainSingle().Which.Status.Should().Be(DaisAppealStatus.decided);
        (await db.Appeals.AsNoTracking().SingleAsync(a => a.Id == appeal.Id)).DecidedValue
            .Should().Be(455_000m);
    }

    [Fact]
    public async Task DaisController_UpdateAppealStatus_ConcurrentMutationReturns409()
    {
        await using var db = CreateDbContext(
            nameof(DaisController_UpdateAppealStatus_ConcurrentMutationReturns409));
        var appealId = Guid.NewGuid();
        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(service => service.UpdateStatusAsync(
                appealId,
                "decided",
                BentonCountyId,
                "Synthetic decision",
                455_000m,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DaisAppealMutationConflictException(
                appealId,
                BentonCountyId,
                new DbUpdateConcurrencyException("Synthetic stale lifecycle snapshot.")));
        var controller = CreateDaisController(db, appealMock.Object);

        var result = await controller.UpdateAppealStatus(
            appealId,
            new DaisController.UpdateAppealStatusRequest(
                "decided",
                "Synthetic decision",
                455_000m));

        var problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        problem.Value.Should().BeOfType<ProblemDetails>()
            .Which.Type.Should().Be(
                "https://terrafusion.gov/problems/dais-appeal-mutation-conflict");
    }

    [TerraFusion.Unit.Tests.Dais.ExactDaisAppealMutationAndWorkflowHostFact]
    public async Task DaisMutation_ManifestModuleOrSchemaTamper_FailsBeforeAppealSave()
    {
        var sourceModule = Path.GetFullPath(Environment.GetEnvironmentVariable(
            "TERRAFUSION_DAIS_MUTATION_HOST_MODULE_PATH")!);
        var sourceSlot = Directory.GetParent(sourceModule)!.FullName;
        foreach (var tamperedFile in new[]
        {
            "manifest.json",
            DaisAppealMutationOptions.ExpectedModuleFilename,
            DaisAppealMutationOptions.ExpectedSchemaFilename,
        })
        {
            var root = Path.Combine(Path.GetTempPath(), "tf-dais-mutation-presave", Guid.NewGuid().ToString("N"));
            var slot = Path.Combine(root, DaisAppealMutationOptions.ArtifactSlotRelativePath);
            Directory.CreateDirectory(slot);
            try
            {
                foreach (var file in Directory.GetFiles(sourceSlot))
                    File.Copy(file, Path.Combine(slot, Path.GetFileName(file)));
                await File.AppendAllTextAsync(Path.Combine(slot, tamperedFile), "\nsynthetic-tamper");
                var verifier = new DaisAppealWorkflowArtifactVerifier(
                    root,
                    DaisAppealMutationArtifactExpectation.Canonical);
                var options = new DaisAppealMutationOptions
                {
                    Mode = DaisAppealMutationMode.LocalExact,
                    ModulePath = Path.Combine(slot, DaisAppealMutationOptions.ExpectedModuleFilename),
                    SchemaPath = Path.Combine(slot, DaisAppealMutationOptions.ExpectedSchemaFilename),
                    NodeExecutablePath = FindNodeExecutable(),
                };
                var port = new DaisAppealMutationDecisionPort(
                    new DaisAppealMutationVerifiedProcessHost(
                        new DaisAppealMutationProcessHost(options.NodeExecutablePath), verifier),
                    Options.Create(options));
                await using var db = CreateDbContext($"tamper-{tamperedFile}-{Guid.NewGuid():N}");
                await SeedCounty(db, BentonCountyId);
                var service = new AppealService(db, NullLogger<AppealService>.Instance, port);

                var act = () => service.CreateAsync(
                    BentonCountyId,
                    new CreateAppealCommand("TAMPER-NO-SAVE", "MARKET_VALUE", null, 1m, 1m, 2026));

                await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
                (await db.Appeals.ToListAsync()).Should().BeEmpty(tamperedFile);
            }
            finally
            {
                Directory.Delete(root, recursive: true);
            }
        }
    }

    private static string SovereignRootFromArtifact(string modulePath)
    {
        var artifactSlot = Directory.GetParent(modulePath)!.FullName;
        return Directory.GetParent(Directory.GetParent(Directory.GetParent(
            Directory.GetParent(artifactSlot)!.FullName)!.FullName)!.FullName)!.FullName;
    }

    [Fact]
    public async Task DaisController_GetAppealWorkflowByParcel_DisabledRuntimeReturns503()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_DisabledRuntimeReturns503));
        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(service => service.GetByParcelAsync("PARCEL-001", BentonCountyId))
            .ReturnsAsync([]);
        var consumer = new Mock<IDaisAppealWorkflowConsumer>();
        consumer.Setup(service => service.ConsumeAsync(
                It.IsAny<DaisAppealWorkflowReadRequest>(),
                It.IsAny<IReadOnlyList<Appeal>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.Disabled,
                "disabled"));
        var controller = CreateDaisController(
            db,
            appealMock.Object,
            appealWorkflowConsumer: consumer.Object);

        var result = await controller.GetAppealWorkflowByParcel("PARCEL-001");

        var problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public async Task DaisController_GetAppealWorkflowByParcel_RuntimeFailureReturns500()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppealWorkflowByParcel_RuntimeFailureReturns500));
        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(service => service.GetByParcelAsync("PARCEL-001", BentonCountyId))
            .ReturnsAsync([]);
        var consumer = new Mock<IDaisAppealWorkflowConsumer>();
        consumer.Setup(service => service.ConsumeAsync(
                It.IsAny<DaisAppealWorkflowReadRequest>(),
                It.IsAny<IReadOnlyList<Appeal>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.RuntimeFailed,
                "failed"));
        var controller = CreateDaisController(
            db,
            appealMock.Object,
            appealWorkflowConsumer: consumer.Object);

        var result = await controller.GetAppealWorkflowByParcel("PARCEL-001");

        var problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
    }

    private static DaisAppealWorkflowReadResult DeserializeAppealWorkflowResult(ContentResult content)
    {
        content.Content.Should().NotBeNullOrWhiteSpace();
        return JsonSerializer.Deserialize<DaisAppealWorkflowReadResult>(
            content.Content!,
            new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
    }

    private static string FindNodeExecutable()
    {
        var output = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "node",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            Arguments = "-p process.execPath",
        };
        using var process = System.Diagnostics.Process.Start(output)
            ?? throw new InvalidOperationException("Unable to start Node path probe.");
        var path = process.StandardOutput.ReadToEnd().Trim();
        process.WaitForExit();
        if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException("Unable to resolve Node executable.");
        }
        return Path.GetFullPath(path);
    }

    private sealed class ExactContractTestConsumer : IDaisAppealWorkflowConsumer
    {
        public Task<DaisAppealWorkflowConsumerResult> ConsumeAsync(
            DaisAppealWorkflowReadRequest request,
            IReadOnlyList<Appeal> appeals,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var resultJson = DaisAppealWorkflowReadAdapter.Serialize(request, appeals);
                return Task.FromResult(DaisAppealWorkflowConsumerResult.Accepted(
                    resultJson,
                    DaisAppealWorkflowOptions.ExpectedModuleSha256,
                    DaisAppealWorkflowOptions.ExpectedModuleSha256,
                    DaisAppealWorkflowOptions.ExpectedSchemaSha256,
                    DaisAppealWorkflowOptions.ExpectedSchemaSha256));
            }
            catch (Exception exception) when (
                exception is ArgumentException or InvalidOperationException or JsonException)
            {
                return Task.FromResult(DaisAppealWorkflowConsumerResult.Failed(
                    DaisAppealWorkflowConsumerFailure.InvalidRequest,
                    exception.Message));
            }
        }
    }

    [Fact]
    public async Task DaisController_PostAppeal_Returns201Created()
    {
        await using var db = CreateDbContext(nameof(DaisController_PostAppeal_Returns201Created));
        await SeedCounty(db, BentonCountyId);

        // Use the real AppealService so the full end-to-end path is exercised.
        var realAppealSvc = new AppealService(db, NullLogger<AppealService>.Instance, new FakeDaisAppealMutationDecisionPort());
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

    [Fact]
    public async Task DaisController_GetAppeal_ByUnauthorizedCounty_DoesNotLeakRecord()
    {
        await using var db = CreateDbContext(nameof(DaisController_GetAppeal_ByUnauthorizedCounty_DoesNotLeakRecord));
        await SeedCounty(db, BentonCountyId, "Benton", "003");
        await SeedCounty(db, OtherCountyId, "Franklin", "021");

        var svc = new AppealService(db, NullLogger<AppealService>.Instance, new FakeDaisAppealMutationDecisionPort());
        var created = await svc.CreateAsync(BentonCountyId,
            new CreateAppealCommand("12345-000-000", "MARKET_VALUE", "Jane Smith", 450_000m, 400_000m, 2026),
            "stage2-test-user");

        var otherCountyPrincipal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("countyId", OtherCountyId.ToString()),
            new Claim("countyCode", "FRANKLIN"),
            new Claim("sub", "stage2-other-county-user"),
        ], "TestAuth"));

        var controller = CreateDaisController(db, svc, principal: otherCountyPrincipal);

        var result = await controller.GetAppealById(created.Id);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DaisController_PostAppeal_EmitsGovernedAuditTrace()
    {
        await using var db = CreateDbContext(nameof(DaisController_PostAppeal_EmitsGovernedAuditTrace));
        await SeedCounty(db, BentonCountyId);

        var appealMock = new Mock<IAppealService>();
        appealMock.Setup(s => s.CreateAsync(
                BentonCountyId,
                It.IsAny<CreateAppealCommand>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid countyId, CreateAppealCommand cmd, string? createdBy, DateTime? utcNow, CancellationToken _) => new Appeal
            {
                Id = Guid.NewGuid(),
                ParcelId = cmd.ParcelId,
                AppealGround = cmd.AppealGround ?? "MARKET_VALUE",
                PetitionerName = cmd.PetitionerName,
                CurrentValue = cmd.CurrentValue,
                RequestedValue = cmd.RequestedValue,
                TaxYear = cmd.TaxYear,
                CountyId = countyId,
                CreatedBy = createdBy,
                UpdatedBy = createdBy,
                FiledDate = utcNow ?? DateTime.UtcNow,
            });

        var auditMock = new Mock<IGovernedToolAuditService>();
        auditMock.Setup(a => a.LogInvocationAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var userContextMock = new Mock<IRequestUserContextAccessor>();
        userContextMock.Setup(a => a.Current)
            .Returns(new RequestUserContext(true, "stage2-test-user", BentonCountyId.ToString(), Array.Empty<string>()));

        var controller = new DaisController(
            db,
            NullLogger<DaisController>.Instance,
            new Mock<IExemptionService>().Object,
            appealMock.Object,
            new Mock<ICertificationService>().Object,
            new Mock<INoticeService>().Object,
            new Mock<IQueueService>().Object,
            userContextMock.Object,
            auditMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim("countyId", BentonCountyId.ToString()),
                    new Claim("countyCode", "BENTON"),
                    new Claim("sub", "stage2-test-user"),
                ], "TestAuth"))
            }
        };

        var result = await controller.CreateAppeal(new DaisController.CreateAppealRequest(
            ParcelId: "TRACE-123",
            AppealGround: "MARKET_VALUE",
            PetitionerName: "Jane Smith",
            CurrentValue: 450_000m,
            RequestedValue: 400_000m,
            TaxYear: 2026));

        result.Should().BeOfType<CreatedAtActionResult>();
        appealMock.Verify(s => s.CreateAsync(
            BentonCountyId,
            It.Is<CreateAppealCommand>(cmd => cmd.ParcelId == "TRACE-123"),
            It.IsAny<string?>(),
            It.IsAny<DateTime?>(),
            It.IsAny<CancellationToken>()), Times.Once);
        auditMock.Verify(a => a.LogInvocationAsync(
            "file_appeal",
            "TRACE-123",
            It.IsAny<string>(),
            "filed",
            It.IsAny<CancellationToken>()), Times.Once);
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

        var svc = new AppealService(db, NullLogger<AppealService>.Instance, new FakeDaisAppealMutationDecisionPort());

        // Seed one appeal per county for the same tax year.
        await svc.CreateAsync(BentonCountyId,
            new CreateAppealCommand("BENTON-001", "MARKET_VALUE", null, 400_000m, 360_000m, 2026));
        await svc.CreateAsync(OtherCountyId,
            new CreateAppealCommand("FRANKLIN-001", "MARKET_VALUE", null, 200_000m, 180_000m, 2026));

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

        var svc = new AppealService(db, NullLogger<AppealService>.Instance, new FakeDaisAppealMutationDecisionPort());

        // Only seed an appeal for OtherCounty.
        await svc.CreateAsync(OtherCountyId,
            new CreateAppealCommand("YAKIMA-999", "UNIFORMITY", null, 150_000m, 130_000m, 2026));

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
    public async Task GetAllQueueItems_WhenQueueTableExistsAndNoRows_ReturnsOkEmptyList()
    {
        await using var db = CreateDbContext(nameof(GetAllQueueItems_WhenQueueTableExistsAndNoRows_ReturnsOkEmptyList));
        await SeedCounty(db, BentonCountyId);

        var realQueueSvc = new QueueService(db, NullLogger<QueueService>.Instance);
        var controller = CreateDaisController(db, queueSvc: realQueueSvc);

        var result = await controller.GetAllQueueItems(status: null, assignedTo: null, taskType: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var items = ok.Value.Should().BeAssignableTo<IEnumerable<QueueItem>>().Subject;
        items.Should().BeEmpty();
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
