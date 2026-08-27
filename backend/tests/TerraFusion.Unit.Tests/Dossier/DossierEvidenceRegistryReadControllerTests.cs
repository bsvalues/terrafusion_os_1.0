using System.Data.Common;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Controllers;
using TerraFusion.API.Security;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Unit.Tests.R1Week5;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierEvidenceRegistryReadControllerTests
    : IClassFixture<Cx27PermClaimFactory>
{
  private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");
  private static readonly Guid CountyB = Guid.Parse("22222222-2222-2222-2222-222222222222");
  private readonly Cx27PermClaimFactory _permissionFactory;

  public DossierEvidenceRegistryReadControllerTests(Cx27PermClaimFactory permissionFactory) =>
      _permissionFactory = permissionFactory;

  [Fact]
  public void RouteRequiresAuthenticationAndReadDossierPermission()
  {
    typeof(DossierController).GetCustomAttribute<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
        .Should().NotBeNull();

    var method = typeof(DossierController).GetMethod(nameof(DossierController.GetEvidenceRegistryRead));
    method.Should().NotBeNull();
    method!.GetCustomAttribute<HttpGetAttribute>()!.Template
        .Should().Be("parcels/{parcelId}/evidence/registry");
    method!.GetCustomAttribute<RequiresPermissionAttribute>()!.Policy
        .Should().Be($"{RequiresPermissionAttribute.PolicyPrefix}read:dossier");
  }

  [Fact]
  public async Task ExactRouteUnauthenticatedReturnsUnauthorized()
  {
    using var client = _permissionFactory.CreateClient();

    var response = await client.GetAsync("/api/dossier/parcels/P-100/evidence/registry");

    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  [Fact]
  public async Task ExactRouteWithoutReadDossierPermissionReturnsForbidden()
  {
    using var client = _permissionFactory.CreateClient();
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue(Cx27PermClaimFactory.AuthScheme, "token");
    client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "dossier-registry-user");
    client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", CountyA.ToString("D"));

    var response = await client.GetAsync("/api/dossier/parcels/P-100/evidence/registry");

    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
  }

  [Fact]
  public async Task MissingCountyClaimFailsClosedEvenInDevelopment()
  {
    await using var db = CreateDbContext();
    var controller = CreateController(db, countyId: null, environmentName: "Development");

    var result = await controller.GetEvidenceRegistryRead("P-100");

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Theory]
  [InlineData("not-a-guid")]
  [InlineData("11111111111111111111111111111111")]
  [InlineData("00000000-0000-0000-0000-000000000000")]
  public async Task InvalidOrNonCanonicalCountyClaimFailsClosed(string countyClaim)
  {
    await using var db = CreateDbContext();
    var controller = CreateController(db, countyClaim);

    var result = await controller.GetEvidenceRegistryRead("P-100");

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Theory]
  [InlineData("", 25, 0)]
  [InlineData("bad parcel!", 25, 0)]
  [InlineData("P-100", 0, 0)]
  [InlineData("P-100", 101, 0)]
  [InlineData("P-100", 25, -1)]
  public async Task InvalidSelectorsReturnBadRequest(string parcelId, int limit, int offset)
  {
    await using var db = CreateDbContext();
    var controller = CreateController(db, CountyA.ToString("D"));

    var result = await controller.GetEvidenceRegistryRead(parcelId, limit, offset);

    result.Result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Theory]
  [InlineData(false)]
  [InlineData(true)]
  public async Task UnavailableOrDisabledRuntimeReturnsServiceUnavailableWithoutDatabaseExecution(
      bool includeDisabledConsumer)
  {
    await using var connection = new SqliteConnection("Data Source=:memory:");
    await connection.OpenAsync();
    var interceptor = new RejectingCommandInterceptor();
    var options = new DbContextOptionsBuilder<DataDbContext>()
        .UseSqlite(connection)
        .AddInterceptors(interceptor)
        .Options;
    await using var db = new DataDbContext(
        options,
        Mock.Of<Microsoft.Extensions.Configuration.IConfiguration>());
    var consumer = includeDisabledConsumer ? new DisabledConsumer() : null;
    var controller = CreateController(
        db,
        CountyA.ToString("D"),
        includeConsumer: includeDisabledConsumer,
        consumer: consumer);

    var result = await controller.GetEvidenceRegistryRead("P-100");

    var problem = result.Result.Should().BeOfType<ObjectResult>().Subject;
    problem.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
    interceptor.CommandCount.Should().Be(0);
    if (consumer is not null)
      consumer.CallCount.Should().Be(0);
  }

  [Fact]
  public async Task CanonicalRouteUsesRuntimeConsumerWithExactScopedPage()
  {
    await using var db = CreateDbContext();
    var evidence = Evidence(
        CountyA,
        "P-100",
        "30303030-3030-4030-8030-303030303030",
        "2026-08-01T10:00:00Z");
    db.DossierEvidenceItems.Add(evidence);
    await db.SaveChangesAsync();
    var consumer = new RecordingConsumer();
    var controller = CreateController(
        db,
        CountyA.ToString("D"),
        correlationId: "exact-runtime-trace",
        consumer: consumer);

    var result = await controller.GetEvidenceRegistryRead("P-100");

    var content = result.Result.Should().BeOfType<ContentResult>().Subject;
    content.Content.Should().Be("{\"canonicalRuntime\":true}");
    consumer.CallCount.Should().Be(1);
    consumer.Request!.CountyId.Should().Be(CountyA.ToString("D"));
    consumer.Request.ParcelId.Should().Be("P-100");
    consumer.Request.TraceId.Should().Be("exact-runtime-trace");
    consumer.Total.Should().Be(1);
    consumer.SourcePage.Should().ContainSingle().Which.Id.Should().Be(evidence.Id);
  }

  [Fact]
  public async Task SameCountyReadIsOrderedPagedAndCorrelated()
  {
    await using var db = CreateDbContext();
    var oldest = Evidence(CountyA, "P-100", "33333333-3333-3333-3333-333333333333", "2026-08-01T10:00:00Z");
    var tieLaterId = Evidence(CountyA, "P-100", "55555555-5555-5555-5555-555555555555", "2026-08-02T10:00:00Z");
    var tieEarlierId = Evidence(CountyA, "P-100", "44444444-4444-4444-4444-444444444444", "2026-08-02T10:00:00Z");
    db.DossierEvidenceItems.AddRange(oldest, tieLaterId, tieEarlierId);
    await db.SaveChangesAsync();
    var controller = CreateController(db, CountyA.ToString("D"), correlationId: "corr-dossier-registry");

    var result = await controller.GetEvidenceRegistryRead("P-100", limit: 2, offset: 0);

    var payload = Payload(result);
    payload.Total.Should().Be(3);
    payload.HasMore.Should().BeTrue();
    payload.TraceId.Should().Be("corr-dossier-registry");
    payload.Results.Select(item => item.EvidenceId).Should().Equal(
        tieEarlierId.Id.ToString("D"),
        tieLaterId.Id.ToString("D"));
    var content = result.Result.Should().BeOfType<ContentResult>().Subject.Content;
    content.Should().NotContain("\"documentId\":null");
    content.Should().Contain("2026-08-02T10:00:00.0000000Z");
  }

  [Theory]
  [InlineData(null)]
  [InlineData("invalid trace value")]
  public async Task MissingOrInvalidInboundTraceIsNotFabricated(string? correlationId)
  {
    await using var db = CreateDbContext();
    db.DossierEvidenceItems.Add(Evidence(
        CountyA,
        "P-100",
        "37373737-3737-4373-8373-373737373737",
        "2026-08-01T10:00:00Z"));
    await db.SaveChangesAsync();
    var controller = CreateController(db, CountyA, correlationId: correlationId);

    var payload = Payload(await controller.GetEvidenceRegistryRead("P-100"));

    payload.TraceId.Should().BeNull();
  }

  [Fact]
  public async Task SqliteProviderTimestampIsNormalizedToUtc()
  {
    await using var connection = new SqliteConnection("Data Source=:memory:");
    await connection.OpenAsync();
    var options = new DbContextOptionsBuilder<DataDbContext>()
        .UseSqlite(connection)
        .Options;
    await using var db = new DataDbContext(
        options,
        Mock.Of<Microsoft.Extensions.Configuration.IConfiguration>());
    await db.Database.ExecuteSqlRawAsync("""
        PRAGMA foreign_keys = ON;
        CREATE TABLE "Counties" (
          "Id" TEXT NOT NULL PRIMARY KEY,
          "Name" TEXT NOT NULL,
          "State" TEXT NOT NULL,
          "FipsCode" TEXT NULL,
          "Population" INTEGER NOT NULL,
          "Area" REAL NOT NULL,
          "CreatedAt" TEXT NOT NULL,
          "UpdatedAt" TEXT NOT NULL
        );
        CREATE TABLE "DossierEvidenceItems" (
          "Id" TEXT NOT NULL PRIMARY KEY,
          "ParcelId" TEXT NOT NULL,
          "Title" TEXT NOT NULL,
          "EvidenceType" TEXT NOT NULL,
          "Integrity" TEXT NOT NULL,
          "DocumentId" TEXT NULL,
          "CountyId" TEXT NOT NULL,
          "CreatedBy" TEXT NOT NULL,
          "CreatedAt" TEXT NOT NULL,
          FOREIGN KEY ("CountyId") REFERENCES "Counties" ("Id") ON DELETE CASCADE
        );
        """);
    await db.Database.ExecuteSqlRawAsync("""
        INSERT INTO "Counties" (
          "Id", "Name", "State", "FipsCode", "Population", "Area", "CreatedAt", "UpdatedAt"
        ) VALUES (
          '11111111-1111-1111-1111-111111111111', 'Synthetic', 'WA', '019', 0, 0,
          '2026-08-01T00:00:00.0000000Z', '2026-08-01T00:00:00.0000000Z'
        );
        INSERT INTO "DossierEvidenceItems" (
          "Id", "ParcelId", "Title", "EvidenceType", "Integrity", "DocumentId",
          "CountyId", "CreatedBy", "CreatedAt"
        ) VALUES (
          '38383838-3838-4383-8383-383838383838', 'P-100', 'Synthetic registry evidence',
          'field-inspection', 'verified', NULL, '11111111-1111-1111-1111-111111111111',
          'synthetic-test', '2026-08-01T10:00:00.0000000Z'
        );
        """);
    var persisted = await db.DossierEvidenceItems.AsNoTracking().SingleAsync();
    persisted.CreatedAt.Kind.Should().Be(DateTimeKind.Local);
    var controller = CreateController(db, CountyA.ToString("D"));

    var payload = Payload(await controller.GetEvidenceRegistryRead("P-100"));

    payload.Results.Should().ContainSingle();
    payload.Results[0].CreatedAt.Should().Be(
        new DateTimeOffset(2026, 8, 1, 10, 0, 0, TimeSpan.Zero));
    payload.Results[0].CreatedAt.Offset.Should().Be(TimeSpan.Zero);
    payload.Results[0].CreatedAt.UtcDateTime.Kind.Should().Be(DateTimeKind.Utc);
  }

  [Fact]
  public async Task UnspecifiedTimestampFailsClosedOutsideProvenSqliteNormalization()
  {
    await using var db = CreateDbContext();
    var invalid = Evidence(
        CountyA,
        "P-100",
        "39393939-3939-4393-8393-393939393939",
        "2026-08-01T10:00:00Z");
    invalid.CreatedAt = DateTime.SpecifyKind(invalid.CreatedAt, DateTimeKind.Unspecified);
    db.DossierEvidenceItems.Add(invalid);
    await db.SaveChangesAsync();
    var controller = CreateController(db, CountyA);

    var result = await controller.GetEvidenceRegistryRead("P-100");

    var problem = result.Result.Should().BeOfType<ObjectResult>().Subject;
    problem.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
  }

  [Fact]
  public async Task ForeignOnlyAndNoEvidenceReturnTheSameEmptyShape()
  {
    await using var db = CreateDbContext();
    db.DossierEvidenceItems.Add(Evidence(CountyB, "P-FOREIGN", "66666666-6666-6666-6666-666666666666", "2026-08-01T10:00:00Z"));
    await db.SaveChangesAsync();
    var controller = CreateController(db, CountyA.ToString("D"));

    var foreign = Payload(await controller.GetEvidenceRegistryRead("P-FOREIGN"));
    var absent = Payload(await controller.GetEvidenceRegistryRead("P-ABSENT"));

    foreign.Results.Should().BeEmpty();
    foreign.Total.Should().Be(0);
    foreign.HasMore.Should().BeFalse();
    absent.Results.Should().BeEmpty();
    absent.Total.Should().Be(0);
    absent.HasMore.Should().BeFalse();
  }

  [Fact]
  public async Task FrozenAdapterRejectionReturnsProblem()
  {
    await using var db = CreateDbContext();
    var invalid = Evidence(CountyA, "P-100", "77777777-7777-7777-7777-777777777777", "2026-08-01T10:00:00Z");
    invalid.EvidenceType = "unknown-type";
    db.DossierEvidenceItems.Add(invalid);
    await db.SaveChangesAsync();
    var controller = CreateController(db, CountyA.ToString("D"));

    var result = await controller.GetEvidenceRegistryRead("P-100");

    var problem = result.Result.Should().BeOfType<ObjectResult>().Subject;
    problem.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
    problem.Value.Should().BeOfType<ProblemDetails>();
  }

  private static DossierEvidenceRegistryReadResult Payload(
      ActionResult<DossierEvidenceRegistryReadResult> result)
  {
    var content = result.Result.Should().BeOfType<ContentResult>().Subject;
    content.ContentType.Should().StartWith("application/json");
    return JsonSerializer.Deserialize<DossierEvidenceRegistryReadResult>(
        content.Content!,
        new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
  }

  private static DossierEvidence Evidence(
      Guid countyId,
      string parcelId,
      string evidenceId,
      string createdAt) => new()
  {
    Id = Guid.Parse(evidenceId),
    CountyId = countyId,
    ParcelId = parcelId,
    Title = "Synthetic registry evidence",
    EvidenceType = "field-inspection",
    Integrity = "verified",
    CreatedBy = "synthetic-test",
    CreatedAt = DateTime.Parse(
        createdAt,
        null,
        System.Globalization.DateTimeStyles.AssumeUniversal
            | System.Globalization.DateTimeStyles.AdjustToUniversal),
  };

  private static DataDbContext CreateDbContext()
  {
    var options = new DbContextOptionsBuilder<DataDbContext>()
        .UseInMemoryDatabase($"dossier-registry-{Guid.NewGuid():N}")
        .Options;
    return new DataDbContext(options, Mock.Of<Microsoft.Extensions.Configuration.IConfiguration>());
  }

  private static DossierController CreateController(
      DataDbContext db,
      Guid? countyId,
      string environmentName = "Production",
      string? correlationId = null,
      bool includeConsumer = true,
      IDossierEvidenceRegistryReadConsumer? consumer = null) =>
      CreateController(db, countyId?.ToString("D"), environmentName, correlationId, includeConsumer, consumer);

  private static DossierController CreateController(
      DataDbContext db,
      string? countyClaim,
      string environmentName = "Production",
      string? correlationId = null,
      bool includeConsumer = true,
      IDossierEvidenceRegistryReadConsumer? consumer = null)
  {
    var claims = countyClaim is null
        ? Array.Empty<Claim>()
        : new[] { new Claim("countyId", countyClaim) };
    var context = new DefaultHttpContext
    {
      User = new ClaimsPrincipal(new ClaimsIdentity(claims, "synthetic")),
    };
    if (correlationId is not null)
      context.Request.Headers["X-Correlation-ID"] = correlationId;

    var host = new Mock<IHostEnvironment>();
    host.SetupGet(item => item.EnvironmentName).Returns(environmentName);
    var controller = new DossierController(
        db,
        Mock.Of<ICostForgeService>(),
        NullLogger<DossierController>.Instance,
        host.Object,
        includeConsumer ? consumer ?? new AdapterBackedConsumer() : null)
    {
      ControllerContext = new ControllerContext { HttpContext = context },
    };
    return controller;
  }

  private sealed class AdapterBackedConsumer : IDossierEvidenceRegistryReadConsumer
  {
    public bool IsAvailable => true;

    public Task<DossierEvidenceRegistryReadConsumerResult> ConsumeAsync(
        DossierEvidenceRegistryReadRequest request,
        int total,
        IReadOnlyList<DossierEvidence> sourcePage,
        CancellationToken cancellationToken = default)
    {
      try
      {
        var resultJson = TerraFusion.API.Adapters.DossierEvidenceRegistryReadAdapter.Serialize(
            request,
            total,
            sourcePage);
        return Task.FromResult(DossierEvidenceRegistryReadConsumerResult.Accepted(
            resultJson,
            DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
            DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
            DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
            DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256));
      }
      catch (Exception exception) when (
          exception is ArgumentException or InvalidOperationException or JsonException)
      {
        return Task.FromResult(DossierEvidenceRegistryReadConsumerResult.Failed(
            DossierEvidenceRegistryReadConsumerFailure.InvalidRequest,
            exception.Message));
      }
    }
  }

  private sealed class RecordingConsumer : IDossierEvidenceRegistryReadConsumer
  {
    public bool IsAvailable => true;

    public int CallCount { get; private set; }
    public DossierEvidenceRegistryReadRequest? Request { get; private set; }
    public int Total { get; private set; }
    public IReadOnlyList<DossierEvidence> SourcePage { get; private set; } = [];

    public Task<DossierEvidenceRegistryReadConsumerResult> ConsumeAsync(
        DossierEvidenceRegistryReadRequest request,
        int total,
        IReadOnlyList<DossierEvidence> sourcePage,
        CancellationToken cancellationToken = default)
    {
      CallCount++;
      Request = request;
      Total = total;
      SourcePage = sourcePage;
      return Task.FromResult(DossierEvidenceRegistryReadConsumerResult.Accepted(
          "{\"canonicalRuntime\":true}",
          DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
          DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
          DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
          DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256));
    }
  }

  private sealed class DisabledConsumer : IDossierEvidenceRegistryReadConsumer
  {
    public bool IsAvailable => false;
    public int CallCount { get; private set; }

    public Task<DossierEvidenceRegistryReadConsumerResult> ConsumeAsync(
        DossierEvidenceRegistryReadRequest request,
        int total,
        IReadOnlyList<DossierEvidence> sourcePage,
        CancellationToken cancellationToken = default)
    {
      CallCount++;
      throw new InvalidOperationException("A disabled runtime must not be invoked.");
    }
  }

  private sealed class RejectingCommandInterceptor : DbCommandInterceptor
  {
    public int CommandCount { get; private set; }

    public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default)
    {
      CommandCount++;
      throw new InvalidOperationException("A disabled runtime must not execute a database command.");
    }
  }
}
